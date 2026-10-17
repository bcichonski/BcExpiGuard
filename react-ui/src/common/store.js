import { configureStore } from '@reduxjs/toolkit'
import appReducer from './reducers'

// Default middleware: thunk plus the dev-only immutability and serializability checks.
const store = configureStore({
    reducer: appReducer,
    devTools: !import.meta.env.PROD,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware()
})

export default store;
