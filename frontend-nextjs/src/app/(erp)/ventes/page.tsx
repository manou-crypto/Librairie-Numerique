'use client';
import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import {
  Search,
  Eye,
  Download,
  ShoppingBag,
  Loader2,
  Wifi,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  History,
  FileText,
} from 'lucide-react';
import {
  ventesService,
  VenteResponse,
  RetourVenteItem,
} from '@/services/ventes.service';
import { toast } from 'sonner';
import { useSocket } from '@/contexts/SocketContext';
import { useAppConfig } from '@/contexts/ConfigContext';
import VenteDetailsModal from '@/components/ventes/VenteDetailsModal';
import RetourModal from '@/components/ventes/RetourModal';
import { exportToCSV } from '@/utils/export';

const STATUT_CONFIG: Record<string, { label: string; className: string }> = {
  VALIDEE: { label: 'Validée', className: 'badge-active' },
  ANNULEE: { label: 'Annulée', className: 'badge-rupture' },
  REMBOURSEE: { label: 'Remboursée (Totale)', className: 'badge-rupture' },
  PARTIELLEMENT_REMBOURSEE: { label: 'Partiellement remboursée', className: 'badge-alert' },
};

const MODE_PAIEMENT_LABELS: Record<string, string> = {
  ESPECES: 'Espèces',
  CARTE_BANCAIRE: 'Carte bancaire',
  MOBILE_MONEY: 'Mobile Money',
  CHEQUE: 'Chèque',
};

