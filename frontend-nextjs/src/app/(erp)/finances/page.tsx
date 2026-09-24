'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart2,
  Download,
  Calendar,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
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
  financesService,
  KpiDataResponse,
  ClotureJournaliereItem,
} from '@/services/finances.service';
import { toast } from 'sonner';
import { useAppConfig } from '@/contexts/ConfigContext';
import { useSocket } from '@/contexts/SocketContext';
import { exportToCSV } from '@/utils/export';

const COLORS = ['#1D4ED8', '#F97316', '#16A34A', '#9333EA', '#EF4444', '#EAB308'];

export default function FinancesPage() {
  const { config } = useAppConfig();
  const { liveKpis } = useSocket();
  const devise = config?.devise || 'FCFA';
  const [period, setPeriod] = useState<'jour' | 'mois' | 'annee'>('mois');
  const [kpis, setKpis] = useState<KpiDataResponse | null>(null);
  const [clotures, setClotures] = useState<ClotureJournaliereItem[]>([]);
  const [caData, setCaData] = useState<{ mois: string; ca: number; benefice: number }[]>([]);
  const [categoriesData, setCategoriesData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      financesService.getDashboardKpis(period).catch(() => null),
      financesService.getHistoriqueClotures().catch(() => []),
      financesService.getDashboardCharts(period).catch(() => null),
    ]).then(([kpiData, cloturesData, chartsData]) => {
      if (kpiData) setKpis(kpiData);
      setClotures(cloturesData as ClotureJournaliereItem[]);
      if (chartsData) {
        setCaData(chartsData.caTrends);
        setCategoriesData(chartsData.categoriesDistribution);
      }
      setLoading(false);
    });
  }, [period]);

  const handleCloture = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const newCloture = await financesService.effectuerClotureJournaliere(today);
      setClotures([newCloture, ...clotures]);
      toast.success('Clôture journalière effectuée avec succès');

      const kpisData = await financesService.getDashboardKpis(period).catch(() => null);
      if (kpisData) setKpis(kpisData);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la clôture');
    }
  };

  const periodLabel = period === 'jour' ? "aujourd'hui" : period === 'annee' ? "de l'année" : 'du mois';
  const caAffiche = period === 'jour' ? (liveKpis?.caJour ?? kpis?.caJour ?? 0) : (kpis?.caPeriode ?? kpis?.caMoisTotal ?? 0);
  const totalBenefice = kpis?.beneficeBrutPeriode ?? (liveKpis?.beneficeBrutJour ?? kpis?.beneficeBrutJour ?? 0);
  const marge = kpis?.margeMoyennePourcent || 0;
  const caJour = liveKpis?.caJour ?? kpis?.caJour ?? 0;
  const dettes = kpis?.dettesFournisseurs ?? 0;

  const handleExportClotures = () => {
    if (clotures.length === 0) {
      toast.info('Aucune clôture à exporter');
      return;
    }
    const headers = [
      'Date Clôture',
      'Validé par',
      'Type Clôture',
      `CA HT (${devise})`,
      `TVA (${devise})`,
      `CA TTC (${devise})`,
      `Bénéfice Brut (${devise})`,
      'Statut',
    ];
    const data = clotures.map((c) => [
      new Date(c.dateCloture).toLocaleDateString('fr-FR'),
      c.utilisateurValidationNom || 'Système',
      c.typeCloture === 'AUTOMATIQUE' ? 'Automatique' : 'Manuelle',
      c.chiffreAffairesHt,
      c.tvaCollectee,
      c.chiffreAffairesTtc,
      c.beneficeBrutTotal,
      c.typeCloture === 'AUTOMATIQUE' ? 'Auto' : 'Validé',
    ]);
    exportToCSV({ filename: `rapport_financier_${period}`, headers, data });
    toast.success('Rapport financier exporté avec succès');
  };

  return (
    <AppLayout currentPath="/finances">
      <Topbar
        title="Tableau de bord financier"
        subtitle="Chiffre d'affaires, marges réelles, journal des clôtures et dettes"
      />
      <div className="px-6 py-6 max-w-screen-2xl mx-auto space-y-6">
        {/* Barre d'outils et lien vers Journal des Clôtures */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit border border-border">
            {(['jour', 'mois', 'annee'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${
                  period === p ? 'bg-card text-foreground shadow-sm font-semibold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p === 'annee' ? 'Année' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportClotures}
              className="btn-secondary flex items-center gap-1.5 text-sm py-2 px-3.5 shadow-sm"
              title="Exporter les clôtures financières en CSV"
            >
              <Download size={15} />
              <span>Exporter</span>
            </button>
            <a
              href="/finances/clotures"
              className="btn-primary flex items-center gap-1.5 text-sm py-2 px-3.5 shadow-sm"
            >
              <Calendar size={15} />
              <span>Journal complet des Clôtures</span>
            </a>
          </div>
        </div>

        {/* Grille des KPIs Financiers Réels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="kpi-card-info">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-semibold uppercase">CA {periodLabel}</p>
              <DollarSign size={16} className="text-info" />
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {caAffiche.toLocaleString('fr-FR')} {devise}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp size={12} className="text-positive" />
              <p className="text-xs text-positive">Ventes validées</p>
            </div>
          </div>

          <div className="kpi-card-positive">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-semibold uppercase">Bénéfice brut ({periodLabel})</p>
              <TrendingUp size={16} className="text-positive" />
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {totalBenefice.toLocaleString('fr-FR')} {devise}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-positive font-medium">Marge calculée</span>
            </div>
          </div>

          <div className="kpi-card-neutral">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-semibold uppercase">Marge moyenne</p>
              <BarChart2 size={16} className="text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{marge}%</p>
            <p className="text-xs text-muted-foreground mt-1">Calculée sur les ventes</p>
          </div>

          <div className="kpi-card-warning">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-semibold uppercase">CA Aujourd'hui</p>
              <Calendar size={16} className="text-warning" />
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {caJour.toLocaleString('fr-FR')} {devise}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-xs text-muted-foreground">Journée en cours</p>
            </div>
          </div>

          <div className={`p-4 rounded-xl border transition-all ${
            dettes > 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-300' : 'bg-card border-border text-foreground'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase">Dettes Fournisseurs</p>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-500/20 text-amber-700">Impayés</span>
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {dettes.toLocaleString('fr-FR')} {devise}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {dettes > 0 ? 'Factures achats à solder' : 'Tous les achats réglés'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card-base p-5 lg:col-span-2">
            <h3 className="text-sm font-bold text-foreground mb-4">Évolution CA & Bénéfice</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={caData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBenefice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="mois"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip formatter={(v: number) => `${v.toLocaleString('fr-FR')} FCFA`} />
                <Area
                  type="monotone"
                  dataKey="ca"
                  stroke="#1D4ED8"
                  strokeWidth={2}
                  fill="url(#colorCA)"
                  name="CA"
                />
                <Area
                  type="monotone"
                  dataKey="benefice"
                  stroke="#16A34A"
                  strokeWidth={2}
                  fill="url(#colorBenefice)"
                  name="Bénéfice"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="card-base p-5">
            <h3 className="text-sm font-bold text-foreground mb-4">Répartition par catégorie</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={categoriesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {categoriesData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>}
                />
                <Tooltip formatter={(v: number) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card-base overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">Dernières clôtures journalières</h3>
              <p className="text-xs text-muted-foreground">Consolidation des recettes et marges par journée comptable</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/finances/clotures"
                className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
              >
                <span>Voir le Journal complet ({clotures.length})</span>
              </a>
              <button
                onClick={handleCloture}
                className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3"
              >
                Clôturer aujourd'hui
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Date Clôture
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Validateur / Type
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                    CA HT
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                    TVA
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Total TTC
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Bénéfice Brut
                  </th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      <Loader2 className="animate-spin mx-auto mb-2" size={24} /> Chargement des
                      clôtures...
                    </td>
                  </tr>
                ) : clotures.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      Aucune clôture enregistrée.
                    </td>
                  </tr>
                ) : (
                  clotures.slice(0, 10).map((c, idx) => {
                    const isAuto = c.typeCloture === 'AUTOMATIQUE';
                    return (
                      <tr
                        key={c.id}
                        className={`border-b border-border table-row-hover ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}
                      >
                        <td className="px-5 py-3 font-medium text-foreground">
                          {new Date(c.dateCloture).toLocaleDateString('fr-FR', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                          })}
                        </td>
                        <td className="px-5 py-3 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {c.utilisateurValidationNom || 'Système'}
                          </span>
                          <span className="ml-1 text-[10px] text-muted-foreground">
                            {isAuto ? '(00:00 Auto)' : '(Manuelle)'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">
                          {c.chiffreAffairesHt.toLocaleString('fr-FR')} {devise}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">
                          {c.tvaCollectee.toLocaleString('fr-FR')} {devise}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums font-bold text-foreground">
                          {c.chiffreAffairesTtc.toLocaleString('fr-FR')} {devise}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums font-semibold text-emerald-600">
                          +{c.beneficeBrutTotal.toLocaleString('fr-FR')} {devise}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            isAuto ? 'bg-amber-500/10 text-amber-700' : 'bg-emerald-500/10 text-emerald-700'
                          }`}>
                            {isAuto ? 'Auto' : 'Validé'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
