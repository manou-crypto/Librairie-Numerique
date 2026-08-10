'use client';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { Search, AlertTriangle, TrendingDown, Package, Download } from 'lucide-react';

interface StockItem {
  id: number; ref: string; name: string; category: string; stockActuel: number; stockMin: number; stockMax: number; unite: string; prixUnitaire: number; valeurStock: number; statut: 'normal' | 'alerte' | 'rupture' | 'surstock'; dernierMouvement: string;
}

const STOCK_DATA: StockItem[] = [];

const STATUT_CONFIG = {
  normal: { label: 'Normal', className: 'badge-active' },
  alerte: { label: 'Alerte', className: 'badge-alert' },
  rupture: { label: 'Rupture', className: 'badge-rupture' },
  surstock: { label: 'Surstock', className: 'badge-draft' },
};

export default function StockPage() {
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');

  const filtered = STOCK_DATA.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.ref.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === 'all' || item.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const totalValeur = STOCK_DATA.reduce((sum, i) => sum + i.valeurStock, 0);
  const ruptures = STOCK_DATA.filter(i => i.statut === 'rupture').length;
  const alertes = STOCK_DATA.filter(i => i.statut === 'alerte').length;
  const surstocks = STOCK_DATA.filter(i => i.statut === 'surstock').length;

  return (
    <AppLayout currentPath="/stock">
      <Topbar title="Stock & Inventaire" subtitle="Suivi des niveaux de stock et alertes" />
      <div className="px-6 py-6 max-w-screen-2xl mx-auto space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="kpi-card-info"><p className="text-xs text-muted-foreground mb-1">Valeur totale du stock</p><p className="text-xl font-bold text-foreground tabular-nums">{totalValeur.toLocaleString('fr-FR')} FCFA</p><p className="text-xs text-muted-foreground mt-1">{STOCK_DATA.length} références</p></div>
          <div className="kpi-card-negative"><div className="flex items-center gap-2 mb-1"><TrendingDown size={16} className="text-negative" /><p className="text-xs text-muted-foreground">Ruptures de stock</p></div><p className="text-xl font-bold text-negative tabular-nums">{ruptures}</p><p className="text-xs text-muted-foreground mt-1">produits épuisés</p></div>
          <div className="kpi-card-warning"><div className="flex items-center gap-2 mb-1"><AlertTriangle size={16} className="text-warning" /><p className="text-xs text-muted-foreground">Alertes stock bas</p></div><p className="text-xl font-bold text-warning tabular-nums">{alertes}</p><p className="text-xs text-muted-foreground mt-1">sous le seuil minimum</p></div>
          <div className="kpi-card-positive"><div className="flex items-center gap-2 mb-1"><Package size={16} className="text-positive" /><p className="text-xs text-muted-foreground">Surstocks</p></div><p className="text-xl font-bold text-positive tabular-nums">{surstocks}</p><p className="text-xs text-muted-foreground mt-1">au-dessus du maximum</p></div>
        </div>
        <div className="card-base overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit ou référence..." className="input-field pl-9 text-sm" /></div>
            <div className="flex items-center gap-2">
              <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} className="input-field text-sm w-auto"><option value="all">Tous les statuts</option><option value="normal">Normal</option><option value="alerte">Alerte</option><option value="rupture">Rupture</option><option value="surstock">Surstock</option></select>
              <button className="btn-secondary flex items-center gap-1.5 text-sm py-2"><Download size={14} /> Exporter</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/50"><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Référence</th><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Produit</th><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Catégorie</th><th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Stock actuel</th><th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Min / Max</th><th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Valeur stock</th><th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Statut</th><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Dernier mouvement</th></tr></thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={item.id} className={`border-b border-border table-row-hover ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{item.ref}</td>
                    <td className="px-5 py-3 font-medium text-foreground">{item.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{item.category}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold text-foreground">{item.stockActuel} <span className="text-xs text-muted-foreground font-normal">{item.unite}</span></td>
                    <td className="px-5 py-3 text-right tabular-nums text-muted-foreground text-xs">{item.stockMin} / {item.stockMax}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold text-foreground">{item.valeurStock.toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-5 py-3 text-center"><span className={STATUT_CONFIG[item.statut].className}>{STATUT_CONFIG[item.statut].label}</span></td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{item.dernierMouvement}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="py-16 text-center"><Package size={32} className="mx-auto text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground">Aucun résultat trouvé</p></div>}
          <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground"><span>{filtered.length} résultat{filtered.length !== 1 ? 's' : ''} sur {STOCK_DATA.length}</span><span>Dernière mise à jour : 03/08/2026 15:11</span></div>
        </div>
      </div>
    </AppLayout>
  );
}
