import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { toast } from 'sonner';
import { produitsService, TypeVenteItem } from '@/services/produits.service';
import type { Product } from './ProductManagementClient';

interface TarificationProductModalProps {
  open: boolean;
  onClose: () => void;
  product: Product;
  onSave: (product: Product) => void;
}

interface FormValues {
  tarifs: { typeVenteId: string; libelle: string; prix: number }[];
}

export default function TarificationProductModal({ open, onClose, product, onSave }: TarificationProductModalProps) {
  const [typesVente, setTypesVente] = useState<TypeVenteItem[]>([]);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, control } = useForm<FormValues>({
    defaultValues: { tarifs: [] }
  });

  const { fields } = useFieldArray({
    control,
    name: 'tarifs'
  });

  useEffect(() => {
    produitsService.getTypesVente().then(setTypesVente).catch(() => {});
  }, []);

  useEffect(() => {
    if (open && product && typesVente.length > 0) {
      const initialTarifs = typesVente.map(tv => {
        const existing = product.tarifs?.find(t => t.typeVenteId === tv.id);
        return {
          typeVenteId: tv.id,
          libelle: tv.libelle,
          prix: existing ? existing.prix : (product.prixVente || 0),
        };
      });
      reset({ tarifs: initialTarifs });
    }
  }, [open, product, typesVente, reset]);

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      const updatedProduct = { ...product, tarifs: data.tarifs };
      await produitsService.update(updatedProduct.id, updatedProduct);
      toast.success('Tarification mise à jour');
      onSave(updatedProduct);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Tarification: ${product?.name || ''}`}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-2 gap-4 items-center p-3 border border-border rounded-xl bg-card">
              <div>
                <p className="font-semibold text-sm">{field.libelle}</p>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Prix de vente</label>
                <input
                  type="number"
                  min="0"
                  {...register(`tarifs.${index}.prix` as const, { valueAsNumber: true, required: true })}
                  className="w-full h-9 px-3 bg-white border border-border rounded-lg text-sm"
                />
              </div>
            </div>
          ))}
          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun type de vente configuré. Allez dans Paramètres pour en ajouter.</p>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-xl transition-colors">
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 flex items-center gap-2 transition-all"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Enregistrer
          </button>
        </div>
      </form>
    </Modal>
  );
}
