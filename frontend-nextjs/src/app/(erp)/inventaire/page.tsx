'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { Search, Plus, CheckCircle, Clock, Save, Eye, Loader2, ArrowLeft } from 'lucide-react';
import { inventaireService, InventaireItem, LigneInventaireItem } from '@/services/inventaire.service';
import { produitsService, Produit } from '@/services/produits.service';
import { toast } from 'sonner';

const STATUT_SESSION: Record<string, { label: string; className: string; icon: any }> = {
  EN_COURS: { label: 'En cours', className: 'badge-draft', icon: Clock },
  VALIDE: { label: 'Validé', className: 'badge-active', icon: CheckCircle },
  ANNULE: { label: 'Annulé', className: 'badge-rupture', icon: CheckCircle },
};

export default function InventairePage() {
  const [inventaires, setInventaires] = useState<InventaireItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'sessions' | 'saisie'>('sessions');
  const [search, setSearch] = useState('');
  
  // Saisie state
  const [lignes, setLignes] = useState<LigneInventaireItem[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [currentRef, setCurrentRef] = useState<string>('');
  const [currentStatut, setCurrentStatut] = useState<'EN_COURS'|'VALIDE'|'ANNULE'>('EN_COURS');
  const [saving, setSaving] = useState(false);

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

  const handleNouvelInventaire = async () => {
    setLoading(true);
    try {
      const res = await produitsService.getAll({ pageSize: 10000 });
      const produits = res.data;
      const initialLignes = produits.map((p) => ({
        id: `temp-${p.id}`,
        produitId: p.id,
        produitLibelle: p.libelle,
        quantiteTheorique: p.stock || 0,
        quantiteReelle: 0,
        ecart: 0 - (p.stock || 0),
      }));
      setLignes(initialLignes);
      setCurrentId(null);
      setCurrentRef(`INV-${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2, '0')}-NOUVEAU`);
      setCurrentStatut('EN_COURS');
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
      setActiveTab('saisie');
    } catch (e) {
      toast.error('Erreur lors du chargement des détails');
    } finally {
      setLoading(false);
    }
  };

  const updateCompte = (produitId: string, value: string) => {
    if (currentStatut === 'VALIDE') return;
    const num = parseInt(value);
    setLignes(prev => prev.map(l => {
      if (l.produitId !== produitId) return l;
      if (isNaN(num)) return { ...l, quantiteReelle: 0, ecart: 0 - l.quantiteTheorique };
      return { ...l, quantiteReelle: num, ecart: num - l.quantiteTheorique };
    }));
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const payloadLignes = lignes.map(l => ({
        produitId: l.produitId,
        quantiteTheorique: l.quantiteTheorique,
        quantiteReelle: l.quantiteReelle
      }));

      if (currentId) {
        await inventaireService.update(currentId, { lignes: payloadLignes });
        toast.success('Brouillon mis à jour !');
      } else {
        const ref = `INV-${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}`;
        const res = await inventaireService.create({ referenceInventaire: ref, lignes: payloadLignes });
        setCurrentId(res.id);
        setCurrentRef(res.referenceInventaire);
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
    if (!confirm('Attention : Cette action va mettre à jour le stock de votre librairie. Voulez-vous continuer ?')) return;
    setSaving(true);
    try {
      let invId = currentId;
      const payloadLignes = lignes.map(l => ({
        produitId: l.produitId,
        quantiteTheorique: l.quantiteTheorique,
        quantiteReelle: l.quantiteReelle
      }));

      if (!invId) {
        const ref = `INV-${new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14)}`;
        const res = await inventaireService.create({ referenceInventaire: ref, lignes: payloadLignes });
        invId = res.id;
      } else {
        await inventaireService.update(invId, { lignes: payloadLignes });
      }

      const validated = await inventaireService.valider(invId);
      setCurrentStatut(validated.statutInventaire);
      toast.success('Inventaire validé ! Les stocks ont été mis à jour.');
      loadInventaires();
    } catch (err) {
      toast.error('Erreur lors de la validation');
    } finally {
      setSaving(false);
    }
  };

  const filteredLignes = lignes.filter(l => l.produitLibelle.toLowerCase().includes(search.toLowerCase()));
  
  let compteCount = 0;
  let waitCount = 0;
  let ecartCount = 0;
  lignes.forEach(l => {
    if (l.quantiteReelle === 0 && l.quantiteTheorique > 0) waitCount++;
    else {
      compteCount++;
      if (l.ecart !== 0) ecartCount++;
    }
  });
  
  const progress = lignes.length > 0 ? Math.round((compteCount / lignes.length) * 100) : 0;

  return (
    <AppLayout currentPath="/inventaire">
      <Topbar title="Inventaire physique" subtitle="Saisie et validation des inventaires" />
      <div className="px-6 py-6 max-w-screen-2xl mx-auto space-y-6">
        
        {activeTab === 'saisie' && (
          <button onClick={() => setActiveTab('sessions')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Retour à l'historique
          </button>
        )}

        {activeTab === 'sessions' ? (
          <div className="card-base overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">Historique des inventaires</h2>
              <button onClick={handleNouvelInventaire} disabled={loading} className="btn-primary flex items-center gap-1.5 text-sm py-2 disabled:opacity-50">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} 
                Nouvel inventaire
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/50"><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Référence</th><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Date</th><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Responsable</th><th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Statut</th><th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Actions</th></tr></thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="py-8 text-center text-muted-foreground"><Loader2 className="animate-spin mx-auto mb-2" size={24} /> Chargement...</td></tr>
                  ) : inventaires.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Aucun inventaire trouvé</td></tr>
                  ) : inventaires.map((inv, idx) => {
                    const cfg = STATUT_SESSION[inv.statutInventaire] || STATUT_SESSION['EN_COURS'];
                    return (
                      <tr key={inv.id} className={`border-b border-border table-row-hover ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}>
                        <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{inv.referenceInventaire}</td>
                        <td className="px-5 py-3 text-foreground">{new Date(inv.dateInventaire).toLocaleDateString()}</td>
                        <td className="px-5 py-3 text-foreground">{inv.utilisateurNom || 'Inconnu'}</td>
                        <td className="px-5 py-3 text-center"><span className={cfg.className}>{cfg.label}</span></td>
                        <td className="px-5 py-3 text-center">
                          <button onClick={() => handleVoir(inv.id)} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                            <Eye size={12} /> {inv.statutInventaire === 'EN_COURS' ? 'Reprendre' : 'Voir'}
                          </button>
                        </td>
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
                <div>
                  <h3 className="text-sm font-bold text-foreground">{currentRef}</h3>
                  <span className={`inline-block mt-1 ${STATUT_SESSION[currentStatut]?.className}`}>{STATUT_SESSION[currentStatut]?.label}</span>
                </div>
                {currentStatut === 'EN_COURS' && (
                  <div className="flex items-center gap-2">
                    <button onClick={handleSaveDraft} disabled={saving} className="btn-secondary flex items-center gap-1.5 text-sm py-2">
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Brouillon
                    </button>
                    <button onClick={handleValider} disabled={saving} className="btn-primary flex items-center gap-1.5 text-sm py-2">
                      <CheckCircle size={14} /> Valider l'inventaire
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3"><div className="flex-1 bg-muted rounded-full h-2"><div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} /></div><span className="text-sm font-bold text-foreground tabular-nums">{progress}%</span></div>
              <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground"><span><span className="font-semibold text-foreground">{compteCount}</span> comptés</span><span><span className="font-semibold text-foreground">{waitCount}</span> en attente</span><span><span className="font-semibold text-negative">{ecartCount}</span> écarts</span></div>
            </div>
            
            <div className="card-base overflow-hidden">
              <div className="px-5 py-4 border-b border-border"><div className="relative max-w-sm"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit..." className="input-field pl-9 text-sm" /></div></div>
              <div className="overflow-x-auto max-h-[60vh]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[#f9fafb] shadow-sm z-10"><tr className="border-b border-border"><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Produit</th><th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Stock Système (Théorique)</th><th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Stock Compté (Réel)</th><th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Écart</th></tr></thead>
                  <tbody>
                    {filteredLignes.map((ligne, idx) => (
                      <tr key={ligne.produitId} className={`border-b border-border table-row-hover ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}>
                        <td className="px-5 py-3 font-medium text-foreground">{ligne.produitLibelle}</td>
                        <td className="px-5 py-3 text-right tabular-nums text-foreground">{ligne.quantiteTheorique}</td>
                        <td className="px-5 py-3 text-right">
                          <input 
                            type="number" 
                            min="0" 
                            value={ligne.quantiteReelle === 0 && ligne.ecart === 0 - ligne.quantiteTheorique && !currentId ? '' : ligne.quantiteReelle} 
                            onChange={(e) => updateCompte(ligne.produitId, e.target.value)} 
                            disabled={currentStatut === 'VALIDE'}
                            placeholder="—" 
                            className="input-field w-24 text-right text-sm py-1.5 disabled:opacity-50" 
                          />
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums font-semibold">{ligne.ecart !== 0 ? (<span className={ligne.ecart < 0 ? 'text-negative' : 'text-positive'}>{ligne.ecart > 0 ? '+' : ''}{ligne.ecart}</span>) : (<span className="text-muted-foreground">—</span>)}</td>
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
