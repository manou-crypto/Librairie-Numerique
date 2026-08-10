'use client';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { User, Lock, Bell, Save, CheckCircle, Camera, Shield } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


type ProfileTab = 'infos' | 'securite' | 'preferences';

export default function ProfilPage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('infos');
  const [saved, setSaved] = useState(false);
  const [infos, setInfos] = useState({ prenom: 'Ahmed', nom: 'Mansouri', email: 'admin@librairie.dz', telephone: '+213 21 63 45 78', poste: 'Super Administrateur' });
  const [passwords, setPasswords] = useState({ actuel: '', nouveau: '', confirmation: '' });
  const [prefs, setPrefs] = useState({ theme: 'clair', langue: 'fr', notifEmail: true, notifSon: false });
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const TABS: { id: ProfileTab; label: string; icon: React.ElementType }[] = [
    { id: 'infos', label: 'Informations', icon: User }, { id: 'securite', label: 'Sécurité', icon: Lock }, { id: 'preferences', label: 'Préférences', icon: Bell },
  ];

  return (
    <AppLayout currentPath="/profil">
      <Topbar title="Mon profil" subtitle="Gérer vos informations personnelles" />
      <div className="px-6 py-6 max-w-2xl mx-auto space-y-6">
        <div className="card-base p-6 flex items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"><span className="text-xl font-bold text-primary">AM</span></div>
            <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-sm hover:bg-blue-700 transition-colors"><Camera size={11} className="text-white" /></button>
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">{infos.prenom} {infos.nom}</h2>
            <p className="text-sm text-muted-foreground">{infos.email}</p>
            <div className="flex items-center gap-2 mt-1.5"><span className="badge-draft flex items-center gap-1"><Shield size={10} /> {infos.poste}</span><span className="badge-active">Actif</span></div>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
          {TABS.map((tab) => { const Icon = tab.icon; return (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}><Icon size={14} />{tab.label}</button>); })}
        </div>
        {activeTab === 'infos' && (
          <div className="card-base p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Informations personnelles</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Prénom</label><input type="text" value={infos.prenom} onChange={(e) => setInfos({ ...infos, prenom: e.target.value })} className="input-field text-sm" /></div>
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Nom</label><input type="text" value={infos.nom} onChange={(e) => setInfos({ ...infos, nom: e.target.value })} className="input-field text-sm" /></div>
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Email</label><input type="email" value={infos.email} onChange={(e) => setInfos({ ...infos, email: e.target.value })} className="input-field text-sm" /></div>
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Téléphone</label><input type="tel" value={infos.telephone} onChange={(e) => setInfos({ ...infos, telephone: e.target.value })} className="input-field text-sm" /></div>
              <div className="sm:col-span-2"><label className="block text-xs font-semibold text-foreground mb-1.5">Poste</label><input type="text" value={infos.poste} readOnly className="input-field text-sm bg-muted cursor-not-allowed" /><p className="text-xs text-muted-foreground mt-1">Le poste est géré par l'administrateur système</p></div>
            </div>
          </div>
        )}
        {activeTab === 'securite' && (
          <div className="card-base p-6 space-y-4">
            <h3 className="text-sm font-bold text-foreground">Changer le mot de passe</h3>
            <div className="space-y-4">
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Mot de passe actuel</label><input type="password" value={passwords.actuel} onChange={(e) => setPasswords({ ...passwords, actuel: e.target.value })} placeholder="••••••••" className="input-field text-sm" /></div>
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Nouveau mot de passe</label><input type="password" value={passwords.nouveau} onChange={(e) => setPasswords({ ...passwords, nouveau: e.target.value })} placeholder="••••••••" className="input-field text-sm" /></div>
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Confirmer le nouveau mot de passe</label><input type="password" value={passwords.confirmation} onChange={(e) => setPasswords({ ...passwords, confirmation: e.target.value })} placeholder="••••••••" className="input-field text-sm" /></div>
              {passwords.nouveau && passwords.confirmation && passwords.nouveau !== passwords.confirmation && <p className="text-xs text-negative">Les mots de passe ne correspondent pas</p>}
            </div>
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-bold text-foreground mb-3">Sessions actives</h3>
              <div className="space-y-2">
                {[{ device: 'Chrome — Windows 11', location: 'Alger, Algérie', current: true, time: 'Maintenant' }, { device: 'Firefox — Android', location: 'Alger, Algérie', current: false, time: 'Il y a 2h' }].map((session, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-muted/50">
                    <div><p className="text-xs font-semibold text-foreground">{session.device}</p><p className="text-xs text-muted-foreground">{session.location} · {session.time}</p></div>
                    {session.current ? <span className="badge-active text-[10px]">Session actuelle</span> : <button className="text-xs text-negative hover:underline">Déconnecter</button>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'preferences' && (
          <div className="card-base p-6 space-y-5">
            <h3 className="text-sm font-bold text-foreground">Préférences d'affichage</h3>
            <div className="space-y-4">
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Thème</label><select value={prefs.theme} onChange={(e) => setPrefs({ ...prefs, theme: e.target.value })} className="input-field text-sm w-auto"><option value="clair">Clair</option><option value="sombre">Sombre</option><option value="auto">Automatique (système)</option></select></div>
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Langue de l'interface</label><select value={prefs.langue} onChange={(e) => setPrefs({ ...prefs, langue: e.target.value })} className="input-field text-sm w-auto"><option value="fr">Français</option><option value="ar">Arabe</option><option value="en">Anglais</option></select></div>
              <div className="border-t border-border pt-4 space-y-3">
                <h4 className="text-xs font-bold text-foreground">Notifications</h4>
                {[{ key: 'notifEmail', label: 'Notifications par email' }, { key: 'notifSon', label: 'Sons de notification' }].map((item) => (
                  <div key={item.key} className="flex items-center justify-between">
                    <p className="text-sm text-foreground">{item.label}</p>
                    <button onClick={() => setPrefs({ ...prefs, [item.key]: !prefs[item.key as keyof typeof prefs] })} className={`relative w-11 h-6 rounded-full transition-colors ${prefs[item.key as keyof typeof prefs] ? 'bg-primary' : 'bg-muted'}`}><span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${prefs[item.key as keyof typeof prefs] ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-end gap-3">
          {saved && <div className="flex items-center gap-1.5 text-sm text-positive fade-in"><CheckCircle size={15} /> Profil mis à jour</div>}
          <button onClick={handleSave} className="btn-primary flex items-center gap-1.5 text-sm py-2.5 px-5"><Save size={14} /> Enregistrer</button>
        </div>
      </div>
    </AppLayout>
  );
}
