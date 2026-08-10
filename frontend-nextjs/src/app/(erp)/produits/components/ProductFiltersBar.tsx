'use client';
import React from 'react';
import { Search, Plus, Trash2, EyeOff, X } from 'lucide-react';

interface ProductFiltersBarProps {
  searchQuery: string; onSearchChange: (v: string) => void; statusFilter: string; onStatusChange: (v: string) => void; stockFilter: string; onStockChange: (v: string) => void; totalFiltered: number; totalAll: number; onAddProduct: () => void; selectedCount: number; onBulkDelete: () => void; onBulkHide: () => void;
}

export default function ProductFiltersBar({ searchQuery, onSearchChange, statusFilter, onStatusChange, stockFilter, onStockChange, totalFiltered, totalAll, onAddProduct, selectedCount, onBulkDelete, onBulkHide }: ProductFiltersBarProps) {
  return (
    <div className="bg-card border-b border-border px-5 py-3 shrink-0">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} placeholder="Rechercher produit, référence..." className="input-field pl-9 text-sm" />
          {searchQuery && <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X size={13} /></button>}
        </div>
        <select value={statusFilter} onChange={(e) => onStatusChange(e.target.value)} className="text-sm border border-border rounded-lg px-3 py-2 bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"><option value="all">Tous les statuts</option><option value="actif">Actif</option><option value="masque">Masqué</option><option value="brouillon">Brouillon</option></select>
        <select value={stockFilter} onChange={(e) => onStockChange(e.target.value)} className="text-sm border border-border rounded-lg px-3 py-2 bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring"><option value="all">Tous les stocks</option><option value="ok">Stock normal</option><option value="alerte">En alerte</option><option value="rupture">Rupture</option></select>
        <span className="text-xs text-muted-foreground whitespace-nowrap">{totalFiltered} / {totalAll} produits</span>
        <div className="flex-1" />
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-1.5 slide-up">
            <span className="text-xs font-semibold text-primary">{selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}</span>
            <button onClick={onBulkHide} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted transition-colors" title="Masquer les produits sélectionnés"><EyeOff size={13} />Masquer</button>
            <button onClick={onBulkDelete} className="flex items-center gap-1 text-xs text-negative hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors" title="Supprimer les produits sélectionnés"><Trash2 size={13} />Supprimer</button>
          </div>
        )}
        <button onClick={onAddProduct} className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap"><Plus size={15} />Ajouter un produit</button>
      </div>
    </div>
  );
}
