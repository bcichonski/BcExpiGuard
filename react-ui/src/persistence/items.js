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
        if (doc.quantity !== quantity) {
            doc.previous_quantity = doc.quantity
            doc.quantity = quantity
            doc.changed_timestamp = nowISO()
        }
        
        return doc
    }

    await dbprovider.local.items.upsert(id, stateDeltaFunction)
    if (dbprovider?.remote?.items?.remote_table) {
        await dbprovider.remote.items.remote_table.upsert(id, stateDeltaFunction)
    }
    syncMonkey.reset()
}

const update = async (id, item) => {
    const stateDeltaFunction = (doc) => {
        let change = false;

        if (doc.state !== item.state) {
            doc.state = item.state
            change = true
        }

        if (doc.name !== item.name) {
            doc.name = item.name
            change = true
        }

        if (doc.date !== item.date) {
            doc.date = item.date
            change = true
        }

        if (doc.quantity !== item.quantity) {
            doc.previous_quantity = item.previous_quantity
            doc.quantity = item.quantity
            change = true
        }

        if (doc.unit !== item.unit) {
            doc.unit = item.unit
            change = true
        }

        if(change) {
            doc.changed_timestamp = item.changed_timestamp ?? nowISO()
        }
        
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
    return transfromFromPouch(all).filter(it => !!it.date && !!it.nameID)
}

export default { 
    add, 
    getAll, 
    changeState, 
    changeQuantity, 
    update 
}