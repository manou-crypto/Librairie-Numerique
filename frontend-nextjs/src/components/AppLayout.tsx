'use client';
import React from 'react';
import Sidebar from './Sidebar';
import { usePreferences } from '@/hooks/usePreferences';

interface AppLayoutProps {
  children: React.ReactNode;
  currentPath: string;
}

export default function AppLayout({ children, currentPath }: AppLayoutProps) {
  usePreferences(); // Applique le thème au montage

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar currentPath={currentPath} />
      <main className="flex-1 min-w-0 h-full overflow-y-auto overflow-x-hidden">{children}</main>
    </div>
  );
}
