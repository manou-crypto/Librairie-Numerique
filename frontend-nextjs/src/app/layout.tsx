import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import { ConfigProvider } from '@/contexts/ConfigContext';
import { SocketProvider } from '@/contexts/SocketContext';
import '../styles/tailwind.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'LibrairieNumerique — Gestion de librairie moderne',
  description:
    'Système de gestion complet pour librairie : catalogue, caisse POS, stocks et finances — tout en un seul tableau de bord.',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* ConfigProvider charge les paramètres globaux (nom, devise, TVA) */}
        <ConfigProvider>
          {/* SocketProvider établit la connexion WebSocket pour le temps réel */}
          <SocketProvider>{children}</SocketProvider>
        </ConfigProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: '14px',
            },
          }}
        />
      </body>
    </html>
  );
}
