import React from 'react';
import { AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import Badge from '@/components/ui/Badge';

const stockAlerts: any[] = [];

export default function DashboardStockAlerts() {
  const ruptures = stockAlerts.filter((a) => a.status === 'rupture');
  const alertes = stockAlerts.filter((a) => a.status === 'alerte');
  return (
    <div className="card-base overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle size={16} className="text-amber-500" />
          <h3 className="text-sm font-bold text-foreground">Alertes de stock</h3>
          <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{ruptures.length} rupture{ruptures.length > 1 ? 's' : ''}</span>
          <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{alertes.length} alerte{alertes.length > 1 ? 's' : ''}</span>
        </div>
        <button className="text-xs font-semibold text-primary hover:text-blue-700 flex items-center gap-1 transition-colors">Gérer les stocks <ArrowRight size={12} /></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">
        {stockAlerts.map((alert) => (
          <div key={alert.id} className={`px-5 py-4 hover:bg-muted/30 transition-colors ${alert.status === 'rupture' ? 'bg-red-50/50' : 'bg-amber-50/30'}`}>
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${alert.status === 'rupture' ? 'bg-red-100' : 'bg-amber-100'}`}>
                {alert.status === 'rupture' ? <XCircle size={15} className="text-red-600" /> : <AlertTriangle size={15} className="text-amber-600" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate leading-tight mb-1">{alert.name}</p>
                <p className="text-[10px] text-muted-foreground mb-2">{alert.category}</p>
                <div className="flex items-center gap-2">
                  {alert.status === 'rupture' ? <Badge variant="rupture">Rupture totale</Badge> : <Badge variant="alert">Stock : {alert.stock} / {alert.seuil}</Badge>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
