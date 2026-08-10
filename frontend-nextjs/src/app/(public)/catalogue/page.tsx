'use client';
import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, Grid3X3, List, X, BookOpen, Laptop, Pencil, Package } from 'lucide-react';



const CATEGORIES = [
{ id: 'all', label: 'Tous les produits', icon: Package },
{ id: 'livres', label: 'Livres', icon: BookOpen },
{ id: 'informatique', label: 'Informatique', icon: Laptop },
{ id: 'fournitures', label: 'Fournitures scolaires', icon: Pencil },
{ id: 'bureautique', label: 'Bureautique', icon: Package }];


const PRICE_RANGES = [
  { id: 'all', label: 'Tous les prix' },
  { id: '0-500', label: 'Moins de 500 FCFA' },
  { id: '500-2000', label: '500 – 2 000 FCFA' },
  { id: '2000-5000', label: '2 000 – 5 000 FCFA' },
  { id: '5000+', label: 'Plus de 5 000 FCFA' },
];


interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  description: string;
  badge?: string;
}

const PRODUCTS: Product[] = [];


function priceInRange(price: number, rangeId: string): boolean {
  if (rangeId === 'all') return true;
  if (rangeId === '0-500') return price < 500;
  if (rangeId === '500-2000') return price >= 500 && price <= 2000;
  if (rangeId === '2000-5000') return price > 2000 && price <= 5000;
  if (rangeId === '5000+') return price > 5000;
  return true;
}

export default function CataloguePage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const filtered = useMemo(() => {
    return PRODUCTS.filter(p => {
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchPrice = priceInRange(p.price, selectedPriceRange);
      return matchSearch && matchCat && matchPrice;
    });
  }, [search, selectedCategory, selectedPriceRange]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BookOpen size={22} className="text-primary" />
            <span className="font-bold text-foreground text-base">LibrairieNumerique</span>
          </div>
          <div className="relative flex-1 max-w-md hidden sm:block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un produit..."
              className="input-field pl-9 text-sm w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-primary text-sm py-2 px-4">Connexion</Link>
          </div>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar filters — desktop */}
        <aside className="hidden lg:block w-56 shrink-0 space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Catégories</h3>
            <div className="space-y-1">
              {CATEGORIES.map(cat => {
                const CatIcon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedCategory === cat.id ? 'nav-item-active' : 'nav-item-inactive'
                    }`}
                  >
                    <CatIcon size={15} className="shrink-0" />
                    <span className="flex-1 text-left">{cat.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {cat.id === 'all' ? PRODUCTS.length : PRODUCTS.filter(p => p.category === cat.id).length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Prix</h3>
            <div className="space-y-1">
              {PRICE_RANGES.map(range => (
                <button
                  key={range.id}
                  onClick={() => setSelectedPriceRange(range.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    selectedPriceRange === range.id ? 'nav-item-active' : 'nav-item-inactive'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden btn-secondary flex items-center gap-1.5 text-sm py-2"
              >
                <SlidersHorizontal size={14} /> Filtres
              </button>
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{filtered.length}</span> produit{filtered.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'}`}
              >
                <Grid3X3 size={15} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'}`}
              >
                <List size={15} />
              </button>
            </div>
          </div>

          {/* Mobile search */}
          <div className="relative mb-4 sm:hidden">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="input-field pl-9 text-sm w-full"
            />
          </div>

          {/* Products */}
          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <Package size={40} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-semibold text-foreground">Aucun produit trouvé</p>
              <p className="text-xs text-muted-foreground mt-1">Essayez d'autres filtres</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(product => (
                <div key={product.id} className="card-base overflow-hidden hover:shadow-elevated transition-shadow group">
                  <div className="relative aspect-square bg-muted overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.badge && (
                      <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {product.badge}
                      </span>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="bg-white text-foreground text-xs font-bold px-3 py-1 rounded-full">Épuisé</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2 mb-1">{product.name}</p>
                    <p className="text-[10px] text-muted-foreground mb-2 line-clamp-1">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-primary tabular-nums">{product.price.toLocaleString('fr-FR')} FCFA</span>
                      {product.stock > 0 && product.stock <= 5 && (
                        <span className="text-[10px] text-warning font-semibold">Plus que {product.stock}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(product => (
                <div key={product.id} className="card-base p-4 flex items-center gap-4 hover:shadow-elevated transition-shadow">
                  <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden shrink-0">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{product.description}</p>
                      </div>
                      <span className="text-base font-bold text-primary tabular-nums shrink-0">{product.price.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {product.badge && (
                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">{product.badge}</span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {product.stock === 0 ? 'Épuisé' : `${product.stock} en stock`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter panel */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-card p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-foreground">Filtres</h3>
              <button onClick={() => setShowMobileFilters(false)}>
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Catégories</h4>
                <div className="space-y-1">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCategory(cat.id); setShowMobileFilters(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        selectedCategory === cat.id ? 'nav-item-active' : 'nav-item-inactive'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Prix</h4>
                <div className="space-y-1">
                  {PRICE_RANGES.map(range => (
                    <button
                      key={range.id}
                      onClick={() => { setSelectedPriceRange(range.id); setShowMobileFilters(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                        selectedPriceRange === range.id ? 'nav-item-active' : 'nav-item-inactive'
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
