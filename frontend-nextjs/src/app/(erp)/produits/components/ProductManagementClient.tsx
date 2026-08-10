'use client';
import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import CategoryTreeSidebar from './CategoryTreeSidebar';
import ProductTable from './ProductTable';
import ProductFiltersBar from './ProductFiltersBar';
import AddEditProductModal from './AddEditProductModal';
import DeleteConfirmModal from './DeleteConfirmModal';

export interface Product {
  id: string;
  name: string;
  reference: string;
  categoryId: string;
  categoryName: string;
  prixAchat: number;
  prixVente: number;
  stock: number;
  seuilAlerte: number;
  status: 'actif' | 'masque' | 'brouillon';
  visible: boolean;
  description: string;
  imageUrl?: string;
}

export const mockProducts: Product[] = [];

export type SortField = 'name' | 'prixVente' | 'prixAchat' | 'stock' | 'marge';
export type SortDir = 'asc' | 'desc';

export default function ProductManagementClient() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/v1/produits');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setProducts(data);
          } else if (data && Array.isArray(data.data)) {
            setProducts(data.data);
          }
        }
      } catch (e) {
        console.error('Erreur chargement produits', e);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (selectedCategory !== 'all') result = result.filter((p) => p.categoryId === selectedCategory);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q) || p.categoryName.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') result = result.filter((p) => p.status === statusFilter);
    if (stockFilter === 'rupture') result = result.filter((p) => p.stock === 0);
    if (stockFilter === 'alerte') result = result.filter((p) => p.stock > 0 && p.stock <= p.seuilAlerte);
    if (stockFilter === 'ok') result = result.filter((p) => p.stock > p.seuilAlerte);
    result.sort((a, b) => {
      let valA: number | string;
      let valB: number | string;
      if (sortField === 'marge') {
        valA = ((a.prixVente - a.prixAchat) / a.prixVente) * 100;
        valB = ((b.prixVente - b.prixAchat) / b.prixVente) * 100;
      } else {
        valA = a[sortField as keyof Product] as number | string;
        valB = b[sortField as keyof Product] as number | string;
      }
      if (typeof valA === 'string' && typeof valB === 'string') return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return sortDir === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
    return result;
  }, [products, selectedCategory, searchQuery, statusFilter, stockFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedProducts.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paginatedProducts.map((p) => p.id)));
  };

  const handleToggleVisible = (id: string) => {
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, visible: !p.visible, status: !p.visible ? 'actif' : 'masque' } : p));
    toast.success('Visibilité du produit mise à jour.');
  };

  const handleSaveProduct = (product: Product) => {
    if (products.find((p) => p.id === product.id)) {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
      toast.success(`Produit "${product.name}" mis à jour.`);
    } else {
      setProducts((prev) => [...prev, product]);
      toast.success(`Produit "${product.name}" ajouté au catalogue.`);
    }
    setEditingProduct(null);
    setIsAddModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast.success(`Produit "${deleteTarget.name}" supprimé.`);
  };

  const handleBulkDelete = () => {
    const count = selectedIds.size;
    setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
    toast.success(`${count} produit${count > 1 ? 's' : ''} supprimé${count > 1 ? 's' : ''}.`);
  };

  const handleBulkHide = () => {
    const count = selectedIds.size;
    setProducts((prev) => prev.map((p) => (selectedIds.has(p.id) ? { ...p, visible: false, status: 'masque' as const } : p)));
    setSelectedIds(new Set());
    toast.success(`${count} produit${count > 1 ? 's' : ''} masqué${count > 1 ? 's' : ''}.`);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <CategoryTreeSidebar selectedCategory={selectedCategory} onSelectCategory={(id) => { setSelectedCategory(id); setCurrentPage(1); }} products={products} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ProductFiltersBar searchQuery={searchQuery} onSearchChange={(v) => { setSearchQuery(v); setCurrentPage(1); }} statusFilter={statusFilter} onStatusChange={(v) => { setStatusFilter(v); setCurrentPage(1); }} stockFilter={stockFilter} onStockChange={(v) => { setStockFilter(v); setCurrentPage(1); }} totalFiltered={filteredProducts.length} totalAll={products.length} onAddProduct={() => setIsAddModalOpen(true)} selectedCount={selectedIds.size} onBulkDelete={handleBulkDelete} onBulkHide={handleBulkHide} />
        <ProductTable products={paginatedProducts} selectedIds={selectedIds} onToggleSelect={toggleSelect} onToggleSelectAll={toggleSelectAll} allSelected={selectedIds.size === paginatedProducts.length && paginatedProducts.length > 0} sortField={sortField} sortDir={sortDir} onSort={handleSort} onEdit={(p) => setEditingProduct(p)} onDelete={(p) => setDeleteTarget(p)} onToggleVisible={handleToggleVisible} currentPage={currentPage} totalPages={totalPages} totalItems={filteredProducts.length} pageSize={pageSize} onPageChange={setCurrentPage} />
      </div>
      <AddEditProductModal open={isAddModalOpen || editingProduct !== null} onClose={() => { setIsAddModalOpen(false); setEditingProduct(null); }} product={editingProduct} onSave={handleSaveProduct} />
      <DeleteConfirmModal open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} product={deleteTarget} onConfirm={handleDeleteConfirm} />
    </div>
  );
}
