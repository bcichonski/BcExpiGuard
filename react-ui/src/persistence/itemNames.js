import { ensureDb, toPouch_id, transfromFromPouch } from './validate'
import dbprovider from '../persistence'
import syncMonkey from '../common/syncMonkey'

const add = async (payload) => {
    ensureDb(dbprovider, 'item_names')

    if (!payload) {
        throw new Error("No payload data to store")
    }

    payload.userId = dbprovider.userId

    const pouchPayload = toPouch_id(payload)
    await dbprovider.local.item_names.putIfNotExists(pouchPayload)
    if(dbprovider?.remote?.item_names?.remote_table) {
        await dbprovider.remote.item_names.remote_table.putIfNotExists(pouchPayload)
    }
    syncMonkey.reset()
}

const getAll = async () => {
    const all = await dbprovider.local.item_names.allDocs({ include_docs: true });
    return transfromFromPouch(all)
}

export default { add, getAll }