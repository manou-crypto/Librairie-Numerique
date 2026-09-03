'use client';
import React, { useState, useEffect } from 'react';
import { AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import { useSocket } from '@/contexts/SocketContext';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, getAuthHeaders } from '@/lib';

interface StockAlert {
  id: string;
  name: string;
  category: string;
  stock: number;
  seuil: number;
  status: 'rupture' | 'alerte';
}

export default function DashboardStockAlerts() {
  const router = useRouter();
  const { lastStockUpdate } = useSocket();
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);

  // Chargement initial des alertes de stock depuis l'API
  useEffect(() => {
    async function loadStockAlerts() {
      try {
        const res = await fetch(`${API_BASE_URL}/v1/stock`, { headers: getAuthHeaders() });
        if (res.ok) {
          const data: any[] = await res.json();
          const alerts: StockAlert[] = data
            .filter((s) => s.estEnAlerte || s.estEnRupture)
            .map((s) => ({
              id: s.id,
              name: s.produitLibelle,
              category: s.categoryName,
              stock: s.quantiteEnStock,
              seuil: s.seuilAlerte,
              status: s.estEnRupture ? 'rupture' : 'alerte',
            }));
          setStockAlerts(alerts);
        }
      } catch (e) {
        console.error('Erreur chargement alertes stock:', e);
      }
    }
    loadStockAlerts();
  }, []);

  // Mise à jour en temps réel via WebSocket — événement stock_updated
  useEffect(() => {
    if (!lastStockUpdate) return;

    setStockAlerts((prev) => {
      const { produitId, produitLibelle, nouvelleQuantite, seuilAlerte, estEnAlerte, estEnRupture } = lastStockUpdate;

      // Si le produit n'est plus en alerte ni en rupture, on le retire de la liste
      if (!estEnAlerte && !estEnRupture) {
        return prev.filter((a) => a.id !== produitId);
      }

      const existingIndex = prev.findIndex((a) => a.id === produitId);
      const updatedAlert: StockAlert = {
        id: produitId,
        name: produitLibelle,
        category: 'Stock',
        stock: nouvelleQuantite,
        seuil: seuilAlerte,
        status: estEnRupture ? 'rupture' : 'alerte',
      };

      if (existingIndex >= 0) {
        // Mettre à jour l'alerte existante
        const updated = [...prev];
        updated[existingIndex] = updatedAlert;
        return updated;
      } else {
        // Ajouter la nouvelle alerte en haut de la liste
        return [updatedAlert, ...prev];
      }
    });
  }, [lastStockUpdate]);

  const ruptures = stockAlerts.filter((a) => a.status === 'rupture');
  const alertes = stockAlerts.filter((a) => a.status === 'alerte');

  return (
    <div className="card-base overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle size={16} className="text-amber-500" />
          <h3 className="text-sm font-bold text-foreground">Alertes de stock</h3>
          {ruptures.length > 0 && (
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {ruptures.length} rupture{ruptures.length > 1 ? 's' : ''}
            </span>
          )}
          {alertes.length > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {alertes.length} alerte{alertes.length > 1 ? 's' : ''}
            </span>
          )}
          {stockAlerts.length === 0 && (
            <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              ✓ Tout est en stock
            </span>
          )}
        </div>
        <button
          onClick={() => router.push('/stock')}
          className="text-xs font-semibold text-primary hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          Gérer les stocks <ArrowRight size={12} />
        </button>
      </div>
      {stockAlerts.length === 0 ? (
        <div className="px-5 py-8 text-center text-muted-foreground text-sm">
          Aucune alerte de stock actuellement.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">
          {stockAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`px-5 py-4 hover:bg-muted/30 transition-colors ${
                alert.status === 'rupture' ? 'bg-red-50/50' : 'bg-amber-50/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  alert.status === 'rupture' ? 'bg-red-100' : 'bg-amber-100'
                }`}>
                  {alert.status === 'rupture'
                    ? <XCircle size={15} className="text-red-600" />
                    : <AlertTriangle size={15} className="text-amber-600" />
                  }
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate leading-tight mb-1">{alert.name}</p>
                  <p className="text-[10px] text-muted-foreground mb-2">{alert.category}</p>
                  <div className="flex items-center gap-2">
                    {alert.status === 'rupture'
                      ? <Badge variant="rupture">Rupture totale</Badge>
                      : <Badge variant="alert">Stock : {alert.stock} / {alert.seuil}</Badge>
                    }
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
