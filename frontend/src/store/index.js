import { configureStore } from '@reduxjs/toolkit';
import auth from './authSlice';
import users from './userSlice';
import invoices from './invoiceSlice';
import superAdmin from './superAdminSlice';
export const store = configureStore({
    reducer: { auth, users, invoices, superAdmin }
});
