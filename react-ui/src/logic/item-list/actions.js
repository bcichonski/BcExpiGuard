import ADD_ITEM from './types'

const addItem = (itemData) => ({
    type: ADD_ITEM,
    data: itemData
})

export default {
    addItem
}