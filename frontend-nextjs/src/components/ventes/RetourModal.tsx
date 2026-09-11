'use client';
import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import {
  VenteResponse,
  ventesService,
  RetourVenteItem,
} from '@/services/ventes.service';
import {
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Printer,
  PackageCheck,
  Undo2,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

interface RetourModalProps {
  open: boolean;
  onClose: () => void;
  vente: VenteResponse | null;
  devise?: string;
  onSuccess: () => void;
}

const MOTIF_PRESETS = [
  'Produit défectueux ou abîmé',
  'Erreur de référence / Produit non conforme',
  'Rétractation du client',
  'Achat en double',
  'Autre motif spécifique',
];

const MODE_PAIEMENT_LABELS: Record<string, string> = {
  ESPECES: 'Espèces',
  MOBILE_MONEY: 'Mobile Money',
  CARTE_BANCAIRE: 'Carte bancaire',
  CHEQUE: 'Chèque / Avoir',
};

export default function RetourModal({
  open,
  onClose,
  vente,
  devise = 'FCFA',
  onSuccess,
}: RetourModalProps) {
  const [activeTab, setActiveTab] = useState<'articles' | 'vente'>('articles');
  const [quantitesRetour, setQuantitesRetour] = useState<Record<string, number>>({});
  const [selectedPreset, setSelectedPreset] = useState<string>(MOTIF_PRESETS[0]);
  const [customMotif, setCustomMotif] = useState<string>('');
  const [modeRemboursement, setModeRemboursement] = useState<string>('ESPECES');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retourEffectue, setRetourEffectue] = useState<RetourVenteItem | null>(null);

  // Initialisation à l'ouverture
  useEffect(() => {
    if (open && vente) {
      const initQte: Record<string, number> = {};
      vente.lignes?.forEach((l) => {
        initQte[l.id] = 0;
      });
      setQuantitesRetour(initQte);
      setSelectedPreset(MOTIF_PRESETS[0]);
      setCustomMotif('');
      setModeRemboursement('ESPECES');
      setRetourEffectue(null);
      setActiveTab('articles');
    }
  }, [open, vente]);

  if (!vente) return null;

  const handleQteChange = (ligneId: string, qte: number, maxRestant: number) => {
    const val = Math.max(0, Math.min(maxRestant, isNaN(qte) ? 0 : qte));
    setQuantitesRetour((prev) => ({ ...prev, [ligneId]: val }));
  };

  // Calcul du montant total à rembourser
  let totalRemboursementEstime = 0;
  if (activeTab === 'articles') {
    vente.lignes?.forEach((l) => {
      const qte = quantitesRetour[l.id] || 0;
      if (qte > 0) {
        const puTtc = l.prixVenteUnitaireHt * (1 + l.tauxTva / 100);
        totalRemboursementEstime += puTtc * qte;
      }
    });
  } else {
    // Retour complet : somme de toutes les quantités restantes
    vente.lignes?.forEach((l) => {
      const qteRestante = Math.max(0, l.quantite - (l.quantiteRetournee || 0));
      const puTtc = l.prixVenteUnitaireHt * (1 + l.tauxTva / 100);
      totalRemboursementEstime += puTtc * qteRestante;
    });
  }

  const getFullMotif = () => {
    if (selectedPreset === 'Autre motif spécifique') {
      return customMotif.trim();
    }
    return customMotif.trim()
      ? `${selectedPreset} : ${customMotif.trim()}`
      : selectedPreset;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const motifFinal = getFullMotif();
    if (!motifFinal) {
      toast.error('Le motif du retour est obligatoire.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (activeTab === 'articles') {
        const lignesPayload = Object.entries(quantitesRetour)
          .filter(([_, qte]) => qte > 0)
          .map(([ligneId, qte]) => ({
            ligneVenteId: Number(ligneId),
            quantite: qte,
          }));

        if (lignesPayload.length === 0) {
          toast.error('Veuillez sélectionner au moins un article avec une quantité à retourner.');
          setIsSubmitting(false);
          return;
        }

        const res = await ventesService.retourArticles(vente.id, {
          lignes: lignesPayload,
          motif: motifFinal,
          modeRemboursement,
        });

        setRetourEffectue(res);
        toast.success(`Retour d'article validé : ${res.montantRembourse.toLocaleString('fr-FR')} ${devise} remboursé(s).`);
      } else {
        const res = await ventesService.retourVente(vente.id, {
          motif: motifFinal,
          modeRemboursement,
        });

        setRetourEffectue(res);
        toast.success(`Retour complet de la vente validé avec succès !`);
      }

      onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la validation du retour');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        retourEffectue
          ? `Reçu de retour — ${retourEffectue.referenceRetour}`
          : `Retour d'achat — Ticket ${vente.referenceTicket}`
      }
      size="lg"
    >
      {retourEffectue ? (
        <div className="space-y-6">
          <div className="bg-positive/10 border border-positive/30 rounded-xl p-5 text-center space-y-2">
            <CheckCircle2 className="mx-auto text-positive" size={36} />
            <h3 className="text-base font-bold text-foreground">
              Retour enregistré avec succès !
            </h3>
            <p className="text-xs text-muted-foreground">
              Les produits retournés ont été automatiquement réintégrés dans l'inventaire des stocks.
            </p>
          </div>

          <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <span className="text-muted-foreground">Référence du retour :</span>
              <span className="font-mono font-bold text-foreground">{retourEffectue.referenceRetour}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <span className="text-muted-foreground">Ticket de vente d'origine :</span>
              <span className="font-mono text-foreground">{vente.referenceTicket}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <span className="text-muted-foreground">Type de retour :</span>
              <span className="font-semibold text-foreground">
                {retourEffectue.typeRetour === 'VENTE' ? 'Retour complet de la vente' : 'Retour d\'articles (partiel)'}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <span className="text-muted-foreground">Motif renseigné :</span>
              <span className="text-foreground">{retourEffectue.motif}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-border">
              <span className="text-muted-foreground">Mode de remboursement :</span>
              <span className="font-medium text-foreground">
                {MODE_PAIEMENT_LABELS[retourEffectue.modeRemboursement] || retourEffectue.modeRemboursement}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm pt-1">
              <span className="font-bold text-foreground">Montant total remboursé :</span>
              <span className="text-lg font-bold text-positive tabular-nums">
                {retourEffectue.montantRembourse.toLocaleString('fr-FR')} {devise}
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Articles retournés
            </h4>
            <div className="border border-border rounded-lg overflow-hidden text-xs">
              <table className="w-full">
                <thead className="bg-muted/60 border-b border-border">
                  <tr>
                    <th className="text-left px-3 py-2 text-muted-foreground">Article</th>
                    <th className="text-right px-3 py-2 text-muted-foreground">Qté retournée</th>
                    <th className="text-right px-3 py-2 text-muted-foreground">PU TTC</th>
                    <th className="text-right px-3 py-2 text-muted-foreground">Total remboursé</th>
                  </tr>
                </thead>
                <tbody>
                  {retourEffectue.lignes?.map((l) => (
                    <tr key={l.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 font-medium text-foreground">{l.produitLibelle}</td>
                      <td className="px-3 py-2 text-right text-foreground font-semibold">{l.quantiteRetournee}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground tabular-nums">
                        {l.prixUnitaireRembourse.toLocaleString('fr-FR')}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-positive tabular-nums">
                        {l.totalLigne.toLocaleString('fr-FR')} {devise}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => window.print()}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
            >
              <Printer size={14} /> Imprimer le reçu de retour
            </button>
            <button type="button" onClick={onClose} className="btn-primary text-xs py-2 px-4">
              Terminer
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Navigation par Onglets : Retour d'article vs Retour de vente */}
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <button
              type="button"
              onClick={() => setActiveTab('articles')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'articles'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <PackageCheck size={14} />
              <span>1. Retour d'article (partiel)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('vente')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'vente'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <RotateCcw size={14} />
              <span>2. Retour complet de la vente (total)</span>
            </button>
          </div>

          {/* CONTENU ONGLET 1 : RETOUR D'ARTICLE */}
          {activeTab === 'articles' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Sélectionnez les quantités précises d'articles à restituer par le client :
                </p>
                <span className="text-[11px] font-mono text-muted-foreground">
                  Ticket : {vente.referenceTicket}
                </span>
              </div>

              <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left px-3 py-2.5 font-semibold text-muted-foreground">
                        Désignation
                      </th>
                      <th className="text-center px-3 py-2.5 font-semibold text-muted-foreground">
                        Qté vendue
                      </th>
                      <th className="text-center px-3 py-2.5 font-semibold text-muted-foreground">
                        Déjà retournée
                      </th>
                      <th className="text-center px-3 py-2.5 font-semibold text-muted-foreground">
                        Restant
                      </th>
                      <th className="text-center px-3 py-2.5 font-semibold text-primary">
                        Qté à retourner
                      </th>
                      <th className="text-right px-3 py-2.5 font-semibold text-muted-foreground">
                        Total remboursé
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {vente.lignes?.map((ligne) => {
                      const dejaRetournee = ligne.quantiteRetournee || 0;
                      const restant = Math.max(0, ligne.quantite - dejaRetournee);
                      const qteChoisie = quantitesRetour[ligne.id] || 0;
                      const puTtc = ligne.prixVenteUnitaireHt * (1 + ligne.tauxTva / 100);
                      const totalLigne = puTtc * qteChoisie;

                      return (
                        <tr
                          key={ligne.id}
                          className={`border-b border-border last:border-0 ${
                            qteChoisie > 0 ? 'bg-primary/5' : ''
                          }`}
                        >
                          <td className="px-3 py-2.5">
                            <p className="font-medium text-foreground">{ligne.produitLibelle}</p>
                            {ligne.nomKit && (
                              <span className="text-[10px] text-primary font-semibold">
                                Kit : {ligne.nomKit}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center text-muted-foreground font-mono">
                            {ligne.quantite}
                          </td>
                          <td className="px-3 py-2.5 text-center text-muted-foreground font-mono">
                            {dejaRetournee > 0 ? (
                              <span className="text-amber-600 font-semibold">{dejaRetournee}</span>
                            ) : (
                              '0'
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center font-bold text-foreground font-mono">
                            {restant}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {restant > 0 ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleQteChange(ligne.id, qteChoisie - 1, restant)}
                                  disabled={qteChoisie <= 0}
                                  className="w-6 h-6 rounded bg-muted hover:bg-muted/80 text-foreground font-bold flex items-center justify-center disabled:opacity-30"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  max={restant}
                                  value={qteChoisie}
                                  onChange={(e) =>
                                    handleQteChange(ligne.id, parseInt(e.target.value), restant)
                                  }
                                  className="input-field w-12 text-center text-xs py-1 px-1 font-bold"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleQteChange(ligne.id, qteChoisie + 1, restant)}
                                  disabled={qteChoisie >= restant}
                                  className="w-6 h-6 rounded bg-muted hover:bg-muted/80 text-foreground font-bold flex items-center justify-center disabled:opacity-30"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">
                                Entièrement retourné
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right font-bold text-foreground tabular-nums">
                            {totalLigne > 0 ? (
                              <span className="text-positive">
                                {totalLigne.toLocaleString('fr-FR')} {devise}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CONTENU ONGLET 2 : RETOUR DE VENTE TOTAL */}
          {activeTab === 'vente' && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                <div className="text-xs space-y-1">
                  <h4 className="font-bold text-foreground">
                    Confirmation du retour complet de la vente
                  </h4>
                  <p className="text-muted-foreground">
                    Tous les articles restant sur cette transaction seront retournés et réintégrés en stock. La vente passera au statut <strong className="text-amber-700">Remboursée</strong>.
                  </p>
                </div>
              </div>

              <div className="bg-background p-3 rounded-lg border border-border flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Montant total calculé pour le remboursement complet :</span>
                <span className="text-base font-bold text-foreground tabular-nums">
                  {totalRemboursementEstime.toLocaleString('fr-FR')} {devise}
                </span>
              </div>
            </div>
          )}

          {/* Motif et Mode de remboursement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Motif du retour <span className="text-negative">*</span>
              </label>
              <select
                value={selectedPreset}
                onChange={(e) => setSelectedPreset(e.target.value)}
                className="input-field text-xs mb-2 w-full"
              >
                {MOTIF_PRESETS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={customMotif}
                onChange={(e) => setCustomMotif(e.target.value)}
                placeholder={
                  selectedPreset === 'Autre motif spécifique'
                    ? 'Précisez obligatoirement le motif...'
                    : 'Complément ou remarque facultative...'
                }
                className="input-field text-xs w-full"
                required={selectedPreset === 'Autre motif spécifique'}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Mode de remboursement
              </label>
              <select
                value={modeRemboursement}
                onChange={(e) => setModeRemboursement(e.target.value)}
                className="input-field text-xs mb-2 w-full"
              >
                <option value="ESPECES">Espèces (Déduit de la caisse)</option>
                <option value="MOBILE_MONEY">Mobile Money (Wave / Orange / MTN)</option>
                <option value="CARTE_BANCAIRE">Carte bancaire</option>
                <option value="CHEQUE">Chèque / Bon d'avoir</option>
              </select>

              <div className="bg-muted/40 p-2.5 rounded-lg border border-border text-xs flex justify-between items-center">
                <span className="text-muted-foreground font-medium">À rembourser au client :</span>
                <span className="text-sm font-bold text-positive tabular-nums">
                  {totalRemboursementEstime.toLocaleString('fr-FR')} {devise}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs py-2 px-3"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || totalRemboursementEstime <= 0}
              className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Enregistrement...
                </>
              ) : (
                <>
                  <Undo2 size={13} /> Valider le retour ({totalRemboursementEstime.toLocaleString('fr-FR')} {devise})
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
