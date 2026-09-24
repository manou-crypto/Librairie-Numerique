'use client';
import React, { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import Link from 'next/link';
import {
  Calendar,
  Search,
  Download,
  Printer,
  ArrowLeft,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  Eye,
  X,
  Loader2,
} from 'lucide-react';
import {
  financesService,
  ClotureJournaliereItem,
} from '@/services/finances.service';
import { useAppConfig } from '@/contexts/ConfigContext';
import { toast } from 'sonner';
import { exportToCSV } from '@/utils/export';

export default function CloturesJournalieresPage() {
  const { config } = useAppConfig();
  const devise = config?.devise || 'FCFA';

  const [clotures, setClotures] = useState<ClotureJournaliereItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'TOUT' | 'MANUELLE' | 'AUTOMATIQUE'>('TOUT');
  const [selectedCloture, setSelectedCloture] = useState<ClotureJournaliereItem | null>(null);
  const [isManualClotureOpen, setIsManualClotureOpen] = useState(false);
  const [cloturing, setCloturing] = useState(false);

  const fetchClotures = async () => {
    try {
      setLoading(true);
      const data = await financesService.getHistoriqueClotures();
      setClotures(data);
    } catch (err: any) {
      toast.error('Erreur lors du chargement des clôtures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClotures();
  }, []);

  const handleManualCloture = async () => {
    try {
      setCloturing(true);
      const today = new Date().toISOString().split('T')[0];
      await financesService.effectuerClotureJournaliere(today);
      toast.success("Clôture journalière d'aujourd'hui enregistrée et validée !");
      setIsManualClotureOpen(false);
      fetchClotures();
    } catch (err: any) {
      toast.error(err.message || 'Impossible de valider la clôture');
    } finally {
      setCloturing(false);
    }
  };

  // Filtrage
  const filteredClotures = useMemo(() => {
    return clotures.filter((c) => {
      const matchType = typeFilter === 'TOUT' || c.typeCloture === typeFilter;
      const q = search.toLowerCase();
      const dateStr = new Date(c.dateCloture).toLocaleDateString('fr-FR');
      const valNom = (c.utilisateurValidationNom || '').toLowerCase();
      const valRole = (c.utilisateurValidationRole || '').toLowerCase();
      const matchSearch =
        !q ||
        dateStr.includes(q) ||
        valNom.includes(q) ||
        valRole.includes(q) ||
        c.chiffreAffairesTtc.toString().includes(q);

      return matchType && matchSearch;
    });
  }, [clotures, search, typeFilter]);

  // Agrégats
  const stats = useMemo(() => {
    let totalTtc = 0;
    let totalBenefice = 0;
    let totalTva = 0;
    let totalVentes = 0;
    clotures.forEach((c) => {
      totalTtc += c.chiffreAffairesTtc;
      totalBenefice += c.beneficeBrutTotal;
      totalTva += c.tvaCollectee;
      totalVentes += c.nombreVentes;
    });
    return { totalTtc, totalBenefice, totalTva, totalVentes, count: clotures.length };
  }, [clotures]);

  // Export CSV
  const exportCSV = () => {
    if (clotures.length === 0) {
      toast.info('Aucune donnée à exporter');
      return;
    }
    const headers = [
      'Date Clôture',
      'Statut / Type',
      'Validé par',
      'Rôle Validateur',
      'Date & Heure Validation',
      'CA HT (FCFA)',
      'TVA Collectée (FCFA)',
      'CA Total TTC (FCFA)',
      'Bénéfice Brut (FCFA)',
      'Nb Ventes',
      'Nb Articles Vendus',
    ];

    const rows = filteredClotures.map((c) => [
      new Date(c.dateCloture).toLocaleDateString('fr-FR'),
      c.typeCloture === 'AUTOMATIQUE' ? 'Automatique (00:00)' : 'Manuelle',
      c.utilisateurValidationNom || 'Système',
      c.utilisateurValidationRole || 'SYSTEME',
      new Date(c.dateValidation).toLocaleString('fr-FR'),
      c.chiffreAffairesHt,
      c.tvaCollectee,
      c.chiffreAffairesTtc,
      c.beneficeBrutTotal,
      c.nombreVentes,
      c.nombreArticlesVendus,
    ]);

    exportToCSV({
      filename: `clotures_journalieres_${new Date().toISOString().split('T')[0]}`,
      headers,
      data: rows,
    });
    toast.success('Fichier CSV généré avec succès');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppLayout currentPath="/finances">
      <Topbar
        title="Journal des Clôtures Journalières"
        subtitle="Historique certifié, traçabilité des validations manuelles & automatiques à 00:00"
      />

      <div className="px-6 py-6 max-w-screen-2xl mx-auto space-y-6">
        {/* Navigation retour & Boutons d'action */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link
            href="/finances"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Retour au tableau de bord Finances</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsManualClotureOpen(true)}
              className="btn-primary flex items-center gap-1.5 text-sm py-2 px-4 shadow-sm"
            >
              <CheckCircle2 size={16} />
              <span>Clôturer la journée d'aujourd'hui</span>
            </button>
            <button
              onClick={exportCSV}
              className="btn-secondary flex items-center gap-1.5 text-sm py-2 px-3"
              title="Exporter en CSV"
            >
              <FileSpreadsheet size={15} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="btn-secondary flex items-center gap-1.5 text-sm py-2 px-3"
              title="Imprimer"
            >
              <Printer size={15} />
              <span className="hidden sm:inline">Imprimer</span>
            </button>
          </div>
        </div>

        {/* Cartes de synthèse de l'historique des clôtures */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-base p-4 border-l-4 border-l-blue-600">
            <p className="text-xs uppercase font-semibold text-muted-foreground">Clôtures au total</p>
            <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">{stats.count}</p>
            <p className="text-xs text-muted-foreground mt-1">Jours enregistrés</p>
          </div>
          <div className="card-base p-4 border-l-4 border-l-emerald-600">
            <p className="text-xs uppercase font-semibold text-muted-foreground">CA TTC Total Clôturé</p>
            <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">
              {stats.totalTtc.toLocaleString('fr-FR')} {devise}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Recettes cumulées</p>
          </div>
          <div className="card-base p-4 border-l-4 border-l-indigo-600">
            <p className="text-xs uppercase font-semibold text-muted-foreground">Bénéfice Brut Total</p>
            <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">
              {stats.totalBenefice.toLocaleString('fr-FR')} {devise}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Marge brute consolidée</p>
          </div>
          <div className="card-base p-4 border-l-4 border-l-amber-500">
            <p className="text-xs uppercase font-semibold text-muted-foreground">TVA Collectée Totale</p>
            <p className="text-2xl font-bold text-foreground mt-1 tabular-nums">
              {stats.totalTva.toLocaleString('fr-FR')} {devise}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{stats.totalVentes} ventes clôturées</p>
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="card-base p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Rechercher par date, validateur, rôle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Type :</span>
            <div className="flex bg-muted p-1 rounded-lg text-xs font-medium">
              {(
                [
                  { key: 'TOUT', label: 'Toutes' },
                  { key: 'MANUELLE', label: 'Manuelles' },
                  { key: 'AUTOMATIQUE', label: 'Automatiques (00:00)' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setTypeFilter(tab.key)}
                  className={`px-3 py-1 rounded-md transition-all ${
                    typeFilter === tab.key ? 'bg-card text-foreground font-semibold shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table des Clôtures */}
        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground">Date Journée</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground">Type & Heure</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground">Validé par</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-muted-foreground">CA HT</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-muted-foreground">TVA</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-muted-foreground">Total TTC</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-muted-foreground">Bénéfice</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-muted-foreground">Ventes / Arts</th>
                  <th className="text-center px-5 py-3.5 text-xs font-semibold text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-muted-foreground">
                      <Loader2 className="animate-spin mx-auto mb-2 text-primary" size={24} />
                      Chargement de la liste des clôtures...
                    </td>
                  </tr>
                ) : filteredClotures.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-muted-foreground">
                      Aucune clôture ne correspond à vos critères.
                    </td>
                  </tr>
                ) : (
                  filteredClotures.map((c) => {
                    const isAuto = c.typeCloture === 'AUTOMATIQUE';
                    const dateValidation = new Date(c.dateValidation);
                    const timeStr = isAuto
                      ? '00:00 (Auto)'
                      : dateValidation.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

                    return (
                      <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-foreground">
                          {new Date(c.dateCloture).toLocaleDateString('fr-FR', {
                            weekday: 'short',
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                              isAuto
                                ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                                : 'bg-green-500/10 text-green-700 border border-green-500/20'
                            }`}
                          >
                            <Clock size={12} />
                            {timeStr}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                              <User size={12} />
                            </div>
                            <div>
                              <p className="font-medium text-xs text-foreground leading-tight">
                                {c.utilisateurValidationNom || 'Système'}
                              </p>
                              {c.utilisateurValidationRole && (
                                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                                  {c.utilisateurValidationRole}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right tabular-nums text-muted-foreground">
                          {c.chiffreAffairesHt.toLocaleString('fr-FR')} {devise}
                        </td>
                        <td className="px-5 py-3.5 text-right tabular-nums text-muted-foreground">
                          {c.tvaCollectee.toLocaleString('fr-FR')} {devise}
                        </td>
                        <td className="px-5 py-3.5 text-right tabular-nums font-bold text-foreground">
                          {c.chiffreAffairesTtc.toLocaleString('fr-FR')} {devise}
                        </td>
                        <td className="px-5 py-3.5 text-right tabular-nums font-semibold text-emerald-600">
                          +{c.beneficeBrutTotal.toLocaleString('fr-FR')} {devise}
                        </td>
                        <td className="px-5 py-3.5 text-center tabular-nums text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">{c.nombreVentes}</span> v. /{' '}
                          <span>{c.nombreArticlesVendus}</span> art.
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={() => setSelectedCloture(c)}
                            className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1 mx-auto"
                            title="Consulter le ticket de clôture"
                          >
                            <Eye size={12} />
                            <span>Ticket</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Détails Ticket de Clôture */}
      {selectedCloture && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border border-border rounded-xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-lg text-foreground">Ticket Récapitulatif de Clôture</h3>
                <p className="text-xs text-muted-foreground">
                  Journée du {new Date(selectedCloture.dateCloture).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <button
                onClick={() => setSelectedCloture(null)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="bg-muted/50 p-3 rounded-lg space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode de clôture :</span>
                  <span className="font-semibold text-foreground">
                    {selectedCloture.typeCloture === 'AUTOMATIQUE'
                      ? 'Automatique système (00:00)'
                      : 'Manuelle certifiée'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Validateur :</span>
                  <span className="font-semibold text-foreground">
                    {selectedCloture.utilisateurValidationNom} ({selectedCloture.utilisateurValidationRole || 'UTILISATEUR'})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date & Heure d'enregistrement :</span>
                  <span className="font-semibold text-foreground">
                    {new Date(selectedCloture.dateValidation).toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-border text-sm pt-2">
                <div className="py-2 flex justify-between">
                  <span className="text-muted-foreground">Nombre de ventes validées :</span>
                  <span className="font-bold tabular-nums text-foreground">{selectedCloture.nombreVentes}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-muted-foreground">Nombre total d'articles vendus :</span>
                  <span className="font-bold tabular-nums text-foreground">{selectedCloture.nombreArticlesVendus}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-muted-foreground">Chiffre d'Affaires HT :</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {selectedCloture.chiffreAffairesHt.toLocaleString('fr-FR')} {devise}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-muted-foreground">TVA Collectée :</span>
                  <span className="font-semibold tabular-nums text-muted-foreground">
                    {selectedCloture.tvaCollectee.toLocaleString('fr-FR')} {devise}
                  </span>
                </div>
                <div className="py-2 flex justify-between text-base">
                  <span className="font-bold text-foreground">Chiffre d'Affaires TTC :</span>
                  <span className="font-extrabold tabular-nums text-primary">
                    {selectedCloture.chiffreAffairesTtc.toLocaleString('fr-FR')} {devise}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="font-medium text-emerald-600">Bénéfice Brut (Marge commerciale) :</span>
                  <span className="font-bold tabular-nums text-emerald-600">
                    +{selectedCloture.beneficeBrutTotal.toLocaleString('fr-FR')} {devise}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setSelectedCloture(null)}
                className="btn-secondary text-sm py-2 px-4"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation Clôture Manuelle */}
      {isManualClotureOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border border-border rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600 border-b border-border pb-3">
              <AlertCircle size={24} />
              <h3 className="font-bold text-lg text-foreground">Confirmer la Clôture Journalière</h3>
            </div>

            <p className="text-sm text-muted-foreground">
              Vous êtes sur le point d'effectuer la clôture comptable officielle de la journée d'aujourd'hui.
              Toutes les recettes et marges seront consolidées et horodatées avec votre identifiant d'opérateur.
            </p>

            <div className="bg-muted/40 p-3 rounded-lg text-xs space-y-1">
              <p>
                <strong>Date de clôture :</strong> {new Date().toLocaleDateString('fr-FR')}
              </p>
              <p className="text-muted-foreground">
                Cette opération est irréversible pour la journée en cours.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                onClick={() => setIsManualClotureOpen(false)}
                className="btn-secondary text-sm py-2 px-4"
                disabled={cloturing}
              >
                Annuler
              </button>
              <button
                onClick={handleManualCloture}
                disabled={cloturing}
                className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5"
              >
                {cloturing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                <span>Valider la clôture maintenant</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
