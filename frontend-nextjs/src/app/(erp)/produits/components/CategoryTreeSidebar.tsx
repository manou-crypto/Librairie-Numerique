'use client';
import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, ChevronLeft, Package, Folder, FolderOpen, Tag, Plus, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import type { Product } from './ProductManagementClient';
import type { CategorieItem } from '@/services/produits.service';

export interface CategoryTreeNode {
  id: string;
  nom: string;
  slug: string;
  parentId: string | null;
  icon: string;
  children: CategoryTreeNode[];
}

function getCategoryIcon(slug: string, nom: string): string {
  const s = (slug + ' ' + nom).toLowerCase();
  if (s.includes('roman') || s.includes('litterature')) return '📖';
  if (s.includes('manuel') || s.includes('scolaire')) return '📝';
  if (s.includes('dictionnaire')) return '📗';
  if (s.includes('livre')) return '📚';
  if (s.includes('cahier') || s.includes('carnet')) return '📓';
  if (s.includes('stylo') || s.includes('crayon') || s.includes('ecriture')) return '🖊️';
  if (s.includes('colle') || s.includes('ciseau')) return '✂️';
  if (s.includes('fourniture')) return '✏️';
  if (s.includes('stockage') || s.includes('usb') || s.includes('disque')) return '💾';
  if (s.includes('peripherique') || s.includes('souris') || s.includes('clavier')) return '🖱️';
  if (s.includes('consommable') || s.includes('encre') || s.includes('papier')) return '🖨️';
  if (s.includes('informatique') || s.includes('tech')) return '💻';
  if (s.includes('classement') || s.includes('classeur') || s.includes('chemise')) return '📁';
  if (s.includes('bureautique')) return '🗂️';
  return '🏷️';
}

export function buildCategoryTree(categories: CategorieItem[]): CategoryTreeNode[] {
  const map = new Map<string, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  categories.forEach((cat) => {
    map.set(cat.id, {
      ...cat,
      icon: getCategoryIcon(cat.slug, cat.nom),
      children: [],
    });
  });

  categories.forEach((cat) => {
    const node = map.get(cat.id)!;
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export function getAllCategoryDescendantIds(node: CategoryTreeNode): string[] {
  let ids = [node.id];
  for (const child of node.children) {
    ids = ids.concat(getAllCategoryDescendantIds(child));
  }
  return ids;
}

interface CategoryTreeSidebarProps {
  categories: CategorieItem[];
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  products: Product[];
  loading?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onAddCategory?: () => void;
}

function countCategoryProducts(node: CategoryTreeNode, products: Product[]): number {
  const descendantIds = new Set(getAllCategoryDescendantIds(node));
  return products.filter((p) => {
    if (p.categoryIds && p.categoryIds.length > 0) {
      return p.categoryIds.some((id) => descendantIds.has(id));
    }
    return descendantIds.has(p.categoryId);
  }).length;
}

function CategoryNode({
  node,
  depth,
  selectedCategory,
  onSelectCategory,
  products,
}: {
  node: CategoryTreeNode;
  depth: number;
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
  products: Product[];
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedCategory === node.id;
  const count = countCategoryProducts(node, products);

  return (
    <div>
      <button
        onClick={() => {
          onSelectCategory(node.id);
        }}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150 group ${
          isSelected ? 'nav-item-active font-semibold shadow-sm' : 'nav-item-inactive hover:bg-muted/60'
        }`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        {hasChildren ? (
          <span
            className="text-muted-foreground hover:text-foreground w-4 shrink-0 p-0.5"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </span>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <span className="text-sm">{node.icon}</span>
        <span className="flex-1 text-left truncate text-xs">{node.nom}</span>
        {count > 0 && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
              isSelected ? 'bg-primary text-primary-foreground' : 'text-muted-foreground bg-muted'
            }`}
          >
            {count}
          </span>
        )}
      </button>
      {hasChildren && expanded && (
        <div className="space-y-0.5 mt-0.5">
          {node.children.map((child) => (
            <CategoryNode
              key={`cat-node-${child.id}`}
              node={child}
              depth={depth + 1}
              selectedCategory={selectedCategory}
              onSelectCategory={onSelectCategory}
              products={products}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoryTreeSidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  products,
  loading = false,
  isCollapsed = false,
  onToggleCollapse,
  onAddCategory,
}: CategoryTreeSidebarProps) {
  const tree = useMemo(() => buildCategoryTree(categories), [categories]);

  if (isCollapsed) {
    return (
      <aside className="w-14 shrink-0 bg-card border-r border-border flex flex-col items-center py-3 overflow-hidden transition-all duration-300">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mb-3"
          title="Déplier les catégories"
        >
          <PanelLeftOpen size={18} />
        </button>

        {onAddCategory && (
          <button
            onClick={onAddCategory}
            className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors mb-3"
            title="Ajouter une catégorie"
          >
            <Plus size={18} />
          </button>
        )}

        <div className="w-8 h-px bg-border mb-3" />

        <button
          onClick={() => onSelectCategory('all')}
          className={`p-2 rounded-lg transition-colors mb-2 relative group ${
            selectedCategory === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
          title="Tous les produits"
        >
          <Package size={18} />
        </button>

        <div className="flex-1 overflow-y-auto scrollbar-none space-y-2 w-full flex flex-col items-center">
          {tree.map((node) => {
            const isSelected = selectedCategory === node.id;
            return (
              <button
                key={`collapsed-node-${node.id}`}
                onClick={() => onSelectCategory(node.id)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm transition-all ${
                  isSelected ? 'bg-primary/20 border border-primary/40' : 'hover:bg-muted/80'
                }`}
                title={`${node.nom} (${countCategoryProducts(node, products)})`}
              >
                <span>{node.icon}</span>
              </button>
            );
          })}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-56 xl:w-60 2xl:w-64 shrink-0 bg-card border-r border-border flex flex-col overflow-hidden transition-all duration-300">
      <div className="px-4 py-3 border-b border-border shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Catégories</p>
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
            {categories.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onAddCategory && (
            <button
              onClick={onAddCategory}
              className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="Ajouter une catégorie"
            >
              <Plus size={15} />
            </button>
          )}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Replier les catégories"
            >
              <PanelLeftClose size={15} />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-0.5">
        <button
          onClick={() => onSelectCategory('all')}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150 mb-1 ${
            selectedCategory === 'all' ? 'nav-item-active font-semibold shadow-sm' : 'nav-item-inactive hover:bg-muted/60'
          }`}
        >
          <Package size={14} className="shrink-0 text-primary" />
          <span className="flex-1 text-left text-xs font-medium">Tous les produits</span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
              selectedCategory === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground bg-muted'
            }`}
          >
            {products.length}
          </span>
        </button>
        <div className="h-px bg-border my-2" />

        {loading ? (
          <div className="p-4 text-center text-xs text-muted-foreground">Chargement des catégories...</div>
        ) : tree.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">
            <Tag size={18} className="mx-auto mb-1 opacity-50" />
            Aucune catégorie définie
          </div>
        ) : (
          tree.map((node) => (
            <CategoryNode
              key={`root-cat-${node.id}`}
              node={node}
              depth={0}
              selectedCategory={selectedCategory}
              onSelectCategory={onSelectCategory}
              products={products}
            />
          ))
        )}
      </div>
    </aside>
  );
}

