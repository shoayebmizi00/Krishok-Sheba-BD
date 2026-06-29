import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sprout, X } from 'lucide-react';

export default function DashboardSidebar({ links, mobileOpen, setMobileOpen }) {
  const location = useLocation();

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Sprout className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-sm">কৃষক-সেবা বিডি</span>
        </Link>
        {setMobileOpen && (
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {links.map(link => {
          const isActive = location.pathname === link.path || link.aliases?.includes(location.pathname);
          return (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileOpen?.(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`}
            >
              <link.icon className="w-4.5 h-4.5 shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:block w-60 shrink-0 bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 h-full bg-sidebar shadow-xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
