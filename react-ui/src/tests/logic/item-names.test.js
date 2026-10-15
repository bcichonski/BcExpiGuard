import reducer from '../../logic/item-names/reducers'
import types from '../../logic/item-names/types'
import { NAMESPACES, createUUID } from '../../common/utils'

const empty = { id: '', name: '', userId: '', _deleted: false }

describe('itemNamesReducer', () => {
    it('has an empty list as initial state', () => {
        expect(reducer(undefined, { type: '@@INIT' })).toEqual([])
    })

    it('returns the same state for unknown actions', () => {
        const state = [{ ...empty, id: '1' }]
        expect(reducer(state, { type: 'unknown' })).toBe(state)
    })

    describe('ITEMNAME_ADD_IF_NOT_EXISTS', () => {
        it('adds a new name with a generated id', () => {
            const result = reducer([], { type: types.ITEMNAME_ADD_IF_NOT_EXISTS, payload: { name: 'milk' } })
            expect(result).toEqual([{ id: createUUID(NAMESPACES.ItemName, 'milk'), name: 'milk' }])
        })

        it('ODDITY: mutates the action payload by assigning the id; added item has no userId/_deleted defaults', () => {
            const payload = { name: 'milk' }
            const result = reducer([], { type: types.ITEMNAME_ADD_IF_NOT_EXISTS, payload })
            expect(payload.id).toBe(createUUID(NAMESPACES.ItemName, 'milk'))
            expect(result[0]).toBe(payload)
            expect(result[0]).not.toHaveProperty('userId')
        })

        it('throws when the payload id does not match the name', () => {
            expect(() => reducer([], {
                type: types.ITEMNAME_ADD_IF_NOT_EXISTS,
                payload: { id: 'wrong', name: 'milk' }
            })).toThrow('Something is fishy here')
        })

        it('returns the same state when the name exists', () => {
            const state = [{ ...empty, id: 'x', name: 'milk' }]
            const result = reducer(state, { type: types.ITEMNAME_ADD_IF_NOT_EXISTS, payload: { name: 'milk' } })
            expect(result).toBe(state)
        })
    })

    describe('LOAD_ITEMNAMES', () => {
        it('replaces state, filling defaults', () => {
            const state = [{ ...empty, id: 'old', name: 'old' }]
            const result = reducer(state, {
                type: types.LOAD_ITEMNAMES,
                payload: [{ id: 'a', name: 'apple' }, { id: 'b', name: 'bread', userId: 'u' }]
            })
            expect(result).toEqual([
                { id: 'a', name: 'apple', userId: '', _deleted: false },
                { id: 'b', name: 'bread', userId: 'u', _deleted: false }
            ])
        })

        it('ODDITY: properties not in the empty item are dropped', () => {
            const result = reducer([], { type: types.LOAD_ITEMNAMES, payload: [{ id: 'a', name: 'n', extra: 1 }] })
            expect(result[0]).not.toHaveProperty('extra')
        })
    })

    describe('ITEMNAMES_REFRESH', () => {
        it('updates matching items, adds new ones and keeps unmatched ones', () => {
            const state = [
                { ...empty, id: 'a', name: 'apple' },
                { ...empty, id: 'b', name: 'bread' }
            ]
            const result = reducer(state, {
                type: types.ITEMNAMES_REFRESH,
                payload: [{ id: 'a', name: 'apple2' }, { id: 'c', name: 'cheese' }]
            })
            expect(result).toEqual([
                { ...empty, id: 'a', name: 'apple2' },
                { ...empty, id: 'b', name: 'bread' },
                { ...empty, id: 'c', name: 'cheese' }
            ])
        })
    })

    describe('ITEMNAMES_PRELOAD', () => {
        it('adds placeholder items for unknown ids only', () => {
            const state = [{ ...empty, id: 'a', name: 'apple' }]
            const result = reducer(state, { type: types.ITEMNAMES_PRELOAD, payload: ['a', 'b'] })
            expect(result).toEqual([
                { ...empty, id: 'a', name: 'apple' },
                { ...empty, id: 'b' }
            ])
            expect(state).toHaveLength(1)
        })
    })
})
