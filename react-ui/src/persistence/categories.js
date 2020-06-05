import { ensureDb, toPouch_id } from './validate'
import dbprovider from '../persistence'


const add = async (payload) => {
    ensureDb(dbprovider, 'categories')

    if(!payload) {
        throw new Error("No payload data to store")
    }

    await dbprovider.local.users.putIfNotExists(toPouch_id(payload))
}

export default { add }