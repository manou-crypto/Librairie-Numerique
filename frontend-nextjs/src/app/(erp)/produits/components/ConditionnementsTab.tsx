'use client';
import React, { useState, useEffect } from 'react';
import { Search, Loader2, Save, Plus, Trash2, Package } from 'lucide-react';
import { produitsService, ConditionnementItem } from '@/services/produits.service';
import { unitesService, UniteItem } from '@/services/unites.service';
import type { Product } from './ProductManagementClient';
import { toast } from 'sonner';
import { useAppConfig } from '@/contexts/ConfigContext';

interface ConditionnementsTabProps {
  products: Product[];
  onUpdate: () => void;
}

export default function ConditionnementsTab({ products, onUpdate }: ConditionnementsTabProps) {
  const { config } = useAppConfig();
  const devise = config?.devise || 'FCFA';

  const [unites, setUnites] = useState<UniteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Local state for edits of the currently selected product
  const [edits, setEdits] = useState<ConditionnementItem[]>([]);

  useEffect(() => {
    unitesService.getUnites()
      .then(setUnites)
      .catch(() => toast.error('Erreur de chargement des unités'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      setEdits(
        (selectedProduct.conditionnements || []).map(c => ({
          uniteId: String(c.uniteId || ''),
          nom: c.nom || '',
          codeBarre: c.codeBarre || '',
          prixVente: c.prixVente || 0,
          quantiteUnitaire: c.quantiteUnitaire || 1,
        }))
      );
    } else {
      setEdits([]);
    }
  }, [selectedProduct]);

  const handleSave = async () => {
    if (!selectedProduct) return;
    
    // Validation
    for (const edit of edits) {
      if (!edit.uniteId) {
        toast.error("Veuillez sélectionner une unité pour chaque conditionnement.");
        return;
      }
    }

    setSaving(true);
    try {
      await produitsService.update(selectedProduct.id, {
        conditionnements: edits
      });
      toast.success('Conditionnements mis à jour avec succès');
      onUpdate();
      // Mettre à jour le selectedProduct localement pour éviter de perdre la sélection
      setSelectedProduct({
        ...selectedProduct,
        conditionnements: edits
      });
    } catch (err) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const addConditionnement = () => {
    setEdits([
      ...edits,
      { uniteId: '', nom: '', codeBarre: '', prixVente: 0, quantiteUnitaire: 1 }
    ]);
  };

  const removeConditionnement = (index: number) => {
    setEdits(edits.filter((_, i) => i !== index));
  };

  const updateConditionnement = (index: number, field: keyof ConditionnementItem, value: any) => {
    const newEdits = [...edits];
    
    if (field === 'uniteId') {
      const u = unites.find(un => un.id_unite.toString() === value);
      if (u) {
        newEdits[index].nom = u.nom;
        newEdits[index].quantiteUnitaire = u.multiple;
      }
    }

    newEdits[index] = { ...newEdits[index], [field]: value };
    setEdits(newEdits);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.reference.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-muted-foreground">
        <Loader2 size={32} className="animate-spin mb-4" />
        <p>Chargement des unités...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex h-full bg-background overflow-hidden">
      {/* Barre latérale des produits */}
      <div className="w-80 flex flex-col border-r border-border bg-card shrink-0">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Chercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 h-10 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
          {filteredProducts.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProduct(p)}
              className={`w-full text-left p-3 rounded-lg transition-all ${
                selectedProduct?.id === p.id 
                  ? 'bg-primary/10 border-primary/30 border shadow-sm' 
                  : 'hover:bg-muted border border-transparent'
              }`}
            >
              <div className="font-semibold text-sm text-foreground truncate">{p.name}</div>
              <div className="text-[10px] text-muted-foreground">{p.reference}</div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs font-medium text-primary tabular-nums">{p.prixVente} {devise}</span>
                {p.conditionnements && p.conditionnements.length > 0 && (
                  <span className="text-[10px] bg-brand/10 text-brand px-1.5 py-0.5 rounded-full font-bold">
                    {p.conditionnements.length} cond.
                  </span>
                )}
              </div>
            </button>
          ))}
          {filteredProducts.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Aucun produit trouvé.
            </div>
          )}
        </div>
      </div>

      {/* Zone principale d'édition */}
      <div className="flex-1 flex flex-col bg-muted/10 overflow-hidden relative">
        {selectedProduct ? (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-border bg-card flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Package className="text-brand" /> {selectedProduct.name}
                </h2>
                <p className="text-sm text-muted-foreground">Prix de base: <span className="font-bold tabular-nums text-foreground">{selectedProduct.prixVente} {devise}</span></p>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary py-2 px-4 flex items-center gap-2 text-sm"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Enregistrer
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              <div className="max-w-4xl mx-auto space-y-6">
                
                <div className="flex justify-between items-center bg-card p-4 rounded-xl shadow-sm border border-border">
                  <div>
                    <h3 className="font-bold text-foreground">Conditionnements Spécifiques</h3>
                    <p className="text-xs text-muted-foreground">Ajoutez des conditionnements (ex: Carton de 24) avec un prix ou code-barres spécifique.</p>
                  </div>
                  <button
                    onClick={addConditionnement}
                    className="btn-secondary py-1.5 px-3 flex items-center gap-2 text-sm"
                  >
                    <Plus size={14} /> Ajouter un conditionnement
                  </button>
                </div>

                {edits.length === 0 ? (
                  <div className="card-base p-12 flex flex-col items-center justify-center text-center border-dashed">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-4">
                      <Package size={32} />
                    </div>
                    <p className="text-foreground font-semibold mb-1">Aucun conditionnement spécifique</p>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Ce produit sera vendu uniquement à l'unité de base au prix de détail.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {edits.map((edit, idx) => (
                      <div key={idx} className="card-base p-4 flex flex-col sm:flex-row gap-4 items-end relative hover:border-primary/30 transition-colors">
                        
                        <div className="flex-1 w-full">
                          <label className="block text-xs font-semibold text-foreground mb-1.5">Unité Globale</label>
                          <select
                            value={edit.uniteId || ''}
                            onChange={(e) => updateConditionnement(idx, 'uniteId', e.target.value)}
                            className="input-field text-sm w-full"
                          >
                            <option value="">Sélectionner une unité...</option>
                            {unites.map(u => (
                              <option key={u.id_unite} value={u.id_unite}>{u.nom} (x{u.multiple})</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="flex-1 w-full">
                          <label className="block text-xs font-semibold text-foreground mb-1.5">Code-barres Spécifique</label>
                          <input
                            type="text"
                            value={edit.codeBarre || ''}
                            onChange={(e) => updateConditionnement(idx, 'codeBarre', e.target.value)}
                            className="input-field text-sm w-full font-mono"
                            placeholder="Optionnel"
                          />
                        </div>

                        <div className="flex-1 w-full">
                          <label className="block text-xs font-semibold text-foreground mb-1.5">Prix Forfaitaire ({devise})</label>
                          <input
                            type="number"
                            min="0"
                            value={edit.prixVente || ''}
                            onChange={(e) => updateConditionnement(idx, 'prixVente', parseFloat(e.target.value))}
                            className="input-field tabular-nums text-sm font-bold text-primary w-full"
                            placeholder="Prix auto (vide)"
                          />
                          <p className="text-[10px] text-muted-foreground mt-1 absolute -bottom-4">
                            Laissez vide pour calculer le prix automatiquement.
                          </p>
                        </div>

                        <button
                          onClick={() => removeConditionnement(idx)}
                          className="p-2.5 bg-negative/10 text-negative hover:bg-negative hover:text-white rounded-lg transition-colors shrink-0"
                          title="Supprimer ce conditionnement"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
            <div className="w-20 h-20 bg-muted/50 rounded-3xl flex items-center justify-center text-muted-foreground mb-6">
              <Package size={40} />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Gérez vos conditionnements</h2>
            <p className="text-muted-foreground max-w-md">
              Sélectionnez un produit dans la liste de gauche pour configurer des conditionnements spécifiques (ex: carton, pack) et leurs prix.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
