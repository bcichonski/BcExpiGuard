import PouchDB from 'pouchdb';
import pouchdbDebug from 'pouchdb-debug'
import { REMOTE_API_ADDRESS } from '../constants/constants'

PouchDB.plugin(pouchdbDebug)
PouchDB.debug.enable('*');


class Database {
    constructor() {
        this.logged = false;
        this.opts = {
            headers: {}
        }

        const users = new PouchDB('users')
        this.local = {
            users
        }
    }

    async UseUser(user, getToken) {
        if (user && !this.logged) {
            this.Login(await getToken())
        }
        if (!user && this.logged) {
            await this.Logout()
        }

        return this.local;
    }

    Login(token) {
        this.opts.headers.Authorization = 'Bearer ' + token

        const rusers = new PouchDB(`${REMOTE_API_ADDRESS}users`, this.opts)

        const rUserSyncHandler = this.local.users.sync(rusers, {
            live: true,
            retry: true
        })

        this.remote = {
            users: { users: rusers, syncHandler: rUserSyncHandler},
        }

        this.logged = true
    }

    async Logout() {
        delete this.opts.headers.Authorization;
        if(this.remote?.users?.users) {
            await this.remote.users.users.close()
        }
        if(this.remote?.users?.syncHandler) {
            this.remote.users.syncHandler.cancel()
        }
        this.logged = false
    }
}

const database = new Database()

export default database;

