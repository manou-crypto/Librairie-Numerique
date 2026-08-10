'use client';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import type { Product } from './ProductManagementClient';

interface AddEditProductModalProps { open: boolean; onClose: () => void; product: Product | null; onSave: (product: Product) => void; }

interface FormValues {
  name: string; reference: string; categoryId: string; categoryName: string; prixAchat: number; prixVente: number; stock: number; seuilAlerte: number; status: 'actif' | 'masque' | 'brouillon'; visible: boolean; description: string;
}

const categoryOptions = [
  { id: 'cat-livres', label: 'Livres' }, { id: 'cat-romans', label: 'Livres > Romans & Littérature' }, { id: 'cat-scolaires', label: 'Livres > Manuels scolaires' }, { id: 'cat-dictionnaires', label: 'Livres > Dictionnaires' },
  { id: 'cat-fournitures', label: 'Fournitures scolaires' }, { id: 'cat-cahiers', label: 'Fournitures > Cahiers & Carnets' }, { id: 'cat-stylos', label: 'Fournitures > Stylos & Crayons' }, { id: 'cat-colle', label: 'Fournitures > Colle & Ciseaux' },
  { id: 'cat-informatique', label: 'Informatique' }, { id: 'cat-peripheriques', label: 'Informatique > Périphériques' }, { id: 'cat-consommables', label: 'Informatique > Consommables' }, { id: 'cat-stockage', label: 'Informatique > Stockage' },
  { id: 'cat-bureautique', label: 'Bureautique' }, { id: 'cat-classement', label: 'Bureautique > Classement' }, { id: 'cat-papier', label: 'Bureautique > Papier & Impression' },
];

