'use client';
import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { Save, Store, Globe, Bell, Shield, Database, Upload, CheckCircle, Download } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


type SettingsTab = 'general' | 'notifications' | 'securite' | 'sauvegarde';

export default function ParametresPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [saved, setSaved] = useState(false);
  const [general, setGeneral] = useState({ nomLibrairie: 'LibrairieNumerique', adresse: '12 Rue Didouche Mourad, Alger 16000', telephone: '+213 21 63 45 78', email: 'contact@librairie.dz', siteWeb: 'https://librairie.dz', devise: 'DZD', tva: '19', langue: 'fr' });
  const [notifs, setNotifs] = useState({ stockBas: true, nouvelleVente: false, rapportJournalier: true, alerteRupture: true, emailNotifs: true });
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'general', label: 'Général', icon: Store }, { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'securite', label: 'Sécurité', icon: Shield }, { id: 'sauvegarde', label: 'Sauvegarde', icon: Database },
  ];

  return (
    <AppLayout currentPath="/parametres">
      <Topbar title="Paramètres" subtitle="Configuration générale de l'application" />
      <div className="px-6 py-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit flex-wrap">
          {TABS.map((tab) => { const Icon = tab.icon; return (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}><Icon size={14} />{tab.label}</button>); })}
        </div>
        {activeTab === 'general' && (
          <div className="card-base p-6 space-y-5">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><Store size={16} className="text-primary" /> Informations de la librairie</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[{ label: 'Nom de la librairie', key: 'nomLibrairie', type: 'text' }, { label: 'Email', key: 'email', type: 'email' }, { label: 'Téléphone', key: 'telephone', type: 'tel' }, { label: 'Site web', key: 'siteWeb', type: 'url' }].map((field) => (<div key={field.key}><label className="block text-xs font-semibold text-foreground mb-1.5">{field.label}</label><input type={field.type} value={general[field.key as keyof typeof general]} onChange={(e) => setGeneral({ ...general, [field.key]: e.target.value })} className="input-field text-sm" /></div>))}
              <div className="sm:col-span-2"><label className="block text-xs font-semibold text-foreground mb-1.5">Adresse</label><input type="text" value={general.adresse} onChange={(e) => setGeneral({ ...general, adresse: e.target.value })} className="input-field text-sm" /></div>
            </div>
            <div className="border-t border-border pt-5">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2"><Globe size={16} className="text-primary" /> Paramètres régionaux</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className="block text-xs font-semibold text-foreground mb-1.5">Devise</label><select value={general.devise} onChange={(e) => setGeneral({ ...general, devise: e.target.value })} className="input-field text-sm"><option value="XOF">XOF — Franc CFA (FCFA)</option></select></div>
                <div><label className="block text-xs font-semibold text-foreground mb-1.5">TVA (%)</label><input type="number" value={general.tva} onChange={(e) => setGeneral({ ...general, tva: e.target.value })} className="input-field text-sm" /></div>
                <div><label className="block text-xs font-semibold text-foreground mb-1.5">Langue</label><select value={general.langue} onChange={(e) => setGeneral({ ...general, langue: e.target.value })} className="input-field text-sm"><option value="fr">Français</option><option value="ar">Arabe</option><option value="en">Anglais</option></select></div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'notifications' && (
          <div className="card-base p-6 space-y-5">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><Bell size={16} className="text-primary" /> Préférences de notifications</h3>
            <div className="space-y-4">
              {[{ key: 'stockBas', label: 'Alerte stock bas', desc: 'Notifier quand un produit passe sous le seuil minimum' }, { key: 'alerteRupture', label: 'Alerte rupture de stock', desc: 'Notifier immédiatement en cas de rupture' }, { key: 'nouvelleVente', label: 'Nouvelle vente', desc: 'Notification à chaque vente enregistrée' }, { key: 'rapportJournalier', label: 'Rapport journalier', desc: 'Envoyer un résumé quotidien par email' }, { key: 'emailNotifs', label: 'Notifications par email', desc: 'Recevoir les alertes par email' }].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div><p className="text-sm font-semibold text-foreground">{item.label}</p><p className="text-xs text-muted-foreground">{item.desc}</p></div>
                  <button onClick={() => setNotifs({ ...notifs, [item.key]: !notifs[item.key as keyof typeof notifs] })} className={`relative w-11 h-6 rounded-full transition-colors ${notifs[item.key as keyof typeof notifs] ? 'bg-primary' : 'bg-muted'}`}><span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${notifs[item.key as keyof typeof notifs] ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'securite' && (
          <div className="card-base p-6 space-y-5">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><Shield size={16} className="text-primary" /> Sécurité & Accès</h3>
            <div className="space-y-4">
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Durée de session (minutes)</label><select className="input-field text-sm w-auto"><option>30</option><option>60</option><option>120</option><option>480</option></select></div>
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Tentatives de connexion max</label><select className="input-field text-sm w-auto"><option>3</option><option>5</option><option>10</option></select></div>
              <div className="flex items-center justify-between py-3 border-t border-border"><div><p className="text-sm font-semibold text-foreground">Double authentification (2FA)</p><p className="text-xs text-muted-foreground">Renforcer la sécurité des comptes admin</p></div><button className="relative w-11 h-6 rounded-full bg-muted transition-colors"><span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow" /></button></div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4"><p className="text-xs text-amber-700 font-medium">⚠️ Les modifications de sécurité s'appliquent à tous les utilisateurs. Assurez-vous de communiquer les changements à votre équipe.</p></div>
            </div>
          </div>
        )}
        {activeTab === 'sauvegarde' && (
          <div className="card-base p-6 space-y-5">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><Database size={16} className="text-primary" /> Sauvegarde des données</h3>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3"><CheckCircle size={18} className="text-positive shrink-0" /><div><p className="text-sm font-semibold text-positive">Dernière sauvegarde réussie</p><p className="text-xs text-muted-foreground">03/08/2026 à 02:00 — Automatique</p></div></div>
              <div><label className="block text-xs font-semibold text-foreground mb-1.5">Fréquence de sauvegarde automatique</label><select className="input-field text-sm w-auto"><option>Quotidienne</option><option>Hebdomadaire</option><option>Mensuelle</option></select></div>
              <div className="flex items-center gap-3 pt-2"><button className="btn-primary flex items-center gap-1.5 text-sm py-2"><Download size={14} /> Sauvegarder maintenant</button><button className="btn-secondary flex items-center gap-1.5 text-sm py-2"><Upload size={14} /> Restaurer</button></div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-end gap-3">
          {saved && <div className="flex items-center gap-1.5 text-sm text-positive fade-in"><CheckCircle size={15} /> Paramètres sauvegardés</div>}
          <button onClick={handleSave} className="btn-primary flex items-center gap-1.5 text-sm py-2.5 px-5"><Save size={14} /> Enregistrer les modifications</button>
        </div>
      </div>
    </AppLayout>
  );
}
