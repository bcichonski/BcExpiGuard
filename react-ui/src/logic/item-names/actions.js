import types from './types'

const addItemName = (payload) => ({
    type: types.ITEMNAME_ADD_IF_NOT_EXISTS,
    payload
})

export default {
    addItemName
}