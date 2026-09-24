'use client';

import { useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/auth.service';
import { playNotificationSound } from '@/utils/sound';

export interface UserPreferences {
  theme: 'clair' | 'sombre' | 'auto';
  notifEmail: boolean;
  notifSon: boolean;
  notifStockBas: boolean;
  notifNouvelleVente: boolean;
  notifRapportJournalier: boolean;
  notifAlerteRupture: boolean;
}

const defaultPreferences: UserPreferences = {
  theme: 'clair',
  notifEmail: false, // désactivé par défaut car non implémenté
  notifSon: true,
  notifStockBas: true,
  notifNouvelleVente: true,
  notifRapportJournalier: true,
  notifAlerteRupture: true,
};

function getStorageKey(): string {
  if (typeof window === 'undefined') return 'app_preferences_guest';
  const user = authService.getUser();
  return user?.id ? `app_preferences_user_${user.id}` : 'app_preferences_guest';
}

export function usePreferences() {
  const [preferences, setPreferencesState] = useState<UserPreferences>(defaultPreferences);
  const [mounted, setMounted] = useState(false);

  // Charger les préférences de l'utilisateur actif
  const loadPreferences = useCallback(() => {
    if (typeof window === 'undefined') return;
    const key = getStorageKey();
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const { langue, ...cleanParsed } = parsed;
        setPreferencesState({ ...defaultPreferences, ...cleanParsed });
      } catch (e) {
        console.error('Erreur lecture preferences', e);
      }
    } else {
      setPreferencesState(defaultPreferences);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    loadPreferences();
  }, [loadPreferences]);

  // Appliquer le thème dès que les préférences changent
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    const applyTheme = (theme: 'clair' | 'sombre' | 'auto') => {
      const root = window.document.documentElement;
      const isDark =
        theme === 'sombre' ||
        (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(preferences.theme);
  }, [preferences.theme, mounted]);

  const updatePreferences = (newPrefs: Partial<UserPreferences>) => {
    setPreferencesState((prev) => {
      const updated = { ...prev, ...newPrefs };
      if (typeof window !== 'undefined') {
        const key = getStorageKey();
        localStorage.setItem(key, JSON.stringify(updated));
      }
      return updated;
    });
  };

  const testNotificationSound = () => {
    playNotificationSound();
  };

  return { preferences, updatePreferences, testNotificationSound, mounted };
}
