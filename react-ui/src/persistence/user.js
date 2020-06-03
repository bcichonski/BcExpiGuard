import { NAMESPACES, createUUID } from '../common/utils'
import { ensureDb } from './validate'
import dbprovider from '../persistence'

const getId = (auth0UserData) => {
    return createUUID(NAMESPACES.UserId, auth0UserData.email);
}

const add = async (auth0UserData) => {
    ensureDb(dbprovider, 'users')

    if(!auth0UserData) {
        throw new Error("No user data to store")
    }

    const id = getId(auth0UserData)
    await dbprovider.local.users.putIfNotExists({_id: id , userEmail : auth0UserData.email})
}

export default { add, getId }