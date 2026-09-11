'use client';
import React, { useState, useMemo } from 'react';
import Modal from '@/components/ui/Modal';
import { Search, Plus, Minus, Trash2, Sparkles, AlertCircle, BookmarkPlus, Check, Package } from 'lucide-react';
import { toast } from 'sonner';
import { ventesService } from '@/services/ventes.service';

export interface KitProductItem {
  id: string;
  name: string;
  category: string;
  prixVente: number;
  prixAchat: number;
  stock: number;
  reference: string;
  tva: number;
}

export interface KitCompositionItem {
  product: KitProductItem;
  qty: number;
}

interface KitComposerModalProps {
  open: boolean;
  onClose: () => void;
  availableProducts: KitProductItem[];
  devise?: string;
  onAddKitToCart: (kit: {
    nomKit: string;
    prixForfaitaire: number;
    items: KitCompositionItem[];
  }) => void;
  onKitSaved?: () => void;
}

export default function KitComposerModal({
  open,
  onClose,
  availableProducts,
  devise = 'FCFA',
  onAddKitToCart,
  onKitSaved,
}: KitComposerModalProps) {
  const [nomKit, setNomKit] = useState('');
  const [description, setDescription] = useState('');
  const [search, setSearch] = useState('');
  const [selectedItems, setSelectedItems] = useState<KitCompositionItem[]>([]);
  const [prixForfaitaire, setPrixForfaitaire] = useState<string>('');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // Filtrer les produits pour la sélection
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return availableProducts.slice(0, 30);
    const q = search.toLowerCase();
    return availableProducts
      .filter((p) => p.name.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q))
      .slice(0, 30);
  }, [availableProducts, search]);

  // Calcul du total catalogue standard
  const totalCatalogueStandard = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + item.product.prixVente * item.qty, 0);
  }, [selectedItems]);

  // Coût d'achat total pour la marge
  const totalCoutAchat = useMemo(() => {
    return selectedItems.reduce((acc, item) => acc + (item.product.prixAchat || 0) * item.qty, 0);
  }, [selectedItems]);

  // Mettre à jour le prix forfaitaire par défaut quand les articles changent si vide
  const handleAddItem = (product: KitProductItem) => {
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { product, qty: 1 }];
    });

    if (!prixForfaitaire) {
      setPrixForfaitaire(String(totalCatalogueStandard + product.prixVente));
    }
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((i) => {
          if (i.product.id === productId) {
            const newQty = i.qty + delta;
            return newQty > 0 ? { ...i, qty: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as KitCompositionItem[]
    );
  };

  const handleRemoveItem = (productId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const effectivePrixForfaitaire = Number(prixForfaitaire) || totalCatalogueStandard;
  const differenceEconomie = totalCatalogueStandard - effectivePrixForfaitaire;
  const pourcentageRemise =
    totalCatalogueStandard > 0
      ? Math.round((differenceEconomie / totalCatalogueStandard) * 100)
      : 0;

  const handleReset = () => {
    setNomKit('');
    setDescription('');
    setSelectedItems([]);
    setPrixForfaitaire('');
    setSaveAsTemplate(false);
    setSearch('');
  };

  const handleValidate = async () => {
    if (!nomKit.trim()) {
      toast.error('Veuillez donner un nom à ce kit (ex: Pack Rentrée Scolaire).');
      return;
    }
    if (selectedItems.length === 0) {
      toast.error('Veuillez ajouter au moins un produit au kit.');
      return;
    }
    if (effectivePrixForfaitaire <= 0) {
      toast.error('Le prix forfaitaire du kit doit être supérieur à zéro.');
      return;
    }

    // Si l'utilisateur souhaite enregistrer le kit en base de données comme modèle réutilisable
    if (saveAsTemplate) {
      try {
        setIsSavingTemplate(true);
        await ventesService.createKit({
          nomKit: nomKit.trim(),
          description: description.trim() || undefined,
          prixForfaitaire: effectivePrixForfaitaire,
          lignes: selectedItems.map((item) => ({
            produitId: Number(item.product.id),
            quantite: item.qty,
          })),
        });
        toast.success(`Modèle de kit "${nomKit}" sauvegardé dans vos kits favoris.`);
        onKitSaved?.();
      } catch (err: any) {
        toast.error(`Erreur de sauvegarde du modèle: ${err.message || 'Échec'}`);
      } finally {
        setIsSavingTemplate(false);
      }
    }

    // Ajouter le kit au panier POS
    onAddKitToCart({
      nomKit: nomKit.trim(),
      prixForfaitaire: effectivePrixForfaitaire,
      items: selectedItems,
    });

    toast.success(`Kit "${nomKit}" ajouté au panier !`);
    handleReset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Composer un Kit de vente (Vente par lot / Pack)"
      size="xl"
    >
      <div className="space-y-6">
        {/* Ligne 1 : Nom et Description du Kit */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/20 p-4 rounded-xl border border-border">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-foreground mb-1">
              Nom du kit / bundle <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Package size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={nomKit}
                onChange={(e) => setNomKit(e.target.value)}
                placeholder="Ex: Pack Rentrée 6ème, Coffret Romans, Lot Stylos..."
                className="input-field pl-9 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Description / Notes (optionnel)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Offre promo spéciale"
              className="input-field text-sm"
            />
          </div>
        </div>

        {/* Ligne 2 : Sélecteur de produits & Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Colonne Gauche : Recherche & Sélection Catalogue */}
          <div className="flex flex-col border border-border rounded-xl p-4 bg-card">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                1. Sélectionner les produits
              </h4>
              <span className="text-xs text-muted-foreground">
                {availableProducts.length} articles disponibles
              </span>
            </div>

            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Chercher un article..."
                className="input-field pl-8 text-xs py-2"
              />
            </div>

            <div className="flex-1 overflow-y-auto max-h-[280px] space-y-1.5 scrollbar-thin pr-1">
              {filteredProducts.map((p) => {
                const isSelected = selectedItems.some((i) => i.product.id === p.id);
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-colors ${
                      isSelected
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border/60 hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-semibold text-foreground truncate">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Réf: {p.reference} • Stock: {p.stock}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-bold text-foreground tabular-nums">
                        {p.prixVente.toLocaleString('fr-FR')} {devise}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddItem(p)}
                        className="btn-secondary p-1.5 rounded-md hover:bg-primary hover:text-primary-foreground transition-colors"
                        title="Ajouter au kit"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredProducts.length === 0 && (
                <p className="text-xs text-center text-muted-foreground py-6">
                  Aucun article trouvé
                </p>
              )}
            </div>
          </div>

          {/* Colonne Droite : Articles du Kit & Quantités */}
          <div className="flex flex-col border border-border rounded-xl p-4 bg-card">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                2. Composition du Kit ({selectedItems.length} article{selectedItems.length > 1 ? 's' : ''})
              </h4>
              {selectedItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedItems([])}
                  className="text-[11px] text-destructive hover:underline"
                >
                  Tout retirer
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto max-h-[280px] space-y-2 scrollbar-thin pr-1">
              {selectedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-center border border-dashed border-border rounded-lg p-4">
                  <Package size={28} className="text-muted-foreground/50 mb-2" />
                  <p className="text-xs font-medium text-muted-foreground">
                    Le kit ne contient aucun article pour l'instant.
                  </p>
                  <p className="text-[11px] text-muted-foreground/70">
                    Cliquez sur les articles à gauche pour les intégrer.
                  </p>
                </div>
              ) : (
                selectedItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/10 text-xs"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-semibold text-foreground truncate">{item.product.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        PU unitaire : {item.product.prixVente.toLocaleString('fr-FR')} {devise}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-border rounded-md bg-background">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.product.id, -1)}
                          className="p-1 text-muted-foreground hover:text-foreground"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="px-2 font-bold tabular-nums text-xs">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.product.id, 1)}
                          className="p-1 text-muted-foreground hover:text-foreground"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                      <span className="w-20 text-right font-bold tabular-nums text-foreground">
                        {(item.product.prixVente * item.qty).toLocaleString('fr-FR')} {devise}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.product.id)}
                        className="text-muted-foreground hover:text-destructive p-1"
                        title="Retirer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Ligne 3 : Tarification & Économie Forfaitaire */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Somme au catalogue */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Valeur catalogue standard</p>
              <p className="text-lg font-semibold text-muted-foreground line-through tabular-nums">
                {totalCatalogueStandard.toLocaleString('fr-FR')} {devise}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Somme des prix unitaires individuels
              </p>
            </div>

            {/* Saisie du prix forfaitaire */}
            <div>
              <label className="block text-xs font-bold text-primary mb-1">
                Prix forfaitaire du Kit (TTC) <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={prixForfaitaire}
                  onChange={(e) => setPrixForfaitaire(e.target.value)}
                  placeholder={String(totalCatalogueStandard)}
                  className="input-field text-base font-bold text-foreground tabular-nums pr-16"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  {devise}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPrixForfaitaire(String(totalCatalogueStandard))}
                className="text-[10px] text-primary hover:underline mt-1 block"
              >
                Réinitialiser au prix catalogue
              </button>
            </div>

            {/* Économie / Remise client */}
            <div className="rounded-lg p-3 bg-background/60 border border-primary/20">
              <div className="flex items-center gap-1.5 mb-1">
                <Sparkles size={14} className="text-primary" />
                <span className="text-xs font-bold text-foreground">Avantage commercial</span>
              </div>
              {differenceEconomie > 0 ? (
                <div>
                  <p className="text-sm font-extrabold text-green-600 dark:text-green-400">
                    Remise de {differenceEconomie.toLocaleString('fr-FR')} {devise} (-{pourcentageRemise}%)
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Le client économise sur le lot
                  </p>
                </div>
              ) : differenceEconomie < 0 ? (
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Prix supérieur au catalogue (+{Math.abs(differenceEconomie).toLocaleString('fr-FR')} {devise})
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Aucune remise appliquée (prix standard)
                </p>
              )}

              {effectivePrixForfaitaire < totalCoutAchat && (
                <div className="mt-1 flex items-center gap-1 text-[10px] text-destructive">
                  <AlertCircle size={11} />
                  <span>Attention: prix inférieur au coût d'achat ({totalCoutAchat} {devise})</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Option Sauvegarde dans les modèles favoris */}
        <div className="flex items-center gap-2 px-1">
          <input
            type="checkbox"
            id="save-as-template"
            checked={saveAsTemplate}
            onChange={(e) => setSaveAsTemplate(e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
          />
          <label
            htmlFor="save-as-template"
            className="text-xs text-foreground font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <BookmarkPlus size={14} className="text-primary" />
            Enregistrer également ce kit dans la bibliothèque des modèles favoris
          </label>
        </div>

        {/* Actions du modal */}
        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs py-2 px-4"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleValidate}
            disabled={selectedItems.length === 0 || !nomKit.trim() || isSavingTemplate}
            className="btn-primary text-xs py-2 px-5 flex items-center gap-2 shadow-md"
          >
            <Check size={14} />
            {isSavingTemplate ? 'Enregistrement...' : 'Ajouter le kit au panier'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
