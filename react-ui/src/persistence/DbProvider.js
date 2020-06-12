import PouchDB from 'pouchdb';
import { REMOTE_API_ADDRESS } from '../constants/constants'
import userFuncs from './users'

class DbProvider {
    constructor() {
        this.logged = false;
        this.opts = {
            headers: {}
        }

        this.dbSyncState = {}

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

    async useUserAsync(isAuth, user, getToken) {
        if (isAuth && user && !this.logged) {
            this.Login(user, await getToken())
        }
        if ((!isAuth || !user) && this.logged) {
            await this.Logout()
        }

        return this;
    }

    setSyncHooks(syncHooks) {
        this.syncHooks = syncHooks
    }

    UseUser(isAuth, user, getToken) {
        (async () => { await this.useUserAsync(isAuth, user, getToken) })()
        return this;
    }

    handleSyncState() {
        let stateSend = false
        for (const key in this.dbSyncState) {
            if (this.dbSyncState.hasOwnProperty(key)) {
                const element = this.dbSyncState[key];
                if (element === 'error') {
                    this.syncHooks.changeSyncState('error', key)
                    stateSend = true
                } else if (element === 'change') {
                    if (!stateSend) {
                        this.syncHooks.changeSyncState('changed', key)
                        stateSend = true
                    }
                    this.syncHooks.refreshData(key)
                }// else if (element === 'paused') {
                //}
            }
        }
        this.syncHooks.changeSyncState('ok', '')
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
            query_params: filterParams,
            back_off_function: function (delay) {
                let newdelay = delay
                if (delay === 0) {
                    newdelay = 1000;
                } else {
                    newdelay *= 3
                }
                console.log(`Backoff! ${delay} to ${newdelay}`)
                return newdelay;
            }
        }

        const self = this;
        const remoteUserReplHandler = remoteDb.replicate.to(localDb, liveReplFiltered)
            .on('change', function (change) {
                console.log(`XXX remote ${dbName}: change`)
                self.dbSyncState[dbName + '-remote'] = 'change'
                self.handleSyncState()
            }).on('paused', function (info) {
                console.log(`XXX remote ${dbName}: paused`)
                self.dbSyncState[dbName + '-remote'] = 'paused'
                self.handleSyncState()
            }).on('active', function (info) {
                console.log(`XXX remote ${dbName}: active`)
                self.dbSyncState[dbName + '-remote'] = 'active'
                self.handleSyncState()
            }).on('error', function (err) {
                console.log(`XXX remote ${dbName}: error`)
                self.dbSyncState[dbName + '-remote'] = 'error'
                self.handleSyncState()
            })
        const localUserReplHandler = localDb.replicate.to(remoteDb, liveRepl)
            .on('change', function (change) {
                console.log(`XXX local ${dbName}: change`)
                self.dbSyncState[dbName + '-local'] = 'change'
                self.handleSyncState()
            }).on('paused', function (info) {
                console.log(`XXX local ${dbName}: paused`)
                self.dbSyncState[dbName + '-local'] = 'paused'
                self.handleSyncState()
            }).on('active', function (info) {
                console.log(`XXX local ${dbName}: active`)
                self.dbSyncState[dbName + '-local'] = 'active'
                self.handleSyncState()
            }).on('error', function (err) {
                console.log(`XXX local ${dbName}: error`)
                self.dbSyncState[dbName + '-local'] = 'error'
                self.handleSyncState()
            })

        this.remotes++;

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

        this.remotes = 0
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