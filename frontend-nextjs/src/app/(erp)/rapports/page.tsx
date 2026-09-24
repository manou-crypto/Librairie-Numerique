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
  FileSpreadsheet,
  Printer,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  Layers,
  Archive,
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
import {
  rapportsService,
  RapportsStats,
  AchatsStats,
  StocksStats,
} from '@/services/rapports.service';
import { useAppConfig } from '@/contexts/ConfigContext';
import { toast } from 'sonner';
import { exportToCSV } from '@/utils/export';

type Period = 'semaine' | 'mois' | 'trimestre' | 'annee';

const PIE_COLORS = ['#2563eb', '#f97316', '#22c55e', '#eab308', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b'];

export default function RapportsPage() {
  const { config } = useAppConfig();
  const devise = config?.devise || 'FCFA';

  const periodLabels: Record<Period, string> = {
    semaine: 'Cette semaine (7 jours)',
    mois: 'Ce mois',
    trimestre: 'Ce trimestre (3 mois)',
    annee: 'Cette année',
  };

  const [period, setPeriod] = useState<Period>('semaine');
  const [tab, setTab] = useState<'ventes' | 'achats' | 'stocks'>('ventes');
  const [loading, setLoading] = useState(true);

  // Données des 3 onglets
  const [ventesStats, setVentesStats] = useState<RapportsStats | null>(null);
  const [achatsStats, setAchatsStats] = useState<AchatsStats | null>(null);
  const [stocksStats, setStocksStats] = useState<StocksStats | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    if (tab === 'ventes') {
      rapportsService
        .getStats(period)
        .then((data) => {
          if (isMounted) {
            setVentesStats(data);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error(err);
          if (isMounted) setLoading(false);
        });
    } else if (tab === 'achats') {
      rapportsService
        .getAchatsStats(period)
        .then((data) => {
          if (isMounted) {
            setAchatsStats(data);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error(err);
          if (isMounted) setLoading(false);
        });
    } else if (tab === 'stocks') {
      rapportsService
        .getStocksStats()
        .then((data) => {
          if (isMounted) {
            setStocksStats(data);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error(err);
          if (isMounted) setLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [tab, period]);

  // Export CSV fonctionnel
  const handleExportCSV = () => {
    let filename = `rapport_${tab}_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (tab === 'ventes') {
      if (!ventesStats) return;
      headers = ['Produit', 'Catégorie', 'Nombre Ventes', 'CA (FCFA)'];
      rows = (ventesStats.topProducts || []).map((p) => [p.nom, p.categorie, p.ventes, p.ca]);
    } else if (tab === 'achats') {
      if (!achatsStats) return;
      headers = ['Facture', 'Fournisseur', 'Acheteur', 'Date', 'Total TTC (FCFA)', 'Payé (FCFA)', 'Reste à payer', 'Statut'];
      rows = (achatsStats.recentAchats || []).map((a) => [
        a.facture,
        a.fournisseur,
        a.acheteur,
        new Date(a.date).toLocaleDateString('fr-FR'),
        a.totalTtc,
        a.paye,
        a.resteAPayer,
        a.statut,
      ]);
    } else if (tab === 'stocks') {
      if (!stocksStats) return;
      headers = ['Mouvement ID', 'Produit', 'Type Mouvement', 'Quantité', 'Date', 'Opérateur'];
      rows = (stocksStats.derniersMouvements || []).map((m) => [
        m.id,
        m.produit,
        m.type,
        m.quantite,
        new Date(m.date).toLocaleString('fr-FR'),
        m.operateur,
      ]);
    }

    if (rows.length === 0) {
      toast.info('Aucune donnée à exporter');
      return;
    }

    exportToCSV({ filename, headers, data: rows });
    toast.success('Rapport exporté avec succès !');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout currentPath="/rapports">
      <Topbar title="Rapports d'activité" subtitle="Analyses complètes, traçabilité et statistiques consolidées" />
      <div className="px-6 py-6 max-w-screen-2xl mx-auto space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border">
            {(['ventes', 'achats', 'stocks'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all capitalize ${
                  tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'ventes' ? 'Rapport Ventes' : t === 'achats' ? 'Rapport Achats' : 'Rapport Stocks & Audit'}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {tab !== 'stocks' && (
              <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-lg text-sm">
                <Calendar size={15} className="text-muted-foreground" />
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as Period)}
                  className="bg-transparent font-medium text-foreground focus:outline-none cursor-pointer text-sm"
                >
                  {(Object.keys(periodLabels) as Period[]).map((p) => (
                    <option key={p} value={p}>
                      {periodLabels[p]}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {loading && <Loader2 size={16} className="animate-spin text-primary" />}

            <button
              onClick={handleExportCSV}
              className="btn-secondary flex items-center gap-1.5 text-sm py-2 px-3"
              title="Exporter sous format CSV / Excel"
            >
              <FileSpreadsheet size={15} />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="btn-secondary flex items-center gap-1.5 text-sm py-2 px-3"
              title="Imprimer ou enregistrer en PDF"
            >
              <Printer size={15} />
              <span>Imprimer / PDF</span>
            </button>
          </div>
        </div>

        {/* -------------------- ONGLET 1 : VENTES -------------------- */}
        {tab === 'ventes' && ventesStats && (
          <div className="space-y-6">
            {/* KPIs Ventes */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="kpi-card-info">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Chiffre d'affaires</p>
                  <DollarSign size={16} className="text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  {ventesStats.chiffreAffaires.toLocaleString('fr-FR')} {devise}
                </p>
                <p className="text-xs text-positive mt-1">Sur la période ({periodLabels[period].toLowerCase()})</p>
              </div>
              <div className="kpi-card-positive">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Bénéfice net</p>
                  <TrendingUp size={16} className="text-positive" />
                </div>
                <p className="text-2xl font-bold text-positive tabular-nums">
                  {ventesStats.beneficeNet.toLocaleString('fr-FR')} {devise}
                </p>
                <p className="text-xs text-positive mt-1">Marge brute consolidée</p>
              </div>
              <div className="kpi-card-neutral">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Transactions</p>
                  <ShoppingBag size={16} className="text-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground tabular-nums">{ventesStats.ventesTotales}</p>
                <p className="text-xs text-muted-foreground mt-1">Tickets de caisse validés</p>
              </div>
              <div className="kpi-card-warning">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Taux de marge moyen</p>
                  <Package size={16} className="text-warning" />
                </div>
                <p className="text-2xl font-bold text-warning tabular-nums">{ventesStats.margeMoyenne}%</p>
                <p className="text-xs text-muted-foreground mt-1">Rapport bénéfice / CA</p>
              </div>
            </div>

            {/* Graphiques Ventes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 card-base p-5">
                <h3 className="text-sm font-bold text-foreground mb-4">Évolution CA & Bénéfice</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={ventesStats.caData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCA2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorBen2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      axisLine={false}
                      tickLine={false}
                      dx={-10}
                    />
                    <Tooltip formatter={(v: number) => `${v.toLocaleString('fr-FR')} ${devise}`} />
                    <Area type="monotone" dataKey="ca" stroke="#2563eb" strokeWidth={2.5} fill="url(#colorCA2)" name="CA" />
                    <Area type="monotone" dataKey="benefice" stroke="#22c55e" strokeWidth={2.5} fill="url(#colorBen2)" name="Bénéfice" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="card-base p-5">
                <h3 className="text-sm font-bold text-foreground mb-4">Répartition par catégorie</h3>
                {ventesStats.categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={ventesStats.categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {ventesStats.categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: number) => `${v.toLocaleString('fr-FR')} ${devise}`} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
                    Aucune donnée sur la période
                  </div>
                )}
              </div>
            </div>

            {/* Top Produits */}
            <div className="card-base overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-sm font-bold text-foreground">Top 5 Produits les plus rentables</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground w-12">#</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Produit</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Quantité vendue</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">CA généré</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {ventesStats.topProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3 text-xs font-bold text-muted-foreground">{idx + 1}</td>
                        <td className="px-5 py-3">
                          <p className="font-semibold text-foreground text-sm">{p.nom}</p>
                          <p className="text-xs text-muted-foreground">{p.categorie}</p>
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-foreground tabular-nums">{p.ventes}</td>
                        <td className="px-5 py-3 text-right font-bold text-primary tabular-nums">
                          {p.ca.toLocaleString('fr-FR')} {devise}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* -------------------- ONGLET 2 : ACHATS -------------------- */}
        {tab === 'achats' && achatsStats && (
          <div className="space-y-6">
            {/* KPIs Achats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="kpi-card-info">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Total Achats TTC</p>
                  <DollarSign size={16} className="text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  {achatsStats.totalAchatsTtc.toLocaleString('fr-FR')} {devise}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{achatsStats.commandesCount} factures d'achat</p>
              </div>

              <div className="kpi-card-positive">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Total Réglé</p>
                  <CheckCircle2 size={16} className="text-positive" />
                </div>
                <p className="text-2xl font-bold text-positive tabular-nums">
                  {achatsStats.totalPaye.toLocaleString('fr-FR')} {devise}
                </p>
                <p className="text-xs text-positive mt-1">Montant déjà décaissé</p>
              </div>

              <div className="kpi-card-warning">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase text-amber-700">Dettes Fournisseurs</p>
                  <AlertTriangle size={16} className="text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-amber-600 tabular-nums">
                  {achatsStats.dettesTotal.toLocaleString('fr-FR')} {devise}
                </p>
                <p className="text-xs text-amber-700 mt-1">Restes à solder aux fournisseurs</p>
              </div>

              <div className="kpi-card-neutral">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Articles Réceptionnés</p>
                  <Package size={16} className="text-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  {achatsStats.totalArticlesAchetes}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Unités ajoutées au stock</p>
              </div>
            </div>

            {/* Dépenses par fournisseur & Graphique */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 card-base p-5">
                <h3 className="text-sm font-bold text-foreground mb-4">Évolution des achats</h3>
                {achatsStats.chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={achatsStats.chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip formatter={(v: number) => `${v.toLocaleString('fr-FR')} ${devise}`} />
                      <Bar dataKey="montant" fill="#f97316" radius={[4, 4, 0, 0]} name="Montant TTC" maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-60 flex items-center justify-center text-sm text-muted-foreground">
                    Aucun achat enregistré sur cette période
                  </div>
                )}
              </div>

              <div className="card-base p-5">
                <h3 className="text-sm font-bold text-foreground mb-3">Répartition par fournisseur</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {achatsStats.suppliersData.map((s, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border border-border bg-muted/20 text-xs space-y-1">
                      <div className="flex justify-between font-semibold text-foreground">
                        <span>{s.nom}</span>
                        <span>{s.totalTtc.toLocaleString('fr-FR')} {devise}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>{s.commandes} commandes</span>
                        {s.resteAPayer > 0 ? (
                          <span className="text-amber-600 font-medium">Dette : {s.resteAPayer.toLocaleString('fr-FR')} {devise}</span>
                        ) : (
                          <span className="text-green-600 font-medium">Soldé</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Audit Table des Derniers Achats */}
            <div className="card-base overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-sm font-bold text-foreground">Journal récent des factures d'achat</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">N° Facture</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Fournisseur</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Acheteur</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Date</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Total TTC</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Payé</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Reste</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {achatsStats.recentAchats.map((a) => (
                      <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3 font-semibold text-foreground">{a.facture}</td>
                        <td className="px-5 py-3 text-muted-foreground">{a.fournisseur}</td>
                        <td className="px-5 py-3 text-muted-foreground text-xs">{a.acheteur}</td>
                        <td className="px-5 py-3 text-muted-foreground text-xs">{new Date(a.date).toLocaleDateString('fr-FR')}</td>
                        <td className="px-5 py-3 text-right font-bold text-foreground tabular-nums">
                          {a.totalTtc.toLocaleString('fr-FR')} {devise}
                        </td>
                        <td className="px-5 py-3 text-right text-green-600 font-medium tabular-nums">
                          {a.paye.toLocaleString('fr-FR')} {devise}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums">
                          {a.resteAPayer > 0 ? (
                            <span className="text-amber-600 font-semibold">{a.resteAPayer.toLocaleString('fr-FR')} {devise}</span>
                          ) : (
                            <span className="text-green-600 text-xs font-semibold">Soldé</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            a.statut === 'RECU' ? 'bg-green-500/10 text-green-700' : 'bg-amber-500/10 text-amber-700'
                          }`}>
                            {a.statut}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* -------------------- ONGLET 3 : STOCKS -------------------- */}
        {tab === 'stocks' && stocksStats && (
          <div className="space-y-6">
            {/* KPIs Stocks */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="kpi-card-info">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Valeur d'Achat du Stock</p>
                  <DollarSign size={16} className="text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  {stocksStats.valeurStockAchat.toLocaleString('fr-FR')} {devise}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{stocksStats.totalPieces} articles en stock</p>
              </div>

              <div className="kpi-card-positive">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Valeur Marchande (Vente)</p>
                  <TrendingUp size={16} className="text-positive" />
                </div>
                <p className="text-2xl font-bold text-positive tabular-nums">
                  {stocksStats.valeurStockVente.toLocaleString('fr-FR')} {devise}
                </p>
                <p className="text-xs text-positive mt-1">Potentiel de recettes</p>
              </div>

              <div className="kpi-card-neutral">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Plus-value Potentielle</p>
                  <Layers size={16} className="text-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground tabular-nums">
                  +{stocksStats.plusValueLatente.toLocaleString('fr-FR')} {devise}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Marge brute latente</p>
              </div>

              <div className="kpi-card-warning">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase text-amber-700">Ruptures & Alertes</p>
                  <AlertTriangle size={16} className="text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-amber-600 tabular-nums">
                  {stocksStats.rupturesCount} <span className="text-sm font-normal text-muted-foreground">épuisés</span> / {stocksStats.alertesCount} <span className="text-sm font-normal text-muted-foreground">critiques</span>
                </p>
                <p className="text-xs text-amber-700 mt-1">Articles nécessitant approvisionnement</p>
              </div>
            </div>

            {/* Répartition par catégorie */}
            <div className="card-base p-5">
              <h3 className="text-sm font-bold text-foreground mb-4">Valorisation du stock par catégorie</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {stocksStats.categoriesDistribution.map((cat, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-border bg-muted/10 space-y-1">
                    <p className="text-xs font-bold text-foreground truncate">{cat.name}</p>
                    <p className="text-base font-extrabold text-primary tabular-nums">
                      {cat.valeur.toLocaleString('fr-FR')} {devise}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{cat.quantite} pièces</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit des derniers mouvements de stock */}
            <div className="card-base overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-sm font-bold text-foreground">Audit chronologique des 15 derniers mouvements de stock</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Date & Heure</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Produit</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Type de Mouvement</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Quantité</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Opérateur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {stocksStats.derniersMouvements.map((m) => {
                      const isEntry = m.type.startsWith('ENTREE');
                      return (
                        <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3 text-xs text-muted-foreground">
                            {new Date(m.date).toLocaleString('fr-FR')}
                          </td>
                          <td className="px-5 py-3 font-semibold text-foreground">{m.produit}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isEntry ? 'bg-green-500/10 text-green-700' : 'bg-blue-500/10 text-blue-700'
                            }`}>
                              {m.type}
                            </span>
                          </td>
                          <td className={`px-5 py-3 text-right font-bold tabular-nums ${isEntry ? 'text-green-600' : 'text-blue-600'}`}>
                            {isEntry ? `+${m.quantite}` : `-${m.quantite}`}
                          </td>
                          <td className="px-5 py-3 text-xs text-muted-foreground font-medium">
                            {m.operateur || 'Système'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
