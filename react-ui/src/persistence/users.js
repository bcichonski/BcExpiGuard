import { NAMESPACES, createUUID } from '../common/utils'
import { ensureDb } from './validate'
import dbprovider from '.'
import { nowISO } from '../common/utils'

const getId = (auth0UserData) => {
    return createUUID(NAMESPACES.UserId, auth0UserData.email);
}

const add = async (auth0UserData) => {
    ensureDb(dbprovider, 'users', true)

    if(!auth0UserData) {
        throw new Error("No user data to store")
    }

    const id = getId(auth0UserData)
    await dbprovider.local.users.putIfNotExists({
        _id: id, 
        userEmail : auth0UserData.email,
        creation_timestamp: nowISO()
    })
}

export default { add, getId }