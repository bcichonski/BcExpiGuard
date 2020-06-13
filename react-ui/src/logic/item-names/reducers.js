import types from './types'
import { NAMESPACES, createUUID, refresh, refreshState } from '../../common/utils'

const emptyItem = ({
    id: '',
    name: '',
    userId: ''
})

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
            return action.payload.map(it => refresh(emptyItem, it))
        case types.ITEMNAMES_REFRESH:
            return refreshState(state, emptyItem, action.payload)
        case types.ITEMNAMES_PRELOAD:
            const newPreloadState = [...state]
            action.payload.forEach(element => {
                if (!state.find(it => it.id === element)) {
                    newPreloadState.push(refresh(emptyItem, { id: element }))
                }
            });
            return newPreloadState
        default:
            return state
    }
}

export default itemNamesReducer