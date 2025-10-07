import { ReactNode, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../hooks';
import type { Role, DecodedToken } from '../types';

function decodeJwt(token: string | null): DecodedToken | null {
  if (!token) return null;
  try {
    const [, payload] = token.split('.');
    const json = atob(payload);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

type Props = { children: ReactNode; roles?: Role[] };

export default function ProtectedRoute({ children, roles }: Props) {
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
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  
  if (roles && roles.length > 0) {
    const userRole = decoded?.role as Role | undefined;
    if (!userRole || !roles.includes(userRole)) {
      console.log('ProtectedRoute: Insufficient permissions, redirecting to dashboard');
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  console.log('ProtectedRoute: Access granted, rendering children');
  return <>{children}</>;
}


