'use client';
import React, { useState, useRef } from 'react';
import {
  Printer,
  CheckCircle2,
  FileText,
  Receipt as ReceiptIcon,
  Store,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { useAppConfig } from '@/contexts/ConfigContext';

export interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
  total: number;
  nomKit?: string;
  prixUnitaireReduit?: number;
  remise?: number;
  unite?: string;
}

interface ReceiptModalProps {
  open: boolean;
  onClose: () => void;
  saleId: string;
  referenceTicket?: string;
  numeroFacture?: string;
  total: number;
  totalHt?: number;
  totalTva?: number;
  totalRemise?: number;
  mode: string;
  paiements?: Array<{ modePaiement: string; montant: number }>;
  items?: ReceiptItem[];
  caisse?: string;
  devise?: string;
  client?: {
    nom: string;
    telephone?: string;
    adresse?: string;
  };
  vendeur?: string;
  dateVente?: string | Date;
}

const modeLabels: Record<string, string> = {
  especes: 'Espèces',
  ESPECES: 'Espèces',
  wave: 'Wave',
  WAVE: 'Wave',
  mobile_money: 'Mobile Money',
  MOBILE_MONEY: 'Mobile Money',
  orange_money: 'Orange Money',
  ORANGE_MONEY: 'Orange Money',
  mtn_money: 'MTN Money',
  MTN_MONEY: 'MTN Money',
  moov_money: 'Moov Money',
  MOOV_MONEY: 'Moov Money',
  carte_bancaire: 'Carte Bancaire',
  CARTE_BANCAIRE: 'Carte Bancaire',
  cheque: 'Chèque',
  CHEQUE: 'Chèque',
};

type ReceiptFormat = 'facture' | 'ticket';

