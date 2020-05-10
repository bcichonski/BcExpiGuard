import types from './types'

const addItem = (itemData) => ({
    type: types.ITEM_ADD,
    data: itemData
})

export default {
    addItem
}