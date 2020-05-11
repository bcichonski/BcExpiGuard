import types from './types'
import { NAMESPACES, createUUID } from '../../common/utils'

function createCategory(name) {
    return {
        id: createUUID(NAMESPACES.CategoryName, name),
        name
    }
}

const DEFAULT_CATEGORY = 'defaultCategory'

export const defaultCategory = createCategory(DEFAULT_CATEGORY)

const defaultCategories = [
    defaultCategory
]

const categoriesReducer = (state = defaultCategories, action) => {
    switch (action.type) {
        case types.CATEGORY_ADD_IF_NOT_EXISTS:
            const payloadCategoryID = createUUID(NAMESPACES.CategoryName, action.payload.name)
            if (action.payload.id && action.payload.id !== payloadCategoryID) {
                throw Error('Something is fishy here')
            } else {
                action.payload.id = payloadCategoryID
            }

            if (state.findIndex((cat) => cat.name === action.payload.name) < 0) {
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

export default categoriesReducer;