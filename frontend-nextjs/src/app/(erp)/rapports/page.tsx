'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import {
  Download,
  TrendingUp,
  ShoppingBag,
  Package,
  DollarSign,
  Calendar,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { rapportsService, RapportsStats } from '@/services/rapports.service';

type Period = 'semaine' | 'mois' | 'trimestre' | 'annee';

export default function RapportsPage() {
  const periodLabels: Record<Period, string> = {
    semaine: 'Cette semaine',
    mois: 'Ce mois',
    trimestre: 'Ce trimestre',
    annee: 'Cette année',
  };

  const [period, setPeriod] = useState<Period>('semaine');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RapportsStats>({
    chiffreAffaires: 0,
    beneficeNet: 0,
    ventesTotales: 0,
    margeMoyenne: 0,
    caData: [],
    categoryData: [],
    topProducts: [],
    ventesJour: [],
  });

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    rapportsService
      .getStats(period)
      .then((data) => {
        if (isMounted) {
          setStats(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [period]);

  return (
    <AppLayout currentPath="/rapports">
      <Topbar title="Rapports" subtitle="Analyses et statistiques de performance" />
      <div className="px-6 py-6 max-w-screen-2xl mx-auto space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-muted-foreground" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="text-sm border-none bg-transparent font-medium text-foreground focus:ring-0 cursor-pointer"
            >
              {(Object.keys(periodLabels) as Period[]).map((p) => (
                <option key={p} value={p}>
                  {periodLabels[p]}
                </option>
              ))}
            </select>
            {loading && <Loader2 size={14} className="animate-spin text-primary ml-2" />}
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary flex items-center gap-1.5 text-sm py-2">
              <Download size={14} /> Exporter PDF
            </button>
            <button className="btn-secondary flex items-center gap-1.5 text-sm py-2">
              <Download size={14} /> Exporter Excel
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="kpi-card-info">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Chiffre d'affaires</p>
              <DollarSign size={16} className="text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {stats.chiffreAffaires.toLocaleString('fr-FR')} FCFA
            </p>
            <p className="text-xs text-positive mt-1">Données temps réel</p>
          </div>
          <div className="kpi-card-positive">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Bénéfice net</p>
              <TrendingUp size={16} className="text-positive" />
            </div>
            <p className="text-2xl font-bold text-positive tabular-nums">
              {stats.beneficeNet.toLocaleString('fr-FR')} FCFA
            </p>
            <p className="text-xs text-positive mt-1">Données temps réel</p>
          </div>
          <div className="kpi-card-neutral">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Ventes totales</p>
              <ShoppingBag size={16} className="text-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{stats.ventesTotales}</p>
            <p className="text-xs text-muted-foreground mt-1">
              transactions ({periodLabels[period].toLowerCase()})
            </p>
          </div>
          <div className="kpi-card-warning">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Marge moyenne</p>
              <Package size={16} className="text-warning" />
            </div>
            <p className="text-2xl font-bold text-warning tabular-nums">{stats.margeMoyenne}%</p>
            <p className="text-xs text-muted-foreground mt-1">sur tous les produits</p>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card-base p-5">
            <h3 className="text-sm font-bold text-foreground mb-4">Évolution CA & Bénéfice</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.caData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCA2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBen2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="mois"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <Tooltip
                  formatter={(v: number) => `${v.toLocaleString('fr-FR')} FCFA`}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="ca"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fill="url(#colorCA2)"
                  name="CA"
                />
                <Area
                  type="monotone"
                  dataKey="benefice"
                  stroke="#22c55e"
                  strokeWidth={3}
                  fill="url(#colorBen2)"
                  name="Bénéfice"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="card-base p-5">
            <h3 className="text-sm font-bold text-foreground mb-4">Répartition par catégorie</h3>
            {stats.categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={stats.categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => `${v.toLocaleString('fr-FR')} FCFA`}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                Aucune donnée sur la période
              </div>
            )}
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-base p-5">
            <h3 className="text-sm font-bold text-foreground mb-4">
              Ventes par jour de la semaine
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.ventesJour} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="jour"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar
                  dataKey="ventes"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                  name="Ventes (Qté)"
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card-base overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Top 5 produits</h3>
            </div>
            {stats.topProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground w-12">
                        #
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                        Produit
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                        Ventes
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                        CA (FCFA)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topProducts.map((p, idx) => (
                      <tr
                        key={idx}
                        className={`border-b border-border table-row-hover ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}
                      >
                        <td className="px-5 py-3 text-xs font-bold text-muted-foreground">
                          {idx + 1}
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-foreground text-sm line-clamp-1">
                            {p.nom}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{p.categorie}</p>
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-foreground tabular-nums">
                          {p.ventes}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-primary tabular-nums">
                          {p.ca.toLocaleString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                Aucune vente sur la période
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
