import types from './types'
import { itemNameActions } from '../item-names'
import { itemActions } from '../item-list'
import dbProvider, { itemNames, items } from '../../persistence'

const appError = (message) => ({
    type: types.ERROR,
    payload: { message }
})

const changeSyncState = (state) => ({
    type: types.SYNCSTATE,
    payload: state
})

const initialize = (changeSyncStateFn) => async (dispatch) => {
    try {
        dbProvider.setSyncStateHandler(changeSyncStateFn)

        const storedItemNames = await itemNames.getAll()
        if (!storedItemNames || storedItemNames.length === 0) {
            dispatch(itemNameActions.addDummyName())
        } else {
            dispatch(itemNameActions.loadNames(storedItemNames))
        }

        const storedItems = await items.getAll();
        if (!storedItems || storedItems.length === 0) {
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
    appError,
    changeSyncState
}