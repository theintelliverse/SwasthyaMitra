import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import SEO from './SEO';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  
  const isLabRoute = allowedRoles && allowedRoles.includes('independent_lab');
  
  // Get token and role from localStorage with fallback
  const labToken = localStorage.getItem('labToken');
  const userToken = localStorage.getItem('token');
  const labRole = localStorage.getItem('labRole');
  const userRoleState = localStorage.getItem('role');

  const token = isLabRoute ? (labToken || userToken) : (userToken || labToken);
  const userRole = isLabRoute ? (labRole || userRoleState) : (userRoleState || labRole);

  // 1. If not logged in, send to login
  if (!token) {
    return <Navigate to={isLabRoute ? "/lab/login" : "/login"} state={{ from: location }} replace />;
  }

  // 2. If logged in but role is not authorized for this specific route
  if (allowedRoles && !allowedRoles.includes(userRole) && !['independent_lab', 'lab', 'doctor', 'admin'].includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 3. If everything is fine, show the page with noindex SEO tags
  return (
    <>
      <SEO noindex={true} />
      {children}
    </>
  );
};

export default ProtectedRoute;