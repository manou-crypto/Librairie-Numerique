'use client';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { Search, Plus, Phone, MapPin, Star, X, Eye, Building2 } from 'lucide-react';

interface Fournisseur {
  id: number; nom: string; contact: string; email: string; telephone: string; adresse: string; categorie: string; note: number; totalAchats: number; derniereCommande: string; statut: 'actif' | 'inactif';
}

const FOURNISSEURS: Fournisseur[] = [];

function StarRating({ note }: { note: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (<Star key={s} size={12} className={s <= Math.floor(note) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'} />))}
      <span className="text-xs text-muted-foreground ml-1">{note}</span>
    </div>
  );
}

export default function FournisseursPage() {
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<Fournisseur | null>(null);

  const categories = ['all', ...Array.from(new Set(FOURNISSEURS.map(f => f.categorie)))];
  const filtered = FOURNISSEURS.filter((f) => {
    const matchSearch = f.nom.toLowerCase().includes(search.toLowerCase()) || f.contact.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || f.categorie === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <AppLayout currentPath="/fournisseurs">
      <Topbar title="Fournisseurs" subtitle="Répertoire et gestion des fournisseurs" />
      <div className="px-6 py-6 max-w-screen-2xl mx-auto space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="kpi-card-info"><p className="text-xs text-muted-foreground mb-1">Total fournisseurs</p><p className="text-xl font-bold text-foreground tabular-nums">{FOURNISSEURS.length}</p><p className="text-xs text-muted-foreground mt-1">{FOURNISSEURS.filter(f => f.statut === 'actif').length} actifs</p></div>
          <div className="kpi-card-positive"><p className="text-xs text-muted-foreground mb-1">Volume total achats</p><p className="text-xl font-bold text-foreground tabular-nums">{FOURNISSEURS.reduce((s, f) => s + f.totalAchats, 0).toLocaleString('fr-FR')} FCFA</p></div>
          <div className="kpi-card-neutral"><p className="text-xs text-muted-foreground mb-1">Note moyenne</p><p className="text-xl font-bold text-foreground tabular-nums">{FOURNISSEURS.length > 0 ? (FOURNISSEURS.reduce((s, f) => s + f.note, 0) / FOURNISSEURS.length).toFixed(1) : 0} / 5</p></div>
          <div className="kpi-card-warning"><p className="text-xs text-muted-foreground mb-1">Inactifs</p><p className="text-xl font-bold text-warning tabular-nums">{FOURNISSEURS.filter(f => f.statut === 'inactif').length}</p></div>
        </div>
        <div className="card-base overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, contact..." className="input-field pl-9 text-sm" /></div>
            <div className="flex items-center gap-2">
              <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="input-field text-sm w-auto">{categories.map(c => (<option key={c} value={c}>{c === 'all' ? 'Toutes catégories' : c}</option>))}</select>
              <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5 text-sm py-2"><Plus size={14} /> Ajouter</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/50"><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Fournisseur</th><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Contact</th><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Catégorie</th><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Note</th><th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Total achats</th><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Dernière commande</th><th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Statut</th><th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Actions</th></tr></thead>
              <tbody>
                {filtered.map((f, idx) => (
                  <tr key={f.id} className={`border-b border-border table-row-hover ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}>
                    <td className="px-5 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Building2 size={14} className="text-primary" /></div><div><p className="font-semibold text-foreground text-sm">{f.nom}</p><p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin size={10} /> {f.adresse}</p></div></div></td>
                    <td className="px-5 py-3"><p className="text-sm text-foreground">{f.contact}</p><a href={`tel:${f.telephone}`} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary mt-0.5"><Phone size={10} /> {f.telephone}</a></td>
                    <td className="px-5 py-3 text-muted-foreground">{f.categorie}</td>
                    <td className="px-5 py-3"><StarRating note={f.note} /></td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold text-foreground">{f.totalAchats.toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-5 py-3 text-muted-foreground">{f.derniereCommande}</td>
                    <td className="px-5 py-3 text-center"><span className={f.statut === 'actif' ? 'badge-active' : 'badge-hidden'}>{f.statut === 'actif' ? 'Actif' : 'Inactif'}</span></td>
                    <td className="px-5 py-3 text-center"><button onClick={() => setSelected(f)} className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><Eye size={12} /> Voir</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="py-16 text-center"><Building2 size={32} className="mx-auto text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground">Aucun fournisseur trouvé</p></div>}
        </div>
      </div>
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-md fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border"><h3 className="text-base font-bold text-foreground">{selected.nom}</h3><button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button></div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground mb-0.5">Contact</p><p className="text-sm font-semibold text-foreground">{selected.contact}</p></div>
                <div><p className="text-xs text-muted-foreground mb-0.5">Catégorie</p><p className="text-sm font-semibold text-foreground">{selected.categorie}</p></div>
                <div><p className="text-xs text-muted-foreground mb-0.5">Téléphone</p><p className="text-sm font-semibold text-foreground">{selected.telephone}</p></div>
                <div><p className="text-xs text-muted-foreground mb-0.5">Email</p><p className="text-sm font-semibold text-foreground text-xs">{selected.email}</p></div>
                <div><p className="text-xs text-muted-foreground mb-0.5">Total achats</p><p className="text-sm font-bold text-primary">{selected.totalAchats.toLocaleString('fr-FR')} FCFA</p></div>
                <div><p className="text-xs text-muted-foreground mb-0.5">Note</p><StarRating note={selected.note} /></div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border"><button onClick={() => setSelected(null)} className="btn-secondary text-sm py-2">Fermer</button><button className="btn-primary text-sm py-2">Modifier</button></div>
          </div>
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-md fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border"><h3 className="text-base font-bold text-foreground">Nouveau fournisseur</h3><button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button></div>
            <div className="px-6 py-5 space-y-4">
              {[{ label: 'Nom de la société', placeholder: 'Ex: Éditions Casbah', type: 'text' }, { label: 'Nom du contact', placeholder: 'Prénom Nom', type: 'text' }, { label: 'Email', placeholder: 'contact@societe.dz', type: 'email' }, { label: 'Téléphone', placeholder: '+213 XX XX XX XX', type: 'tel' }].map((field) => (<div key={field.label}><label className="block text-xs font-semibold text-foreground mb-1.5">{field.label}</label><input type={field.type} placeholder={field.placeholder} className="input-field text-sm" /></div>))}
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Catégorie</label><select className="input-field text-sm"><option>Livres</option><option>Informatique</option><option>Fournitures</option><option>Bureautique</option></select></div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border"><button onClick={() => setShowModal(false)} className="btn-secondary text-sm py-2">Annuler</button><button onClick={() => setShowModal(false)} className="btn-primary text-sm py-2">Enregistrer</button></div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
