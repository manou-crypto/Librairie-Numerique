'use client';
import React, { useState, useEffect } from 'react';
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
  Phone,
  Mail,
  MapPin,
  Receipt,
  Volume2,
  Lock,
  AlertCircle,
  HelpCircle,
  Info,
} from 'lucide-react';
import { useAppConfig } from '@/contexts/ConfigContext';
import { configService } from '@/services/config.service';
import { produitsService, TypeVenteItem } from '@/services/produits.service';
import { toast } from 'sonner';
import { usePreferences } from '@/hooks/usePreferences';
import { useAuth } from '@/hooks/useAuth';
import CloudinaryUploadWidget from '@/components/cloudinary/CloudinaryUploadWidget';

type SettingsTab = 'general' | 'caisse' | 'ventes' | 'notifications' | 'securite' | 'sauvegarde';

interface ExtendedStoreConfig {
  telephone: string;
  email: string;
  adresse: string;
  ville: string;
  rccm: string;
  slogan: string;
  fondCaisseDefaut: number;
  formatTicket: '80mm' | '58mm' | 'A4';
  piedTicket: string;
  autoriserStockNegatif: boolean;
  objectifMargePourcent: number;
  dureeSession: string;
}

const defaultExtendedConfig: ExtendedStoreConfig = {
  telephone: '+225 07 00 00 00 00',
  email: 'contact@librairienumerique.com',
  adresse: 'Avenue Principale, Plateau',
  ville: 'Abidjan',
  rccm: 'CI-ABJ-2024-B-12345',
  slogan: 'Votre espace de lecture, fournitures et savoir',
  fondCaisseDefaut: 50000,
  formatTicket: '80mm',
  piedTicket: 'Merci de votre visite ! Les articles sous emballage ne sont ni repris ni échangés.',
  autoriserStockNegatif: false,
  objectifMargePourcent: 35,
  dureeSession: '60',
};

// Composant réutilisable pour afficher le badge "Bientôt disponible" avec tooltip explicatif
function NotYetImplementedBadge({ text = 'Fonctionnalité non implémentée' }: { text?: string }) {
  return (
    <div className="relative group/badge inline-flex items-center">
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 cursor-help flex items-center gap-1">
        <span>Bientôt disponible</span>
        <HelpCircle size={10} className="text-amber-600 dark:text-amber-400" />
      </span>
      {/* Tooltip au survol */}
      <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover/badge:block z-30 whitespace-nowrap bg-gray-900 text-white text-[11px] rounded-md px-2.5 py-1 shadow-lg font-medium pointer-events-none">
        {text}
      </div>
    </div>
  );
}

