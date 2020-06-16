import types from './types'
import { categories } from '../../persistence'
import { nowISO } from '../../common/utils'

const addCategory = (payload) => {
    return async dispatch => {
        if(!payload.creation_timestamp) {
            payload.creation_timestamp = nowISO()
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