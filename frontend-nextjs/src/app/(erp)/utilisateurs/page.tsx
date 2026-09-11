'use client';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import {
  Search,
  Plus,
  Users,
  Shield,
  UserCheck,
  UserX,
  X,
  Edit2,
  Loader2,
  Trash2,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
} from 'lucide-react';
import {
  utilisateursService,
  UserAccount,
  RoleItem,
  PermissionItem,
} from '@/services/utilisateurs.service';
import { toast } from 'sonner';
import useSWR from 'swr';
import { fetcher, SWR_DEFAULT_CONFIG } from '@/lib/swr-fetcher';
import RoleModal from './components/RoleModal';
import AdminConfirmModal from './components/AdminConfirmModal';

interface UserForm {
  nom: string;
  prenom: string;
  email: string;
  codeRole: string;
  password: string;
}

export default function UtilisateursPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');

  // SWR queries
  const {
    data: utilisateursRaw,
    mutate: mutateUsers,
    isLoading: loadingUsers,
  } = useSWR<UserAccount[]>('/v1/users', fetcher, SWR_DEFAULT_CONFIG);

  const {
    data: rolesRaw,
    mutate: mutateRoles,
    isLoading: loadingRoles,
  } = useSWR<RoleItem[]>('/v1/users/roles', fetcher, SWR_DEFAULT_CONFIG);

  const { data: permissionsRaw } = useSWR<PermissionItem[]>(
    '/v1/users/permissions',
    fetcher,
    SWR_DEFAULT_CONFIG
  );

  const utilisateurs = utilisateursRaw || [];
  const roles = rolesRaw || [];
  const permissions = permissionsRaw || [];

  // Filtering & Search
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<UserForm>({
    nom: '',
    prenom: '',
    email: '',
    codeRole: 'CAISSIER',
    password: '',
  });

  const [editUser, setEditUser] = useState<UserAccount | null>(null);
  const [editForm, setEditForm] = useState<UserForm>({
    nom: '',
    prenom: '',
    email: '',
    codeRole: 'CAISSIER',
    password: '',
  });

  const [deleteTarget, setDeleteTarget] = useState<UserAccount | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Role Modal state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
  const [deleteRoleTarget, setDeleteRoleTarget] = useState<RoleItem | null>(null);
  const [deletingRole, setDeletingRole] = useState(false);

  // Admin Confirmation state
  const [adminConfirmPending, setAdminConfirmPending] = useState<{
    type: 'add' | 'edit';
    payload: any;
    userName: string;
  } | null>(null);
  const [savingAdmin, setSavingAdmin] = useState(false);

  const openEdit = (user: UserAccount) => {
    setEditUser(user);
    setEditForm({
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      codeRole: user.codeRole,
      password: '',
    });
  };

  const handleTriggerSaveEdit = async () => {
    if (!editUser) return;
    if (!editForm.nom.trim() || !editForm.prenom.trim() || !editForm.email.trim()) {
      toast.error('Veuillez renseigner tous les champs obligatoires.');
      return;
    }

    const payload: any = {
      nom: editForm.nom.trim(),
      prenom: editForm.prenom.trim(),
      email: editForm.email.trim(),
      codeRole: editForm.codeRole,
    };
    if (editForm.password) {
      payload.password = editForm.password;
    }

    // Intercepter si le rôle attribué est ADMIN et que l'utilisateur n'était pas déjà ADMIN
    if (editForm.codeRole === 'ADMIN' && editUser.codeRole !== 'ADMIN') {
      setAdminConfirmPending({
        type: 'edit',
        payload,
        userName: `${editForm.prenom} ${editForm.nom}`,
      });
      return;
    }

    await executeSaveEdit(payload);
  };

  const executeSaveEdit = async (payload: any) => {
    if (!editUser) return;
    setSavingAdmin(true);
    try {
      await utilisateursService.update(editUser.id, payload);
      await mutateUsers();
      toast.success('Utilisateur modifié avec succès');
      setEditUser(null);
      setAdminConfirmPending(null);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la modification de l'utilisateur");
    } finally {
      setSavingAdmin(false);
    }
  };

  const handleTriggerSaveAdd = async () => {
    if (
      !addForm.nom.trim() ||
      !addForm.prenom.trim() ||
      !addForm.email.trim() ||
      !addForm.password
    ) {
      toast.error('Veuillez renseigner tous les champs obligatoires.');
      return;
    }

    const payload = {
      nom: addForm.nom.trim(),
      prenom: addForm.prenom.trim(),
      email: addForm.email.trim(),
      codeRole: addForm.codeRole,
      password: addForm.password,
    };

    // Intercepter si le rôle attribué est ADMIN
    if (addForm.codeRole === 'ADMIN') {
      setAdminConfirmPending({
        type: 'add',
        payload,
        userName: `${addForm.prenom} ${addForm.nom}`,
      });
      return;
    }

    await executeSaveAdd(payload);
  };

  const executeSaveAdd = async (payload: any) => {
    setSavingAdmin(true);
    try {
      await utilisateursService.create({
        ...payload,
        roleId: 1,
        statut: 'ACTIF',
      });
      await mutateUsers();
      toast.success('Utilisateur créé avec succès');
      setShowAddModal(false);
      setAddForm({ nom: '', prenom: '', email: '', codeRole: 'CAISSIER', password: '' });
      setAdminConfirmPending(null);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création de l'utilisateur");
    } finally {
      setSavingAdmin(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await utilisateursService.delete(deleteTarget.id);
      await mutateUsers();
      toast.success(`Utilisateur ${deleteTarget.prenom} ${deleteTarget.nom} supprimé`);
      setDeleteTarget(null);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression de l'utilisateur");
    } finally {
      setDeleting(false);
    }
  };

  const toggleStatut = async (id: number) => {
    const user = utilisateurs.find((u) => u.id === id);
    if (!user) return;

    if (user.codeRole === 'ADMIN') {
      toast.error('Un compte Administrateur ne peut pas être désactivé.');
      return;
    }

    const newStatut = user.statut === 'ACTIF' ? 'INACTIF' : 'ACTIF';
    try {
      await utilisateursService.update(id, { statut: newStatut });
      await mutateUsers();
      toast.success(`Utilisateur ${newStatut === 'ACTIF' ? 'activé' : 'désactivé'}`);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du changement de statut');
    }
  };

  // Role Save Handlers
  const handleSaveRole = async (data: {
    codeRole: string;
    libelle: string;
    permissions: string[];
  }) => {
    if (editingRole) {
      await utilisateursService.updateRole(editingRole.id, {
        libelle: data.libelle,
        permissions: data.permissions,
      });
      toast.success(`Rôle "${data.libelle}" mis à jour.`);
    } else {
      await utilisateursService.createRole(data);
      toast.success(`Rôle "${data.libelle}" créé avec succès.`);
    }
    await mutateRoles();
    setShowRoleModal(false);
    setEditingRole(null);
  };

  const handleDeleteRole = async () => {
    if (!deleteRoleTarget) return;
    setDeletingRole(true);
    try {
      await utilisateursService.deleteRole(deleteRoleTarget.id);
      await mutateRoles();
      toast.success(`Rôle "${deleteRoleTarget.libelle}" supprimé.`);
      setDeleteRoleTarget(null);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression du rôle');
    } finally {
      setDeletingRole(false);
    }
  };

  const filteredUsers = utilisateurs.filter((u) => {
    const fullName = `${u.prenom} ${u.nom}`.toLowerCase();
    const matchSearch =
      fullName.includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.codeRole === filterRole;
    return matchSearch && matchRole;
  });

  const getRoleBadgeStyle = (code: string) => {
    if (code === 'ADMIN') return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    if (code === 'GESTIONNAIRE_CATALOGUE') return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    if (code === 'ACHETEUR_STOCK')
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (code === 'CAISSIER') return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    return 'bg-muted text-muted-foreground border-border';
  };

  return (
    <AppLayout currentPath="/utilisateurs">
      <Topbar title="Gestion des utilisateurs" subtitle="Comptes internes et droits d'accès" />

      <div className="px-6 py-6 max-w-screen-2xl mx-auto space-y-6">
        {/* Navigation par Onglets */}
        <div className="flex items-center justify-between border-b border-border pb-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                activeTab === 'users'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Users size={16} />
              <span>Utilisateurs ({utilisateurs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                activeTab === 'roles'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <ShieldCheck size={16} />
              <span>Rôles & Permissions ({roles.length})</span>
            </button>
          </div>

          <div>
            {activeTab === 'users' ? (
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary flex items-center gap-1.5 text-sm py-2"
              >
                <Plus size={15} /> Nouvel utilisateur
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingRole(null);
                  setShowRoleModal(true);
                }}
                className="btn-primary flex items-center gap-1.5 text-sm py-2"
              >
                <Plus size={15} /> Nouveau rôle
              </button>
            )}
          </div>
        </div>

        {/* CONTENU ONGLET 1 : UTILISATEURS */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="kpi-card-info">
                <p className="text-xs text-muted-foreground mb-1">Total utilisateurs</p>
                <p className="text-xl font-bold text-foreground tabular-nums">
                  {utilisateurs.length}
                </p>
              </div>
              <div className="kpi-card-positive">
                <p className="text-xs text-muted-foreground mb-1">Comptes actifs</p>
                <p className="text-xl font-bold text-positive tabular-nums">
                  {utilisateurs.filter((u) => u.statut === 'ACTIF').length}
                </p>
              </div>
              <div className="kpi-card-neutral">
                <p className="text-xs text-muted-foreground mb-1">Administrateurs</p>
                <p className="text-xl font-bold text-amber-500 tabular-nums">
                  {utilisateurs.filter((u) => u.codeRole === 'ADMIN').length}
                </p>
              </div>
              <div className="kpi-card-warning">
                <p className="text-xs text-muted-foreground mb-1">Rôles définis</p>
                <p className="text-xl font-bold text-foreground tabular-nums">{roles.length}</p>
              </div>
            </div>

            <div className="card-base overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher par nom, email..."
                    className="input-field pl-9 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="input-field text-sm w-auto"
                  >
                    <option value="all">Tous les rôles</option>
                    {roles.map((r) => (
                      <option key={`filter-role-${r.id}`} value={r.codeRole}>
                        {r.libelle}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                        Utilisateur
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                        Rôle
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
                    {loadingUsers ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-muted-foreground">
                          <Loader2 className="animate-spin mx-auto mb-2 text-primary" size={24} />
                          Chargement des utilisateurs...
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user, idx) => {
                        const isAdmin = user.codeRole === 'ADMIN';

                        return (
                          <tr
                            key={user.id}
                            className={`border-b border-border table-row-hover ${
                              idx % 2 === 0 ? '' : 'bg-muted/20'
                            }`}
                          >
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                  <span className="text-xs font-bold text-primary">
                                    {user.prenom?.[0] || ''}
                                    {user.nom?.[0] || ''}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                                    {user.prenom} {user.nom}
                                    {isAdmin && (
                                      <span title="Super Administrateur">
                                        <Shield
                                          size={12}
                                          className="text-amber-500"
                                        />
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className={`text-xs px-2.5 py-1 rounded-full border font-medium inline-block ${getRoleBadgeStyle(
                                  user.codeRole
                                )}`}
                              >
                                {user.libelleRole}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <span
                                className={
                                  user.statut === 'ACTIF' ? 'badge-active' : 'badge-hidden'
                                }
                              >
                                {user.statut === 'ACTIF' ? 'Actif' : 'Inactif'}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => openEdit(user)}
                                  className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                                  title="Modifier"
                                >
                                  <Edit2 size={14} />
                                </button>

                                {/* CONDITION : L'option de désactivation N'APPARAÎT PAS pour les utilisateurs ADMIN */}
                                {!isAdmin ? (
                                  <button
                                    onClick={() => toggleStatut(user.id)}
                                    className={`p-1.5 rounded hover:bg-muted transition-colors ${
                                      user.statut === 'ACTIF'
                                        ? 'text-negative hover:text-negative'
                                        : 'text-positive hover:text-positive'
                                    }`}
                                    title={user.statut === 'ACTIF' ? 'Désactiver' : 'Activer'}
                                  >
                                    {user.statut === 'ACTIF' ? (
                                      <UserX size={14} />
                                    ) : (
                                      <UserCheck size={14} />
                                    )}
                                  </button>
                                ) : (
                                  <span
                                    className="p-1.5 text-muted-foreground/40 cursor-not-allowed"
                                    title="Un administrateur ne peut pas être désactivé"
                                  >
                                    <Lock size={13} />
                                  </span>
                                )}

                                {!isAdmin && (
                                  <button
                                    onClick={() => setDeleteTarget(user)}
                                    className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-negative transition-colors"
                                    title="Supprimer"
                                  >
                                    <Trash2 size={14} />
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

              {!loadingUsers && filteredUsers.length === 0 && (
                <div className="py-16 text-center">
                  <Users size={32} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Aucun utilisateur trouvé</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONTENU ONGLET 2 : RÔLES & PERMISSIONS */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="kpi-card-info">
                <p className="text-xs text-muted-foreground mb-1">Rôles configurés</p>
                <p className="text-xl font-bold text-foreground tabular-nums">{roles.length}</p>
              </div>
              <div className="kpi-card-positive">
                <p className="text-xs text-muted-foreground mb-1">Pages / Modules sécurisés</p>
                <p className="text-xl font-bold text-positive tabular-nums">{permissions.length}</p>
              </div>
              <div className="kpi-card-neutral">
                <p className="text-xs text-muted-foreground mb-1">Total Utilisateurs assignés</p>
                <p className="text-xl font-bold text-foreground tabular-nums">
                  {utilisateurs.length}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {loadingRoles ? (
                <div className="col-span-2 py-16 text-center text-muted-foreground">
                  <Loader2 className="animate-spin mx-auto mb-2 text-primary" size={28} />
                  Chargement des rôles et permissions...
                </div>
              ) : (
                roles.map((r) => {
                  const isAdmin = r.codeRole === 'ADMIN';
                  const rolePerms = r.permissions || [];

                  return (
                    <div
                      key={`role-card-${r.id}`}
                      className="card-base p-5 flex flex-col justify-between space-y-4 hover:border-primary/30 transition-all shadow-xs"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-base font-bold text-foreground">{r.libelle}</h3>
                              {isAdmin && (
                                <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                  Système
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-mono text-muted-foreground mt-0.5">
                              {r.codeRole}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingRole(r);
                                setShowRoleModal(true);
                              }}
                              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1"
                            >
                              <Edit2 size={12} /> Modifier
                            </button>
                            {!isAdmin && (
                              <button
                                onClick={() => setDeleteRoleTarget(r)}
                                disabled={(r.usersCount ?? 0) > 0}
                                className="p-1.5 rounded-lg border border-border hover:bg-red-50 hover:text-negative text-muted-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                title={
                                  (r.usersCount ?? 0) > 0
                                    ? 'Impossible de supprimer un rôle attribué à des utilisateurs'
                                    : 'Supprimer ce rôle'
                                }
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                          <Users size={13} className="text-primary" />
                          <span>
                            <strong>{r.usersCount ?? 0}</strong> utilisateur(s) assigné(s)
                          </span>
                        </div>

                        <div className="pt-2 border-t border-border space-y-1.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Pages & permissions accordées (
                            {isAdmin ? 'Toutes' : `${rolePerms.length} / ${permissions.length}`})
                          </p>
                          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-thin">
                            {isAdmin ? (
                              <span className="text-[11px] font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <CheckCircle2 size={12} /> Accès universel illimité
                              </span>
                            ) : rolePerms.length === 0 ? (
                              <span className="text-[11px] text-muted-foreground italic">
                                Aucun accès configuré
                              </span>
                            ) : (
                              rolePerms.map((code) => {
                                const permInfo = permissions.find((p) => p.codePermission === code);
                                return (
                                  <span
                                    key={`role-${r.id}-perm-${code}`}
                                    className="text-[10px] font-medium bg-muted text-foreground px-2 py-0.5 rounded-md border border-border"
                                  >
                                    {permInfo?.libelle || code}
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Ajout Utilisateur */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-md fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Nouvel utilisateur</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Nom</label>
                <input
                  type="text"
                  value={addForm.nom}
                  onChange={(e) => setAddForm({ ...addForm, nom: e.target.value })}
                  placeholder="Nom de famille"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Prénom</label>
                <input
                  type="text"
                  value={addForm.prenom}
                  onChange={(e) => setAddForm({ ...addForm, prenom: e.target.value })}
                  placeholder="Prénom"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Email</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="utilisateur@librairie.ci"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Rôle attribué
                </label>
                <select
                  value={addForm.codeRole}
                  onChange={(e) => setAddForm({ ...addForm, codeRole: e.target.value })}
                  className="input-field text-sm"
                >
                  {roles.map((r) => (
                    <option key={`opt-role-${r.id}`} value={r.codeRole}>
                      {r.libelle}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Mot de passe temporaire
                </label>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="input-field text-sm"
                />
              </div>

              {addForm.codeRole === 'ADMIN' && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-start gap-2 text-amber-600 text-xs">
                  <Shield size={16} className="shrink-0 mt-0.5" />
                  <span>
                    <strong>Avertissement :</strong> Le rôle Administrateur confère un contrôle
                    total sur toutes les opérations et paramètres du système.
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowAddModal(false)} className="btn-secondary text-sm py-2">
                Annuler
              </button>
              <button onClick={handleTriggerSaveAdd} className="btn-primary text-sm py-2">
                Créer le compte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modification Utilisateur */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-md fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-base font-bold text-foreground">Modifier l'utilisateur</h3>
              <button
                onClick={() => setEditUser(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Nom</label>
                <input
                  type="text"
                  value={editForm.nom}
                  onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })}
                  placeholder="Nom"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Prénom</label>
                <input
                  type="text"
                  value={editForm.prenom}
                  onChange={(e) => setEditForm({ ...editForm, prenom: e.target.value })}
                  placeholder="Prénom"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="utilisateur@librairie.ci"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Rôle</label>
                <select
                  value={editForm.codeRole}
                  onChange={(e) => setEditForm({ ...editForm, codeRole: e.target.value })}
                  className="input-field text-sm"
                >
                  {roles.map((r) => (
                    <option key={`edit-role-${r.id}`} value={r.codeRole}>
                      {r.libelle}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Nouveau mot de passe{' '}
                  <span className="text-muted-foreground font-normal">
                    (laisser vide pour ne pas changer)
                  </span>
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="input-field text-sm"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setEditUser(null)} className="btn-secondary text-sm py-2">
                Annuler
              </button>
              <button onClick={handleTriggerSaveEdit} className="btn-primary text-sm py-2">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression Utilisateur */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm fade-in p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-negative/10 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-negative" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Supprimer l'utilisateur ?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {deleteTarget.prenom} {deleteTarget.nom}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur (
              {deleteTarget.email}) ?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary text-sm py-2">
                Annuler
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleting}
                className="btn-primary text-sm py-2 bg-negative border-negative hover:bg-negative/90 flex items-center gap-2"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}{' '}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression Rôle */}
      {deleteRoleTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm fade-in p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-negative/10 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-negative" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Supprimer le rôle ?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{deleteRoleTarget.libelle}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Êtes-vous sûr de vouloir supprimer le rôle <strong>{deleteRoleTarget.libelle}</strong>{' '}
              ({deleteRoleTarget.codeRole}) ?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteRoleTarget(null)}
                className="btn-secondary text-sm py-2"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteRole}
                disabled={deletingRole}
                className="btn-primary text-sm py-2 bg-negative border-negative hover:bg-negative/90 flex items-center gap-2"
              >
                {deletingRole ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}{' '}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Création / Modification de Rôle */}
      <RoleModal
        open={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setEditingRole(null);
        }}
        role={editingRole}
        permissions={permissions}
        onSave={handleSaveRole}
      />

      {/* Pop-up de confirmation d'attribution du rôle ADMIN */}
      {adminConfirmPending && (
        <AdminConfirmModal
          open={true}
          onClose={() => setAdminConfirmPending(null)}
          userName={adminConfirmPending.userName}
          isEdit={adminConfirmPending.type === 'edit'}
          isLoading={savingAdmin}
          onConfirm={() => {
            if (adminConfirmPending.type === 'add') {
              executeSaveAdd(adminConfirmPending.payload);
            } else {
              executeSaveEdit(adminConfirmPending.payload);
            }
          }}
        />
      )}
    </AppLayout>
  );
}
