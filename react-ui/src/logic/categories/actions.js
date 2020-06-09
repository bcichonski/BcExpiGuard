import types from './types'
import { categories } from '../../persistence'

const addCategory = (payload) => {
    return async dispatch => {
        if(!payload.creation_timestamp) {
            payload.creation_timestamp = new Date()
        }
        
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