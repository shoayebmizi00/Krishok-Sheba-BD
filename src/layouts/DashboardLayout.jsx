import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function DashboardLayout() {
  const { user, setUser, isLoadingAuth } = useAuth();

  if (isLoadingAuth) return <LoadingSpinner text="অ্যাকাউন্ট যাচাই হচ্ছে..." />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen">
      <Outlet context={{ user, setUser }} />
    </div>
  );
}
