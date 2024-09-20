// src/components/ProtectedRoute.js
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext); // Access the logged-in user from the AuthContext

  if (!user) {
    // If the user is not logged in, show an "Unauthorized Access" message
    return <h1>Unauthorized Access</h1>;
  }

  // If the user is logged in, render the child component
  return children;
};

export default ProtectedRoute;
