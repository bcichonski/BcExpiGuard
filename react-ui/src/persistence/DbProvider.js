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
        const itemNames = new PouchDB('itemNames')
        const items = new PouchDB('items')
        this.local = {
            users,
            itemNames,
            items
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

    Login(user, token) {
        this.opts.headers.Authorization = 'Bearer ' + token
        this.userId = userFuncs.getId(user)

        const rusers = new PouchDB(`${REMOTE_API_ADDRESS}users`, this.opts)
        const { users } = this.local
        const liveRepl = {
            live: true,
            retry: true,
        }

        const liveReplFiltered = (params) => ({        
                live: true,
                retry: true,
                filter: 'restrict/restrict',
                query_params: { params }
        })

        const remoteUserReplHandler = rusers.replicate.to(users, liveReplFiltered({ users: [this.userId] }))     

        const localUserReplHandler = users.replicate.to(rusers, liveRepl)

        this.remote = {
            users: { users: rusers, localUserReplHandler,  remoteUserReplHandler},
        }

        this.logged = true
    }

    async Logout() {
        if (this.logged) {
            delete this.opts.headers.Authorization;
            delete this.userId;

            if (this.remote?.users?.users) {
                await this.remote.users.users.close()
            }
            if (this.remote?.users?.localUserReplHandler) {
                this.remote.users.localUserReplHandler.cancel()
            }
            if (this.remote?.users?.remoteUserReplHandler) {
                this.remote.users.remoteUserReplHandler.cancel()
            }
        }
        this.logged = false
    }
}

export default DbProvider;