import React from 'react';
import Modal from '@/components/ui/Modal';
import { Package, Plus } from 'lucide-react';
import type { ConditionnementItem } from '@/services/produits.service';

interface UnitSelectionModalProps {
  open: boolean;
  onClose: () => void;
  product: any;
  devise: string;
  onSelectUnit: (conditionnement: ConditionnementItem | null) => void;
}

export default function UnitSelectionModal({
  open,
  onClose,
  product,
  devise,
  onSelectUnit,
}: UnitSelectionModalProps) {
  if (!product) return null;

  return (
    <Modal open={open} onClose={onClose} title="Choisir l'unité de vente">
      <div className="space-y-4 pt-2">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onSelectUnit(null)}
            className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
          >
            <div>
              <p className="font-bold text-sm text-foreground">À l'unité (Détail)</p>
              <p className="text-xs text-muted-foreground">1 pièce</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Plus size={16} />
            </div>
          </button>

          {product.conditionnements?.map((cond: ConditionnementItem) => (
            <button
              key={cond.id || cond.nom}
              onClick={() => onSelectUnit(cond)}
              className="flex items-center justify-between p-4 rounded-xl border border-purple-500/30 bg-purple-50/10 dark:bg-purple-900/10 hover:border-purple-500/80 hover:bg-purple-500/10 transition-all text-left"
            >
              <div>
                <p className="font-bold text-sm text-purple-700 dark:text-purple-300 flex items-center gap-2">
                  <Package size={16} /> {cond.nom}
                </p>
                <p className="text-xs text-muted-foreground">
                  {cond.quantiteUnitaire} pièces
                  {cond.prixVente ? ` — Forfait : ${cond.prixVente} ${devise}` : ' — (Prix calculé au prorata)'}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Plus size={16} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
