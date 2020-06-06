import types from './types'
import { NAMESPACES, createUUID } from '../../common/utils'
import { itemNames } from '../../persistence'

const addItemName = (payload) => async (dispatch) => {
    dispatch(addItemNameInternal(payload))

    await itemNames.add(payload)
}

const addItemNameInternal = (payload) => {
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

export default {
    addItemName,
    loadNames,
    addDummyName
}