export default function ReceiptModal({
  open,
  onClose,
  saleId,
  referenceTicket,
  numeroFacture,
  total,
  totalHt,
  totalTva,
  totalRemise = 0,
  mode,
  paiements = [],
  items = [],
  caisse = 'Caisse 1',
  devise = 'FCFA',
  client,
  vendeur,
  dateVente,
}: ReceiptModalProps) {
  const { config } = useAppConfig();

  // Par défaut : Format Facture / Reçu A4 / A5
  const [format, setFormat] = useState<ReceiptFormat>('facture');

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Données dynamiques de l'établissement provenant de la configuration en base de données
  const storeName = config?.nom_librairie?.trim() || 'LIBRAIRIE NUMÉRIQUE';
  const storeAddress = (config as any)?.adresse?.trim() || '';
  const storePhone = (config as any)?.telephone?.trim() || '';
  const storeEmail = (config as any)?.email?.trim() || '';
  const storeSlogan = (config as any)?.slogan?.trim() || '';
  const storeLogo = config?.logo_url || null;

  // Formatage de la date
  const dateObj = dateVente ? new Date(dateVente) : new Date();
  const dayStr = String(dateObj.getDate()).padStart(2, '0');
  const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yearStr = dateObj.getFullYear();
  const hoursStr = String(dateObj.getHours()).padStart(2, '0');
  const minutesStr = String(dateObj.getMinutes()).padStart(2, '0');
  const formattedDateTime = `${dayStr}-${monthStr}-${yearStr} ${hoursStr}:${minutesStr}`;
  const shortDate = `${dayStr}-${monthStr}-${yearStr}`;

  // Calculs récapitulatifs
  const quantiteTotale = items.reduce((sum, item) => sum + (item.qty || 1), 0);
  const totalArticles = items.length;

  const sousTotalBrut = items.reduce(
    (sum, item) => sum + (item.price || item.prixUnitaireReduit || 0) * (item.qty || 1),
    0
  );

  const totalPaye =
    paiements.length > 0
      ? paiements.reduce((sum, p) => sum + (p.montant || 0), 0)
      : total;

  const resteAPayer = Math.max(0, total - totalPaye);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Impression du Reçu de Vente"
      size={format === 'facture' ? 'xl' : 'md'}
    >
      <div className="space-y-6">
        {/* BARRE DE CHOIX DU FORMAT & ACTIONS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/40 p-3.5 rounded-2xl border border-border no-print">
          {/* Sélecteur de format à deux onglets (Reçu / Facture par défaut) */}
          <div className="flex items-center gap-1.5 p-1 bg-background/80 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setFormat('facture')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                format === 'facture'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText size={14} />
              <span>Facture A4 / A5 (Détaillée)</span>
            </button>
            <button
              type="button"
              onClick={() => setFormat('ticket')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                format === 'ticket'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ReceiptIcon size={14} />
              <span>Ticket Thermique 80mm</span>
            </button>
          </div>

          {/* Boutons Impression et Nouvelle vente */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="btn-primary flex items-center justify-center gap-2 text-xs px-4 py-2 shadow-sm font-semibold flex-1 sm:flex-initial"
            >
              <Printer size={15} />
              <span>Imprimer</span>
            </button>
            <button
              onClick={onClose}
              className="btn-secondary text-xs px-4 py-2 font-semibold flex-1 sm:flex-initial"
            >
              Nouvelle Vente
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FORMAT 1 (PAR DÉFAUT) : FACTURE A4 / A5 (CONFORME À LA FACTURE PAPIER)    */}
        {/* ========================================================================= */}
        {format === 'facture' && (
          <div className="overflow-x-auto pb-4">
            <div
              ref={printAreaRef}
              id="printable-document"
              className="invoice-document mx-auto w-full max-w-[820px] bg-white text-slate-900 p-8 rounded-sm shadow-xl border border-slate-300 min-h-[850px] flex flex-col justify-between"
              style={{ fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}
            >
              {/* EN-TÊTE DE LA FACTURE */}
              <div>
                <div className="flex items-start justify-between gap-6 pb-6 border-b border-slate-200">
                  {/* Informations de la boutique à gauche */}
                  <div className="space-y-1 text-sm max-w-[420px]">
                    <div className="flex items-center gap-3">
                      {storeLogo && (
                        <img
                          src={storeLogo}
                          alt={storeName}
                          className="h-10 w-auto object-contain max-w-[120px]"
                        />
                      )}
                      <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                        {storeName}
                      </h1>
                    </div>

                    {storeSlogan && (
                      <p className="text-xs italic text-slate-600 font-medium">{storeSlogan}</p>
                    )}

                    {storeAddress && (
                      <p className="text-xs font-semibold text-slate-700">{storeAddress}</p>
                    )}

                    {storePhone && (
                      <p className="text-xs text-slate-800">
                        <span className="font-semibold">Téléphone :</span> {storePhone}
                      </p>
                    )}

                    {storeEmail && (
                      <p className="text-xs text-slate-800">
                        <span className="font-semibold">E-mail :</span> {storeEmail}
                      </p>
                    )}

                    <p className="text-xs text-slate-700 pt-2 font-medium">
                      <span className="font-semibold">Établie par :</span>{' '}
                      {vendeur || 'M. Dahiri Hervé KONÉ'}
                    </p>
                  </div>

                  {/* Encadré Facture & Client à droite */}
                  <div className="text-right">
                    <h2 className="text-3xl font-black tracking-wider text-slate-900 uppercase mb-3">
                      FACTURE
                    </h2>

                    <div className="inline-block text-left border-2 border-dashed border-slate-400 p-3.5 rounded bg-slate-50/50 min-w-[260px] text-xs space-y-1.5">
                      <div className="font-bold text-sm text-slate-900 pb-1 border-b border-slate-200">
                        N° de Facture :{' '}
                        <span className="font-mono text-base">
                          {numeroFacture || referenceTicket?.slice(-4) || '0006'}
                        </span>
                      </div>
                      <div className="text-slate-800">
                        <span className="font-semibold">Client :</span>{' '}
                        {client?.nom || 'Walk-In Customer'}
                      </div>
                      {client?.telephone && (
                        <div className="text-slate-800">
                          <span className="font-semibold">Téléphone :</span> {client.telephone}
                        </div>
                      )}
                      <div className="text-slate-600">
                        <span className="font-semibold">Date :</span> {formattedDateTime}
                      </div>
                    </div>
                  </div>
                </div>

                {/* TABLEAU DES ARTICLES VENDUS */}
                <div className="mt-6">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-900 text-slate-900">
                        <th className="py-2.5 text-left font-black uppercase tracking-wider w-[45%]">
                          Désignation
                        </th>
                        <th className="py-2.5 text-center font-black uppercase tracking-wider w-[12%]">
                          Quantité
                        </th>
                        <th className="py-2.5 text-right font-black uppercase tracking-wider w-[18%]">
                          Prix Unitaire
                        </th>
                        <th className="py-2.5 text-right font-black uppercase tracking-wider w-[25%]">
                          Montant ({devise})
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {items.map((item, idx) => {
                        const lineTotal =
                          (item.prixUnitaireReduit !== undefined
                            ? item.prixUnitaireReduit
                            : item.price) * (item.qty || 1);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="py-2.5 pr-2 font-medium text-slate-900">
                              <span className="block font-semibold">
                                {item.nomKit ? `[Pack: ${item.nomKit}] ` : ''}
                                {item.name}
                              </span>
                              {item.remise && item.remise > 0 ? (
                                <span className="text-[10px] text-emerald-700 font-medium">
                                  Remise accordée : -{item.remise.toLocaleString('fr-FR')} {devise}
                                </span>
                              ) : null}
                            </td>
                            <td className="py-2.5 text-center font-bold text-slate-900">
                              {item.qty}{' '}
                              <span className="text-[10px] text-slate-500 font-normal">
                                {item.unite || 'Pce(s)'}
                              </span>
                            </td>
                            <td className="py-2.5 text-right text-slate-800 tabular-nums">
                              {item.prixUnitaireReduit !== undefined &&
                              item.prixUnitaireReduit < item.price ? (
                                <div>
                                  <span className="line-through text-slate-400 block text-[10px]">
                                    {item.price.toLocaleString('fr-FR')}
                                  </span>
                                  <span className="font-bold text-emerald-700">
                                    {item.prixUnitaireReduit.toLocaleString('fr-FR')}
                                  </span>
                                </div>
                              ) : (
                                <span className="font-semibold">
                                  {item.price.toLocaleString('fr-FR')}
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 text-right font-bold text-slate-900 tabular-nums">
                              {lineTotal.toLocaleString('fr-FR')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PIED DE FACTURE & RÉCAPITULATIFS */}
              <div className="mt-8 pt-4 border-t-2 border-slate-900">
                <div className="grid grid-cols-2 gap-8">
                  {/* Colonne de gauche : Versements effectués */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-900 mb-2 border-b border-slate-200 pb-1">
                        Versements Effectués
                      </h4>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-slate-600 border-b border-slate-200">
                            <th className="py-1 text-left font-semibold">Date</th>
                            <th className="py-1 text-left font-semibold">Mode</th>
                            <th className="py-1 text-right font-semibold">Montant</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {paiements && paiements.length > 0 ? (
                            paiements.map((p, idx) => (
                              <tr key={idx}>
                                <td className="py-1 text-slate-600">{shortDate}</td>
                                <td className="py-1 font-semibold text-slate-800">
                                  {modeLabels[p.modePaiement] || p.modePaiement}
                                </td>
                                <td className="py-1 text-right font-bold text-slate-900 tabular-nums">
                                  {p.montant.toLocaleString('fr-FR')} {devise}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td className="py-1 text-slate-600">{shortDate}</td>
                              <td className="py-1 font-semibold text-slate-800">
                                {modeLabels[mode] || mode}
                              </td>
                              <td className="py-1 text-right font-bold text-slate-900 tabular-nums">
                                {total.toLocaleString('fr-FR')} {devise}
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-slate-400 font-bold">
                            <td colSpan={2} className="py-1.5 text-slate-900 uppercase">
                              Total Payé
                            </td>
                            <td className="py-1.5 text-right text-slate-900 tabular-nums">
                              {totalPaye.toLocaleString('fr-FR')} {devise}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Zone de signature et cachet */}
                    <div className="pt-6">
                      <p className="text-[11px] font-bold text-slate-800 uppercase tracking-wider mb-8">
                        Signature et cachet :
                      </p>
                      <div className="w-48 border-b-2 border-dotted border-slate-400" />
                    </div>
                  </div>

                  {/* Colonne de droite : Récapitulatif chiffré */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 text-slate-700">
                      <span className="font-semibold">Quantité Totale :</span>
                      <span className="font-bold tabular-nums">{quantiteTotale}</span>
                    </div>

                    <div className="flex justify-between py-1 text-slate-700">
                      <span className="font-semibold">Total des Articles :</span>
                      <span className="font-bold tabular-nums">{totalArticles}</span>
                    </div>

                    <div className="flex justify-between py-1 text-slate-700 border-t border-slate-200 pt-1.5">
                      <span className="font-semibold">Sous-total Brut :</span>
                      <span className="font-medium tabular-nums">
                        {sousTotalBrut.toLocaleString('fr-FR')} {devise}
                      </span>
                    </div>

                    {totalRemise > 0 && (
                      <div className="flex justify-between py-1 text-emerald-800 font-bold bg-emerald-50 px-2 rounded">
                        <span>Remise commerciale :</span>
                        <span className="tabular-nums">
                          -{totalRemise.toLocaleString('fr-FR')} {devise}
                        </span>
                      </div>
                    )}

                    {totalTva !== undefined && totalTva > 0 && (
                      <div className="flex justify-between py-1 text-slate-700">
                        <span className="font-semibold">TVA :</span>
                        <span className="font-medium tabular-nums">
                          {totalTva.toLocaleString('fr-FR')} {devise}
                        </span>
                      </div>
                    )}

                    {/* Montant Net Total */}
                    <div className="flex justify-between py-2.5 border-t-2 border-b-2 border-slate-900 text-sm font-black text-slate-900 uppercase">
                      <span>Montant Total :</span>
                      <span className="text-base tabular-nums">
                        {total.toLocaleString('fr-FR')} {devise}
                      </span>
                    </div>

                    {resteAPayer > 0 && (
                      <div className="flex justify-between py-1 text-red-700 font-bold">
                        <span>Reste à Payer :</span>
                        <span className="tabular-nums">
                          {resteAPayer.toLocaleString('fr-FR')} {devise}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mention légale de bas de page */}
                <div className="text-center pt-8 text-[10px] text-slate-500 font-medium">
                  Merci de votre confiance ! • Réf : {referenceTicket || saleId}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FORMAT 2 : TICKET DE CAISSE THERMIQUE 80MM (COMPACT ET DYNAMIQUE)         */}
        {/* ========================================================================= */}
        {format === 'ticket' && (
          <div className="overflow-x-auto pb-4">
            <div
              ref={printAreaRef}
              id="printable-document"
              className="ticket-document relative mx-auto w-full max-w-[340px] bg-[#f9fafb] text-slate-900 px-6 py-8 rounded-sm shadow-xl border border-slate-200 overflow-hidden font-mono text-xs"
            >
              {/* Badge TICKET DE CAISSE */}
              <div className="flex justify-center mb-5">
                <div className="bg-slate-900 text-white font-bold tracking-widest text-xs px-4 py-1 rounded-full border border-slate-900">
                  TICKET DE CAISSE
                </div>
              </div>

              {/* En-tête du magasin dynamique */}
              <div className="text-center space-y-1 mb-4">
                <div className="font-black text-base tracking-wide uppercase">{storeName}</div>
                {storeSlogan && <div className="text-slate-600 text-[11px]">{storeSlogan}</div>}
                {storeAddress && <div className="text-slate-600 text-[10px]">{storeAddress}</div>}
                {storePhone && <div className="text-slate-500 text-[10px]">Tél : {storePhone}</div>}
              </div>

              {/* Infos de transaction */}
              <div className="border-t-2 border-dashed border-slate-300 pt-2.5 pb-2 space-y-1 text-slate-700 text-[11px]">
                <div className="flex justify-between">
                  <span>DATE</span>
                  <span>{formattedDateTime}</span>
                </div>
                <div className="flex justify-between">
                  <span>TICKET N°</span>
                  <span className="font-bold">{referenceTicket || saleId}</span>
                </div>
                {numeroFacture && (
                  <div className="flex justify-between">
                    <span>FACTURE N°</span>
                    <span className="font-bold">{numeroFacture}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>CAISSE</span>
                  <span>{caisse}</span>
                </div>
                <div className="flex justify-between">
                  <span>CLIENT</span>
                  <span className="truncate max-w-[170px]">{client?.nom || 'Walk-In Customer'}</span>
                </div>
                {vendeur && (
                  <div className="flex justify-between">
                    <span>CAISSIER</span>
                    <span className="truncate max-w-[170px]">{vendeur}</span>
                  </div>
                )}
              </div>

              {/* Lignes d'articles */}
              <div className="border-t-2 border-dashed border-slate-300 pt-2.5 pb-2.5 space-y-1.5">
                <div className="flex justify-between font-bold text-slate-900 pb-1 border-b border-slate-200 text-[11px]">
                  <span>DÉSIGNATION</span>
                  <span>MONTANT</span>
                </div>

                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start leading-tight pt-1">
                    <div className="flex-1 pr-3">
                      <span className="block font-medium truncate">
                        {item.nomKit ? `[Pack: ${item.nomKit}] ` : ''}
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {item.qty} x {item.price.toLocaleString('fr-FR')} {devise}
                      </span>
                    </div>
                    <div className="tabular-nums font-bold text-right shrink-0">
                      {(
                        (item.prixUnitaireReduit !== undefined
                          ? item.prixUnitaireReduit
                          : item.price) * item.qty
                      ).toLocaleString('fr-FR')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Remise & Totaux */}
              <div className="border-t-2 border-dashed border-slate-300 pt-2 pb-1 space-y-1">
                {totalRemise > 0 && (
                  <div className="flex justify-between text-emerald-800 text-[11px] font-bold">
                    <span>REMISE ACCORDÉE</span>
                    <span>-{totalRemise.toLocaleString('fr-FR')} {devise}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-800">
                  <span>NET À PAYER</span>
                  <span className="tabular-nums">
                    {total.toLocaleString('fr-FR')} {devise}
                  </span>
                </div>
              </div>

              {/* Détail Paiements */}
              <div className="border-t border-dashed border-slate-300 pt-2 pb-1 text-[11px] space-y-0.5">
                {paiements && paiements.length > 0 ? (
                  paiements.map((p, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>RÈGLEMENT ({modeLabels[p.modePaiement] || p.modePaiement})</span>
                      <span className="font-bold">{p.montant.toLocaleString('fr-FR')} {devise}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between">
                    <span>RÈGLEMENT ({modeLabels[mode] || mode})</span>
                    <span className="font-bold">{total.toLocaleString('fr-FR')} {devise}</span>
                  </div>
                )}
              </div>

              {/* Pied de ticket */}
              <div className="mt-6 text-center text-slate-600 space-y-1 pt-3 border-t-2 border-dashed border-slate-300">
                <div className="font-bold text-xs uppercase tracking-wide">
                  Merci de votre visite !
                </div>
                <div className="text-[10px] text-slate-500">À très bientôt dans notre établissement.</div>
                <div className="text-[9px] opacity-50 tracking-wider pt-1">
                  Réf : {referenceTicket || saleId}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Style d'impression universel : imprime uniquement le conteneur actuellement actif */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @media print {
            body * { visibility: hidden !important; }
            #printable-document, #printable-document * { visibility: visible !important; }
            #printable-document {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              box-shadow: none !important;
              border: none !important;
              margin: 0 !important;
              padding: 10mm !important;
            }
            .no-print { display: none !important; }
          }
        `,
          }}
        />
      </div>
    </Modal>
  );
}
