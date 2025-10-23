import { configureStore } from '@reduxjs/toolkit';
import auth from './authSlice';
import users from './userSlice';
import invoices from './invoiceSlice';
import superAdmin from './superAdminSlice';
import { setAppStore } from './storeRef';
export const store = configureStore({
    reducer: { auth, users, invoices, superAdmin }
});
// Expose store to modules that cannot import this file directly (avoid circular deps)
setAppStore(store);
