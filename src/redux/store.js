import { configureStore } from '@reduxjs/toolkit'
import rootReducer from './reducer'
import { persistReducer, persistStore } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
const persistConfig = {
  key: 'root',
  storage,
}
const persistedReducer = persistReducer(persistConfig, rootReducer)
export const store = configureStore({
  reducer: persistedReducer,
  // devTools: import.meta.env.NODE_ENV !== 'production',
})
export const persistor = persistStore(store)