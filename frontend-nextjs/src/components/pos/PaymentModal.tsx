'use client';
import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle,
  Loader2,
  Percent,
  Tag,
  Coins,
  ArrowRight,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useAppConfig } from '@/contexts/ConfigContext';

const DEFAULT_MOBILE = ['Moov Money', 'MTN Money', 'Orange Money', 'Wave'];

export interface PaymentSuccessData {
  paiements: Array<{ mode: string; montant: number }>;
  totalRemise: number;
  remiseType: 'AUCUNE' | 'FIXE' | 'POURCENTAGE';
  remiseValeur: number;
  totalNet: number;
}

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  total: number; // Sous-total brut
  devise: string;
  isLoading?: boolean;
  /** Appelé avec le tableau des paiements et le détail de la remise */
  onSuccess: (data: PaymentSuccessData) => void;
}

type PaymentMode = 'especes' | 'mobile_money';
type RemiseMode = 'AUCUNE' | 'FIXE' | 'POURCENTAGE';

export default function PaymentModal({
  open,
  onClose,
  total,
  devise,
  isLoading = false,
  onSuccess,
}: PaymentModalProps) {
  const { config } = useAppConfig();
  const moyensMobile: string[] =
    config?.moyens_paiement_mobile && config.moyens_paiement_mobile.length > 0
      ? config.moyens_paiement_mobile
      : DEFAULT_MOBILE;

  // Remise
  const [remiseMode, setRemiseMode] = useState<RemiseMode>('AUCUNE');
  const [remiseInput, setRemiseInput] = useState<string>('');

  // Paiement
  const [mode, setMode] = useState<PaymentMode>('especes');
  const [operateur, setOperateur] = useState<string>('');
  const [montantRecu, setMontantRecu] = useState('');
  const [montantWaveEspeces, setMontantWaveEspeces] = useState('');

  // Réinitialisation à l'ouverture
  useEffect(() => {
    if (open) {
      setRemiseMode('AUCUNE');
      setRemiseInput('');
      setMontantRecu('');
      setMontantWaveEspeces('');
      setMode('especes');
      setOperateur('');
    }
  }, [open]);

  // Calculs de la remise
  const remiseRawNum = parseFloat(remiseInput.replace(',', '.')) || 0;
  let computedRemise = 0;

  if (remiseMode === 'FIXE') {
    computedRemise = Math.min(total, Math.max(0, remiseRawNum));
  } else if (remiseMode === 'POURCENTAGE') {
    const pct = Math.min(100, Math.max(0, remiseRawNum));
    computedRemise = Math.min(total, Math.max(0, Math.round((total * pct) / 100)));
  }

  const netAPayer = Math.max(0, total - computedRemise);

  // Calculs des paiements sur le net à payer
  const montantRecuNum = parseFloat(montantRecu.replace(',', '.')) || 0;
  const montantWaveEspecesNum = parseFloat(montantWaveEspeces.replace(',', '.')) || 0;

  const monnaie = mode === 'especes' ? Math.max(0, montantRecuNum - netAPayer) : 0;

  const canPay =
    mode === 'especes'
      ? montantRecuNum >= netAPayer
      : !!operateur && montantWaveEspecesNum <= netAPayer;

  const handlePay = () => {
    if (!canPay || isLoading) return;

    let paiementsList: Array<{ mode: string; montant: number }> = [];

    if (mode === 'especes') {
      paiementsList = [{ mode: 'especes', montant: netAPayer }];
    } else if (mode === 'mobile_money') {
      if (montantWaveEspecesNum > 0) {
        paiementsList.push({ mode: 'especes', montant: montantWaveEspecesNum });
      }
      const resteMobile = netAPayer - montantWaveEspecesNum;
      if (resteMobile > 0) {
        paiementsList.push({ mode: operateur, montant: resteMobile });
      }
    }

    onSuccess({
      paiements: paiementsList,
      totalRemise: computedRemise,
      remiseType: remiseMode,
      remiseValeur: remiseRawNum,
      totalNet: netAPayer,
    });
  };

  // Montants rapides suggérés (arrondi supérieur) basés sur netAPayer
  const quickAmounts = [
    Math.ceil(netAPayer / 100) * 100,
    Math.ceil(netAPayer / 500) * 500,
    Math.ceil(netAPayer / 1000) * 1000,
    Math.ceil(netAPayer / 5000) * 5000,
  ]
    .filter((v, i, arr) => arr.indexOf(v) === i && v >= netAPayer)
    .slice(0, 4);

  const modes: Array<{ id: PaymentMode; label: string; icon: React.ElementType }> = [
    { id: 'especes', label: 'Espèces', icon: Banknote },
    { id: 'mobile_money', label: 'Mobile Money', icon: Smartphone },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Encaissement de la Vente" size="md">
      <div className="space-y-5">
        {/* CARTE MONTANT & RÉCAPITULATIF */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-5 text-center relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5 px-2">
            <span>Sous-total articles :</span>
            <span className="font-semibold tabular-nums">
              {total.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} {devise}
            </span>
          </div>

          {computedRemise > 0 && (
            <div className="flex items-center justify-between text-xs text-emerald-600 font-bold mb-2 px-2 bg-emerald-50/70 dark:bg-emerald-950/40 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <span className="flex items-center gap-1">
                <Tag size={12} /> Remise appliquée (
                {remiseMode === 'POURCENTAGE' ? `${remiseRawNum}%` : 'Fixe'}
                ) :
              </span>
              <span className="tabular-nums">
                -{computedRemise.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} {devise}
              </span>
            </div>
          )}

          <div className="pt-2 border-t border-primary/20">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Montant Net à Encaisser
            </p>
            <p className="text-4xl font-black tabular-nums text-primary tracking-tight">
              {netAPayer.toLocaleString('fr-FR', { minimumFractionDigits: 0 })} {devise}
            </p>
          </div>
        </div>

        {/* SECTION REMISE SUR LE TOTAL */}
        <div className="border border-border/80 rounded-2xl p-4 bg-muted/20 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wide">
              <Percent size={14} className="text-primary" />
              <span>Remise sur le total des achats</span>
            </label>
            {computedRemise > 0 && (
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                Économie : {computedRemise.toLocaleString('fr-FR')} {devise}
              </span>
            )}
          </div>

          {/* Sélecteur de type de remise */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setRemiseMode('AUCUNE');
                setRemiseInput('');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                remiseMode === 'AUCUNE'
                  ? 'bg-card text-foreground border-primary shadow-sm font-bold'
                  : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'
              }`}
            >
              Aucune remise
            </button>
            <button
              type="button"
              onClick={() => {
                setRemiseMode('FIXE');
                if (!remiseInput) setRemiseInput('');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                remiseMode === 'FIXE'
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm font-bold'
                  : 'bg-muted/40 text-foreground border-border hover:bg-muted'
              }`}
            >
              Montant Fixe ({devise})
            </button>
            <button
              type="button"
              onClick={() => {
                setRemiseMode('POURCENTAGE');
                if (!remiseInput) setRemiseInput('10');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                remiseMode === 'POURCENTAGE'
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm font-bold'
                  : 'bg-muted/40 text-foreground border-border hover:bg-muted'
              }`}
            >
              Pourcentage (%)
            </button>
          </div>

          {/* Saisie de la remise */}
          {remiseMode !== 'AUCUNE' && (
            <div className="space-y-2 pt-1 fade-in">
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={remiseInput}
                  onChange={(e) => setRemiseInput(e.target.value)}
                  placeholder={
                    remiseMode === 'FIXE'
                      ? `Montant de la réduction en ${devise} (ex: 500)`
                      : 'Pourcentage de réduction (ex: 10)'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-foreground text-sm font-bold placeholder:font-normal placeholder:text-muted-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  autoFocus
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                  {remiseMode === 'FIXE' ? devise : '%'}
                </span>
              </div>

              {/* Raccourcis rapides de pourcentage */}
              {remiseMode === 'POURCENTAGE' && (
                <div className="flex gap-2">
                  {[5, 10, 15, 20, 25].map((pct) => (
                    <button
                      key={`pct-${pct}`}
                      type="button"
                      onClick={() => setRemiseInput(String(pct))}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-all ${
                        remiseInput === String(pct)
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-card text-foreground border-border hover:bg-muted'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* CHOIX DU MODE DE RÈGLEMENT */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Mode de règlement
          </label>
          <div className="grid grid-cols-2 gap-3">
            {modes.map(({ id, label, icon: Icon }) => (
              <button
                key={`mode-${id}`}
                type="button"
                onClick={() => setMode(id)}
                className={`flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl border-2 transition-all ${
                  mode === id
                    ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                <Icon size={18} />
                <span className="text-xs font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* PAIEMENT EN ESPÈCES */}
        {mode === 'especes' && (
          <div className="space-y-3.5 fade-in bg-muted/20 border border-border/80 rounded-2xl p-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Montant remis par le client ({devise})
              </label>
              <input
                type="number"
                value={montantRecu}
                onChange={(e) => setMontantRecu(e.target.value)}
                placeholder={`Min. ${netAPayer.toLocaleString('fr-FR')} ${devise}`}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-foreground text-xl font-bold tabular-nums text-center shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            {/* Raccourcis montants rapides */}
            {quickAmounts.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setMontantRecu(netAPayer.toString())}
                  className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/30 text-xs font-bold hover:bg-primary/20 transition-colors"
                >
                  Compte exact ({netAPayer.toLocaleString('fr-FR')})
                </button>
                {quickAmounts.map((amount) => (
                  <button
                    key={`quick-${amount}`}
                    type="button"
                    onClick={() => setMontantRecu(amount.toString())}
                    className="px-3 py-1.5 rounded-lg bg-card hover:bg-muted text-xs font-semibold text-foreground border border-border transition-colors"
                  >
                    {amount.toLocaleString('fr-FR')} {devise}
                  </button>
                ))}
              </div>
            )}

            {/* Monnaie à rendre */}
            {montantRecuNum >= netAPayer && (
              <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl p-3.5 flex justify-between items-center fade-in">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-xs">
                  <Coins size={16} />
                  <span>Monnaie à rendre :</span>
                </div>
                <span className="text-xl font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                  {monnaie.toLocaleString('fr-FR')} {devise}
                </span>
              </div>
            )}

            {/* Montant insuffisant */}
            {montantRecu && montantRecuNum < netAPayer && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-3 flex justify-between items-center">
                <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                  Montant insuffisant
                </span>
                <span className="text-sm font-bold tabular-nums text-red-700 dark:text-red-300">
                  Manque {(netAPayer - montantRecuNum).toLocaleString('fr-FR')} {devise}
                </span>
              </div>
            )}
          </div>
        )}

        {/* PAIEMENT MOBILE MONEY */}
        {mode === 'mobile_money' && (
          <div className="space-y-3 fade-in bg-muted/20 border border-border/80 rounded-2xl p-4">
            <div className="text-center mb-2">
              <Smartphone size={22} className="text-primary mx-auto mb-1" />
              <p className="text-xs font-bold text-foreground">Sélectionnez l'opérateur Mobile Money</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {moyensMobile.map((m) => (
                <button
                  key={`op-${m}`}
                  type="button"
                  onClick={() => setOperateur(m)}
                  className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                    operateur === m
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-card text-foreground hover:border-primary/40'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {!operateur && (
              <p className="text-[11px] text-center text-amber-600 dark:text-amber-400 font-medium">
                Veuillez sélectionner un opérateur pour valider la vente.
              </p>
            )}

            {/* Option mixte espèces */}
            <div className="pt-2 border-t border-border">
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Règlement partiel en espèces ? (Optionnel)
              </label>
              <input
                type="number"
                value={montantWaveEspeces}
                onChange={(e) => setMontantWaveEspeces(e.target.value)}
                placeholder={`Ex: 2000`}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-foreground text-sm font-bold tabular-nums text-center shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              {montantWaveEspecesNum > 0 && montantWaveEspecesNum <= netAPayer && (
                <div className="mt-2 text-xs text-center text-muted-foreground font-medium space-y-0.5">
                  <p>Espèces : <strong className="text-foreground">{montantWaveEspecesNum.toLocaleString('fr-FR')} {devise}</strong></p>
                  <p>{operateur || 'Mobile Money'} : <strong className="text-foreground">{(netAPayer - montantWaveEspecesNum).toLocaleString('fr-FR')} {devise}</strong></p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BOUTONS D'ACTION */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handlePay}
            disabled={!canPay || isLoading}
            className="btn-primary flex-[2] py-3 rounded-xl shadow-lg font-bold text-sm flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                <span>
                  Valider l'encaissement ({netAPayer.toLocaleString('fr-FR')} {devise})
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
