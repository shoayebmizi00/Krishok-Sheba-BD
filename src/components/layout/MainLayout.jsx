import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useAuth } from '@/lib/AuthContext';

export default function MainLayout() {
  const { user, setUser } = useAuth();

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
