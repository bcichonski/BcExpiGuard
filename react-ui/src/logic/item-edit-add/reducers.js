import types from './types'

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
            break;
        case types.ITEM_DIALOG_INACTIVE:
            newState = {
                state : types.ITEM_DIALOG_INACTIVE
            }
            break;
        default:
            return state
    }

    return Object.assign({}, state, newState)
}

export default itemsAddEditReducer;