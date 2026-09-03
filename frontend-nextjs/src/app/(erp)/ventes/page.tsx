'use client';
import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { Search, Eye, Download, ShoppingBag, Loader2, Wifi } from 'lucide-react';
import { ventesService, VenteResponse } from '@/services/ventes.service';
import { toast } from 'sonner';
import { useSocket } from '@/contexts/SocketContext';
import { useAppConfig } from '@/contexts/ConfigContext';
import VenteDetailsModal from '@/components/ventes/VenteDetailsModal';

const STATUT_CONFIG: Record<string, {label: string, className: string}> = {
  VALIDEE: { label: 'Validée', className: 'badge-active' },
  ANNULEE: { label: 'Annulée', className: 'badge-rupture' },
  REMBOURSEE: { label: 'Remboursée', className: 'badge-alert' },
};

export default function VentesPage() {
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [ventes, setVentes] = useState<VenteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedVente, setSelectedVente] = useState<VenteResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);

  const { lastSale, isConnected } = useSocket();
  const { config } = useAppConfig();
  const devise = config?.devise || 'FCFA';

  const loadVentes = useCallback(async () => {
    try {
      const res = await ventesService.getVentes();
      setVentes(res.data || []);
    } catch (err) {
      toast.error('Erreur lors du chargement des ventes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVentes();
  }, [loadVentes]);

  // Temps réel : recharger la liste dès qu'une nouvelle vente arrive via WebSocket
  useEffect(() => {
    if (!lastSale) return;
    loadVentes();
    toast.success(`Nouvelle vente : ${lastSale.referenceTicket} — ${lastSale.totalTtc.toLocaleString('fr-FR')} ${devise}`, {
      duration: 3000,
    });
  }, [lastSale]);

  const filtered = ventes.filter((v) => {
    const matchSearch = v.referenceTicket.toLowerCase().includes(search.toLowerCase());
    const matchDate = !filterDate || v.dateVente.startsWith(filterDate);
    const matchStatut = filterStatut === 'all' || v.statutVente === filterStatut;
    return matchSearch && matchDate && matchStatut;
  });

  const handleViewDetails = async (id: string) => {
    try {
      setLoadingDetails(id);
      const fullVente = await ventesService.getVenteById(id);
      setSelectedVente(fullVente);
      setIsModalOpen(true);
    } catch (err) {
      toast.error('Impossible de charger les détails de cette vente');
    } finally {
      setLoadingDetails(null);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const totalJour = ventes.filter(v => v.dateVente.startsWith(todayStr)).reduce((s, v) => s + v.totalTtc, 0);
  const totalMois = ventes.reduce((s, v) => s + v.totalTtc, 0);
  const panierMoyen = ventes.length > 0 ? Math.round(totalMois / ventes.length) : 0;
  const totalTva = ventes.reduce((s, v) => s + v.totalTva, 0);

  return (
    <AppLayout currentPath="/ventes">
      <Topbar title="Historique des ventes" subtitle="Toutes les transactions enregistrées" />
      <div className="px-6 py-6 max-w-screen-2xl mx-auto space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="kpi-card-info">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">CA aujourd'hui</p>
              {isConnected && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
            </div>
            <p className="text-xl font-bold text-foreground tabular-nums">{totalJour.toLocaleString('fr-FR')} {devise}</p>
            <p className="text-xs text-muted-foreground mt-1">{ventes.filter(v => v.dateVente.startsWith(todayStr)).length} ventes</p>
          </div>
          <div className="kpi-card-positive">
            <p className="text-xs text-muted-foreground mb-1">CA total (période)</p>
            <p className="text-xl font-bold text-foreground tabular-nums">{totalMois.toLocaleString('fr-FR')} {devise}</p>
            <p className="text-xs text-muted-foreground mt-1">{ventes.length} transactions</p>
          </div>
          <div className="kpi-card-neutral">
            <p className="text-xs text-muted-foreground mb-1">Panier moyen</p>
            <p className="text-xl font-bold text-foreground tabular-nums">{panierMoyen.toLocaleString('fr-FR')} {devise}</p>
          </div>
          <div className="kpi-card-warning">
            <p className="text-xs text-muted-foreground mb-1">Total TVA collectée</p>
            <p className="text-xl font-bold text-warning tabular-nums">{totalTva.toLocaleString('fr-FR')} {devise}</p>
          </div>
        </div>

        {/* Table des ventes */}
        <div className="card-base overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Référence ticket..."
                className="input-field pl-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="input-field text-sm w-auto" />
              <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} className="input-field text-sm w-auto">
                <option value="all">Tous statuts</option>
                <option value="VALIDEE">Validée</option>
                <option value="ANNULEE">Annulée</option>
                <option value="REMBOURSEE">Remboursée</option>
              </select>
              <button className="btn-secondary flex items-center gap-1.5 text-sm py-2">
                <Download size={14} /> Exporter
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Référence</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Date & Heure</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">HT</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">TVA</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">TTC</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Statut</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      <Loader2 className="animate-spin mx-auto mb-2" size={24} /> Chargement des ventes...
                    </td>
                  </tr>
                ) : filtered.map((vente, idx) => {
                  const d = new Date(vente.dateVente);
                  return (
                    <tr key={vente.id} className={`border-b border-border table-row-hover ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}>
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{vente.referenceTicket}</td>
                      <td className="px-5 py-3 text-foreground">
                        <p className="text-sm">{d.toLocaleDateString('fr-FR')}</p>
                        <p className="text-xs text-muted-foreground">{d.toLocaleTimeString('fr-FR')}</p>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">{vente.totalHt.toLocaleString('fr-FR')}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">{vente.totalTva.toLocaleString('fr-FR')}</td>
                      <td className="px-5 py-3 text-right tabular-nums font-bold text-foreground">{vente.totalTtc.toLocaleString('fr-FR')} {devise}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={STATUT_CONFIG[vente.statutVente]?.className || 'badge-draft'}>
                          {STATUT_CONFIG[vente.statutVente]?.label || vente.statutVente}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button 
                          onClick={() => handleViewDetails(vente.id)}
                          disabled={loadingDetails === vente.id}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
                        >
                          {loadingDetails === vente.id ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />} 
                          Détail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!loading && filtered.length === 0 && (
            <div className="py-16 text-center">
              <ShoppingBag size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Aucune vente trouvée</p>
            </div>
          )}
          <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>{!loading ? filtered.length : 0} résultat{!loading && filtered.length !== 1 ? 's' : ''}</span>
            {isConnected && (
              <span className="flex items-center gap-1 text-green-600">
                <Wifi size={11} /> Mises à jour en temps réel actives
              </span>
            )}
          </div>
        </div>
      </div>
      
      <VenteDetailsModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        vente={selectedVente} 
        devise={devise} 
      />
    </AppLayout>
  );
}
