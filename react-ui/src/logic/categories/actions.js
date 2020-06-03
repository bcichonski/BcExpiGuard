import types from './types'
import 

const addCategory = (payload) => {
    return async dispatch => {

        await

        return {
            type: types.CATEGORY_ADD_IF_NOT_EXISTS,
            payload
        }
    }
}

export default {
    addCategory
}