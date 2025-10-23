import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../hooks';
import type { Role } from '../types';

type Props = { children: ReactNode; roles?: Role[] };

export default function ProtectedRoute({ children, roles }: Props) {
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
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  
  if (roles && roles.length > 0) {
    const userRole = user.role as Role;
    if (!userRole || !roles.includes(userRole)) {
      console.log('ProtectedRoute: Insufficient permissions, redirecting to dashboard');
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  console.log('ProtectedRoute: Access granted, rendering children');
  return <>{children}</>;
}


