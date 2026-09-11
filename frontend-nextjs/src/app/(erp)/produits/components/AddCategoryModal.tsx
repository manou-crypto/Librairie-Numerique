'use client';
import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Loader2, AlertCircle } from 'lucide-react';
import { CategorieItem } from '@/services/produits.service';

interface AddCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { nom: string; parentId: string | null }) => Promise<void>;
  categories: CategorieItem[];
}

function buildCategoryLabel(cat: CategorieItem, allCats: CategorieItem[]): string {
  if (!cat.parentId) return cat.nom;
  const parent = allCats.find((c) => c.id === cat.parentId);
  if (!parent) return cat.nom;
  return `${parent.nom} > ${cat.nom}`;
}

export default function AddCategoryModal({
  open,
  onClose,
  onSave,
  categories,
}: AddCategoryModalProps) {
  const [nom, setNom] = useState('');
  const [parentId, setParentId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) {
      setError('Le nom de la catégorie est obligatoire.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onSave({
        nom: nom.trim(),
        parentId: parentId || null,
      });
      setNom('');
      setParentId('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Ajouter une nouvelle catégorie" size="sm">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label
              className="block text-xs font-semibold text-foreground mb-1.5"
              htmlFor="cat-name"
            >
              Nom de la catégorie <span className="text-negative">*</span>
            </label>
            <input
              id="cat-name"
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Romans policiers"
              className="input-field"
              autoFocus
            />
          </div>

          <div>
            <label
              className="block text-xs font-semibold text-foreground mb-1.5"
              htmlFor="cat-parent"
            >
              Catégorie parente (optionnel)
            </label>
            <select
              id="cat-parent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="input-field"
            >
              <option value="">-- Aucune (Catégorie principale) --</option>
              {categories.map((cat) => (
                <option key={`add-cat-${cat.id}`} value={cat.id}>
                  {buildCategoryLabel(cat, categories)}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="flex items-center gap-1 text-xs text-negative mt-1.5">
              <AlertCircle size={12} />
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Enregistrement...
                </>
              ) : (
                'Créer'
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
