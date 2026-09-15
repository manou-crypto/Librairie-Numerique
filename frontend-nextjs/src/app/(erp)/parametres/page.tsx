'use client';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import {
  Save,
  Store,
  Globe,
  Bell,
  Shield,
  Database,
  Upload,
  CheckCircle,
  Download,
  Camera,
  Tag,
  Trash2,
  Plus,
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';
import { useAppConfig } from '@/contexts/ConfigContext';
import { configService } from '@/services/config.service';
import { produitsService, TypeVenteItem } from '@/services/produits.service';
import { toast } from 'sonner';
import { usePreferences, UserPreferences } from '@/hooks/usePreferences';
import { useAuth } from '@/hooks/useAuth';

type SettingsTab = 'general' | 'notifications' | 'ventes' | 'securite' | 'sauvegarde';

export default function ParametresPage() {
  const { config, refreshConfig } = useAppConfig();
  const { preferences, updatePreferences } = usePreferences();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [loading, setLoading] = useState(false);

  const hasGererTarifsPerm = user?.role === 'ADMIN' || user?.permissions?.includes('GERER_TARIFS');

  const [general, setGeneral] = useState({
    nom_librairie: '',
    logo_url: '',
    devise: 'DZD',
    tva: 0,
  });

  // Mettre à jour l'état local quand la configuration charge
  React.useEffect(() => {
    if (config) {
      setGeneral({
        nom_librairie: config.nom_librairie || '',
        logo_url: config.logo_url || '',
        devise: config.devise || 'DZD',
        tva: config.tva || 0,
      });
    }
  }, [config]);

  const [notifs, setNotifs] = useState({
    stockBas: preferences.notifStockBas ?? true,
    nouvelleVente: preferences.notifNouvelleVente ?? false,
    rapportJournalier: preferences.notifRapportJournalier ?? true,
    alerteRupture: preferences.notifAlerteRupture ?? true,
    emailNotifs: preferences.notifEmail ?? true,
  });

  const [typesVente, setTypesVente] = useState<TypeVenteItem[]>([]);
  const [newType, setNewType] = useState('');

  React.useEffect(() => {
    produitsService.getTypesVente().then(setTypesVente).catch(() => {});
  }, []);

  const handleAddTypeVente = async () => {
    if (!newType.trim()) return;
    try {
      const res = await produitsService.createTypeVente({ libelle: newType });
      setTypesVente([...typesVente, res]);
      setNewType('');
      toast.success('Type de vente ajouté');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'ajout');
    }
  };

  const handleDeleteTypeVente = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce type de vente ?')) return;
    try {
      await produitsService.deleteTypeVente(id);
      setTypesVente(typesVente.filter((t) => t.id !== id));
      toast.success('Type de vente supprimé');
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la suppression');
    }
  };

  const handleSave = async () => {
    if (activeTab === 'general') {
      setLoading(true);
      try {
        await configService.updateConfiguration(general);
        await refreshConfig();
        toast.success('Configuration générale enregistrée !');
      } catch (err: any) {
        toast.error(err.message || 'Erreur de sauvegarde');
      } finally {
        setLoading(false);
      }
    } else if (activeTab === 'notifications') {
      updatePreferences({
        notifStockBas: notifs.stockBas,
        notifNouvelleVente: notifs.nouvelleVente,
        notifRapportJournalier: notifs.rapportJournalier,
        notifAlerteRupture: notifs.alerteRupture,
        notifEmail: notifs.emailNotifs,
      });
      toast.success('Préférences de notification enregistrées !');
    }
  };

  const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: 'Général', icon: Store },
    ...(hasGererTarifsPerm ? [{ id: 'ventes' as SettingsTab, label: 'Ventes & Tarifs', icon: Tag }] : []),
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'securite', label: 'Sécurité', icon: Shield },
    { id: 'sauvegarde', label: 'Sauvegarde', icon: Database },
  ];

  return (
    <AppLayout currentPath="/parametres">
      <Topbar title="Paramètres" subtitle="Configuration générale de l'application" />
      <div className="px-6 py-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit flex-wrap">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
        {activeTab === 'general' && (
          <div className="card-base p-6 space-y-5">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Store size={16} className="text-primary" /> Informations de la librairie
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Nom de la librairie
                </label>
                <input
                  type="text"
                  value={general.nom_librairie}
                  onChange={(e) => setGeneral({ ...general, nom_librairie: e.target.value })}
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  URL du Logo (optionnel)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={general.logo_url}
                    onChange={(e) => setGeneral({ ...general, logo_url: e.target.value })}
                    className="input-field text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="border-t border-border pt-5">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Globe size={16} className="text-primary" /> Paramètres financiers globaux
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Devise principale
                  </label>
                  <select
                    value={general.devise}
                    onChange={(e) => setGeneral({ ...general, devise: e.target.value })}
                    className="input-field text-sm"
                  >
                    <option value="DZD">DZD — Dinar Algérien</option>
                    <option value="XOF">XOF — Franc CFA (BCEAO)</option>
                    <option value="XAF">XAF — Franc CFA (BEAC)</option>
                    <option value="MAD">MAD — Dirham Marocain</option>
                    <option value="TND">TND — Dinar Tunisien</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="USD">USD — Dollar US</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    TVA par défaut (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={general.tva}
                    onChange={(e) =>
                      setGeneral({ ...general, tva: parseFloat(e.target.value) || 0 })
                    }
                    className="input-field text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'notifications' && (
          <div className="card-base p-6 space-y-5">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Bell size={16} className="text-primary" /> Préférences de notifications
            </h3>
            <div className="space-y-4">
              {[
                {
                  key: 'stockBas',
                  label: 'Alerte stock bas',
                  desc: 'Notifier quand un produit passe sous le seuil minimum',
                },
                {
                  key: 'alerteRupture',
                  label: 'Alerte rupture de stock',
                  desc: 'Notifier immédiatement en cas de rupture',
                },
                {
                  key: 'nouvelleVente',
                  label: 'Nouvelle vente',
                  desc: 'Notification à chaque vente enregistrée',
                },
                {
                  key: 'rapportJournalier',
                  label: 'Rapport journalier',
                  desc: 'Envoyer un résumé quotidien par email',
                },
                {
                  key: 'emailNotifs',
                  label: 'Notifications par email',
                  desc: 'Recevoir les alertes par email',
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <button
                    onClick={() =>
                      setNotifs({ ...notifs, [item.key]: !notifs[item.key as keyof typeof notifs] })
                    }
                    className={`relative w-10 h-5 rounded-full transition-colors flex items-center ${notifs[item.key as keyof typeof notifs] ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <span
                      className={`absolute left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${notifs[item.key as keyof typeof notifs] ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'ventes' && hasGererTarifsPerm && (
          <div className="card-base p-6 space-y-5">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Tag size={16} className="text-primary" /> Types de Ventes (Tarification)
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Gérez les différents types de ventes (ex: Détail, Gros, VIP) pour appliquer une tarification dynamique dans le catalogue et sur le point de vente.
            </p>
            <div className="space-y-4 max-w-md">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nouveau type (ex: Gros)"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="input-field text-sm flex-1"
                />
                <button
                  onClick={handleAddTypeVente}
                  disabled={!newType.trim()}
                  className="btn-primary py-2 px-4 flex items-center gap-1 text-sm disabled:opacity-50"
                >
                  <Plus size={16} /> Ajouter
                </button>
              </div>
              <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
                {typesVente.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 bg-card hover:bg-muted/50">
                    <span className="text-sm font-medium">{t.libelle}</span>
                    <button
                      onClick={() => handleDeleteTypeVente(t.id)}
                      className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {typesVente.length === 0 && (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Aucun type de vente configuré.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'securite' && (
          <div className="card-base p-6 space-y-5">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Shield size={16} className="text-primary" /> Sécurité & Accès
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Durée de session (minutes)
                </label>
                <select className="input-field text-sm w-auto">
                  <option>30</option>
                  <option>60</option>
                  <option>120</option>
                  <option>480</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Tentatives de connexion max
                </label>
                <select className="input-field text-sm w-auto">
                  <option>3</option>
                  <option>5</option>
                  <option>10</option>
                </select>
              </div>
              <div className="flex items-center justify-between py-3 border-t border-border">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Double authentification (2FA)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Renforcer la sécurité des comptes admin
                  </p>
                </div>
                <button className="relative w-10 h-5 rounded-full bg-muted transition-colors flex items-center">
                  <span className="absolute left-0.5 w-4 h-4 rounded-full bg-white shadow" />
                </button>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-xs text-amber-700 font-medium">
                  ⚠️ Les modifications de sécurité s'appliquent à tous les utilisateurs.
                  Assurez-vous de communiquer les changements à votre équipe.
                </p>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'sauvegarde' && (
          <div className="card-base p-6 space-y-5">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Database size={16} className="text-primary" /> Sauvegarde des données
            </h3>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle size={18} className="text-positive shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-positive">Dernière sauvegarde réussie</p>
                  <p className="text-xs text-muted-foreground">03/08/2026 à 02:00 — Automatique</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Fréquence de sauvegarde automatique
                </label>
                <select className="input-field text-sm w-auto">
                  <option>Quotidienne</option>
                  <option>Hebdomadaire</option>
                  <option>Mensuelle</option>
                </select>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button className="btn-primary flex items-center gap-1.5 text-sm py-2">
                  <Download size={14} /> Sauvegarder maintenant
                </button>
                <button className="btn-secondary flex items-center gap-1.5 text-sm py-2">
                  <Upload size={14} /> Restaurer
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary flex items-center gap-1.5 text-sm py-2.5 px-5"
          >
            <Save size={14} /> {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
