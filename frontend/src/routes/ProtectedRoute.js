import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../hooks';
function decodeJwt(token) {
    if (!token)
        return null;
    try {
        const [, payload] = token.split('.');
        const json = atob(payload);
        return JSON.parse(json);
    }
    catch {
        return null;
    }
}
export default function ProtectedRoute({ children, roles }) {
    const location = useLocation();
    const accessToken = useAppSelector((s) => s.auth.accessToken);
    const decoded = useMemo(() => decodeJwt(accessToken), [accessToken]);
    console.log('ProtectedRoute: Checking access', {
        hasToken: !!accessToken,
        location: location.pathname,
        roles,
        userRole: decoded?.role
    });
    if (!accessToken) {
        console.log('ProtectedRoute: No token, redirecting to login');
        return _jsx(Navigate, { to: "/login", replace: true, state: { from: location } });
    }
    if (roles && roles.length > 0) {
        const userRole = decoded?.role;
        if (!userRole || !roles.includes(userRole)) {
            console.log('ProtectedRoute: Insufficient permissions, redirecting to dashboard');
            return _jsx(Navigate, { to: "/dashboard", replace: true });
        }
    }
    console.log('ProtectedRoute: Access granted, rendering children');
    return _jsx(_Fragment, { children: children });
}
