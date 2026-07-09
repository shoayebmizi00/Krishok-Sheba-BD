import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { loadUserNotifications, notificationService } from '@/services/notificationService';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async (background = false) => {
    if (!user?.id) return;
    if (!background) setIsLoading(true);
    try {
      setNotifications(await loadUserNotifications(user.id));
    } catch {
      // Keep the last successful result; notifications never block page rendering.
    } finally {
      if (!background) setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      setIsLoading(false);
      return undefined;
    }
    refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh(true);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [user?.id, refresh]);

  const markRead = async (id) => {
    await notificationService.update(id, { is_read: true });
    setNotifications((current) => current.map((item) => (
      item.id === id ? { ...item, is_read: true } : item
    )));
  };

  const markAllRead = async () => {
    await Promise.all(notifications
      .filter((item) => !item.is_read)
      .map((item) => notificationService.update(item.id, { is_read: true })));
    setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
  };

  return (
    <NotificationContext.Provider value={{ notifications, isLoading, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
}
