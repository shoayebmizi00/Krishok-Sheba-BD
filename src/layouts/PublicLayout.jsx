import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardPathForRole } from '@/routes/roleRoutes';

export default function PublicLayout() {
  const { user, setUser } = useAuth();
  const location = useLocation();

  if (user && user.role !== 'buyer') {
    return <Navigate to={dashboardPathForRole(user.role)} replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1">
        <Outlet context={{ user, setUser }} />
      </main>
      <Footer />
    </div>
  );
}
