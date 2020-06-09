import { ensureDb, toPouch_id, transfromFromPouch } from './validate'
import dbprovider from '../persistence'

const add = async (payload) => {
    ensureDb(dbprovider, 'groups')

    if (!payload) {
        throw new Error("No payload data to store")
    }

    payload.userId = dbprovider.userId

    await dbprovider.local.groups.putIfNotExists(toPouch_id(payload))
}

const getAll = async () => {
    const all = await dbprovider.local.groups.allDocs({ include_docs: true });
    return transfromFromPouch(all)
}

export default { add, getAll }