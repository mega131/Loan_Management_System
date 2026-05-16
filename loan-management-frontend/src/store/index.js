import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import loanReducer from './slices/loanSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    loans: loanReducer,
  },
});

export default store;
