import types from './types'
import { format, addDays } from 'date-fns'
import { DATE_FORMAT } from '../../constants/constants'
import defaultCategory from '../categories/reducers'
import { itemFirstToDo } from '../item-names/reducers'

function createData(id, nameItem, quantity, unit, date, state = types.ITEM_ACTIVE) {
    return {
        id,
        categoryID: defaultCategory.id,
        nameID: nameItem.id,
        quantity,
        unit,
        date,
        state,
        creation_timestamp: new Date()
    };
}

function daysFromNow(days) {
    return format(addDays(new Date(), days), DATE_FORMAT)
}

const addItem = (itemData) => ({
    type: types.ITEM_ADD,
    data: itemData
})

const addDummyItem = () => {
    return addItem(
        createData('8dff16a4-d502-4849-a50a-4c2ec38e732c', itemFirstToDo, '', '', daysFromNow(0))
    )
}

const updateItem = (id, newQuantity) => ({
    type: types.ITEM_CHANGED,
    payload: { id, value: newQuantity }
})

const undoItemChanges = (id) => ({
    type: types.ITEM_UNDO,
    payload: { id }
})

const removeItem = (id) => ({
    type: types.ITEM_REMOVED,
    payload: { id }
})

export default {
    addItem,
    updateItem,
    undoItemChanges,
    removeItem,
    addDummyItem
}