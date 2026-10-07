'use client';
import { useEffect } from 'react';
import { useAppConfig } from '@/contexts/ConfigContext';

export default function DynamicHead() {
  const { config } = useAppConfig();

  useEffect(() => {
    if (config?.nom_librairie) {
      document.title = config.nom_librairie;
    }
    if (config?.logo_url) {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) {
        link.href = config.logo_url;
      } else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = config.logo_url;
        document.head.appendChild(newLink);
      }
    }
  }, [config]);

  return null;
}
