import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
const API_URL = import.meta.env.VITE_API_URL;
const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();

  // Get token and role from localStorage
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  const userRole = sessionStorage.getItem('role') || localStorage.getItem('role'); // This was 'admin', 'doctor', or 'receptionist'

  // 1. If not logged in, send to login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. If logged in but role is not authorized for this specific route
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // 3. If everything is fine, show the page
  return children;
};

export default ProtectedRoute;