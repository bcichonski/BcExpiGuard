import types from './types'
import {format } from 'date-fns'
import { itemActions } from '../item-list'
import { itemNameActions } from '../item-names'
import { NAMESPACES, createUUID, newUUID } from '../../common/utils'

const itemNameChanged = (newName) => ({
    type: types.ITEM_NAME_CHANGED,
    name: newName
})

const itemQuantityChanged = (newQuantity) => ({
    type: types.ITEM_QUANTITY_CHANGED,
    quantity: newQuantity
})

const itemUnitChanged = (newUnit) => ({
    type: types.ITEM_UNIT_CHANGED,
    unit: newUnit
})

const itemExpirationDateChanged = (newDate) => ({
    type: types.ITEM_EXPIRATION_DATE_CHANGED,
    date: format(newDate, 'yyyy-MM-dd')
})

const itemInEdit = (item) => ({
    type: types.ITEM_IN_EDIT_MODE,
    name: item.name,
    date: item.date
})

const itemAbandoned = ({
    type: types.ITEM_DIALOG_INACTIVE
})

const itemInCreation = ({
    type: types.ITEM_DIALOG_ADD
})

const itemToSave = () => (dispatch, getState) => {
    const state = getState()
    let itemData = {
        name : state.itemEditReducer.name,
        date : state.itemEditReducer.date,
        quantity : state.itemEditReducer.quantity,
        unit : state.itemEditReducer.unit
    }
    const id = newUUID()
    const nameid = createUUID(NAMESPACES.ItemName, itemData.name)
    itemData.id = id
    itemData.nameID = nameid
    dispatch(itemNameActions.addItemName({id : nameid, name: itemData.name}))
    dispatch(itemActions.addItem(itemData))
    dispatch({type: types.ITEM_DIALOG_OK})
}

export default {
    itemNameChanged,
    itemUnitChanged,
    itemExpirationDateChanged,
    itemInEdit,
    itemQuantityChanged,
    itemAbandoned,
    itemInCreation,
    itemToSave
}