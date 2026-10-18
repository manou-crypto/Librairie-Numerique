'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import {
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  X,
  Eye,
  UserCheck,
  UserPlus,
  Building2,
  GraduationCap,
  Store,
  User,
  Loader2,
  Pencil,
  Trash2,
  Save,
  Download,
  Receipt,
  Calendar,
  CreditCard,
  ShoppingBag,
  FileText,
} from 'lucide-react';
import { clientsService, Client } from '@/services/clients.service';
import { useAppConfig } from '@/contexts/ConfigContext';
import { toast } from 'sonner';
import { exportToCSV } from '@/utils/export';

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  PARTICULIER: { label: 'Particulier', icon: User, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  ECOLE: { label: 'École / Institut', icon: GraduationCap, color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  ENTREPRISE: { label: 'Entreprise', icon: Building2, color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  REVENDEUR: { label: 'Revendeur', icon: Store, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
};

export default function ClientsPage() {
  const { config } = useAppConfig();
  const devise = config?.devise || 'FCFA';

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('TOUS');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulaire Création / Édition
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Client | null>(null);
  const [form, setForm] = useState<{
    nom: string;
    prenom: string;
    telephone: string;
    email: string;
    adresse: string;
    typeClient: string;
    notes: string;
  }>({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    adresse: '',
    typeClient: 'PARTICULIER',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  // Modale Détail & Historique
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Suppression
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await clientsService.getAll({
        search: search.trim() || undefined,
        typeClient: typeFilter !== 'TOUS' ? typeFilter : undefined,
      });
      setClients(data);
    } catch {
      toast.error('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [search, typeFilter]);

  const openCreate = () => {
    setEditTarget(null);
    setForm({
      nom: '',
      prenom: '',
      telephone: '',
      email: '',
      adresse: '',
      typeClient: 'PARTICULIER',
      notes: '',
    });
    setShowForm(true);
  };

  const openEdit = (c: Client) => {
    setEditTarget(c);
    setForm({
      nom: c.nom,
      prenom: c.prenom || '',
      telephone: c.telephone || '',
      email: c.email || '',
      adresse: c.adresse || '',
      typeClient: c.typeClient || 'PARTICULIER',
      notes: c.notes || '',
    });
    setShowForm(true);
  };

  const openDetail = async (c: Client) => {
    setLoadingDetail(true);
    setSelectedClient(c);
    try {
      const full = await clientsService.getById(c.id);
      setSelectedClient(full);
    } catch {
      toast.error('Impossible de charger les détails du client');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nom.trim()) {
      toast.error('Le nom est obligatoire');
      return;
    }
    setSaving(true);
    try {
      if (editTarget) {
        await clientsService.update(editTarget.id, form);
        toast.success('Client mis à jour');
      } else {
        await clientsService.create(form);
        toast.success('Nouveau client enregistré');
      }
      setShowForm(false);
      load();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await clientsService.delete(deleteTarget.id);
      toast.success('Client supprimé');
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      toast.error(err.message || 'Impossible de supprimer');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    const headers = ['Code Client', 'Nom', 'Prénom', 'Téléphone', 'Email', 'Adresse', 'Type', 'Total Achats', 'Nombre Ventes'];
    const data = clients.map((c) => [
      c.codeClient,
      c.nom,
      c.prenom || '',
      c.telephone || '',
      c.email || '',
      c.adresse || '',
      c.typeClient,
      c.totalAchats || 0,
      c.nombreVentes || 0,
    ]);
    exportToCSV({ filename: 'clients_export', headers, data });
    toast.success('Export CSV généré');
  };

  // KPIs
  const totalClients = clients.length;
  const totalCA = clients.reduce((sum, c) => sum + (c.totalAchats || 0), 0);
  const totalParticuliers = clients.filter((c) => c.typeClient === 'PARTICULIER').length;
  const totalPro = clients.filter((c) => c.typeClient === 'ENTREPRISE' || c.typeClient === 'ECOLE').length;

  return (
    <AppLayout currentPath="/clients">
      <Topbar title="Gestion des Clients" />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card-base p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Clients</p>
              <p className="text-2xl font-bold text-foreground mt-1">{totalClients}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary">
              <UserCheck size={24} />
            </div>
          </div>

          <div className="card-base p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Particuliers</p>
              <p className="text-2xl font-bold text-foreground mt-1">{totalParticuliers}</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
              <User size={24} />
            </div>
          </div>

          <div className="card-base p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Écoles & Pros</p>
              <p className="text-2xl font-bold text-foreground mt-1">{totalPro}</p>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
              <GraduationCap size={24} />
            </div>
          </div>

          <div className="card-base p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Chiffre d'Affaires</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {totalCA.toLocaleString('fr-FR')} <span className="text-sm font-normal text-muted-foreground">{devise}</span>
              </p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
              <ShoppingBag size={24} />
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="card-base p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex-1 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Rechercher par nom, téléphone, code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-base pl-9 w-full"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-base w-auto text-sm"
            >
              <option value="TOUS">Tous les types</option>
              <option value="PARTICULIER">Particuliers</option>
              <option value="ECOLE">Écoles & Instituts</option>
              <option value="ENTREPRISE">Entreprises</option>
              <option value="REVENDEUR">Revendeurs</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="btn-secondary flex items-center gap-2 text-sm"
              title="Exporter au format CSV"
            >
              <Download size={16} /> Exporter
            </button>
            <button
              onClick={openCreate}
              className="btn-primary flex items-center gap-2 text-sm shadow-sm"
            >
              <Plus size={16} /> Nouveau Client
            </button>
          </div>
        </div>

        {/* Tableau des Clients */}
        <div className="card-base overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground gap-3">
              <Loader2 className="animate-spin" size={24} /> Chargement des clients...
            </div>
          ) : clients.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <UserCheck size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Aucun client trouvé</p>
              <p className="text-xs mt-1">Créez votre premier client ou modifiez vos critères de recherche.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">Client</th>
                    <th className="py-3 px-4 font-semibold">Contact</th>
                    <th className="py-3 px-4 font-semibold">Localisation</th>
                    <th className="py-3 px-4 font-semibold">Type</th>
                    <th className="py-3 px-4 font-semibold text-right">Factures</th>
                    <th className="py-3 px-4 font-semibold text-right">Total Achats</th>
                    <th className="py-3 px-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {clients.map((c) => {
                    const typeInfo = TYPE_CONFIG[c.typeClient] || TYPE_CONFIG.PARTICULIER;
                    const TypeIcon = typeInfo.icon;
                    const isWalkIn = c.codeClient === 'CLI-0000';

                    return (
                      <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                              {c.nom.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground flex items-center gap-1.5">
                                {c.nomComplet}
                                {isWalkIn && (
                                  <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-normal">
                                    Comptoir
                                  </span>
                                )}
                              </div>
                              <span className="text-xs font-mono text-muted-foreground">{c.codeClient}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5 text-xs">
                            {c.telephone ? (
                              <div className="flex items-center gap-1.5 text-foreground font-medium">
                                <Phone size={13} className="text-muted-foreground" />
                                {c.telephone}
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic">Non renseigné</span>
                            )}
                            {c.email && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Mail size={13} />
                                {c.email}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {c.adresse ? (
                            <div className="flex items-center gap-1.5 text-xs text-foreground">
                              <MapPin size={13} className="text-muted-foreground shrink-0" />
                              <span className="truncate max-w-[180px]">{c.adresse}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">-</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}
                          >
                            <TypeIcon size={12} />
                            {typeInfo.label}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-medium text-foreground">
                          {c.nombreVentes ?? 0}
                        </td>

                        <td className="py-3.5 px-4 text-right font-bold text-foreground tabular-nums">
                          {(c.totalAchats || 0).toLocaleString('fr-FR')} {devise}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openDetail(c)}
                              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title="Historique des achats et fiche"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => openEdit(c)}
                              className="p-1.5 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Pencil size={16} />
                            </button>
                            {!isWalkIn && (
                              <button
                                onClick={() => setDeleteTarget(c)}
                                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* MODALE CRÉATION / MODIFICATION */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* En-tête de la modale */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                  {editTarget ? <UserCheck size={20} /> : <UserPlus size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground leading-tight">
                    {editTarget ? 'Modifier la fiche client' : 'Créer un nouveau client'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Renseignez les coordonnées et informations utiles pour les factures
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulaire avec scroll doux */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto scrollbar-thin">
              {/* Section 1 : Identité & Profil */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                  <User size={14} />
                  <span>Identité & Profil</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-foreground">
                      Nom ou Raison Sociale <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.nom}
                      onChange={(e) => setForm({ ...form, nom: e.target.value })}
                      placeholder="ex: KOUASSI ou Collège Saint-Jean"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-foreground text-sm placeholder:text-muted-foreground/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-foreground">
                      Prénom <span className="text-xs font-normal text-muted-foreground">(Optionnel)</span>
                    </label>
                    <input
                      type="text"
                      value={form.prenom}
                      onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                      placeholder="ex: Jean-Marc"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-foreground text-sm placeholder:text-muted-foreground/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-foreground">
                    Catégorie de client
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'PARTICULIER', label: 'Particulier', icon: User },
                      { id: 'ECOLE', label: 'École', icon: GraduationCap },
                      { id: 'ENTREPRISE', label: 'Entreprise', icon: Building2 },
                      { id: 'REVENDEUR', label: 'Revendeur', icon: Store },
                    ].map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = form.typeClient === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setForm({ ...form, typeClient: cat.id })}
                          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                              : 'bg-muted/40 hover:bg-muted text-foreground border-border'
                          }`}
                        >
                          <Icon size={13} />
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Section 2 : Coordonnées de contact */}
              <div className="space-y-3 pt-2 border-t border-border/60">
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                  <Phone size={14} />
                  <span>Coordonnées & Facturation</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-foreground">
                      Numéro de Téléphone
                    </label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={form.telephone}
                        onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                        placeholder="ex: 0709511425"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-foreground text-sm placeholder:text-muted-foreground/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-foreground">
                      Adresse E-mail
                    </label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="ex: client@domaine.com"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-foreground text-sm placeholder:text-muted-foreground/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-foreground">
                    Adresse géographique / Ville
                  </label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={form.adresse}
                      onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                      placeholder="ex: Bouaké - Belleville 2"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-foreground text-sm placeholder:text-muted-foreground/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3 : Remarques & Notes */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <FileText size={13} className="text-muted-foreground" />
                  <span>Observations & Notes internes</span>
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Remarques particulières, préférences de commande, conditions de remise convenues..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-foreground text-sm placeholder:text-muted-foreground/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                />
              </div>

              {/* Boutons d'action */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors"
                  disabled={saving}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center gap-2 px-5 py-2.5 shadow-md font-semibold text-sm rounded-xl"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>{editTarget ? 'Mettre à jour le client' : 'Enregistrer le client'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE FICHE CLIENT & HISTORIQUE ACHATS */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                  {selectedClient.nom.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                    {selectedClient.nomComplet}
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {selectedClient.codeClient}
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedClient.telephone || 'Aucun téléphone'} {selectedClient.adresse ? `• ${selectedClient.adresse}` : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content scrollable */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Résumé financier */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-muted/40 border border-border text-center">
                  <p className="text-xs text-muted-foreground">Nombre de factures</p>
                  <p className="text-xl font-bold text-foreground mt-1">{selectedClient.nombreVentes || 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/40 border border-border text-center">
                  <p className="text-xs text-muted-foreground">Total Dépensé</p>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {(selectedClient.totalAchats || 0).toLocaleString('fr-FR')} {devise}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-muted/40 border border-border text-center">
                  <p className="text-xs text-muted-foreground">Type de compte</p>
                  <p className="text-base font-bold text-foreground mt-1 capitalize">
                    {selectedClient.typeClient.toLowerCase()}
                  </p>
                </div>
              </div>

              {/* Historique des Factures */}
              <div>
                <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                  <Receipt size={16} className="text-primary" /> Historique des Factures & Reçus
                </h4>

                {loadingDetail ? (
                  <div className="p-8 text-center text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={18} /> Chargement de l'historique...
                  </div>
                ) : !selectedClient.ventes || selectedClient.ventes.length === 0 ? (
                  <div className="p-6 border border-dashed border-border rounded-xl text-center text-muted-foreground text-xs">
                    Aucune vente enregistrée pour ce client jusqu'à présent.
                  </div>
                ) : (
                  <div className="border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-muted/50 border-b border-border text-muted-foreground uppercase">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">N° Facture / Ticket</th>
                          <th className="py-2.5 px-3 text-center">Articles</th>
                          <th className="py-2.5 px-3 text-right">Remise</th>
                          <th className="py-2.5 px-3 text-right">Total Net</th>
                          <th className="py-2.5 px-3 text-center">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selectedClient.ventes.map((v) => (
                          <tr key={v.id} className="hover:bg-muted/20">
                            <td className="py-2.5 px-3 text-muted-foreground">
                              {new Date(v.dateVente).toLocaleDateString('fr-FR')}{' '}
                              {new Date(v.dateVente).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-foreground">
                              {v.numeroFacture ? `Facture #${v.numeroFacture}` : v.referenceTicket}
                            </td>
                            <td className="py-2.5 px-3 text-center text-muted-foreground">
                              {v.nbArticles} pce(s)
                            </td>
                            <td className="py-2.5 px-3 text-right text-emerald-600 font-medium">
                              {v.totalRemise > 0 ? `-${v.totalRemise.toLocaleString('fr-FR')} ${devise}` : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-foreground">
                              {v.totalTtc.toLocaleString('fr-FR')} {devise}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  v.statutVente === 'VALIDEE'
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {v.statutVente}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/20 flex justify-end">
              <button
                onClick={() => setSelectedClient(null)}
                className="btn-secondary text-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION SUPPRESSION */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-xl max-w-sm w-full p-5 space-y-4 fade-in">
            <h3 className="font-bold text-base text-foreground">Confirmer la suppression</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Êtes-vous sûr de vouloir supprimer le client{' '}
              <span className="font-semibold text-foreground">{deleteTarget.nomComplet}</span> ? Les ventes passées
              seront conservées mais dissociées de ce client.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="btn-secondary text-xs"
                disabled={deleting}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="btn-primary bg-destructive hover:bg-destructive/90 text-xs flex items-center gap-1.5"
                disabled={deleting}
              >
                {deleting && <Loader2 size={13} className="animate-spin" />} Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
