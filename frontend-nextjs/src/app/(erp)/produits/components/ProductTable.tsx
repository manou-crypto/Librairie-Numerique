'use client';
import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Edit2, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import type { Product, SortField, SortDir } from './ProductManagementClient';

interface ProductTableProps {
  products: Product[]; selectedIds: Set<string>; onToggleSelect: (id: string) => void; onToggleSelectAll: () => void; allSelected: boolean; sortField: SortField; sortDir: SortDir; onSort: (field: SortField) => void; onEdit: (p: Product) => void; onDelete: (p: Product) => void; onToggleVisible: (id: string) => void; currentPage: number; totalPages: number; totalItems: number; pageSize: number; onPageChange: (page: number) => void;
}

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ChevronsUpDown size={12} className="text-muted-foreground/50" />;
  return sortDir === 'asc' ? <ChevronUp size={12} className="text-primary" /> : <ChevronDown size={12} className="text-primary" />;
}

function getStockDisplay(stock: number, seuil: number) {
  if (stock === 0) return <Badge variant="rupture">Rupture</Badge>;
  if (stock <= seuil) return <Badge variant="alert">{stock}</Badge>;
  return <span className="text-xs font-semibold tabular-nums text-green-600">{stock}</span>;
}

function getStatusBadge(status: Product['status']) {
  if (status === 'actif') return <Badge variant="active">Actif</Badge>;
  if (status === 'masque') return <Badge variant="hidden">Masqué</Badge>;
  return <Badge variant="draft">Brouillon</Badge>;
}

function calcMarge(prixAchat: number, prixVente: number): number {
  return ((prixVente - prixAchat) / prixVente) * 100;
}

