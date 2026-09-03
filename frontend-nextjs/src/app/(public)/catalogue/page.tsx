'use client';
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  X,
  BookOpen,
  Package,
  Loader2,
  LogIn,
  LayoutDashboard,
  ArrowUpDown,
  Eye,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { produitsService, Produit, CategorieItem } from '@/services/produits.service';
import { useAppConfig } from '@/contexts/ConfigContext';
import PublicFooter from '@/components/public/PublicFooter';

const PRICE_RANGES = [
  { id: 'all', label: 'Tous les prix' },
  { id: '0-1000', label: 'Moins de 1 000 FCFA' },
  { id: '1000-5000', label: '1 000 – 5 000 FCFA' },
  { id: '5000-10000', label: '5 000 – 10 000 FCFA' },
  { id: '10000+', label: 'Plus de 10 000 FCFA' },
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Nouveautés' },
  { id: 'price_asc', label: 'Prix : croissant' },
  { id: 'price_desc', label: 'Prix : décroissant' },
  { id: 'name_asc', label: 'Titre : de A à Z' },
];

function priceInRange(price: number, rangeId: string): boolean {
  if (rangeId === 'all') return true;
  if (rangeId === '0-1000') return price < 1000;
  if (rangeId === '1000-5000') return price >= 1000 && price <= 5000;
  if (rangeId === '5000-10000') return price > 5000 && price <= 10000;
  if (rangeId === '10000+') return price > 10000;
  return true;
}

