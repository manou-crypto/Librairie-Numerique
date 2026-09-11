'use client';
import React, { useState, useEffect } from 'react';
import { Truck, ArrowRight, AlertTriangle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { achatsService, AchatEnRetardItem } from '@/services/achats.service';
import { useAppConfig } from '@/contexts/ConfigContext';

export default function DashboardAchatAlerts() {
  const router = useRouter();
  const { config } = useAppConfig();
  const devise = config?.devise || 'FCFA';
  const [achatsEnRetard, setAchatsEnRetard] = useState<AchatEnRetardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRetards() {
      try {
        const data = await achatsService.getEnRetard(0);
        setAchatsEnRetard(data);
      } catch (e) {
        console.error('Erreur chargement achats en retard:', e);
      } finally {
        setLoading(false);
      }
    }
    loadRetards();
  }, []);

  const getSeverity = (jours: number) => {
    if (jours > 14)
      return {
        bg: 'bg-red-50/50',
        icon: 'bg-red-100',
        text: 'text-red-600',
        badge: 'bg-red-100 text-red-700',
      };
    return {
      bg: 'bg-amber-50/30',
      icon: 'bg-amber-100',
      text: 'text-amber-600',
      badge: 'bg-amber-100 text-amber-700',
    };
  };

  return (
    <div className="card-base overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Truck size={16} className="text-amber-500" />
          <h3 className="text-sm font-bold text-foreground">Retards de livraison</h3>
          {achatsEnRetard.length > 0 ? (
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {achatsEnRetard.length} en retard
            </span>
          ) : (
            !loading && (
              <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                ✓ Aucun retard
              </span>
            )
          )}
        </div>
        <button
          onClick={() => router.push('/achats')}
          className="text-xs font-semibold text-primary hover:text-blue-700 flex items-center gap-1 transition-colors"
        >
          Voir les achats <ArrowRight size={12} />
        </button>
      </div>
      {loading ? (
        <div className="px-5 py-8 text-center text-muted-foreground text-sm">Chargement...</div>
      ) : achatsEnRetard.length === 0 ? (
        <div className="px-5 py-8 text-center text-muted-foreground text-sm">
          Toutes les commandes fournisseurs sont dans les temps.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 divide-y md:divide-y-0 md:divide-x divide-border">
          {achatsEnRetard.slice(0, 8).map((achat) => {
            const severity = getSeverity(achat.joursRetard);
            return (
              <div
                key={achat.id}
                className={`px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer ${severity.bg}`}
                onClick={() => router.push('/achats')}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${severity.icon}`}
                  >
                    <AlertTriangle size={15} className={severity.text} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate leading-tight mb-0.5">
                      {achat.fournisseurNom}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono mb-1.5">
                      {achat.numeroFactureFournisseur}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${severity.badge}`}
                      >
                        <Clock size={9} className="inline mr-0.5 -mt-0.5" />
                        {achat.joursRetard}j de retard
                      </span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">
                        {achat.montantTotalHt.toLocaleString('fr-FR')} {devise}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
