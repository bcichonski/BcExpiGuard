import { navigate } from '@reach/router'
import reducer from '../../logic/item-edit-add/reducers'
import types from '../../logic/item-edit-add/types'

jest.mock('@reach/router', () => ({ navigate: jest.fn() }))

const initial = { state: types.ITEM_DIALOG_INACTIVE, nameError: false, date: null, dateError: false }

describe('itemsAddEditReducer', () => {
    beforeEach(() => navigate.mockClear())

    it('has the inactive dialog as initial state', () => {
        expect(reducer(undefined, { type: '@@INIT' })).toEqual(initial)
    })

    it('returns the same state for unknown actions', () => {
        expect(reducer(initial, { type: 'unknown' })).toBe(initial)
        expect(navigate).not.toHaveBeenCalled()
    })

    it('ITEM_NAME_CHANGED sets name and clears nameError', () => {
        const result = reducer({ ...initial, nameError: true }, { type: types.ITEM_NAME_CHANGED, name: 'milk' })
        expect(result).toEqual({ ...initial, name: 'milk', nameError: false })
    })

    it('ITEM_EXPIRATION_DATE_CHANGED sets date and dateError', () => {
        const result = reducer(initial, { type: types.ITEM_EXPIRATION_DATE_CHANGED, date: '2020-01-01', error: true })
        expect(result).toEqual({ ...initial, date: '2020-01-01', dateError: true })
    })

    it('ITEM_UNIT_CHANGED sets unit', () => {
        expect(reducer(initial, { type: types.ITEM_UNIT_CHANGED, unit: 'kg' })).toEqual({ ...initial, unit: 'kg' })
    })

    it('ITEM_QUANTITY_CHANGED sets quantity', () => {
        expect(reducer(initial, { type: types.ITEM_QUANTITY_CHANGED, quantity: 3 })).toEqual({ ...initial, quantity: 3 })
    })

    it('ITEM_STATE_CHANGED sets itemState from payload', () => {
        expect(reducer(initial, { type: types.ITEM_STATE_CHANGED, payload: 'done' })).toEqual({ ...initial, itemState: 'done' })
    })

    describe('ITEM_IN_EDIT_MODE', () => {
        it('loads the item into the edit dialog', () => {
            const payload = { id: '1', name: 'milk', date: 'd', unit: 'l', quantity: 2, state: 's' }
            const result = reducer(initial, { type: types.ITEM_IN_EDIT_MODE, payload })
            expect(result).toEqual({
                ...initial, state: types.ITEM_DIALOG_EDIT, itemState: 's',
                id: '1', name: 'milk', date: 'd', unit: 'l', quantity: 2
            })
        })

        it('returns an equal copy of the state when there is no item', () => {
            const result = reducer(initial, { type: types.ITEM_IN_EDIT_MODE, payload: undefined })
            expect(result).toEqual(initial)
        })
    })

    it('ITEM_DIALOG_ADD resets the form, flags nameError and navigates to /item/add', () => {
        const result = reducer(initial, { type: types.ITEM_DIALOG_ADD })
        expect(result).toEqual({
            ...initial, state: types.ITEM_DIALOG_ADD, name: '', date: null, unit: '', quantity: '', nameError: true
        })
        expect(navigate).toHaveBeenCalledWith('/item/add')
    })

    it('ITEM_NAME_ERROR sets nameError', () => {
        expect(reducer(initial, { type: types.ITEM_NAME_ERROR })).toEqual({ ...initial, nameError: true })
    })

    describe.each([types.ITEM_DIALOG_OK, types.ITEM_DIALOG_INACTIVE])('%s', (type) => {
        it('goes inactive and navigates to /items when leaving edit mode', () => {
            const result = reducer({ ...initial, state: types.ITEM_DIALOG_EDIT, name: 'x' }, { type })
            expect(result).toEqual({ ...initial, state: types.ITEM_DIALOG_INACTIVE, name: 'x' })
            expect(navigate).toHaveBeenCalledWith('/items')
        })

        it('goes inactive and navigates to / otherwise', () => {
            const result = reducer({ ...initial, state: types.ITEM_DIALOG_ADD }, { type })
            expect(result.state).toBe(types.ITEM_DIALOG_INACTIVE)
            expect(navigate).toHaveBeenCalledWith('/')
        })
    })

    it('ODDITY: the reducer has side effects (navigate) and does not reset form fields on close', () => {
        const result = reducer({ ...initial, state: types.ITEM_DIALOG_ADD, name: 'left over' }, { type: types.ITEM_DIALOG_OK })
        expect(result.name).toBe('left over')
    })
})
