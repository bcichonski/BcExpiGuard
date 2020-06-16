import types from './types'
import { format, addDays } from 'date-fns'
import { DATE_FORMAT } from '../../constants/constants'
import defaultCategory from '../categories/reducers'
import { itemFirstToDo } from '../item-names/actions'
import { items } from '../../persistence'

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

const addItem = (itemData) => async (dispatch) => {
    if (!itemData.state) {
        itemData.state = types.ITEM_ACTIVE
    }

    if (!itemData.creation_timestamp) {
        itemData.creation_timestamp = new Date()
    }

    dispatch({
        type: types.ITEM_ADD,
        data: itemData
    })

    await items.add(itemData)
}

const addDummyItem = () => {
    return addItem(
        createData('8dff16a4-d502-4849-a50a-4c2ec38e732c', itemFirstToDo, '', '', daysFromNow(0))
    )
}

function changeItem(item, value) {
    const newItem = Object.assign({}, item);

    if (value === 'cancel' || value === false) return item

    if (value === 'all') {
        value = item.quantity
    }

    if (!item.quantity || typeof item.quantity !== 'string' ||isNaN(item.quantity)) {
        newItem.state = types.ITEM_DONE
        newItem.changed_timestamp = new Date()
        return newItem
    }

    if (item.quantity !== '' && !isNaN(item.quantity)) {
        if (!isNaN(value)) {
            const oldValue = parseFloat(item.quantity)
            const newValue = parseFloat(value)

            if (oldValue < newValue) {
                throw Error("New value cannot be greater than old value")
            }

            newItem.previousQuantity = item.quantity
            newItem.quantity = (newItem.quantity - newValue).toString()

            if (newItem.quantity <= 0) {
                newItem.quantity = '0'
                newItem.state = types.ITEM_DONE
            } else {
                newItem.state = types.ITEM_CHANGED
            }
            newItem.changed_timestamp = new Date()
            return newItem
        }
    }

    newItem.previousQuantity = item.quantity
    newItem.quantity = value
    newItem.state = (value === '' ? types.ITEM_DONE : types.ITEM_CHANGED)
    newItem.changed_timestamp = new Date()
    return newItem
}

const updateItemQuantity = (item, newQuantity) => async (dispatch) => {
    const newItem = changeItem(item, newQuantity)

    dispatch({
        type: types.ITEM_CHANGED,
        payload: { id: item.id, newItem }
    })

    if (item.state !== newItem.quantity) {
        await items.changeState(item.id, newItem.state)
    }

    if (item.quantity !== newItem.quantity) {
        await items.changeQuantity(item.id, newItem.quantity)
    }
}

function undoItemChangesInternal(item) {
    if (item.state === types.ITEM_ACTIVE) return item;
    const newItem = Object.assign({}, item);

    newItem.quantity = item.previousQuantity
    newItem.previousQuantity = ''
    newItem.state = types.ITEM_ACTIVE
    newItem.changed_timestamp = new Date()

    return newItem
}

const undoItemChanges = (id) => async (dispatch, getState) => {
    const item = getState().itemReducer.find((it) => it.id === id)

    if (item) {
        const newItem = undoItemChangesInternal(item)
        dispatch({
            type: types.ITEM_UNDO,
            payload: { id, newItem }
        })

        if (newItem.state !== item.state) {
            await items.changeState(id, newItem.state)
            await items.changeQuantity(id, newItem.quantity)
        }
    }
}

const removeItem = (id) => async (dispatch) => {
    dispatch({
        type: types.ITEM_REMOVED,
        payload: { id }
    })

    await items.changeState(id, types.ITEM_REMOVED)
}

const load = (payload) => ({
    type: types.ITEM_LOAD,
    payload
})

const refresh = (payload) => ({
    type: types.ITEM_REFRESH,
    payload
})

export default {
    addItem,
    updateItemQuantity,
    undoItemChanges,
    removeItem,
    addDummyItem,
    load,
    refresh
}