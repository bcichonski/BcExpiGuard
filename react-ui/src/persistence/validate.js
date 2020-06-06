export function ensureDb(dbprovider, dbname, remote) {
    if(!dbprovider) {
        throw new Error("No database provider")
    }
    
    if(remote && !dbprovider.logged) {
        throw new Error("User not authenticated")
    }

    if(!dbprovider.local) {
        throw new Error("Database provider not configured properly")
    }

    if(!dbprovider.local[dbname]) {
        throw new Error(`PouchDB database [${dbname}] not registered`)
    }
}

export function toPouch_id(payload) {
    const clone = Object.assign({}, payload)
    if(!payload) {
        throw new Error("No payload to transfer")
    }

    if(!payload.id) {
        throw new Error("Couldn't find payload id")
    }

    clone._id = payload.id
    delete clone.id
    return clone;
}

export function fromPouch_id(payload) {
    if(!payload) {
        throw new Error("No payload to transfer")
    }

    if(!payload._id) {
        if(payload.id) {
            return payload
        }
        throw new Error("Couldn't find payload id")
    }

    payload.id = payload._id
    delete payload._id
    
    return payload;
}

export default { ensureDb, toPouch_id, fromPouch_id }