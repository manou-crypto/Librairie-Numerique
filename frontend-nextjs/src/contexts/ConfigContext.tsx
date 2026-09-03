'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { configService, AppConfiguration } from '@/services/config.service';

interface ConfigContextProps {
  config: AppConfiguration | null;
  loading: boolean;
  refreshConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextProps>({
  config: null,
  loading: true,
  refreshConfig: async () => {},
});

export const useAppConfig = () => useContext(ConfigContext);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfiguration | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const data = await configService.getConfiguration();
      setConfig(data);
    } catch (error) {
      console.error('Failed to load global configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  /**
   * Écouter les mises à jour de configuration en temps réel.
   * On importe dynamiquement le SocketContext pour éviter une dépendance
   * circulaire (SocketProvider est enfant de ConfigProvider dans le layout).
   * 
   * Pattern : polling de l'état du socket via window events custom.
   * Quand le SocketContext émet 'config_updated', il dispatche aussi un
   * CustomEvent pour que ConfigContext puisse se mettre à jour.
   */
  useEffect(() => {
    const handleConfigUpdate = (event: CustomEvent) => {
      const data = event.detail as AppConfiguration;
      if (data) {
        setConfig(data);
      }
    };

    window.addEventListener('app:config_updated', handleConfigUpdate as EventListener);
    return () => {
      window.removeEventListener('app:config_updated', handleConfigUpdate as EventListener);
    };
  }, []);

  return (
    <ConfigContext.Provider value={{ config, loading, refreshConfig: fetchConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}
