'use client';
import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Loader2, AlertCircle, Plus, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useAppConfig } from '@/contexts/ConfigContext';
import { produitsService, CategorieItem, MarqueItem, TypeVenteItem } from '@/services/produits.service';
import type { Product } from './ProductManagementClient';
import AddCategoryModal from './AddCategoryModal';
import ModalForm from '@/components/ui/Modal';

interface AddEditProductModalProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  categories?: CategorieItem[];
  onSave: (product: Product) => void;
  onCategoryAdded?: () => void;
}

interface FormValues {
  name: string;
  reference: string;
  categoryId: string;
  categoryName: string;
  prixAchat: number;
  prixVente: number;
  stock: number;
  seuilAlerte: number;
  status: 'actif' | 'masque' | 'brouillon';
  visible: boolean;
  description: string;
  marqueId: string;
  conditionnements: { uniteId: string; codeBarre: string; prixVente: number }[];
}

function buildCategoryLabel(cat: CategorieItem, allCats: CategorieItem[]): string {
  if (!cat.parentId) return cat.nom;
  const parent = allCats.find((c) => c.id === cat.parentId);
  if (!parent) return cat.nom;
  return `${parent.nom} > ${cat.nom}`;
}

export default function AddEditProductModal({
  open,
  onClose,
  product,
  categories: initialCategories = [],
  onSave,
  onCategoryAdded,
}: AddEditProductModalProps) {
  const isEdit = product !== null;
  const { config } = useAppConfig();
  const devise = config?.devise || 'FCFA';

  const [categories, setCategories] = useState<CategorieItem[]>(initialCategories);
  const [loadingCats, setLoadingCats] = useState(false);
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);

  const [marques, setMarques] = useState<MarqueItem[]>([]);
  const [loadingMarques, setLoadingMarques] = useState(false);
  const [isAddMarqueOpen, setIsAddMarqueOpen] = useState(false);
  const [newMarqueName, setNewMarqueName] = useState('');
  const [savingMarque, setSavingMarque] = useState(false);

  const [unites, setUnites] = useState<{ id_unite: number; nom: string; multiple: number }[]>([]);

  useEffect(() => {
    import('@/services/unites.service').then(m => m.unitesService.getUnites().then(setUnites).catch(() => {}));
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      reference: '',
      categoryId: '',
      categoryName: '',
      prixAchat: 0,
      prixVente: 0,
      stock: 0,
      seuilAlerte: 5,
      status: 'actif',
      visible: true,
      description: '',
      marqueId: '',
      conditionnements: [],
    },
  });

  const { fields: conditionnementsFields, append: appendCond, remove: removeCond } = useFieldArray({
    control,
    name: 'conditionnements',
  });

  // Charger les catégories si non fournies
  useEffect(() => {
    if (!open) return;
    if (initialCategories.length > 0) {
      setCategories(initialCategories);
      if (!product && initialCategories.length > 0) {
        setValue('categoryId', initialCategories[0].id);
        setValue('categoryName', initialCategories[0].nom);
      }
      return;
    }

    setLoadingCats(true);
    produitsService
      .getCategories()
      .then((data) => {
        setCategories(Array.isArray(data) ? data : []);
        if (!product && Array.isArray(data) && data.length > 0) {
          setValue('categoryId', data[0].id);
          setValue('categoryName', data[0].nom);
        }
      })
      .catch(() => setCategories([]))
      .finally(() => setLoadingCats(false));
  }, [open, initialCategories, product, setValue]);

  useEffect(() => {
    if (!open) return;
    setLoadingMarques(true);
    produitsService
      .getMarques()
      .then((data) => {
        setMarques(Array.isArray(data) ? data : []);
      })
      .catch(() => setMarques([]))
      .finally(() => setLoadingMarques(false));
  }, [open]);

  useEffect(() => {
    if (open) {
      if (product) {
        reset({
          name: product.name,
          reference: product.reference,
          categoryId: product.categoryId || (categories[0]?.id ?? ''),
          categoryName: product.categoryName || (categories[0]?.nom ?? ''),
          prixAchat: product.prixAchat,
          prixVente: product.prixVente,
          stock: product.stock,
          seuilAlerte: product.seuilAlerte,
          status: product.status,
          visible: product.visible,
          description: product.description || '',
          marqueId: product.marqueId || '',
          conditionnements: product.conditionnements?.map(c => ({
            uniteId: String(c.uniteId || ''),
            codeBarre: c.codeBarre || '',
            prixVente: c.prixVente || 0,
          })) || [],
        });
      } else {
        reset({
          name: '',
          reference: '',
          categoryId: categories[0]?.id ?? '',
          categoryName: categories[0]?.nom ?? '',
          prixAchat: 0,
          prixVente: 0,
          stock: 0,
          seuilAlerte: 5,
          status: 'actif',
          visible: true,
          description: '',
          marqueId: '',
          conditionnements: [],
        });
      }
    }
  }, [open, product, categories, reset]);

  const prixAchat = watch('prixAchat');
  const prixVente = watch('prixVente');
  const marge = prixVente > 0 ? (((prixVente - prixAchat) / prixVente) * 100).toFixed(1) : '0.0';
  const benefice = prixVente > 0 ? (prixVente - prixAchat).toFixed(2) : '0.00';

  const onSubmit = async (data: FormValues) => {
    const selectedCat = categories.find((c) => c.id === data.categoryId);
    const saved: Product = {
      id: product?.id ?? '',
      name: data.name,
      reference: data.reference,
      categoryId: data.categoryId,
      categoryName: selectedCat?.nom ?? data.categoryName,
      prixAchat: Number(data.prixAchat),
      prixVente: Number(data.prixVente),
      stock: Number(data.stock),
      seuilAlerte: Number(data.seuilAlerte),
      status: data.status,
      visible: data.visible,
      description: data.description,
      marqueId: data.marqueId,
      imageUrl: product?.imageUrl ?? '',
      conditionnements: data.conditionnements,
    };
    onSave(saved);
  };

  const handleSaveCategory = async (catData: { nom: string; parentId: string | null }) => {
    const newCat = await produitsService.createCategory(catData);
    setCategories((prev) => [...prev, newCat]);
    setValue('categoryId', newCat.id);
    setValue('categoryName', newCat.nom);
    if (onCategoryAdded) onCategoryAdded();
  };

  const handleSaveMarque = async () => {
    if (!newMarqueName.trim()) return;
    setSavingMarque(true);
    try {
      const newM = await produitsService.createMarque({ nom: newMarqueName.trim() });
      setMarques((prev) => [...prev, newM].sort((a, b) => a.nom.localeCompare(b.nom)));
      setValue('marqueId', newM.id);
      setIsAddMarqueOpen(false);
      setNewMarqueName('');
    } catch (e: any) {
      alert(e.message || 'Erreur');
    } finally {
      setSavingMarque(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={isEdit ? `Modifier — ${product?.name}` : 'Ajouter un nouveau produit'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 pb-2 border-b border-border">
                Informations générales
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label
                    className="block text-xs font-semibold text-foreground mb-1.5"
                    htmlFor="name"
                  >
                    Nom du produit <span className="text-negative">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    {...register('name', { required: 'Le nom du produit est obligatoire.' })}
                    placeholder="Ex: Cahier grand format 200p Clairefontaine"
                    className="input-field"
                  />
                  {errors.name && (
                    <p className="flex items-center gap-1 text-xs text-negative mt-1.5">
                      <AlertCircle size={12} />
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold text-foreground mb-1.5"
                    htmlFor="reference"
                  >
                    Référence{' '}
                    {isEdit ? (
                      <span className="text-negative">*</span>
                    ) : (
                      <span className="text-muted-foreground font-normal">(Optionnelle)</span>
                    )}
                  </label>
                  <input
                    id="reference"
                    type="text"
                    {...register('reference', {
                      required: isEdit ? 'La référence est obligatoire.' : false,
                    })}
                    placeholder={isEdit ? 'EX: FOU-0021' : 'Laissez vide pour générer auto'}
                    className="input-field font-mono"
                    disabled={!isEdit && !!watch('reference') === false}
                  />
                  {errors.reference && (
                    <p className="flex items-center gap-1 text-xs text-negative mt-1.5">
                      <AlertCircle size={12} />
                      {errors.reference.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold text-foreground mb-1.5"
                    htmlFor="categoryId"
                  >
                    Catégorie <span className="text-negative">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      id="categoryId"
                      {...register('categoryId', {
                        required: 'Veuillez sélectionner une catégorie.',
                      })}
                      className="input-field flex-1"
                      disabled={loadingCats}
                    >
                      {loadingCats && <option value="">Chargement...</option>}
                      {!loadingCats && categories.length === 0 && (
                        <option value="">Aucune catégorie disponible</option>
                      )}
                      {categories.map((cat) => (
                        <option key={`catopt-${cat.id}`} value={cat.id}>
                          {buildCategoryLabel(cat, categories)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsAddCatOpen(true)}
                      className="btn-secondary px-3 flex items-center justify-center border border-border"
                      title="Nouvelle catégorie"
                    >
                      +
                    </button>
                  </div>
                  {errors.categoryId && (
                    <p className="flex items-center gap-1 text-xs text-negative mt-1.5">
                      <AlertCircle size={12} />
                      {errors.categoryId.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold text-foreground mb-1.5"
                    htmlFor="marque"
                  >
                    Marque
                  </label>
                  <div className="flex gap-2">
                    <select
                      id="marque"
                      {...register('marqueId')}
                      className="input-field flex-1"
                      disabled={loadingMarques}
                    >
                      <option value="">Sélectionner une marque...</option>
                      {marques.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nom}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsAddMarqueOpen(true)}
                      className="btn-secondary px-3 flex items-center justify-center border border-border"
                      title="Nouvelle marque"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label
                    className="block text-xs font-semibold text-foreground mb-1.5"
                    htmlFor="description"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    {...register('description')}
                    rows={3}
                    placeholder="Description courte du produit..."
                    className="input-field resize-none"
                  />
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 pb-2 border-b border-border">
                Tarification
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label
                    className="block text-xs font-semibold text-foreground mb-1.5"
                    htmlFor="prixAchat"
                  >
                    Prix d&apos;achat ({devise}) <span className="text-negative">*</span>
                  </label>
                  <input
                    id="prixAchat"
                    type="number"
                    step="1"
                    min="0"
                    {...register('prixAchat', {
                      required: 'Obligatoire.',
                      min: { value: 0, message: 'Doit être positif.' },
                      valueAsNumber: true,
                    })}
                    className="input-field tabular-nums"
                  />
                  {errors.prixAchat && (
                    <p className="flex items-center gap-1 text-xs text-negative mt-1.5">
                      <AlertCircle size={12} />
                      {errors.prixAchat.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold text-foreground mb-1.5"
                    htmlFor="prixVente"
                  >
                    Prix de vente ({devise}) <span className="text-negative">*</span>
                  </label>
                  <input
                    id="prixVente"
                    type="number"
                    step="1"
                    min="0"
                    {...register('prixVente', {
                      required: 'Obligatoire.',
                      min: { value: 1, message: 'Doit être supérieur à 0.' },
                      valueAsNumber: true,
                    })}
                    className="input-field tabular-nums"
                  />
                  {errors.prixVente && (
                    <p className="flex items-center gap-1 text-xs text-negative mt-1.5">
                      <AlertCircle size={12} />
                      {errors.prixVente.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Marge brute
                  </label>
                  <div className="input-field bg-muted/50 flex items-center gap-2 cursor-not-allowed">
                    <span
                      className={`text-sm font-bold tabular-nums ${
                        Number(marge) >= 40
                          ? 'text-green-600'
                          : Number(marge) >= 25
                            ? 'text-blue-600'
                            : 'text-amber-600'
                      }`}
                    >
                      {marge}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      (+{benefice} {devise}/u)
                    </span>
                  </div>
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold text-foreground mb-1.5"
                    htmlFor="seuilAlerte"
                  >
                    Seuil d&apos;alerte stock
                  </label>
                  <input
                    id="seuilAlerte"
                    type="number"
                    min="0"
                    {...register('seuilAlerte', { valueAsNumber: true })}
                    className="input-field tabular-nums"
                  />
                </div>
              </div>
            </div>

            {/* Section Conditionnements (Unités Multiples) */}
            <div>
              <div className="flex justify-between items-end mb-4 pb-2 border-b border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Conditionnements multiples
                </h3>
                <button
                  type="button"
                  onClick={() => appendCond({ uniteId: '', codeBarre: '', prixVente: 0 })}
                  className="btn-secondary py-1 px-2 text-xs flex items-center gap-1"
                >
                  <Plus size={12} /> Ajouter une unité
                </button>
              </div>
              
              {conditionnementsFields.length === 0 && (
                <p className="text-xs text-muted-foreground italic mb-2">
                  Aucun conditionnement supplémentaire. Le produit sera vendu à l'unité.
                </p>
              )}

              <div className="space-y-3">
                {conditionnementsFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-3 items-start bg-muted/20 p-3 rounded-lg border border-border">
                    <div className="col-span-12 sm:col-span-5">
                      <label className="block text-xs font-semibold text-foreground mb-1">Unité</label>
                      <select
                        {...register(`conditionnements.${index}.uniteId` as const, { required: 'Requis' })}
                        className="input-field text-sm"
                      >
                        <option value="">Sélectionner...</option>
                        {unites.map(u => (
                          <option key={u.id_unite} value={u.id_unite}>{u.nom} (x{u.multiple})</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-6 sm:col-span-3">
                      <label className="block text-xs font-semibold text-foreground mb-1">Code-barres</label>
                      <input
                        {...register(`conditionnements.${index}.codeBarre` as const)}
                        className="input-field text-sm font-mono"
                        placeholder="Scan..."
                      />
                    </div>
                    <div className="col-span-10 sm:col-span-3">
                      <label className="block text-xs font-semibold text-foreground mb-1">Prix Vente</label>
                      <input
                        type="number"
                        min="0"
                        {...register(`conditionnements.${index}.prixVente` as const, { valueAsNumber: true })}
                        className="input-field tabular-nums text-sm text-primary font-bold"
                        placeholder={`Laissez à 0 pour auto`}
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex items-end justify-end h-full pt-5">
                      <button
                        type="button"
                        onClick={() => removeCond(index)}
                        className="text-muted-foreground hover:text-negative p-2 rounded-md transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 pb-2 border-b border-border">
                Stock & Statut
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    className="block text-xs font-semibold text-foreground mb-1.5"
                    htmlFor="stock"
                  >
                    Quantité en stock
                  </label>
                  <input
                    id="stock"
                    type="number"
                    min="0"
                    {...register('stock', { valueAsNumber: true })}
                    className="input-field tabular-nums"
                  />
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold text-foreground mb-1.5"
                    htmlFor="status"
                  >
                    Statut du produit
                  </label>
                  <select id="status" {...register('status')} className="input-field">
                    <option value="actif">Actif</option>
                    <option value="masque">Masqué</option>
                    <option value="brouillon">Brouillon</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Visibilité publique
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer mt-2">
                    <div className="relative">
                      <input type="checkbox" {...register('visible')} className="sr-only peer" />
                      <div className="w-10 h-5 bg-muted rounded-full peer-checked:bg-primary transition-colors duration-200" />
                      <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 peer-checked:translate-x-5" />
                    </div>
                    <span className="text-xs font-medium text-foreground">
                      Visible sur le catalogue
                    </span>
                  </label>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              <span className="text-negative">*</span> Champs obligatoires
            </p>
            <div className="flex gap-3 pt-2 border-t border-border sticky bottom-0 bg-card pb-1">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Enregistrement...
                  </>
                ) : isEdit ? (
                  'Enregistrer les modifications'
                ) : (
                  'Ajouter le produit'
                )}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <AddCategoryModal
        open={isAddCatOpen}
        onClose={() => setIsAddCatOpen(false)}
        onSave={handleSaveCategory}
        categories={categories}
      />
      {isAddMarqueOpen && (
        <ModalForm open={isAddMarqueOpen} onClose={() => setIsAddMarqueOpen(false)} title="Ajouter une marque" size="sm">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Nom de la marque
              </label>
              <input
                type="text"
                value={newMarqueName}
                onChange={(e) => setNewMarqueName(e.target.value)}
                placeholder="Ex: Hachette"
                className="input-field"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={() => setIsAddMarqueOpen(false)} className="btn-secondary">
                Annuler
              </button>
              <button type="button" onClick={handleSaveMarque} disabled={savingMarque || !newMarqueName.trim()} className="btn-primary">
                {savingMarque ? <Loader2 size={16} className="animate-spin" /> : 'Créer'}
              </button>
            </div>
          </div>
        </ModalForm>
      )}
    </>
  );
}