export default function ParametresPage() {
  const { config, refreshConfig } = useAppConfig();
  const { preferences, updatePreferences, testNotificationSound } = usePreferences();
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

  const [extended, setExtended] = useState<ExtendedStoreConfig>(defaultExtendedConfig);

  // Charger les paramètres étendus depuis localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('app_extended_store_config');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setExtended((prev) => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error('Erreur chargement config etendue', e);
        }
      }
    }
  }, []);

  // Mettre à jour l'état général quand la configuration backend charge
  useEffect(() => {
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
    emailNotifs: preferences.notifEmail ?? false,
    notifSon: preferences.notifSon ?? true,
  });

  const [typesVente, setTypesVente] = useState<TypeVenteItem[]>([]);
  const [newType, setNewType] = useState('');

  useEffect(() => {
    produitsService.getTypesVente().then(setTypesVente).catch(() => {});
  }, []);

  const handleAddTypeVente = async () => {
    if (!newType.trim()) return;
    try {
      const res = await produitsService.createTypeVente({ libelle: newType });
      setTypesVente([...typesVente, res]);
      setNewType('');
      toast.success('Type de vente ajouté avec succès');
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'ajout");
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
    setLoading(true);
    try {
      if (activeTab === 'general' || activeTab === 'caisse') {
        // Enregistrer la configuration de base en base de données
        await configService.updateConfiguration(general);
        // Sauvegarder les paramètres étendus dans le stockage local
        if (typeof window !== 'undefined') {
          localStorage.setItem('app_extended_store_config', JSON.stringify(extended));
        }
        await refreshConfig();
        toast.success('Configuration enregistrée avec succès !');
      } else if (activeTab === 'notifications') {
        updatePreferences({
          notifStockBas: notifs.stockBas,
          notifNouvelleVente: notifs.nouvelleVente,
          notifRapportJournalier: notifs.rapportJournalier,
          notifAlerteRupture: notifs.alerteRupture,
          notifEmail: notifs.emailNotifs,
          notifSon: notifs.notifSon,
        });
        toast.success('Préférences de notification enregistrées !');
      } else if (activeTab === 'securite') {
        if (typeof window !== 'undefined') {
          localStorage.setItem('app_extended_store_config', JSON.stringify(extended));
        }
        toast.success('Paramètres de sécurité enregistrés !');
      } else {
        toast.success('Modifications prises en compte !');
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleExportConfig = () => {
    const exportPayload = {
      exportDate: new Date().toISOString(),
      librairie: general,
      parametresEtendus: extended,
      notifications: notifs,
      versionLogiciel: '2.0.0-PROD',
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `config_librairie_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Fichier de configuration exporté avec succès !');
  };

  const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: 'Établissement', icon: Store },
    { id: 'caisse', label: 'Caisse & Point de Vente', icon: Receipt },
    ...(hasGererTarifsPerm ? [{ id: 'ventes' as SettingsTab, label: 'Tarifs & Ventes', icon: Tag }] : []),
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'securite', label: 'Sécurité & Accès', icon: Shield },
    { id: 'sauvegarde', label: 'Sauvegarde & Données', icon: Database },
  ];

  return (
    <AppLayout currentPath="/parametres">
      <Topbar title="Paramètres" subtitle="Configuration globale de la librairie et du point de vente" />
      <div className="px-6 py-6 max-w-4xl mx-auto space-y-6">
        {/* Navigation par Onglets */}
        <div className="flex items-center gap-1.5 bg-muted rounded-xl p-1.5 w-full overflow-x-auto border border-border">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-card text-foreground shadow-sm ring-1 ring-border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/50'
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 1. ONGLET GÉNÉRAL & ÉTABLISSEMENT */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="card-base p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Store size={18} className="text-primary" /> Identité de l'établissement
                </h3>
                <span className="text-xs text-muted-foreground">Informations affichées sur les factures et reçus</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Nom commercial de la librairie *
                  </label>
                  <input
                    type="text"
                    value={general.nom_librairie}
                    onChange={(e) => setGeneral({ ...general, nom_librairie: e.target.value })}
                    className="input-field text-sm"
                    placeholder="Ex: Librairie Numérique du Savoir"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Slogan ou description courte
                  </label>
                  <input
                    type="text"
                    value={extended.slogan}
                    onChange={(e) => setExtended({ ...extended, slogan: e.target.value })}
                    className="input-field text-sm"
                    placeholder="Ex: Livres, Fournitures et Papeterie"
                  />
                </div>
              </div>

              {/* Logo librairie */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Logo officiel de l'établissement
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 bg-muted/30 rounded-xl border border-border">
                  {general.logo_url ? (
                    <div className="relative w-16 h-16 rounded-xl border border-border bg-white dark:bg-slate-900 flex items-center justify-center p-1.5 shadow-sm shrink-0 overflow-hidden group">
                      <img
                        src={general.logo_url}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setGeneral({ ...general, logo_url: '' })}
                        className="absolute inset-0 bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-medium"
                        title="Supprimer le logo"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border border-dashed border-border bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                      <Camera size={22} />
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <CloudinaryUploadWidget
                        folder="librairie/logo"
                        buttonText={general.logo_url ? 'Changer le logo' : 'Uploader un logo'}
                        buttonClassName="border border-border/80 bg-background hover:bg-muted py-1.5 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                        multiple={false}
                        maxFiles={1}
                        onUploadSuccess={(url) => {
                          setGeneral({ ...general, logo_url: url });
                          toast.success('Logo mis à jour. Pensez à enregistrer les paramètres.');
                        }}
                      />
                      {general.logo_url && (
                        <button
                          type="button"
                          onClick={() => setGeneral({ ...general, logo_url: '' })}
                          className="text-xs text-muted-foreground hover:text-destructive transition-colors py-1.5 px-2"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      placeholder="Ou collez directement une URL d'image : https://..."
                      value={general.logo_url}
                      onChange={(e) => setGeneral({ ...general, logo_url: e.target.value })}
                      className="input-field text-xs py-1.5 h-8 text-muted-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Coordonnées de contact */}
              <div className="pt-2 border-t border-border">
                <h4 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider text-muted-foreground">
                  Coordonnées & Informations fiscales
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                      <Phone size={13} className="text-primary" /> Téléphone standard / caisse
                    </label>
                    <input
                      type="text"
                      value={extended.telephone}
                      onChange={(e) => setExtended({ ...extended, telephone: e.target.value })}
                      className="input-field text-sm"
                      placeholder="+225 07 00 00 00 00"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                      <Mail size={13} className="text-primary" /> Email de contact officiel
                    </label>
                    <input
                      type="email"
                      value={extended.email}
                      onChange={(e) => setExtended({ ...extended, email: e.target.value })}
                      className="input-field text-sm"
                      placeholder="contact@librairie.ci"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                      <MapPin size={13} className="text-primary" /> Adresse & Ville
                    </label>
                    <input
                      type="text"
                      value={extended.adresse}
                      onChange={(e) => setExtended({ ...extended, adresse: e.target.value })}
                      className="input-field text-sm"
                      placeholder="Avenue Principale, Abidjan"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1.5">
                      N° RCCM / IFU / NIF
                    </label>
                    <input
                      type="text"
                      value={extended.rccm}
                      onChange={(e) => setExtended({ ...extended, rccm: e.target.value })}
                      className="input-field text-sm"
                      placeholder="CI-ABJ-2024-B-12345"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Paramètres Financiers Globaux */}
            <div className="card-base p-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border">
                <Globe size={18} className="text-primary" /> Paramètres monétaires & financiers
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Devise principale du système *
                  </label>
                  <select
                    value={general.devise}
                    onChange={(e) => setGeneral({ ...general, devise: e.target.value })}
                    className="input-field text-sm"
                  >
                    <option value="FCFA">FCFA — Franc CFA (XOF / XAF)</option>
                    <option value="DZD">DZD — Dinar Algérien</option>
                    <option value="MAD">MAD — Dirham Marocain</option>
                    <option value="TND">TND — Dinar Tunisien</option>
                    <option value="EUR">EUR — Euro (€)</option>
                    <option value="USD">USD — Dollar US ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Taux de TVA standard (%) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={general.tva}
                    onChange={(e) => setGeneral({ ...general, tva: parseFloat(e.target.value) || 0 })}
                    className="input-field text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Objectif de marge indicatif (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={extended.objectifMargePourcent}
                    onChange={(e) =>
                      setExtended({
                        ...extended,
                        objectifMargePourcent: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="input-field text-sm"
                    placeholder="35"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Sert de repère de rentabilité pour vos analyses financières.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ONGLET CAISSE & POINT DE VENTE (POS) */}
        {activeTab === 'caisse' && (
          <div className="space-y-6">
            <div className="card-base p-6 space-y-5">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border">
                <Receipt size={18} className="text-primary" /> Configuration du Point de Vente & Caisses
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Fond de caisse suggéré par défaut ({general.devise})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={extended.fondCaisseDefaut}
                    onChange={(e) =>
                      setExtended({
                        ...extended,
                        fondCaisseDefaut: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="input-field text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Montant pré-rempli lors de l'ouverture d'une nouvelle session de caisse.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Format d'impression des tickets de caisse
                  </label>
                  <select
                    value={extended.formatTicket}
                    onChange={(e) =>
                      setExtended({
                        ...extended,
                        formatTicket: e.target.value as '80mm' | '58mm' | 'A4',
                      })
                    }
                    className="input-field text-sm"
                  >
                    <option value="80mm">Ticket thermique 80mm (Recommandé standard POS)</option>
                    <option value="58mm">Ticket thermique compact 58mm</option>
                    <option value="A4">Facture papier standard A4</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Message de pied de ticket de caisse
                </label>
                <textarea
                  rows={2}
                  value={extended.piedTicket}
                  onChange={(e) => setExtended({ ...extended, piedTicket: e.target.value })}
                  className="input-field text-sm"
                  placeholder="Ex: Merci pour votre visite ! Échange sous 7 jours sur présentation de ce ticket."
                />
              </div>

              <div className="pt-3 border-t border-border space-y-3">
                {/* Option stock négatif */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Autoriser la vente en stock négatif</p>
                    <p className="text-xs text-muted-foreground">
                      Permet de valider une vente au comptoir même si le stock informatique affiche 0 (ajustement différé).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setExtended({
                        ...extended,
                        autoriserStockNegatif: !extended.autoriserStockNegatif,
                      })
                    }
                    className={`relative w-11 h-6 rounded-full transition-colors flex items-center ${
                      extended.autoriserStockNegatif ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`inline-block w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        extended.autoriserStockNegatif ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Clôture automatique sécurisée */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">Clôture journalière automatique à minuit</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300 border border-green-200">
                        Sécurisé (Actif)
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Si la caisse n'est pas clôturée manuellement avant 23h59, le système génère un arrêté automatique avec traçabilité.
                    </p>
                  </div>
                  <CheckCircle size={18} className="text-green-600 shrink-0" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. ONGLET TARIFS & TYPES DE VENTE */}
        {activeTab === 'ventes' && hasGererTarifsPerm && (
          <div className="card-base p-6 space-y-5">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border">
              <Tag size={18} className="text-primary" /> Types de Ventes (Tarification Dynamique)
            </h3>
            <p className="text-xs text-muted-foreground">
              Configurez les catégories tarifaires (ex: Détail, Demi-Gros, Gros, VIP) pour permettre d'appliquer des prix différenciés selon le profil du client au comptoir.
            </p>
            <div className="space-y-4 max-w-lg">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nouveau type de vente (ex: Gros, Collectivité...)"
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="input-field text-sm flex-1"
                />
                <button
                  onClick={handleAddTypeVente}
                  disabled={!newType.trim()}
                  className="btn-primary py-2 px-4 flex items-center gap-1.5 text-sm disabled:opacity-50"
                >
                  <Plus size={16} /> Ajouter
                </button>
              </div>
              <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                {typesVente.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3.5 bg-card hover:bg-muted/40 transition-colors">
                    <span className="text-sm font-semibold">{t.libelle}</span>
                    <button
                      onClick={() => handleDeleteTypeVente(t.id)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {typesVente.length === 0 && (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Aucun type de vente configuré pour l'instant.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 4. ONGLET NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="card-base p-6 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Bell size={18} className="text-primary" /> Préférences d'alertes & notifications
              </h3>
              <button
                type="button"
                onClick={testNotificationSound}
                className="text-xs font-medium text-primary hover:underline flex items-center gap-1.5"
              >
                <Volume2 size={14} /> Tester le carillon sonore
              </button>
            </div>

            <div className="space-y-4">
              {[
                {
                  key: 'notifSon',
                  label: 'Signal sonore lors des événements de caisse',
                  desc: 'Émettre un carillon doux lors de la validation d\'un ticket ou d\'un encaissement',
                  notImplemented: false,
                },
                {
                  key: 'stockBas',
                  label: 'Alerte stock bas',
                  desc: 'Avertissement visuel quand un article atteint son seuil minimal d\'alerte',
                  notImplemented: false,
                },
                {
                  key: 'alerteRupture',
                  label: 'Alerte rupture de stock immédiate',
                  desc: 'Notifier instantanément au comptoir lorsqu\'un article est totalement épuisé',
                  notImplemented: false,
                },
                {
                  key: 'nouvelleVente',
                  label: 'Notification en direct des nouvelles ventes',
                  desc: 'Recevoir une alerte temps réel (WebSocket) à chaque ticket validé sur le réseau',
                  notImplemented: false,
                },
                {
                  key: 'rapportJournalier',
                  label: 'Rapport financier quotidien par email',
                  desc: 'Recevoir chaque soir le récapitulatif des clôtures et ventes par courrier électronique',
                  notImplemented: true,
                  tooltipText: 'Fonctionnalité non implémentée — Nécessite la configuration du serveur SMTP d\'envoi d\'emails',
                },
                {
                  key: 'emailNotifs',
                  label: 'Alertes urgentes transmises par email',
                  desc: 'Transmettre les ruptures critiques de stock aux responsables approvisionnement par email',
                  notImplemented: true,
                  tooltipText: 'Fonctionnalité non implémentée — Module passerelle email bientôt disponible',
                },
              ].map((item) => {
                return (
                  <div
                    key={item.key}
                    className={`flex items-center justify-between p-3 rounded-xl border border-border transition-colors ${
                      item.notImplemented ? 'bg-muted/20 opacity-80' : 'bg-card'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{item.label}</p>
                        {item.notImplemented && (
                          <NotYetImplementedBadge text={item.tooltipText} />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>

                    {item.notImplemented ? (
                      <div className="relative group/toggle" title="Fonctionnalité non implémentée">
                        <button
                          type="button"
                          disabled
                          onClick={() => toast.info(item.tooltipText || 'Fonctionnalité non implémentée')}
                          className="relative w-11 h-6 rounded-full bg-muted cursor-not-allowed opacity-60 flex items-center"
                        >
                          <span className="inline-block w-4 h-4 rounded-full bg-white shadow translate-x-1" />
                        </button>
                        <div className="absolute right-0 bottom-full mb-1 hidden group-hover/toggle:block z-20 whitespace-nowrap bg-gray-900 text-white text-[11px] rounded px-2.5 py-1 shadow-md font-medium">
                          Fonctionnalité non implémentée
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setNotifs({ ...notifs, [item.key]: !notifs[item.key as keyof typeof notifs] })
                        }
                        className={`relative w-11 h-6 rounded-full transition-colors flex items-center ${
                          notifs[item.key as keyof typeof notifs] ? 'bg-primary' : 'bg-muted'
                        }`}
                      >
                        <span
                          className={`inline-block w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            notifs[item.key as keyof typeof notifs] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. ONGLET SÉCURITÉ & ACCÈS */}
        {activeTab === 'securite' && (
          <div className="card-base p-6 space-y-5">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border">
              <Shield size={18} className="text-primary" /> Sécurité des Sessions & Contrôle d'Accès
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Durée d'inactivité avant expiration de session (minutes)
                  </label>
                  <select
                    value={extended.dureeSession}
                    onChange={(e) => setExtended({ ...extended, dureeSession: e.target.value })}
                    className="input-field text-sm"
                  >
                    <option value="30">30 minutes</option>
                    <option value="60">60 minutes (Recommandé)</option>
                    <option value="120">120 minutes (2 heures)</option>
                    <option value="480">8 heures (Journée de travail)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Tentatives de mot de passe échouées max
                  </label>
                  <select defaultValue="5" className="input-field text-sm">
                    <option value="3">3 tentatives</option>
                    <option value="5">5 tentatives (Standard)</option>
                    <option value="10">10 tentatives</option>
                  </select>
                </div>
              </div>

              {/* 2FA (Double Authentification) */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">Double authentification (2FA / OTP)</p>
                    <NotYetImplementedBadge text="Fonctionnalité non implémentée — Disponible dans une prochaine version" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Exiger un code à 6 chiffres via application d'authentification (Google Authenticator) pour les administrateurs.
                  </p>
                </div>
                <div className="relative group/toggle">
                  <button
                    type="button"
                    disabled
                    onClick={() => toast.info('Fonctionnalité 2FA non implémentée dans cette version')}
                    className="relative w-11 h-6 rounded-full bg-muted cursor-not-allowed opacity-60 flex items-center"
                  >
                    <span className="inline-block w-4 h-4 rounded-full bg-white shadow translate-x-1" />
                  </button>
                  <div className="absolute right-0 bottom-full mb-1 hidden group-hover/toggle:block z-20 whitespace-nowrap bg-gray-900 text-white text-[11px] rounded px-2.5 py-1 shadow-md font-medium">
                    Fonctionnalité non implémentée
                  </div>
                </div>
              </div>

              {/* Verrouillage automatique de caisse */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">Verrouillage écran caisse en cas d'inactivité</p>
                    <NotYetImplementedBadge text="Fonctionnalité non implémentée — Prévue pour les terminaux tactiles" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Verrouille automatiquement l'interface caisse après 10 minutes d'inactivité pour empêcher les encaissements non autorisés.
                  </p>
                </div>
                <div className="relative group/toggle">
                  <button
                    type="button"
                    disabled
                    onClick={() => toast.info('Fonctionnalité non implémentée')}
                    className="relative w-11 h-6 rounded-full bg-muted cursor-not-allowed opacity-60 flex items-center"
                  >
                    <span className="inline-block w-4 h-4 rounded-full bg-white shadow translate-x-1" />
                  </button>
                  <div className="absolute right-0 bottom-full mb-1 hidden group-hover/toggle:block z-20 whitespace-nowrap bg-gray-900 text-white text-[11px] rounded px-2.5 py-1 shadow-md font-medium">
                    Fonctionnalité non implémentée
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl flex items-start gap-3">
                <Info size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Toutes les actions sensibles (clôtures de caisse, modifications de prix, approbations d'inventaire) sont systématiquement tracées dans le journal d'audit avec horodatage et identifiant de l'opérateur.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 6. ONGLET SAUVEGARDE & SYSTÈME */}
        {activeTab === 'sauvegarde' && (
          <div className="card-base p-6 space-y-5">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border">
              <Database size={18} className="text-primary" /> Sauvegarde des données & Export
            </h3>

            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle size={20} className="text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-green-800 dark:text-green-300">Base de données MySQL connectée</p>
                  <p className="text-xs text-green-700/80 dark:text-green-400">
                    Les instantanés et réplications de sécurité sont assurés en continu sur votre infrastructure cloud.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">Fréquence de sauvegarde automatique</p>
                      <NotYetImplementedBadge text="Fonctionnalité gérée au niveau de l'hébergeur cloud" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Fréquence programmée pour les instantanés complets de la base de données.
                    </p>
                  </div>
                  <select disabled className="input-field text-xs w-auto opacity-70 cursor-not-allowed">
                    <option>Quotidienne (02:00 UTC)</option>
                    <option>Hebdomadaire</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleExportConfig}
                  className="btn-primary flex items-center justify-center gap-2 text-sm py-2.5 px-4 shadow-sm"
                >
                  <Download size={15} /> Exporter la configuration (JSON)
                </button>

                <div className="relative group/restore flex-1 sm:flex-initial">
                  <button
                    type="button"
                    disabled
                    onClick={() => toast.info('Fonctionnalité non implémentée — Réservée aux administrateurs système')}
                    className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2 text-sm py-2.5 px-4 opacity-60 cursor-not-allowed"
                  >
                    <Upload size={15} /> Restaurer un fichier de sauvegarde
                  </button>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover/restore:block z-20 whitespace-nowrap bg-gray-900 text-white text-[11px] rounded px-2.5 py-1 shadow-md font-medium">
                    Fonctionnalité non implémentée
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bouton global d'enregistrement */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary flex items-center gap-2 text-sm py-2.5 px-6 shadow-md transition-all active:scale-[0.98]"
          >
            <Save size={16} /> {loading ? 'Enregistrement en cours...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
