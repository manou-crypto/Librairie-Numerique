'use client';
import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { PackagePlus, Loader2 } from 'lucide-react';
import { produitsService, Product } from '@/services/produits.service';
import useSWR from 'swr';
import { fetcher } from '@/lib/swr-fetcher';

interface AddStockModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (produitId: string, quantite: number, seuilAlerte: number) => Promise<void>;
}

export default function AddStockModal({ open, onClose, onSave }: AddStockModalProps) {
  const { data: resProducts } = useSWR('/v1/produits?pageSize=1000', fetcher);
  const rawProducts = Array.isArray(resProducts) ? resProducts : resProducts?.data || [];
  
  // On pourrait filtrer ici les produits qui n'ont pas de stock
  const [produitId, setProduitId] = useState<string>('');
  const [quantite, setQuantite] = useState<string>('');
  const [seuilAlerte, setSeuilAlerte] = useState<string>('5');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) {
      setProduitId('');
      setQuantite('');
      setSeuilAlerte('5');
      setError(null);
      setSearch('');
    }
  }, [open]);

  const filteredProducts = rawProducts.filter((p: any) => 
    p.libelle?.toLowerCase().includes(search.toLowerCase()) || 
    p.reference?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 50); // limit for performance

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produitId) {
      setError('Veuillez sélectionner un produit.');
      return;
    }

    const qty = parseInt(quantite, 10);
    const seuil = parseInt(seuilAlerte, 10) || 5;

    if (isNaN(qty) || qty < 0) {
      setError('Veuillez entrer une quantité valide.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave(produitId, qty, seuil);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'ajout du stock.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Ajouter / Créer un stock" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">Produit</label>
          <input
            type="text"
            placeholder="Rechercher par nom ou référence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field mb-2"
          />
          <select
            value={produitId}
            onChange={(e) => setProduitId(e.target.value)}
            className="input-field"
            required
            size={5}
          >
            <option value="" disabled>-- Sélectionner un produit --</option>
            {filteredProducts.map((p: any) => (
              <option key={p.id || p.id_produit} value={p.id || p.id_produit}>
                [{p.reference}] {p.libelle || p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Quantité</label>
            <input
              type="number"
              min="0"
              required
              value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
              className="input-field"
              placeholder="Ex: 50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Seuil d'alerte</label>
            <input
              type="number"
              min="0"
              value={seuilAlerte}
              onChange={(e) => setSeuilAlerte(e.target.value)}
              className="input-field"
              placeholder="Défaut: 5"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} disabled={isSaving} className="btn-secondary flex-1">
            Annuler
          </button>
          <button type="submit" disabled={isSaving || !produitId || quantite === ''} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {isSaving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <PackagePlus size={16} /> Enregistrer
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
