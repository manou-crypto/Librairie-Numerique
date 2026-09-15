import React, { useState, useEffect } from 'react';
import { unitesService, UniteItem } from '@/services/unites.service';
import { Trash2, Plus, Box } from 'lucide-react';
import { toast } from 'sonner';

export default function UnitesManager() {
  const [unites, setUnites] = useState<UniteItem[]>([]);
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [multiple, setMultiple] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUnites();
  }, []);

  const loadUnites = async () => {
    try {
      const data = await unitesService.getUnites();
      setUnites(data);
    } catch (err) {
      toast.error('Erreur lors du chargement des unités');
    }
  };

  const handleAdd = async () => {
    if (!nom.trim()) return;
    setLoading(true);
    try {
      await unitesService.createUnite({ nom, description, multiple });
      toast.success('Unité ajoutée');
      setNom('');
      setDescription('');
      setMultiple(1);
      loadUnites();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'ajout');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette unité ?')) return;
    try {
      await unitesService.deleteUnite(id);
      toast.success('Unité supprimée');
      loadUnites();
    } catch (err: any) {
      toast.error(err.message || 'Erreur de suppression');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/50 backdrop-blur-sm border border-neutral-200/50 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-neutral-800 mb-4 flex items-center gap-2">
          <Box className="w-4 h-4 text-primary-500" />
          Ajouter une unité
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-xs font-medium text-neutral-600">Nom (ex: Carton)</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all text-sm outline-none"
              placeholder="Ex: Carton"
            />
          </div>
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-xs font-medium text-neutral-600">Multiple (ex: 24)</label>
            <input
              type="number"
              value={multiple}
              onChange={(e) => setMultiple(Number(e.target.value))}
              min={1}
              className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all text-sm outline-none"
            />
          </div>
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-xs font-medium text-neutral-600">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all text-sm outline-none"
              placeholder="Ex: Carton de 24 pièces"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!nom || loading}
            className="h-10 px-4 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
      </div>

      <div className="bg-white/50 backdrop-blur-sm border border-neutral-200/50 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50/50 text-neutral-500 border-b border-neutral-200/50">
            <tr>
              <th className="px-6 py-4 font-medium">Nom</th>
              <th className="px-6 py-4 font-medium">Multiple</th>
              <th className="px-6 py-4 font-medium">Description</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200/50">
            {unites.map((u) => (
              <tr key={u.id_unite} className="hover:bg-neutral-50/50 transition-colors">
                <td className="px-6 py-4 font-medium text-neutral-800">{u.nom}</td>
                <td className="px-6 py-4">x{u.multiple}</td>
                <td className="px-6 py-4 text-neutral-500">{u.description || '-'}</td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDelete(u.id_unite)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {unites.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">
                  Aucune unité configurée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
