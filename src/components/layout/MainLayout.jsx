import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useAuth } from '@/lib/AuthContext';
import { dashboardPathForRole } from '@/lib/roleRoutes';

export default function MainLayout() {
  const { user, setUser } = useAuth();
  const location = useLocation();

  if (user?.role === 'buyer') {
    const buyerRouteMap = [
      [/^\/marketplace$/, '/buyer-dashboard/marketplace'],
      [/^\/listing\/([^/]+)$/, '/buyer-dashboard/listing/$1'],
      [/^\/messages\/([^/]+)$/, '/buyer-dashboard/messages/$1'],
      [/^\/messages$/, '/buyer-dashboard/messages'],
      [/^\/notifications$/, '/buyer-dashboard/notifications'],
      [/^\/profile$/, '/buyer-dashboard/profile']
    ];
    const matchedRoute = buyerRouteMap.find(([pattern]) => pattern.test(location.pathname));
    const destination = matchedRoute
      ? location.pathname.replace(matchedRoute[0], matchedRoute[1])
      : '/buyer-dashboard';
    return <Navigate to={destination} replace state={{ from: location.pathname }} />;
  }
  if (user) {
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
