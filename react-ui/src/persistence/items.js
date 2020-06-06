import { ensureDb, toPouch_id, fromPouch_id } from './validate'
import dbprovider from '../persistence'

const add = async (payload) => {
    ensureDb(dbprovider, 'items')

    if (!payload) {
        throw new Error("No payload data to store")
    }

    await dbprovider.local.items.putIfNotExists(toPouch_id(payload))
}

const getAll = async () => {
    const all = await dbprovider.local.items.allDocs({ include_docs: true });
    let rows = all.rows ?? [all]
    rows = rows.map(r => r.doc ?? r)
    rows.forEach((r) => fromPouch_id(r))
    return rows
}

export default { add, getAll }