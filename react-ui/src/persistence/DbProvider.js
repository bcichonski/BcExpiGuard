import PouchDB from 'pouchdb';
import { REMOTE_API_ADDRESS } from '../constants/config'
import userFuncs from './users'
import logger from '../common/logger'
import { createAuthFetch } from './authFetch'
import LiveSync, { SYNCED_DBS } from './liveSync'

class DbProvider {
    constructor() {
        this.logged = false;
        // The current session's token source for remote requests; see createAuthFetch.
        this.session = undefined

        this.liveSync = new LiveSync()

        // Login is async (it awaits the token), and StrictMode runs effects twice, so concurrent
        // useUserAsync calls must share one in-flight login. A logout bumps the generation, which
        // cancels a login still waiting for its token.
        this.pendingLogin = null
        this.authGeneration = 0
        this.teardownPromise = null
    }

    async useUserAsync(isAuth, user, getToken) {
        if (isAuth && user) {
            if (!this.logged && !this.pendingLogin) {
                this.pendingLogin = this.loginWithTokenAsync(user, getToken)
            }
            if (this.pendingLogin) {
                await this.pendingLogin
            }
        } else {
            await this.Logout()
        }

        return this;
    }

    async loginWithTokenAsync(user, getToken) {
        const generation = this.authGeneration
        try {
            // One token up front: a user without a valid Auth0 session never logs in.
            await getToken()
            // Same-named local DBs of a previous session must be fully destroyed before they are reopened.
            if (this.teardownPromise) {
                await this.teardownPromise
            }
            if (generation === this.authGeneration && !this.logged) {
                this.Login(user, getToken)
            }
        } finally {
            if (generation === this.authGeneration) {
                this.pendingLogin = null
            }
        }
    }

    setSyncHooks(syncHooks) {
        this.syncHooks = syncHooks
    }

    UseUser(isAuth, user, getToken) {
        (async () => { await this.useUserAsync(isAuth, user, getToken) })()
        return this;
    }

    // Starts the live sync of the synced DBs (items, item_names); idempotent, and a no-op while logged out.
    startSync() {
        if (!this.logged) {
            return
        }
        const databases = {}
        for (const dbName of SYNCED_DBS) {
            databases[dbName] = { local: this.local[dbName], remote: this.remote[dbName] }
        }
        this.liveSync.start(databases, this.syncHooks)
    }

    CreateRemoteDb(dbName, filterParams, filterName = 'restrict/restrict') {
        // No fixed Authorization header: the fetch wrapper attaches a fresh token per request.
        const remoteDb = new PouchDB(`${REMOTE_API_ADDRESS}${dbName}`, { fetch: this.remoteFetch })
        const localDb = this.local[dbName]

        if (!localDb) {
            throw new Error(`Local table ${dbName} not found`)
        }

        return {
            remote_table: remoteDb,
            filter_params: filterParams,
            filter_name: filterName
        }
    }

    onLogin(fn) {
        this.onLoginFn = fn
    }

    Login(user, getToken) {
        this.session = { getToken }
        this.remoteFetch = createAuthFetch(this.session)
        this.userId = userFuncs.getId(user)
        this.groupId = this.userId

        const users = new PouchDB(`users_${this.userId}`)
        const item_names = new PouchDB(`item_names_${this.userId}`)
        const items = new PouchDB(`items_${this.userId}`)
        const groups = new PouchDB(`groups_${this.userId}`)
        this.local = {
            users,
            item_names,
            items,
            groups
        }

        this.remote = {
            users: this.CreateRemoteDb('users', { user: this.userId }),
            items: this.CreateRemoteDb('items', { groups: [this.groupId] }),
            item_names: this.CreateRemoteDb('item_names', { groups: [this.groupId] }),
            groups: this.CreateRemoteDb('groups', { users: [this.userId] })
        }

        this.logged = true

        userFuncs.add(user)

        this.onLoginFn()
    }

    async Clear(remoteDbMetadata) {
        if (remoteDbMetadata?.remote_table) {
            await remoteDbMetadata.remote_table.close()
        }
    }

    // Runs one teardown step; a failure is logged and never stops the remaining steps.
    async safely(description, fn) {
        try {
            await fn()
        } catch (err) {
            logger.warn(`Logout: failed to ${description}`, err)
        }
    }

    async Logout() {
        // Cancel a login that is still waiting for its token; safe to call repeatedly.
        this.authGeneration++
        this.pendingLogin = null

        if (!this.logged) {
            // A repeated or concurrent logout waits for the teardown already running.
            if (this.teardownPromise) {
                await this.teardownPromise
            }
            return
        }

        // Flip the state and detach the instances before awaiting, so a login started during teardown
        // is not skipped and its new DBs are never touched: only the captured instances are torn down.
        this.logged = false
        // Step 1 of the teardown (stop sync), done synchronously: a login started during the teardown
        // must never have its new sync stopped. No sync hook runs after this.
        this.liveSync.stop()
        const remote = this.remote
        const local = this.local
        // Ends the session: remote requests of this user now fail fast without a token.
        if (this.session) {
            this.session.getToken = null
        }
        this.session = undefined
        this.remoteFetch = undefined
        delete this.userId;
        delete this.groupId;
        this.remote = undefined
        this.local = undefined

        const teardown = this.teardownAsync(remote, local)
        this.teardownPromise = teardown
        try {
            await teardown
        } finally {
            if (this.teardownPromise === teardown) {
                this.teardownPromise = null
            }
        }
    }

    // Order: stop sync (already done by Logout) -> close remotes -> destroy locals (D6).
    async teardownAsync(remote, local) {
        for (const [name, metadata] of Object.entries(remote ?? {})) {
            await this.safely(`close remote ${name}`, () => this.Clear(metadata))
        }
        for (const [name, db] of Object.entries(local ?? {})) {
            await this.safely(`destroy local ${name}`, () => db.destroy())
        }
    }
}

export default DbProvider;
