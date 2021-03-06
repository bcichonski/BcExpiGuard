import types from './types'
import { NAMESPACES, createUUID, nowISO } from '../../common/utils'
import dbProvider, { itemNames } from '../../persistence'

const addItemName = (payload) => async (dispatch) => {
    if(!payload.userId) {
        payload.userId = dbProvider.userId
    }

    dispatch(addItemNameInternal(payload))

    await itemNames.add(payload)
}

const addItemNameInternal = (payload) => {
    if(!payload.creation_timestamp) {
        payload.creation_timestamp = nowISO()
    }

    return {
        type: types.ITEMNAME_ADD_IF_NOT_EXISTS,
        payload
    }
}

function createItemName(name) {
    return {
        id : createUUID(NAMESPACES.ItemName, name),
        name
    }
}

export const itemFirstToDo = createItemName('Add more things to the list')

const addDummyName = () => {
    return addItemName(itemFirstToDo)
}

const loadNames = (payload) => {
    return {
        type: types.LOAD_ITEMNAMES,
        payload
    }
}

const refreshNames = (payload) => ({
    type: types.ITEMNAMES_REFRESH,
    payload
})

const preloadNames = (payload) => ({
    type: types.ITEMNAMES_PRELOAD,
    payload
})

export default {
    addItemName,
    loadNames,
    addDummyName,
    refreshNames,
    preloadNames
}