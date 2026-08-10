'use client';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { Search, Plus, CheckCircle, Clock, Download, Eye } from 'lucide-react';

interface InventaireSession {
  id: number; reference: string; date: string; responsable: string; statut: 'en_cours' | 'termine' | 'valide'; totalArticles: number; articlesComptes: number; ecarts: number;
}

interface LigneInventaire {
  id: number; ref: string; produit: string; stockSysteme: number; stockCompte: number | null; ecart: number | null; statut: 'en_attente' | 'compte' | 'ecart';
}

const INVENTAIRES: InventaireSession[] = [];
const LIGNES: LigneInventaire[] = [];

const STATUT_SESSION = {
  en_cours: { label: 'En cours', className: 'badge-draft', icon: Clock },
  termine: { label: 'Terminé', className: 'badge-alert', icon: CheckCircle },
  valide: { label: 'Validé', className: 'badge-active', icon: CheckCircle },
};

export default function InventairePage() {
  const [activeTab, setActiveTab] = useState<'sessions' | 'saisie'>('sessions');
  const [search, setSearch] = useState('');
  const [lignes, setLignes] = useState(LIGNES);

  const updateCompte = (id: number, value: string) => {
    const num = parseInt(value);
    setLignes(prev => prev.map(l => {
      if (l.id !== id) return l;
      if (isNaN(num)) return { ...l, stockCompte: null, ecart: null, statut: 'en_attente' };
      const ecart = num - l.stockSysteme;
      return { ...l, stockCompte: num, ecart, statut: ecart !== 0 ? 'ecart' : 'compte' };
    }));
  };

  const filteredLignes = lignes.filter(l => l.produit.toLowerCase().includes(search.toLowerCase()) || l.ref.toLowerCase().includes(search.toLowerCase()));
  const progress = Math.round((lignes.filter(l => l.statut !== 'en_attente').length / lignes.length) * 100);

  return (
    <AppLayout currentPath="/inventaire">
      <Topbar title="Inventaire physique" subtitle="Saisie et validation des inventaires" />
      <div className="px-6 py-6 max-w-screen-2xl mx-auto space-y-6">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
          {(['sessions', 'saisie'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {tab === 'sessions' ? 'Sessions d\'inventaire' : 'Saisie en cours'}
            </button>
          ))}
        </div>
        {activeTab === 'sessions' ? (
          <div className="card-base overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between"><h2 className="text-sm font-bold text-foreground">Historique des inventaires</h2><button className="btn-primary flex items-center gap-1.5 text-sm py-2"><Plus size={14} /> Nouvel inventaire</button></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/50"><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Référence</th><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Date</th><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Responsable</th><th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Progression</th><th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Écarts</th><th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Statut</th><th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Actions</th></tr></thead>
                <tbody>
                  {INVENTAIRES.map((inv, idx) => {
                    const cfg = STATUT_SESSION[inv.statut];
                    const pct = Math.round((inv.articlesComptes / inv.totalArticles) * 100);
                    return (
                      <tr key={inv.id} className={`border-b border-border table-row-hover ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}>
                        <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{inv.reference}</td>
                        <td className="px-5 py-3 text-foreground">{inv.date}</td>
                        <td className="px-5 py-3 text-foreground">{inv.responsable}</td>
                        <td className="px-5 py-3 text-right"><div className="flex items-center justify-end gap-2"><div className="w-20 bg-muted rounded-full h-1.5"><div className="bg-primary h-1.5 rounded-full" style={{ width: `${pct}%` }} /></div><span className="text-xs tabular-nums text-muted-foreground">{pct}%</span></div></td>
                        <td className="px-5 py-3 text-right"><span className={`text-xs font-semibold ${inv.ecarts > 0 ? 'text-negative' : 'text-positive'}`}>{inv.ecarts > 0 ? `−${inv.ecarts}` : '0'}</span></td>
                        <td className="px-5 py-3 text-center"><span className={cfg.className}>{cfg.label}</span></td>
                        <td className="px-5 py-3 text-center"><button onClick={() => setActiveTab('saisie')} className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><Eye size={12} /> Voir</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="card-base p-5">
              <div className="flex items-center justify-between mb-3">
                <div><h3 className="text-sm font-bold text-foreground">INV-2026-08 — En cours</h3><p className="text-xs text-muted-foreground">Responsable : Ahmed Mansouri · Démarré le 01/08/2026</p></div>
                <div className="flex items-center gap-2"><button className="btn-secondary flex items-center gap-1.5 text-sm py-2"><Download size={14} /> Exporter</button><button className="btn-primary flex items-center gap-1.5 text-sm py-2"><CheckCircle size={14} /> Valider</button></div>
              </div>
              <div className="flex items-center gap-3"><div className="flex-1 bg-muted rounded-full h-2"><div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} /></div><span className="text-sm font-bold text-foreground tabular-nums">{progress}%</span></div>
              <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground"><span><span className="font-semibold text-foreground">{lignes.filter(l => l.statut !== 'en_attente').length}</span> comptés</span><span><span className="font-semibold text-foreground">{lignes.filter(l => l.statut === 'en_attente').length}</span> en attente</span><span><span className="font-semibold text-negative">{lignes.filter(l => l.statut === 'ecart').length}</span> écarts</span></div>
            </div>
            <div className="card-base overflow-hidden">
              <div className="px-5 py-4 border-b border-border"><div className="relative max-w-sm"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit..." className="input-field pl-9 text-sm" /></div></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border bg-muted/50"><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Référence</th><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Produit</th><th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Stock système</th><th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Stock compté</th><th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Écart</th><th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Statut</th></tr></thead>
                  <tbody>
                    {filteredLignes.map((ligne, idx) => (
                      <tr key={ligne.id} className={`border-b border-border table-row-hover ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}>
                        <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{ligne.ref}</td>
                        <td className="px-5 py-3 font-medium text-foreground">{ligne.produit}</td>
                        <td className="px-5 py-3 text-right tabular-nums text-foreground">{ligne.stockSysteme}</td>
                        <td className="px-5 py-3 text-right"><input type="number" min="0" value={ligne.stockCompte ?? ''} onChange={(e) => updateCompte(ligne.id, e.target.value)} placeholder="—" className="input-field w-24 text-right text-sm py-1.5" /></td>
                        <td className="px-5 py-3 text-right tabular-nums font-semibold">{ligne.ecart !== null ? (<span className={ligne.ecart < 0 ? 'text-negative' : ligne.ecart > 0 ? 'text-positive' : 'text-muted-foreground'}>{ligne.ecart > 0 ? '+' : ''}{ligne.ecart}</span>) : (<span className="text-muted-foreground">—</span>)}</td>
                        <td className="px-5 py-3 text-center">{ligne.statut === 'en_attente' && <span className="badge-hidden">En attente</span>}{ligne.statut === 'compte' && <span className="badge-active">Compté</span>}{ligne.statut === 'ecart' && <span className="badge-rupture">Écart</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