export default function AddEditProductModal({ open, onClose, product, onSave }: AddEditProductModalProps) {
  const isEdit = product !== null;
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    defaultValues: { name: '', reference: '', categoryId: 'cat-fournitures', categoryName: 'Fournitures scolaires', prixAchat: 0, prixVente: 0, stock: 0, seuilAlerte: 10, status: 'actif', visible: true, description: '' },
  });

  useEffect(() => {
    if (open) {
      if (product) reset({ name: product.name, reference: product.reference, categoryId: product.categoryId, categoryName: product.categoryName, prixAchat: product.prixAchat, prixVente: product.prixVente, stock: product.stock, seuilAlerte: product.seuilAlerte, status: product.status, visible: product.visible, description: product.description });
      else reset({ name: '', reference: '', categoryId: 'cat-fournitures', categoryName: 'Fournitures scolaires', prixAchat: 0, prixVente: 0, stock: 0, seuilAlerte: 10, status: 'actif', visible: true, description: '' });
    }
  }, [open, product, reset]);

  const prixAchat = watch('prixAchat');
  const prixVente = watch('prixVente');
  const marge = prixVente > 0 ? (((prixVente - prixAchat) / prixVente) * 100).toFixed(1) : '0.0';
  const benefice = prixVente > 0 ? (prixVente - prixAchat).toFixed(2) : '0.00';

  const onSubmit = async (data: FormValues) => {
    await new Promise((r) => setTimeout(r, 800));
    const catOption = categoryOptions.find((c) => c.id === data.categoryId);
    const saved: Product = { id: product?.id ?? `p-${Date.now()}`, name: data.name, reference: data.reference, categoryId: data.categoryId, categoryName: catOption?.label.split(' > ').pop() ?? data.categoryId, prixAchat: Number(data.prixAchat), prixVente: Number(data.prixVente), stock: Number(data.stock), seuilAlerte: Number(data.seuilAlerte), status: data.status, visible: data.visible, description: data.description, imageUrl: product?.imageUrl ?? '' };
    onSave(saved);
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? `Modifier — ${product?.name}` : 'Ajouter un nouveau produit'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 pb-2 border-b border-border">Informations générales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="name">Nom du produit <span className="text-negative">*</span></label><input id="name" type="text" {...register('name', { required: 'Le nom du produit est obligatoire.' })} placeholder="Ex: Cahier grand format 200p Clairefontaine" className="input-field" />{errors.name && <p className="flex items-center gap-1 text-xs text-negative mt-1.5"><AlertCircle size={12} />{errors.name.message}</p>}</div>
              <div><label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="reference">Référence <span className="text-negative">*</span></label><input id="reference" type="text" {...register('reference', { required: 'La référence est obligatoire.' })} placeholder="EX: FOU-0021" className="input-field font-mono" />{errors.reference && <p className="flex items-center gap-1 text-xs text-negative mt-1.5"><AlertCircle size={12} />{errors.reference.message}</p>}</div>
              <div><label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="categoryId">Catégorie <span className="text-negative">*</span></label><select id="categoryId" {...register('categoryId', { required: 'Veuillez sélectionner une catégorie.' })} className="input-field">{categoryOptions.map((cat) => (<option key={`catopt-${cat.id}`} value={cat.id}>{cat.label}</option>))}</select>{errors.categoryId && <p className="flex items-center gap-1 text-xs text-negative mt-1.5"><AlertCircle size={12} />{errors.categoryId.message}</p>}</div>
              <div className="sm:col-span-2"><label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="description">Description</label><textarea id="description" {...register('description')} rows={3} placeholder="Description courte du produit..." className="input-field resize-none" /></div>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 pb-2 border-b border-border">Tarification</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div><label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="prixAchat">Prix d&apos;achat (FCFA) <span className="text-negative">*</span></label><input id="prixAchat" type="number" step="1" min="0" {...register('prixAchat', { required: 'Obligatoire.', min: { value: 0, message: 'Doit être positif.' }, valueAsNumber: true })} className="input-field tabular-nums" />{errors.prixAchat && <p className="flex items-center gap-1 text-xs text-negative mt-1.5"><AlertCircle size={12} />{errors.prixAchat.message}</p>}</div>
              <div><label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="prixVente">Prix de vente (FCFA) <span className="text-negative">*</span></label><input id="prixVente" type="number" step="1" min="0" {...register('prixVente', { required: 'Obligatoire.', min: { value: 1, message: 'Doit être supérieur à 0.' }, valueAsNumber: true })} className="input-field tabular-nums" />{errors.prixVente && <p className="flex items-center gap-1 text-xs text-negative mt-1.5"><AlertCircle size={12} />{errors.prixVente.message}</p>}</div>
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Marge brute</label><div className="input-field bg-muted/50 flex items-center gap-2 cursor-not-allowed"><span className={`text-sm font-bold tabular-nums ${Number(marge) >= 40 ? 'text-green-600' : Number(marge) >= 25 ? 'text-blue-600' : 'text-amber-600'}`}>{marge}%</span><span className="text-xs text-muted-foreground">(+{benefice} FCFA/unité)</span></div></div>
              <div><label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="seuilAlerte">Seuil d&apos;alerte stock</label><input id="seuilAlerte" type="number" min="0" {...register('seuilAlerte', { valueAsNumber: true })} className="input-field tabular-nums" /></div>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 pb-2 border-b border-border">Stock & Statut</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="stock">Quantité en stock</label><input id="stock" type="number" min="0" {...register('stock', { valueAsNumber: true })} className="input-field tabular-nums" /></div>
              <div><label className="block text-xs font-semibold text-foreground mb-1.5" htmlFor="status">Statut du produit</label><select id="status" {...register('status')} className="input-field"><option value="actif">Actif</option><option value="masque">Masqué</option><option value="brouillon">Brouillon</option></select></div>
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Visibilité publique</label><label className="flex items-center gap-3 cursor-pointer mt-2"><div className="relative"><input type="checkbox" {...register('visible')} className="sr-only peer" /><div className="w-10 h-5 bg-muted rounded-full peer-checked:bg-primary transition-colors duration-200" /><div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 peer-checked:translate-x-5" /></div><span className="text-xs font-medium text-foreground">Visible sur le catalogue</span></label></div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground"><span className="text-negative">*</span> Champs obligatoires</p>
          <div className="flex gap-3 pt-2 border-t border-border sticky bottom-0 bg-card pb-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 flex items-center justify-center gap-2">{isSubmitting ? (<><Loader2 size={15} className="animate-spin" />Enregistrement...</>) : isEdit ? 'Enregistrer les modifications' : 'Ajouter le produit'}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
