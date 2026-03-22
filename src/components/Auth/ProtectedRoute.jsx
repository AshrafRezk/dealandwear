import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import BottomNav from '../Layout/BottomNav';

const ProtectedRoute = () => {
  const { userToken, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>; // Could be a beautiful spinner later
  }

  return userToken ? (
    <>
      <Outlet />
      <BottomNav />
    </>
  ) : (
    <Navigate to="/" replace />
  );
};

export default ProtectedRoute;
