'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import {
  Search,
  Plus,
  Truck,
  X,
  Eye,
  Loader2,
  CheckCircle,
  Package,
  Trash2,
  Download,
  Ban,
  AlertTriangle,
} from 'lucide-react';
import { achatsService, AchatItem } from '@/services/achats.service';
import { fournisseursService, Fournisseur } from '@/services/fournisseurs.service';
import { produitsService, Produit } from '@/services/produits.service';
import { useAppConfig } from '@/contexts/ConfigContext';
import { toast } from 'sonner';
import { authService } from '@/services/auth.service';

const STATUT_CONFIG: Record<string, { label: string; className: string }> = {
  EN_ATTENTE: { label: 'En attente', className: 'badge-draft' },
  RECU: { label: 'Reçu', className: 'badge-active' },
  ANNULE: { label: 'Annulé', className: 'badge-rupture' },
};

interface LigneForm {
  produitId: string;
  produitLibelle: string;
  quantiteCommandee: number;
  prixAchatUnitaireHt: number;
}

// État local pour la saisie interactive de réception
interface LigneReception {
  produitId: string;
  produitLibelle: string;
  quantiteCommandee: number;
  quantiteRecue: number;
  prixAchatUnitaireHt: number;
}

export default function AchatsPage() {
  const { config } = useAppConfig();
  const devise = config?.devise || 'FCFA';
  const tauxTva = config?.tva ? Number(config.tva) / 100 : 0;
  
  const currentUser = authService.getUser();

  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [filterDateDebut, setFilterDateDebut] = useState('');
  const [filterDateFin, setFilterDateFin] = useState('');
  const [achats, setAchats] = useState<AchatItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formFournisseur, setFormFournisseur] = useState('');
  const [isRetroactif, setIsRetroactif] = useState(false);
  const [formDatePrevueReception, setFormDatePrevueReception] = useState('');
  const [formDateAchat, setFormDateAchat] = useState('');
  const [lignesForm, setLignesForm] = useState<LigneForm[]>([]);
  const [selectedProduit, setSelectedProduit] = useState('');

  const [showDetail, setShowDetail] = useState(false);
  const [selectedAchat, setSelectedAchat] = useState<AchatItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // État pour la saisie interactive de réception
  const [lignesReception, setLignesReception] = useState<LigneReception[]>([]);

  const loadAchats = async () => {
    setLoading(true);
    try {
      setAchats(await achatsService.getAll());
    } catch {
      toast.error('Erreur lors du chargement des achats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAchats();
  }, []);

  const openCreateModal = async () => {
    try {
      const [f, p] = await Promise.all([
        fournisseursService.getAll(),
        produitsService.getAll({ pageSize: 10000 }).then((r) => r.data),
      ]);
      setFournisseurs(f);
      setProduits(p);
      setFormFournisseur('');
      setFormDatePrevueReception('');
      setLignesForm([]);
      setSelectedProduit('');
      setShowCreate(true);
    } catch {
      toast.error('Impossible de charger les données');
    }
  };

  const addLigne = () => {
    const p = produits.find((pr) => pr.id === selectedProduit);
    if (!p) return toast.error('Sélectionnez un produit');
    if (lignesForm.some((l) => l.produitId === p.id)) return toast.error('Produit déjà ajouté');
    setLignesForm((prev) => [
      ...prev,
      {
        produitId: p.id,
        produitLibelle: p.libelle,
        quantiteCommandee: 1,
        prixAchatUnitaireHt: p.prixAchat,
      },
    ]);
    setSelectedProduit('');
  };

  const updateLigne = (idx: number, field: keyof LigneForm, value: string) => {
    setLignesForm((prev) =>
      prev.map((l, i) =>
        i === idx
          ? {
              ...l,
              [field]: field === 'produitId' || field === 'produitLibelle' ? value : Number(value),
            }
          : l
      )
    );
  };

  const removeLigne = (idx: number) => setLignesForm((prev) => prev.filter((_, i) => i !== idx));
  const totalFormHt = lignesForm.reduce(
    (s, l) => s + l.quantiteCommandee * l.prixAchatUnitaireHt,
    0
  );

  const handleCreate = async () => {
    if (!formFournisseur) return toast.error('Sélectionnez un fournisseur');
    if (lignesForm.length === 0) return toast.error('Ajoutez au moins un produit');

    if (isRetroactif) {
      if (!formDateAchat) return toast.error('Sélectionnez la date d\'achat');
      const today = new Date();
      if (new Date(formDateAchat) > today) {
        return toast.error('La date rétroactive ne peut pas être dans le futur');
      }
    } else {
      if (!formDatePrevueReception) return toast.error('Sélectionnez une date de réception prévue');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(formDatePrevueReception) < today) {
        return toast.error('La date prévue ne peut pas être dans le passé');
      }
    }

    setCreating(true);
    try {
      const payloadLignes = lignesForm.map((l) => ({
        produitId: l.produitId,
        quantiteCommandee: l.quantiteCommandee,
        prixAchatUnitaireHt: l.prixAchatUnitaireHt,
      }));

      if (isRetroactif) {
        await achatsService.createRetroactif({
          fournisseurId: formFournisseur,
          dateAchat: formDateAchat,
          lignes: payloadLignes,
        });
        toast.success("Achat rétroactif enregistré et stock mis à jour !");
      } else {
        await achatsService.create({
          fournisseurId: formFournisseur,
          datePrevueReception: formDatePrevueReception,
          lignes: payloadLignes,
        });
        toast.success("Bon d'achat créé !");
      }
      
      setShowCreate(false);
      loadAchats();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  };

  const openDetail = async (id: string) => {
    setLoadingDetail(id);
    try {
      const detail = await achatsService.getById(id);
      setSelectedAchat(detail);
      // Pré-remplir les lignes de réception si le bon est EN_ATTENTE
      if (detail.statutAchat === 'EN_ATTENTE' && detail.lignes) {
        setLignesReception(
          detail.lignes.map((l) => ({
            produitId: l.produitId,
            produitLibelle: l.produitLibelle,
            quantiteCommandee: l.quantiteCommandee,
            quantiteRecue: l.quantiteCommandee, // Pré-rempli avec la qté commandée
            prixAchatUnitaireHt: l.prixAchatUnitaireHt,
          }))
        );
      }
      setShowDetail(true);
    } catch {
      toast.error('Impossible de charger les détails');
    } finally {
      setLoadingDetail(null);
    }
  };

  // Mise à jour d'une ligne de réception (qté reçue ou prix)
  const updateLigneReception = (
    idx: number,
    field: 'quantiteRecue' | 'prixAchatUnitaireHt',
    value: string
  ) => {
    setLignesReception((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [field]: Number(value) } : l))
    );
  };

  // Totaux recalculés en temps réel pour la réception
  const totalReceptionHt = lignesReception.reduce(
    (s, l) => s + l.quantiteRecue * l.prixAchatUnitaireHt,
    0
  );
  const totalReceptionTtc = totalReceptionHt * (1 + tauxTva);

  const handleValiderReception = async () => {
    if (lignesReception.length === 0) return;
    const hasNegativeQte = lignesReception.some((l) => l.quantiteRecue < 0);
    if (hasNegativeQte) return toast.error('Les quantités reçues ne peuvent pas être négatives');
    if (!confirm('Confirmer la réception ? Les stocks seront mis à jour et les totaux recalculés.'))
      return;
    setValidating(true);
    try {
      await achatsService.validerReception(
        selectedAchat!.id,
        lignesReception.map((l) => ({
          produitId: l.produitId,
          quantiteRecue: l.quantiteRecue,
          prixAchatUnitaireHt: l.prixAchatUnitaireHt,
        }))
      );
      toast.success('Réception validée ! Stocks et totaux mis à jour.');
      setShowDetail(false);
      loadAchats();
    } catch {
      toast.error('Erreur lors de la validation');
    } finally {
      setValidating(false);
    }
  };

  // Annulation d'un bon (« retour d'achat »)
  const handleAnnuler = async () => {
    if (!selectedAchat) return;
    if (!confirm("Annuler ce bon d'achat ? Cette action est irréversible.")) return;
    setCancelling(true);
    try {
      await achatsService.annuler(selectedAchat.id);
      toast.success("Bon d'achat annulé.");
      setShowDetail(false);
      loadAchats();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'annulation");
    } finally {
      setCancelling(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAchat) return;
    if (!confirm("Supprimer ce bon d'achat ? S'il est réceptionné, les stocks seront décrémentés (action irréversible).")) return;
    setCancelling(true);
    try {
      await achatsService.remove(selectedAchat.id);
      toast.success("Bon d'achat supprimé avec succès.");
      setShowDetail(false);
      loadAchats();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la suppression");
    } finally {
      setCancelling(false);
    }
  };

  // Export CSV
  const exportCSV = () => {
    if (filtered.length === 0) return toast.error('Aucune donnée à exporter');
    const headers = [
      'Référence',
      'Fournisseur',
      'Date commande',
      'Date réception',
      'Montant HT',
      'Montant TTC',
      'Statut',
    ];
    const rows = filtered.map((a) => [
      a.numeroFactureFournisseur,
      a.fournisseurNom,
      new Date(a.dateAchat).toLocaleDateString('fr-FR'),
      a.dateReception ? new Date(a.dateReception).toLocaleDateString('fr-FR') : '',
      a.montantTotalHt.toFixed(2),
      a.montantTotalTtc.toFixed(2),
      STATUT_CONFIG[a.statutAchat]?.label || a.statutAchat,
    ]);
    const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `achats_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Export CSV téléchargé !');
  };

  // Filtrage avec dates
  const filtered = achats.filter((a) => {
    const matchSearch =
      a.numeroFactureFournisseur.toLowerCase().includes(search.toLowerCase()) ||
      a.fournisseurNom.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === 'all' || a.statutAchat === filterStatut;
    const matchDateDebut = !filterDateDebut || a.dateAchat >= filterDateDebut;
    const matchDateFin = !filterDateFin || a.dateAchat <= filterDateFin + 'T23:59:59';
    return matchSearch && matchStatut && matchDateDebut && matchDateFin;
  });

  const totalMontant = achats
    .filter((a) => a.statutAchat === 'RECU')
    .reduce((s, a) => s + a.montantTotalHt, 0);
  const enAttente = achats.filter((a) => a.statutAchat === 'EN_ATTENTE').length;
  // KPI: bons en attente dont la date prévue de réception est dépassée
  const enRetard = achats.filter((a) => {
    if (a.statutAchat !== 'EN_ATTENTE' || !a.datePrevueReception) return false;
    const jours = Math.floor(
      (Date.now() - new Date(a.datePrevueReception).getTime()) / (1000 * 60 * 60 * 24)
    );
    return jours > 0;
  }).length;

  return (
    <AppLayout currentPath="/achats">
      <Topbar
        title="Achats & Approvisionnements"
        subtitle="Bons de commande et réceptions fournisseurs"
      />
      <div className="px-6 py-6 max-w-screen-2xl mx-auto space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="kpi-card-info">
            <p className="text-xs text-muted-foreground mb-1">Total achats reçus</p>
            <p className="text-xl font-bold text-foreground tabular-nums">
              {totalMontant.toLocaleString('fr-FR')} {devise}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {achats.filter((a) => a.statutAchat === 'RECU').length} commandes reçues
            </p>
          </div>
          <div className="kpi-card-warning">
            <p className="text-xs text-muted-foreground mb-1">En attente réception</p>
            <p className="text-xl font-bold text-warning tabular-nums">{enAttente}</p>
            <p className="text-xs text-muted-foreground mt-1">bons envoyés</p>
          </div>
          <div className="kpi-card-neutral">
            <p className="text-xs text-muted-foreground mb-1">Total Commandes</p>
            <p className="text-xl font-bold text-foreground tabular-nums">{achats.length}</p>
            <p className="text-xs text-muted-foreground mt-1">historique</p>
          </div>
          <div className="kpi-card-negative">
            <p className="text-xs text-muted-foreground mb-1">Annulés</p>
            <p className="text-xl font-bold text-negative tabular-nums">
              {achats.filter((a) => a.statutAchat === 'ANNULE').length}
            </p>
          </div>
          <div className={`kpi-card-${enRetard > 0 ? 'negative' : 'neutral'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              {enRetard > 0 && <AlertTriangle size={12} className="text-negative" />}
              <p className="text-xs text-muted-foreground">Retard &gt; 7j</p>
            </div>
            <p
              className={`text-xl font-bold tabular-nums ${enRetard > 0 ? 'text-negative' : 'text-foreground'}`}
            >
              {enRetard}
            </p>
            <p className="text-xs text-muted-foreground mt-1">bons en retard</p>
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
                placeholder="Référence, fournisseur..."
                className="input-field pl-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={filterDateDebut}
                onChange={(e) => setFilterDateDebut(e.target.value)}
                className="input-field text-sm w-auto"
                title="Date début"
              />
              <input
                type="date"
                value={filterDateFin}
                onChange={(e) => setFilterDateFin(e.target.value)}
                className="input-field text-sm w-auto"
                title="Date fin"
              />
              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                className="input-field text-sm w-auto"
              >
                <option value="all">Tous les statuts</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="RECU">Reçu</option>
                <option value="ANNULE">Annulé</option>
              </select>
              <button
                onClick={exportCSV}
                className="btn-secondary flex items-center gap-1.5 text-sm py-2"
              >
                <Download size={14} /> CSV
              </button>
              <button
                onClick={openCreateModal}
                className="btn-primary flex items-center gap-1.5 text-sm py-2"
              >
                <Plus size={14} /> Nouveau bon
              </button>
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
                    Fournisseur
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Date commande
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Date réception
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Montant HT
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
                      <Loader2 className="animate-spin mx-auto mb-2" size={24} /> Chargement...
                    </td>
                  </tr>
                ) : (
                  filtered.map((achat, idx) => (
                    <tr
                      key={achat.id}
                      className={`border-b border-border table-row-hover ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}
                    >
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                        {achat.numeroFactureFournisseur}
                      </td>
                      <td className="px-5 py-3 font-medium text-foreground">
                        {achat.fournisseurNom}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        <div>{new Date(achat.dateAchat).toLocaleDateString('fr-FR')}</div>
                        {achat.datePrevueReception && (
                          <div className="text-[10px] text-primary mt-0.5">
                            Prévue: {new Date(achat.datePrevueReception).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {achat.dateReception
                          ? new Date(achat.dateReception).toLocaleDateString('fr-FR')
                          : '—'}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums font-semibold text-foreground">
                        {achat.montantTotalHt.toLocaleString('fr-FR')} {devise}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={STATUT_CONFIG[achat.statutAchat]?.className}>
                          {STATUT_CONFIG[achat.statutAchat]?.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => openDetail(achat.id)}
                          disabled={loadingDetail === achat.id}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
                        >
                          {loadingDetail === achat.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Eye size={12} />
                          )}{' '}
                          Détail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && filtered.length === 0 && (
            <div className="py-16 text-center">
              <Truck size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Aucun bon d&apos;achat trouvé</p>
            </div>
          )}
          <div className="px-5 py-3 border-t border-border text-xs text-muted-foreground">
            {!loading ? filtered.length : 0} résultat{!loading && filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* MODALE CRÉATION */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Nouveau bon d&apos;achat</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Fournisseur *
                  </label>
                  <select
                    value={formFournisseur}
                    onChange={(e) => setFormFournisseur(e.target.value)}
                    className="input-field text-sm"
                  >
                    <option value="">Sélectionner...</option>
                    {fournisseurs.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nomEntreprise}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isRetroactif}
                      onChange={(e) => setIsRetroactif(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    Saisir un achat ultérieur (déjà reçu)
                  </label>
                </div>
                {isRetroactif ? (
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Date réelle de l'achat/réception *
                    </label>
                    <input
                      type="date"
                      max={new Date().toISOString().split('T')[0]}
                      value={formDateAchat}
                      onChange={(e) => setFormDateAchat(e.target.value)}
                      className="input-field text-sm w-full"
                    />
                  </div>
                ) : (
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      Date prévue de réception *
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={formDatePrevueReception}
                      onChange={(e) => setFormDatePrevueReception(e.target.value)}
                      className="input-field text-sm w-full"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Ajouter un produit
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedProduit}
                    onChange={(e) => setSelectedProduit(e.target.value)}
                    className="input-field text-sm flex-1"
                  >
                    <option value="">Choisir un produit...</option>
                    {produits.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.libelle} (stock: {p.stock})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={addLigne}
                    className="btn-secondary text-sm py-2 px-3 flex items-center gap-1"
                  >
                    <Plus size={14} /> Ajouter
                  </button>
                </div>
              </div>
              {lignesForm.length > 0 && (
                <div className="card-base overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">
                          Produit
                        </th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">
                          Qté
                        </th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">
                          PU HT
                        </th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">
                          Total
                        </th>
                        <th className="px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lignesForm.map((l, idx) => (
                        <tr key={idx} className="border-b border-border last:border-0">
                          <td className="px-4 py-2 text-foreground">{l.produitLibelle}</td>
                          <td className="px-4 py-2 text-right">
                            <input
                              type="number"
                              min="1"
                              value={l.quantiteCommandee}
                              onChange={(e) =>
                                updateLigne(idx, 'quantiteCommandee', e.target.value)
                              }
                              className="input-field w-20 text-right py-1 text-sm"
                            />
                          </td>
                          <td className="px-4 py-2 text-right">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={l.prixAchatUnitaireHt}
                              onChange={(e) =>
                                updateLigne(idx, 'prixAchatUnitaireHt', e.target.value)
                              }
                              className="input-field w-28 text-right py-1 text-sm"
                            />
                          </td>
                          <td className="px-4 py-2 text-right font-medium tabular-nums">
                            {(l.quantiteCommandee * l.prixAchatUnitaireHt).toLocaleString('fr-FR')}{' '}
                            {devise}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              onClick={() => removeLigne(idx)}
                              className="text-muted-foreground hover:text-negative"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-4 py-2 border-t border-border flex justify-end text-sm font-bold text-foreground">
                    Total HT :{' '}
                    <span className="ml-2 tabular-nums">
                      {totalFormHt.toLocaleString('fr-FR')} {devise}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowCreate(false)} className="btn-secondary text-sm py-2">
                Annuler
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="btn-primary text-sm py-2 flex items-center gap-2"
              >
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Package size={14} />}{' '}
                Créer le bon
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DÉTAIL / RÉCEPTION INTERACTIVE */}
      {showDetail && selectedAchat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-foreground">
                    Bon d&apos;achat — {selectedAchat.numeroFactureFournisseur}
                  </h3>
                  {selectedAchat.createdAt && new Date(selectedAchat.dateAchat).toDateString() !== new Date(selectedAchat.createdAt).toDateString() && (
                    <span className="badge-purple text-[10px]">Rétroactif</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Fournisseur : <span className="font-semibold text-foreground">{selectedAchat.fournisseurNom}</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Saisi le {selectedAchat.createdAt ? new Date(selectedAchat.createdAt).toLocaleString('fr-FR') : 'N/A'} par <span className="font-medium text-foreground">{selectedAchat.utilisateurNom || 'Inconnu'}</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Date de l'achat : {new Date(selectedAchat.dateAchat).toLocaleDateString('fr-FR')}
                  {selectedAchat.dateReception && ` • Réceptionné le ${new Date(selectedAchat.dateReception).toLocaleDateString('fr-FR')}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={STATUT_CONFIG[selectedAchat.statutAchat]?.className}>
                  {STATUT_CONFIG[selectedAchat.statutAchat]?.label}
                </span>
                <button
                  onClick={() => setShowDetail(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="px-6 py-5 overflow-y-auto flex-1">
              {/* Mode EN_ATTENTE : formulaire interactif de réception */}
              {selectedAchat.statutAchat === 'EN_ATTENTE' && lignesReception.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={14} className="text-primary" />
                    <p className="text-sm font-semibold text-foreground">
                      Saisie de réception — Modifiez les quantités reçues et les prix si nécessaire
                    </p>
                  </div>
                  <div className="card-base overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">
                            Produit
                          </th>
                          <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">
                            Qté commandée
                          </th>
                          <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">
                            Qté reçue
                          </th>
                          <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">
                            PU HT
                          </th>
                          <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">
                            Total ligne
                          </th>
                          <th className="text-center px-4 py-2 text-xs font-semibold text-muted-foreground">
                            Écart
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {lignesReception.map((l, idx) => {
                          const ecart = l.quantiteRecue - l.quantiteCommandee;
                          const isNonRecu = l.quantiteRecue === 0;
                          return (
                            <tr key={idx} className={`border-b border-border last:border-0 ${isNonRecu ? 'opacity-60 bg-muted/30' : ''}`}>
                              <td className="px-4 py-3 font-medium text-foreground">
                                {l.produitLibelle}
                                {isNonRecu && <span className="ml-2 badge-rupture text-[10px]">Non reçu</span>}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                                {l.quantiteCommandee}
                              </td>
                              <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                                {!isNonRecu && (
                                  <button
                                    type="button"
                                    title="Marquer comme non reçu"
                                    onClick={() => updateLigneReception(idx, 'quantiteRecue', '0')}
                                    className="text-xs text-negative hover:underline"
                                  >
                                    ❌
                                  </button>
                                )}
                                <input
                                  type="number"
                                  min="0"
                                  value={l.quantiteRecue}
                                  onChange={(e) =>
                                    updateLigneReception(idx, 'quantiteRecue', e.target.value)
                                  }
                                  className="input-field w-20 text-right py-1 text-sm"
                                />
                              </td>
                              <td className="px-4 py-3 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={l.prixAchatUnitaireHt}
                                  onChange={(e) =>
                                    updateLigneReception(idx, 'prixAchatUnitaireHt', e.target.value)
                                  }
                                  className="input-field w-28 text-right py-1 text-sm"
                                  disabled={isNonRecu}
                                />
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums font-medium text-foreground">
                                {(l.quantiteRecue * l.prixAchatUnitaireHt).toLocaleString('fr-FR')}{' '}
                                {devise}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {ecart === 0 ? (
                                  <span className="inline-flex items-center gap-1 text-xs text-positive font-semibold">
                                    <CheckCircle size={12} /> OK
                                  </span>
                                ) : (
                                  <span
                                    className={`inline-flex items-center gap-1 text-xs font-semibold ${ecart > 0 ? 'text-primary' : 'text-negative'}`}
                                  >
                                    <AlertTriangle size={12} /> {ecart > 0 ? '+' : ''}
                                    {ecart}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="px-4 py-3 border-t border-border space-y-1">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Total HT (recalculé)</span>
                        <span className="tabular-nums font-medium text-foreground">
                          {totalReceptionHt.toLocaleString('fr-FR')} {devise}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Total TTC (estimé)</span>
                        <span className="tabular-nums font-bold text-foreground">
                          {totalReceptionTtc.toLocaleString('fr-FR')} {devise}
                        </span>
                      </div>
                      {totalReceptionHt !== selectedAchat.montantTotalHt && (
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-warning flex items-center gap-1">
                            <AlertTriangle size={11} /> Écart avec le montant initial
                          </span>
                          <span className="tabular-nums font-semibold text-warning">
                            {totalReceptionHt - selectedAchat.montantTotalHt > 0 ? '+' : ''}
                            {(totalReceptionHt - selectedAchat.montantTotalHt).toLocaleString(
                              'fr-FR'
                            )}{' '}
                            {devise}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Mode lecture seule (RECU / ANNULE) */
                <div className="card-base overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">
                          Produit
                        </th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">
                          Qté commandée
                        </th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">
                          Qté reçue
                        </th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">
                          PU HT
                        </th>
                        <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAchat.lignes?.map((l) => (
                        <tr
                          key={l.id}
                          className="border-b border-border last:border-0 table-row-hover"
                        >
                          <td className="px-4 py-3 font-medium text-foreground">
                            {l.produitLibelle}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                            {l.quantiteCommandee}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {selectedAchat.statutAchat === 'RECU' ? (
                              <span className="text-positive font-semibold">{l.quantiteRecue}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                            {l.prixAchatUnitaireHt.toLocaleString('fr-FR')}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-medium text-foreground">
                            {(l.quantiteCommandee * l.prixAchatUnitaireHt).toLocaleString('fr-FR')}{' '}
                            {devise}
                          </td>
                        </tr>
                      )) || (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center py-4 text-muted-foreground text-xs italic"
                          >
                            Aucune ligne
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <div className="px-4 py-3 border-t border-border grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Total HT</span>
                      <span className="tabular-nums font-medium text-foreground">
                        {selectedAchat.montantTotalHt.toLocaleString('fr-FR')} {devise}
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Total TTC</span>
                      <span className="tabular-nums font-bold text-foreground">
                        {selectedAchat.montantTotalTtc.toLocaleString('fr-FR')} {devise}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <div>
                {(currentUser?.role === 'ADMIN' || selectedAchat.utilisateurId === currentUser?.id) && (
                  <div className="flex gap-2">
                    {selectedAchat.statutAchat === 'EN_ATTENTE' && (
                      <button
                        onClick={handleAnnuler}
                        disabled={cancelling}
                        className="text-sm py-2 px-3 rounded-lg border border-warning/30 text-warning hover:bg-warning/10 transition-colors flex items-center gap-2"
                      >
                        {cancelling ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Ban size={14} />
                        )}{' '}
                        Annuler le bon
                      </button>
                    )}
                    <button
                      onClick={handleDelete}
                      disabled={cancelling}
                      className="text-sm py-2 px-3 rounded-lg border border-negative/30 text-negative hover:bg-negative/10 transition-colors flex items-center gap-2"
                    >
                      {cancelling ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Trash2 size={14} />
                      )}{' '}
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowDetail(false)} className="btn-secondary text-sm py-2">
                  Fermer
                </button>
                {(currentUser?.role === 'ADMIN' || selectedAchat.utilisateurId === currentUser?.id) && selectedAchat.statutAchat === 'EN_ATTENTE' && (
                  <button
                    onClick={handleValiderReception}
                    disabled={validating}
                    className="btn-primary text-sm py-2 flex items-center gap-2"
                  >
                    {validating ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle size={14} />
                    )}{' '}
                    Valider la réception
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