function CatalogueContent() {
  const { user } = useAuth();
  const { config } = useAppConfig();
  const devise = config?.devise || 'FCFA';
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<CategorieItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres et affichage — initialisés depuis les query params si présents
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get('category') || 'all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  // Quick View Modal
  const [quickViewProduct, setQuickViewProduct] = useState<Produit | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          produitsService.getAll({ pageSize: 1000 }).catch(() => ({ data: [] })),
          produitsService.getCategories().catch(() => []),
        ]);
        setProducts(prodRes.data || []);
        setCategories(catRes || []);
      } catch (e) {
        console.error('Erreur chargement catalogue:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedPriceRange !== 'all') count++;
    if (inStockOnly) count++;
    if (search.trim()) count++;
    return count;
  }, [selectedCategory, selectedPriceRange, inStockOnly, search]);

  const filteredAndSorted = useMemo(() => {
    const list = products.filter(p => {
      if (p.status === 'MASQUE') return false;

      const matchSearch = !search ||
        p.libelle.toLowerCase().includes(search.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.reference || '').toLowerCase().includes(search.toLowerCase());

      const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory || p.categoryName === selectedCategory;
      const matchPrice = priceInRange(p.prixVente, selectedPriceRange);
      const matchStock = !inStockOnly || p.stock > 0;

      return matchSearch && matchCat && matchPrice && matchStock;
    });

    return list.sort((a, b) => {
      if (sortBy === 'price_asc') return a.prixVente - b.prixVente;
      if (sortBy === 'price_desc') return b.prixVente - a.prixVente;
      if (sortBy === 'name_asc') return a.libelle.localeCompare(b.libelle);
      // Nouveautés par défaut
      return b.id.localeCompare(a.id);
    });
  }, [products, search, selectedCategory, selectedPriceRange, inStockOnly, sortBy]);

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedPriceRange('all');
    setInStockOnly(false);
    setSearch('');
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* ── HEADER BELLROY-STYLE ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#FAFAF8]/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-4">
            
            {/* Brand / Logo */}
            <Link href="/catalogue" className="flex items-center gap-3 group focus:outline-none">
              <div className="w-9 h-9 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
                <BookOpen size={18} strokeWidth={2.2} />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900 dark:text-white text-base tracking-tight leading-none group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                  {config?.nom_librairie || 'Librairie Numérique'}
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tracking-wider uppercase mt-0.5">
                  Catalogue & Éditions
                </span>
              </div>
            </Link>

            {/* Search Bar - Center */}
            <div className="relative flex-1 max-w-md hidden md:block">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un titre, un auteur, une référence..."
                className="w-full pl-9 pr-8 py-2 bg-slate-100/80 dark:bg-slate-900 border border-transparent focus:border-slate-300 dark:focus:border-slate-700 rounded-full text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 transition-all shadow-2xs"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Navigation / User Area */}
            <div className="flex items-center gap-3">
              {user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition-all"
                >
                  <LayoutDashboard size={14} />
                  <span className="hidden sm:inline">Gestion</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 shadow-xs hover:shadow-sm transition-all"
                >
                  <LogIn size={14} />
                  <span>Connexion Pro</span>
                </Link>
              )}
            </div>
          </div>

          {/* Search bar on mobile */}
          <div className="pb-3 md:hidden">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un livre, un auteur..."
                className="w-full pl-9 pr-8 py-2 bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-slate-300 dark:focus:border-slate-700 rounded-full text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:bg-white transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-0.5"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── EDITORIAL SUB-HERO BANNER ────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-[#FAFAF8] to-white dark:from-slate-950 dark:to-slate-900/60 border-b border-slate-200/60 dark:border-slate-800/60 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-3">
              <Sparkles size={12} className="text-amber-500" />
              <span>Sélection & Ouvrages</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white leading-tight">
              Explorer le catalogue
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
              Consultez notre collection d'ouvrages, manuels et éditions disponibles en librairie.
            </p>
          </div>
        </div>
      </section>

      {/* ── HORIZONTAL CATEGORY PILLS (BELLROY SIGNATURE) ────────────────── */}
      <div className="sticky top-16 z-20 bg-[#FAFAF8]/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/70 py-2.5 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            
            {/* Scrollable category chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 pr-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                }`}
              >
                Tous les ouvrages ({products.length})
              </button>

              {categories.map(cat => {
                const count = products.filter(p => p.categoryId === cat.id || p.categoryName === cat.nom).length;
                const isSelected = selectedCategory === cat.id || selectedCategory === cat.nom;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(isSelected ? 'all' : cat.id)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                    }`}
                  >
                    {cat.nom} <span className="opacity-60 text-[10px] ml-0.5">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Quick filter trigger button */}
            <div className="shrink-0 flex items-center gap-2">
              <button
                onClick={() => setShowFiltersDrawer(true)}
                className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  activeFiltersCount > 0
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Filter size={13} />
                <span>Filtres</span>
                {activeFiltersCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR (COUNT, SORT, VIEW TOGGLE) ───────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-3 w-full">
        <div className="flex items-center justify-between gap-4 flex-wrap text-xs text-slate-500 dark:text-slate-400">
          
          {/* Results count & Active filters pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {filteredAndSorted.length} résultat{filteredAndSorted.length !== 1 ? 's' : ''}
            </span>
            {selectedPriceRange !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300">
                Prix: {PRICE_RANGES.find(r => r.id === selectedPriceRange)?.label}
                <button onClick={() => setSelectedPriceRange('all')} className="hover:text-slate-950 dark:hover:text-white">
                  <X size={11} />
                </button>
              </span>
            )}
            {inStockOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px]">
                En stock seulement
                <button onClick={() => setInStockOnly(false)} className="hover:text-emerald-950 dark:hover:text-white">
                  <X size={11} />
                </button>
              </span>
            )}
            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline underline-offset-2 ml-1"
              >
                Tout effacer
              </button>
            )}
          </div>

          {/* Sort selector & Grid/List switcher */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <ArrowUpDown size={13} className="text-slate-400" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id} className="bg-white dark:bg-slate-900">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />

            <div className="flex items-center bg-slate-200/60 dark:bg-slate-800/60 p-0.5 rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Vue en grille"
              >
                <Grid3X3 size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded transition-all ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Vue en liste"
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN PRODUCT GRID / LIST ─────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center text-center">
            <Loader2 className="animate-spin text-slate-400 dark:text-slate-500 mb-3" size={32} />
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Chargement des ouvrages...</p>
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="py-24 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Package size={22} />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Aucun ouvrage trouvé</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Essayez d'ajuster vos critères de recherche ou réinitialisez les filtres.
            </p>
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-medium hover:bg-slate-800 transition-all shadow-xs"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* ── GRID VIEW (BELLROY TACTILE MINIMALISM) ── */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
            {filteredAndSorted.map(product => {
              const inStock = product.stock > 0;
              return (
                <div
                  key={product.id}
                  className="group flex flex-col cursor-pointer"
                  onClick={() => setQuickViewProduct(product)}
                >
                  {/* Image Container with Warm Neutral Backdrop */}
                  <div className="relative aspect-[3/4] w-full rounded-xl bg-[#F2F2EE] dark:bg-slate-900 overflow-hidden flex items-center justify-center transition-all duration-300 group-hover:shadow-md">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.libelle}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 text-center text-slate-400 dark:text-slate-600">
                        <BookOpen size={36} strokeWidth={1.3} className="mb-2 opacity-50 transition-transform duration-300 group-hover:scale-110" />
                        <span className="text-[10px] uppercase font-mono tracking-wider opacity-70">
                          {product.categoryName || 'Édition'}
                        </span>
                      </div>
                    )}

                    {/* Subtle stock badge (top left) */}
                    {!inStock && (
                      <div className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md shadow-xs">
                        Épuisé
                      </div>
                    )}

                    {/* Quick View Hover Pill (center-bottom) */}
                    <div className="absolute inset-x-0 bottom-3 flex justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none px-3">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white text-[11px] font-medium shadow-md backdrop-blur-xs">
                        <Eye size={12} />
                        <span>Aperçu rapide</span>
                      </span>
                    </div>
                  </div>

                  {/* Metadata below image */}
                  <div className="mt-3 flex flex-col space-y-1">
                    <span className="text-[10px] font-medium tracking-wider text-slate-400 dark:text-slate-500 uppercase truncate">
                      {product.categoryName || 'Livre'}
                    </span>
                    
                    <h3 className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                      {product.libelle}
                    </h3>

                    <div className="pt-1 flex items-baseline justify-between gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                        {product.prixVente.toLocaleString('fr-FR')}{' '}
                        <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">{devise}</span>
                      </span>

                      {/* Discrete stock dot */}
                      <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            inStock ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <span className="hidden sm:inline">{inStock ? 'En stock' : 'Rupture'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── LIST VIEW (REFINED ROWS) ── */
          <div className="space-y-2.5">
            {filteredAndSorted.map(product => {
              const inStock = product.stock > 0;
              return (
                <div
                  key={product.id}
                  onClick={() => setQuickViewProduct(product)}
                  className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3 sm:p-4 flex items-center gap-4 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition-all cursor-pointer"
                >
                  <div className="w-14 h-18 sm:w-16 sm:h-22 rounded-lg bg-[#F2F2EE] dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.libelle} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <BookOpen size={20} className="text-slate-400 opacity-60" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="min-w-0">
                        <span className="text-[10px] font-medium tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                          {product.categoryName}
                        </span>
                        <h3 className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-slate-600 dark:group-hover:text-slate-300">
                          {product.libelle}
                        </h3>
                        {product.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 font-normal">
                            {product.description}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white tabular-nums block">
                          {product.prixVente.toLocaleString('fr-FR')} {devise}
                        </span>
                        <div className="flex items-center justify-end gap-1.5 mt-1 text-[11px] text-slate-500">
                          <span className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span>{inStock ? `${product.stock} dispo` : 'Épuisé'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform hidden sm:block shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── FILTER DRAWER (SLIDE-OVER) ───────────────────────────────────── */}
      {showFiltersDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setShowFiltersDrawer(false)}
          />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-sm bg-white dark:bg-slate-900 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
              
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={16} className="text-slate-900 dark:text-white" />
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Filtres du catalogue</h2>
                  </div>
                  <button
                    onClick={() => setShowFiltersDrawer(false)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Filter : Categories */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                    Catégories
                  </h3>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        selectedCategory === 'all'
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      Tous les articles ({products.length})
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          selectedCategory === cat.id
                            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {cat.nom}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter : Price Range */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                    Tranches de prix
                  </h3>
                  <div className="space-y-1">
                    {PRICE_RANGES.map(range => (
                      <button
                        key={range.id}
                        onClick={() => setSelectedPriceRange(range.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          selectedPriceRange === range.id
                            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter : Availability */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <label className="flex items-center gap-3 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={e => setInStockOnly(e.target.checked)}
                      className="w-4 h-4 rounded text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700 focus:ring-0"
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Afficher uniquement les ouvrages en stock
                    </span>
                  </label>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button
                  onClick={() => setShowFiltersDrawer(false)}
                  className="w-full py-2.5 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 transition-all shadow-xs"
                >
                  Afficher les {filteredAndSorted.length} ouvrages
                </button>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="w-full py-2 text-center text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  >
                    Réinitialiser tous les filtres
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── QUICK VIEW MODAL (BELLROY-STYLE POPUP) ───────────────────────── */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setQuickViewProduct(null)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
              
              {/* Close button */}
              <button
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X size={16} />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2">
                {/* Visual side */}
                <div className="bg-[#F2F2EE] dark:bg-slate-950 p-8 flex items-center justify-center min-h-[260px]">
                  {quickViewProduct.imageUrl ? (
                    <img
                      src={quickViewProduct.imageUrl}
                      alt={quickViewProduct.libelle}
                      className="max-h-72 object-contain rounded-md shadow-md"
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <BookOpen size={64} strokeWidth={1.2} className="mx-auto mb-2 opacity-50" />
                      <span className="text-xs uppercase font-mono tracking-widest">
                        {quickViewProduct.categoryName || 'Ouvrage'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Details side */}
                <div className="p-6 sm:p-8 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                      {quickViewProduct.categoryName}
                    </span>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mt-1 leading-snug">
                      {quickViewProduct.libelle}
                    </h2>
                    
                    <div className="mt-3 text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                      {quickViewProduct.prixVente.toLocaleString('fr-FR')}{' '}
                      <span className="text-xs font-normal text-slate-500">{devise}</span>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      {quickViewProduct.stock > 0 ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                          <CheckCircle2 size={13} />
                          <span>{quickViewProduct.stock} exemplaire{quickViewProduct.stock > 1 ? 's' : ''} disponible{quickViewProduct.stock > 1 ? 's' : ''}</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-medium">
                          <AlertCircle size={13} />
                          <span>Actuellement en rupture</span>
                        </div>
                      )}
                    </div>

                    {quickViewProduct.description && (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white mb-1">Description</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-h-36 overflow-y-auto">
                          {quickViewProduct.description}
                        </p>
                      </div>
                    )}

                    {quickViewProduct.reference && (
                      <p className="mt-3 text-[11px] text-slate-400 font-mono">
                        Réf : {quickViewProduct.reference}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setQuickViewProduct(null)}
                    className="w-full py-2.5 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-medium hover:bg-slate-800 transition-all shadow-xs"
                  >
                    Fermer la vue
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── GRAND FOOTER NOIR LUXE BELLROY & NEWSLETTER ────────────────── */}
      <PublicFooter />

    </div>
  );
}

export default function CataloguePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>}>
      <CatalogueContent />
    </Suspense>
  );
}
