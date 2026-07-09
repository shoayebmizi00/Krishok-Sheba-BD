import React, { useEffect, useRef } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotifications } from '@/contexts/NotificationContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

function playNotificationSound() {
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.08, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.22);
  } catch {
    // Browsers may block sound until the first user interaction.
  }
}

export default function NotificationBell({ user, link = '/notifications' }) {
  const previousUnread = useRef(0);
  const { notifications, markRead, markAllRead } = useNotifications();
  const items = notifications.slice(0, 8);
  const unread = notifications.filter((item) => !item.is_read).length;

  useEffect(() => {
    if (previousUnread.current && unread > previousUnread.current) playNotificationSound();
    previousUnread.current = unread;
  }, [unread]);

  const readItem = async (item) => {
    if (item.is_read) return;
    await markRead(item.id);
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative rounded-lg p-2 hover:bg-muted" aria-label="নোটিফিকেশন">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unread > 0 && <span className="absolute right-0 top-0 min-w-4 rounded-full bg-destructive px-1 text-[10px] leading-4 text-white">{unread}</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b p-3"><strong className="text-sm">নতুন নোটিফিকেশন</strong><Button variant="ghost" size="sm" onClick={markAllRead}><CheckCheck className="mr-1 h-4 w-4" /> সব পড়া হয়েছে</Button></div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? <p className="p-6 text-center text-sm text-muted-foreground">কোনো নোটিফিকেশন নেই</p> : items.map((item) => <Link key={item.id} to={item.link || link} onClick={() => readItem(item)} className={`block border-b p-3 text-sm hover:bg-muted ${item.is_read ? '' : 'bg-primary/5'}`}><strong>{item.title}</strong><p className="mt-1 text-xs text-muted-foreground">{item.message}</p></Link>)}
        </div>
        <Link to={link} className="block p-3 text-center text-sm font-medium text-primary">সব নোটিফিকেশন দেখুন</Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
