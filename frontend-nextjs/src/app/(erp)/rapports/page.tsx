'use client';
import React from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { Download, TrendingUp, ShoppingBag, Package, DollarSign, Calendar } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const caData: any[] = [];
const categoryData: any[] = [];
const topProducts: any[] = [];
const ventesJour: any[] = [];

type Period = 'semaine' | 'mois' | 'trimestre' | 'annee';

export default function RapportsPage() {
  const periodLabels: Record<Period, string> = { semaine: 'Cette semaine', mois: 'Ce mois', trimestre: 'Ce trimestre', annee: 'Cette année' };

  return (
    <AppLayout currentPath="/rapports">
      <Topbar title="Rapports" subtitle="Analyses et statistiques de performance" />
      <div className="px-6 py-6 max-w-screen-2xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2"><Calendar size={15} className="text-muted-foreground" /></div>
          <div className="flex items-center gap-2"><button className="btn-secondary flex items-center gap-1.5 text-sm py-2"><Download size={14} /> Exporter PDF</button><button className="btn-secondary flex items-center gap-1.5 text-sm py-2"><Download size={14} /> Exporter Excel</button></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="kpi-card-info"><div className="flex items-center justify-between mb-2"><p className="text-xs text-muted-foreground">Chiffre d'affaires</p><DollarSign size={16} className="text-primary" /></div><p className="text-2xl font-bold text-foreground tabular-nums">0 FCFA</p><p className="text-xs text-positive mt-1">Données temps réel</p></div>
          <div className="kpi-card-positive"><div className="flex items-center justify-between mb-2"><p className="text-xs text-muted-foreground">Bénéfice net</p><TrendingUp size={16} className="text-positive" /></div><p className="text-2xl font-bold text-positive tabular-nums">0 FCFA</p><p className="text-xs text-positive mt-1">Données temps réel</p></div>
          <div className="kpi-card-neutral"><div className="flex items-center justify-between mb-2"><p className="text-xs text-muted-foreground">Ventes totales</p><ShoppingBag size={16} className="text-foreground" /></div><p className="text-2xl font-bold text-foreground tabular-nums">0</p><p className="text-xs text-muted-foreground mt-1">transactions ce mois</p></div>
          <div className="kpi-card-warning"><div className="flex items-center justify-between mb-2"><p className="text-xs text-muted-foreground">Marge moyenne</p><Package size={16} className="text-warning" /></div><p className="text-2xl font-bold text-warning tabular-nums">0%</p><p className="text-xs text-muted-foreground mt-1">sur tous les produits</p></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card-base p-5">
            <h3 className="text-sm font-bold text-foreground mb-4">Évolution CA & Bénéfice</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={caData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs><linearGradient id="colorCA2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0} /></linearGradient><linearGradient id="colorBen2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="mois" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} /><Tooltip formatter={(v: number) => `${v.toLocaleString('fr-FR')} FCFA`} />
                <Area type="monotone" dataKey="ca" stroke="#2563eb" strokeWidth={2} fill="url(#colorCA2)" name="CA" /><Area type="monotone" dataKey="benefice" stroke="#22c55e" strokeWidth={2} fill="url(#colorBen2)" name="Bénéfice" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="card-base p-5">
            <h3 className="text-sm font-bold text-foreground mb-4">Répartition par catégorie</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart><Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">{categoryData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip formatter={(v: number) => `${v}%`} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} /></PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-base p-5">
            <h3 className="text-sm font-bold text-foreground mb-4">Ventes par jour de la semaine</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ventesJour} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" /><XAxis dataKey="jour" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="ventes" fill="#2563eb" radius={[4, 4, 0, 0]} name="Ventes" /></BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card-base overflow-hidden">
            <div className="px-5 py-4 border-b border-border"><h3 className="text-sm font-bold text-foreground">Top 5 produits</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/50"><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">#</th><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Produit</th><th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Ventes</th><th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">CA (FCFA)</th></tr></thead>
                <tbody>{topProducts.map((p, idx) => (<tr key={idx} className={`border-b border-border table-row-hover ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}><td className="px-5 py-3 text-xs font-bold text-muted-foreground">{idx + 1}</td><td className="px-5 py-3"><p className="font-medium text-foreground text-sm">{p.nom}</p><p className="text-xs text-muted-foreground">{p.categorie}</p></td><td className="px-5 py-3 text-right font-semibold text-foreground tabular-nums">{p.ventes}</td><td className="px-5 py-3 text-right font-semibold text-primary tabular-nums">{p.ca.toLocaleString('fr-FR')} FCFA</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
