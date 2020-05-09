import { combineReducers } from 'redux'
import itemReducer from '../logic/item-list'
import itemEditReducer from '../logic/item-edit-add'

const appReducer = combineReducers({
    itemReducer,
    itemEditReducer
})

export default appReducer
