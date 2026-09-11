'use client';
import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import CategoryTreeSidebar, {
  buildCategoryTree,
  getAllCategoryDescendantIds,
} from './CategoryTreeSidebar';
import ProductTable from './ProductTable';
import ProductFiltersBar from './ProductFiltersBar';
import AddEditProductModal from './AddEditProductModal';
import AddCategoryModal from './AddCategoryModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import { produitsService, CategorieItem } from '@/services/produits.service';
import useSWR from 'swr';
import { fetcher, SWR_DEFAULT_CONFIG } from '@/lib/swr-fetcher';

export interface Product {
  id: string;
  name: string;
  reference: string;
  categoryId: string;
  categoryName: string;
  categoryIds?: string[];
  prixAchat: number;
  prixVente: number;
  stock: number;
  seuilAlerte: number;
  status: 'actif' | 'masque' | 'brouillon';
  visible: boolean;
  description: string;
  marque?: string;
  imageUrl?: string;
}

export type SortField = 'name' | 'prixVente' | 'prixAchat' | 'stock' | 'marge';
export type SortDir = 'asc' | 'desc';

export default function ProductManagementClient() {
  const {
    data: resProducts,
    mutate: mutateProducts,
    isLoading: loadingProducts,
  } = useSWR('/v1/produits?pageSize=500', fetcher, SWR_DEFAULT_CONFIG);
  const {
    data: resCategories,
    mutate: mutateCategories,
    isLoading: loadingCats,
  } = useSWR('/v1/categories', fetcher, SWR_DEFAULT_CONFIG);

  const rawProducts = Array.isArray(resProducts) ? resProducts : resProducts?.data || [];
  const products: Product[] = useMemo(() => {
    return rawProducts.map((p: any) => ({
      ...p,
      name: p.libelle || p.name || 'Produit sans nom',
      visible: p.status === 'VISIBLE',
      status: p.status === 'VISIBLE' ? 'actif' : 'masque',
      categoryIds: p.categoryIds || (p.categoryId ? [String(p.categoryId)] : []),
    }));
  }, [rawProducts]);

  const categories: CategorieItem[] = Array.isArray(resCategories) ? resCategories : [];
  const loading = loadingProducts || loadingCats;

  const loadData = async () => {
    await Promise.all([mutateProducts(), mutateCategories()]);
  };

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Map category IDs to their descendant IDs for recursive filtering
  const categoryDescendantsMap = useMemo(() => {
    const tree = buildCategoryTree(categories);
    const map = new Map<string, Set<string>>();

    function traverse(node: any) {
      const descendantIds = new Set(getAllCategoryDescendantIds(node));
      map.set(node.id, descendantIds);
      if (node.children) {
        node.children.forEach(traverse);
      }
    }

    tree.forEach(traverse);
    return map;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter with hierarchy support
    if (selectedCategory !== 'all') {
      const validCategoryIds =
        categoryDescendantsMap.get(selectedCategory) || new Set([selectedCategory]);
      result = result.filter((p) => {
        if (p.categoryIds && p.categoryIds.length > 0) {
          return p.categoryIds.some((id) => validCategoryIds.has(id));
        }
        return validCategoryIds.has(p.categoryId);
      });
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.reference.toLowerCase().includes(q) ||
          (p.categoryName && p.categoryName.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }

    // Stock filter
    if (stockFilter === 'rupture') result = result.filter((p) => p.stock === 0);
    if (stockFilter === 'alerte')
      result = result.filter((p) => p.stock > 0 && p.stock <= p.seuilAlerte);
    if (stockFilter === 'ok') result = result.filter((p) => p.stock > p.seuilAlerte);

    // Sorting
    result.sort((a, b) => {
      let valA: number | string;
      let valB: number | string;
      if (sortField === 'marge') {
        valA = a.prixVente > 0 ? ((a.prixVente - a.prixAchat) / a.prixVente) * 100 : 0;
        valB = b.prixVente > 0 ? ((b.prixVente - b.prixAchat) / b.prixVente) * 100 : 0;
      } else {
        valA = a[sortField as keyof Product] as number | string;
        valB = b[sortField as keyof Product] as number | string;
      }
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDir === 'asc'
        ? (Number(valA) || 0) - (Number(valB) || 0)
        : (Number(valB) || 0) - (Number(valA) || 0);
    });

    return result;
  }, [
    products,
    selectedCategory,
    searchQuery,
    statusFilter,
    stockFilter,
    sortField,
    sortDir,
    categoryDescendantsMap,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedProducts.length && paginatedProducts.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedProducts.map((p) => p.id)));
    }
  };

  const handleToggleVisible = async (id: string) => {
    try {
      await produitsService.masquer(id);
      toast.success('Visibilité du produit mise à jour.');
      await loadData();
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la mise à jour de la visibilité');
    }
  };

  const handleSaveProduct = async (product: Product) => {
    try {
      const payload: any = {
        ...product,
        libelle: product.name,
        status: product.visible ? 'VISIBLE' : 'MASQUE',
      };

      if (product.id && product.id !== '') {
        await produitsService.update(product.id, payload);
        toast.success(`Produit "${product.name}" mis à jour.`);
      } else {
        await produitsService.create(payload);
        toast.success(`Produit "${product.name}" ajouté au catalogue.`);
      }
      setEditingProduct(null);
      setIsAddModalOpen(false);
      await loadData();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Erreur lors de la sauvegarde du produit');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await produitsService.delete(deleteTarget.id);
      toast.success(`Produit "${deleteTarget.name}" supprimé.`);
      setDeleteTarget(null);
      await loadData();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Erreur lors de la suppression du produit');
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedIds.size;
    if (count === 0) return;
    try {
      await Promise.all(Array.from(selectedIds).map((id) => produitsService.delete(id)));
      setSelectedIds(new Set());
      toast.success(`${count} produit${count > 1 ? 's' : ''} supprimé${count > 1 ? 's' : ''}.`);
      await loadData();
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors de la suppression en masse');
    }
  };

  const handleBulkHide = async () => {
    const count = selectedIds.size;
    if (count === 0) return;
    try {
      await Promise.all(Array.from(selectedIds).map((id) => produitsService.masquer(id)));
      setSelectedIds(new Set());
      toast.success(`${count} produit${count > 1 ? 's' : ''} masqué${count > 1 ? 's' : ''}.`);
      await loadData();
    } catch (e) {
      console.error(e);
      toast.error('Erreur lors du masquage en masse');
    }
  };

  const handleSaveCategory = async (catData: { nom: string; parentId: string | null }) => {
    try {
      await produitsService.createCategory(catData);
      await mutateCategories();
      toast.success(`Catégorie "${catData.nom}" créée avec succès.`);
      setIsAddCategoryOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la création de la catégorie');
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <CategoryTreeSidebar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={(id) => {
          setSelectedCategory(id);
          setCurrentPage(1);
        }}
        products={products}
        loading={loadingCats}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onAddCategory={() => setIsAddCategoryOpen(true)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ProductFiltersBar
          searchQuery={searchQuery}
          onSearchChange={(v) => {
            setSearchQuery(v);
            setCurrentPage(1);
          }}
          statusFilter={statusFilter}
          onStatusChange={(v) => {
            setStatusFilter(v);
            setCurrentPage(1);
          }}
          stockFilter={stockFilter}
          onStockChange={(v) => {
            setStockFilter(v);
            setCurrentPage(1);
          }}
          totalFiltered={filteredProducts.length}
          totalAll={products.length}
          onAddProduct={() => setIsAddModalOpen(true)}
          selectedCount={selectedIds.size}
          onBulkDelete={handleBulkDelete}
          onBulkHide={handleBulkHide}
        />
        <ProductTable
          products={paginatedProducts}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          allSelected={
            selectedIds.size === paginatedProducts.length && paginatedProducts.length > 0
          }
          sortField={sortField}
          sortDir={sortDir}
          onSort={handleSort}
          onEdit={(p) => setEditingProduct(p)}
          onDelete={(p) => setDeleteTarget(p)}
          onToggleVisible={handleToggleVisible}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredProducts.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          loading={loading}
        />
      </div>
      <AddEditProductModal
        open={isAddModalOpen || editingProduct !== null}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        categories={categories}
        onSave={handleSaveProduct}
        onCategoryAdded={mutateCategories}
      />
      <DeleteConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        product={deleteTarget}
        onConfirm={handleDeleteConfirm}
      />
      <AddCategoryModal
        open={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onSave={handleSaveCategory}
        categories={categories}
      />
    </div>
  );
}
