'use client';
import React from 'react';
import { TrendingUp, ShoppingBag, Euro, AlertTriangle, BarChart2, ArrowUpRight, ArrowDownRight, } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


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
  const [kpis, setKpis] = React.useState({
    caJour: 0,
    beneficeJour: 0,
    ventesJour: 0,
    panierMoyen: 0,
    caMois: 0,
    ruptures: 0
  });

  React.useEffect(() => {
    async function loadKpi() {
      try {
        const res = await fetch('/api/v1/dashboard/kpi');
        if (res.ok) {
          const data = await res.json();
          setKpis({
            caJour: data.caJour ?? 0,
            beneficeJour: data.beneficeJour ?? 0,
            ventesJour: data.ventesJour ?? 0,
            panierMoyen: data.panierMoyen ?? 0,
            caMois: data.caMois ?? 0,
            ruptures: data.ruptures ?? 0
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadKpi();
  }, []);

  const dynamicKpis: KPIData[] = [
    { id: 'kpi-ca-jour', label: "Chiffre d'affaires du jour", value: `${kpis.caJour.toLocaleString('fr-FR')} FCFA`, subValue: 'En temps réel', trend: 0, trendLabel: 'vs hier', icon: Euro, variant: 'positive', span: 'col-span-2' },
    { id: 'kpi-benefice', label: 'Bénéfice brut du jour', value: `${kpis.beneficeJour.toLocaleString('fr-FR')} FCFA`, subValue: 'Marge calculée', trend: 0, trendLabel: 'vs hier', icon: TrendingUp, variant: 'positive' },
    { id: 'kpi-ventes', label: 'Ventes du jour', value: `${kpis.ventesJour}`, subValue: 'transactions', trend: 0, trendLabel: 'vs hier', icon: ShoppingBag, variant: 'neutral' },
    { id: 'kpi-panier', label: 'Panier moyen', value: `${kpis.panierMoyen.toLocaleString('fr-FR')} FCFA`, subValue: 'par transaction', trend: 0, trendLabel: 'vs hier', icon: BarChart2, variant: 'positive' },
    { id: 'kpi-ca-mois', label: 'CA mensuel (mois en cours)', value: `${kpis.caMois.toLocaleString('fr-FR')} FCFA`, subValue: 'Du mois en cours', trend: 0, trendLabel: 'cumul', icon: TrendingUp, variant: 'info' },
    { id: 'kpi-ruptures', label: 'Ruptures de stock', value: `${kpis.ruptures}`, subValue: 'produits à commander', trend: 0, trendLabel: 'actuel', icon: AlertTriangle, variant: 'warning' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Indicateurs clés — Données réelles</h2>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">Données serveur</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
        {dynamicKpis.map((kpi) => {
          const Icon = kpi.icon;
          const isPositiveTrend = kpi.trend >= 0;
          const TrendIcon = isPositiveTrend ? ArrowUpRight : ArrowDownRight;
          const trendColor = kpi.variant === 'warning' ? 'text-amber-600' : isPositiveTrend ? 'text-green-600' : 'text-red-600';
          return (
            <div key={kpi.id} className={`${variantStyles[kpi.variant]} ${kpi.span === 'col-span-2' ? 'md:col-span-2 xl:col-span-2 2xl:col-span-2' : ''} fade-in`}>
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground leading-tight">{kpi.label}</p>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBgStyles[kpi.variant]}`}><Icon size={18} /></div>
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
