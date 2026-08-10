'use client';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { Search, Plus, Truck, X, Eye } from 'lucide-react';

interface BonAchat {
  id: number; reference: string; fournisseur: string; date: string; dateReception: string | null; montantHT: number; statut: 'brouillon' | 'envoye' | 'recu' | 'annule'; lignes: number;
}

const ACHATS: BonAchat[] = [];

const STATUT_CONFIG = {
  brouillon: { label: 'Brouillon', className: 'badge-hidden' },
  envoye: { label: 'Envoyé', className: 'badge-draft' },
  recu: { label: 'Reçu', className: 'badge-active' },
  annule: { label: 'Annulé', className: 'badge-rupture' },
};

interface NewAchatForm { fournisseur: string; date: string; notes: string; }

export default function AchatsPage() {
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewAchatForm>({ fournisseur: '', date: '', notes: '' });

  const filtered = ACHATS.filter((a) => {
    const matchSearch = a.reference.toLowerCase().includes(search.toLowerCase()) || a.fournisseur.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === 'all' || a.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const totalMontant = ACHATS.filter(a => a.statut === 'recu').reduce((s, a) => s + a.montantHT, 0);
  const enAttente = ACHATS.filter(a => a.statut === 'envoye').length;

  return (
    <AppLayout currentPath="/achats">
      <Topbar title="Achats & Approvisionnements" subtitle="Bons de commande et réceptions fournisseurs" />
      <div className="px-6 py-6 max-w-screen-2xl mx-auto space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="kpi-card-info"><p className="text-xs text-muted-foreground mb-1">Total achats (mois)</p><p className="text-xl font-bold text-foreground tabular-nums">{totalMontant.toLocaleString('fr-FR')} FCFA</p><p className="text-xs text-muted-foreground mt-1">{ACHATS.filter(a => a.statut === 'recu').length} commandes reçues</p></div>
          <div className="kpi-card-warning"><p className="text-xs text-muted-foreground mb-1">En attente réception</p><p className="text-xl font-bold text-warning tabular-nums">{enAttente}</p><p className="text-xs text-muted-foreground mt-1">bons envoyés</p></div>
          <div className="kpi-card-neutral"><p className="text-xs text-muted-foreground mb-1">Brouillons</p><p className="text-xl font-bold text-foreground tabular-nums">{ACHATS.filter(a => a.statut === 'brouillon').length}</p><p className="text-xs text-muted-foreground mt-1">à finaliser</p></div>
          <div className="kpi-card-negative"><p className="text-xs text-muted-foreground mb-1">Annulés</p><p className="text-xl font-bold text-negative tabular-nums">{ACHATS.filter(a => a.statut === 'annule').length}</p><p className="text-xs text-muted-foreground mt-1">ce mois</p></div>
        </div>
        <div className="card-base overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Référence, fournisseur..." className="input-field pl-9 text-sm" /></div>
            <div className="flex items-center gap-2">
              <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} className="input-field text-sm w-auto"><option value="all">Tous les statuts</option><option value="brouillon">Brouillon</option><option value="envoye">Envoyé</option><option value="recu">Reçu</option><option value="annule">Annulé</option></select>
              <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5 text-sm py-2"><Plus size={14} /> Nouveau bon</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/50"><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Référence</th><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Fournisseur</th><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Date commande</th><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Date réception</th><th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Montant HT</th><th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Lignes</th><th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Statut</th><th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Actions</th></tr></thead>
              <tbody>
                {filtered.map((achat, idx) => (
                  <tr key={achat.id} className={`border-b border-border table-row-hover ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{achat.reference}</td>
                    <td className="px-5 py-3 font-medium text-foreground">{achat.fournisseur}</td>
                    <td className="px-5 py-3 text-muted-foreground">{achat.date}</td>
                    <td className="px-5 py-3 text-muted-foreground">{achat.dateReception ?? '—'}</td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold text-foreground">{achat.montantHT.toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-5 py-3 text-center text-muted-foreground">{achat.lignes}</td>
                    <td className="px-5 py-3 text-center"><span className={STATUT_CONFIG[achat.statut].className}>{STATUT_CONFIG[achat.statut].label}</span></td>
                    <td className="px-5 py-3 text-center"><button className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><Eye size={12} /> Détail</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="py-16 text-center"><Truck size={32} className="mx-auto text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground">Aucun bon d'achat trouvé</p></div>}
          <div className="px-5 py-3 border-t border-border text-xs text-muted-foreground">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</div>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-md fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border"><h3 className="text-base font-bold text-foreground">Nouveau bon d'achat</h3><button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button></div>
            <div className="px-6 py-5 space-y-4">
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Fournisseur</label><select value={form.fournisseur} onChange={(e) => setForm({ ...form, fournisseur: e.target.value })} className="input-field text-sm"><option value="">Sélectionner un fournisseur</option><option>Éditions Casbah</option><option>Distri-Info Algérie</option><option>Papeterie Centrale</option><option>TechDist Algérie</option></select></div>
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Date de commande</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field text-sm" /></div>
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Instructions particulières..." className="input-field text-sm resize-none" /></div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border"><button onClick={() => setShowModal(false)} className="btn-secondary text-sm py-2">Annuler</button><button onClick={() => setShowModal(false)} className="btn-primary text-sm py-2">Créer le bon</button></div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
