'use client';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { CreditCard, Plus, X, CheckCircle, XCircle, Clock, DollarSign, TrendingUp, Users, AlertCircle } from 'lucide-react';

type CaisseStatut = 'ouverte' | 'fermee' | 'en_cloture';

interface Caisse { id: number; nom: string; caissier: string; statut: CaisseStatut; soldeOuverture: number; totalVentes: number; nbTransactions: number; heureOuverture: string; heureFermeture?: string; }

const CAISSES: Caisse[] = [];

const STATUT_CONFIG: Record<CaisseStatut, { label: string; className: string; icon: React.ElementType }> = {
  ouverte: { label: 'Ouverte', className: 'badge-active', icon: CheckCircle },
  fermee: { label: 'Fermée', className: 'badge-hidden', icon: XCircle },
  en_cloture: { label: 'En clôture', className: 'badge-alert', icon: Clock },
};

interface ClotureModal { caisse: Caisse | null; open: boolean; }

export default function CaissesPage() {
  const [caisses, setCaisses] = useState<Caisse[]>(CAISSES);
  const [clotureModal, setClotureModal] = useState<ClotureModal>({ caisse: null, open: false });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCaisseName, setNewCaisseName] = useState('');

  const totalCA = caisses.reduce((sum, c) => sum + c.totalVentes, 0);
  const totalTx = caisses.reduce((sum, c) => sum + c.nbTransactions, 0);
  const caissesOuvertes = caisses.filter(c => c.statut === 'ouverte').length;

  const confirmCloture = () => {
    if (!clotureModal.caisse) return;
    setCaisses(prev => prev.map(c => c.id === clotureModal.caisse!.id ? { ...c, statut: 'fermee', heureFermeture: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) } : c));
    setClotureModal({ caisse: null, open: false });
  };

  const handleOuvrir = (id: number) => setCaisses(prev => prev.map(c => c.id === id ? { ...c, statut: 'ouverte', heureOuverture: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), heureFermeture: undefined } : c));

  return (
    <AppLayout currentPath="/caisses">
      <Topbar title="Gestion des caisses" subtitle="Ouverture, fermeture et suivi des encaissements" />
      <div className="px-6 py-6 max-w-screen-2xl mx-auto space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="kpi-card-info"><div className="flex items-center justify-between mb-2"><p className="text-xs text-muted-foreground">CA total du jour</p><DollarSign size={16} className="text-primary" /></div><p className="text-2xl font-bold text-foreground tabular-nums">{totalCA.toLocaleString('fr-FR')} FCFA</p></div>
          <div className="kpi-card-positive"><div className="flex items-center justify-between mb-2"><p className="text-xs text-muted-foreground">Caisses ouvertes</p><CheckCircle size={16} className="text-positive" /></div><p className="text-2xl font-bold text-positive tabular-nums">{caissesOuvertes}</p><p className="text-xs text-muted-foreground mt-1">sur {caisses.length} caisses</p></div>
          <div className="kpi-card-neutral"><div className="flex items-center justify-between mb-2"><p className="text-xs text-muted-foreground">Transactions</p><TrendingUp size={16} className="text-foreground" /></div><p className="text-2xl font-bold text-foreground tabular-nums">{totalTx}</p></div>
          <div className="kpi-card-warning"><div className="flex items-center justify-between mb-2"><p className="text-xs text-muted-foreground">Ticket moyen</p><Users size={16} className="text-warning" /></div><p className="text-2xl font-bold text-warning tabular-nums">{totalTx > 0 ? Math.round(totalCA / totalTx).toLocaleString('fr-FR') : 0} FCFA</p></div>
        </div>
        <div className="flex items-center justify-between"><h2 className="text-base font-bold text-foreground">État des caisses</h2><button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-1.5 text-sm py-2"><Plus size={14} /> Nouvelle caisse</button></div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {caisses.map((caisse) => (
            <div key={caisse.id} className="card-base p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><CreditCard size={20} className="text-primary" /></div><div><h3 className="font-bold text-foreground">{caisse.nom}</h3><p className="text-xs text-muted-foreground">{caisse.caissier}</p></div></div>
                <span className={STATUT_CONFIG[caisse.statut].className}>{STATUT_CONFIG[caisse.statut].label}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">CA du jour</p><p className="font-bold text-foreground tabular-nums text-sm">{caisse.totalVentes.toLocaleString('fr-FR')} FCFA</p></div>
                <div className="bg-muted/50 rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Transactions</p><p className="font-bold text-foreground tabular-nums text-sm">{caisse.nbTransactions}</p></div>
                <div className="bg-muted/50 rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Ouverture</p><p className="font-bold text-foreground text-sm">{caisse.heureOuverture}</p></div>
                <div className="bg-muted/50 rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Fermeture</p><p className="font-bold text-foreground text-sm">{caisse.heureFermeture ?? '-'}</p></div>
              </div>
              <div className="flex gap-2 pt-1">
                {caisse.statut === 'ouverte' ? (<button onClick={() => setClotureModal({ caisse, open: true })} className="flex-1 btn-secondary text-sm py-2 text-negative border-negative/30 hover:bg-negative/5">Clôturer la caisse</button>) : (<button onClick={() => handleOuvrir(caisse.id)} className="flex-1 btn-primary text-sm py-2">Ouvrir la caisse</button>)}
              </div>
            </div>
          ))}
        </div>
        <div className="card-base overflow-hidden">
          <div className="px-5 py-4 border-b border-border"><h3 className="text-sm font-bold text-foreground">Récapitulatif journalier</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/50"><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Caisse</th><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Caissier</th><th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Solde ouverture</th><th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Total ventes</th><th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Nb transactions</th><th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Statut</th></tr></thead>
              <tbody>
                {caisses.map((c, idx) => (<tr key={c.id} className={`border-b border-border table-row-hover ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}><td className="px-5 py-3 font-semibold text-foreground">{c.nom}</td><td className="px-5 py-3 text-muted-foreground">{c.caissier}</td><td className="px-5 py-3 text-right tabular-nums">{c.soldeOuverture.toLocaleString('fr-FR')} FCFA</td><td className="px-5 py-3 text-right font-semibold text-primary tabular-nums">{c.totalVentes.toLocaleString('fr-FR')} FCFA</td><td className="px-5 py-3 text-right tabular-nums">{c.nbTransactions}</td><td className="px-5 py-3 text-center"><span className={STATUT_CONFIG[c.statut].className}>{STATUT_CONFIG[c.statut].label}</span></td></tr>))}
                <tr className="bg-primary/5 font-bold"><td className="px-5 py-3 text-foreground" colSpan={3}>Total</td><td className="px-5 py-3 text-right text-primary tabular-nums">{totalCA.toLocaleString('fr-FR')} FCFA</td><td className="px-5 py-3 text-right tabular-nums">{totalTx}</td><td></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {clotureModal.open && clotureModal.caisse && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-md fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border"><h3 className="text-base font-bold text-foreground">Clôturer {clotureModal.caisse.nom}</h3><button onClick={() => setClotureModal({ caisse: null, open: false })} className="text-muted-foreground hover:text-foreground"><X size={18} /></button></div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 flex items-start gap-3"><AlertCircle size={16} className="text-warning shrink-0 mt-0.5" /><p className="text-sm text-foreground">Vous êtes sur le point de clôturer <strong>{clotureModal.caisse.nom}</strong>. Cette action enregistrera le total des ventes de la journée.</p></div>
              <div className="grid grid-cols-2 gap-3"><div className="bg-muted/50 rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Total encaissé</p><p className="font-bold text-foreground">{clotureModal.caisse.totalVentes.toLocaleString('fr-FR')} FCFA</p></div><div className="bg-muted/50 rounded-lg p-3"><p className="text-xs text-muted-foreground mb-1">Transactions</p><p className="font-bold text-foreground">{clotureModal.caisse.nbTransactions}</p></div></div>
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Montant physique compté (FCFA)</label><input type="number" placeholder="0" className="input-field text-sm" /></div>
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Observations</label><textarea rows={2} placeholder="Remarques éventuelles..." className="input-field text-sm resize-none" /></div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border"><button onClick={() => setClotureModal({ caisse: null, open: false })} className="btn-secondary text-sm py-2">Annuler</button><button onClick={confirmCloture} className="btn-primary text-sm py-2 bg-negative hover:bg-negative/90">Confirmer la clôture</button></div>
          </div>
        </div>
      )}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border"><h3 className="text-base font-bold text-foreground">Nouvelle caisse</h3><button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button></div>
            <div className="px-6 py-5 space-y-4">
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Nom de la caisse</label><input type="text" value={newCaisseName} onChange={(e) => setNewCaisseName(e.target.value)} placeholder="ex: Caisse 4" className="input-field text-sm" /></div>
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Caissier assigné</label><select className="input-field text-sm"><option>Karim Hadj</option><option>Fatima Zerrouki</option><option>Non assigné</option></select></div>
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Solde d'ouverture (FCFA)</label><input type="number" placeholder="5000" className="input-field text-sm" /></div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border"><button onClick={() => setShowAddModal(false)} className="btn-secondary text-sm py-2">Annuler</button><button onClick={() => setShowAddModal(false)} className="btn-primary text-sm py-2">Créer la caisse</button></div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
