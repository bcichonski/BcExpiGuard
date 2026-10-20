import logger from '../common/logger'

// Only these DBs are replicated (D2); the order matches the old poller (names before items).
export const SYNCED_DBS = ['item_names', 'items']

export const MIN_BACK_OFF_MS = 1000
export const MAX_BACK_OFF_MS = 5 * 60 * 1000
const MAX_JITTER_MS = 250

const STATE_RANK = { ok: 0, changed: 1, error: 2 }
const DIRECTIONS = ['pull', 'push']

// PouchDB `back_off_function`: receives the previous delay (0 on the first retry) and returns the next one.
// Starts at ~1 s, doubles, and never exceeds 5 min; a small jitter spreads retries of several devices.
export function backOff(previousMs) {
    const jitter = Math.floor(Math.random() * MAX_JITTER_MS)
    if (!previousMs) {
        return MIN_BACK_OFF_MS + jitter
    }
    return Math.min(MAX_BACK_OFF_MS, previousMs * 2 + jitter)
}

// One live, retrying PouchDB sync per DB. PouchDB 9 merges `pull`/`push` into the options of that direction
// only, so the remote filter is applied to the pull and the push stays unfiltered.
export function startPouchSync(localDb, remote) {
    return localDb.sync(remote.remote_table, {
        live: true,
        retry: true,
        back_off_function: backOff,
        pull: {
            filter: remote.filter_name,
            query_params: remote.filter_params,
        },
    })
}

// Keeps `items` and `item_names` continuously in sync and reports a single, global sync state.
// `start` / `stop` are idempotent. After `stop` no hook is called, even for events of cancelled handles.
export default class LiveSync {
    constructor({ startSync = startPouchSync, win = globalThis.window, doc = globalThis.document } = {}) {
        this.startSync = startSync
        this.win = win
        this.doc = doc
        this.running = false
        this.entries = {}
        this.hooks = {}
        this.offline = false
        this.lastState = undefined

        this.onOnline = () => {
            if (!this.running) {
                return
            }
            this.offline = false
            this.restartStopped()
            this.emitState()
        }
        this.onOffline = () => {
            if (!this.running) {
                return
            }
            this.offline = true
            this.emitState()
        }
        this.onVisibilityChange = () => {
            if (this.running && this.doc?.visibilityState === 'visible') {
                this.restartStopped()
            }
        }
    }

    // databases: { [dbName]: { local, remote } } where remote is DbProvider's remote metadata.
    // hooks: { changeSyncState(state), refreshData(dbName) }.
    start(databases, hooks = {}) {
        if (this.running) {
            return
        }
        this.running = true
        this.hooks = hooks
        this.entries = {}
        this.lastState = undefined
        this.offline = this.win?.navigator?.onLine === false

        this.win?.addEventListener('online', this.onOnline)
        this.win?.addEventListener('offline', this.onOffline)
        this.doc?.addEventListener('visibilitychange', this.onVisibilityChange)

        for (const dbName of SYNCED_DBS) {
            const db = databases?.[dbName]
            if (!db?.local || !db?.remote?.remote_table) {
                logger.warn(`Live sync: no local or remote db ${dbName}`)
                continue
            }
            this.entries[dbName] = { dbName, local: db.local, remote: db.remote }
            this.startEntry(this.entries[dbName])
        }
        this.emitState()
    }

    stop() {
        if (!this.running) {
            return
        }
        this.running = false

        this.win?.removeEventListener('online', this.onOnline)
        this.win?.removeEventListener('offline', this.onOffline)
        this.doc?.removeEventListener('visibilitychange', this.onVisibilityChange)

        for (const entry of Object.values(this.entries)) {
            entry.stopped = true
            entry.handle?.cancel()
        }
        this.entries = {}
        this.hooks = {}
    }

    isRunning() {
        return this.running
    }

    restartStopped() {
        for (const entry of Object.values(this.entries)) {
            if (entry.stopped) {
                logger.debug(`Live sync ${entry.dbName}: restarting`)
                this.startEntry(entry)
            }
        }
    }

    startEntry(entry) {
        entry.handle?.cancel()
        entry.stopped = false
        entry.states = { pull: 'ok', push: 'ok' }

        let handle
        try {
            handle = this.startSync(entry.local, entry.remote)
        } catch (err) {
            logger.warn(`Live sync ${entry.dbName}: failed to start`, err)
            entry.handle = undefined
            entry.stopped = true
            entry.states.pull = 'error'
            return
        }
        entry.handle = handle

        // Events of a handle that was replaced, or that arrive after stop, are ignored.
        const isCurrent = () => this.running && this.entries[entry.dbName] === entry && entry.handle === handle

        const setState = (direction, state) => {
            entry.states[direction] = state
            this.emitState()
        }

        // The Sync object's own `paused` drops the error argument, so both directions are observed directly.
        for (const direction of DIRECTIONS) {
            const replication = handle[direction]
            replication?.on('paused', (err) => {
                if (!isCurrent()) {
                    return
                }
                if (err) {
                    logger.warn(`Live sync ${entry.dbName} ${direction}: paused with error`, err)
                }
                setState(direction, err ? 'error' : 'ok')
            })
            replication?.on('denied', (err) => {
                if (!isCurrent()) {
                    return
                }
                logger.warn(`Live sync ${entry.dbName} ${direction}: denied`, err)
                setState(direction, 'error')
            })
            replication?.on('active', () => {
                // No state change on `active`: it would make the icon flicker.
                logger.debug(`Live sync ${entry.dbName} ${direction}: active`)
            })
        }
        handle.pull?.on('change', (change) => {
            if (!isCurrent() || !change?.docs?.length) {
                return
            }
            logger.debug(`Live sync ${entry.dbName}: pulled ${change.docs.length} doc(s)`)
            setState('pull', 'changed')
            this.callHook('refreshData', entry.dbName)
        })

        // A live sync completes only when cancelled (or when one side is destroyed); either way it is stopped.
        handle.on('complete', () => {
            if (isCurrent()) {
                entry.stopped = true
            }
        })
        // Always listened to: an `error` event without a listener would throw.
        handle.on('error', (err) => {
            if (!isCurrent()) {
                return
            }
            logger.warn(`Live sync ${entry.dbName}: stopped with error`, err)
            entry.stopped = true
            setState('pull', 'error')
        })
    }

    // Global state: `disabled` while offline; otherwise error > changed > ok over every DB and direction.
    currentState() {
        if (this.offline) {
            return 'disabled'
        }
        let state = 'ok'
        for (const entry of Object.values(this.entries)) {
            for (const direction of DIRECTIONS) {
                const candidate = entry.states?.[direction] ?? 'ok'
                if (STATE_RANK[candidate] > STATE_RANK[state]) {
                    state = candidate
                }
            }
        }
        return state
    }

    emitState() {
        if (!this.running) {
            return
        }
        const state = this.currentState()
        if (state === this.lastState) {
            return
        }
        this.lastState = state
        this.callHook('changeSyncState', state)
    }

    callHook(name, ...args) {
        const fail = (err) => logger.warn(`Live sync: ${name} hook failed`, err)
        try {
            // A hook may dispatch a thunk; its rejection must not become an unhandled rejection.
            const result = this.hooks?.[name]?.(...args)
            if (typeof result?.catch === 'function') {
                result.catch(fail)
            }
        } catch (err) {
            fail(err)
        }
    }
}
