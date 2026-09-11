'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { User, Lock, Bell, Save, CheckCircle, Camera, Shield, Settings2 } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';
import { authService, AuthUser } from '@/services/auth.service';
import { utilisateursService } from '@/services/utilisateurs.service';
import { toast } from 'sonner';
import { usePreferences, UserPreferences } from '@/hooks/usePreferences';

type ProfileTab = 'infos' | 'securite' | 'preferences';

export default function ProfilPage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('infos');
  const [loading, setLoading] = useState(false);
  const [userCookie, setUserCookie] = useState<AuthUser | null>(null);

  const [infos, setInfos] = useState({ prenom: '', nom: '', email: '', telephone: '', poste: '' });
  const [passwords, setPasswords] = useState({ actuel: '', nouveau: '', confirmation: '' });
  const { preferences, updatePreferences, mounted } = usePreferences();
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
  }, []);

  const handleSave = async () => {
    if (activeTab === 'infos') {
      if (!infos.nom || !infos.prenom || !infos.email) {
        return toast.error('Veuillez remplir les champs obligatoires');
      }
      setLoading(true);
      try {
        await utilisateursService.updateMyProfile(infos);

        // Mettre à jour le cookie avec le nouveau nom et email
        authService.updateUserCookie({
          name: `${infos.prenom} ${infos.nom}`,
          email: infos.email,
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
        <div className="card-base p-6 flex items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">
                {infos.prenom.charAt(0)}
                {infos.nom.charAt(0)}
              </span>
            </div>
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              {infos.prenom} {infos.nom}
            </h2>
            <p className="text-sm text-muted-foreground">{infos.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="badge-draft flex items-center gap-1">
                <Shield size={10} /> {infos.poste}
              </span>
              <span className="badge-active">Actif</span>
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
              <div className="border-t border-border pt-4 space-y-3">
                <h4 className="text-xs font-bold text-foreground">Notifications</h4>
                {[
                  { key: 'notifEmail', label: 'Notifications par email' },
                  { key: 'notifSon', label: 'Sons de notification' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <p className="text-sm text-foreground">{item.label}</p>
                    <button
                      onClick={() => {
                        const newVal = !localPrefs[item.key as keyof UserPreferences];
                        setLocalPrefs({ ...localPrefs, [item.key]: newVal });
                        updatePreferences({ [item.key]: newVal });
                      }}
                      className={`relative w-10 h-5 rounded-full transition-colors flex items-center ${localPrefs[item.key as keyof UserPreferences] ? 'bg-primary' : 'bg-muted'}`}
                    >
                      <span
                        className={`absolute left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${localPrefs[item.key as keyof UserPreferences] ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>
                ))}
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
