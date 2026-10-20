import { vi } from 'vitest'
import { EventEmitter } from 'events'
import LiveSync, { backOff, startPouchSync, MIN_BACK_OFF_MS, MAX_BACK_OFF_MS } from '../../persistence/liveSync'

// Mirrors the shape of a PouchDB Sync handle: an emitter with `pull` / `push` replication emitters and cancel().
class FakeHandle extends EventEmitter {
    constructor(dbName) {
        super()
        this.dbName = dbName
        this.pull = new EventEmitter()
        this.push = new EventEmitter()
        this.cancel = vi.fn(() => {
            this.canceled = true
        })
    }
}

const remoteMeta = (name) => ({
    remote_table: { name: `remote-${name}` },
    filter_name: 'restrict/restrict',
    filter_params: { groups: ['g1'] },
})

const databases = () => ({
    items: { local: { name: 'items_local' }, remote: remoteMeta('items') },
    item_names: { local: { name: 'item_names_local' }, remote: remoteMeta('item_names') },
})

describe('LiveSync', () => {
    let handles
    let startSync
    let win
    let doc
    let hooks
    let sync

    const handle = (dbName) => handles.filter((h) => h.dbName === dbName).at(-1)
    const states = () => hooks.changeSyncState.mock.calls.map(([state]) => state)

    beforeEach(() => {
        handles = []
        startSync = vi.fn((local) => {
            const h = new FakeHandle(local.name.replace('_local', ''))
            handles.push(h)
            return h
        })
        win = new EventTarget()
        win.navigator = { onLine: true }
        doc = new EventTarget()
        doc.visibilityState = 'visible'
        hooks = { changeSyncState: vi.fn(), refreshData: vi.fn() }
        sync = new LiveSync({ startSync, win, doc })
    })

    afterEach(() => {
        sync.stop()
    })

    describe('start / stop', () => {
        it('starts one handle per synced DB and reports ok', () => {
            sync.start(databases(), hooks)

            expect(startSync).toHaveBeenCalledTimes(2)
            expect(startSync.mock.calls.map(([local]) => local.name).sort()).toEqual(['item_names_local', 'items_local'])
            for (const [local, remote] of startSync.mock.calls) {
                expect(remote.remote_table.name).toBe(`remote-${local.name.replace('_local', '')}`)
            }
            expect(states()).toEqual(['ok'])
            expect(sync.isRunning()).toBe(true)
        })

        it('ignores a second start while running (StrictMode double start)', () => {
            sync.start(databases(), hooks)
            sync.start(databases(), hooks)

            expect(startSync).toHaveBeenCalledTimes(2)
        })

        it('cancels every handle on stop, and a second stop is a no-op', () => {
            sync.start(databases(), hooks)
            sync.stop()
            sync.stop()

            expect(handles).toHaveLength(2)
            for (const h of handles) {
                expect(h.cancel).toHaveBeenCalledTimes(1)
            }
            expect(sync.isRunning()).toBe(false)
        })

        it('can start again after a stop', () => {
            sync.start(databases(), hooks)
            sync.stop()
            sync.start(databases(), hooks)

            expect(startSync).toHaveBeenCalledTimes(4)
        })

        it('starts as disabled when the browser is offline', () => {
            win.navigator.onLine = false
            sync.start(databases(), hooks)

            expect(states()).toEqual(['disabled'])
        })
    })

    describe('event to state mapping', () => {
        beforeEach(() => {
            sync.start(databases(), hooks)
            hooks.changeSyncState.mockClear()
        })

        it('refreshes the DB and reports changed on a pulled change with docs', () => {
            handle('items').pull.emit('change', { docs: [{ _id: 'a' }] })

            expect(hooks.refreshData).toHaveBeenCalledWith('items')
            expect(states()).toEqual(['changed'])
        })

        it('ignores a pulled change without docs and pushed changes', () => {
            handle('items').pull.emit('change', { docs: [] })
            handle('items').push.emit('change', { docs: [{ _id: 'a' }] })

            expect(hooks.refreshData).not.toHaveBeenCalled()
            expect(states()).toEqual([])
        })

        it('reports ok when paused without an error', () => {
            handle('items').pull.emit('change', { docs: [{ _id: 'a' }] })
            handle('items').pull.emit('paused')

            expect(states()).toEqual(['changed', 'ok'])
        })

        it('reports error when paused with an error, on error and on denied', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

            handle('items').push.emit('paused', new Error('offline'))
            expect(states()).toEqual(['error'])
            handle('items').push.emit('paused')
            expect(states()).toEqual(['error', 'ok'])

            handle('item_names').pull.emit('denied', { status: 403 })
            expect(states()).toEqual(['error', 'ok', 'error'])
            handle('item_names').pull.emit('paused')

            handle('items').emit('error', { name: 'unauthorized', status: 401 })
            expect(states()).toEqual(['error', 'ok', 'error', 'ok', 'error'])
            warn.mockRestore()
        })

        it('does not change the state on active', () => {
            handle('items').pull.emit('active')
            handle('items').push.emit('active')

            expect(states()).toEqual([])
        })

        it('is global: error wins over changed, changed wins over ok', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

            handle('items').pull.emit('change', { docs: [{ _id: 'a' }] })
            handle('item_names').push.emit('paused', new Error('offline'))
            // items is still `changed`, item_names is `error`.
            handle('items').pull.emit('change', { docs: [{ _id: 'b' }] })
            expect(states()).toEqual(['changed', 'error'])

            handle('item_names').push.emit('paused')
            expect(states()).toEqual(['changed', 'error', 'changed'])

            handle('items').pull.emit('paused')
            expect(states()).toEqual(['changed', 'error', 'changed', 'ok'])
            warn.mockRestore()
        })

        it('keeps working when a hook throws or rejects', async () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
            hooks.refreshData.mockImplementationOnce(() => { throw new Error('boom') })
            hooks.refreshData.mockImplementationOnce(() => Promise.reject(new Error('async boom')))

            handle('items').pull.emit('change', { docs: [{ _id: 'a' }] })
            handle('item_names').pull.emit('change', { docs: [{ _id: 'b' }] })
            await Promise.resolve()

            expect(hooks.refreshData).toHaveBeenCalledTimes(2)
            expect(warn).toHaveBeenCalledTimes(2)
            warn.mockRestore()
        })
    })

    describe('connectivity triggers', () => {
        beforeEach(() => {
            sync.start(databases(), hooks)
        })

        it('restarts only the stopped handles on online', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
            const itemsHandle = handle('items')
            const namesHandle = handle('item_names')
            itemsHandle.emit('error', new Error('unauthorized'))

            win.dispatchEvent(new Event('online'))

            expect(startSync).toHaveBeenCalledTimes(3)
            expect(handle('items')).not.toBe(itemsHandle)
            expect(handle('item_names')).toBe(namesHandle)
            expect(namesHandle.cancel).not.toHaveBeenCalled()
            warn.mockRestore()
        })

        it('restarts a completed handle when the document becomes visible', () => {
            const namesHandle = handle('item_names')
            namesHandle.emit('complete', {})

            doc.visibilityState = 'hidden'
            doc.dispatchEvent(new Event('visibilitychange'))
            expect(startSync).toHaveBeenCalledTimes(2)

            doc.visibilityState = 'visible'
            doc.dispatchEvent(new Event('visibilitychange'))
            expect(startSync).toHaveBeenCalledTimes(3)
            expect(handle('item_names')).not.toBe(namesHandle)
        })

        it('never restarts a healthy live handle', () => {
            win.dispatchEvent(new Event('online'))
            doc.dispatchEvent(new Event('visibilitychange'))

            expect(startSync).toHaveBeenCalledTimes(2)
        })

        it('reports disabled on offline and clears it on online', () => {
            hooks.changeSyncState.mockClear()

            win.dispatchEvent(new Event('offline'))
            expect(states()).toEqual(['disabled'])

            // While offline, other events do not override `disabled`.
            handle('items').pull.emit('change', { docs: [{ _id: 'a' }] })
            expect(states()).toEqual(['disabled'])

            win.dispatchEvent(new Event('online'))
            expect(states()).toEqual(['disabled', 'changed'])
        })

        it('restarts a new handle reset to ok, ignoring the old handle afterwards', () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
            const oldHandle = handle('items')
            oldHandle.emit('error', new Error('unauthorized'))
            win.dispatchEvent(new Event('online'))
            hooks.changeSyncState.mockClear()

            oldHandle.pull.emit('change', { docs: [{ _id: 'late' }] })
            oldHandle.pull.emit('paused', new Error('late'))

            expect(hooks.refreshData).not.toHaveBeenCalled()
            expect(states()).toEqual([])
            expect(sync.currentState()).toBe('ok')
            warn.mockRestore()
        })
    })

    describe('after stop', () => {
        it('removes every window and document listener', () => {
            const winAdd = vi.spyOn(win, 'addEventListener')
            const winRemove = vi.spyOn(win, 'removeEventListener')
            const docAdd = vi.spyOn(doc, 'addEventListener')
            const docRemove = vi.spyOn(doc, 'removeEventListener')

            sync.start(databases(), hooks)
            sync.stop()

            const pairs = (spy) => spy.mock.calls.map(([type, fn]) => [type, fn])
            expect(pairs(winRemove)).toEqual(pairs(winAdd))
            expect(pairs(docRemove)).toEqual(pairs(docAdd))
            expect(pairs(winAdd).map(([type]) => type).sort()).toEqual(['offline', 'online'])
            expect(pairs(docAdd).map(([type]) => type)).toEqual(['visibilitychange'])

            win.dispatchEvent(new Event('online'))
            win.dispatchEvent(new Event('offline'))
            doc.dispatchEvent(new Event('visibilitychange'))
            expect(startSync).toHaveBeenCalledTimes(2)
        })

        it('calls no hook for events that arrive after stop', () => {
            sync.start(databases(), hooks)
            const itemsHandle = handle('items')
            hooks.changeSyncState.mockClear()
            sync.stop()

            itemsHandle.pull.emit('change', { docs: [{ _id: 'late' }] })
            itemsHandle.pull.emit('paused', new Error('late'))
            itemsHandle.emit('error', new Error('late'))
            itemsHandle.emit('complete', {})

            expect(hooks.refreshData).not.toHaveBeenCalled()
            expect(hooks.changeSyncState).not.toHaveBeenCalled()
        })
    })

    describe('backOff', () => {
        it('starts at about 1 s, grows geometrically and caps at 5 min', () => {
            const first = backOff(0)
            expect(first).toBeGreaterThanOrEqual(MIN_BACK_OFF_MS)
            expect(first).toBeLessThan(MIN_BACK_OFF_MS + 1000)

            const second = backOff(first)
            expect(second).toBeGreaterThanOrEqual(first * 2)

            let delay = 0
            for (let i = 0; i < 30; i++) {
                delay = backOff(delay)
                expect(delay).toBeLessThanOrEqual(MAX_BACK_OFF_MS)
            }
            expect(delay).toBe(MAX_BACK_OFF_MS)
        })
    })

    describe('startPouchSync', () => {
        it('filters the pull only and keeps the push unfiltered', () => {
            const local = { sync: vi.fn(() => 'handle') }
            const remote = remoteMeta('items')

            expect(startPouchSync(local, remote)).toBe('handle')

            const [target, opts] = local.sync.mock.calls[0]
            expect(target).toBe(remote.remote_table)
            expect(opts).toMatchObject({ live: true, retry: true, back_off_function: backOff })
            expect(opts.pull).toEqual({ filter: 'restrict/restrict', query_params: { groups: ['g1'] } })
            expect(opts.filter).toBeUndefined()
            expect(opts.query_params).toBeUndefined()
            expect(opts.push).toBeUndefined()
        })
    })
})
