'use client';
import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Package } from 'lucide-react';
import type { Product } from './ProductManagementClient';

interface Category { id: string; label: string; icon: string; children?: Category[]; }

const categoryTree: Category[] = [
  { id: 'cat-livres', label: 'Livres', icon: '📚', children: [{ id: 'cat-romans', label: 'Romans & Littérature', icon: '📖' }, { id: 'cat-scolaires', label: 'Manuels scolaires', icon: '📝' }, { id: 'cat-dictionnaires', label: 'Dictionnaires', icon: '📗' }] },
  { id: 'cat-fournitures', label: 'Fournitures scolaires', icon: '✏️', children: [{ id: 'cat-cahiers', label: 'Cahiers & Carnets', icon: '📓' }, { id: 'cat-stylos', label: 'Stylos & Crayons', icon: '🖊️' }, { id: 'cat-colle', label: 'Colle & Ciseaux', icon: '✂️' }] },
  { id: 'cat-informatique', label: 'Informatique', icon: '💻', children: [{ id: 'cat-peripheriques', label: 'Périphériques', icon: '🖱️' }, { id: 'cat-consommables', label: 'Consommables', icon: '🖨️' }, { id: 'cat-stockage', label: 'Stockage', icon: '💾' }] },
  { id: 'cat-bureautique', label: 'Bureautique', icon: '🗂️', children: [{ id: 'cat-classement', label: 'Classement', icon: '📁' }, { id: 'cat-papier', label: 'Papier & Impression', icon: '📄' }] },
];

interface CategoryTreeSidebarProps { selectedCategory: string; onSelectCategory: (id: string) => void; products: Product[]; }

function countByCategory(products: Product[], catId: string): number { return products.filter((p) => p.categoryId === catId).length; }

function CategoryNode({ category, depth, selectedCategory, onSelectCategory, products }: { category: Category; depth: number; selectedCategory: string; onSelectCategory: (id: string) => void; products: Product[]; }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = selectedCategory === category.id;
  const count = countByCategory(products, category.id);
  return (
    <div>
      <button onClick={() => { onSelectCategory(category.id); if (hasChildren) setExpanded(!expanded); }} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${isSelected ? 'nav-item-active' : 'nav-item-inactive'}`} style={{ paddingLeft: `${12 + depth * 14}px` }}>
        {hasChildren ? (<span className="text-muted-foreground w-4 shrink-0" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}>{expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</span>) : (<span className="w-4 shrink-0" />)}
        <span className="text-sm">{category.icon}</span>
        <span className="flex-1 text-left truncate text-xs font-medium">{category.label}</span>
        {count > 0 && <span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md shrink-0">{count}</span>}
      </button>
      {hasChildren && expanded && (<div>{category.children!.map((child) => (<CategoryNode key={child.id} category={child} depth={depth + 1} selectedCategory={selectedCategory} onSelectCategory={onSelectCategory} products={products} />))}</div>)}
    </div>
  );
}

export default function CategoryTreeSidebar({ selectedCategory, onSelectCategory, products }: CategoryTreeSidebarProps) {
  return (
    <aside className="w-56 xl:w-60 2xl:w-64 shrink-0 bg-card border-r border-border flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-border shrink-0"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Catégories</p></div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        <button onClick={() => onSelectCategory('all')} className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150 mb-1 ${selectedCategory === 'all' ? 'nav-item-active' : 'nav-item-inactive'}`}>
          <Package size={14} className="shrink-0" /><span className="flex-1 text-left text-xs font-medium">Tous les produits</span><span className="text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">{products.length}</span>
        </button>
        <div className="h-px bg-border my-2" />
        {categoryTree.map((cat) => (<CategoryNode key={cat.id} category={cat} depth={0} selectedCategory={selectedCategory} onSelectCategory={onSelectCategory} products={products} />))}
      </div>
    </aside>
  );
}
