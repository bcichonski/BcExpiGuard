import { ensureDb, toPouch_id, fromPouch_id } from './validate'
import dbprovider from '../persistence'


const add = async (payload) => {
    ensureDb(dbprovider, 'itemNames')

    if (!payload) {
        throw new Error("No payload data to store")
    }

    await dbprovider.local.users.putIfNotExists(toPouch_id(payload))
}

const getAll = async () => {
    const all = await dbprovider.local.itemNames.allDocs({ include_docs: true });
    all.rows.forEach((r) => fromPouch_id(r))
    return all.rows
}

export default { add, getAll }