import React from 'react';
import { Package, X, Tag, Barcode, DollarSign, Percent, Box, Image as ImageIcon } from 'lucide-react';
import { Product } from './ProductManagementClient';
import Badge from '@/components/ui/Badge';
import { useAppConfig } from '@/contexts/ConfigContext';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
}

export default function ProductDetailModal({ product, onClose }: ProductDetailModalProps) {
  const { config } = useAppConfig();
  const devise = config?.devise || 'FCFA';

  const marge = product.prixVente > 0 
    ? ((product.prixVente - product.prixAchat) / product.prixVente) * 100 
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl fade-in flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package size={18} className="text-primary" />
            </div>
            <h3 className="text-base font-bold text-foreground line-clamp-1">{product.name}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="px-6 py-5 overflow-y-auto space-y-6 flex-1">
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-full sm:w-1/3 aspect-square rounded-xl bg-muted flex items-center justify-center border border-border/50 shrink-0 overflow-hidden">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={48} className="text-muted-foreground/30" />
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><Barcode size={12}/> Référence</p>
                  <p className="text-sm font-semibold text-foreground font-mono bg-muted px-2 py-1 rounded w-fit">{product.reference}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><Tag size={12}/> Catégorie</p>
                  <p className="text-sm font-semibold text-foreground">{product.categoryName || 'Général'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Marque</p>
                  <p className="text-sm font-semibold text-foreground">{product.marque || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Statut</p>
                  {product.status === 'actif' ? <Badge variant="active">Actif</Badge> : 
                   product.status === 'masque' ? <Badge variant="hidden">Masqué</Badge> : 
                   <Badge variant="draft">Brouillon</Badge>}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* Pricing & Stock */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Prix d'achat</p>
              <p className="text-base font-bold text-foreground tabular-nums">
                {product.prixAchat.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} <span className="text-xs font-normal">{devise}</span>
              </p>
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-primary/80 mb-1">Prix de vente</p>
              <p className="text-base font-bold text-primary tabular-nums">
                {product.prixVente.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} <span className="text-xs font-normal">{devise}</span>
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Marge brute</p>
              <p className={`text-base font-bold tabular-nums ${marge >= 30 ? 'text-green-600' : 'text-amber-600'}`}>
                {marge.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">En stock</p>
              <div className="flex items-center gap-2">
                <p className={`text-base font-bold tabular-nums ${product.stock === 0 ? 'text-red-600' : product.stock <= product.seuilAlerte ? 'text-amber-600' : 'text-green-600'}`}>
                  {product.stock}
                </p>
                {product.stock <= product.seuilAlerte && product.stock > 0 && <span className="text-[10px] text-amber-600 bg-amber-100 px-1 rounded">Alerte</span>}
                {product.stock === 0 && <span className="text-[10px] text-red-600 bg-red-100 px-1 rounded">Rupture</span>}
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Description</p>
              <div className="text-sm text-foreground bg-muted/30 p-3 rounded-lg border border-border/50 whitespace-pre-wrap">
                {product.description}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-end px-6 py-4 border-t border-border shrink-0">
          <button onClick={onClose} className="btn-secondary text-sm py-2 px-4">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
