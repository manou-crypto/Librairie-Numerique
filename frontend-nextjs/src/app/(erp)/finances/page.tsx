'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Download, Calendar, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { financesService, KpiDataResponse, ClotureJournaliereItem } from '@/services/finances.service';
import { toast } from 'sonner';
import { useAppConfig } from '@/contexts/ConfigContext';
import { useSocket } from '@/contexts/SocketContext';

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
    Promise.all([
      financesService.getDashboardKpis().catch(() => null),
      financesService.getHistoriqueClotures().catch(() => []),
      financesService.getDashboardCharts().catch(() => null)
    ]).then(([kpiData, cloturesData, chartsData]) => {
      if (kpiData) setKpis(kpiData);
      setClotures(cloturesData as ClotureJournaliereItem[]);
      if (chartsData) {
        setCaData(chartsData.caTrends);
        setCategoriesData(chartsData.categoriesDistribution);
      }
      setLoading(false);
    });
  }, []);

  const handleCloture = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const newCloture = await financesService.effectuerClotureJournaliere(today);
      setClotures([newCloture, ...clotures]);
      toast.success("Clôture journalière effectuée avec succès");
      
      const kpisData = await financesService.getDashboardKpis().catch(() => null);
      if (kpisData) setKpis(kpisData);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la clôture");
    }
  };

  const totalCA = liveKpis?.caMoisTotal ?? kpis?.caMoisTotal ?? 0;
  const totalBenefice = liveKpis?.beneficeBrutJour ?? kpis?.beneficeBrutJour ?? 0;
  const marge = kpis?.margeMoyennePourcent || 0;
  const caJour = liveKpis?.caJour ?? kpis?.caJour ?? 0;

  return (
    <AppLayout currentPath="/finances">
      <Topbar title="Tableau de bord financier" subtitle="Chiffre d'affaires, bénéfices et rapports" />
      <div className="px-6 py-6 max-w-screen-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
            {(['jour', 'mois', 'annee'] as const).map((p) => (<button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${period === p ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{p === 'annee' ? 'Année' : p.charAt(0).toUpperCase() + p.slice(1)}</button>))}
          </div>
          <button onClick={() => toast.info("L'export du rapport sera bientôt disponible")} className="btn-secondary flex items-center gap-1.5 text-sm py-2"><Download size={14} /> Exporter rapport</button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="kpi-card-info"><div className="flex items-center gap-2 mb-2"><DollarSign size={16} className="text-info" /><p className="text-xs text-muted-foreground">CA du mois</p></div><p className="text-xl font-bold text-foreground tabular-nums">{totalCA.toLocaleString('fr-FR')} {devise}</p><div className="flex items-center gap-1 mt-1"><TrendingUp size={12} className="text-positive" /><p className="text-xs text-positive">En temps réel</p></div></div>
          <div className="kpi-card-positive"><div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-positive" /><p className="text-xs text-muted-foreground">Bénéfice brut (jour)</p></div><p className="text-xl font-bold text-foreground tabular-nums">{totalBenefice.toLocaleString('fr-FR')} {devise}</p><div className="flex items-center gap-1 mt-1"><TrendingUp size={12} className="text-positive" /><p className="text-xs text-positive">En temps réel</p></div></div>
          <div className="kpi-card-neutral"><div className="flex items-center gap-2 mb-2"><BarChart2 size={16} className="text-muted-foreground" /><p className="text-xs text-muted-foreground">Marge moyenne</p></div><p className="text-xl font-bold text-foreground tabular-nums">{marge}%</p><p className="text-xs text-muted-foreground mt-1">Objectif : 35%</p></div>
          <div className="kpi-card-warning"><div className="flex items-center gap-2 mb-2"><Calendar size={16} className="text-warning" /><p className="text-xs text-muted-foreground">CA aujourd'hui</p></div><p className="text-xl font-bold text-foreground tabular-nums">{caJour.toLocaleString('fr-FR')} {devise}</p><div className="flex items-center gap-1 mt-1"><TrendingUp size={12} className="text-positive" /><p className="text-xs text-positive">En temps réel</p></div></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card-base p-5 lg:col-span-2">
            <h3 className="text-sm font-bold text-foreground mb-4">Évolution CA & Bénéfice</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={caData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCA" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.15} /><stop offset="95%" stopColor="#1D4ED8" stopOpacity={0} /></linearGradient>
                  <linearGradient id="colorBenefice" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16A34A" stopOpacity={0.15} /><stop offset="95%" stopColor="#16A34A" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString('fr-FR')} FCFA`} />
                <Area type="monotone" dataKey="ca" stroke="#1D4ED8" strokeWidth={2} fill="url(#colorCA)" name="CA" />
                <Area type="monotone" dataKey="benefice" stroke="#16A34A" strokeWidth={2} fill="url(#colorBenefice)" name="Bénéfice" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="card-base p-5">
            <h3 className="text-sm font-bold text-foreground mb-4">Répartition par catégorie</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoriesData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {categoriesData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
                <Tooltip formatter={(v: number) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card-base overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Clôtures journalières</h3>
            <div className="flex items-center gap-3">
              <button onClick={handleCloture} className="btn-primary flex items-center gap-1.5 text-sm py-1.5">Clôturer la journée</button>
              <button onClick={() => toast.info("Export Excel bientôt disponible")} className="btn-secondary flex items-center gap-1.5 text-sm py-1.5"><Download size={13} /> Export Excel</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/50"><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Date Clôture</th><th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">CA HT</th><th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">TVA Collectée</th><th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Total TTC</th><th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Statut</th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground"><Loader2 className="animate-spin mx-auto mb-2" size={24} /> Chargement des clôtures...</td></tr>
                ) : clotures.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Aucune clôture trouvée.</td></tr>
                ) : clotures.map((c, idx) => (
                  <tr key={c.id} className={`border-b border-border table-row-hover ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}>
                    <td className="px-5 py-3 font-medium text-foreground">{new Date(c.dateCloture).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">{c.chiffreAffairesHt.toLocaleString('fr-FR')} {devise}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">{c.tvaCollectee.toLocaleString('fr-FR')} {devise}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-bold text-foreground">{c.chiffreAffairesTtc.toLocaleString('fr-FR')} {devise}</td>
                    <td className="px-5 py-3 text-center"><span className="badge-active">Clôturé</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
