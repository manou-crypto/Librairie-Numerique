'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import Link from 'next/link';
import { produitsService, Produit, CategorieItem } from '@/services/produits.service';
import { Loader2, ImageIcon, RefreshCcw, BookOpen, ArrowLeft, Search, Eye, Filter, Download } from 'lucide-react';
import { toast } from 'sonner';
import CloudinaryUploadWidget from '@/components/cloudinary/CloudinaryUploadWidget';
import { useAppConfig } from '@/contexts/ConfigContext';
import { exportToCSV } from '@/utils/export';

export default function GestionCataloguePage() {
  const { config } = useAppConfig();
  const devise = config?.devise || 'FCFA';

  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<CategorieItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodsRes, catsRes] = await Promise.all([
        produitsService.getAll({ categoryId: selectedCategory || undefined, pageSize: 1000 }),
        produitsService.getCategories(),
      ]);
      setProduits(prodsRes.data);
      setCategories(catsRes);
    } catch {
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
      setProduits((prods) => prods.map((p) => (p.id === id ? { ...p, status: newStatus } : p)));
      await produitsService.update(id, { status: newStatus });
      toast.success(`Visibilité du produit mise à jour : ${newStatus}`);
    } catch {
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
      fetchData();
    } catch {
      toast.error("Erreur lors de l'association de l'image");
    }
  };

  const filteredProduits = produits.filter((p) => {
    const matchSearch =
      p.libelle.toLowerCase().includes(search.toLowerCase()) ||
      (p.reference && p.reference.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  const handleExportCatalogue = () => {
    if (filteredProduits.length === 0) {
      toast.info('Aucun produit à exporter');
      return;
    }
    const headers = [
      'Référence',
      'Désignation',
      'Catégorie',
      `Prix Vente (${devise})`,
      'Statut Catalogue',
      'Image Présente',
    ];
    const data = filteredProduits.map((p) => {
      const cat = categories.find((c) => c.id === p.categorieId);
      return [
        p.reference || '—',
        p.libelle,
        cat?.nom || '—',
        p.prixVente,
        p.status === 'VISIBLE' ? 'En vitrine' : 'Masqué',
        p.imageUrl ? 'Oui' : 'Non',
      ];
    });
    exportToCSV({ filename: 'catalogue_vitrine', headers, data });
    toast.success('Catalogue vitrine exporté avec succès');
  };

  return (
    <AppLayout currentPath="/gestion-catalogue">
      <Topbar
        title="Gestion du Catalogue"
        subtitle="Contrôle de la visibilité en vitrine et médias Cloudinary"
      />
      <div className="px-6 py-6 max-w-screen-2xl mx-auto space-y-6">
        {/* Barre d'actions & Navigation fluide */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <Link
              href="/catalogue"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-all shadow-sm"
            >
              <Eye size={16} />
              <span>Consulter le Catalogue public</span>
            </Link>
            <Link
              href="/produits"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-all border border-border"
            >
              <BookOpen size={16} />
              <span>Table des Produits & Stocks</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCatalogue}
              disabled={loading}
              className="px-3 py-2 border border-border rounded-lg hover:bg-muted text-sm font-medium flex items-center gap-2 text-foreground transition-all"
              title="Exporter le catalogue vitrine en CSV"
            >
              <Download className="w-4 h-4" />
              <span>Exporter</span>
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-3 py-2 border border-border rounded-lg hover:bg-muted text-sm font-medium flex items-center gap-2 text-foreground transition-all"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
          </div>
        </div>

        {/* Filtres de recherche et de catégorie */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher par désignation ou référence..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={15} className="text-muted-foreground" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-60"
            >
              <option value="">Toutes les catégories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nom}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tableau des produits */}
        <div className="card-base overflow-hidden border border-border rounded-xl">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm">Chargement des articles...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 border-b border-border text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3.5">Image</th>
                    <th className="px-6 py-3.5">Produit</th>
                    <th className="px-6 py-3.5">Catégorie</th>
                    <th className="px-6 py-3.5">Prix Vente</th>
                    <th className="px-6 py-3.5 text-center">Visibilité Vitrine</th>
                    <th className="px-6 py-3.5 text-right">Média Cloudinary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredProduits.map((produit) => (
                    <tr key={produit.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        {produit.imageUrl ? (
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-border shadow-xs bg-white flex items-center justify-center">
                            <img
                              src={produit.imageUrl}
                              alt={produit.libelle}
                              className="w-full h-full object-contain p-0.5"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border border-border text-muted-foreground">
                            <ImageIcon className="w-5 h-5 opacity-40" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        <div className="font-semibold text-sm">{produit.libelle}</div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">
                          Ref: {produit.reference}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-sm">
                        {produit.categoryName || 'Non classé'}
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground tabular-nums">
                        {Number(produit.prixVente).toLocaleString('fr-FR')} {devise}
                        {produit.unite && produit.unite !== 'Pièce' && (
                          <span className="text-xs text-muted-foreground font-normal ml-1">/ {produit.unite}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center items-center gap-2">
                          <input
                            type="checkbox"
                            checked={produit.status === 'VISIBLE'}
                            onChange={() => toggleVisibility(produit.id, produit.status)}
                            className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                          />
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              produit.status === 'VISIBLE'
                                ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                            }`}
                          >
                            {produit.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {selectedProductId === produit.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <CloudinaryUploadWidget
                              folder={`librairie/produits/${produit.id}`}
                              onUploadSuccess={handleImageUpload}
                              buttonText="Téléverser"
                            />
                            <button
                              type="button"
                              onClick={() => setSelectedProductId(null)}
                              className="text-xs text-muted-foreground hover:text-foreground"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedProductId(produit.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-all"
                          >
                            <ImageIcon size={13} />
                            <span>{produit.imageUrl ? 'Changer Image' : 'Ajouter Image'}</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredProduits.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        Aucun produit ne correspond aux critères de recherche.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
