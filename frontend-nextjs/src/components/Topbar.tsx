'use client';
import React, { useState, useEffect } from 'react';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { notificationsService } from '@/services/notifications.service';

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const { user } = useAuth();
  const displayName = user?.name ?? '';
  const displayInitials = user?.name ? getInitials(user.name) : '';
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch notifications to get unread count
    notificationsService.getAll()
      .then(notifs => {
        const unread = notifs.filter(n => !n.lue).length;
        setUnreadCount(unread);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border px-6 py-3 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-bold text-foreground leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Recherche rapide..."
            className="input-field pl-9 w-56 text-sm"
          />
        </div>
        <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-muted transition-colors" title="Notifications">
          <Bell size={18} className="text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
          )}
        </Link>
        {user && (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center" title={displayName}>
            <span className="text-xs font-bold text-primary">{displayInitials}</span>
          </div>
        )}
      </div>
    </header> 
  );
}