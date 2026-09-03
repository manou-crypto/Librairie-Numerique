import React from 'react';
import Modal from '@/components/ui/Modal';
import { VenteResponse } from '@/services/ventes.service';

interface VenteDetailsModalProps {
  open: boolean;
  onClose: () => void;
  vente: VenteResponse | null;
  devise?: string;
}

const STATUT_CONFIG: Record<string, {label: string, className: string}> = {
  VALIDEE: { label: 'Validée', className: 'badge-active' },
  ANNULEE: { label: 'Annulée', className: 'badge-rupture' },
  REMBOURSEE: { label: 'Remboursée', className: 'badge-alert' },
};

const MODE_PAIEMENT_LABELS: Record<string, string> = {
  ESPECES: 'Espèces',
  CARTE_BANCAIRE: 'Carte bancaire',
  MOBILE_MONEY: 'Mobile Money',
  CHEQUE: 'Chèque'
};

export default function VenteDetailsModal({ open, onClose, vente, devise = 'FCFA' }: VenteDetailsModalProps) {
  if (!vente) return null;

  const dateObj = new Date(vente.dateVente);
  const dateStr = dateObj.toLocaleDateString('fr-FR');
  const timeStr = dateObj.toLocaleTimeString('fr-FR');

  return (
    <Modal open={open} onClose={onClose} title={`Détails de la vente ${vente.referenceTicket}`} size="lg">
      <div className="space-y-6">
        
        {/* En-tête : Résumé */}
        <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl border border-border">
          <div>
            <p className="text-sm text-muted-foreground">Date et Heure</p>
            <p className="font-medium text-foreground">{dateStr} à {timeStr}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Statut</p>
            <span className={STATUT_CONFIG[vente.statutVente]?.className || 'badge-draft'}>
              {STATUT_CONFIG[vente.statutVente]?.label || vente.statutVente}
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total TTC</p>
            <p className="text-xl font-bold text-foreground tabular-nums">{vente.totalTtc.toLocaleString('fr-FR')} {devise}</p>
          </div>
        </div>

        {/* Lignes de la vente */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Articles vendus</h4>
          <div className="card-base overflow-hidden overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground">Désignation</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">Qté</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">PU HT</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">TVA</th>
                  <th className="text-right px-4 py-2 text-xs font-semibold text-muted-foreground">Total TTC</th>
                </tr>
              </thead>
              <tbody>
                {vente.lignes && vente.lignes.length > 0 ? (
                  vente.lignes.map((ligne) => {
                    const totalTtcLigne = ligne.totalLigneHt * (1 + ligne.tauxTva / 100);
                    return (
                      <tr key={ligne.id} className="border-b border-border last:border-0 table-row-hover">
                        <td className="px-4 py-3 font-medium text-foreground">{ligne.produitLibelle}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{ligne.quantite}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">{ligne.prixVenteUnitaireHt.toLocaleString('fr-FR')}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">{ligne.tauxTva}%</td>
                        <td className="px-4 py-3 text-right font-medium text-foreground tabular-nums">{totalTtcLigne.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} {devise}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-center text-muted-foreground text-xs italic">
                      Détail des lignes indisponible
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section Totaux et Paiements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card-base p-4">
            <h4 className="text-sm font-semibold text-foreground mb-3">Paiements</h4>
            <div className="space-y-2">
              {vente.paiements && vente.paiements.length > 0 ? (
                vente.paiements.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{MODE_PAIEMENT_LABELS[p.modePaiement] || p.modePaiement}</span>
                    <span className="font-medium text-foreground tabular-nums">{p.montant.toLocaleString('fr-FR')} {devise}</span>
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
                  <span className="tabular-nums">{vente.totalHt.toLocaleString('fr-FR')} {devise}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total TVA</span>
                  <span className="tabular-nums">{vente.totalTva.toLocaleString('fr-FR')} {devise}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border font-bold text-foreground">
                  <span>Total TTC</span>
                  <span className="tabular-nums">{vente.totalTtc.toLocaleString('fr-FR')} {devise}</span>
                </div>
             </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button onClick={onClose} className="btn-secondary">Fermer</button>
        </div>
      </div>
    </Modal>
  );
}
