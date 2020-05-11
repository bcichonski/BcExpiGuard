import types from './types'
import { NAMESPACES, createUUID } from '../../common/utils'

function createItemName(name) {
    return {
        id : createUUID(NAMESPACES.ItemName, name),
        name
    }
}

export const itemParsley = createItemName('Parsley')
export const itemPasta = createItemName('Pasta')
export const itemBread = createItemName('Bread')
export const itemDrivingLicense = createItemName('Driving license')

const defaultItemNames = [
    itemParsley,
    itemPasta,
    itemBread,
    itemDrivingLicense
]

const itemNamesReducer = (state = defaultItemNames, action) => {
    switch (action.type) {
        case types.ITEMNAME_ADD_IF_NOT_EXISTS:
            const itemNameCategoryID = createUUID(NAMESPACES.ItemName, action.payload.name)
            if (action.payload.id && action.payload.id !== itemNameCategoryID) {
                throw Error('Something is fishy here')
            } else {
                action.payload.id = itemNameCategoryID
            }

            if (state.findIndex((itemName) => itemName.name == action.payload.name) < 0) {
                return [
                    ...state,
                    action.payload
                ]
            } else {
                return state
            }
        default:
            return state
    }
}

export default itemNamesReducer