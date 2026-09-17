'use client';
import React, { useState, useEffect } from 'react';
import { Search, Loader2, Save, Tag } from 'lucide-react';
import { produitsService, TypeVenteItem } from '@/services/produits.service';
import type { Product } from './ProductManagementClient';
import { toast } from 'sonner';
import { useAppConfig } from '@/contexts/ConfigContext';

interface TarificationTabProps {
  products: Product[];
  onUpdate: () => void;
}

export default function TarificationTab({ products, onUpdate }: TarificationTabProps) {
  const { config } = useAppConfig();
  const devise = config?.devise || 'FCFA';

  const [typesVente, setTypesVente] = useState<TypeVenteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  
  // Local state for edits
  const [edits, setEdits] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    produitsService.getTypesVente()
      .then(setTypesVente)
      .catch(() => toast.error('Erreur de chargement des types de vente'))
      .finally(() => setLoading(false));
  }, []);

  // Initialize edits when products or typesVente change
  useEffect(() => {
    if (products.length > 0 && typesVente.length > 0) {
      const initialEdits: Record<string, Record<string, number>> = {};
      products.forEach(p => {
        initialEdits[p.id] = {};
        typesVente.forEach(tv => {
          const existing = p.tarifs?.find((t: any) => t.typeVenteId === tv.id);
          initialEdits[p.id][tv.id] = existing ? existing.prix : (p.prixVente || 0);
        });
      });
      setEdits(initialEdits);
    }
  }, [products, typesVente]);

  const handlePriceChange = (productId: string, typeVenteId: string, value: string) => {
    const val = parseFloat(value);
    setEdits(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [typeVenteId]: isNaN(val) ? 0 : val
      }
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const promises = products.map(p => {
        const productEdits = edits[p.id];
        if (!productEdits) return Promise.resolve();

        const updatedTarifs = typesVente.map(tv => ({
          typeVenteId: tv.id,
          libelle: tv.libelle,
          prix: productEdits[tv.id]
        }));

        return produitsService.update(p.id, {
          ...p,
          tarifs: updatedTarifs
        });
      });

      await Promise.all(promises);
      toast.success('Tous les prix ont été enregistrés');
      onUpdate();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.reference.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-muted-foreground">
        <Loader2 size={32} className="animate-spin mb-4" />
        <p>Chargement de la tarification...</p>
      </div>
    );
  }

  if (typesVente.length === 0) {
    return (
      <div className="flex-1 p-6">
        <div className="card-base p-8 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center mx-auto mb-4">
            <Tag size={24} />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Aucun type de vente configuré</h3>
          <p className="text-muted-foreground mb-6">
            Vous devez d'abord configurer des types de vente (ex: Détail, Gros) dans les paramètres.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden p-4 sm:p-6 gap-4">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 h-10 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="btn-primary py-2 px-4 flex items-center gap-2 text-sm whitespace-nowrap"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Tout enregistrer
        </button>
      </div>

      <div className="card-base flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Réf</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Produit</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Prix de base</th>
                {typesVente.map(tv => (
                  <th key={tv.id} className="px-4 py-3 font-semibold text-primary">
                    Prix {tv.libelle}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map(p => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{p.reference}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                  <td className="px-4 py-3 tabular-nums">{p.prixVente} {devise}</td>
                  {typesVente.map(tv => (
                    <td key={tv.id} className="px-4 py-2">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={edits[p.id]?.[tv.id] ?? ''}
                          onChange={(e) => handlePriceChange(p.id, tv.id, e.target.value)}
                          className="w-28 h-8 px-2 bg-card border border-border rounded-lg text-sm tabular-nums focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
                          {devise}
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={typesVente.length + 3} className="px-4 py-8 text-center text-muted-foreground">
                    Aucun produit ne correspond à votre recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
