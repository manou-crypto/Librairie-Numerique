'use client';
import React, { useState } from 'react';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import type { Product } from './ProductManagementClient';

interface DeleteConfirmModalProps { open: boolean; onClose: () => void; product: Product | null; onConfirm: () => void; }

export default function DeleteConfirmModal({ open, onClose, product, onConfirm }: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const handleConfirm = async () => { setLoading(true); await new Promise((r) => setTimeout(r, 600)); setLoading(false); onConfirm(); };

  return (
    <Modal open={open} onClose={onClose} title="Confirmer la suppression" size="sm">
      <div className="space-y-5">
        <div className="flex items-start gap-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0"><AlertTriangle size={20} className="text-red-600" /></div>
          <div><p className="text-sm font-semibold text-red-800 mb-1">Cette action est irréversible</p><p className="text-xs text-red-700">Le produit et toutes ses données associées seront définitivement supprimés du système. Les ventes passées ne seront pas affectées.</p></div>
        </div>
        {product && (<div className="bg-muted/50 rounded-xl p-4 border border-border"><p className="text-xs text-muted-foreground mb-1">Produit à supprimer :</p><p className="text-sm font-bold text-foreground">{product.name}</p><p className="text-xs text-muted-foreground font-mono mt-0.5">{product.reference}</p><p className="text-xs text-muted-foreground mt-1">Stock actuel : {product.stock} unités · {product.categoryName}</p></div>)}
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button onClick={handleConfirm} disabled={loading} className="btn-destructive flex-1 flex items-center justify-center gap-2">{loading ? (<><Loader2 size={15} className="animate-spin" />Suppression...</>) : (<><Trash2 size={15} />Supprimer définitivement</>)}</button>
        </div>
      </div>
    </Modal>
  );
}
