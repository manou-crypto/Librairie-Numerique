'use client';
import React from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Euro,
  AlertTriangle,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
  Wifi,
} from 'lucide-react';
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

  const [period, setPeriod] = React.useState<'jour' | 'semaine' | 'mois' | 'annee'>('jour');
  const [loading, setLoading] = React.useState(false);
  const [kpis, setKpis] = React.useState({
    caPeriode: 0,
    beneficeBrutPeriode: 0,
    margeMoyennePourcent: 0,
    ventesPeriode: 0,
    panierMoyen: 0,
    caJour: 0,
    caMois: 0,
    dettesFournisseurs: 0,
    ruptures: 0,
  });
  // Indicateur de "flash" pour animer la carte au moment d'une mise à jour
  const [flashSale, setFlashSale] = React.useState(false);

  const fetchKpis = React.useCallback(async (selectedPeriod: 'jour' | 'semaine' | 'mois' | 'annee') => {
    try {
      setLoading(true);
      const data = await financesService.getDashboardKpis(selectedPeriod);
      setKpis({
        caPeriode: data.caPeriode ?? (selectedPeriod === 'jour' ? data.caJour : data.caMoisTotal),
        beneficeBrutPeriode: data.beneficeBrutPeriode ?? data.beneficeBrutJour ?? 0,
        margeMoyennePourcent: data.margeMoyennePourcent ?? 0,
        ventesPeriode: data.ventesJourCount ?? 0,
        panierMoyen: data.panierMoyen ?? 0,
        caJour: data.caJour ?? 0,
        caMois: data.caMoisTotal ?? 0,
        dettesFournisseurs: data.dettesFournisseurs ?? 0,
        ruptures: data.rupturesStockCount ?? 0,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Chargement initial et à chaque changement de période
  React.useEffect(() => {
    fetchKpis(period);
  }, [period, fetchKpis]);

  // Mise à jour en temps réel via WebSocket — événement kpi_update
  React.useEffect(() => {
    if (!liveKpis) return;
    setKpis((prev) => ({
      ...prev,
      caJour: liveKpis.caJour ?? prev.caJour,
      caPeriode: period === 'jour' ? liveKpis.caJour : prev.caPeriode,
      caMois: liveKpis.caMoisTotal ?? prev.caMois,
      ruptures: liveKpis.rupturesStockCount ?? prev.ruptures,
      panierMoyen: liveKpis.panierMoyen ?? prev.panierMoyen,
    }));
  }, [liveKpis, period]);

  // Animation flash à chaque nouvelle vente reçue
  React.useEffect(() => {
    if (!lastSale) return;
    setFlashSale(true);
    const timer = setTimeout(() => setFlashSale(false), 1500);
    return () => clearTimeout(timer);
  }, [lastSale]);

  const periodLabels: Record<string, { ca: string; benefice: string; sub: string }> = {
    jour: { ca: "Chiffre d'affaires du jour", benefice: 'Bénéfice brut du jour', sub: "Aujourd'hui" },
    semaine: { ca: "Chiffre d'affaires (7 jours)", benefice: 'Bénéfice brut (7 jours)', sub: '7 derniers jours' },
    mois: { ca: "Chiffre d'affaires du mois", benefice: 'Bénéfice brut du mois', sub: 'Mois en cours' },
    annee: { ca: "Chiffre d'affaires annuel", benefice: 'Bénéfice brut annuel', sub: 'Année en cours' },
  };

  const currentLabels = periodLabels[period];

  const dynamicKpis: KPIData[] = [
    {
      id: 'kpi-ca-periode',
      label: currentLabels.ca,
      value: `${kpis.caPeriode.toLocaleString('fr-FR')} ${devise}`,
      subValue: isConnected ? `🟢 Temps réel (${currentLabels.sub})` : `⚪ Données réelles (${currentLabels.sub})`,
      trend: 0,
      trendLabel: currentLabels.sub,
      icon: Euro,
      variant: 'positive',
      span: 'col-span-2',
    },
    {
      id: 'kpi-benefice',
      label: currentLabels.benefice,
      value: `${kpis.beneficeBrutPeriode.toLocaleString('fr-FR')} ${devise}`,
      subValue: `Marge réelle : ${kpis.margeMoyennePourcent}%`,
      trend: 0,
      trendLabel: `Marge calculée`,
      icon: TrendingUp,
      variant: 'positive',
    },
    {
      id: 'kpi-ventes',
      label: `Ventes (${currentLabels.sub})`,
      value: `${kpis.ventesPeriode}`,
      subValue: `Panier moyen : ${kpis.panierMoyen.toLocaleString('fr-FR')} ${devise}`,
      trend: 0,
      trendLabel: 'transactions',
      icon: ShoppingBag,
      variant: 'neutral',
    },
    {
      id: 'kpi-dettes',
      label: 'Dettes Fournisseurs (Impayés)',
      value: `${kpis.dettesFournisseurs.toLocaleString('fr-FR')} ${devise}`,
      subValue: kpis.dettesFournisseurs > 0 ? 'Factures achats en attente de solde' : 'Tous les achats sont soldés',
      trend: kpis.dettesFournisseurs > 0 ? -1 : 1,
      trendLabel: kpis.dettesFournisseurs > 0 ? 'À régulariser' : 'Aucune dette',
      icon: AlertTriangle,
      variant: kpis.dettesFournisseurs > 0 ? 'warning' : 'info',
    },
    {
      id: 'kpi-ca-mois',
      label: 'Cumul mensuel (Mois en cours)',
      value: `${kpis.caMois.toLocaleString('fr-FR')} ${devise}`,
      subValue: 'Du 1er du mois à ce jour',
      trend: 0,
      trendLabel: 'cumul mensuel',
      icon: BarChart2,
      variant: 'info',
    },
    {
      id: 'kpi-ruptures',
      label: 'Ruptures de stock',
      value: `${kpis.ruptures}`,
      subValue: 'articles épuisés en stock',
      trend: kpis.ruptures > 0 ? -1 : 1,
      trendLabel: kpis.ruptures > 0 ? 'À réapprovisionner' : 'Stock optimal',
      icon: AlertTriangle,
      variant: kpis.ruptures > 0 ? 'negative' : 'neutral',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Indicateurs clés — Données réelles
          </h2>
          {loading && <span className="text-xs text-muted-foreground animate-pulse">(actualisation...)</span>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sélecteur de période */}
          <div className="flex items-center bg-muted/80 p-0.5 rounded-lg border border-border text-xs">
            {(
              [
                { key: 'jour', label: "Aujourd'hui" },
                { key: 'semaine', label: '7 jours' },
                { key: 'mois', label: 'Ce mois' },
                { key: 'annee', label: 'Cette année' },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                onClick={() => setPeriod(item.key)}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  period === item.key
                    ? 'bg-card text-foreground shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Indicateur de connexion temps réel */}
          <div
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border ${
              isConnected
                ? 'bg-green-500/10 text-green-700 border-green-500/20'
                : 'bg-muted text-muted-foreground border-border'
            }`}
          >
            <Wifi size={12} className={isConnected ? 'text-green-600' : ''} />
            <span>{isConnected ? 'Temps réel' : 'Serveur'}</span>
          </div>

          {/* Flash indicator lors d'une nouvelle vente */}
          {flashSale && (
            <span className="text-xs bg-green-500 text-white px-2.5 py-1 rounded-md animate-pulse font-medium shadow-sm">
              +1 vente !
            </span>
          )}
        </div>
      </div>

      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 transition-all ${
          flashSale ? 'ring-2 ring-green-400/30 rounded-xl' : ''
        }`}
      >
        {dynamicKpis.map((kpi) => {
          const Icon = kpi.icon;
          const isPositiveTrend = kpi.trend >= 0;
          const TrendIcon = isPositiveTrend ? ArrowUpRight : ArrowDownRight;
          const trendColor =
            kpi.variant === 'warning'
              ? 'text-amber-600'
              : kpi.variant === 'negative'
                ? 'text-red-600'
                : isPositiveTrend
                  ? 'text-green-600'
                  : 'text-muted-foreground';

          return (
            <div
              key={kpi.id}
              className={`${variantStyles[kpi.variant]} ${
                kpi.span === 'col-span-2' ? 'md:col-span-2 xl:col-span-2 2xl:col-span-2' : ''
              } fade-in transition-all`}
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground leading-tight">
                  {kpi.label}
                </p>
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBgStyles[kpi.variant]}`}
                >
                  <Icon size={18} />
                </div>
              </div>
              <p className="text-2xl lg:text-3xl font-bold tabular-nums text-foreground mb-1">{kpi.value}</p>
              {kpi.subValue && <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{kpi.subValue}</p>}
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
