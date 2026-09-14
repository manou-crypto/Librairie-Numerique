'use client';
import React, { useState } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { CategorieItem, produitsService } from '@/services/produits.service';
import { toast } from 'sonner';
import AddCategoryModal from './AddCategoryModal';

interface CategoriesTabProps {
  categories: CategorieItem[];
  onRefresh: () => void;
}

export default function CategoriesTab({ categories, onRefresh }: CategoriesTabProps) {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategorieItem | null>(null);

  const filteredCategories = categories.filter((c) =>
    c.nom.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (data: { nom: string; parentId: string | null }) => {
    if (editingCategory) {
      await produitsService.updateCategory(editingCategory.id, data);
      toast.success('Catégorie modifiée avec succès.');
    } else {
      await produitsService.createCategory(data);
      toast.success('Catégorie ajoutée avec succès.');
    }
    onRefresh();
    setShowAddModal(false);
    setEditingCategory(null);
  };

  const handleDelete = async (id: string, nom: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${nom}" ?`)) {
      try {
        await produitsService.deleteCategory(id);
        toast.success('Catégorie supprimée.');
        onRefresh();
      } catch (err: any) {
        toast.error(err.message || 'Erreur lors de la suppression.');
      }
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-background overflow-hidden p-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une catégorie..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <button
          onClick={() => {
            setEditingCategory(null);
            setShowAddModal(true);
          }}
          className="btn-primary"
        >
          <Plus size={16} /> Nouvelle Catégorie
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-surface border border-border rounded-lg shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-background/50">
              <th className="p-3 text-xs font-semibold text-muted-foreground uppercase">Nom</th>
              <th className="p-3 text-xs font-semibold text-muted-foreground uppercase">Parent</th>
              <th className="p-3 text-xs font-semibold text-muted-foreground uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length > 0 ? (
              filteredCategories.map((cat) => {
                const parent = categories.find(c => c.id === cat.parentId);
                return (
                  <tr key={cat.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="p-3 text-sm font-medium text-foreground">{cat.nom}</td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {parent ? parent.nom : <span className="italic text-muted-foreground/50">Aucun</span>}
                    </td>
                    <td className="p-3 text-sm text-right space-x-2">
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setShowAddModal(true);
                        }}
                        className="p-1 text-muted-foreground hover:text-brand transition-colors"
                        title="Modifier"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id, cat.nom)}
                        className="p-1 text-muted-foreground hover:text-negative transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={3} className="p-8 text-center text-muted-foreground">
                  Aucune catégorie trouvée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <AddCategoryModal
          open={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingCategory(null);
          }}
          onSave={handleSave}
          categories={categories.filter(c => c.id !== editingCategory?.id)} // Empêcher la boucle parent-enfant
          initialData={editingCategory}
        />
      )}
    </div>
  );
}
