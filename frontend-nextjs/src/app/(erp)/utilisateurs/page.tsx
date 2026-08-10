'use client';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { Search, Plus, Users, Shield, UserCheck, UserX, X, Edit2 } from 'lucide-react';

type Role = 'super_admin' | 'manager' | 'cashier';

interface Utilisateur {
  id: number; nom: string; email: string; role: Role; statut: 'actif' | 'inactif'; derniereConnexion: string; dateCreation: string;
}

const UTILISATEURS_INIT: Utilisateur[] = [];

const ROLE_CONFIG: Record<Role, { label: string; className: string }> = {
  super_admin: { label: 'Super Admin', className: 'badge-draft' },
  manager: { label: 'Gestionnaire', className: 'badge-active' },
  cashier: { label: 'Caissier', className: 'badge-alert' },
};

interface UserForm { nom: string; email: string; role: Role; password: string; }

export default function UtilisateursPage() {
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>(UTILISATEURS_INIT);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<UserForm>({ nom: '', email: '', role: 'cashier', password: '' });
  const [editUser, setEditUser] = useState<Utilisateur | null>(null);
  const [editForm, setEditForm] = useState<UserForm>({ nom: '', email: '', role: 'cashier', password: '' });

  const openEdit = (user: Utilisateur) => { setEditUser(user); setEditForm({ nom: user.nom, email: user.email, role: user.role, password: '' }); };
  const saveEdit = () => {
    if (!editUser) return;
    setUtilisateurs(prev => prev.map(u => u.id === editUser.id ? { ...u, nom: editForm.nom, email: editForm.email, role: editForm.role } : u));
    setEditUser(null);
  };
  const toggleStatut = (id: number) => setUtilisateurs(prev => prev.map(u => u.id === id ? { ...u, statut: u.statut === 'actif' ? 'inactif' : 'actif' } : u));

  const filtered = utilisateurs.filter((u) => {
    const matchSearch = u.nom.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <AppLayout currentPath="/utilisateurs">
      <Topbar title="Gestion des utilisateurs" subtitle="Comptes internes et droits d'accès" />
      <div className="px-6 py-6 max-w-screen-2xl mx-auto space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="kpi-card-info"><p className="text-xs text-muted-foreground mb-1">Total utilisateurs</p><p className="text-xl font-bold text-foreground tabular-nums">{utilisateurs.length}</p></div>
          <div className="kpi-card-positive"><p className="text-xs text-muted-foreground mb-1">Comptes actifs</p><p className="text-xl font-bold text-positive tabular-nums">{utilisateurs.filter(u => u.statut === 'actif').length}</p></div>
          <div className="kpi-card-neutral"><p className="text-xs text-muted-foreground mb-1">Gestionnaires</p><p className="text-xl font-bold text-foreground tabular-nums">{utilisateurs.filter(u => u.role === 'manager').length}</p></div>
          <div className="kpi-card-warning"><p className="text-xs text-muted-foreground mb-1">Caissiers</p><p className="text-xl font-bold text-warning tabular-nums">{utilisateurs.filter(u => u.role === 'cashier').length}</p></div>
        </div>
        <div className="card-base overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, email..." className="input-field pl-9 text-sm" /></div>
            <div className="flex items-center gap-2">
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="input-field text-sm w-auto"><option value="all">Tous les rôles</option><option value="super_admin">Super Admin</option><option value="manager">Gestionnaire</option><option value="cashier">Caissier</option></select>
              <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-1.5 text-sm py-2"><Plus size={14} /> Nouvel utilisateur</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/50"><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Utilisateur</th><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Rôle</th><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Dernière connexion</th><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Créé le</th><th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Statut</th><th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Actions</th></tr></thead>
              <tbody>
                {filtered.map((user, idx) => (
                  <tr key={user.id} className={`border-b border-border table-row-hover ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}>
                    <td className="px-5 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><span className="text-xs font-bold text-primary">{user.nom.split(' ').map(n => n[0]).join('')}</span></div><div><p className="font-semibold text-foreground text-sm">{user.nom}</p><p className="text-xs text-muted-foreground">{user.email}</p></div></div></td>
                    <td className="px-5 py-3"><span className={ROLE_CONFIG[user.role].className}>{ROLE_CONFIG[user.role].label}</span></td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{user.derniereConnexion}</td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{user.dateCreation}</td>
                    <td className="px-5 py-3 text-center"><span className={user.statut === 'actif' ? 'badge-active' : 'badge-hidden'}>{user.statut === 'actif' ? 'Actif' : 'Inactif'}</span></td>
                    <td className="px-5 py-3 text-center"><div className="flex items-center justify-center gap-2"><button onClick={() => openEdit(user)} className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Modifier"><Edit2 size={13} /></button><button onClick={() => toggleStatut(user.id)} className={`p-1.5 rounded hover:bg-muted transition-colors ${user.statut === 'actif' ? 'text-negative hover:text-negative' : 'text-positive hover:text-positive'}`} title={user.statut === 'actif' ? 'Désactiver' : 'Activer'}>{user.statut === 'actif' ? <UserX size={13} /> : <UserCheck size={13} />}</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="py-16 text-center"><Users size={32} className="mx-auto text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground">Aucun utilisateur trouvé</p></div>}
        </div>
      </div>
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-md fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border"><h3 className="text-base font-bold text-foreground">Nouvel utilisateur</h3><button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button></div>
            <div className="px-6 py-5 space-y-4">
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Nom complet</label><input type="text" value={addForm.nom} onChange={(e) => setAddForm({ ...addForm, nom: e.target.value })} placeholder="Prénom Nom" className="input-field text-sm" /></div>
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Email</label><input type="email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} placeholder="utilisateur@librairie.dz" className="input-field text-sm" /></div>
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Rôle</label><select value={addForm.role} onChange={(e) => setAddForm({ ...addForm, role: e.target.value as Role })} className="input-field text-sm"><option value="super_admin">Super Admin</option><option value="manager">Gestionnaire</option><option value="cashier">Caissier</option></select></div>
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Mot de passe temporaire</label><input type="password" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} placeholder="••••••••" className="input-field text-sm" /></div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3"><div className="flex items-start gap-2"><Shield size={14} className="text-primary shrink-0 mt-0.5" /><p className="text-xs text-primary"><strong>Super Admin</strong> : accès complet · <strong>Gestionnaire</strong> : catalogue, stocks, rapports · <strong>Caissier</strong> : point de vente uniquement</p></div></div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border"><button onClick={() => setShowAddModal(false)} className="btn-secondary text-sm py-2">Annuler</button><button onClick={() => setShowAddModal(false)} className="btn-primary text-sm py-2">Créer le compte</button></div>
          </div>
        </div>
      )}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-md fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border"><h3 className="text-base font-bold text-foreground">Modifier l'utilisateur</h3><button onClick={() => setEditUser(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button></div>
            <div className="px-6 py-5 space-y-4">
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Nom complet</label><input type="text" value={editForm.nom} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })} placeholder="Prénom Nom" className="input-field text-sm" /></div>
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Email</label><input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="utilisateur@librairie.dz" className="input-field text-sm" /></div>
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Rôle</label><select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value as Role })} className="input-field text-sm"><option value="super_admin">Super Admin</option><option value="manager">Gestionnaire</option><option value="cashier">Caissier</option></select></div>
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Nouveau mot de passe <span className="text-muted-foreground font-normal">(laisser vide pour ne pas changer)</span></label><input type="password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} placeholder="••••••••" className="input-field text-sm" /></div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border"><button onClick={() => setEditUser(null)} className="btn-secondary text-sm py-2">Annuler</button><button onClick={saveEdit} className="btn-primary text-sm py-2">Enregistrer</button></div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
