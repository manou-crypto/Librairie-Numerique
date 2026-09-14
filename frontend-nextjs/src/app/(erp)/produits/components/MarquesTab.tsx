'use client';
import React, { useState } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';
import { MarqueItem, produitsService } from '@/services/produits.service';
import { toast } from 'sonner';
import Modal from '@/components/ui/Modal';
import useSWR from 'swr';
import { fetcher, SWR_DEFAULT_CONFIG } from '@/lib/swr-fetcher';

export default function MarquesTab() {
  const { data: marquesRaw, mutate: refreshMarques, isLoading } = useSWR<MarqueItem[]>('/v1/marques', fetcher, SWR_DEFAULT_CONFIG);
  const marques = marquesRaw || [];

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMarque, setEditingMarque] = useState<MarqueItem | null>(null);
  const [nom, setNom] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredMarques = marques.filter((m) =>
    m.nom.toLowerCase().includes(search.toLowerCase())
  );

  const openModal = (marque?: MarqueItem) => {
    if (marque) {
      setEditingMarque(marque);
      setNom(marque.nom);
    } else {
      setEditingMarque(null);
      setNom('');
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) {
      toast.error('Le nom de la marque est obligatoire.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingMarque) {
        await produitsService.updateMarque(editingMarque.id, { nom: nom.trim() });
        toast.success('Marque modifiée avec succès.');
      } else {
        await produitsService.createMarque({ nom: nom.trim() });
        toast.success('Marque ajoutée avec succès.');
      }
      refreshMarques();
      setShowModal(false);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, nom: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la marque "${nom}" ?`)) {
      try {
        await produitsService.deleteMarque(id);
        toast.success('Marque supprimée.');
        refreshMarques();
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
            placeholder="Rechercher une marque..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
          />
        </div>
        <button
          onClick={() => openModal()}
          className="btn-primary"
        >
          <Plus size={16} /> Nouvelle Marque
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-surface border border-border rounded-lg shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-background/50">
              <th className="p-3 text-xs font-semibold text-muted-foreground uppercase">Nom</th>
              <th className="p-3 text-xs font-semibold text-muted-foreground uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={2} className="p-8 text-center text-muted-foreground">
                  Chargement...
                </td>
              </tr>
            ) : filteredMarques.length > 0 ? (
              filteredMarques.map((marque) => (
                <tr key={marque.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="p-3 text-sm font-medium text-foreground">{marque.nom}</td>
                  <td className="p-3 text-sm text-right space-x-2">
                    <button
                      onClick={() => openModal(marque)}
                      className="p-1 text-muted-foreground hover:text-brand transition-colors"
                      title="Modifier"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(marque.id, marque.nom)}
                      className="p-1 text-muted-foreground hover:text-negative transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="p-8 text-center text-muted-foreground">
                  Aucune marque trouvée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingMarque ? "Modifier la marque" : "Ajouter une marque"} size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Nom de la marque <span className="text-negative">*</span>
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Hachette"
              className="input-field"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
              Annuler
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Enregistrement...' : editingMarque ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
