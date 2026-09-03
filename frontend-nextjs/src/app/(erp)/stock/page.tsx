'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { Search, AlertTriangle, TrendingDown, Package, Download, Loader2 } from 'lucide-react';
import { stockService, StockItem } from '@/services/stock.service';
import { toast } from 'sonner';

const STATUT_CONFIG: Record<string, {label: string, className: string}> = {
  normal: { label: 'Normal', className: 'badge-active' },
  alerte: { label: 'Alerte', className: 'badge-alert' },
  rupture: { label: 'Rupture', className: 'badge-rupture' },
  surstock: { label: 'Surstock', className: 'badge-draft' },
};

export default function StockPage() {
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    stockService.getStocks()
      .then(res => setStocks(res || []))
      .catch(err => toast.error("Erreur lors du chargement des stocks"))
      .finally(() => setLoading(false));
  }, []);

  const getComputedStatut = (item: StockItem) => {
    if (item.estEnRupture) return 'rupture';
    if (item.estEnAlerte) return 'alerte';
    return 'normal'; // Assume no surstock flag from backend yet
  };

  const filtered = stocks.filter((item) => {
    const matchSearch = item.produitLibelle.toLowerCase().includes(search.toLowerCase()) || item.produitReference.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === 'all' || getComputedStatut(item) === filterStatut;
    return matchSearch && matchStatut;
  });

  const totalValeur = 0; // Not available directly in API yet
  const ruptures = stocks.filter(i => i.estEnRupture).length;
  const alertes = stocks.filter(i => i.estEnAlerte).length;
  const surstocks = 0;

  return (
    <AppLayout currentPath="/stock">
      <Topbar title="Stock & Inventaire" subtitle="Suivi des niveaux de stock et alertes" />
      <div className="px-6 py-6 max-w-screen-2xl mx-auto space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="kpi-card-info"><p className="text-xs text-muted-foreground mb-1">Total références</p><p className="text-xl font-bold text-foreground tabular-nums">{stocks.length}</p><p className="text-xs text-muted-foreground mt-1">produits en base</p></div>
          <div className="kpi-card-negative"><div className="flex items-center gap-2 mb-1"><TrendingDown size={16} className="text-negative" /><p className="text-xs text-muted-foreground">Ruptures de stock</p></div><p className="text-xl font-bold text-negative tabular-nums">{ruptures}</p><p className="text-xs text-muted-foreground mt-1">produits épuisés</p></div>
          <div className="kpi-card-warning"><div className="flex items-center gap-2 mb-1"><AlertTriangle size={16} className="text-warning" /><p className="text-xs text-muted-foreground">Alertes stock bas</p></div><p className="text-xl font-bold text-warning tabular-nums">{alertes}</p><p className="text-xs text-muted-foreground mt-1">sous le seuil minimum</p></div>
          <div className="kpi-card-positive"><div className="flex items-center gap-2 mb-1"><Package size={16} className="text-positive" /><p className="text-xs text-muted-foreground">En stock</p></div><p className="text-xl font-bold text-positive tabular-nums">{stocks.length - ruptures}</p><p className="text-xs text-muted-foreground mt-1">produits disponibles</p></div>
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
              <thead><tr className="border-b border-border bg-muted/50"><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Référence</th><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Produit</th><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Catégorie</th><th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Stock actuel</th><th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Seuil Alerte</th><th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Statut</th><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Dernier mouvement</th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground"><Loader2 className="animate-spin mx-auto mb-2" size={24} /> Chargement du stock...</td></tr>
                ) : filtered.map((item, idx) => {
                  const st = getComputedStatut(item);
                  return (
                  <tr key={item.id} className={`border-b border-border table-row-hover ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{item.produitReference}</td>
                    <td className="px-5 py-3 font-medium text-foreground">{item.produitLibelle}</td>
                    <td className="px-5 py-3 text-muted-foreground">{item.categoryName || '—'}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold text-foreground">{item.quantiteEnStock}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-muted-foreground text-xs">{item.seuilAlerte}</td>
                    <td className="px-5 py-3 text-center"><span className={STATUT_CONFIG[st].className}>{STATUT_CONFIG[st].label}</span></td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{item.dateDerniereEntree ? new Date(item.dateDerniereEntree).toLocaleDateString() : '—'}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!loading && filtered.length === 0 && <div className="py-16 text-center"><Package size={32} className="mx-auto text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground">Aucun résultat trouvé</p></div>}
          <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground"><span>{!loading ? filtered.length : 0} résultat{!loading && filtered.length !== 1 ? 's' : ''} sur {stocks.length}</span><span>Dernière mise à jour : {new Date().toLocaleString('fr-FR')}</span></div>
        </div>
      </div>
    </AppLayout>
  );
}
