import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import SEO from './SEO';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  
  const isLabRoute = allowedRoles && allowedRoles.includes('independent_lab');
  
  // Get token and role from localStorage
  const token = isLabRoute ? localStorage.getItem('labToken') : localStorage.getItem('token');
  const userRole = isLabRoute ? localStorage.getItem('labRole') : localStorage.getItem('role');

  // 1. If not logged in, send to login
  if (!token) {
    return <Navigate to={isLabRoute ? "/lab/login" : "/login"} state={{ from: location }} replace />;
  }

  // 2. If logged in but role is not authorized for this specific route
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 3. If everything is fine, show the page with noindex SEO tags to avoid bot indexation
  return (
    <>
      <SEO noindex={true} />
      {children}
    </>
  );
};

export default ProtectedRoute;