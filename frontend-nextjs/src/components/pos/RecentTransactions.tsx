import React from 'react';

const transactions = [
  { id: 'VTE-047', time: '14:32', montant: 127.50, items: 4, mode: 'carte' },
  { id: 'VTE-046', time: '14:18', montant: 43.90, items: 2, mode: 'especes' },
  { id: 'VTE-045', time: '14:05', montant: 289.00, items: 1, mode: 'carte' },
  { id: 'VTE-044', time: '13:52', montant: 62.30, items: 6, mode: 'cheque' },
  { id: 'VTE-043', time: '13:41', montant: 15.80, items: 3, mode: 'especes' },
];

export default function RecentTransactions() {
  return (
    <div className="card-base overflow-hidden">
      <div className="px-4 py-3 border-b border-border"><h3 className="text-xs font-bold text-foreground">Transactions récentes</h3></div>
      <div className="divide-y divide-border">
        {transactions?.map((t) => (
          <div key={t?.id} className="px-4 py-2.5 hover:bg-muted/40 transition-colors">
            <div className="flex items-center justify-between">
              <div><p className="text-xs font-semibold text-foreground">{t?.id}</p><p className="text-[10px] text-muted-foreground">{t?.time} · {t?.items} art.</p></div>
              <span className="text-xs font-bold tabular-nums text-foreground">{t?.montant?.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} FCFA</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
