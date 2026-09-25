'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import {
  Search,
  Plus,
  CheckCircle,
  Clock,
  Save,
  Eye,
  Loader2,
  ArrowLeft,
  AlertTriangle,
  Ban,
  User,
  Calendar,
  ShieldAlert,
  X,
  FileSpreadsheet,
  Check,
  Download,
  Layers,
  Archive,
  Store,
  Filter,
  Tag,
} from 'lucide-react';
import {
  inventaireService,
  InventaireItem,
  LigneInventaireItem,
} from '@/services/inventaire.service';
import { produitsService } from '@/services/produits.service';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { exportToCSV } from '@/utils/export';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';

const STATUT_SESSION: Record<string, { label: string; className: string; icon: any }> = {
  EN_COURS: { label: 'En cours de saisie', className: 'badge-draft', icon: Clock },
  VALIDE: { label: 'Validé', className: 'badge-active', icon: CheckCircle },
  ANNULE: { label: 'Invalidé', className: 'badge-rupture', icon: Ban },
};

interface InventaireTypeInfo {
  type: 'GLOBAL' | 'RESERVE' | 'VENTE';
  label: string;
  shortLabel: string;
  badgeClass: string;
  bgLight: string;
  textColor: string;
  borderColor: string;
  icon: React.ElementType;
  description: string;
  targetScope: string;
  fieldImpact: string;
}

function getInventaireTypeInfo(ref: string = '', observations: string = ''): InventaireTypeInfo {
  const upper = (ref + ' ' + observations).toUpperCase();
  if (upper.includes('-RES') || upper.includes('INV-RES') || upper.includes('RÉSERVE') || upper.includes('RESERVE')) {
    return {
      type: 'RESERVE',
      label: 'Inventaire Réserve',
      shortLabel: 'Réserve',
      badgeClass: 'bg-blue-500/10 text-blue-600 border border-blue-500/30 dark:bg-blue-950 dark:text-blue-300',
      bgLight: 'bg-blue-500/5 dark:bg-blue-950/30',
      textColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-500/30',
      icon: Archive,
      description: 'Stock en Réserve (Entrepôt)',
      targetScope: 'Réserve',
      fieldImpact: 'Quantité en Réserve uniquement',
    };
  }
  if (upper.includes('-VTE') || upper.includes('INV-VTE') || upper.includes('VENTE') || upper.includes('ETAL')) {
    return {
      type: 'VENTE',
      label: 'Inventaire En Vente',
      shortLabel: 'En Vente',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 dark:bg-emerald-950 dark:text-emerald-300',
      bgLight: 'bg-emerald-500/5 dark:bg-emerald-950/30',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-500/30',
      icon: Store,
      description: 'Stock En Vente (Étal & Rayons Magasin)',
      targetScope: 'En Vente (Étal)',
      fieldImpact: 'Quantité En Vente (Étal) uniquement',
    };
  }
  return {
    type: 'GLOBAL',
    label: 'Inventaire Global',
    shortLabel: 'Global',
    badgeClass: 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/30 dark:bg-indigo-950 dark:text-indigo-300',
    bgLight: 'bg-indigo-500/5 dark:bg-indigo-950/30',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    borderColor: 'border-indigo-500/30',
    icon: Layers,
    description: 'Stock Global (Réserve + En Vente cumulés)',
    targetScope: 'Global (Réserve + Vente)',
    fieldImpact: 'Stock Global (Réserve et Vente)',
  };
}

