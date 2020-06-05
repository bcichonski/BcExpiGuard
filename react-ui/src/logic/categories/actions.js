import types from './types'
import { categories } from '../../persistence'

const addCategory = (payload) => {
    return async dispatch => {

        await categories.add(payload)

        return {
            type: types.CATEGORY_ADD_IF_NOT_EXISTS,
            payload
        }
    }
}

export default {
    addCategory
}