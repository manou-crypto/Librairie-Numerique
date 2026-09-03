'use client';
import React from 'react';
import { Printer } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
  total: number;
}

interface ReceiptModalProps {
  open: boolean;
  onClose: () => void;
  saleId: string;
  referenceTicket?: string;
  total: number;
  mode: string;
  items?: ReceiptItem[];
  caisse?: string;
  devise?: string;
}

const modeLabels: Record<string, string> = { especes: 'Espèces', carte: 'Carte bancaire', cheque: 'Chèque' };

export default function ReceiptModal({ open, onClose, saleId, referenceTicket, total, mode, items = [], caisse = 'Caisse', devise = 'FCFA' }: ReceiptModalProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <Modal open={open} onClose={onClose} title="Impression du Reçu" size="sm">
      <div className="space-y-6">
        
        {/* Conteneur principal du ticket */}
        <div className="relative mx-auto w-full max-w-[320px] bg-[#f9fafb] text-slate-900 px-6 py-8 rounded-sm shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 overflow-hidden" id="receipt-print-area">
          
          {/* Badge "REÇU" */}
          <div className="flex justify-center mb-6">
            <div className="bg-slate-800 text-white font-bold tracking-widest text-sm px-4 py-1.5 rounded-full border-2 border-slate-800 border-dashed">
              TICKET DE CAISSE
            </div>
          </div>

          <div className="font-mono text-xs space-y-4">
            
            {/* En-tête du magasin */}
            <div className="text-center space-y-1 mb-4">
              <div className="font-bold text-lg tracking-wide uppercase">LIBRAIRIE NUMERIQUE</div>
              <div className="text-slate-600">L'univers de la lecture</div>
              <div className="text-slate-500 text-[10px]">Tél: +213 21 00 00 00</div>
            </div>

            {/* Infos de transaction */}
            <div className="border-t-2 border-dashed border-slate-300 pt-3 pb-2 space-y-1.5 text-slate-700">
              <div className="flex justify-between"><span>DATE</span><span>{dateStr} {timeStr}</span></div>
              <div className="flex justify-between"><span>TICKET N°</span><span>{referenceTicket || saleId}</span></div>
              <div className="flex justify-between"><span>CAISSE</span><span>{caisse}</span></div>
              <div className="flex justify-between"><span>PAIEMENT</span><span>{modeLabels[mode] || mode}</span></div>
            </div>

            {/* Liste des articles */}
            <div className="border-t-2 border-dashed border-slate-300 pt-3 pb-3 space-y-2">
              <div className="flex justify-between font-bold text-slate-800 pb-1 border-b border-slate-200">
                <span>DÉSIGNATION</span>
                <span>MONTANT</span>
              </div>
              
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start leading-tight pt-1">
                  <div className="flex-1 pr-4">
                    <span className="block font-medium truncate">{item.name}</span>
                    <span className="text-[10px] text-slate-500">{item.qty} x {item.price.toLocaleString('fr-FR')}</span>
                  </div>
                  <div className="tabular-nums font-medium text-right shrink-0">
                    {item.total.toLocaleString('fr-FR')}
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t-2 border-slate-800 pt-2 pb-1">
              <div className="flex justify-between font-bold text-lg text-slate-900">
                <span>NET À PAYER</span>
                <span className="tabular-nums">{total.toLocaleString('fr-FR')} {devise}</span>
              </div>
            </div>

            {/* Footer original */}
            <div className="mt-8 text-center text-slate-600 space-y-2">
              <div className="font-bold text-xs tracking-wide uppercase leading-tight pt-2 border-t border-dashed border-slate-300">
                Merci de votre visite !<br/>À très bientôt.
              </div>
              <div className="text-[9px] tracking-widest opacity-60">Réf: {referenceTicket || saleId}</div>
            </div>

          </div>
        </div>

        {/* Boutons d'action (non imprimés) */}
        <div className="flex gap-3 px-4">
          <button onClick={() => { window.print(); }} className="btn-secondary flex-1 flex items-center justify-center gap-2 font-semibold">
            <Printer size={16} /> Imprimer
          </button>
          <button onClick={onClose} className="btn-primary flex-1 font-semibold">
            Nouvelle vente
          </button>
        </div>
        
        {/* Style spécifique pour l'impression */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * { visibility: hidden; }
            #receipt-print-area, #receipt-print-area * { visibility: visible; }
            #receipt-print-area { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; border: none; }
          }
        `}} />
      </div>
    </Modal>
  );
}
