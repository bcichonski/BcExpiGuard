import types from './types'

const appStateReducer = (state = { syncState: 'ok' }, action) => {
    switch (action.type) {
        case types.ERROR:
            const message = action.payload.message
            let newState = Object.assign({}, state)
            if (!newState.errors) {
                newState.errors = [message]
            } else {
                newState.errors.push(message)
            }

            newState.lastError = message

            return newState
        case types.SYNCSTATE:
            if (state.syncState !== action.payload.state) {
                let newState2 = Object.assign({}, state)
                newState2.syncState = action.payload.state
                return newState2
            } else {
                return state
            }
        default:
            return state
    }
}

export default appStateReducer;