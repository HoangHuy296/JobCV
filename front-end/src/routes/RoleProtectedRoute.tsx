import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectPath?: string;
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ 
  children, 
  allowedRoles, 
  redirectPath = '/dang-nhap' 
}) => {
  const { user, isAuthenticated, loading } = useUser();
  const location = useLocation();
  
  // Show loading indicator while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Authentication check - redirect if not authenticated
  if (!isAuthenticated) {
    // Lưu URL hiện tại vào query param để redirect về sau khi login
    const currentPath = location.pathname + location.search;
    const loginUrl = `${redirectPath}?redirect=${encodeURIComponent(currentPath)}`;
    return <Navigate to={loginUrl} replace />;
  }
  
  // Role check - if no roles specified, allow access
  if (!allowedRoles?.length) {
    return <>{children}</>;
  }
  
  // Check if user has required role
  const hasRequiredRole = allowedRoles.includes(user?.role || '');
  
  // Redirect based on role if not authorized
  if (!hasRequiredRole) {
    switch (user?.role) {
      case 'admin':
        return <Navigate to="/admin/bang-dieu-khien" replace />;
      case 'recruiter':
      case 'company':
        return <Navigate to="/nha-tuyen-dung/bang-dieu-khien" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }
  
  return <>{children}</>;
};

export default RoleProtectedRoute;
