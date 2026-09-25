'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { Search, AlertTriangle, TrendingDown, Package, Download, Loader2, X, ArrowRightLeft, PackagePlus } from 'lucide-react';
import { stockService, StockItem } from '@/services/stock.service';
import AddStockModal from './components/AddStockModal';
import { toast } from 'sonner';
import { exportToCSV } from '@/utils/export';
import { useAuth } from '@/hooks/useAuth';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';

const STATUT_CONFIG: Record<string, { label: string; className: string }> = {
  normal: { label: 'Normal', className: 'badge-active' },
  alerte: { label: 'Alerte', className: 'badge-alert' },
  rupture: { label: 'Rupture', className: 'badge-rupture' },
  surstock: { label: 'Surstock', className: 'badge-draft' },
};

export default function StockPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [transferModal, setTransferModal] = useState<{
    type: 'TRANSFERT_ETAL' | 'RETOUR_RESERVE';
    item: StockItem;
  } | null>(null);
  const [transferQty, setTransferQty] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [addStockModalOpen, setAddStockModalOpen] = useState(false);

  const loadStocks = () => {
    setLoading(true);
    stockService
      .getStocks()
      .then((res) => setStocks(res || []))
      .catch((err) => toast.error('Erreur lors du chargement des stocks'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStocks();
  }, []);

  const handleTransfer = async () => {
    if (!transferModal) return;
    const qty = parseInt(transferQty, 10);
    if (!qty || qty <= 0) return toast.error('Veuillez entrer une quantité valide');

    const maxQty = transferModal.type === 'TRANSFERT_ETAL'
      ? transferModal.item.quantiteEnStock
      : (transferModal.item.quantiteEtal || 0);

    if (qty > maxQty) {
      return toast.error(`Quantité insuffisante (Maximum: ${maxQty})`);
    }

    setTransferLoading(true);
    try {
      await stockService.transfererEtal({
        produitId: transferModal.item.produitId,
        typeMouvement: transferModal.type,
        quantite: qty
      });
      toast.success('Transfert effectué avec succès');
      setTransferModal(null);
      setTransferQty('');
      loadStocks();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du transfert');
    } finally {
      setTransferLoading(false);
    }
  };

  const handleAddStock = async (produitId: string, quantite: number, seuilAlerte: number) => {
    try {
      await stockService.ajouterStock({ produitId, quantite, seuilAlerte });
      toast.success('Stock ajouté avec succès');
      loadStocks();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'ajout du stock');
      throw error;
    }
  };

  const getComputedStatut = (item: StockItem) => {
    if (item.estEnRupture) return 'rupture';
    if (item.estEnAlerte) return 'alerte';
    return 'normal'; // Assume no surstock flag from backend yet
  };

  const filtered = stocks.filter((item) => {
    const matchSearch =
      item.produitLibelle.toLowerCase().includes(search.toLowerCase()) ||
      item.produitReference.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === 'all' || getComputedStatut(item) === filterStatut;
    return matchSearch && matchStatut;
  });

  const handleExportStock = () => {
    if (filtered.length === 0) {
      toast.info('Aucun stock à exporter');
      return;
    }
    const headers = [
      'Référence',
      'Produit / Désignation',
      'Catégorie',
      'Réserve',
      'En Vente (Étal)',
      'Total en Stock',
      'Seuil Alerte',
      'Statut',
      'Dernier Mouvement',
    ];
    const data = filtered.map((item) => {
      const st = getComputedStatut(item);
      return [
        item.produitReference,
        item.produitLibelle,
        item.categoryName || '—',
        item.quantiteEnStock,
        item.quantiteEtal || 0,
        item.quantiteEnStock + (item.quantiteEtal || 0),
        item.seuilAlerte,
        STATUT_CONFIG[st]?.label || st,
        item.dateDerniereEntree
          ? new Date(item.dateDerniereEntree).toLocaleDateString('fr-FR')
          : '—',
      ];
    });
    exportToCSV({ filename: 'etat_des_stocks', headers, data });
    toast.success('État des stocks exporté avec succès');
  };

  const totalValeur = 0; // Not available directly in API yet
  const ruptures = stocks.filter((i) => i.estEnRupture).length;
  const alertes = stocks.filter((i) => i.estEnAlerte).length;
  const surstocks = 0;

  return (
    <AppLayout currentPath="/stock">
      <Topbar title="Stock & Inventaire" subtitle="Suivi des niveaux de stock et alertes" />
      <div className="px-6 py-6 max-w-screen-2xl mx-auto space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="kpi-card-info">
            <p className="text-xs text-muted-foreground mb-1">Total références</p>
            <p className="text-xl font-bold text-foreground tabular-nums">{stocks.length}</p>
            <p className="text-xs text-muted-foreground mt-1">produits en base</p>
          </div>
          <div className="kpi-card-negative">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={16} className="text-negative" />
              <p className="text-xs text-muted-foreground">Ruptures de stock</p>
            </div>
            <p className="text-xl font-bold text-negative tabular-nums">{ruptures}</p>
            <p className="text-xs text-muted-foreground mt-1">produits épuisés</p>
          </div>
          <div className="kpi-card-warning">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={16} className="text-warning" />
              <p className="text-xs text-muted-foreground">Alertes stock bas</p>
            </div>
            <p className="text-xl font-bold text-warning tabular-nums">{alertes}</p>
            <p className="text-xs text-muted-foreground mt-1">sous le seuil minimum</p>
          </div>
          <div className="kpi-card-positive">
            <div className="flex items-center gap-2 mb-1">
              <Package size={16} className="text-positive" />
              <p className="text-xs text-muted-foreground">En stock</p>
            </div>
            <p className="text-xl font-bold text-positive tabular-nums">
              {stocks.length - ruptures}
            </p>
            <p className="text-xs text-muted-foreground mt-1">produits disponibles</p>
          </div>
        </div>
        <div className="card-base overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un produit ou référence..."
                className="input-field pl-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                className="input-field text-sm w-auto"
              >
                <option value="all">Tous les statuts</option>
                <option value="normal">Normal</option>
                <option value="alerte">Alerte</option>
                <option value="rupture">Rupture</option>
                <option value="surstock">Surstock</option>
              </select>
              <button
                onClick={handleExportStock}
                className="btn-secondary flex items-center gap-1.5 text-sm py-2"
              >
                <Download size={14} /> Exporter
              </button>
              {hasPermission(user, PERMISSIONS.ACTION_AJOUTER_STOCK) && (
                <button
                  onClick={() => setAddStockModalOpen(true)}
                  className="btn-primary flex items-center gap-1.5 text-sm py-2"
                >
                  <PackagePlus size={14} /> Ajouter un stock
                </button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Référence
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Produit
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Catégorie
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Réserve
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                    En vente (Étagère)
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Total
                  </th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Statut
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Dernier mouvement
                  </th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      <Loader2 className="animate-spin mx-auto mb-2" size={24} /> Chargement du
                      stock...
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, idx) => {
                    const st = getComputedStatut(item);
                    return (
                      <tr
                        key={item.id}
                        className={`border-b border-border table-row-hover ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}
                      >
                        <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                          {item.produitReference}
                        </td>
                        <td className="px-5 py-3 font-medium text-foreground">
                          {item.produitLibelle}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {item.categoryName || '—'}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums font-semibold text-foreground">
                          {item.quantiteEnStock}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums font-semibold text-primary">
                          {item.quantiteEtal || 0}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">
                          {item.quantiteEnStock + (item.quantiteEtal || 0)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={STATUT_CONFIG[st].className}>
                            {STATUT_CONFIG[st].label}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground text-xs">
                          {item.dateDerniereEntree
                            ? new Date(item.dateDerniereEntree).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-3">
                            {hasPermission(user, PERMISSIONS.ACTION_TRANSFERT_ETAGERE) && (
                              <button
                                title="Transférer vers étagère"
                                onClick={() => {
                                  setTransferModal({ type: 'TRANSFERT_ETAL', item });
                                  setTransferQty('');
                                }}
                                className="text-primary hover:underline text-xs flex items-center gap-1"
                              >
                                <ArrowRightLeft size={12} /> + Étagère
                              </button>
                            )}
                            {hasPermission(user, PERMISSIONS.ACTION_RETOUR_RESERVE) && (
                              <button
                                title="Retourner en réserve"
                                onClick={() => {
                                  setTransferModal({ type: 'RETOUR_RESERVE', item });
                                  setTransferQty('');
                                }}
                                className="text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
                              >
                                <ArrowRightLeft size={12} /> + Réserve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {!loading && filtered.length === 0 && (
            <div className="py-16 text-center">
              <Package size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Aucun résultat trouvé</p>
            </div>
          )}
          <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {!loading ? filtered.length : 0} résultat
              {!loading && filtered.length !== 1 ? 's' : ''} sur {stocks.length}
            </span>
            <span>Dernière mise à jour : {new Date().toLocaleString('fr-FR')}</span>
          </div>
        </div>
      </div>

      {/* MODALE DE TRANSFERT */}
      {transferModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-base font-bold text-foreground">
                {transferModal.type === 'TRANSFERT_ETAL' ? 'Transfert vers Étal' : 'Retour en Réserve'}
              </h3>
              <button
                onClick={() => setTransferModal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  {transferModal.item.produitLibelle}
                </p>
                <p className="text-xs text-muted-foreground">
                  Disponible pour le transfert :{' '}
                  <span className="font-bold text-foreground">
                    {transferModal.type === 'TRANSFERT_ETAL'
                      ? transferModal.item.quantiteEnStock
                      : (transferModal.item.quantiteEtal || 0)}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Quantité à transférer
                </label>
                <input
                  type="number"
                  min="1"
                  max={transferModal.type === 'TRANSFERT_ETAL' ? transferModal.item.quantiteEnStock : (transferModal.item.quantiteEtal || 0)}
                  value={transferQty}
                  onChange={(e) => setTransferQty(e.target.value)}
                  className="input-field text-sm w-full"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setTransferModal(null)} className="btn-secondary text-sm py-2">
                Annuler
              </button>
              <button
                onClick={handleTransfer}
                disabled={transferLoading || !transferQty}
                className="btn-primary text-sm py-2 flex items-center gap-2"
              >
                {transferLoading && <Loader2 size={14} className="animate-spin" />}
                Valider
              </button>
            </div>
          </div>
        </div>
      )}

      <AddStockModal
        open={addStockModalOpen}
        onClose={() => setAddStockModalOpen(false)}
        onSave={handleAddStock}
      />
    </AppLayout>
  );
}
