'use client';
import React from 'react';
import { ShoppingBag, CreditCard, Banknote, FileText } from 'lucide-react';
import { useAppConfig } from '@/contexts/ConfigContext';
import { RecentSaleItem } from '@/services/finances.service';

const modeIcon: Record<string, React.ElementType> = { carte: CreditCard, especes: Banknote, cheque: FileText };
const modeLabel: Record<string, string> = { carte: 'Carte', especes: 'Espèces', cheque: 'Chèque' };

export default function RecentSalesFeed({ sales = [] }: { sales?: RecentSaleItem[] }) {
  const { config } = useAppConfig();
  const devise = config?.devise || 'FCFA';
  return (
    <div className="card-base overflow-hidden h-full">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Dernières ventes</h3>
        <span className="text-xs text-muted-foreground">Session du jour</span>
      </div>
      <div className="divide-y divide-border">
        {sales.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">Aucune vente enregistrée aujourd'hui</div>
        ) : sales.map((sale) => {
          const ModeIcon = modeIcon[sale.mode] || modeIcon.especes;
          return (
            <div key={sale.id} className="px-5 py-3 hover:bg-muted/40 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center"><ShoppingBag size={13} className="text-primary" /></div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{sale.id}</p>
                    <p className="text-[10px] text-muted-foreground">{sale.caissier} · {sale.caisse}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums text-foreground">{sale.montant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {devise}</p>
                  <p className="text-[10px] text-muted-foreground">{sale.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] text-muted-foreground">{sale.items} article{sale.items > 1 ? 's' : ''}</span>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><ModeIcon size={10} /><span>{modeLabel[sale.mode]}</span></div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-5 py-3 border-t border-border">
        <button className="text-xs font-semibold text-primary hover:text-blue-700 transition-colors">Voir toutes les ventes →</button>
      </div>
    </div>
  );
}
