import types from './types'
import { DATE_FORMAT } from '../../constants/constants'
import { format } from 'date-fns'
import { itemActions } from '../item-list'
import { itemNameActions } from '../item-names'
import { NAMESPACES, createUUID, newUUID } from '../../common/utils'
import { navigate } from '@reach/router'

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

const dateError = ({
    type: types.ITEM_EXPIRATION_DATE_CHANGED,
    error: true
})

const itemExpirationDateChanged = (newDate) => {
    try {
        /*if(newDate === null) {
            return {
                type: types.ITEM_EXPIRATION_DATE_CHANGED,
                date: ''
            }
        }*/
        const dateFormatted = format(newDate, DATE_FORMAT)
        return {
            type: types.ITEM_EXPIRATION_DATE_CHANGED,
            date: dateFormatted,
            error: false
        }
    } catch {
        return dateError
    }
}

const itemStateChanged = (newState) => ({
    type: types.ITEM_STATE_CHANGED,
    payload: newState
})

const itemInEdit = (item) => (dispatch, getState) => {
    const state = getState()
    const name = state.itemNameReducer
                    .find(it => it.id === item.nameID)?.name ?? item.nameID
    item.name = name
    dispatch({
        type: types.ITEM_IN_EDIT_MODE,
        payload: item
    })

    navigate('/item/edit')
}

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
    const date = state.itemEditReducer.date

    let wasError = false
    if (typeof name !== 'string' || name.length === 0) {
        dispatch(itemNameError)
        wasError = true
    }

    if (typeof date !== 'string' || date.length === 0) {
        dispatch(dateError)
        wasError = true
    }

    if (wasError) {
        return
    }

    const nameid = createUUID(NAMESPACES.ItemName, name)
    let itemData = {
        id: state.itemEditReducer.id,
        date,
        quantity: state.itemEditReducer.quantity,
        unit: state.itemEditReducer.unit,
        nameID: nameid
    }

    dispatch(itemNameActions.addItemName({ id: nameid, name }))

    if (state.itemEditReducer.state === types.ITEM_DIALOG_ADD) {
        const id = newUUID()
        itemData.id = id
        dispatch(itemActions.addItem(itemData))
    } else {
        itemData.state = state.itemEditReducer.itemState
        dispatch(itemActions.updateItem(itemData))
    }
    dispatch({ type: types.ITEM_DIALOG_OK })
}

export default {
    itemNameChanged,
    itemUnitChanged,
    itemExpirationDateChanged,
    itemInEdit,
    itemQuantityChanged,
    itemStateChanged,
    itemAbandoned,
    itemInCreation,
    itemToSave
}