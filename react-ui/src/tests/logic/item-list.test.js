import reducer from '../../logic/item-list/reducers'
import types from '../../logic/item-list/types'

const empty = {
    id: '', nameID: '', date: '', quantity: '', previousQuantity: '', unit: '',
    state: '', creation_timestamp: '', changed_timestamp: '', _deleted: false
}
const item = (over) => ({ ...empty, ...over })

describe('itemsReducer', () => {
    it('has an empty list as initial state', () => {
        expect(reducer(undefined, { type: '@@INIT' })).toEqual([])
    })

    it('returns the same state for unknown actions', () => {
        const state = [item({ id: '1' })]
        expect(reducer(state, { type: 'unknown' })).toBe(state)
    })

    describe('ITEM_ADD', () => {
        const data = { id: '1', nameID: 'n', date: '2020-01-01', quantity: 2, unit: 'kg', ignored: 'x' }

        it('appends an active item with the creation timestamp', () => {
            const result = reducer([], { type: types.ITEM_ADD, data, creation_timestamp: 'ts' })
            expect(result).toEqual([{
                id: '1', nameID: 'n', date: '2020-01-01', quantity: 2, unit: 'kg',
                state: types.ITEM_ACTIVE, creation_timestamp: 'ts'
            }])
        })

        it('returns the same state if the id already exists', () => {
            const state = [item({ id: '1' })]
            expect(reducer(state, { type: types.ITEM_ADD, data, creation_timestamp: 'ts' })).toBe(state)
        })
    })

    describe('ITEM_CHANGED', () => {
        it('replaces the item with the same id and moves it to the end', () => {
            const state = [item({ id: '1', unit: 'a' }), item({ id: '2' })]
            const changed = item({ id: '1', unit: 'b' })
            const result = reducer(state, { type: types.ITEM_CHANGED, payload: changed })
            expect(result).toEqual([item({ id: '2' }), changed])
        })

        it('appends when the id is unknown', () => {
            const result = reducer([item({ id: '1' })], { type: types.ITEM_CHANGED, payload: item({ id: '3' }) })
            expect(result.map(i => i.id)).toEqual(['1', '3'])
        })
    })

    describe('ITEM_UNDO', () => {
        it('replaces the item with newItem merged over an empty item', () => {
            const state = [item({ id: '1', quantity: 5 }), item({ id: '2' })]
            const result = reducer(state, {
                type: types.ITEM_UNDO,
                payload: { id: '1', newItem: { id: '1', quantity: 3 } }
            })
            expect(result).toEqual([item({ id: '2' }), item({ id: '1', quantity: 3 })])
        })
    })

    describe('ITEM_REMOVED', () => {
        it('sets state to removed and moves the item to the end', () => {
            const state = [item({ id: '1', state: types.ITEM_ACTIVE }), item({ id: '2' })]
            const result = reducer(state, { type: types.ITEM_REMOVED, payload: { id: '1' } })
            expect(result).toEqual([item({ id: '2' }), item({ id: '1', state: types.ITEM_REMOVED })])
            expect(state[0].state).toBe(types.ITEM_ACTIVE)
        })

        it('ODDITY: unknown id appends an empty object {} instead of being ignored', () => {
            const state = [item({ id: '1' })]
            const result = reducer(state, { type: types.ITEM_REMOVED, payload: { id: 'nope' } })
            expect(result).toEqual([item({ id: '1' }), {}])
        })
    })

    describe('ITEM_LOAD', () => {
        it('replaces state, filling defaults', () => {
            const result = reducer([item({ id: 'old' })], {
                type: types.ITEM_LOAD,
                payload: [{ id: '1', quantity: 2 }, { id: '2', extra: 1 }]
            })
            expect(result).toEqual([item({ id: '1', quantity: 2 }), item({ id: '2' })])
        })
    })

    describe('ITEM_REFRESH', () => {
        const older = '2020-01-01T10:00:00Z'
        const newer = '2020-01-01T11:00:00Z'

        it('applies a payload item with a newer changed_timestamp', () => {
            const state = [item({ id: '1', quantity: 1, changed_timestamp: older })]
            const result = reducer(state, {
                type: types.ITEM_REFRESH,
                payload: [{ id: '1', quantity: 9, changed_timestamp: newer }]
            })
            expect(result).toEqual([item({ id: '1', quantity: 9, changed_timestamp: newer })])
        })

        it('ignores a payload item with an older changed_timestamp', () => {
            const state = [item({ id: '1', quantity: 1, changed_timestamp: newer })]
            const result = reducer(state, {
                type: types.ITEM_REFRESH,
                payload: [{ id: '1', quantity: 9, changed_timestamp: older }]
            })
            expect(result).toEqual(state)
        })

        it('ignores a payload item with an equal changed_timestamp', () => {
            const state = [item({ id: '1', quantity: 1, changed_timestamp: older })]
            const result = reducer(state, {
                type: types.ITEM_REFRESH,
                payload: [{ id: '1', quantity: 9, changed_timestamp: older }]
            })
            expect(result[0].quantity).toBe(1)
        })

        it('ignores a payload item with no changed_timestamp', () => {
            const state = [item({ id: '1', quantity: 1, changed_timestamp: older })]
            const result = reducer(state, { type: types.ITEM_REFRESH, payload: [{ id: '1', quantity: 9 }] })
            expect(result[0].quantity).toBe(1)
        })

        it('ODDITY: applies payload when the state item has no changed_timestamp (empty string)', () => {
            const state = [item({ id: '1', quantity: 1 })]
            const result = reducer(state, {
                type: types.ITEM_REFRESH,
                payload: [{ id: '1', quantity: 9, changed_timestamp: newer }]
            })
            expect(result[0].quantity).toBe(9)
        })

        it('adds payload items not in state', () => {
            const result = reducer([], {
                type: types.ITEM_REFRESH,
                payload: [{ id: '2', quantity: 4, changed_timestamp: newer }]
            })
            expect(result).toEqual([item({ id: '2', quantity: 4, changed_timestamp: newer })])
        })

        it('keeps state items missing from the payload', () => {
            const state = [item({ id: '1', quantity: 1, changed_timestamp: older })]
            const result = reducer(state, { type: types.ITEM_REFRESH, payload: [] })
            expect(result).toEqual(state)
        })
    })
})
