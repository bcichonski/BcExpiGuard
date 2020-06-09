import { ensureDb, toPouch_id, transfromFromPouch } from './validate'
import dbprovider from '../persistence'

const add = async (payload) => {
    ensureDb(dbprovider, 'items')

    if (!payload) {
        throw new Error("No payload data to store")
    }

    payload.userId = dbprovider.userId
    payload.groupId = dbprovider.userId

    await dbprovider.local.items.putIfNotExists(toPouch_id(payload))
}

const changeState = async (id, newstate) => {
    const stateDeltaFunction = (doc) => {
        doc.state = newstate
        doc.changed_timestamp = new Date()
        return doc
    }

    await dbprovider.local.items.upsert(id, stateDeltaFunction)
}

const changeQuantity = async (id, quantity) => {
    const stateDeltaFunction = (doc) => {
        doc.quantity = quantity
        doc.changed_timestamp = new Date()
        return doc
    }

    await dbprovider.local.items.upsert(id, stateDeltaFunction)
}

const getAll = async () => {
    const all = await dbprovider.local.items.allDocs({ include_docs: true });
    return transfromFromPouch(all)
}

export default { add, getAll, changeState, changeQuantity }