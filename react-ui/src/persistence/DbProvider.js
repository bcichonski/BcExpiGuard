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

    resetReplication() {
        if(this.inReplication) {
            this.inReplication = false
        }
    }

    setSyncHooks(syncHooks) {
        this.syncHooks = syncHooks
    }

    UseUser(isAuth, user, getToken) {
        (async () => { await this.useUserAsync(isAuth, user, getToken) })()
        return this;
    }

    replicate(dbName) {
        if (this.inReplication) {
            console.log('already in progress')
            return
        }

        this.inReplication = true



        const remoteDb = this.remote[dbName]?.remote_table;
        const remoteFilterParams = this.remote[dbName]?.filter_params;
        const remoteFilterName = this.remote[dbName]?.filter_name;

        const replFiltered = {
            filter: remoteFilterName,
            query_params: remoteFilterParams,
        }

        const localDb = this.local[dbName]
        if (!remoteDb) {
            console.warn(`No remote db ${dbName} found`)
        }
        if (!localDb) {
            console.warn(`No local db ${dbName} found`)
        }

        const self = this
        const promise = new Promise(
            (resolve, reject) => {
                let wasChanges = false
                remoteDb.replicate.to(localDb, replFiltered)
                    .on('change', function (change) {
                        console.log(`XXX remote ${dbName}: change`)
                        wasChanges = true
                    }).on('paused', function (info) {
                        console.log(`XXX remote ${dbName}: paused`)
                    }).on('active', function (info) {
                        console.log(`XXX remote ${dbName}: active`)
                    }).on('error', function (err) {
                        console.log(err)
                        reject(err)
                    }).on('denied', function (err) {
                        console.log(err)
                        reject(err)
                    }).on('complete', function (info) {
                        resolve(wasChanges)
                    })
            }
        ).then((wasChanges) => {
            if (wasChanges) {
                try {
                    this.syncHooks.refreshData(dbName)
                } catch (err) {
                    self.inReplication = false
                    return new Promise((resolve, reject) => reject(err))
                }
            }

            return new Promise((resolve, reject) => {
                localDb.replicate.to(remoteDb)
                    .on('change', function (change) {
                        console.log(`XXX local ${dbName}: change`)
                    }).on('paused', function (info) {
                        console.log(`XXX local ${dbName}: paused`)
                    }).on('active', function (info) {
                        console.log(`XXX local ${dbName}: active`)
                    }).on('error', function (err) {
                        console.log(err)
                        reject(err)
                    }).on('denied', function (err) {
                        console.log(err)
                        reject(err)
                    }).on('complete', function (info) {
                        resolve(wasChanges)
                    })
            })
        }).finally(() => {
            self.inReplication = false
        })

        return promise
    }

    CreateRemoteDb(dbName, filterParams, filterName = 'restrict/restrict') {
        const remoteDb = new PouchDB(`${REMOTE_API_ADDRESS}${dbName}`, this.opts)
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