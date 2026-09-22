'use client';
import React, { useState, useEffect } from 'react';
import { CreditCard, Banknote, Smartphone, CheckCircle, Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  total: number;
  devise: string;
  isLoading?: boolean;
  /** Appelé avec le tableau des paiements une fois confirmé */
  onSuccess: (paiements: Array<{ mode: string; montant: number }>) => void;
}

type PaymentMode = 'especes' | 'wave';

export default function PaymentModal({
  open,
  onClose,
  total,
  devise,
  isLoading = false,
  onSuccess,
}: PaymentModalProps) {
  const [mode, setMode] = useState<PaymentMode>('especes');
  const [montantRecu, setMontantRecu] = useState('');
  const [montantWaveEspeces, setMontantWaveEspeces] = useState(''); // Montant payé en espèces si mode mixte

  useEffect(() => {
    if (open) {
      setMontantRecu('');
      setMontantWaveEspeces('');
      setMode('especes');
    }
  }, [open]);

  const montantRecuNum = parseFloat(montantRecu.replace(',', '.')) || 0;
  const montantWaveEspecesNum = parseFloat(montantWaveEspeces.replace(',', '.')) || 0;
  
  const monnaie = mode === 'especes' ? montantRecuNum - total : 0;
  
  const canPay = mode === 'especes' 
    ? montantRecuNum >= total 
    : (montantWaveEspecesNum <= total); // Wave + Espèces (montant espèces ne doit pas dépasser le total)

  const handlePay = () => {
    if (!canPay || isLoading) return;

    if (mode === 'especes') {
      onSuccess([{ mode: 'especes', montant: total }]);
    } else if (mode === 'wave') {
      const paiements = [];
      if (montantWaveEspecesNum > 0) {
        paiements.push({ mode: 'especes', montant: montantWaveEspecesNum });
      }
      const resteWave = total - montantWaveEspecesNum;
      if (resteWave > 0) {
        paiements.push({ mode: 'wave', montant: resteWave });
      }
      onSuccess(paiements);
    }
  };

  // Montants rapides suggérés (arrondi supérieur)
  const quickAmounts = [
    Math.ceil(total / 100) * 100,
    Math.ceil(total / 500) * 500,
    Math.ceil(total / 1000) * 1000,
    Math.ceil(total / 5000) * 5000,
  ]
    .filter((v, i, arr) => arr.indexOf(v) === i && v >= total)
    .slice(0, 4);

  const modes: Array<{ id: PaymentMode; label: string; icon: React.ElementType }> = [
    { id: 'especes', label: 'Espèces', icon: Banknote },
    { id: 'wave', label: 'Wave', icon: Smartphone },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Encaissement" size="sm">
      <div className="space-y-5">
        {/* Montant à encaisser */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Montant à encaisser
          </p>
          <p className="text-4xl font-bold tabular-nums text-primary">
            {total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {devise}
          </p>
        </div>

        {/* Mode de paiement */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Mode de paiement
          </label>
          <div className="grid grid-cols-2 gap-2">
            {modes.map(({ id, label, icon: Icon }) => (
              <button
                key={`mode-${id}`}
                onClick={() => setMode(id)}
                className={`flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition-all duration-150 ${
                  mode === id
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/30'
                }`}
              >
                <Icon size={20} />
                <span className="text-[10px] font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Saisie montant espèces */}
        {mode === 'especes' && (
          <div className="space-y-3 fade-in">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Montant reçu ({devise})
              </label>
              <input
                type="number"
                value={montantRecu}
                onChange={(e) => setMontantRecu(e.target.value)}
                placeholder={`Min. ${total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}`}
                className="input-field text-lg font-bold tabular-nums text-center"
                autoFocus
              />
            </div>
            {/* Montants rapides */}
            {quickAmounts.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {quickAmounts.map((amount) => (
                  <button
                    key={`quick-${amount}`}
                    onClick={() => setMontantRecu(amount.toString())}
                    className="px-3 py-1.5 rounded-lg bg-muted hover:bg-border text-xs font-semibold text-foreground transition-colors"
                  >
                    {amount.toLocaleString('fr-FR')} {devise}
                  </button>
                ))}
              </div>
            )}
            {/* Monnaie à rendre */}
            {montantRecuNum >= total && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex justify-between items-center fade-in">
                <span className="text-xs font-semibold text-green-700">Monnaie à rendre</span>
                <span className="text-xl font-bold tabular-nums text-green-700">
                  {monnaie.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {devise}
                </span>
              </div>
            )}
            {/* Montant insuffisant */}
            {montantRecu && montantRecuNum < total && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex justify-between items-center">
                <span className="text-xs font-semibold text-red-700">Montant insuffisant</span>
                <span className="text-sm font-bold tabular-nums text-red-700">
                  Manque{' '}
                  {(total - montantRecuNum).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}{' '}
                  {devise}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Instructions Wave + Mixte */}
        {mode === 'wave' && (
          <div className="space-y-3 fade-in">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <Smartphone size={24} className="text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-blue-800">
                Paiement via Wave
              </p>
              <p className="text-xs text-blue-600 mt-1">Veuillez valider la transaction sur le téléphone du client</p>
            </div>
            
            <div className="border border-border rounded-xl p-3">
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Une partie en espèces ? (Optionnel)
              </label>
              <input
                type="number"
                value={montantWaveEspeces}
                onChange={(e) => setMontantWaveEspeces(e.target.value)}
                placeholder={`Ex: 5000`}
                className="input-field text-sm font-bold tabular-nums text-center"
              />
              {montantWaveEspecesNum > 0 && montantWaveEspecesNum <= total && (
                <div className="mt-2 text-xs text-center text-muted-foreground font-medium">
                  Espèces: {montantWaveEspecesNum.toLocaleString('fr-FR')} {devise} <br/>
                  Wave: {(total - montantWaveEspecesNum).toLocaleString('fr-FR')} {devise}
                </div>
              )}
              {montantWaveEspecesNum > total && (
                <div className="mt-2 text-xs text-center text-red-600 font-medium">
                  Le montant en espèces ne peut pas dépasser le total.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} disabled={isLoading} className="btn-secondary flex-1">
            Annuler
          </button>
          <button
            onClick={handlePay}
            disabled={!canPay || isLoading}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Enregistrement...
              </>
            ) : (
              <>
                <CheckCircle size={15} /> Valider la vente
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
