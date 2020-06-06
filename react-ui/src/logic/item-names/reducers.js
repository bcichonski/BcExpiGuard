import types from './types'
import { NAMESPACES, createUUID } from '../../common/utils'

const itemNamesReducer = (state = [], action) => {
    switch (action.type) {
        case types.ITEMNAME_ADD_IF_NOT_EXISTS:
            const itemNameID = createUUID(NAMESPACES.ItemName, action.payload.name)
            if (action.payload.id && action.payload.id !== itemNameID) {
                throw Error('Something is fishy here')
            } else {
                action.payload.id = itemNameID
            }

            if (state.findIndex((itemName) => itemName.name === action.payload.name) < 0) {
                return [
                    ...state,
                    action.payload
                ]
            } else {
                return state
            }
        case types.LOAD_ITEMNAMES:
            return action.payload
        default:
            return state
    }
}

export default itemNamesReducer