export default function VentesPage() {
  const [activeView, setActiveView] = useState<'ventes' | 'retours'>('ventes');
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [ventes, setVentes] = useState<VenteResponse[]>([]);
  const [retours, setRetours] = useState<RetourVenteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRetours, setLoadingRetours] = useState(false);

  const [selectedVente, setSelectedVente] = useState<VenteResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null);

  // État pour modal de retour direct depuis la liste
  const [retourDirectVente, setRetourDirectVente] = useState<VenteResponse | null>(null);
  const [isRetourModalOpen, setIsRetourModalOpen] = useState(false);

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

  const loadRetours = useCallback(async () => {
    try {
      setLoadingRetours(true);
      const res = await ventesService.getRetours();
      setRetours(res.data || []);
    } catch (err) {
      // Ignorer silencieusement
    } finally {
      setLoadingRetours(false);
    }
  }, []);

  useEffect(() => {
    loadVentes();
    loadRetours();
  }, [loadVentes, loadRetours]);

  // Temps réel : recharger la liste dès qu'une nouvelle vente arrive via WebSocket
  useEffect(() => {
    if (!lastSale) return;
    loadVentes();
    loadRetours();
    toast.success(
      `Nouvelle vente : ${lastSale.referenceTicket} — ${lastSale.totalTtc.toLocaleString('fr-FR')} ${devise}`,
      {
        duration: 3000,
      }
    );
  }, [lastSale, loadVentes, loadRetours, devise]);

  const filteredVentes = ventes.filter((v) => {
    const matchSearch = v.referenceTicket.toLowerCase().includes(search.toLowerCase());
    const matchDate = !filterDate || v.dateVente.startsWith(filterDate);
    const matchStatut = filterStatut === 'all' || v.statutVente === filterStatut;
    return matchSearch && matchDate && matchStatut;
  });

  const filteredRetours = retours.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      r.referenceRetour.toLowerCase().includes(q) ||
      r.referenceTicketVente.toLowerCase().includes(q) ||
      r.motif.toLowerCase().includes(q) ||
      r.utilisateurNom.toLowerCase().includes(q);
    const matchDate = !filterDate || r.dateRetour.startsWith(filterDate);
    return matchSearch && matchDate;
  });

  const handleExportVentes = () => {
    if (filteredVentes.length === 0) {
      toast.info('Aucune vente à exporter');
      return;
    }
    const headers = [
      'Référence Ticket',
      'Date & Heure',
      'Mode Paiement',
      'Montant HT',
      'Montant TVA',
      'Montant TTC',
      'Montant Payé',
      'Monnaie Rendue',
      'Statut',
    ];
    const data = filteredVentes.map((v) => [
      v.referenceTicket,
      new Date(v.dateVente).toLocaleString('fr-FR'),
      MODE_PAIEMENT_LABELS[v.modePaiement] || v.modePaiement,
      v.montantTotalHt.toFixed(2),
      v.montantTva.toFixed(2),
      v.montantTotalTtc.toFixed(2),
      (v.montantPaye || 0).toFixed(2),
      (v.monnaieRendue || 0).toFixed(2),
      STATUT_CONFIG[v.statutVente]?.label || v.statutVente,
    ]);
    exportToCSV({ filename: 'journal_ventes', headers, data });
    toast.success('Export des ventes téléchargé avec succès');
  };

  const handleExportRetours = () => {
    if (filteredRetours.length === 0) {
      toast.info('Aucun retour à exporter');
      return;
    }
    const headers = [
      'Réf. Retour',
      'Réf. Ticket Original',
      'Date & Heure',
      'Opérateur',
      'Montant Remboursé',
      'Mode Remboursement',
      'Motif',
    ];
    const data = filteredRetours.map((r) => [
      r.referenceRetour,
      r.referenceTicketVente,
      new Date(r.dateRetour).toLocaleString('fr-FR'),
      r.utilisateurNom,
      r.montantRembourse.toFixed(2),
      r.modeRemboursement || 'Espèces',
      r.motif || '',
    ]);
    exportToCSV({ filename: 'journal_retours', headers, data });
    toast.success('Export des retours téléchargé avec succès');
  };

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

  const handleOpenQuickRetour = async (vente: VenteResponse) => {
    try {
      setLoadingDetails(vente.id);
      const fullVente = await ventesService.getVenteById(vente.id);
      setRetourDirectVente(fullVente);
      setIsRetourModalOpen(true);
    } catch (err) {
      toast.error('Impossible d’ouvrir le retour pour cette vente');
    } finally {
      setLoadingDetails(null);
    }
  };

  const handleRetourSuccess = () => {
    loadVentes();
    loadRetours();
    // Recharger le détail sélectionné si modal ouvert
    if (selectedVente) {
      ventesService.getVenteById(selectedVente.id).then((v) => setSelectedVente(v)).catch(() => {});
    }
  };

  // Calculs KPI
  const todayStr = new Date().toISOString().split('T')[0];
  const totalJour = ventes
    .filter((v) => v.dateVente.startsWith(todayStr) && v.statutVente !== 'ANNULEE')
    .reduce((s, v) => s + v.totalTtc, 0);
  const totalMois = ventes
    .filter((v) => v.statutVente !== 'ANNULEE')
    .reduce((s, v) => s + v.totalTtc, 0);
  const totalRembourse = retours.reduce((s, r) => s + r.montantRembourse, 0);
  const totalTva = ventes
    .filter((v) => v.statutVente !== 'ANNULEE')
    .reduce((s, v) => s + v.totalTva, 0);

  return (
    <AppLayout currentPath="/ventes">
      <Topbar title="Gestion des ventes & Retours" subtitle="Historique des ventes, encaissements et retours clients" />
      <div className="px-6 py-6 max-w-screen-2xl mx-auto space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="kpi-card-info">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">CA aujourd'hui</p>
              {isConnected && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              )}
            </div>
            <p className="text-xl font-bold text-foreground tabular-nums">
              {totalJour.toLocaleString('fr-FR')} {devise}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {ventes.filter((v) => v.dateVente.startsWith(todayStr)).length} ventes aujourd'hui
            </p>
          </div>

          <div className="kpi-card-positive">
            <p className="text-xs text-muted-foreground mb-1">CA total (net)</p>
            <p className="text-xl font-bold text-foreground tabular-nums">
              {totalMois.toLocaleString('fr-FR')} {devise}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{ventes.length} transactions enregistrées</p>
          </div>

          <div className="kpi-card-warning">
            <p className="text-xs text-muted-foreground mb-1">Retours & Remboursements</p>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              {totalRembourse.toLocaleString('fr-FR')} {devise}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{retours.length} retours effectués</p>
          </div>

          <div className="kpi-card-neutral">
            <p className="text-xs text-muted-foreground mb-1">Total TVA collectée</p>
            <p className="text-xl font-bold text-foreground tabular-nums">
              {totalTva.toLocaleString('fr-FR')} {devise}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Conformité fiscale</p>
          </div>
        </div>

        {/* Onglets de navigation : Ventes vs Retours */}
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <button
            type="button"
            onClick={() => setActiveView('ventes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeView === 'ventes'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <ShoppingBag size={15} />
            <span>Toutes les ventes ({ventes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('retours')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeView === 'retours'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <RotateCcw size={15} />
            <span>Retours & Remboursements ({retours.length})</span>
          </button>
        </div>

        {/* Vue 1 : Table des ventes */}
        {activeView === 'ventes' ? (
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
                  placeholder="Référence ticket..."
                  className="input-field pl-9 text-sm"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="input-field text-sm w-auto"
                />
                <select
                  value={filterStatut}
                  onChange={(e) => setFilterStatut(e.target.value)}
                  className="input-field text-sm w-auto"
                >
                  <option value="all">Tous statuts</option>
                  <option value="VALIDEE">Validée</option>
                  <option value="PARTIELLEMENT_REMBOURSEE">Partiellement remboursée</option>
                  <option value="REMBOURSEE">Remboursée (Totale)</option>
                  <option value="ANNULEE">Annulée</option>
                </select>
                <button
                  onClick={handleExportVentes}
                  className="btn-secondary flex items-center gap-1.5 text-sm py-2"
                >
                  <Download size={14} /> Exporter
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                      Référence Ticket
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                      Date & Heure
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                      HT
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                      TVA
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                      TTC
                    </th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">
                      Statut
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
                        <Loader2 className="animate-spin mx-auto mb-2" size={24} /> Chargement des
                        ventes...
                      </td>
                    </tr>
                  ) : (
                    filteredVentes.map((vente, idx) => {
                      const d = new Date(vente.dateVente);
                      const isEligibleForReturn =
                        vente.statutVente === 'VALIDEE' ||
                        vente.statutVente === 'PARTIELLEMENT_REMBOURSEE';

                      return (
                        <tr
                          key={vente.id}
                          className={`border-b border-border table-row-hover ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}
                        >
                          <td className="px-5 py-3 font-mono text-xs text-foreground font-semibold">
                            {vente.referenceTicket}
                          </td>
                          <td className="px-5 py-3 text-foreground">
                            <p className="text-sm font-medium">{d.toLocaleDateString('fr-FR')}</p>
                            <p className="text-xs text-muted-foreground">
                              {d.toLocaleTimeString('fr-FR')}
                            </p>
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">
                            {vente.totalHt.toLocaleString('fr-FR')}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">
                            {vente.totalTva.toLocaleString('fr-FR')}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums font-bold text-foreground">
                            {vente.totalTtc.toLocaleString('fr-FR')} {devise}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span
                              className={STATUT_CONFIG[vente.statutVente]?.className || 'badge-draft'}
                            >
                              {STATUT_CONFIG[vente.statutVente]?.label || vente.statutVente}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() => handleViewDetails(vente.id)}
                                disabled={loadingDetails === vente.id}
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
                              >
                                {loadingDetails === vente.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Eye size={12} />
                                )}
                                Détail
                              </button>

                              {isEligibleForReturn && (
                                <button
                                  onClick={() => handleOpenQuickRetour(vente)}
                                  disabled={loadingDetails === vente.id}
                                  className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 hover:underline disabled:opacity-50 font-medium"
                                  title="Effectuer un retour d'article ou retour de vente"
                                >
                                  <RotateCcw size={12} />
                                  Retour
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

            {!loading && filteredVentes.length === 0 && (
              <div className="py-16 text-center">
                <ShoppingBag size={32} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Aucune vente trouvée</p>
              </div>
            )}

            <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {!loading ? filteredVentes.length : 0} vente
                {!loading && filteredVentes.length !== 1 ? 's' : ''}
              </span>
              {isConnected && (
                <span className="flex items-center gap-1 text-green-600">
                  <Wifi size={11} /> Mises à jour en temps réel actives
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Vue 2 : Table des Retours & Remboursements */
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
                  placeholder="Réf retour, ticket, motif, opérateur..."
                  className="input-field pl-9 text-sm"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="input-field text-sm w-auto"
                />
                <button
                  onClick={handleExportRetours}
                  className="btn-secondary flex items-center gap-1.5 text-sm py-2"
                >
                  <Download size={14} /> Exporter
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                      Réf. Retour
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                      Date & Heure
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                      Ticket Vente
                    </th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">
                      Type de retour
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                      Motif
                    </th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                      Remboursement
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                      Mode
                    </th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                      Opérateur
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loadingRetours ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        <Loader2 className="animate-spin mx-auto mb-2" size={24} /> Chargement des
                        retours...
                      </td>
                    </tr>
                  ) : (
                    filteredRetours.map((retour, idx) => {
                      const d = new Date(retour.dateRetour);
                      return (
                        <tr
                          key={retour.id}
                          className={`border-b border-border table-row-hover ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}
                        >
                          <td className="px-5 py-3 font-mono text-xs font-bold text-amber-700 dark:text-amber-400">
                            {retour.referenceRetour}
                          </td>
                          <td className="px-5 py-3 text-foreground">
                            <p className="text-sm font-medium">{d.toLocaleDateString('fr-FR')}</p>
                            <p className="text-xs text-muted-foreground">
                              {d.toLocaleTimeString('fr-FR')}
                            </p>
                          </td>
                          <td className="px-5 py-3 font-mono text-xs text-foreground">
                            {retour.referenceTicketVente}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                retour.typeRetour === 'VENTE'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                              }`}
                            >
                              {retour.typeRetour === 'VENTE'
                                ? 'Retour Vente Complet'
                                : "Retour d'Articles"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-xs text-foreground max-w-xs truncate" title={retour.motif}>
                            {retour.motif}
                          </td>
                          <td className="px-5 py-3 text-right font-extrabold tabular-nums text-foreground">
                            {retour.montantRembourse.toLocaleString('fr-FR')} {devise}
                          </td>
                          <td className="px-5 py-3 text-xs text-muted-foreground">
                            {MODE_PAIEMENT_LABELS[retour.modeRemboursement] || retour.modeRemboursement}
                          </td>
                          <td className="px-5 py-3 text-xs text-muted-foreground">
                            {retour.utilisateurNom}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {!loadingRetours && filteredRetours.length === 0 && (
              <div className="py-16 text-center">
                <History size={32} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Aucun retour enregistré</p>
              </div>
            )}

            <div className="px-5 py-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {!loadingRetours ? filteredRetours.length : 0} retour
                {!loadingRetours && filteredRetours.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Modal Détail de la vente */}
      <VenteDetailsModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        vente={selectedVente}
        devise={devise}
        onRetourSuccess={handleRetourSuccess}
      />

      {/* Modal de retour direct depuis la liste */}
      {retourDirectVente && (
        <RetourModal
          open={isRetourModalOpen}
          onClose={() => {
            setIsRetourModalOpen(false);
            setRetourDirectVente(null);
          }}
          vente={retourDirectVente}
          devise={devise}
          onSuccess={handleRetourSuccess}
        />
      )}
    </AppLayout>
  );
}
