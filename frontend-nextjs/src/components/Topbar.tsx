'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Search, User, LogOut, Settings, ChevronDown } from 'lucide-react';
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
  const { user, logout } = useAuth();
  const displayName = user?.name ?? '';
  const displayInitials = user?.name ? getInitials(user.name) : '';
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch notifications to get unread count
    notificationsService
      .getAll()
      .then((notifs) => {
        const unread = notifs.filter((n) => !n.lue).length;
        setUnreadCount(unread);
      })
      .catch((err) => console.error(err));
  }, []);

  // Fermer le menu lors d'un clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border px-6 py-3 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-bold text-foreground leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            placeholder="Recherche rapide..."
            className="input-field pl-9 w-56 text-sm"
          />
        </div>
        <Link
          href="/notifications"
          className="relative p-2 rounded-lg hover:bg-muted transition-colors"
          title="Notifications"
        >
          <Bell size={18} className="text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
          )}
        </Link>

        {user && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer focus:outline-none"
              title={displayName}
              aria-expanded={menuOpen}
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-border/60">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-primary">{displayInitials}</span>
                )}
              </div>
              <ChevronDown size={14} className="text-muted-foreground hidden sm:block" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-card border border-border shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-border/60">
                  <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                  <span className="inline-block mt-1 text-[9px] font-semibold uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    {user.role}
                  </span>
                </div>

                <div className="py-1">
                  <Link
                    href="/profil"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-foreground hover:bg-muted/70 transition-colors"
                  >
                    <User size={15} className="text-muted-foreground" />
                    Mon profil
                  </Link>

                  {user.role === 'ADMIN' && (
                    <Link
                      href="/parametres"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-foreground hover:bg-muted/70 transition-colors"
                    >
                      <Settings size={15} className="text-muted-foreground" />
                      Paramètres
                    </Link>
                  )}
                </div>

                <div className="border-t border-border/60 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors text-left"
                  >
                    <LogOut size={15} />
                    Se déconnecter
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
