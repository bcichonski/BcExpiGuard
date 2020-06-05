import types from './types'
import { itemNameActions } from '../item-names'
import { itemActions } from '../item-list'
import { itemNames, items } from '../../persistence'

const appError = (message) => ({
    type: types.ERROR,
    payload: { message }
})

const initialize = () => async (dispatch) => {
    try {
        const storedItemNames = await itemNames.getAll()
        dispatch(itemNameActions.loadNames(storedItemNames))

        const storedItems = await items.getAll();
        if(!storedItems || storedItems.length === 0) {
            dispatch(itemActions.addDummyItem())
        } else {
            dispatch(itemActions.load(storedItems))
        }
    } catch (err) {
        dispatch(appError(err.message))
    }
}

export default {
    initialize,
    appError
}