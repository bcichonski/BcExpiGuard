import reducer from '../../logic/appstate/reducers'
import types from '../../logic/appstate/types'

describe('appStateReducer', () => {
    it('has initial state with syncState ok', () => {
        expect(reducer(undefined, { type: '@@INIT' })).toEqual({ syncState: 'ok' })
    })

    it('returns the same state for unknown actions', () => {
        const state = { syncState: 'ok' }
        expect(reducer(state, { type: 'unknown' })).toBe(state)
    })

    describe('ERROR', () => {
        it('creates errors list and lastError', () => {
            const state = reducer(undefined, { type: types.ERROR, payload: { message: 'boom' } })
            expect(state).toEqual({ syncState: 'ok', errors: ['boom'], lastError: 'boom' })
        })

        it('appends to existing errors', () => {
            const s1 = reducer(undefined, { type: types.ERROR, payload: { message: 'a' } })
            const s2 = reducer(s1, { type: types.ERROR, payload: { message: 'b' } })
            expect(s2.errors).toEqual(['a', 'b'])
            expect(s2.lastError).toBe('b')
            expect(s2).not.toBe(s1)
        })

        it('ODDITY: mutates the errors array shared with the previous state (shallow copy)', () => {
            const s1 = reducer(undefined, { type: types.ERROR, payload: { message: 'a' } })
            const s2 = reducer(s1, { type: types.ERROR, payload: { message: 'b' } })
            expect(s2.errors).toBe(s1.errors)
            expect(s1.errors).toEqual(['a', 'b'])
            expect(s1.lastError).toBe('a')
        })
    })

    describe('SYNCSTATE', () => {
        it('returns a new state when the sync state changes', () => {
            const state = { syncState: 'ok' }
            const result = reducer(state, { type: types.SYNCSTATE, payload: { state: 'paused' } })
            expect(result).toEqual({ syncState: 'paused' })
            expect(result).not.toBe(state)
            expect(state.syncState).toBe('ok')
        })

        it('returns the same state when the sync state is unchanged', () => {
            const state = { syncState: 'ok' }
            expect(reducer(state, { type: types.SYNCSTATE, payload: { state: 'ok' } })).toBe(state)
        })
    })

    it('ODDITY: INITIALIZE, WARNING and SYNCCHANGES are defined but not handled', () => {
        const state = { syncState: 'ok' }
        for (const t of [types.INITIALIZE, types.WARNING, types.SYNCCHANGES]) {
            expect(reducer(state, { type: t, payload: {} })).toBe(state)
        }
    })
})
