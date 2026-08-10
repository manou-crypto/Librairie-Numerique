'use client';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Download, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const CA_DATA: any[] = [];
const CATEGORIES_DATA: any[] = [];
const COLORS = ['#1D4ED8', '#F97316', '#16A34A', '#9333EA'];
const CLOTURES: any[] = [];

export default function FinancesPage() {
  const [period, setPeriod] = useState<'jour' | 'mois' | 'annee'>('mois');
  const totalCA = CA_DATA.reduce((s, d) => s + d.ca, 0);
  const totalBenefice = CA_DATA.reduce((s, d) => s + d.benefice, 0);
  const marge = totalCA > 0 ? Math.round((totalBenefice / totalCA) * 100) : 0;

  return (
    <AppLayout currentPath="/finances">
      <Topbar title="Tableau de bord financier" subtitle="Chiffre d'affaires, bénéfices et rapports" />
      <div className="px-6 py-6 max-w-screen-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
            {(['jour', 'mois', 'annee'] as const).map((p) => (<button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${period === p ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{p === 'annee' ? 'Année' : p.charAt(0).toUpperCase() + p.slice(1)}</button>))}
          </div>
          <button className="btn-secondary flex items-center gap-1.5 text-sm py-2"><Download size={14} /> Exporter rapport</button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="kpi-card-info"><div className="flex items-center gap-2 mb-2"><DollarSign size={16} className="text-info" /><p className="text-xs text-muted-foreground">Chiffre d'affaires</p></div><p className="text-xl font-bold text-foreground tabular-nums">{totalCA.toLocaleString('fr-FR')} FCFA</p><div className="flex items-center gap-1 mt-1"><TrendingUp size={12} className="text-positive" /><p className="text-xs text-positive">En temps réel</p></div></div>
          <div className="kpi-card-positive"><div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-positive" /><p className="text-xs text-muted-foreground">Bénéfice net</p></div><p className="text-xl font-bold text-foreground tabular-nums">{totalBenefice.toLocaleString('fr-FR')} FCFA</p><div className="flex items-center gap-1 mt-1"><TrendingUp size={12} className="text-positive" /><p className="text-xs text-positive">En temps réel</p></div></div>
          <div className="kpi-card-neutral"><div className="flex items-center gap-2 mb-2"><BarChart2 size={16} className="text-muted-foreground" /><p className="text-xs text-muted-foreground">Marge brute</p></div><p className="text-xl font-bold text-foreground tabular-nums">{marge}%</p><p className="text-xs text-muted-foreground mt-1">Objectif : 35%</p></div>
          <div className="kpi-card-warning"><div className="flex items-center gap-2 mb-2"><Calendar size={16} className="text-warning" /><p className="text-xs text-muted-foreground">CA aujourd'hui</p></div><p className="text-xl font-bold text-foreground tabular-nums">0 FCFA</p><div className="flex items-center gap-1 mt-1"><TrendingDown size={12} className="text-muted-foreground" /><p className="text-xs text-muted-foreground">Données serveur</p></div></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card-base p-5 lg:col-span-2">
            <h3 className="text-sm font-bold text-foreground mb-4">Évolution CA & Bénéfice</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={CA_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
                <Pie data={CATEGORIES_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {CATEGORIES_DATA.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                </Pie>
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
                <Tooltip formatter={(v: number) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card-base overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between"><h3 className="text-sm font-bold text-foreground">Clôtures journalières</h3><button className="btn-secondary flex items-center gap-1.5 text-sm py-1.5"><Download size={13} /> Export Excel</button></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/50"><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Date</th><th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Caisse 1</th><th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Caisse 2</th><th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Total</th><th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Statut</th></tr></thead>
              <tbody>
                {CLOTURES.map((c, idx) => (
                  <tr key={c.date} className={`border-b border-border table-row-hover ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}>
                    <td className="px-5 py-3 font-medium text-foreground">{c.date}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">{c.caisse1.toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">{c.caisse2.toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-5 py-3 text-right tabular-nums font-bold text-foreground">{c.total.toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-5 py-3 text-center"><span className={c.statut === 'en_cours' ? 'badge-draft' : 'badge-active'}>{c.statut === 'en_cours' ? 'En cours' : 'Clôturé'}</span></td>
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
