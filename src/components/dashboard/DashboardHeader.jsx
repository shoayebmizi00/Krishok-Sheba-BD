import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardHeader({ title, setMobileOpen, user }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 sm:px-6 bg-card/95 backdrop-blur border-b border-border">
      <div className="flex items-center gap-3">
        <button onClick={() => setMobileOpen(true)} className="lg:hidden p-1.5 rounded-md hover:bg-muted">
          <Menu className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="font-heading font-semibold text-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-semibold text-primary">
            {(user?.full_name || 'U')[0]}
          </span>
        </div>
      </div>
    </header>
  );
}