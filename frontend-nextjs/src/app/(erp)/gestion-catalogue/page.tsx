'use client';

import React, { useState, useEffect } from 'react';
import { produitsService, Produit, CategorieItem } from '@/services/produits.service';
import { Loader2, Plus, ImageIcon, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import CloudinaryUploadWidget from '@/components/cloudinary/CloudinaryUploadWidget';
import Image from 'next/image';

export default function CataloguePage() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<CategorieItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodsRes, catsRes] = await Promise.all([
        produitsService.getAll({ categoryId: selectedCategory || undefined }),
        produitsService.getCategories(),
      ]);
      setProduits(prodsRes.data);
      setCategories(catsRes);
    } catch (error) {
      toast.error('Erreur lors du chargement du catalogue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory]);

  const toggleVisibility = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'VISIBLE' ? 'MASQUE' : 'VISIBLE';
    try {
      // Optimistic update
      setProduits((prods) => prods.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));

      // En réalité, on devrait avoir une route PUT pour mettre à jour le statut,
      // ou utiliser la méthode update existante:
      await produitsService.update(id, { status: newStatus });
      toast.success(`Visibilité du produit mise à jour`);
    } catch (error) {
      // Revert on error
      setProduits((prods) =>
        prods.map((p) => (p.id === id ? { ...p, status: currentStatus as any } : p))
      );
      toast.error('Erreur lors de la mise à jour de la visibilité');
    }
  };

  const handleImageUpload = async (url: string) => {
    if (!selectedProductId) return;
    try {
      await produitsService.addImage(selectedProductId, url, true);
      toast.success('Image associée au produit avec succès');
      setSelectedProductId(null);
      fetchData(); // Reload to show new image
    } catch (error) {
      toast.error("Erreur lors de l'association de l'image");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion du Catalogue</h1>
          <p className="text-muted-foreground">
            Gérez vos produits, leurs visibilités et leurs images (Cloudinary).
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 border rounded-md hover:bg-gray-100 flex items-center gap-2"
        >
          <RefreshCcw className="w-4 h-4" /> Rafraîchir
        </button>
      </div>

      <div className="flex gap-4 items-center">
        <label className="font-medium text-sm">Filtrer par catégorie :</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Toutes les catégories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nom}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white border rounded-lg shadow-sm">
        <div className="p-0">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4">Image</th>
                    <th className="px-6 py-4">Produit</th>
                    <th className="px-6 py-4">Catégorie</th>
                    <th className="px-6 py-4">Prix</th>
                    <th className="px-6 py-4 text-center">Visibilité</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {produits.map((produit) => (
                    <tr key={produit.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        {produit.imageUrl ? (
                          <div className="relative w-12 h-12 rounded overflow-hidden border">
                            <Image
                              src={produit.imageUrl}
                              alt={produit.libelle}
                              layout="fill"
                              objectFit="cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center border text-gray-400">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {produit.libelle}
                        <div className="text-xs text-gray-500 font-normal">
                          Ref: {produit.reference}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{produit.categoryName}</td>
                      <td className="px-6 py-4 font-semibold">
                        {produit.prixVente}{' '}
                        {produit.unite !== 'Pièce' ? `/ ${produit.unite}` : 'FCFA'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center gap-2">
                          <input
                            type="checkbox"
                            checked={produit.status === 'VISIBLE'}
                            onChange={() => toggleVisibility(produit.id, produit.status)}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-full ${produit.status === 'VISIBLE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                          >
                            {produit.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {selectedProductId === produit.id ? (
                          <CloudinaryUploadWidget
                            folder={`librairie/produits/${produit.id}`}
                            onUploadSuccess={handleImageUpload}
                          />
                        ) : (
                          <button
                            onClick={() => setSelectedProductId(produit.id)}
                            className="text-primary hover:underline text-sm font-medium"
                          >
                            Ajouter Image
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {produits.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        Aucun produit trouvé dans cette catégorie.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
