import types from './types'
import {refresh, refreshState} from '../../common/utils'

const emptyItem = {
    id: '',
    nameID: '',
    date: '',
    quantity: '',
    previousQuantity: '',
    unit: '',
    state: '',
    creation_timestamp:'',
    changed_timestamp:'',
    _deleted: false
}

const itemsReducer = (state = [], action) => {
    switch (action.type) {
        case types.ITEM_ADD:
            const exists = state.find(it => it.id === action.data.id)
            if(exists) {
                return state
            }
            return [
                ...state,
                {
                    id: action.data.id,
                    nameID: action.data.nameID,
                    date: action.data.date,
                    quantity: action.data.quantity,
                    unit: action.data.unit,
                    state: types.ITEM_ACTIVE,
                    creation_timestamp: action.creation_timestamp
                }
            ]
        case types.ITEM_CHANGED:
            const otherItems = state.filter(i => i.id !== action.payload.id)

            return [
                ...otherItems,
                action.payload
            ]
        case types.ITEM_UNDO:
            const otherItems2 = state.filter(i => i.id !== action.payload.id)

            return [
                ...otherItems2,
                refresh(emptyItem, action.payload.newItem)
            ]
        case types.ITEM_REMOVED:
            const item3 = state.find(i => i.id === action.payload.id)
            const otherItems3 = state.filter(i => i.id !== action.payload.id)
            const changedItem3 = refresh(item3, {state: types.ITEM_REMOVED})
            return [
                ...otherItems3,
                changedItem3
            ]
        case types.ITEM_REFRESH:
            const refreshedState = refreshState(state, emptyItem, action.payload, true)
            return refreshedState
        case types.ITEM_LOAD:
            return action.payload.map(item => refresh(emptyItem, item));
        default:
            return state
    }
}

export default itemsReducer;