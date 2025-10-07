import { jsx as _jsx } from "react/jsx-runtime";
import { Suspense } from 'react';
import { SnackbarProvider } from 'notistack';
import AppRoutes from './routes/AppRoutes';
function App() {
    return (_jsx(SnackbarProvider, { maxSnack: 3, autoHideDuration: 4000, preventDuplicate: true, children: _jsx(Suspense, { fallback: null, children: _jsx(AppRoutes, {}) }) }));
}
export default App;
