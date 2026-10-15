import reducer, { defaultCategory } from '../../logic/categories/reducers'
import types from '../../logic/categories/types'
import { NAMESPACES, createUUID } from '../../common/utils'

describe('categoriesReducer', () => {
    it('has the default category as initial state', () => {
        const state = reducer(undefined, { type: '@@INIT' })
        expect(state).toEqual([defaultCategory])
        expect(defaultCategory).toEqual({
            id: createUUID(NAMESPACES.CategoryName, 'defaultCategory'),
            name: 'defaultCategory'
        })
    })

    it('returns the same state for unknown actions', () => {
        const state = [defaultCategory]
        expect(reducer(state, { type: 'unknown' })).toBe(state)
    })

    describe('CATEGORY_ADD_IF_NOT_EXISTS', () => {
        it('adds a new category with a generated id', () => {
            const state = [defaultCategory]
            const payload = { name: 'dairy' }
            const result = reducer(state, { type: types.CATEGORY_ADD_IF_NOT_EXISTS, payload })
            expect(result).toHaveLength(2)
            expect(result[1]).toEqual({ id: createUUID(NAMESPACES.CategoryName, 'dairy'), name: 'dairy' })
            expect(result).not.toBe(state)
            expect(state).toHaveLength(1)
        })

        it('ODDITY: mutates the action payload by assigning the id', () => {
            const payload = { name: 'dairy' }
            reducer([], { type: types.CATEGORY_ADD_IF_NOT_EXISTS, payload })
            expect(payload.id).toBe(createUUID(NAMESPACES.CategoryName, 'dairy'))
        })

        it('accepts a payload with the correct id', () => {
            const id = createUUID(NAMESPACES.CategoryName, 'dairy')
            const result = reducer([], { type: types.CATEGORY_ADD_IF_NOT_EXISTS, payload: { id, name: 'dairy' } })
            expect(result).toEqual([{ id, name: 'dairy' }])
        })

        it('throws when the payload id does not match the name', () => {
            expect(() => reducer([], {
                type: types.CATEGORY_ADD_IF_NOT_EXISTS,
                payload: { id: 'wrong', name: 'dairy' }
            })).toThrow('Something is fishy here')
        })

        it('returns the same state when a category with that name exists', () => {
            const state = [defaultCategory]
            const result = reducer(state, {
                type: types.CATEGORY_ADD_IF_NOT_EXISTS,
                payload: { name: 'defaultCategory' }
            })
            expect(result).toBe(state)
        })
    })
})
