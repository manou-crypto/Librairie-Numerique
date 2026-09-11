'use client';
import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { VenteResponse } from '@/services/ventes.service';
import { RotateCcw, Package, AlertCircle, CheckCircle2, History, ArrowDownRight } from 'lucide-react';
import RetourModal from './RetourModal';

interface VenteDetailsModalProps {
  open: boolean;
  onClose: () => void;
  vente: VenteResponse | null;
  devise?: string;
  onRetourSuccess?: () => void;
}

const STATUT_CONFIG: Record<string, { label: string; className: string }> = {
  VALIDEE: { label: 'Validée', className: 'badge-active' },
  ANNULEE: { label: 'Annulée', className: 'badge-rupture' },
  REMBOURSEE: { label: 'Remboursée (Totale)', className: 'badge-rupture' },
  PARTIELLEMENT_REMBOURSEE: { label: 'Partiellement remboursée', className: 'badge-alert' },
};

const MODE_PAIEMENT_LABELS: Record<string, string> = {
  ESPECES: 'Espèces',
  CARTE_BANCAIRE: 'Carte bancaire',
  MOBILE_MONEY: 'Mobile Money',
  CHEQUE: 'Chèque',
};

export default function VenteDetailsModal({
  open,
  onClose,
  vente,
  devise = 'FCFA',
  onRetourSuccess,
}: VenteDetailsModalProps) {
  const [retourModalOpen, setRetourModalOpen] = useState(false);

  if (!vente) return null;

  const dateObj = new Date(vente.dateVente);
  const dateStr = dateObj.toLocaleDateString('fr-FR');
  const timeStr = dateObj.toLocaleTimeString('fr-FR');

  const canReturn =
    vente.statutVente === 'VALIDEE' || vente.statutVente === 'PARTIELLEMENT_REMBOURSEE';

  const handleRetourCompleted = () => {
    onRetourSuccess?.();
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={`Détails de la vente ${vente.referenceTicket}`}
        size="lg"
      >
        <div className="space-y-6">
          {/* En-tête : Résumé */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl border border-border">
            <div>
              <p className="text-xs text-muted-foreground">Date et Heure</p>
              <p className="font-semibold text-foreground text-sm">
                {dateStr} à {timeStr}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Statut</p>
              <span className={STATUT_CONFIG[vente.statutVente]?.className || 'badge-draft'}>
                {STATUT_CONFIG[vente.statutVente]?.label || vente.statutVente}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total TTC de la vente</p>
              <p className="text-xl font-bold text-foreground tabular-nums">
                {vente.totalTtc.toLocaleString('fr-FR')} {devise}
              </p>
            </div>
          </div>

          {/* Lignes de la vente */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-foreground">Articles vendus</h4>
              {vente.lignes && vente.lignes.some((l) => l.nomKit) && (
                <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                  <Package size={13} /> Contient des articles en Kit
                </span>
              )}
            </div>
            <div className="card-base overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">
                      Désignation
                    </th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">
                      Qté vendue
                    </th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">
                      PU HT
                    </th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">
                      TVA
                    </th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">
                      Total TTC
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {vente.lignes && vente.lignes.length > 0 ? (
                    vente.lignes.map((ligne) => {
                      const totalTtcLigne = ligne.totalLigneHt * (1 + ligne.tauxTva / 100);
                      const hasReturns = (ligne.quantiteRetournee || 0) > 0;
                      return (
                        <tr
                          key={ligne.id}
                          className="border-b border-border last:border-0 table-row-hover"
                        >
                          <td className="px-4 py-3 font-medium text-foreground">
                            <div className="flex flex-col">
                              <span>{ligne.produitLibelle}</span>
                              {ligne.nomKit && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 dark:text-purple-300">
                                  <Package size={11} /> Kit : {ligne.nomKit}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-semibold text-foreground">{ligne.quantite}</span>
                              {hasReturns && (
                                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                  -{ligne.quantiteRetournee} retourné(s)
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                            {ligne.prixVenteUnitaireHt.toLocaleString('fr-FR')}
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">
                            {ligne.tauxTva}%
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-foreground tabular-nums">
                            {totalTtcLigne.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}{' '}
                            {devise}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-4 text-center text-muted-foreground text-xs italic"
                      >
                        Détail des lignes indisponible
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section Historique des Retours sur cette vente */}
          {vente.retours && vente.retours.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <History size={16} className="text-amber-600 dark:text-amber-400" />
                <h4 className="text-sm font-bold text-foreground">
                  Retours et Remboursements effectués ({vente.retours.length})
                </h4>
              </div>
              <div className="space-y-2">
                {vente.retours.map((ret) => (
                  <div
                    key={ret.id}
                    className="p-3.5 rounded-xl border border-amber-300/50 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-800/60 text-xs space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-800 dark:text-amber-300">
                          {ret.referenceRetour}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ret.typeRetour === 'VENTE'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                          }`}
                        >
                          {ret.typeRetour === 'VENTE' ? 'Retour complet' : "Retour d'articles"}
                        </span>
                      </div>
                      <span className="text-muted-foreground">
                        {new Date(ret.dateRetour).toLocaleDateString('fr-FR')} à{' '}
                        {new Date(ret.dateRetour).toLocaleTimeString('fr-FR')}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-muted-foreground gap-2 pt-1 border-t border-amber-200/40 dark:border-amber-800/40">
                      <div>
                        <span className="font-medium text-foreground">Motif :</span> {ret.motif}
                      </div>
                      <div>
                        <span className="font-medium text-foreground">Remboursement :</span>{' '}
                        <span className="font-bold text-foreground tabular-nums">
                          {ret.montantRembourse.toLocaleString('fr-FR')} {devise}
                        </span>{' '}
                        ({MODE_PAIEMENT_LABELS[ret.modeRemboursement] || ret.modeRemboursement})
                      </div>
                    </div>

                    {ret.lignes && ret.lignes.length > 0 && (
                      <div className="bg-background/80 rounded-lg p-2 border border-border/50 space-y-1">
                        <p className="text-[10px] font-semibold text-muted-foreground">
                          Articles réintégrés en stock :
                        </p>
                        {ret.lignes.map((lr) => (
                          <div
                            key={lr.id}
                            className="flex justify-between text-[11px] text-foreground"
                          >
                            <span className="truncate pr-2">
                              <span className="font-bold text-amber-600 dark:text-amber-400">
                                {lr.quantiteRetournee}×
                              </span>{' '}
                              {lr.produitLibelle}
                            </span>
                            <span className="tabular-nums text-muted-foreground">
                              {lr.totalLigne.toLocaleString('fr-FR')} {devise}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section Totaux et Paiements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card-base p-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">Paiements initiaux</h4>
              <div className="space-y-2">
                {vente.paiements && vente.paiements.length > 0 ? (
                  vente.paiements.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        {MODE_PAIEMENT_LABELS[p.modePaiement] || p.modePaiement}
                      </span>
                      <span className="font-medium text-foreground tabular-nums">
                        {p.montant.toLocaleString('fr-FR')} {devise}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">Aucun paiement enregistré</p>
                )}
              </div>
            </div>

            <div className="card-base p-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">Résumé financier</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total HT</span>
                  <span className="tabular-nums">
                    {vente.totalHt.toLocaleString('fr-FR')} {devise}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total TVA</span>
                  <span className="tabular-nums">
                    {vente.totalTva.toLocaleString('fr-FR')} {devise}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border font-bold text-foreground">
                  <span>Total TTC</span>
                  <span className="tabular-nums">
                    {vente.totalTtc.toLocaleString('fr-FR')} {devise}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Boutons d'action en bas */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            {canReturn ? (
              <button
                type="button"
                onClick={() => setRetourModalOpen(true)}
                className="btn-secondary text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-1.5 text-xs py-2 px-3 shadow-sm font-semibold"
              >
                <RotateCcw size={14} />
                Effectuer un retour / Remboursement
              </button>
            ) : (
              <div />
            )}

            <button onClick={onClose} className="btn-secondary text-xs py-2 px-4">
              Fermer
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal interactif de retour */}
      {vente && (
        <RetourModal
          open={retourModalOpen}
          onClose={() => setRetourModalOpen(false)}
          vente={vente}
          devise={devise}
          onSuccess={handleRetourCompleted}
        />
      )}
    </>
  );
}
