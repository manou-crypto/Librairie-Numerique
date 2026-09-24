'use client';
import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import {
  CreditCard,
  Plus,
  X,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  AlertCircle,
  Loader2,
  Trash2,
  Pencil,
  Eye,
  FileText,
  History,
  Search,
  Download,
} from 'lucide-react';
import { caissesService, CaisseItem, UserItem, HistoriqueSessionItem } from '@/services/caisses.service';
import { toast } from 'sonner';
import { exportToCSV } from '@/utils/export';

const STATUT_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> =
  {
    OUVERTE: { label: 'Ouverte', className: 'badge-active', icon: CheckCircle },
    FERMEE: { label: 'Fermée', className: 'badge-hidden', icon: XCircle },
    EN_CLOTURE: { label: 'En clôture', className: 'badge-alert', icon: Clock },
  };

// ── Types des modals ──────────────────────────────────────────────────────────
interface ClotureModal {
  caisse: CaisseItem | null;
  open: boolean;
}
interface OuvertureModal {
  caisse: CaisseItem | null;
  open: boolean;
}
interface DeleteModal {
  caisse: CaisseItem | null;
  open: boolean;
}

export default function CaissesPage() {
  const [caisses, setCaisses] = useState<CaisseItem[]>([]);
  const [utilisateurs, setUtilisateurs] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Onglet actif ───────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'terminaux' | 'historique'>('terminaux');
  const [sessions, setSessions] = useState<HistoriqueSessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [searchSession, setSearchSession] = useState('');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      const res = await caissesService.getHistoriqueSessions();
      setSessions(res || []);
    } catch {
      toast.error("Erreur lors du chargement de l'historique des sessions");
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'historique') {
      loadSessions();
    }
  }, [activeTab, loadSessions]);

  const handleOpenReport = async (sessionId: number) => {
    try {
      setReportLoading(true);
      const report = await caissesService.getRapportSession(String(sessionId));
      setSelectedReport(report);
    } catch (err: any) {
      toast.error(err.message || 'Impossible de charger le rapport de caisse');
    } finally {
      setReportLoading(false);
    }
  };

  // ── Modal Clôture ──────────────────────────────────────────────────────────
  const [clotureModal, setClotureModal] = useState<ClotureModal>({ caisse: null, open: false });
  // ── Modal Ouverture ────────────────────────────────────────────────────────
  const [ouvertureModal, setOuvertureModal] = useState<OuvertureModal>({
    caisse: null,
    open: false,
  });
  const [ouvertureFond, setOuvertureFond] = useState('');

  // ── Modal Nouvelle caisse ──────────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCaisseName, setNewCaisseName] = useState('');
  const [newCaisseEmplacement, setNewCaisseEmplacement] = useState('');
  const [newCaisseUserId, setNewCaisseUserId] = useState('');

  // ── Modal Suppression ────────────────────────────────────────────
  const [deleteModal, setDeleteModal] = useState<DeleteModal>({ caisse: null, open: false });

  // ── Modal Édition ─────────────────────────────────────────────
  const [editModal, setEditModal] = useState<{ caisse: CaisseItem | null; open: boolean }>({
    caisse: null,
    open: false,
  });
  const [editName, setEditName] = useState('');
  const [editEmplacement, setEditEmplacement] = useState('');
  const [editUserId, setEditUserId] = useState<string>('');

  // ── Chargement des données ─────────────────────────────────────────────────
  const loadCaisses = useCallback(async () => {
    try {
      const res = await caissesService.getCaisses();
      setCaisses(res || []);
    } catch {
      toast.error('Erreur lors du chargement des caisses');
    }
  }, []);

  useEffect(() => {
    Promise.all([caissesService.getCaisses(), caissesService.getUtilisateurs()])
      .then(([caissesRes, usersRes]) => {
        setCaisses(caissesRes || []);
        setUtilisateurs((usersRes || []).filter((u) => u.statut === 'ACTIF'));
      })
      .catch(() => toast.error('Erreur lors du chargement des données'))
      .finally(() => setLoading(false));
  }, []);

  // ── KPIs ───────────────────────────────────────────────────────────────────
  const totalCA = caisses.reduce((sum, c) => sum + (c.totalVentes || 0), 0);
  const totalTx = caisses.reduce((sum, c) => sum + (c.nbTransactions || 0), 0);
  const caissesOuvertes = caisses.filter((c) => c.statutCaisse === 'OUVERTE').length;

  // ── Action: Créer une caisse ───────────────────────────────────────────────
  const handleCreateCaisse = async () => {
    if (!newCaisseName.trim()) {
      toast.error('Veuillez saisir un nom de caisse');
      return;
    }
    if (!newCaisseUserId) {
      toast.error('Veuillez sélectionner un caissier à assigner');
      return;
    }
    setActionLoading(true);
    try {
      await caissesService.createCaisse({
        codeCaisse: newCaisseName.trim(),
        emplacement: newCaisseEmplacement.trim() || undefined,
        utilisateurId: Number(newCaisseUserId),
      });
      toast.success(`Caisse "${newCaisseName}" créée avec succès`);
      setShowAddModal(false);
      setNewCaisseName('');
      setNewCaisseEmplacement('');
      setNewCaisseUserId('');
      await loadCaisses();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la création de la caisse');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Action: Ouvrir une caisse ──────────────────────────────────────────────
  const handleOuvrirConfirm = async () => {
    if (!ouvertureModal.caisse) return;
    const fond = Number(ouvertureFond) || 0;
    setActionLoading(true);
    try {
      await caissesService.ouvrirSession(ouvertureModal.caisse.id, fond);
      toast.success(`${ouvertureModal.caisse.codeCaisse} ouverte avec succès`);
      setOuvertureModal({ caisse: null, open: false });
      setOuvertureFond('');
      await loadCaisses();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'ouverture de la caisse");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Action: Clôturer une caisse ────────────────────────────────────────────
  const handleClotureConfirm = async () => {
    if (!clotureModal.caisse || !clotureModal.caisse.sessionId) {
      toast.error('Session de caisse introuvable');
      return;
    }
    setActionLoading(true);
    try {
      await caissesService.cloturerSession(
        clotureModal.caisse.sessionId
      );
      toast.success(`${clotureModal.caisse.codeCaisse} clôturée avec succès`);
      setClotureModal({ caisse: null, open: false });
      await loadCaisses();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la clôture de la caisse');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Action: Modifier une caisse ───────────────────────────────────
  const handleEditOpen = (caisse: CaisseItem) => {
    setEditName(caisse.codeCaisse);
    setEditEmplacement(caisse.emplacement || '');
    setEditUserId(String(caisse.utilisateurId || ''));
    setEditModal({ caisse, open: true });
  };

  const handleEditConfirm = async () => {
    if (!editModal.caisse) return;
    if (!editName.trim()) {
      toast.error('Le nom de la caisse est obligatoire');
      return;
    }
    setActionLoading(true);
    try {
      await caissesService.updateCaisse(editModal.caisse.id, {
        codeCaisse: editName.trim(),
        emplacement: editEmplacement.trim() || undefined,
        // '' = pas de changement d'utilisateur n'est pas possible — on envoie null pour désassigner
        utilisateurId: editUserId === '' ? null : Number(editUserId),
      });
      toast.success(`Caisse "${editName.trim()}" mise à jour avec succès`);
      setEditModal({ caisse: null, open: false });
      await loadCaisses();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la modification de la caisse');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Action: Supprimer une caisse ─────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteModal.caisse) return;
    setActionLoading(true);
    try {
      await caissesService.deleteCaisse(deleteModal.caisse.id);
      toast.success(`${deleteModal.caisse.codeCaisse} supprimée avec succès`);
      setDeleteModal({ caisse: null, open: false });
      await loadCaisses();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la suppression de la caisse');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCaisses = () => {
    if (caisses.length === 0) {
      toast.info('Aucune caisse à exporter');
      return;
    }
    const headers = [
      'Code Caisse',
      'Nom Caisse',
      'Statut',
      'Caissier Assigné',
      'Fond Initial (FCFA)',
      'Total Encaissé (FCFA)',
      'Total Ventes',
    ];
    const data = caisses.map((c) => [
      c.codeCaisse,
      c.nomCaisse,
      STATUT_CONFIG[c.statut]?.label || c.statut,
      c.utilisateurActuelNom || 'Non assigné',
      c.fondDeCaisseInitial || 0,
      c.totalEncaisse || 0,
      c.nombreVentes || 0,
    ]);
    exportToCSV({ filename: 'etat_des_caisses', headers, data });
    toast.success('État des caisses exporté avec succès');
  };

  const handleExportSessions = () => {
    const q = searchSession.toLowerCase();
    const filteredSessions = sessions.filter((s) => {
      return (
        !q ||
        s.codeCaisse.toLowerCase().includes(q) ||
        s.caissierNom.toLowerCase().includes(q) ||
        (s.caissierEmail && s.caissierEmail.toLowerCase().includes(q))
      );
    });

    if (filteredSessions.length === 0) {
      toast.info('Aucune session à exporter');
      return;
    }

    const headers = [
      'Code Caisse',
      'Emplacement',
      'Caissier Nom',
      'Caissier Email',
      'Date & Heure Ouverture',
      'Date & Heure Clôture',
      'Fond Initial (FCFA)',
      'Total Ventes (FCFA)',
      'Écart Caisse (FCFA)',
      'Statut Session',
    ];

    const data = filteredSessions.map((s) => [
      s.codeCaisse,
      s.emplacement || '',
      s.caissierNom,
      s.caissierEmail || '',
      new Date(s.dateOuverture).toLocaleString('fr-FR'),
      s.dateFermeture ? new Date(s.dateFermeture).toLocaleString('fr-FR') : 'En cours',
      s.montantOuverture,
      s.totalVentesSession ?? 0,
      s.ecart ?? 0,
      s.statutSession === 'OUVERTE' ? 'Ouverte' : 'Clôturée',
    ]);

    exportToCSV({ filename: 'sessions_caisses', headers, data });
    toast.success('Historique des sessions exporté avec succès');
  };

  return (
    <AppLayout currentPath="/caisses">
      <Topbar
        title="Gestion des caisses"
        subtitle="Ouverture, fermeture et suivi des encaissements"
      />
      <div className="px-6 py-6 max-w-screen-2xl mx-auto space-y-6">
        {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="kpi-card-info">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">CA total du jour</p>
              <DollarSign size={16} className="text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {totalCA.toLocaleString('fr-FR')} FCFA
            </p>
          </div>
          <div className="kpi-card-positive">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Caisses ouvertes</p>
              <CheckCircle size={16} className="text-positive" />
            </div>
            <p className="text-2xl font-bold text-positive tabular-nums">{caissesOuvertes}</p>
            <p className="text-xs text-muted-foreground mt-1">sur {caisses.length} caisses</p>
          </div>
          <div className="kpi-card-neutral">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Transactions</p>
              <TrendingUp size={16} className="text-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{totalTx}</p>
          </div>
          <div className="kpi-card-warning">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Ticket moyen</p>
              <Users size={16} className="text-warning" />
            </div>
            <p className="text-2xl font-bold text-warning tabular-nums">
              {totalTx > 0 ? Math.round(totalCA / totalTx).toLocaleString('fr-FR') : 0} FCFA
            </p>
          </div>
        </div>

        {/* ── Sélecteur d'onglets (Terminaux vs Historique) ────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border">
            <button
              onClick={() => setActiveTab('terminaux')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === 'terminaux'
                  ? 'bg-card text-foreground shadow-sm font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Terminaux de caisse ({caisses.length})
            </button>
            <button
              onClick={() => setActiveTab('historique')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'historique'
                  ? 'bg-card text-foreground shadow-sm font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <History size={15} />
              <span>Historique & Audit des Sessions</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'terminaux' ? (
              <>
                <button
                  onClick={handleExportCaisses}
                  className="btn-secondary flex items-center gap-1.5 text-sm py-2 px-3.5"
                >
                  <Download size={14} /> Exporter
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-primary flex items-center gap-1.5 text-sm py-2 px-3.5"
                >
                  <Plus size={14} /> Nouvelle caisse
                </button>
              </>
            ) : null}
          </div>
        </div>

        {activeTab === 'terminaux' ? (
          <>
            {/* ── Grille des caisses ────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-full py-16 text-center text-muted-foreground">
              <Loader2 className="animate-spin mx-auto mb-2" size={24} /> Chargement des caisses...
            </div>
          ) : caisses.length === 0 ? (
            <div className="col-span-full py-16 text-center text-muted-foreground">
              Aucune caisse trouvée.
            </div>
          ) : (
            caisses.map((caisse) => (
              <div key={caisse.id} className="card-base p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <CreditCard size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{caisse.codeCaisse}</h3>
                      <p className="text-xs text-muted-foreground">
                        {caisse.caissier || 'Non assigné'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={STATUT_CONFIG[caisse.statutCaisse]?.className || 'badge-hidden'}
                    >
                      {STATUT_CONFIG[caisse.statutCaisse]?.label || caisse.statutCaisse}
                    </span>
                    <button
                      onClick={() => handleEditOpen(caisse)}
                      disabled={caisse.statutCaisse === 'OUVERTE'}
                      className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title={
                        caisse.statutCaisse === 'OUVERTE'
                          ? 'Impossible de modifier une caisse ouverte'
                          : 'Modifier la caisse'
                      }
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteModal({ caisse, open: true })}
                      className="p-1.5 text-muted-foreground hover:text-negative hover:bg-negative/10 rounded-md transition-colors"
                      title="Supprimer la caisse"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">CA du jour</p>
                    <p className="font-bold text-foreground tabular-nums text-sm">
                      {caisse.totalVentes !== undefined
                        ? `${caisse.totalVentes.toLocaleString('fr-FR')} FCFA`
                        : '—'}
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Transactions</p>
                    <p className="font-bold text-foreground tabular-nums text-sm">
                      {caisse.nbTransactions !== undefined ? caisse.nbTransactions : '—'}
                    </p>
                  </div>
                  {caisse.heureOuverture && (
                    <div className="bg-muted/50 rounded-lg p-3 col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Ouverture</p>
                      <p className="font-bold text-foreground text-sm">
                        {new Date(caisse.heureOuverture).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-1">
                  {caisse.statutCaisse === 'OUVERTE' ? (
                    <button
                      onClick={() => {
                        setClotureModal({ caisse, open: true });
                      }}
                      className="flex-1 btn-secondary text-sm py-2 text-negative border-negative/30 hover:bg-negative/5"
                    >
                      Clôturer la caisse
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setOuvertureModal({ caisse, open: true });
                        setOuvertureFond('');
                      }}
                      className="flex-1 btn-primary text-sm py-2"
                    >
                      Ouvrir la caisse
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Tableau récapitulatif ─────────────────────────────────────────── */}
        <div className="card-base overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-bold text-foreground">Récapitulatif journalier</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Caisse
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Caissier
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Solde ouverture
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Total ventes
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Nb transactions
                  </th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      <Loader2 className="animate-spin mx-auto mb-2" size={24} /> Chargement des
                      caisses...
                    </td>
                  </tr>
                ) : caisses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Aucune caisse trouvée.
                    </td>
                  </tr>
                ) : (
                  caisses.map((c, idx) => (
                    <tr
                      key={c.id}
                      className={`border-b border-border table-row-hover ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}
                    >
                      <td className="px-5 py-3 font-semibold text-foreground">{c.codeCaisse}</td>
                      <td className="px-5 py-3 text-muted-foreground">{c.caissier || '—'}</td>
                      <td className="px-5 py-3 text-right tabular-nums">—</td>
                      <td className="px-5 py-3 text-right font-semibold text-primary tabular-nums">
                        {c.totalVentes !== undefined
                          ? `${c.totalVentes.toLocaleString('fr-FR')} FCFA`
                          : '—'}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {c.nbTransactions !== undefined ? c.nbTransactions : '—'}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={STATUT_CONFIG[c.statutCaisse]?.className}>
                          {STATUT_CONFIG[c.statutCaisse]?.label}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
                <tr className="bg-primary/5 font-bold">
                  <td className="px-5 py-3 text-foreground" colSpan={3}>
                    Total
                  </td>
                  <td className="px-5 py-3 text-right text-primary tabular-nums">
                    {totalCA.toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{totalTx}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </>
    ) : (
      /* ── ONGLET HISTORIQUE DES SESSIONS ────────────────────────────── */
      <div className="space-y-4">
        <div className="card-base p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Rechercher une session par caissier, code caisse..."
              value={searchSession}
              onChange={(e) => setSearchSession(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportSessions}
              className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5"
            >
              <Download size={14} />
              <span>Exporter</span>
            </button>
            <button
              onClick={loadSessions}
              className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5"
            >
              {sessionsLoading ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
              <span>Actualiser</span>
            </button>
          </div>
        </div>

        <div className="card-base overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Registre des sessions de caisse</h3>
              <p className="text-xs text-muted-foreground">
                Suivi des ouvertures, fermetures, écarts d'espèces et opérateurs
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Caisse</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Caissier</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Ouverture</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Clôture</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Fond initial</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Total Ventes</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Écart</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Statut</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Rapport</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessionsLoading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-muted-foreground">
                      <Loader2 className="animate-spin mx-auto mb-2 text-primary" size={24} />
                      Chargement des sessions...
                    </td>
                  </tr>
                ) : sessions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-muted-foreground">
                      Aucune session enregistrée.
                    </td>
                  </tr>
                ) : (
                  sessions
                    .filter((s) => {
                      const q = searchSession.toLowerCase();
                      return (
                        !q ||
                        s.codeCaisse.toLowerCase().includes(q) ||
                        s.caissierNom.toLowerCase().includes(q) ||
                        (s.caissierEmail && s.caissierEmail.toLowerCase().includes(q))
                      );
                    })
                    .map((s) => {
                      const isOpen = s.statutSession === 'OUVERTE';
                      const ecart = s.ecart ?? 0;
                      return (
                        <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-5 py-3 font-semibold text-foreground">
                            {s.codeCaisse}
                            <span className="block text-[11px] text-muted-foreground font-normal">{s.emplacement}</span>
                          </td>
                          <td className="px-5 py-3">
                            <p className="font-medium text-foreground text-xs">{s.caissierNom}</p>
                            <p className="text-[10px] text-muted-foreground">{s.caissierEmail}</p>
                          </td>
                          <td className="px-5 py-3 text-xs text-muted-foreground">
                            {new Date(s.dateOuverture).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-5 py-3 text-xs">
                            {s.dateCloture ? (
                              new Date(s.dateCloture).toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            ) : (
                              <span className="text-positive font-semibold flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                En cours
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums text-muted-foreground">
                            {s.fondInitial.toLocaleString('fr-FR')} FCFA
                          </td>
                          <td className="px-5 py-3 text-right font-bold text-foreground tabular-nums">
                            {s.montantTotalVentes.toLocaleString('fr-FR')} FCFA
                            <span className="block text-[10px] text-muted-foreground font-normal">
                              {s.nombreVentes} ventes
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums">
                            {s.dateCloture ? (
                              ecart === 0 ? (
                                <span className="text-green-600 font-semibold text-xs">Équilibré</span>
                              ) : ecart < 0 ? (
                                <span className="text-red-600 font-bold text-xs">{ecart.toLocaleString('fr-FR')} FCFA</span>
                              ) : (
                                <span className="text-blue-600 font-bold text-xs">+{ecart.toLocaleString('fr-FR')} FCFA</span>
                              )
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                isOpen
                                  ? 'bg-green-500/10 text-green-700 border border-green-500/20'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {isOpen ? 'Ouverte' : 'Clôturée'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <button
                              onClick={() => handleOpenReport(s.id)}
                              disabled={reportLoading}
                              className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1 mx-auto"
                              title="Consulter le rapport complet de session"
                            >
                              <Eye size={12} />
                              <span>Rapport</span>
                            </button>
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
    )}
  </div>

  {/* ── MODAL: Rapport Détaillé de Session ── */}
  {selectedReport && (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card text-card-foreground border border-border rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="font-bold text-base text-foreground">Rapport d'Audit de Caisse</h3>
            <p className="text-xs text-muted-foreground">
              Session #{selectedReport.session?.id} — {selectedReport.session?.utilisateur}
            </p>
          </div>
          <button
            onClick={() => setSelectedReport(null)}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="bg-muted/40 p-3 rounded-lg text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Emplacement :</span>
              <span className="font-semibold text-foreground">{selectedReport.session?.emplacement}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ouverture :</span>
              <span className="text-foreground">
                {new Date(selectedReport.session?.dateOuverture).toLocaleString('fr-FR')}
              </span>
            </div>
            {selectedReport.session?.dateCloture && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Clôture :</span>
                <span className="text-foreground">
                  {new Date(selectedReport.session?.dateCloture).toLocaleString('fr-FR')}
                </span>
              </div>
            )}
          </div>

          {/* Tiroir caisse */}
          <div className="card-base p-3 space-y-2 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
              Mouvements du Tiroir Caisse
            </h4>
            <div className="flex justify-between">
              <span>Solde ouverture :</span>
              <span className="font-semibold">{selectedReport.tiroirCaisse?.soldeOuverture?.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="flex justify-between">
              <span>Espèces reçues (ventes) :</span>
              <span className="font-semibold text-green-600">
                +{selectedReport.tiroirCaisse?.especesRecuesVentes?.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            <div className="flex justify-between">
              <span>Espèces attendues au total :</span>
              <span className="font-bold text-primary">
                {selectedReport.tiroirCaisse?.especesAttendues?.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>

          {/* Résumé des ventes */}
          <div className="card-base p-3 space-y-2 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
              Chiffre d'Affaires Net
            </h4>
            <div className="flex justify-between">
              <span>Ventes brutes :</span>
              <span className="font-semibold">{selectedReport.resumeVentes?.ventesBrutes?.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="flex justify-between">
              <span>Remboursements :</span>
              <span className="text-red-500">-{selectedReport.resumeVentes?.totalRemboursements?.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t border-border pt-1">
              <span>Ventes nettes :</span>
              <span className="text-primary">{selectedReport.resumeVentes?.ventesNettes?.toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>

          {/* Modes de paiement */}
          {selectedReport.paiements && selectedReport.paiements.length > 0 && (
            <div className="card-base p-3 space-y-2 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                Encaissements par Mode
              </h4>
              {selectedReport.paiements.map((p: any, i: number) => (
                <div key={i} className="flex justify-between">
                  <span className="capitalize">{p.mode.toLowerCase().replace('_', ' ')} :</span>
                  <span className="font-semibold">{p.montant?.toLocaleString('fr-FR')} FCFA</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <button
            onClick={() => setSelectedReport(null)}
            className="btn-secondary text-sm py-2 px-4"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL: Clôture de caisse
         ════════════════════════════════════════════════════════════════════════ */}
      {clotureModal.open && clotureModal.caisse && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-md fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-base font-bold text-foreground">
                Clôturer {clotureModal.caisse.codeCaisse}
              </h3>
              <button
                onClick={() => setClotureModal({ caisse: null, open: false })}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle size={16} className="text-warning shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">
                  Vous êtes sur le point de clôturer{' '}
                  <strong>{clotureModal.caisse.codeCaisse}</strong>. Cette action enregistrera le
                  total des ventes de la journée.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Total encaissé</p>
                  <p className="font-bold text-foreground">
                    {clotureModal.caisse.totalVentes !== undefined
                      ? `${clotureModal.caisse.totalVentes.toLocaleString('fr-FR')} FCFA`
                      : '—'}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Transactions</p>
                  <p className="font-bold text-foreground">
                    {clotureModal.caisse.nbTransactions !== undefined
                      ? clotureModal.caisse.nbTransactions
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={() => setClotureModal({ caisse: null, open: false })}
                className="btn-secondary text-sm py-2"
                disabled={actionLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleClotureConfirm}
                className="btn-primary text-sm py-2 bg-negative hover:bg-negative/90"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin inline mr-1.5" />
                    Clôture en cours...
                  </>
                ) : (
                  'Confirmer la clôture'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL: Ouverture de caisse
         ════════════════════════════════════════════════════════════════════════ */}
      {ouvertureModal.open && ouvertureModal.caisse && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-base font-bold text-foreground">
                Ouvrir {ouvertureModal.caisse.codeCaisse}
              </h3>
              <button
                onClick={() => setOuvertureModal({ caisse: null, open: false })}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle size={16} className="text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">
                  Vous allez ouvrir <strong>{ouvertureModal.caisse.codeCaisse}</strong>. Veuillez
                  saisir le fond de caisse initial.
                </p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Fond de caisse initial (FCFA)
                </label>
                <input
                  type="number"
                  placeholder="5000"
                  value={ouvertureFond}
                  onChange={(e) => setOuvertureFond(e.target.value)}
                  className="input-field text-sm"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={() => setOuvertureModal({ caisse: null, open: false })}
                className="btn-secondary text-sm py-2"
                disabled={actionLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleOuvrirConfirm}
                className="btn-primary text-sm py-2"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin inline mr-1.5" />
                    Ouverture en cours...
                  </>
                ) : (
                  'Ouvrir la caisse'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL: Nouvelle caisse
         ════════════════════════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Nouvelle caisse</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Nom de la caisse *
                </label>
                <input
                  type="text"
                  value={newCaisseName}
                  onChange={(e) => setNewCaisseName(e.target.value)}
                  placeholder="ex: Caisse 4"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Emplacement
                </label>
                <input
                  type="text"
                  value={newCaisseEmplacement}
                  onChange={(e) => setNewCaisseEmplacement(e.target.value)}
                  placeholder="ex: Comptoir Principal"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Caissier assigné *
                </label>
                <select
                  value={newCaisseUserId}
                  onChange={(e) => setNewCaisseUserId(e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="">— Sélectionner un utilisateur —</option>
                  {utilisateurs
                    .filter((u) => !caisses.some((c) => c.utilisateurId === String(u.id)))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.prenom} {u.nom} ({u.libelleRole})
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={() => setShowAddModal(false)}
                className="btn-secondary text-sm py-2"
                disabled={actionLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleCreateCaisse}
                className="btn-primary text-sm py-2"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin inline mr-1.5" />
                    Création en cours...
                  </>
                ) : (
                  'Créer la caisse'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ════════════════════════════════════════════════════════════════════════
          MODAL: Suppression de caisse
         ════════════════════════════════════════════════════════════════════════ */}
      {deleteModal.open && deleteModal.caisse && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-base font-bold text-foreground">
                Supprimer {deleteModal.caisse.codeCaisse}
              </h3>
              <button
                onClick={() => setDeleteModal({ caisse: null, open: false })}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-negative/10 border border-negative/30 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle size={16} className="text-negative shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">
                  Vous êtes sur le point de supprimer{' '}
                  <strong>{deleteModal.caisse.codeCaisse}</strong>. Cette action est irréversible.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={() => setDeleteModal({ caisse: null, open: false })}
                className="btn-secondary text-sm py-2"
                disabled={actionLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="btn-primary text-sm py-2 bg-negative hover:bg-negative/90"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin inline mr-1.5" />
                    Suppression...
                  </>
                ) : (
                  'Confirmer la suppression'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL: Édition de caisse
         ═══════════════════════════════════════════════════════════════════════ */}
      {editModal.open && editModal.caisse && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-base font-bold text-foreground">
                Modifier {editModal.caisse.codeCaisse}
              </h3>
              <button
                onClick={() => setEditModal({ caisse: null, open: false })}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Nom de la caisse *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="ex: Caisse 1"
                  className="input-field text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Emplacement
                </label>
                <input
                  type="text"
                  value={editEmplacement}
                  onChange={(e) => setEditEmplacement(e.target.value)}
                  placeholder="ex: Comptoir Principal"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Caissier assigné
                </label>
                <select
                  value={editUserId}
                  onChange={(e) => setEditUserId(e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="">— Aucun (désassigner) —</option>
                  {utilisateurs
                    .filter(
                      (u) =>
                        // afficher les utilisateurs libres + celui actuellement assigné à cette caisse
                        !caisses.some(
                          (c) => c.utilisateurId === String(u.id) && c.id !== editModal.caisse!.id
                        )
                    )
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.prenom} {u.nom} ({u.libelleRole})
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={() => setEditModal({ caisse: null, open: false })}
                className="btn-secondary text-sm py-2"
                disabled={actionLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleEditConfirm}
                className="btn-primary text-sm py-2"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin inline mr-1.5" />
                    Sauvegarde...
                  </>
                ) : (
                  'Enregistrer les modifications'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
