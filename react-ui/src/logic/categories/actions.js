import types from './types'

const addCategory = (payload) => ({
    type: types.CATEGORY_ADD_IF_NOT_EXISTS,
    payload
})

export default {
    addCategory
}