function formatDateTime(isoString?: string) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '—';
  const dateStr = d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${dateStr} à ${timeStr}`;
}

export default function InventairePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN' || user?.roleUi === 'super_admin';

  const [inventaires, setInventaires] = useState<InventaireItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'sessions' | 'saisie'>('sessions');
  const [search, setSearch] = useState('');
  const [sessionSearch, setSessionSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'GLOBAL' | 'RESERVE' | 'VENTE'>('all');

  // Saisie state & metadata
  const [lignes, setLignes] = useState<LigneInventaireItem[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [currentRef, setCurrentRef] = useState<string>('');
  const [currentStatut, setCurrentStatut] = useState<'EN_COURS' | 'VALIDE' | 'ANNULE'>('EN_COURS');
  const [currentObservations, setCurrentObservations] = useState<string>('');
  const [currentResponsableNom, setCurrentResponsableNom] = useState<string>('');
  const [currentDateInventaire, setCurrentDateInventaire] = useState<string>('');
  const [currentDateValidation, setCurrentDateValidation] = useState<string | undefined>(undefined);
  const [currentValidateurNom, setCurrentValidateurNom] = useState<string | undefined>(undefined);
  const [currentDemandeInvalidation, setCurrentDemandeInvalidation] = useState<boolean>(false);
  const [currentMotifInvalidation, setCurrentMotifInvalidation] = useState<string | undefined>(undefined);
  const [currentDateDemande, setCurrentDateDemande] = useState<string | undefined>(undefined);
  const [currentDemandeurNom, setCurrentDemandeurNom] = useState<string | undefined>(undefined);
  const [currentDateInvalidation, setCurrentDateInvalidation] = useState<string | undefined>(undefined);
  const [currentUtilisateurInvalidationNom, setCurrentUtilisateurInvalidationNom] = useState<string | undefined>(undefined);

  const [saving, setSaving] = useState(false);

  // Modals state
  const [showDemandeModal, setShowDemandeModal] = useState(false);
  const [motifInput, setMotifInput] = useState('');
  const [submittingDemande, setSubmittingDemande] = useState(false);

  const [showAdminInvaliderModal, setShowAdminInvaliderModal] = useState(false);
  const [submittingInvalider, setSubmittingInvalider] = useState(false);

  const loadInventaires = async () => {
    setLoading(true);
    try {
      const data = await inventaireService.getAll();
      setInventaires(data);
    } catch (err) {
      toast.error('Erreur lors du chargement des inventaires');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventaires();
  }, []);

  const handleNouvelInventaire = async (type: 'GLOBAL' | 'RESERVE' | 'VENTE') => {
    setLoading(true);
    try {
      const res = await produitsService.getAll({ pageSize: 10000 });
      const produits = res.data;
      const initialLignes = produits.map((p) => {
        let theQte = 0;
        if (type === 'GLOBAL') theQte = p.stock || 0;
        else if (type === 'RESERVE') theQte = p.quantiteEnStock || 0;
        else if (type === 'VENTE') theQte = p.quantiteEtal || 0;

        return {
          id: `temp-${p.id}`,
          produitId: p.id,
          produitLibelle: p.libelle,
          quantiteTheorique: theQte,
          quantiteReelle: 0,
          ecart: 0 - theQte,
        };
      });
      setLignes(initialLignes);
      setCurrentId(null);

      const prefix = type === 'GLOBAL' ? 'GLO' : type === 'RESERVE' ? 'RES' : 'VTE';
      const obs =
        type === 'GLOBAL'
          ? 'Inventaire Global (Réserve + En Vente cumulés)'
          : type === 'RESERVE'
          ? 'Inventaire Réserve (Stock Entrepôt)'
          : 'Inventaire En Vente (Stock Rayons & Étal Magasin)';

      setCurrentRef(
        `INV-${prefix}-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-NOUVEAU`
      );
      setCurrentObservations(obs);
      setCurrentStatut('EN_COURS');
      setCurrentResponsableNom(user?.name || 'Moi-même');
      setCurrentDateInventaire(new Date().toISOString());
      setCurrentDateValidation(undefined);
      setCurrentValidateurNom(undefined);
      setCurrentDemandeInvalidation(false);
      setCurrentMotifInvalidation(undefined);
      setCurrentDateDemande(undefined);
      setCurrentDemandeurNom(undefined);
      setCurrentDateInvalidation(undefined);
      setCurrentUtilisateurInvalidationNom(undefined);
      setActiveTab('saisie');
    } catch (e) {
      toast.error('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const handleVoir = async (id: string) => {
    setLoading(true);
    try {
      const detail = await inventaireService.getById(id);
      setLignes(detail.lignes || []);
      setCurrentId(detail.id);
      setCurrentRef(detail.referenceInventaire);
      setCurrentStatut(detail.statutInventaire);
      setCurrentObservations(detail.observations || '');
      setCurrentResponsableNom(detail.utilisateurNom || 'Inconnu');
      setCurrentDateInventaire(detail.dateInventaire);
      setCurrentDateValidation(detail.dateValidation);
      setCurrentValidateurNom(detail.validateurNom);
      setCurrentDemandeInvalidation(!!detail.demandeInvalidation);
      setCurrentMotifInvalidation(detail.motifInvalidation);
      setCurrentDateDemande(detail.dateDemandeInvalidation);
      setCurrentDemandeurNom(detail.demandeurInvalidationNom);
      setCurrentDateInvalidation(detail.dateInvalidation);
      setCurrentUtilisateurInvalidationNom(detail.utilisateurInvalidationNom);
      setActiveTab('saisie');
    } catch (e) {
      toast.error('Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };

  const updateCompte = (produitId: string, value: string) => {
    if (currentStatut === 'VALIDE' || currentStatut === 'ANNULE') return;
    const num = parseInt(value);
    setLignes((prev) =>
      prev.map((l) => {
        if (l.produitId !== produitId) return l;
        if (isNaN(num)) return { ...l, quantiteReelle: 0, ecart: 0 - l.quantiteTheorique };
        return { ...l, quantiteReelle: num, ecart: num - l.quantiteTheorique };
      })
    );
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const payloadLignes = lignes.map((l) => ({
        produitId: l.produitId,
        quantiteTheorique: l.quantiteTheorique,
        quantiteReelle: l.quantiteReelle,
      }));

      const typeInfo = getInventaireTypeInfo(currentRef, currentObservations);
      const obsToSave = currentObservations || typeInfo.label;

      if (currentId) {
        await inventaireService.update(currentId, { observations: obsToSave, lignes: payloadLignes });
        toast.success('Brouillon mis à jour !');
      } else {
        let prefix = 'INV-GLO';
        if (typeInfo.type === 'RESERVE') prefix = 'INV-RES';
        else if (typeInfo.type === 'VENTE') prefix = 'INV-VTE';

        const ref = `${prefix}-${new Date()
          .toISOString()
          .replace(/[-:T.]/g, '')
          .slice(0, 14)}`;
        const res = await inventaireService.create({
          referenceInventaire: ref,
          observations: obsToSave,
          lignes: payloadLignes,
        });
        setCurrentId(res.id);
        setCurrentRef(res.referenceInventaire);
        setCurrentObservations(res.observations || obsToSave);
        setCurrentResponsableNom(res.utilisateurNom || user?.name || 'Moi-même');
        toast.success('Brouillon créé !');
      }
      loadInventaires();
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleValider = async () => {
    if (
      !confirm(
        'Attention : Cette action va clôturer l\'inventaire et actualiser le stock officiel de la librairie selon vos comptages. Voulez-vous continuer ?'
      )
    )
      return;
    setSaving(true);
    try {
      let invId = currentId;
      const payloadLignes = lignes.map((l) => ({
        produitId: l.produitId,
        quantiteTheorique: l.quantiteTheorique,
        quantiteReelle: l.quantiteReelle,
      }));

      const typeInfo = getInventaireTypeInfo(currentRef, currentObservations);
      const obsToSave = currentObservations || typeInfo.label;

      if (!invId) {
        let prefix = 'INV-GLO';
        if (typeInfo.type === 'RESERVE') prefix = 'INV-RES';
        else if (typeInfo.type === 'VENTE') prefix = 'INV-VTE';

        const ref = `${prefix}-${new Date()
          .toISOString()
          .replace(/[-:T.]/g, '')
          .slice(0, 14)}`;
        const res = await inventaireService.create({
          referenceInventaire: ref,
          observations: obsToSave,
          lignes: payloadLignes,
        });
        invId = res.id;
      } else {
        await inventaireService.update(invId, { observations: obsToSave, lignes: payloadLignes });
      }

      const validated = await inventaireService.valider(invId);
      setCurrentStatut(validated.statutInventaire);
      setCurrentDateValidation(validated.dateValidation || new Date().toISOString());
      setCurrentValidateurNom(validated.validateurNom || user?.name || 'Moi-même');
      toast.success('Inventaire validé ! Les stocks ont été mis à jour et le rapport est disponible.');
      loadInventaires();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la validation');
    } finally {
      setSaving(false);
    }
  };

  // Soumission de la demande d'invalidation (avec motif obligatoire)
  const handleSubmitDemandeInvalidation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentId) return;
    if (!motifInput.trim()) {
      toast.error('Veuillez renseigner le motif obligatoire de la demande d\'invalidation.');
      return;
    }

    setSubmittingDemande(true);
    try {
      const updated = await inventaireService.demanderInvalidation(currentId, motifInput.trim());
      setCurrentDemandeInvalidation(true);
      setCurrentMotifInvalidation(updated.motifInvalidation || motifInput.trim());
      setCurrentDateDemande(updated.dateDemandeInvalidation || new Date().toISOString());
      setCurrentDemandeurNom(updated.demandeurInvalidationNom || user?.name || 'Moi-même');
      setShowDemandeModal(false);
      setMotifInput('');
      toast.success('Demande d\'invalidation transmise aux administrateurs avec succès !');
      loadInventaires();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la soumission de la demande');
    } finally {
      setSubmittingDemande(false);
    }
  };

  // Traitement Admin : Invalider l'inventaire
  const handleExecuteInvalider = async () => {
    if (!currentId) return;
    setSubmittingInvalider(true);
    try {
      const updated = await inventaireService.invalider(currentId);
      setCurrentStatut(updated.statutInventaire);
      setCurrentDemandeInvalidation(false);
      setCurrentDateInvalidation(updated.dateInvalidation || new Date().toISOString());
      setCurrentUtilisateurInvalidationNom(updated.utilisateurInvalidationNom || user?.name || 'Administrateur');
      setShowAdminInvaliderModal(false);
      toast.success('Inventaire invalidé ! Les ajustements de stock ont été automatiquement annulés.');
      loadInventaires();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'invalidation');
    } finally {
      setSubmittingInvalider(false);
    }
  };

  // Traitement Admin : Rejeter la demande d'invalidation
  const handleRejeterDemande = async () => {
    if (!currentId) return;
    if (!confirm('Confirmez-vous le rejet de cette demande d\'invalidation ? L\'inventaire restera validé.')) {
      return;
    }
    setSaving(true);
    try {
      await inventaireService.rejeterInvalidation(currentId);
      setCurrentDemandeInvalidation(false);
      toast.info('La demande d\'invalidation a été rejetée.');
      loadInventaires();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors du rejet de la demande');
    } finally {
      setSaving(false);
    }
  };

  const filteredLignes = lignes.filter((l) =>
    l.produitLibelle.toLowerCase().includes(search.toLowerCase())
  );

  const filteredInventaires = inventaires.filter((inv) => {
    const typeInfo = getInventaireTypeInfo(inv.referenceInventaire, inv.observations);
    if (filterType !== 'all' && typeInfo.type !== filterType) return false;
    if (sessionSearch.trim()) {
      const q = sessionSearch.toLowerCase();
      const matchRef = inv.referenceInventaire.toLowerCase().includes(q);
      const matchUser = (inv.utilisateurNom || '').toLowerCase().includes(q);
      const matchObs = (inv.observations || '').toLowerCase().includes(q);
      const matchType = typeInfo.label.toLowerCase().includes(q) || typeInfo.shortLabel.toLowerCase().includes(q);
      return matchRef || matchUser || matchObs || matchType;
    }
    return true;
  });

  const countTotal = inventaires.length;
  const countGlobal = inventaires.filter((i) => getInventaireTypeInfo(i.referenceInventaire, i.observations).type === 'GLOBAL').length;
  const countReserve = inventaires.filter((i) => getInventaireTypeInfo(i.referenceInventaire, i.observations).type === 'RESERVE').length;
  const countVente = inventaires.filter((i) => getInventaireTypeInfo(i.referenceInventaire, i.observations).type === 'VENTE').length;

  const currentTypeInfo = getInventaireTypeInfo(currentRef, currentObservations);
  const CurrentTypeIcon = currentTypeInfo.icon;

  const isBlindMode = currentStatut === 'EN_COURS';

  let compteCount = 0;
  let waitCount = 0;
  let ecartCount = 0;
  lignes.forEach((l) => {
    if (l.quantiteReelle === 0 && !currentId) {
      waitCount++;
    } else {
      compteCount++;
      if (l.ecart !== 0) ecartCount++;
    }
  });

  const progress = lignes.length > 0 ? Math.round((compteCount / lignes.length) * 100) : 0;

  const handleExportInventaires = () => {
    if (filteredInventaires.length === 0) {
      toast.info('Aucun inventaire à exporter');
      return;
    }
    const headers = [
      'Référence Inventaire',
      'Périmètre / Type',
      'Description Périmètre',
      'Date & Heure Réalisation',
      'Responsable',
      'Statut',
      'Date Validation',
      'Validé par',
      'Observations',
    ];
    const data = filteredInventaires.map((inv) => {
      const tInfo = getInventaireTypeInfo(inv.referenceInventaire, inv.observations);
      return [
        inv.referenceInventaire,
        tInfo.label,
        tInfo.description,
        formatDateTime(inv.dateInventaire),
        inv.utilisateurNom || 'Système',
        STATUT_SESSION[inv.statutInventaire]?.label || inv.statutInventaire,
        inv.dateValidation ? formatDateTime(inv.dateValidation) : '—',
        inv.validateurNom || '—',
        inv.observations || '',
      ];
    });
    exportToCSV({ filename: `historique_inventaires_${filterType.toLowerCase()}`, headers, data });
    toast.success('Historique des inventaires exporté avec succès');
  };

  const handleExportLignesInventaire = () => {
    if (lignes.length === 0) {
      toast.info('Aucune ligne d\'inventaire à exporter');
      return;
    }
    const headers = [
      'ID Produit',
      'Désignation Produit',
      `Stock Théorique (${currentTypeInfo.shortLabel})`,
      `Stock Réel Compté (${currentTypeInfo.shortLabel})`,
      `Écart Constaté (${currentTypeInfo.shortLabel})`,
      'Périmètre Inventaire',
      'Motif Ajustement',
    ];
    const data = lignes.map((l) => [
      l.produitId,
      l.produitLibelle,
      isBlindMode ? '—' : l.quantiteTheorique,
      l.quantiteReelle,
      isBlindMode ? '—' : (l.quantiteReelle - l.quantiteTheorique),
      currentTypeInfo.label,
      l.motifAjustement || '',
    ]);
    exportToCSV({
      filename: `feuille_inventaire_${currentTypeInfo.shortLabel.toLowerCase()}_${currentRef || 'en_cours'}`,
      headers,
      data,
    });
    toast.success('Feuille d\'inventaire exportée avec succès');
  };

  return (
    <AppLayout currentPath="/inventaire">
      <Topbar title="Inventaire physique" subtitle="Saisie, contrôle à l'aveugle et gestion des inventaires" />
      <div className="px-6 py-6 max-w-screen-2xl mx-auto space-y-6">
        {activeTab === 'saisie' && (
          <button
            onClick={() => setActiveTab('sessions')}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} /> Retour à l'historique
          </button>
        )}

        {activeTab === 'sessions' ? (
          <div className="space-y-4">
            {/* KPI Cards par Type d'inventaire */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  filterType === 'all'
                    ? 'bg-card border-primary ring-2 ring-primary/20 shadow-sm'
                    : 'bg-card/70 border-border hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Tous inventaires</span>
                  <FileSpreadsheet size={16} className="text-muted-foreground" />
                </div>
                <div className="text-xl font-bold text-foreground mt-1 tabular-nums">{countTotal}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Toutes sessions</div>
              </button>

              <button
                type="button"
                onClick={() => setFilterType('GLOBAL')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  filterType === 'GLOBAL'
                    ? 'bg-indigo-500/10 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                    : 'bg-card/70 border-border hover:border-indigo-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Inventaire Global</span>
                  <Layers size={16} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="text-xl font-bold text-foreground mt-1 tabular-nums">{countGlobal}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Réserve + Vente cumulés</div>
              </button>

              <button
                type="button"
                onClick={() => setFilterType('RESERVE')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  filterType === 'RESERVE'
                    ? 'bg-blue-500/10 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                    : 'bg-card/70 border-border hover:border-blue-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Inventaire Réserve</span>
                  <Archive size={16} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-xl font-bold text-foreground mt-1 tabular-nums">{countReserve}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Stock Entrepôt</div>
              </button>

              <button
                type="button"
                onClick={() => setFilterType('VENTE')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  filterType === 'VENTE'
                    ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'bg-card/70 border-border hover:border-emerald-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Inventaire En Vente</span>
                  <Store size={16} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-xl font-bold text-foreground mt-1 tabular-nums">{countVente}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Stock Rayons / Étal</div>
              </button>
            </div>

            <div className="card-base overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-foreground">Historique des inventaires</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Consultez la traçabilité des inventaires réalisés (Global, Réserve, En Vente) et leur statut de validation.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {hasPermission(user, PERMISSIONS.ACTION_INVENTAIRE_GLOBAL) && (
                    <button
                      onClick={() => handleNouvelInventaire('GLOBAL')}
                      disabled={loading}
                      className="btn-primary bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5 text-xs py-2 disabled:opacity-50"
                      title="Démarrer un inventaire complet (Réserve + Vente)"
                    >
                      {loading ? <Loader2 size={13} className="animate-spin" /> : <Layers size={13} />}
                      Nouveau Global
                    </button>
                  )}
                  {hasPermission(user, PERMISSIONS.ACTION_INVENTAIRE_RESERVE) && (
                    <button
                      onClick={() => handleNouvelInventaire('RESERVE')}
                      disabled={loading}
                      className="btn-primary bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5 text-xs py-2 disabled:opacity-50"
                      title="Démarrer un inventaire de la Réserve uniquement"
                    >
                      {loading ? <Loader2 size={13} className="animate-spin" /> : <Archive size={13} />}
                      Nouveau Réserve
                    </button>
                  )}
                  {hasPermission(user, PERMISSIONS.ACTION_INVENTAIRE_VENTE) && (
                    <button
                      onClick={() => handleNouvelInventaire('VENTE')}
                      disabled={loading}
                      className="btn-primary bg-emerald-600 hover:bg-emerald-700 flex items-center gap-1.5 text-xs py-2 disabled:opacity-50"
                      title="Démarrer un inventaire de l'Étal (En Vente) uniquement"
                    >
                      {loading ? <Loader2 size={13} className="animate-spin" /> : <Store size={13} />}
                      Nouveau En Vente
                    </button>
                  )}
                  <button
                    onClick={handleExportInventaires}
                    disabled={loading}
                    className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-3 disabled:opacity-50"
                    title="Exporter l'historique des inventaires"
                  >
                    <Download size={13} />
                    Exporter
                  </button>
                </div>
              </div>

              {/* Barre de filtres et recherche */}
              <div className="px-5 py-3 border-b border-border bg-muted/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="search"
                    value={sessionSearch}
                    onChange={(e) => setSessionSearch(e.target.value)}
                    placeholder="Filtrer par référence, responsable..."
                    className="input-field pl-9 text-xs py-1.5 w-full"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Filter size={13} /> Périmètre :
                  </span>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="input-field text-xs py-1.5 px-2.5 rounded-lg border-border"
                  >
                    <option value="all">Tous ({countTotal})</option>
                    <option value="GLOBAL">Inventaire Global ({countGlobal})</option>
                    <option value="RESERVE">Inventaire Réserve ({countReserve})</option>
                    <option value="VENTE">Inventaire En Vente ({countVente})</option>
                  </select>
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
                        Périmètre / Type
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                        Date & Heure de réalisation
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                        Responsable
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
                        <td colSpan={6} className="py-12 text-center text-muted-foreground">
                          <Loader2 className="animate-spin mx-auto mb-2 text-primary" size={24} /> Chargement des inventaires...
                        </td>
                      </tr>
                    ) : filteredInventaires.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-muted-foreground">
                          <FileSpreadsheet className="mx-auto mb-2 text-muted-foreground/60" size={28} />
                          Aucun inventaire trouvé pour ce filtre
                        </td>
                      </tr>
                    ) : (
                      filteredInventaires.map((inv, idx) => {
                        const cfg = STATUT_SESSION[inv.statutInventaire] || STATUT_SESSION['EN_COURS'];
                        const typeInfo = getInventaireTypeInfo(inv.referenceInventaire, inv.observations);
                        const TypeIcon = typeInfo.icon;

                        return (
                          <tr
                            key={inv.id}
                            className={`border-b border-border table-row-hover ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}
                          >
                            <td className="px-5 py-3 font-mono text-xs font-semibold text-foreground">
                              <div>{inv.referenceInventaire}</div>
                              {inv.observations && (
                                <div className="text-[11px] text-muted-foreground font-sans font-normal truncate max-w-xs mt-0.5">
                                  {inv.observations}
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-3 text-xs">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${typeInfo.badgeClass}`}>
                                <TypeIcon size={13} />
                                {typeInfo.label}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-foreground text-xs">
                              <div className="flex items-center gap-1.5">
                                <Calendar size={13} className="text-muted-foreground" />
                                <span>{formatDateTime(inv.dateInventaire)}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-foreground text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                                  {inv.utilisateurNom ? inv.utilisateurNom[0].toUpperCase() : 'U'}
                                </div>
                                <span className="font-medium">{inv.utilisateurNom || 'Inconnu'}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-center">
                              {inv.demandeInvalidation ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/30">
                                  <AlertTriangle size={12} /> Demande d'invalidation
                                </span>
                              ) : (
                                <span className={cfg.className}>{cfg.label}</span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-center">
                              <button
                                onClick={() => handleVoir(inv.id)}
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-semibold"
                              >
                                <Eye size={13} />{' '}
                                {inv.statutInventaire === 'EN_COURS' ? 'Reprendre' : 'Consulter'}
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
        ) : (
          <div className="space-y-4">
            {/* Bannière d'invalidation en attente */}
            {currentStatut === 'VALIDE' && currentDemandeInvalidation && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-foreground">
                        Demande d'invalidation en attente d'approbation
                      </h4>
                      <span className="text-[11px] bg-amber-500/20 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                        Action requise (Admin)
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Demandée par <strong className="text-foreground">{currentDemandeurNom || 'un utilisateur'}</strong> le {formatDateTime(currentDateDemande)}
                    </p>
                    <div className="mt-2 bg-background/80 p-2.5 rounded-lg border border-border text-xs text-foreground max-w-xl">
                      <strong>Motif de l'invalidation : </strong> {currentMotifInvalidation || 'Non spécifié'}
                    </div>
                  </div>
                </div>

                {isAdmin ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setShowAdminInvaliderModal(true)}
                      className="btn-primary bg-negative hover:bg-negative/90 text-white text-xs py-2 px-3 flex items-center gap-1.5 shadow-sm"
                    >
                      <Ban size={14} /> Confirmer l'invalidation
                    </button>
                    <button
                      onClick={handleRejeterDemande}
                      disabled={saving}
                      className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
                    >
                      <X size={14} /> Rejeter la demande
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-lg">
                    Seuls les administrateurs peuvent approuver cette invalidation.
                  </div>
                )}
              </div>
            )}

            {/* Bannière inventaire invalidé */}
            {currentStatut === 'ANNULE' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                <Ban className="text-negative shrink-0 mt-0.5" size={20} />
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-sm text-negative">Cet inventaire a été invalidé</h4>
                  <p className="text-muted-foreground">
                    Invalidé par <strong className="text-foreground">{currentUtilisateurInvalidationNom || 'un administrateur'}</strong> le {formatDateTime(currentDateInvalidation)}.
                  </p>
                  {currentMotifInvalidation && (
                    <p className="text-foreground">
                      <strong>Motif enregistré : </strong> {currentMotifInvalidation}
                    </p>
                  )}
                  <p className="text-muted-foreground italic">
                    Les mouvements de stock compensatoires ont été automatiquement enregistrés pour rétablir les stocks d'origine.
                  </p>
                </div>
              </div>
            )}

            {/* Fiche En-tête de l'inventaire */}
            <div className="card-base p-5 space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-lg font-bold text-foreground font-mono">{currentRef}</h3>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${currentTypeInfo.badgeClass}`}>
                      <CurrentTypeIcon size={14} />
                      {currentTypeInfo.label}
                    </span>
                    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUT_SESSION[currentStatut]?.className}`}>
                      {STATUT_SESSION[currentStatut]?.label}
                    </span>
                  </div>

                  {/* Détails traçabilité : Moment et Responsable */}
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <User size={13} className="text-primary" />
                      Réalisé par : <strong className="text-foreground">{currentResponsableNom || 'Non renseigné'}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-primary" />
                      Date & Heure : <strong className="text-foreground">{formatDateTime(currentDateInventaire)}</strong>
                    </span>
                    {currentDateValidation && (
                      <span className="flex items-center gap-1.5 text-positive">
                        <CheckCircle size={13} />
                        Validé par : <strong>{currentValidateurNom || 'Admin'}</strong> le {formatDateTime(currentDateValidation)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Boutons d'actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {currentStatut === 'EN_COURS' && (
                    <>
                      <button
                        onClick={handleSaveDraft}
                        disabled={saving}
                        className="btn-secondary flex items-center gap-1.5 text-sm py-2"
                      >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{' '}
                        Brouillon
                      </button>
                      <button
                        onClick={handleValider}
                        disabled={saving}
                        className="btn-primary flex items-center gap-1.5 text-sm py-2"
                      >
                        <CheckCircle size={14} /> Valider l'inventaire
                      </button>
                    </>
                  )}

                  {currentStatut === 'VALIDE' && !currentDemandeInvalidation && (
                    <>
                      <button
                        onClick={() => {
                          setMotifInput('');
                          setShowDemandeModal(true);
                        }}
                        className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-3 hover:border-amber-500/50 hover:text-amber-600"
                        title="Soumettre une demande d'invalidation avec motif obligatoire"
                      >
                        <AlertTriangle size={13} /> Demander l'invalidation
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => setShowAdminInvaliderModal(true)}
                          className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-3 text-negative hover:bg-negative/10 hover:border-negative/30"
                          title="Invalider directement cet inventaire (Réservé Super Admin)"
                        >
                          <Ban size={13} /> Invalider l'inventaire
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={handleExportLignesInventaire}
                    className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-3"
                    title="Exporter la feuille d'inventaire en CSV"
                  >
                    <Download size={13} /> Exporter
                  </button>
                </div>
              </div>

              {/* Fiche Périmètre d'inventaire avec explications et impacts */}
              <div className={`p-4 rounded-xl border ${currentTypeInfo.borderColor} ${currentTypeInfo.bgLight} flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg bg-background shadow-xs border ${currentTypeInfo.borderColor} shrink-0`}>
                    <CurrentTypeIcon size={22} className={currentTypeInfo.textColor} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-bold text-sm text-foreground">
                        {currentTypeInfo.label}
                      </h4>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${currentTypeInfo.badgeClass}`}>
                        Cible : {currentTypeInfo.targetScope}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {currentTypeInfo.description}
                    </p>
                    <p className="text-xs font-medium text-foreground">
                      <span className="text-muted-foreground">Impact sur la base de données : </span>
                      <span className={currentTypeInfo.textColor}>{currentTypeInfo.fieldImpact}</span>
                    </p>
                  </div>
                </div>
                {currentObservations && (
                  <div className="text-xs bg-background/80 border border-border px-3.5 py-2 rounded-lg max-w-sm shrink-0">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-0.5">Observation enregistrée :</span>
                    <span className="text-foreground font-medium italic">{currentObservations}</span>
                  </div>
                )}
              </div>

              {/* Message d'information Inventaire à l'aveugle */}
              {isBlindMode && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs text-foreground flex items-start gap-2.5">
                  <Clock className="text-primary shrink-0 mt-0.5" size={16} />
                  <div>
                    <span className="font-semibold text-primary">Comptage à l'aveugle actif : </span>
                    Le stock théorique du système ainsi que les écarts sont volontairement masqués pendant la saisie. Ils apparaîtront automatiquement une fois l'inventaire finalisé et validé.
                  </div>
                </div>
              )}

              {/* Barres de progression et compteurs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progression de la saisie ({currentTypeInfo.label})</span>
                  <span className="font-bold text-foreground tabular-nums">{progress}%</span>
                </div>
                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-1 text-xs text-muted-foreground">
                <span>
                  <span className="font-bold text-foreground">{compteCount}</span> références saisies
                </span>
                <span>
                  <span className="font-bold text-foreground">{lignes.length - compteCount}</span> restantes à compter
                </span>
                {/* L'écart n'est JAMAIS affiché pendant le mode aveugle */}
                {!isBlindMode && (
                  <span>
                    <span className={`font-bold ${ecartCount > 0 ? 'text-negative' : 'text-positive'}`}>
                      {ecartCount}
                    </span>{' '}
                    écart(s) constaté(s)
                  </span>
                )}
              </div>
            </div>

            {/* Tableau de saisie / consultation des lignes */}
            <div className="card-base overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <div className="relative max-w-sm">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un produit..."
                    className="input-field pl-9 text-sm"
                  />
                </div>
              </div>

              <div className="overflow-x-auto max-h-[60vh]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[#f9fafb] shadow-sm z-10">
                    <tr className="border-b border-border">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                        Produit
                      </th>

                      {/* Colonne Stock Théorique MASQUÉE en mode aveugle */}
                      {!isBlindMode && (
                        <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                          Stock Système ({currentTypeInfo.shortLabel})
                        </th>
                      )}

                      <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                        Stock Compté ({currentTypeInfo.shortLabel})
                      </th>

                      {/* Colonne Statut affichée en mode aveugle */}
                      {isBlindMode && (
                        <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">
                          État du comptage
                        </th>
                      )}

                      {/* Colonne Écart MASQUÉE en mode aveugle */}
                      {!isBlindMode && (
                        <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">
                          Écart ({currentTypeInfo.shortLabel})
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLignes.map((ligne, idx) => {
                      const isCounted = ligne.quantiteReelle > 0 || !currentId ? true : false;

                      return (
                        <tr
                          key={ligne.produitId}
                          className={`border-b border-border table-row-hover ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}
                        >
                          <td className="px-5 py-3 font-medium text-foreground">
                            {ligne.produitLibelle}
                          </td>

                          {/* Quantité Théorique : Uniquement si validé ou annulé */}
                          {!isBlindMode && (
                            <td className="px-5 py-3 text-right tabular-nums text-muted-foreground font-mono">
                              {ligne.quantiteTheorique}
                            </td>
                          )}

                          {/* Saisie ou Affichage du comptage réel */}
                          <td className="px-5 py-3 text-right">
                            {currentStatut === 'EN_COURS' ? (
                              <input
                                type="number"
                                min="0"
                                value={
                                  ligne.quantiteReelle === 0 &&
                                  ligne.ecart === 0 - ligne.quantiteTheorique &&
                                  !currentId
                                    ? ''
                                    : ligne.quantiteReelle
                                }
                                onChange={(e) => updateCompte(ligne.produitId, e.target.value)}
                                placeholder="0"
                                className="input-field w-24 text-right text-sm py-1.5"
                              />
                            ) : (
                              <span className="font-semibold text-foreground tabular-nums font-mono">
                                {ligne.quantiteReelle}
                              </span>
                            )}
                          </td>

                          {/* État du comptage en aveugle */}
                          {isBlindMode && (
                            <td className="px-5 py-3 text-center">
                              {ligne.quantiteReelle > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-positive bg-positive/10 px-2 py-0.5 rounded-full">
                                  <Check size={11} /> Compté
                                </span>
                              ) : (
                                <span className="text-[11px] text-muted-foreground font-medium">
                                  À renseigner
                                </span>
                              )}
                            </td>
                          )}

                          {/* Écart : Uniquement si validé ou annulé */}
                          {!isBlindMode && (
                            <td className="px-5 py-3 text-right tabular-nums font-semibold font-mono">
                              {ligne.ecart !== 0 ? (
                                <span className={ligne.ecart < 0 ? 'text-negative' : 'text-positive'}>
                                  {ligne.ecart > 0 ? '+' : ''}
                                  {ligne.ecart}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL : Demande d'invalidation (avec motif obligatoire) */}
      {showDemandeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={18} />
                <h3 className="text-base font-bold text-foreground">Demande d'invalidation</h3>
              </div>
              <button
                onClick={() => setShowDemandeModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitDemandeInvalidation}>
              <div className="px-6 py-5 space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-xs text-amber-700 flex items-start gap-2.5">
                  <ShieldAlert size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <strong>Attention : </strong> Cette demande sera transmise aux administrateurs. Seul un administrateur peut confirmer l'invalidation d'un inventaire validé.
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Motif de l'invalidation <span className="text-negative">* (obligatoire)</span>
                  </label>
                  <textarea
                    rows={4}
                    value={motifInput}
                    onChange={(e) => setMotifInput(e.target.value)}
                    placeholder="Veuillez détailler la raison de cette demande d'invalidation (ex: Erreur de comptage sur le rayon Informatique, articles oubliés, etc.)..."
                    className="input-field text-sm w-full"
                    required
                    autoFocus
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Ce motif sera visible par l'administrateur pour instruire la demande.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowDemandeModal(false)}
                  className="btn-secondary text-sm py-2"
                  disabled={submittingDemande}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingDemande || !motifInput.trim()}
                  className="btn-primary text-sm py-2 flex items-center gap-2"
                >
                  {submittingDemande ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Envoi en cours...
                    </>
                  ) : (
                    'Transmettre aux administrateurs'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ADMIN : Confirmation de l'invalidation */}
      {showAdminInvaliderModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-md fade-in border border-negative/30">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-negative/5">
              <div className="flex items-center gap-2 text-negative">
                <Ban size={18} />
                <h3 className="text-base font-bold">Confirmer l'invalidation de l'inventaire</h3>
              </div>
              <button
                onClick={() => setShowAdminInvaliderModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-foreground">
                Êtes-vous sûr de vouloir invalider définitivement l'inventaire{' '}
                <strong className="font-mono">{currentRef}</strong> ?
              </p>

              <div className="bg-negative/10 border border-negative/20 rounded-xl p-3.5 text-xs text-negative space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldAlert size={15} /> Conséquences sur les stocks :
                </p>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  <li>Les ajustements de stocks appliqués lors de la validation seront <strong className="text-foreground">automatiquement inversés</strong>.</li>
                  <li>Des mouvements de stock compensatoires seront enregistrés.</li>
                  <li>Le statut de l'inventaire passera à <strong className="text-negative">Invalidé</strong>.</li>
                </ul>
              </div>

              {currentMotifInvalidation && (
                <div className="text-xs bg-muted p-3 rounded-lg border border-border">
                  <span className="font-semibold text-muted-foreground">Motif renseigné : </span>
                  <p className="text-foreground mt-0.5">{currentMotifInvalidation}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                type="button"
                onClick={() => setShowAdminInvaliderModal(false)}
                className="btn-secondary text-sm py-2"
                disabled={submittingInvalider}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleExecuteInvalider}
                disabled={submittingInvalider}
                className="btn-primary bg-negative hover:bg-negative/90 text-white text-sm py-2 flex items-center gap-2"
              >
                {submittingInvalider ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Invalidation en cours...
                  </>
                ) : (
                  'Oui, invalider et rétablir les stocks'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
