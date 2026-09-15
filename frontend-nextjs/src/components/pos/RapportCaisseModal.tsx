'use client';
import React, { useEffect, useState, useRef } from 'react';
import { X, Printer, Loader2, DollarSign, List, BarChart3, Clock, User, MapPin, Package } from 'lucide-react';
import { caissesService } from '@/services/caisses.service';
import { toast } from 'sonner';

interface RapportCaisseModalProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  devise: string;
  onCloturer: () => void;
}

export default function RapportCaisseModal({ open, onClose, sessionId, devise, onCloturer }: RapportCaisseModalProps) {
  const [loading, setLoading] = useState(true);
  const [rapport, setRapport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && sessionId) {
      setLoading(true);
      setError(null);
      caissesService.getRapportSession(sessionId)
        .then((res) => {
          setRapport(res);
        })
        .catch((err) => {
          setError(err.message || 'Impossible de charger le rapport');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, sessionId]);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (printContent) {
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload(); // Pour restaurer l'état React proprement
    }
  };

  const handleConfirmCloture = async () => {
    try {
      setLoading(true);
      await caissesService.cloturerSession(sessionId);
      toast.success('Caisse clôturée avec succès');
      onCloturer();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la clôture');
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 print:p-0 print:bg-white print:items-start">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden fade-in print:max-w-none print:shadow-none print:rounded-none">
        
        {/* EN-TÊTE MODAL (Non imprimé) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30 print:hidden shrink-0">
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <BarChart3 size={20} className="text-primary" />
            Rapport de caisse (Session #{sessionId})
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={loading || !rapport}
              className="p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary rounded-lg transition-colors disabled:opacity-50"
              title="Imprimer le rapport"
            >
              <Printer size={18} />
            </button>
            <button
              onClick={() => alert('Détails de la caisse à implémenter')}
              className="px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
            >
              Détails Caisse
            </button>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:bg-negative/10 hover:text-negative rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* CONTENU DU RAPPORT */}
        <div ref={printRef} className="flex-1 overflow-y-auto p-6 space-y-6 print:p-4 print:text-black print:overflow-visible">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary mb-2" size={32} />
              <p className="text-sm text-muted-foreground">Veuillez patienter...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-negative">
              <p className="font-semibold">{error}</p>
            </div>
          ) : rapport ? (
            <div className="print:text-black">
              
              <div className="hidden print:block text-center mb-6 border-b pb-4">
                <h1 className="text-xl font-bold uppercase mb-1">Rapport de Caisse</h1>
                <p className="text-sm">Session #{rapport.session.id}</p>
              </div>

              {/* INFO SESSION */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm bg-muted/10 p-4 rounded-lg print:border print:bg-white">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground print:text-gray-700">
                    <User size={14} /> <span className="font-semibold text-foreground print:text-black">Caissier :</span> {rapport.session.utilisateur}
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground print:text-gray-700">
                    <MapPin size={14} /> <span className="font-semibold text-foreground print:text-black">Caisse :</span> {rapport.session.emplacement}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground print:text-gray-700">
                    <Clock size={14} /> <span className="font-semibold text-foreground print:text-black">Ouverture :</span> {new Date(rapport.session.dateOuverture).toLocaleString('fr-FR')}
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground print:text-gray-700">
                    <Clock size={14} /> <span className="font-semibold text-foreground print:text-black">Clôture :</span> {rapport.session.dateCloture ? new Date(rapport.session.dateCloture).toLocaleString('fr-FR') : 'En cours'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:block print:space-y-6">
                
                {/* TIROIR CAISSE */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider print:text-black print:border-b print:pb-1">
                    <DollarSign size={16} /> Tiroir-Caisse
                  </h4>
                  <div className="bg-muted/5 p-4 rounded-xl border border-border space-y-2 text-sm print:bg-white print:border-none print:p-0">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground print:text-gray-700">Solde à l'ouverture</span>
                      <span className="font-medium">{rapport.tiroirCaisse.soldeOuverture.toLocaleString('fr-FR')} {devise}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground print:text-gray-700">Espèces des ventes (+)</span>
                      <span className="font-medium text-positive">{rapport.tiroirCaisse.especesRecuesVentes.toLocaleString('fr-FR')} {devise}</span>
                    </div>
                    <div className="flex justify-between hidden">
                      <span className="text-muted-foreground print:text-gray-700">Paiement dû en espèces (+)</span>
                      <span className="font-medium text-positive">{rapport.tiroirCaisse.especesRecuesPaiementDu.toLocaleString('fr-FR')} {devise}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground print:text-gray-700">Remboursements espèces (-)</span>
                      <span className="font-medium text-negative">{rapport.tiroirCaisse.remboursementsEspeces.toLocaleString('fr-FR')} {devise}</span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-border flex justify-between font-bold text-foreground print:text-black">
                      <span>Total Espèces Attendues</span>
                      <span className="text-base">{rapport.tiroirCaisse.especesAttendues.toLocaleString('fr-FR')} {devise}</span>
                    </div>
                  </div>
                </div>

                {/* VENTES & CRÉANCES */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-indigo-500 flex items-center gap-1.5 uppercase tracking-wider print:text-black print:border-b print:pb-1">
                      <List size={16} /> Résumé des ventes
                    </h4>
                    <div className="bg-muted/5 p-4 rounded-xl border border-border space-y-2 text-sm print:bg-white print:border-none print:p-0">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground print:text-gray-700">Ventes brutes</span>
                        <span className="font-medium">{rapport.resumeVentes.ventesBrutes.toLocaleString('fr-FR')} {devise}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground print:text-gray-700">Remboursements</span>
                        <span className="font-medium text-negative">{rapport.resumeVentes.totalRemboursements.toLocaleString('fr-FR')} {devise}</span>
                      </div>
                      <div className="pt-2 mt-2 border-t border-border flex justify-between font-bold text-foreground print:text-black">
                        <span>Ventes Nettes</span>
                        <span>{rapport.resumeVentes.ventesNettes.toLocaleString('fr-FR')} {devise}</span>
                      </div>
                    </div>
                  </div>
                  
                  {rapport.creances.enAttenteClients > 0 && (
                    <div className="space-y-3 print:mt-6">
                      <h4 className="text-sm font-bold text-amber-600 flex items-center gap-1.5 uppercase tracking-wider print:text-black print:border-b print:pb-1">
                        <List size={16} /> Créances
                      </h4>
                      <div className="bg-muted/5 p-4 rounded-xl border border-border space-y-2 text-sm print:bg-white print:border-none print:p-0">
                        <div className="flex justify-between text-amber-600 font-bold print:text-black">
                          <span>Montant en attente / Crédit</span>
                          <span>{rapport.creances.enAttenteClients.toLocaleString('fr-FR')} {devise}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* LISTE DES PRODUITS */}
              {rapport.produits && rapport.produits.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5 uppercase tracking-wider print:text-black print:border-b print:pb-1">
                    <Package size={16} /> Détail des articles vendus
                  </h4>
                  <table className="w-full text-sm text-left print:border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground print:text-black print:border-black">
                        <th className="py-2 font-semibold">SKU / Réf</th>
                        <th className="py-2 font-semibold">Article</th>
                        <th className="py-2 text-right font-semibold">Qté</th>
                        <th className="py-2 text-right font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {rapport.produits.map((p: any, idx: number) => (
                        <tr key={idx} className="print:border-b print:border-gray-200">
                          <td className="py-2 text-xs font-mono text-muted-foreground print:text-gray-600">{p.sku}</td>
                          <td className="py-2 font-medium">{p.produit}</td>
                          <td className="py-2 text-right tabular-nums">{p.quantite}</td>
                          <td className="py-2 text-right tabular-nums font-semibold">{p.montantTotal.toLocaleString('fr-FR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          ) : null}
        </div>

        {/* PIED DE MODAL (Non imprimé) */}
        {!rapport?.session?.dateCloture && !loading && rapport && (
          <div className="px-6 py-4 border-t border-border bg-muted/10 flex justify-end gap-3 print:hidden shrink-0">
            <button onClick={onClose} className="btn-secondary text-sm">Annuler</button>
            <button onClick={handleConfirmCloture} className="btn-primary bg-negative hover:bg-negative/90 text-sm">
              Valider la clôture
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
