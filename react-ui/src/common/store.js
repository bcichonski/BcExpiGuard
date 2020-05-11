import { configureStore } from '@reduxjs/toolkit'
import appReducer from './reducers'
import thunk from 'redux-thunk';

const store = configureStore({
    reducer: appReducer,
    devTools: process.env.NODE_ENV !== 'production',
    middleware: [ thunk ]
})

export default store;