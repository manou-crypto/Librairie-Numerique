'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { financesService, DashboardChartsResponse } from '@/services/finances.service';

const CAAreaChart = dynamic(() => import('./CAAreaChart'), { ssr: false });
const CategoryPieChart = dynamic(() => import('./CategoryPieChart'), { ssr: false });

export default function DashboardChartsRow() {
  const [days, setDays] = React.useState<number>(7);
  const [chartsData, setChartsData] = React.useState<DashboardChartsResponse | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    setLoading(true);
    financesService
      .getDashboardCharts('mois', days)
      .then((data) => setChartsData(data))
      .catch((err) => console.error('Erreur de chargement des graphiques', err))
      .finally(() => setLoading(false));
  }, [days]);

  const daysLabel = days === 7 ? '7 derniers jours' : days === 30 ? '30 derniers jours' : '90 derniers jours (3 mois)';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4">
      <div className="lg:col-span-2 card-base p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Chiffre d&apos;affaires — {daysLabel}
            </h3>
            <p className="text-xs text-muted-foreground">
              {days === 7 ? 'Comparaison avec la période précédente' : 'Évolution journalière sur la période'}
            </p>
          </div>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="text-xs border border-border rounded-lg px-2.5 py-1.5 bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
          >
            <option value={7}>7 jours</option>
            <option value={30}>30 jours</option>
            <option value={90}>3 mois (90j)</option>
          </select>
        </div>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-xs text-muted-foreground animate-pulse">
            Chargement de l'évolution...
          </div>
        ) : (
          <CAAreaChart data={chartsData?.weeklyTrends || []} />
        )}
      </div>
      <div className="card-base p-5">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-foreground">Ventes par catégorie</h3>
          <p className="text-xs text-muted-foreground">{daysLabel} — répartition CA</p>
        </div>
        <CategoryPieChart data={chartsData?.categoriesDistribution || []} />
      </div>
    </div>
  );
}
