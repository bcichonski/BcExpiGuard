import types from './types'
import {format } from 'date-fns'

const itemNameChanged = (newName) => ({
    type: types.ITEM_NAME_CHANGED,
    name: newName
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

const itemToSave = ({
    type: types.ITEM_DIALOG_OK
})

export default {
    itemNameChanged,
    itemExpirationDateChanged,
    itemInEdit,
    itemAbandoned,
    itemInCreation,
    itemToSave
}