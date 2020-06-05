import types from './types'

const appStateReducer = (state = { }, action) => {
    switch (action.type) {
        case types.ERROR:
            const message = action.payload.message
            let newState = Object.assign({}, state)    
            if(!newState.errors) {
                newState.errors = [message]
            } else {
                newState.errors.push(message)
            }

            newState.lastError = message

            return newState
        default:
            return state
    }
}

export default appStateReducer;