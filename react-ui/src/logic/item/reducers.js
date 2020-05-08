import types from './types'

const itemsReducer = (state = [], action) => {
    switch (action.type) {
        case types.ITEM_ADD:
            return [
                ...state,
                {
                    id: action.data.id,
                    name: action.data.name
                }
            ]
        default:
            return state
    }
}

export default itemsReducer;