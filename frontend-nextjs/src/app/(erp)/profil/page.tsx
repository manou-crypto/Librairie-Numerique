'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { User, Lock, Bell, Save, CheckCircle, Camera, Shield, Settings2, Trash2 } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';
import { authService, AuthUser } from '@/services/auth.service';
import { utilisateursService } from '@/services/utilisateurs.service';
import { toast } from 'sonner';
import { usePreferences, UserPreferences } from '@/hooks/usePreferences';
import CloudinaryUploadWidget from '@/components/cloudinary/CloudinaryUploadWidget';

type ProfileTab = 'infos' | 'securite' | 'preferences';

export default function ProfilPage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('infos');
  const [loading, setLoading] = useState(false);
  const [userCookie, setUserCookie] = useState<AuthUser | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [infos, setInfos] = useState({ prenom: '', nom: '', email: '', telephone: '', poste: '' });
  const [passwords, setPasswords] = useState({ actuel: '', nouveau: '', confirmation: '' });
  const { preferences, updatePreferences, testNotificationSound, mounted } = usePreferences();
  const [localPrefs, setLocalPrefs] = useState<UserPreferences>(preferences);

  useEffect(() => {
    if (mounted) {
      setLocalPrefs(preferences);
    }
  }, [preferences, mounted]);

  useEffect(() => {
    const user = authService.getUser();
    if (user) {
      setUserCookie(user);
      setAvatarUrl(user.avatarUrl || '');
      setInfos({
        prenom: user.name?.split(' ')[0] || '',
        nom: user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        telephone: '', // Pas dans le cookie
        poste:
          user.roleUi === 'super_admin'
            ? 'Super Administrateur'
            : user.roleUi === 'manager'
              ? 'Manager'
              : 'Caissier',
      });
    }

    utilisateursService.getMyProfile().then((profile) => {
      if (profile) {
        if (profile.avatarUrl) setAvatarUrl(profile.avatarUrl);
        setInfos((prev) => ({
          ...prev,
          prenom: profile.prenom || prev.prenom,
          nom: profile.nom || prev.nom,
          email: profile.email || prev.email,
        }));
      }
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (activeTab === 'infos') {
      if (!infos.nom || !infos.prenom || !infos.email) {
        return toast.error('Veuillez remplir les champs obligatoires');
      }
      setLoading(true);
      try {
        await utilisateursService.updateMyProfile({ ...infos, avatarUrl });

        // Mettre à jour le cookie avec le nouveau nom, email et avatar
        authService.updateUserCookie({
          name: `${infos.prenom} ${infos.nom}`,
          email: infos.email,
          avatarUrl: avatarUrl || null,
        });

        toast.success('Profil mis à jour avec succès');

        // Recharger la page pour mettre à jour la Sidebar et la Topbar
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (err: any) {
        toast.error(err.message || 'Erreur lors de la mise à jour');
      } finally {
        setLoading(false);
      }
    } else if (activeTab === 'securite') {
      if (!passwords.actuel || !passwords.nouveau || !passwords.confirmation) {
        return toast.error('Veuillez remplir tous les champs');
      }
      if (passwords.nouveau !== passwords.confirmation) {
        return toast.error('Les mots de passe ne correspondent pas');
      }
      setLoading(true);
      try {
        await utilisateursService.updateMyPassword(passwords);
        toast.success('Mot de passe modifié avec succès');
        setPasswords({ actuel: '', nouveau: '', confirmation: '' });
      } catch (err: any) {
        toast.error(err.message || 'Erreur lors de la modification');
      } finally {
        setLoading(false);
      }
    } else if (activeTab === 'preferences') {
      updatePreferences(localPrefs);
      toast.success('Préférences sauvegardées avec succès');
    }
  };

  const TABS: { id: ProfileTab; label: string; icon: React.ElementType }[] = [
    { id: 'infos', label: 'Informations', icon: User },
    { id: 'securite', label: 'Sécurité', icon: Lock },
    { id: 'preferences', label: 'Préférences', icon: Settings2 },
  ];

  return (
    <AppLayout currentPath="/profil">
      <Topbar title="Mon profil" subtitle="Gérer vos informations personnelles" />
      <div className="px-6 py-6 max-w-2xl mx-auto space-y-6">
        <div className="card-base p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="relative group shrink-0">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-border/80 shadow-md">
              {avatarUrl ? (
                <img src={avatarUrl} alt={infos.prenom} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-primary">
                  {infos.prenom.charAt(0) || 'U'}
                  {infos.nom.charAt(0) || ''}
                </span>
              )}
            </div>
            {avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl('')}
                className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-1 shadow hover:bg-destructive/90 transition-colors"
                title="Supprimer la photo"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {infos.prenom} {infos.nom}
              </h2>
              <p className="text-sm text-muted-foreground">{infos.email}</p>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-1.5">
                <span className="badge-draft flex items-center gap-1">
                  <Shield size={10} /> {infos.poste}
                </span>
                <span className="badge-active">Actif</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
              <CloudinaryUploadWidget
                folder="librairie/avatars"
                buttonText={avatarUrl ? 'Changer la photo' : 'Ajouter une photo'}
                buttonClassName="border border-border/80 bg-background hover:bg-muted py-1.5 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                multiple={false}
                maxFiles={1}
                onUploadSuccess={(url) => {
                  setAvatarUrl(url);
                  toast.success('Photo sélectionnée. Pensez à enregistrer les modifications.');
                }}
              />
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="text-xs text-muted-foreground hover:text-destructive py-1.5 px-2 transition-colors"
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
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
        {activeTab === 'infos' && (
          <div className="card-base p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Informations personnelles</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Prénom</label>
                <input
                  type="text"
                  value={infos.prenom}
                  onChange={(e) => setInfos({ ...infos, prenom: e.target.value })}
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Nom</label>
                <input
                  type="text"
                  value={infos.nom}
                  onChange={(e) => setInfos({ ...infos, nom: e.target.value })}
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Email</label>
                <input
                  type="email"
                  value={infos.email}
                  onChange={(e) => setInfos({ ...infos, email: e.target.value })}
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={infos.telephone}
                  onChange={(e) => setInfos({ ...infos, telephone: e.target.value })}
                  className="input-field text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-foreground mb-1.5">Poste</label>
                <input
                  type="text"
                  value={infos.poste}
                  readOnly
                  className="input-field text-sm bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Le poste est géré par l'administrateur système
                </p>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'securite' && (
          <div className="card-base p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Changer le mot de passe</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  value={passwords.actuel}
                  onChange={(e) => setPasswords({ ...passwords, actuel: e.target.value })}
                  placeholder="••••••••"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={passwords.nouveau}
                  onChange={(e) => setPasswords({ ...passwords, nouveau: e.target.value })}
                  placeholder="••••••••"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Confirmer le nouveau mot de passe
                </label>
                <input
                  type="password"
                  value={passwords.confirmation}
                  onChange={(e) => setPasswords({ ...passwords, confirmation: e.target.value })}
                  placeholder="••••••••"
                  className="input-field text-sm"
                />
              </div>
              {passwords.nouveau &&
                passwords.confirmation &&
                passwords.nouveau !== passwords.confirmation && (
                  <p className="text-xs text-negative">Les mots de passe ne correspondent pas</p>
                )}
            </div>
          </div>
        )}
        {activeTab === 'preferences' && mounted && (
          <div className="card-base p-6 space-y-5">
            <h3 className="text-sm font-bold text-foreground">Préférences d'affichage</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Thème</label>
                <select
                  value={localPrefs.theme}
                  onChange={(e) => {
                    const newTheme = e.target.value as any;
                    setLocalPrefs({ ...localPrefs, theme: newTheme });
                    updatePreferences({ theme: newTheme }); // Applique et sauvegarde immédiatement
                  }}
                  className="input-field text-sm w-auto"
                >
                  <option value="clair">Clair</option>
                  <option value="sombre">Sombre</option>
                  <option value="auto">Automatique (système)</option>
                </select>
              </div>
              <div className="border-t border-border pt-4 space-y-4">
                <h4 className="text-xs font-bold text-foreground">Notifications</h4>
                
                {/* Notif Email (Non implémentée) */}
                <div className="flex items-center justify-between group relative p-2 rounded-lg hover:bg-muted/40 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">Notifications par email</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        Bientôt disponible
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Alertes de sécurité et récapitulatifs par courrier électronique</p>
                  </div>
                  <div className="relative" title="Fonctionnalité non implémentée">
                    <button
                      type="button"
                      disabled
                      className="relative w-10 h-5 rounded-full bg-muted cursor-not-allowed opacity-60 flex items-center"
                    >
                      <span className="absolute left-0.5 w-4 h-4 rounded-full bg-white shadow" />
                    </button>
                    {/* Tooltip au survol */}
                    <div className="absolute right-0 bottom-full mb-1 hidden group-hover:block z-10 whitespace-nowrap bg-gray-900 text-white text-[11px] rounded px-2.5 py-1 shadow-md font-medium">
                      Fonctionnalité non implémentée
                    </div>
                  </div>
                </div>

                {/* Notif Sonore (Active avec test) */}
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-foreground">Sons de notification</p>
                    <p className="text-xs text-muted-foreground">Émettre un signal sonore lors des alertes et nouvelles ventes</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => testNotificationSound()}
                      className="text-xs font-medium px-2.5 py-1 rounded border border-border hover:bg-muted text-primary flex items-center gap-1 transition-all"
                      title="Tester le son du carillon"
                    >
                      <span>🔊</span> Tester le son
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newVal = !localPrefs.notifSon;
                        setLocalPrefs({ ...localPrefs, notifSon: newVal });
                        updatePreferences({ notifSon: newVal });
                        if (newVal) testNotificationSound();
                      }}
                      className={`relative w-10 h-5 rounded-full transition-colors flex items-center ${localPrefs.notifSon ? 'bg-primary' : 'bg-muted'}`}
                    >
                      <span
                        className={`absolute left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${localPrefs.notifSon ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>
                </div>
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
            <Save size={14} /> {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
