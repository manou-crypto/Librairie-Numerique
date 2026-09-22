'use client';
import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { PackagePlus, Loader2, Info } from 'lucide-react';
import { Product } from './ProductManagementClient';

interface RechargeStockModalProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onSave: (mode: 'ajouter' | 'redefinir', quantite: number) => Promise<void>;
}

export default function RechargeStockModal({
  open,
  onClose,
  product,
  onSave,
}: RechargeStockModalProps) {
  const [mode, setMode] = useState<'ajouter' | 'redefinir'>('ajouter');
  const [quantite, setQuantite] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMode('ajouter');
      setQuantite('');
      setError(null);
    }
  }, [open, product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const qty = parseInt(quantite, 10);
    if (isNaN(qty) || qty < 0) {
      setError('Veuillez entrer une quantité valide (nombre positif ou nul).');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      await onSave(mode, qty);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la mise à jour du stock.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!product) return null;

  const currentStock = product.stock || 0;
  const qtyNum = parseInt(quantite, 10) || 0;
  const nextStock = mode === 'ajouter' ? currentStock + qtyNum : qtyNum;

  return (
    <Modal open={open} onClose={onClose} title="Recharger le stock" size="sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-muted p-4 rounded-xl border border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Produit concerné</p>
          <p className="text-sm font-bold text-foreground">{product.name}</p>
          <div className="mt-2 flex gap-4 text-xs font-medium">
            <span className="text-muted-foreground">Réf: <span className="text-foreground">{product.reference}</span></span>
            <span className="text-muted-foreground">Stock actuel: <span className="text-foreground">{currentStock}</span></span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">Mode de mise à jour</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('ajouter')}
                className={`py-2 px-3 rounded-lg border-2 text-sm font-semibold transition-colors ${
                  mode === 'ajouter'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/30'
                }`}
              >
                Ajouter au stock
              </button>
              <button
                type="button"
                onClick={() => setMode('redefinir')}
                className={`py-2 px-3 rounded-lg border-2 text-sm font-semibold transition-colors ${
                  mode === 'redefinir'
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-border text-muted-foreground hover:border-orange-200'
                }`}
              >
                Redéfinir le stock
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground flex items-start gap-1">
              <Info size={14} className="shrink-0 mt-0.5" />
              {mode === 'ajouter' 
                ? "La quantité saisie sera ajoutée au stock actuel."
                : "La quantité saisie remplacera le stock actuel. (Utile pour corriger un inventaire)"}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Quantité à {mode === 'ajouter' ? 'ajouter' : 'définir'}
            </label>
            <input
              type="number"
              min="0"
              required
              value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
              className="input-field"
              placeholder="Ex: 50"
              autoFocus
            />
          </div>

          {quantite !== '' && !isNaN(qtyNum) && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground font-medium mb-1">Nouveau stock projeté</p>
              <p className="text-2xl font-bold text-primary tabular-nums">{nextStock}</p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-border">
          <button type="button" onClick={onClose} disabled={isSaving} className="btn-secondary flex-1">
            Annuler
          </button>
          <button type="submit" disabled={isSaving || quantite === ''} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Enregistrement...
              </>
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
