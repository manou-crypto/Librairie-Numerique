import React, { useState, useEffect } from 'react';
import { unitesService, UniteItem } from '@/services/unites.service';
import { Trash2, Plus, Box, Edit2, X, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function UnitesManager() {
  const [unites, setUnites] = useState<UniteItem[]>([]);
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [multiple, setMultiple] = useState<number>(1);
  const [idUniteBase, setIdUniteBase] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNom, setEditNom] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editMultiple, setEditMultiple] = useState<number>(1);
  const [editIdUniteBase, setEditIdUniteBase] = useState<string>('');

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

  const resetForm = () => {
    setNom('');
    setDescription('');
    setMultiple(1);
    setIdUniteBase('');
  };

  const handleAdd = async () => {
    if (!nom.trim()) return;
    setLoading(true);
    try {
      await unitesService.createUnite({ 
        nom, 
        description, 
        multiple, 
        id_unite_base: idUniteBase ? Number(idUniteBase) : null 
      });
      toast.success('Unité ajoutée');
      resetForm();
      loadUnites();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'ajout');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette unité ? Attention, si elle est utilisée, cela peut causer des erreurs.')) return;
    try {
      await unitesService.deleteUnite(id);
      toast.success('Unité supprimée');
      loadUnites();
    } catch (err: any) {
      toast.error(err.message || 'Erreur de suppression');
    }
  };

  const startEditing = (u: UniteItem) => {
    setEditingId(u.id_unite);
    setEditNom(u.nom);
    setEditDescription(u.description || '');
    setEditMultiple(u.multiple);
    setEditIdUniteBase(u.id_unite_base ? String(u.id_unite_base) : '');
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleUpdate = async () => {
    if (!editingId || !editNom.trim()) return;
    setLoading(true);
    try {
      await unitesService.updateUnite(editingId, {
        nom: editNom,
        description: editDescription,
        multiple: editMultiple,
        id_unite_base: editIdUniteBase ? Number(editIdUniteBase) : null
      });
      toast.success('Unité mise à jour');
      cancelEditing();
      loadUnites();
    } catch (err: any) {
      toast.error(err.message || 'Erreur de mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const getUniteName = (id?: number | null) => {
    if (!id) return '-';
    return unites.find(u => u.id_unite === id)?.nom || id;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/50 backdrop-blur-sm border border-neutral-200/50 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-neutral-800 mb-4 flex items-center gap-2">
          <Box className="w-5 h-5 text-indigo-500" />
          Créer une unité
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-xs font-medium text-neutral-600">Nom (ex: Carton)</label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm outline-none"
              placeholder="Ex: Carton"
            />
          </div>
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-xs font-medium text-neutral-600">Unité de Base</label>
            <select
              value={idUniteBase}
              onChange={(e) => setIdUniteBase(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm outline-none"
            >
              <option value="">Aucune (Pièce)</option>
              {unites.map(u => (
                <option key={u.id_unite} value={u.id_unite}>{u.nom}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-xs font-medium text-neutral-600">Multiple</label>
            <input
              type="number"
              value={multiple}
              onChange={(e) => setMultiple(Number(e.target.value))}
              min={1}
              className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm outline-none"
            />
          </div>
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-xs font-medium text-neutral-600">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-neutral-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm outline-none"
              placeholder="Ex: Carton de 24"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!nom || loading}
            className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none md:col-span-1"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
      </div>

      <div className="bg-white/50 backdrop-blur-sm border border-neutral-200/50 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50/80 text-neutral-600 border-b border-neutral-200/50">
            <tr>
              <th className="px-6 py-4 font-semibold">Nom</th>
              <th className="px-6 py-4 font-semibold">Unité de Base</th>
              <th className="px-6 py-4 font-semibold">Multiple</th>
              <th className="px-6 py-4 font-semibold">Description</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {unites.map((u) => (
              <tr key={u.id_unite} className="hover:bg-neutral-50/50 transition-colors group">
                {editingId === u.id_unite ? (
                  <>
                    <td className="px-6 py-3">
                      <input 
                        type="text" 
                        value={editNom} 
                        onChange={e => setEditNom(e.target.value)} 
                        className="w-full h-8 px-2 border rounded-lg text-sm"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <select 
                        value={editIdUniteBase} 
                        onChange={e => setEditIdUniteBase(e.target.value)}
                        className="w-full h-8 px-2 border rounded-lg text-sm"
                      >
                        <option value="">Aucune</option>
                        {unites.filter(unit => unit.id_unite !== u.id_unite).map(unit => (
                          <option key={unit.id_unite} value={unit.id_unite}>{unit.nom}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-3">
                      <input 
                        type="number" 
                        min={1}
                        value={editMultiple} 
                        onChange={e => setEditMultiple(Number(e.target.value))} 
                        className="w-20 h-8 px-2 border rounded-lg text-sm"
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input 
                        type="text" 
                        value={editDescription} 
                        onChange={e => setEditDescription(e.target.value)} 
                        className="w-full h-8 px-2 border rounded-lg text-sm"
                      />
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={cancelEditing} className="p-1.5 text-neutral-400 hover:text-neutral-600 bg-white shadow-sm border rounded-lg transition-colors"><X className="w-4 h-4" /></button>
                        <button onClick={handleUpdate} disabled={loading} className="p-1.5 text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm rounded-lg transition-colors"><Save className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 font-medium text-neutral-800">{u.nom}</td>
                    <td className="px-6 py-4 text-neutral-600">
                      {u.id_unite_base ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium">
                          {getUniteName(u.id_unite_base)}
                        </span>
                      ) : (
                        <span className="text-neutral-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-neutral-700 font-mono bg-neutral-50/50 w-24">x {u.multiple}</td>
                    <td className="px-6 py-4 text-neutral-500">{u.description || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEditing(u)}
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id_unite)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {unites.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-neutral-400">
                    <Box className="w-12 h-12 mb-3 text-neutral-200" />
                    <p className="text-sm font-medium text-neutral-500">Aucune unité configurée</p>
                    <p className="text-xs mt-1">Créez des unités (Carton, Paquet) pour les utiliser dans vos ventes.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