export default function ProductTable({ products, selectedIds, onToggleSelect, onToggleSelectAll, allSelected, sortField, sortDir, onSort, onEdit, onDelete, onToggleVisible, currentPage, totalPages, totalItems, pageSize, onPageChange }: ProductTableProps) {
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  const pageNumbers: number[] = [];
  for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) pageNumbers.push(i);

  if (products.length === 0) {
    return (<div className="flex-1 flex items-center justify-center"><div className="text-center py-16"><div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4"><span className="text-2xl">📦</span></div><p className="text-sm font-semibold text-foreground mb-1">Aucun produit trouvé</p><p className="text-xs text-muted-foreground max-w-xs mx-auto">Aucun produit ne correspond à vos filtres. Modifiez votre recherche ou ajoutez un nouveau produit.</p></div></div>);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto scrollbar-thin">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-muted/80 backdrop-blur border-b border-border">
              <th className="px-4 py-3 w-10"><input type="checkbox" checked={allSelected} onChange={onToggleSelectAll} className="rounded border-border accent-primary w-4 h-4" aria-label="Sélectionner tout" /></th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Produit</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Référence</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Catégorie</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap cursor-pointer hover:text-foreground select-none" onClick={() => onSort('prixAchat')}><div className="flex items-center justify-end gap-1">Prix achat<SortIcon field="prixAchat" sortField={sortField} sortDir={sortDir} /></div></th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap cursor-pointer hover:text-foreground select-none" onClick={() => onSort('prixVente')}><div className="flex items-center justify-end gap-1">Prix vente<SortIcon field="prixVente" sortField={sortField} sortDir={sortDir} /></div></th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap cursor-pointer hover:text-foreground select-none" onClick={() => onSort('marge')}><div className="flex items-center justify-end gap-1">Marge %<SortIcon field="marge" sortField={sortField} sortDir={sortDir} /></div></th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap cursor-pointer hover:text-foreground select-none" onClick={() => onSort('stock')}><div className="flex items-center justify-end gap-1">Stock<SortIcon field="stock" sortField={sortField} sortDir={sortDir} /></div></th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Statut</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">Visible</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, idx) => {
              const marge = calcMarge(product.prixAchat, product.prixVente);
              const isSelected = selectedIds.has(product.id);
              return (
                <tr key={product.id} className={`border-b border-border table-row-hover transition-colors ${isSelected ? 'bg-primary/5' : idx % 2 === 0 ? 'bg-card' : 'bg-muted/20'}`}>
                  <td className="px-4 py-3"><input type="checkbox" checked={isSelected} onChange={() => onToggleSelect(product.id)} className="rounded border-border accent-primary w-4 h-4" aria-label={`Sélectionner ${product.name}`} /></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-3 min-w-[180px]"><div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 text-sm">{product.categoryId === 'cat-livres' ? '📚' : product.categoryId === 'cat-informatique' ? '💻' : product.categoryId === 'cat-bureautique' ? '🗂️' : '✏️'}</div><div className="min-w-0"><p className="text-xs font-semibold text-foreground truncate max-w-[160px]">{product.name}</p><p className="text-[10px] text-muted-foreground truncate max-w-[160px]">{product.description.slice(0, 40)}...</p></div></div></td>
                  <td className="px-4 py-3"><span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{product.reference}</span></td>
                  <td className="px-4 py-3"><span className="text-xs text-muted-foreground whitespace-nowrap">{product.categoryName}</span></td>
                  <td className="px-4 py-3 text-right"><span className="text-xs tabular-nums text-muted-foreground">{product.prixAchat.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} FCFA</span></td>
                  <td className="px-4 py-3 text-right"><span className="text-xs font-bold tabular-nums text-foreground">{product.prixVente.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} FCFA</span></td>
                  <td className="px-4 py-3 text-right"><span className={`text-xs font-semibold tabular-nums ${marge >= 45 ? 'text-green-600' : marge >= 30 ? 'text-blue-600' : marge >= 20 ? 'text-amber-600' : 'text-red-600'}`}>{marge.toFixed(1)}%</span></td>
                  <td className="px-4 py-3 text-right">{getStockDisplay(product.stock, product.seuilAlerte)}</td>
                  <td className="px-4 py-3 text-center">{getStatusBadge(product.status)}</td>
                  <td className="px-4 py-3 text-center"><button onClick={() => onToggleVisible(product.id)} className={`p-1.5 rounded-lg transition-colors ${product.visible ? 'text-green-600 hover:bg-green-50' : 'text-muted-foreground hover:bg-muted'}`} title={product.visible ? 'Masquer ce produit' : 'Rendre ce produit visible'} aria-label={product.visible ? 'Masquer le produit' : 'Afficher le produit'}>{product.visible ? <Eye size={15} /> : <EyeOff size={15} />}</button></td>
                  <td className="px-4 py-3"><div className="flex items-center justify-center gap-1"><button onClick={() => onEdit(product)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title={`Modifier ${product.name}`} aria-label={`Modifier ${product.name}`}><Edit2 size={14} /></button><button onClick={() => onDelete(product)} className="p-1.5 rounded-lg text-muted-foreground hover:text-negative hover:bg-red-50 transition-colors" title={`Supprimer ${product.name}`} aria-label={`Supprimer ${product.name}`}><Trash2 size={14} /></button></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border px-5 py-3 bg-card flex items-center justify-between gap-4 shrink-0 flex-wrap">
        <p className="text-xs text-muted-foreground">Affichage de <span className="font-semibold text-foreground">{start}–{end}</span> sur <span className="font-semibold text-foreground">{totalItems}</span> produits</p>
        <div className="flex items-center gap-1.5">
          <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Page précédente"><ChevronLeft size={14} /></button>
          {pageNumbers[0] > 1 && (<><button onClick={() => onPageChange(1)} className="w-7 h-7 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">1</button>{pageNumbers[0] > 2 && <span className="text-xs text-muted-foreground px-1">…</span>}</>)}
          {pageNumbers.map((page) => (<button key={`page-${page}`} onClick={() => onPageChange(page)} className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${page === currentPage ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>{page}</button>))}
          {pageNumbers[pageNumbers.length - 1] < totalPages && (<>{pageNumbers[pageNumbers.length - 1] < totalPages - 1 && <span className="text-xs text-muted-foreground px-1">…</span>}<button onClick={() => onPageChange(totalPages)} className="w-7 h-7 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">{totalPages}</button></>)}
          <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded-lg border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Page suivante"><ChevronRight size={14} /></button>
        </div>
        <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Lignes par page :</span><select className="text-xs border border-border rounded-lg px-2 py-1 bg-card focus:outline-none focus:ring-1 focus:ring-ring"><option>10</option><option>25</option><option>50</option></select></div>
      </div>
    </div>
  );
}
