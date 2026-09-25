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
import ProductDetailModal from './ProductDetailModal';
import TarificationProductModal from './TarificationProductModal';
import AddCategoryModal from './AddCategoryModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import RechargeStockModal from './RechargeStockModal';
import CategoriesTab from './CategoriesTab';
import MarquesTab from './MarquesTab';
import UnitesTab from './UnitesTab';
import TarificationTab from './TarificationTab';
import ConditionnementsTab from './ConditionnementsTab';
import { produitsService, CategorieItem, MarqueItem } from '@/services/produits.service';
import useSWR from 'swr';
import { fetcher, SWR_DEFAULT_CONFIG } from '@/lib/swr-fetcher';
import { useAuth } from '@/hooks/useAuth';
import { exportToCSV } from '@/utils/export';
import { hasPermission, PERMISSIONS } from '@/utils/permissions';

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
  const { user } = useAuth();
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

  const [activeTab, setActiveTab] = useState<
    'produits' | 'categories' | 'marques' | 'unites' | 'tarifs' | 'conditionnements'
  >('produits');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [tarificationTarget, setTarificationTarget] = useState<Product | null>(null);
  const [rechargeStockTarget, setRechargeStockTarget] = useState<Product | null>(null);
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

  const handleExportProducts = () => {
    if (filteredProducts.length === 0) {
      toast.info('Aucun produit à exporter');
      return;
    }
    const headers = [
      'Référence',
      'Nom / Libellé',
      'Catégorie',
      'Marque',
      'Prix Achat (HT)',
      'Prix Vente (TTC)',
      'Marge (%)',
      'Stock Total',
      'Seuil Alerte',
      'Statut',
      'Description',
    ];
    const data = filteredProducts.map((p) => {
      const marge =
        p.prixVente > 0 ? (((p.prixVente - p.prixAchat) / p.prixVente) * 100).toFixed(1) : '0.0';
      return [
        p.reference,
        p.name,
        p.categoryName || '—',
        p.marque || '—',
        p.prixAchat.toFixed(2),
        p.prixVente.toFixed(2),
        `${marge}%`,
        p.stock,
        p.seuilAlerte,
        p.status === 'actif' ? 'Actif' : p.status === 'masque' ? 'Masqué' : 'Brouillon',
        p.description || '',
      ];
    });
    exportToCSV({ filename: 'catalogue_produits', headers, data });
    toast.success('Catalogue des produits exporté avec succès');
  };

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  
  const handleRechargeStockSave = async (mode: 'ajouter' | 'redefinir', quantite: number) => {
    if (!rechargeStockTarget) return;
    try {
      // Pour l'instant on utilise le token existant dans les cookies (envoyé automatiquement par fetcher)
      await fetcher('/v1/stock/mouvements', {
        method: 'POST',
        body: JSON.stringify({
          produitId: rechargeStockTarget.id,
          typeMouvement: mode === 'ajouter' ? 'ENTREE_ACHAT' : 'AJUSTEMENT_INVENTAIRE',
          quantite,
        })
      });
      toast.success('Stock mis à jour avec succès');
      loadData(); // Rafraîchir les produits
    } catch (error: any) {
      toast.error('Erreur: ' + error.message);
      throw error;
    }
  };

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

  const canVoirCategories = hasPermission(user, PERMISSIONS.VIEW_CATEGORIES);
  const canVoirMarques = hasPermission(user, PERMISSIONS.VIEW_MARQUES);
  const canVoirUnites = hasPermission(user, PERMISSIONS.VIEW_UNITES);
  const canVoirTarification = hasPermission(user, PERMISSIONS.VIEW_TARIFICATION);
  const canVoirConditionnements = hasPermission(user, PERMISSIONS.VIEW_CONDITIONNEMENTS);

  return (
    <div className="flex flex-col w-full h-full bg-background relative">
      <div className="flex border-b border-border px-4 pt-2">
        <button
          onClick={() => setActiveTab('produits')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === 'produits'
              ? 'border-brand text-brand'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Produits
        </button>
        {canVoirCategories && (
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'categories'
                ? 'border-brand text-brand'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Catégories
          </button>
        )}
        {canVoirMarques && (
          <button
            onClick={() => setActiveTab('marques')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'marques'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            Marques
          </button>
        )}
        {canVoirUnites && (
          <button
            onClick={() => setActiveTab('unites')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'unites'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            Unités
          </button>
        )}
        {canVoirConditionnements && (
          <button
            onClick={() => setActiveTab('conditionnements')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'conditionnements'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            Conditionnements
          </button>
        )}
        {canVoirTarification && (
          <button
            onClick={() => setActiveTab('tarifs')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'tarifs'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            Tarification
          </button>
        )}
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {activeTab === 'produits' && (
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
                onExport={handleExportProducts}
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
                onViewDetails={(p) => setViewingProduct(p)}
                onEdit={(p) => setEditingProduct(p)}
                onDelete={(p) => setDeleteTarget(p)}
                onTarification={(p) => setTarificationTarget(p)}
                onRechargeStock={setRechargeStockTarget}
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
          </div>
        )}

        {activeTab === 'categories' && canVoirCategories && <CategoriesTab categories={categories} onRefresh={loadData} />}
        {activeTab === 'marques' && canVoirMarques && <MarquesTab />}
        {activeTab === 'unites' && canVoirUnites && <UnitesTab />}
        {activeTab === 'conditionnements' && canVoirConditionnements && <ConditionnementsTab products={products} onUpdate={loadData} />}
        {activeTab === 'tarifs' && canVoirTarification && <TarificationTab products={products} onUpdate={loadData} />}
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
      {viewingProduct && (
        <ProductDetailModal
          product={viewingProduct}
          onClose={() => setViewingProduct(null)}
        />
      )}
      {tarificationTarget && (
        <TarificationProductModal
          open={!!tarificationTarget}
          onClose={() => setTarificationTarget(null)}
          product={tarificationTarget}
          onSave={(p) => {
            mutateProducts();
          }}
        />
      )}
      <DeleteConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        product={deleteTarget}
        onConfirm={handleDeleteConfirm}
      />
      <RechargeStockModal
        open={!!rechargeStockTarget}
        onClose={() => setRechargeStockTarget(null)}
        product={rechargeStockTarget}
        onSave={handleRechargeStockSave}
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
