'use client';
import React from 'react';
import { TrendingUp, ShoppingBag, Euro, AlertTriangle, BarChart2, ArrowUpRight, ArrowDownRight, Wifi } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';
import { useSocket } from '@/contexts/SocketContext';
import { useAppConfig } from '@/contexts/ConfigContext';
import { financesService } from '@/services/finances.service';

interface KPIData {
  id: string;
  label: string;
  value: string;
  subValue?: string;
  trend: number;
  trendLabel: string;
  icon: React.ElementType;
  variant: 'positive' | 'negative' | 'warning' | 'info' | 'neutral';
  span?: string;
}

const variantStyles: Record<string, string> = {
  positive: 'kpi-card-positive',
  negative: 'kpi-card-negative',
  warning: 'kpi-card-warning',
  info: 'kpi-card-info',
  neutral: 'kpi-card-neutral',
};

const iconBgStyles: Record<string, string> = {
  positive: 'bg-green-100 text-green-600',
  negative: 'bg-red-100 text-red-600',
  warning: 'bg-amber-100 text-amber-600',
  info: 'bg-blue-100 text-blue-600',
  neutral: 'bg-muted text-muted-foreground',
};

export default function DashboardBentoGrid() {
  const { isConnected, liveKpis, lastSale } = useSocket();
  const { config } = useAppConfig();
  const devise = config?.devise || 'FCFA';
  const [kpis, setKpis] = React.useState({
    caJour: 0,
    beneficeJour: 0,
    ventesJour: 0,
    panierMoyen: 0,
    caMois: 0,
    ruptures: 0
  });
  // Indicateur de "flash" pour animer la carte au moment d'une mise à jour
  const [flashSale, setFlashSale] = React.useState(false);

  // Chargement initial des KPI depuis l'API HTTP
  React.useEffect(() => {
    async function loadKpi() {
      try {
        const data = await financesService.getDashboardKpis();
        setKpis({
          caJour: data.caJour ?? 0,
          beneficeJour: data.beneficeBrutJour ?? 0,
            ventesJour: data.ventesJourCount ?? 0,
            panierMoyen: data.panierMoyen ?? 0,
            caMois: data.caMoisTotal ?? 0,
            ruptures: data.rupturesStockCount ?? 0
          });
      } catch (e) {
        console.error(e);
      }
    }
    loadKpi();
  }, []);

  // Mise à jour en temps réel via WebSocket — événement kpi_update
  React.useEffect(() => {
    if (!liveKpis) return;
    setKpis({
      caJour: liveKpis.caJour,
      beneficeJour: liveKpis.beneficeBrutJour,
      ventesJour: liveKpis.ventesJourCount,
      panierMoyen: liveKpis.panierMoyen,
      caMois: liveKpis.caMoisTotal,
      ruptures: liveKpis.rupturesStockCount,
    });
  }, [liveKpis]);

  // Animation flash à chaque nouvelle vente reçue
  React.useEffect(() => {
    if (!lastSale) return;
    setFlashSale(true);
    const timer = setTimeout(() => setFlashSale(false), 1500);
    return () => clearTimeout(timer);
  }, [lastSale]);

  const dynamicKpis: KPIData[] = [
    {
      id: 'kpi-ca-jour',
      label: "Chiffre d'affaires du jour",
      value: `${kpis.caJour.toLocaleString('fr-FR')} ${devise}`,
      subValue: isConnected ? '🟢 Temps réel' : '⚪ Données serveur',
      trend: 0,
      trendLabel: 'vs hier',
      icon: Euro,
      variant: 'positive',
      span: 'col-span-2'
    },
    {
      id: 'kpi-benefice',
      label: 'Bénéfice brut du jour',
      value: `${kpis.beneficeJour.toLocaleString('fr-FR')} ${devise}`,
      subValue: 'Marge calculée',
      trend: 0,
      trendLabel: 'vs hier',
      icon: TrendingUp,
      variant: 'positive'
    },
    {
      id: 'kpi-ventes',
      label: 'Ventes du jour',
      value: `${kpis.ventesJour}`,
      subValue: 'transactions',
      trend: 0,
      trendLabel: 'vs hier',
      icon: ShoppingBag,
      variant: 'neutral'
    },
    {
      id: 'kpi-panier',
      label: 'Panier moyen',
      value: `${kpis.panierMoyen.toLocaleString('fr-FR')} ${devise}`,
      subValue: 'par transaction',
      trend: 0,
      trendLabel: 'vs hier',
      icon: BarChart2,
      variant: 'positive'
    },
    {
      id: 'kpi-ca-mois',
      label: 'CA mensuel (mois en cours)',
      value: `${kpis.caMois.toLocaleString('fr-FR')} ${devise}`,
      subValue: 'Du mois en cours',
      trend: 0,
      trendLabel: 'cumul',
      icon: TrendingUp,
      variant: 'info'
    },
    {
      id: 'kpi-ruptures',
      label: 'Ruptures de stock',
      value: `${kpis.ruptures}`,
      subValue: 'produits à commander',
      trend: 0,
      trendLabel: 'actuel',
      icon: AlertTriangle,
      variant: 'warning'
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Indicateurs clés — Données réelles
        </h2>
        <div className="flex items-center gap-2">
          {/* Indicateur de connexion temps réel */}
          <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md ${
            isConnected 
              ? 'bg-green-100 text-green-700' 
              : 'bg-muted text-muted-foreground'
          }`}>
            <Wifi size={11} />
            <span>{isConnected ? 'Temps réel' : 'Hors ligne'}</span>
          </div>
          {/* Flash indicator lors d'une nouvelle vente */}
          {flashSale && (
            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-md animate-pulse font-medium">
              +1 vente !
            </span>
          )}
        </div>
      </div>
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 transition-all ${
        flashSale ? 'ring-2 ring-green-400/30 rounded-xl' : ''
      }`}>
        {dynamicKpis.map((kpi) => {
          const Icon = kpi.icon;
          const isPositiveTrend = kpi.trend >= 0;
          const TrendIcon = isPositiveTrend ? ArrowUpRight : ArrowDownRight;
          const trendColor = kpi.variant === 'warning' ? 'text-amber-600' : isPositiveTrend ? 'text-green-600' : 'text-red-600';
          return (
            <div
              key={kpi.id}
              className={`${variantStyles[kpi.variant]} ${kpi.span === 'col-span-2' ? 'md:col-span-2 xl:col-span-2 2xl:col-span-2' : ''} fade-in transition-all`}
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground leading-tight">{kpi.label}</p>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBgStyles[kpi.variant]}`}>
                  <Icon size={18} />
                </div>
              </div>
              <p className="text-3xl font-bold tabular-nums text-foreground mb-1">{kpi.value}</p>
              {kpi.subValue && <p className="text-xs text-muted-foreground mb-2">{kpi.subValue}</p>}
              <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
                <TrendIcon size={13} />
                <span>{kpi.trendLabel}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
