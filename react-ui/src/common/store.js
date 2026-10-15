import { configureStore } from '@reduxjs/toolkit'
import appReducer from './reducers'
import thunk from 'redux-thunk';

const store = configureStore({
    reducer: appReducer,
    devTools: !import.meta.env.PROD,
    middleware: [ thunk ]
})

export default store;