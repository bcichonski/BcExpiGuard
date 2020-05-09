import types from './types'
import { navigate } from "@reach/router"

const itemsAddEditReducer = (state = { state : types.ITEM_DIALOG_INACTIVE }, action) => {
    let newState = {}
    switch (action.type) {
        case types.ITEM_NAME_CHANGED:
            newState = {
                name : action.name
            }
            break;
        case types.ITEM_EXPIRATION_DATE_CHANGED:
            newState = {
                date : action.date
            }
            break;
        case types.ITEM_IN_EDIT_MODE:
            newState = {
                state : types.ITEM_DIALOG_EDIT,
                name : action.name,
                date : action.date
            }
            break;
        case types.ITEM_DIALOG_ADD:
            newState = {
                state : types.ITEM_DIALOG_ADD,
                name : '',
                date : null
            }
            if(state.state !== newState.state) {
                navigate('/item/add')
            }
            break;
        case types.ITEM_DIALOG_OK:
        case types.ITEM_DIALOG_INACTIVE:
            newState = {
                state : types.ITEM_DIALOG_INACTIVE
            }
            if(state.state !== newState.state) {
                navigate('/')
            }
            break;
        default:
            return state
    }

    return Object.assign({}, state, newState)
}

export default itemsAddEditReducer;