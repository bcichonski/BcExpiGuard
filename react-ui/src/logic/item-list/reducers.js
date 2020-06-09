import types from './types'

const itemsReducer = (state = [], action) => {
    switch (action.type) {
        case types.ITEM_ADD:
            return [
                ...state,
                {
                    id: action.data.id,
                    nameID: action.data.nameID,
                    date: action.data.date,
                    quantity: action.data.quantity,
                    unit: action.data.unit,
                    state: types.ITEM_ACTIVE
                }
            ]
        case types.ITEM_CHANGED:
            const otherItems = state.filter(i => i.id !== action.payload.id)

            return [
                ...otherItems,
                action.payload.newItem
            ]
        case types.ITEM_UNDO:
            const otherItems2 = state.filter(i => i.id !== action.payload.id)

            return [
                ...otherItems2,
                action.payload.newItem
            ]
        case types.ITEM_REMOVED:
            const item3 = state.find(i => i.id === action.payload.id)
            const otherItems3 = state.filter(i => i.id !== action.payload.id)
            const changedItem3 = Object.assign({}, item3)
            changedItem3.state = types.ITEM_REMOVED
            return [
                ...otherItems3,
                changedItem3
            ]
        case types.ITEM_LOAD:
            return action.payload;
        default:
            return state
    }
}

export default itemsReducer;