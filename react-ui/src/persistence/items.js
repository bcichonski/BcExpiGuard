import { ensureDb, toPouch_id, transfromFromPouch } from './validate'
import dbprovider from '../persistence'
import syncMonkey from '../common/syncMonkey'
import { nowISO } from '../common/utils'

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
        doc.changed_timestamp = nowISO()
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
        doc.previous_quantity = doc.quantity
        doc.quantity = quantity
        doc.changed_timestamp = nowISO()
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