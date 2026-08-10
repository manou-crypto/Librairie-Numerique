'use client';
import React from 'react';
import { Printer, CheckCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface ReceiptModalProps {
  open: boolean;
  onClose: () => void;
  saleId: string;
  total: number;
  mode: string;
  caisse: string;
}

const modeLabels: Record<string, string> = { especes: 'Espèces', carte: 'Carte bancaire', cheque: 'Chèque' };

export default function ReceiptModal({ open, onClose, saleId, total, mode, caisse }: ReceiptModalProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR');
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <Modal open={open} onClose={onClose} title="Vente enregistrée" size="sm">
      <div className="space-y-4">
        <div className="flex flex-col items-center py-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-3"><CheckCircle size={32} className="text-green-600" /></div>
          <h3 className="text-lg font-bold text-foreground">Vente validée !</h3>
          <p className="text-sm text-muted-foreground">{saleId}</p>
        </div>
        <div className="bg-muted/50 rounded-xl p-4 font-mono text-xs space-y-1.5 border border-border">
          <div className="text-center font-bold text-sm text-foreground mb-3">LIBRAIRIE NUMERIQUE</div>
          <div className="text-center text-muted-foreground mb-3"><p>123 Rue de la République, Alger</p><p>Tél: +213 21 00 00 00</p></div>
          <div className="border-t border-dashed border-border pt-2 space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="text-foreground">{dateStr}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Heure</span><span className="text-foreground">{timeStr}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Ticket N°</span><span className="text-foreground font-bold">{saleId}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Caisse</span><span className="text-foreground">{caisse}</span></div>
          </div>
          <div className="border-t border-dashed border-border pt-2 space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Mode paiement</span><span className="text-foreground">{modeLabels[mode] || mode}</span></div>
          </div>
          <div className="border-t border-border pt-2 mt-2">
            <div className="flex justify-between font-bold text-sm text-foreground"><span>TOTAL TTC</span><span className="tabular-nums">{total.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FCFA</span></div>
          </div>
          <div className="text-center text-muted-foreground pt-3 border-t border-dashed border-border mt-2">Merci de votre visite !</div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { window.print(); }} className="btn-secondary flex-1 flex items-center justify-center gap-2"><Printer size={15} />Imprimer</button>
          <button onClick={onClose} className="btn-primary flex-1">Nouvelle vente</button>
        </div>
      </div>
    </Modal>
  );
}
