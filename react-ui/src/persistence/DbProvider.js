import PouchDB from 'pouchdb';
import { REMOTE_API_ADDRESS } from '../constants/constants'
import userFuncs from './users'

class DbProvider {
    constructor() {
        this.logged = false;
        this.opts = {
            headers: {}
        }

        const users = new PouchDB('users')
        const item_names = new PouchDB('item_names')
        const items = new PouchDB('items')
        const groups = new PouchDB('groups')
        this.local = {
            users,
            item_names,
            items,
            groups
        }
    }

    async UseUserAsync(isAuth, user, getToken) {
        if (isAuth && user && !this.logged) {
            this.Login(user, await getToken())
        }
        if ((!isAuth || !user) && this.logged) {
            await this.Logout()
        }

        return this;
    }

    UseUser(isAuth, user, getToken) {
        (async () => { await this.UseUserAsync(isAuth, user, getToken) })()
        return this;
    }

    CreateRemoteDb(dbName, filterParams, filterName = 'restrict/restrict') {
        const remoteDb = new PouchDB(`${REMOTE_API_ADDRESS}${dbName}`, this.opts)
        const localDb = this.local[dbName]

        if (!localDb) {
            throw new Error(`Local table ${dbName} not found`)
        }

        const liveRepl = {
            live: true,
            retry: true,
        }

        const liveReplFiltered = {
            live: true,
            retry: true,
            filter: filterName,
            query_params: filterParams
        }

        const remoteUserReplHandler = remoteDb.replicate.to(localDb, liveReplFiltered)
        const localUserReplHandler = localDb.replicate.to(remoteDb, liveRepl)

        return {
            remote_table: remoteDb,
            localReplicationHandler: localUserReplHandler,
            remoteReplicationHandler: remoteUserReplHandler
        }
    }

    Login(user, token) {
        this.opts.headers.Authorization = 'Bearer ' + token
        this.userId = userFuncs.getId(user)
        this.groupId = this.userId

        this.remote = {
            users: this.CreateRemoteDb('users', { user: this.userId }),
            items: this.CreateRemoteDb('items', { groups: [this.groupId] }),
            item_names: this.CreateRemoteDb('item_names', { groups: [this.groupId] }),
            groups: this.CreateRemoteDb('groups', { users: [this.userId] })
        }

        this.logged = true

        userFuncs.add(user)
    }

    async Clear(remoteDbMetadata) {
        if (remoteDbMetadata?.remote_table) {
            await remoteDbMetadata.remote_table.close()
        }
        if (remoteDbMetadata?.localReplicationHandler) {
            remoteDbMetadata.localReplicationHandler.cancel()
        }
        if (remoteDbMetadata?.remoteReplicationHandler) {
            remoteDbMetadata.remoteReplicationHandler.cancel()
        }
    }

    async Logout() {
        try {
            if (this.logged) {
                delete this.opts.headers.Authorization;
                delete this.userId;

                await this.Clear(this.remote.users)
                await this.Clear(this.remote.items)
                await this.Clear(this.remote.itemNames)
                await this.Clear(this.remote.groups)
            }
        } finally {
            this.logged = false
        }

    }
}

export default DbProvider;