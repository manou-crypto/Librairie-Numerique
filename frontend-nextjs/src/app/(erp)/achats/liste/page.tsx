'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { Search, Loader2, Download, History, Truck } from 'lucide-react';
import { achatsService, AchatItem } from '@/services/achats.service';
import { useAppConfig } from '@/contexts/ConfigContext';
import { toast } from 'sonner';

const STATUT_CONFIG: Record<string, { label: string; className: string }> = {
  EN_ATTENTE: { label: 'En attente', className: 'badge-draft' },
  RECU: { label: 'Reçu', className: 'badge-active' },
  ANNULE: { label: 'Annulé', className: 'badge-rupture' },
};

export default function AchatsListePage() {
  const { config } = useAppConfig();
  const devise = config?.devise || 'FCFA';

  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [filterDateDebut, setFilterDateDebut] = useState('');
  const [filterDateFin, setFilterDateFin] = useState('');
  const [achats, setAchats] = useState<AchatItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAchats = async () => {
    setLoading(true);
    try {
      setAchats(await achatsService.getAll());
    } catch {
      toast.error('Erreur lors du chargement des achats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAchats();
  }, []);

  // Export CSV
  const exportCSV = () => {
    if (filtered.length === 0) return toast.error('Aucune donnée à exporter');
    const headers = [
      'Référence',
      'Fournisseur',
      'Créé le',
      'Saisi par',
      'Montant HT',
      'Montant TTC',
      'Montant Payé',
      'Reste à payer',
      'Mode Paiement',
      'Statut',
    ];
    const rows = filtered.map((a) => [
      a.numeroFactureFournisseur,
      a.fournisseurNom,
      new Date(a.createdAt).toLocaleString('fr-FR'),
      a.utilisateurNom,
      a.montantTotalHt.toFixed(2),
      a.montantTotalTtc.toFixed(2),
      (a.montantPaye || 0).toFixed(2),
      (a.montantTotalTtc - (a.montantPaye || 0)).toFixed(2),
      a.modePaiement || '-',
      STATUT_CONFIG[a.statutAchat]?.label || a.statutAchat,
    ]);
    const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tracabilite_achats_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Export CSV téléchargé !');
  };

  // Filtrage avec dates
  const filtered = achats.filter((a) => {
    const matchSearch =
      a.numeroFactureFournisseur.toLowerCase().includes(search.toLowerCase()) ||
      a.fournisseurNom.toLowerCase().includes(search.toLowerCase()) ||
      a.utilisateurNom.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === 'all' || a.statutAchat === filterStatut;
    const matchDateDebut = !filterDateDebut || a.createdAt >= filterDateDebut;
    const matchDateFin = !filterDateFin || a.createdAt <= filterDateFin + 'T23:59:59';
    return matchSearch && matchStatut && matchDateDebut && matchDateFin;
  });

  const totalEngageTtc = achats.reduce((s, a) => s + (a.montantTotalTtc || a.montantTotalHt || 0), 0);
  const totalPaye = achats.reduce((s, a) => s + (a.montantPaye || 0), 0);
  const totalImpayes = achats.reduce((s, a) => {
    if (a.statutAchat === 'ANNULE') return s;
    const reste = Math.max(0, (a.montantTotalTtc || a.montantTotalHt || 0) - (a.montantPaye || 0));
    return s + reste;
  }, 0);
  const nbImpayes = achats.filter((a) => {
    if (a.statutAchat === 'ANNULE') return false;
    const reste = Math.max(0, (a.montantTotalTtc || a.montantTotalHt || 0) - (a.montantPaye || 0));
    return reste > 0;
  }).length;

  return (
    <AppLayout currentPath="/achats/liste">
      <Topbar
        title="Traçabilité des Achats"
        subtitle="Historique complet des saisies avec suivi utilisateur et impayés"
      />
      <div className="px-6 py-6 max-w-screen-2xl mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="kpi-card-info">
            <p className="text-xs text-muted-foreground mb-1">Total Achats (TTC)</p>
            <p className="text-xl font-bold text-foreground tabular-nums">
              {totalEngageTtc.toLocaleString('fr-FR')} {devise}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{achats.length} commandes enregistrées</p>
          </div>
          <div className="kpi-card-positive">
            <p className="text-xs text-muted-foreground mb-1">Total Réglé (Payé)</p>
            <p className="text-xl font-bold text-positive tabular-nums">
              {totalPaye.toLocaleString('fr-FR')} {devise}
            </p>
            <p className="text-xs text-positive mt-1">Montants décaissés</p>
          </div>
          <div className="kpi-card-negative">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-negative font-semibold">Dettes Fournisseurs</p>
              {nbImpayes > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-negative text-white font-bold">
                  {nbImpayes} impayé{nbImpayes > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xl font-bold text-negative tabular-nums">
              {totalImpayes.toLocaleString('fr-FR')} {devise}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Reste à payer total</p>
          </div>
        </div>

        <div className="card-base overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Réf, fournisseur, utilisateur..."
                className="input-field pl-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="date"
                value={filterDateDebut}
                onChange={(e) => setFilterDateDebut(e.target.value)}
                className="input-field text-sm w-auto"
                title="Date de création (Début)"
              />
              <input
                type="date"
                value={filterDateFin}
                onChange={(e) => setFilterDateFin(e.target.value)}
                className="input-field text-sm w-auto"
                title="Date de création (Fin)"
              />
              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                className="input-field text-sm w-auto"
              >
                <option value="all">Tous les statuts</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="RECU">Reçu</option>
                <option value="ANNULE">Annulé</option>
              </select>
              <button
                onClick={exportCSV}
                className="btn-primary flex items-center gap-1.5 text-sm py-2"
              >
                <Download size={14} /> Exporter CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Référence
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Fournisseur
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Montant TTC
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Payé / Reste
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Traçabilité (Saisi par)
                  </th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      <Loader2 className="animate-spin mx-auto mb-2" size={24} /> Chargement...
                    </td>
                  </tr>
                ) : (
                  filtered.map((achat, idx) => (
                    <tr
                      key={achat.id}
                      className={`border-b border-border table-row-hover ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}
                    >
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                        {achat.numeroFactureFournisseur}
                      </td>
                      <td className="px-5 py-3 font-medium text-foreground">
                        {achat.fournisseurNom}
                      </td>
                      <td className="px-5 py-3 tabular-nums font-semibold text-foreground">
                        {achat.montantTotalTtc.toLocaleString('fr-FR')} {devise}
                      </td>
                      <td className="px-5 py-3 tabular-nums">
                        <div className="text-sm text-foreground">
                          Payé: {(achat.montantPaye || 0).toLocaleString('fr-FR')} {devise}
                        </div>
                        <div className="text-xs font-semibold text-rupture">
                          Reste: {(achat.montantTotalTtc - (achat.montantPaye || 0)).toLocaleString('fr-FR')} {devise}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {achat.modePaiement || 'Non spécifié'}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <History size={13} className="text-muted-foreground" />
                          <div>
                            <div className="text-foreground font-medium">{achat.utilisateurNom}</div>
                            <div className="text-[10px] text-muted-foreground">
                              Créé le : {new Date(achat.createdAt).toLocaleString('fr-FR')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={STATUT_CONFIG[achat.statutAchat]?.className}>
                          {STATUT_CONFIG[achat.statutAchat]?.label}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!loading && filtered.length === 0 && (
            <div className="py-16 text-center">
              <Truck size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Aucun historique d&apos;achat trouvé</p>
            </div>
          )}
          <div className="px-5 py-3 border-t border-border text-xs text-muted-foreground">
            {!loading ? filtered.length : 0} résultat{!loading && filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
