import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../hooks';
export default function ProtectedRoute({ children, roles }) {
    const location = useLocation();
    const { user, authenticated } = useAppSelector((s) => s.auth);
    console.log('ProtectedRoute: Checking access', {
        authenticated,
        location: location.pathname,
        roles,
        userRole: user?.role
    });
    if (!authenticated || !user) {
        console.log('ProtectedRoute: Not authenticated, redirecting to login');
        return _jsx(Navigate, { to: "/login", replace: true, state: { from: location } });
    }
    if (roles && roles.length > 0) {
        const userRole = user.role;
        if (!userRole || !roles.includes(userRole)) {
            console.log('ProtectedRoute: Insufficient permissions, redirecting to dashboard');
            return _jsx(Navigate, { to: "/dashboard", replace: true });
        }
    }
    console.log('ProtectedRoute: Access granted, rendering children');
    return _jsx(_Fragment, { children: children });
}
