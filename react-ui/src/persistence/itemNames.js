import { ensureDb, transfromFromPouch } from './validate'
import dbprovider from '../persistence'
import syncMonkey from '../common/syncMonkey'

const add = async (payload) => {
    ensureDb(dbprovider, 'item_names')

    if (!payload) {
        throw new Error("No payload data to store")
    }

    payload.userId = dbprovider.userId

    const namesDeltaFunction = (doc) => {
        if (!doc.name) {
            doc.name = payload.name
        }
        
        if(!doc.userId) {
            doc.userId = payload.userId
        }

        if (!doc._id) {
            doc._id = payload.id
        }

        if (doc._deleted) {
            doc._deleted = false
        }

        return doc
    }

    await dbprovider.local.item_names.upsert(payload.id, namesDeltaFunction)
    if (dbprovider?.remote?.item_names?.remote_table) {
        await dbprovider.remote.item_names.remote_table.upsert(payload.id, namesDeltaFunction)
    }
    syncMonkey.reset()
}

const getAll = async () => {
    const all = await dbprovider.local.item_names.allDocs({ include_docs: true });
    return transfromFromPouch(all)
}

export default { add, getAll }