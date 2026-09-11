'use client';
import React from 'react';
import Badge from '@/components/ui/Badge';
import { useAppConfig } from '@/contexts/ConfigContext';
import { TopProductItem } from '@/services/finances.service';

function getStockBadge(stock: number) {
  if (stock === 0) return <Badge variant="rupture">Rupture</Badge>;
  if (stock < 10) return <Badge variant="alert">Alerte</Badge>;
  return <Badge variant="active">OK</Badge>;
}

export default function TopProductsTable({ products = [] }: { products?: TopProductItem[] }) {
  const { config } = useAppConfig();
  const devise = config?.devise || 'FCFA';
  return (
    <div className="card-base overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">Top 5 produits vendus</h3>
        <span className="text-xs text-muted-foreground">Aujourd&apos;hui</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-5 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-8">
                #
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Produit
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Catégorie
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Qté vendue
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                CA ({devise})
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Marge
              </th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Stock
              </th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-sm text-muted-foreground">
                  Aucune vente aujourd'hui
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="table-row-hover border-b border-border last:border-0">
                  <td className="px-5 py-3">
                    <span className="text-xs font-bold text-muted-foreground w-5 h-5 rounded-md bg-muted flex items-center justify-center">
                      {p.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground text-xs truncate max-w-[200px]">
                      {p.name}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-muted-foreground">{p.category}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold tabular-nums text-foreground text-xs">
                      {p.vendu}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-bold tabular-nums text-foreground text-xs">
                      {p.ca.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {devise}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`text-xs font-semibold tabular-nums ${p.marge > 40 ? 'text-green-600' : p.marge > 30 ? 'text-blue-600' : 'text-amber-600'}`}
                    >
                      {p.marge.toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">{getStockBadge(p.stock)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
