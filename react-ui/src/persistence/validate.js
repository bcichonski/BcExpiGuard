export function ensureDb(dbprovider, dbname) {
    if(!dbprovider) {
        throw new Error("No database provider")
    }
    
    if(!dbprovider.logged) {
        throw new Error("User not authenticated")
    }

    if(!dbprovider.local) {
        throw new Error("Database provider not configured properly")
    }

    if(!dbprovider.local[dbname]) {
        throw new Error(`PouchDB database [${dbname}] not registered`)
    }
}

export default { ensureDb }