'use client';

import { useState, useEffect } from 'react';

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
  notifEmail: true,
  notifSon: false,
  notifStockBas: true,
  notifNouvelleVente: false,
  notifRapportJournalier: true,
  notifAlerteRupture: true,
};

export function usePreferences() {
  const [preferences, setPreferencesState] = useState<UserPreferences>(defaultPreferences);
  const [mounted, setMounted] = useState(false);

  // Charger les préférences depuis localStorage au démarrage
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('app_preferences');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // On nettoie l'ancienne clé "langue" si elle était stockée
        const { langue, ...cleanParsed } = parsed;
        setPreferencesState({ ...defaultPreferences, ...cleanParsed });
      } catch (e) {
        console.error('Erreur lecture preferences', e);
      }
    }
  }, []);

  // Appliquer le thème dès que les préférences changent
  useEffect(() => {
    if (!mounted) return;

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
      localStorage.setItem('app_preferences', JSON.stringify(updated));
      return updated;
    });
  };

  return { preferences, updatePreferences, mounted };
}
