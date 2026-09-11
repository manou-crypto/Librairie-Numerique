'use client';
import React from 'react';
import dynamic from 'next/dynamic';
import { financesService, DashboardChartsResponse } from '@/services/finances.service';

const CAAreaChart = dynamic(() => import('./CAAreaChart'), { ssr: false });
const CategoryPieChart = dynamic(() => import('./CategoryPieChart'), { ssr: false });

export default function DashboardChartsRow() {
  const [chartsData, setChartsData] = React.useState<DashboardChartsResponse | null>(null);

  React.useEffect(() => {
    financesService
      .getDashboardCharts()
      .then((data) => setChartsData(data))
      .catch((err) => console.error('Erreur de chargement des graphiques', err));
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4">
      <div className="lg:col-span-2 card-base p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Chiffre d&apos;affaires — 7 derniers jours
            </h3>
            <p className="text-xs text-muted-foreground">Comparaison avec la semaine précédente</p>
          </div>
          <select className="text-xs border border-border rounded-lg px-2 py-1 bg-card text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring">
            <option>7 jours</option>
            <option>30 jours</option>
            <option>3 mois</option>
          </select>
        </div>
        <CAAreaChart data={chartsData?.weeklyTrends || []} />
      </div>
      <div className="card-base p-5">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-foreground">Ventes par catégorie</h3>
          <p className="text-xs text-muted-foreground">Ce mois — répartition CA</p>
        </div>
        <CategoryPieChart data={chartsData?.categoriesDistribution || []} />
      </div>
    </div>
  );
}
