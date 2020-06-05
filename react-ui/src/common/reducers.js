import { combineReducers } from 'redux'
import itemReducer from '../logic/item-list'
import itemEditReducer from '../logic/item-edit-add'
import categoryReducer from '../logic/categories'
import itemNameReducer from '../logic/item-names'
import appStateReducer from '../logic/appstate'

const appReducer = combineReducers({
    itemReducer,
    itemEditReducer,
    categoryReducer,
    itemNameReducer,
    appStateReducer
})

export default appReducer
