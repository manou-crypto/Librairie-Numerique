'use client';
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// ─── Types des événements émis par le serveur ──────────────────────────────

export interface SaleCompletedPayload {
  id: string;
  referenceTicket: string;
  totalTtc: number;
  totalHt: number;
  totalTva: number;
  margeTotale: number;
  dateVente: string;
  lignesCount: number;
}

export interface StockUpdatedPayload {
  produitId: string;
  produitLibelle: string;
  nouvelleQuantite: number;
  seuilAlerte: number;
  estEnAlerte: boolean;
  estEnRupture: boolean;
}

export interface KpiUpdatePayload {
  caJour: number;
  beneficeBrutJour: number;
  ventesJourCount: number;
  panierMoyen: number;
  caMoisTotal: number;
  rupturesStockCount: number;
}

export interface ConfigUpdatedPayload {
  nom_librairie: string;
  logo_url: string | null;
  devise: string;
  tva: number;
}

// ─── Interface du contexte ─────────────────────────────────────────────────

interface SocketContextValue {
  /** Socket.io instance (utile pour écouter des événements custom) */
  socket: Socket | null;
  /** Indique si la connexion WebSocket est établie */
  isConnected: boolean;
  /** Dernier événement de vente reçu */
  lastSale: SaleCompletedPayload | null;
  /** Dernier événement de mise à jour de stock reçu */
  lastStockUpdate: StockUpdatedPayload | null;
  /** Derniers KPI reçus en temps réel */
  liveKpis: KpiUpdatePayload | null;
  /** Dernière configuration reçue en temps réel */
  liveConfig: ConfigUpdatedPayload | null;
  /** S'abonner à un événement custom */
  on: (event: string, handler: (...args: any[]) => void) => () => void;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  lastSale: null,
  lastStockUpdate: null,
  liveKpis: null,
  liveConfig: null,
  on: () => () => {},
});

export const useSocket = () => useContext(SocketContext);

// ─── Provider ──────────────────────────────────────────────────────────────

/**
 * SocketProvider — Initialise et maintient la connexion WebSocket.
 *
 * Stratégie de connexion :
 * - Le client se connecte au même hôte via le path '/ws/socket.io'
 *   (proxy Nginx redirige /ws/* vers le backend NestJS).
 * - La connexion est établie uniquement côté client (useEffect).
 * - En cas de déconnexion, Socket.io gère automatiquement la reconnexion
 *   avec un backoff exponentiel (jusqu'à 5 tentatives).
 * - Si le navigateur n'a pas de connexion internet, les événements sont
 *   silencieusement ignorés (l'app fonctionne toujours en mode HTTP normal).
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSale, setLastSale] = useState<SaleCompletedPayload | null>(null);
  const [lastStockUpdate, setLastStockUpdate] = useState<StockUpdatedPayload | null>(null);
  const [liveKpis, setLiveKpis] = useState<KpiUpdatePayload | null>(null);
  const [liveConfig, setLiveConfig] = useState<ConfigUpdatedPayload | null>(null);

  useEffect(() => {
    // Target URL: en local on utilise le proxy Nginx /ws/socket.io, en cloud on vise l'URL backend si définie
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_WS_URL;
    let socketTarget: string | undefined = undefined;
    if (rawApiUrl && rawApiUrl.startsWith('http')) {
      socketTarget = rawApiUrl.replace(/\/api\/?$/, '');
    }

    const socketInstance = io(socketTarget || '', {
      path: '/ws/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    // ── Cycle de vie de la connexion ────────────────────────────────────────
    socketInstance.on('connect', () => {
      console.log(`🟢 [Socket] Connecté au serveur (${socketInstance.id})`);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log(`🔴 [Socket] Déconnecté: ${reason}`);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.warn(`⚠️ [Socket] Erreur de connexion: ${err.message}`);
    });

    // ── Abonnements aux événements métier ───────────────────────────────────

    /**
     * config_updated : Mise à jour globale de la configuration.
     * Déclenché par ConfigurationService.updateConfiguration().
     */
    socketInstance.on('config_updated', (data: ConfigUpdatedPayload) => {
      console.log('📥 [Socket] config_updated reçu:', data.nom_librairie);
      setLiveConfig(data);
      // Notifier ConfigContext via un CustomEvent pour éviter la dépendance circulaire
      window.dispatchEvent(new CustomEvent('app:config_updated', { detail: data }));
    });

    /**
     * sale_completed : Nouvelle vente validée.
     * Déclenché par VentesService.createVente().
     */
    socketInstance.on('sale_completed', (data: SaleCompletedPayload) => {
      console.log(`📥 [Socket] sale_completed: ${data.referenceTicket} — ${data.totalTtc} TTC`);
      setLastSale(data);
    });

    /**
     * sale_cancelled : Vente annulée.
     * Déclenché par VentesService.annulerVente().
     */
    socketInstance.on('sale_cancelled', (data: { id: string }) => {
      console.log(`📥 [Socket] sale_cancelled: vente #${data.id}`);
    });

    /**
     * stock_updated : Niveau de stock modifié pour un produit.
     * Déclenché après chaque vente ou mouvement de stock.
     */
    socketInstance.on('stock_updated', (data: StockUpdatedPayload) => {
      console.log(
        `📥 [Socket] stock_updated: ${data.produitLibelle} — ${data.nouvelleQuantite} unités`
      );
      setLastStockUpdate(data);
    });

    /**
     * kpi_update : Données KPI fraîches du tableau de bord.
     * Déclenché après chaque vente pour rafraîchir le Dashboard en temps réel.
     */
    socketInstance.on('kpi_update', (data: KpiUpdatePayload) => {
      console.log(`📥 [Socket] kpi_update reçu — CA: ${data.caJour}`);
      setLiveKpis(data);
    });

    setSocket(socketInstance);

    // Nettoyage : fermer la connexion proprement au démontage du composant.
    return () => {
      console.log('🔌 [Socket] Fermeture propre de la connexion');
      socketInstance.disconnect();
    };
  }, []);

  /**
   * Méthode utilitaire pour s'abonner à un événement Socket.io
   * depuis n'importe quel composant enfant.
   * Retourne une fonction de désabonnement (cleanup).
   */
  const on = useCallback(
    (event: string, handler: (...args: any[]) => void) => {
      if (!socket) return () => {};
      socket.on(event, handler);
      return () => socket.off(event, handler);
    },
    [socket]
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        lastSale,
        lastStockUpdate,
        liveKpis,
        liveConfig,
        on,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
