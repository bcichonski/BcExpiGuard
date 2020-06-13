import { ensureDb, toPouch_id, transfromFromPouch } from './validate'
import dbprovider from '../persistence'
import syncMonkey from '../common/syncMonkey'

const add = async (payload) => {
    ensureDb(dbprovider, 'items')

    if (!payload) {
        throw new Error("No payload data to store")
    }

    payload.userId = dbprovider.userId
    payload.groupId = dbprovider.userId

    const pouchPayload = toPouch_id(payload)
    await dbprovider.local.items.putIfNotExists(pouchPayload)
    if (dbprovider?.remote?.items?.remote_table) {
        await dbprovider.remote.items.remote_table.putIfNotExists(pouchPayload)
    }
    syncMonkey.reset()
}

const changeState = async (id, newstate) => {
    const stateDeltaFunction = (doc) => {
        doc.state = newstate
        doc.changed_timestamp = new Date()
        return doc
    }

    await dbprovider.local.items.upsert(id, stateDeltaFunction)
    
    if (dbprovider?.remote?.items?.remote_table) {
        await dbprovider.remote.items.remote_table.upsert(id, stateDeltaFunction)
    }
    syncMonkey.reset()
}

const changeQuantity = async (id, quantity) => {
    const stateDeltaFunction = (doc) => {
        doc.quantity = quantity
        doc.changed_timestamp = new Date()
        return doc
    }

    await dbprovider.local.items.upsert(id, stateDeltaFunction)
    if (dbprovider?.remote?.items?.remote_table) {
        await dbprovider.remote.items.remote_table.upsert(id, stateDeltaFunction)
    }
    syncMonkey.reset()
}

const getAll = async () => {
    const all = await dbprovider.local.items.allDocs({ include_docs: true });
    return transfromFromPouch(all)
}

export default { add, getAll, changeState, changeQuantity }