import types from './types'
import { itemNameActions } from '../item-names'
import { itemActions } from '../item-list'
import dbProvider, { itemNames, items } from '../../persistence'

const appError = (message) => ({
    type: types.ERROR,
    payload: { message }
})

const changeSyncState = (state, key) => ({
    type: types.SYNCSTATE,
    payload: {state, key}
})

const syncChanges = (key) => async (dispatch) => {
    switch (key) {
        case 'items-local':
        case 'items-remote':
            const dbItems = await items.getAll()
            const dbItemPreloadedNames = dbItems.map(it => it.nameId)
            dispatch(itemNameActions.preload(dbItemPreloadedNames))
            dispatch(itemActions.refresh(dbItems))
            break;
        case 'item-names-local':
        case 'item-names-remote':
            const dbItemNames = await itemNames.getAll()
            dispatch(itemNames.refreshNames(dbItemNames))
            break;
        default:
            console.log(`Unexpected sync key ${key}`)
    }
}

const initialize = (syncHooks) => async (dispatch) => {
    try {
        dbProvider.setSyncHooks(syncHooks)

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
    changeSyncState,
    syncChanges
}