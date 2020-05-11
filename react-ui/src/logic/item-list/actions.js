import types from './types'

const addItem = (itemData) => ({
    type: types.ITEM_ADD,
    data: itemData
})

const updateItem = (id, newQuantity) => ({
    type: types.ITEM_CHANGED,
    payload: { id, value: newQuantity }
})

const undoItemChanges = () => ({
    type: types.ITEM_UNDO
})

export default {
    addItem,
    updateItem,
    undoItemChanges
}