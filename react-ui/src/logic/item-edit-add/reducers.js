import types from './types'
import { navigate } from "@reach/router"

const itemsAddEditReducer = (state = { state: types.ITEM_DIALOG_INACTIVE, nameError: true }, action) => {
    let newState = {}
    switch (action.type) {
        case types.ITEM_NAME_CHANGED:
            newState = {
                name: action.name,
                nameError: false
            }
            break;
        case types.ITEM_EXPIRATION_DATE_CHANGED:
            newState = {
                dateError: action.error,
                date: action.date
            }
            break;
        case types.ITEM_UNIT_CHANGED:
            newState = {
                unit: action.unit
            }
            break;
        case types.ITEM_QUANTITY_CHANGED:
            newState = {
                quantity: action.quantity
            }
            break;
        case types.ITEM_IN_EDIT_MODE:
            newState = {
                state: types.ITEM_DIALOG_EDIT,
                name: action.name,
                date: action.date
            }
            break;
        case types.ITEM_DIALOG_ADD:
            newState = {
                state: types.ITEM_DIALOG_ADD,
                name: '',
                date: null,
                unit: '',
                quantity: '',
                nameError: true
            }
            navigate('/item/add')
            break;
        case types.ITEM_DIALOG_OK:
        case types.ITEM_DIALOG_INACTIVE:
            newState = {
                state: types.ITEM_DIALOG_INACTIVE
            }
            navigate('/')
            break;
        case types.ITEM_NAME_ERROR:
            newState = {
                nameError: true
            }
            break;
        default:
            return state
    }

    return Object.assign({}, state, newState)
}

export default itemsAddEditReducer;