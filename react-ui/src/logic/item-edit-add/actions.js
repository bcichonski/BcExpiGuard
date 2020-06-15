import types from './types'
import { format } from 'date-fns'
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

const itemExpirationDateChanged = (newDate) => {
    try {
        if(newDate === null) {
            return {
                type: types.ITEM_EXPIRATION_DATE_CHANGED,
                date: ''
            }
        }
        const dateFormatted = format(newDate, 'yyyy-MM-dd')
        return {
            type: types.ITEM_EXPIRATION_DATE_CHANGED,
            date: dateFormatted
        }
    } catch {
        return {
            type: types.ITEM_EXPIRATION_DATE_CHANGED,
            error: true
        }
    }
}

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

const itemNameError = ({
    type: types.ITEM_NAME_ERROR
})

const itemToSave = () => (dispatch, getState) => {
    const state = getState()
    const name = state.itemEditReducer.name

    if(typeof name !== 'string' || name.length===0) {
        dispatch(itemNameError)
        return
    }

    let itemData = {
        date: state.itemEditReducer.date,
        quantity: state.itemEditReducer.quantity,
        unit: state.itemEditReducer.unit,
    }
    const id = newUUID()
    const nameid = createUUID(NAMESPACES.ItemName, name)
    itemData.id = id
    itemData.nameID = nameid
    dispatch(itemNameActions.addItemName({ id: nameid, name }))
    dispatch(itemActions.addItem(itemData))
    dispatch({ type: types.ITEM_DIALOG_OK })
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