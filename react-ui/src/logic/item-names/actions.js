import types from './types'
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

const loadNames = (payload) => {
    return {
        type: types.LOAD_ITEMNAMES,
        payload
    }
}

export default {
    addItemName,
    loadNames
}