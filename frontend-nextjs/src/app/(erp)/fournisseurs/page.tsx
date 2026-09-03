'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import { Search, Plus, Phone, MapPin, X, Eye, Building2, Loader2, Pencil, Trash2, Save } from 'lucide-react';
import { fournisseursService, Fournisseur } from '@/services/fournisseurs.service';
import { toast } from 'sonner';

const EMPTY_FORM: Omit<Fournisseur, 'id'> = {
  nomEntreprise: '', contactNom: '', telephone: '', email: '',
  adresse: '', ville: '', pays: '', numeroContribuable: '', observations: '',
};

export default function FournisseursPage() {
  const [search, setSearch] = useState('');
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [loading, setLoading] = useState(true);

  // Modale Création / Édition
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Fournisseur | null>(null); // null = création
  const [form, setForm] = useState<Omit<Fournisseur, 'id'>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Modale Détail
  const [selected, setSelected] = useState<Fournisseur | null>(null);

  // Confirmation suppression
  const [deleteTarget, setDeleteTarget] = useState<Fournisseur | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setFournisseurs(await fournisseursService.getAll()); }
    catch { toast.error('Erreur lors du chargement des fournisseurs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (f: Fournisseur) => {
    setEditTarget(f);
    setForm({
      nomEntreprise: f.nomEntreprise, contactNom: f.contactNom || '',
      telephone: f.telephone || '', email: f.email || '',
      adresse: f.adresse || '', ville: f.ville || '',
      pays: f.pays || '', numeroContribuable: f.numeroContribuable || '',
      observations: f.observations || '',
    });
    setSelected(null);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nomEntreprise.trim()) return toast.error('Le nom de la société est obligatoire');
    setSaving(true);
    try {
      if (editTarget) {
        await fournisseursService.update(editTarget.id, form);
        toast.success('Fournisseur mis à jour !');
      } else {
        await fournisseursService.create(form);
        toast.success('Fournisseur créé !');
      }
      setShowForm(false);
      load();
    } catch { toast.error('Erreur lors de l\'enregistrement'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fournisseursService.delete(deleteTarget.id);
      toast.success(`${deleteTarget.nomEntreprise} supprimé`);
      setDeleteTarget(null);
      setSelected(null);
      load();
    } catch { toast.error('Erreur lors de la suppression'); }
    finally { setDeleting(false); }
  };

  const filtered = fournisseurs.filter(f =>
    f.nomEntreprise.toLowerCase().includes(search.toLowerCase()) ||
    (f.contactNom || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const field = (label: string, key: keyof typeof form, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-semibold text-foreground mb-1.5">{label}</label>
      <input
        type={type}
        value={form[key] as string}
        onChange={e => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className="input-field text-sm"
      />
    </div>
  );

  return (
    <AppLayout currentPath="/fournisseurs">
      <Topbar title="Fournisseurs" subtitle="Répertoire et gestion des fournisseurs" />
      <div className="px-6 py-6 max-w-screen-2xl mx-auto space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="kpi-card-info"><p className="text-xs text-muted-foreground mb-1">Total fournisseurs</p><p className="text-xl font-bold text-foreground tabular-nums">{fournisseurs.length}</p><p className="text-xs text-muted-foreground mt-1">enregistrés</p></div>
          <div className="kpi-card-positive"><p className="text-xs text-muted-foreground mb-1">Avec contact</p><p className="text-xl font-bold text-foreground tabular-nums">{fournisseurs.filter(f => f.contactNom).length}</p><p className="text-xs text-muted-foreground mt-1">fiches complètes</p></div>
          <div className="kpi-card-neutral"><p className="text-xs text-muted-foreground mb-1">Avec email</p><p className="text-xl font-bold text-foreground tabular-nums">{fournisseurs.filter(f => f.email).length}</p></div>
          <div className="kpi-card-warning"><p className="text-xs text-muted-foreground mb-1">Sans téléphone</p><p className="text-xl font-bold text-warning tabular-nums">{fournisseurs.filter(f => !f.telephone).length}</p></div>
        </div>

        {/* Tableau */}
        <div className="card-base overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom, contact, email..." className="input-field pl-9 text-sm" /></div>
            <button onClick={openCreate} className="btn-primary flex items-center gap-1.5 text-sm py-2"><Plus size={14} /> Ajouter</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/50"><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Fournisseur</th><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Contact</th><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Email</th><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Ville / Pays</th><th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">N° Contribuable</th><th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground">Actions</th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground"><Loader2 className="animate-spin mx-auto mb-2" size={24} /> Chargement...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-16 text-center text-muted-foreground"><Building2 size={32} className="mx-auto mb-2" /><p className="text-sm">Aucun fournisseur trouvé</p></td></tr>
                ) : filtered.map((f, idx) => (
                  <tr key={f.id} className={`border-b border-border table-row-hover ${idx % 2 === 0 ? '' : 'bg-muted/20'}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Building2 size={14} className="text-primary" /></div>
                        <div><p className="font-semibold text-foreground text-sm">{f.nomEntreprise}</p><p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin size={10} /> {f.adresse || '—'}</p></div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><p className="text-sm text-foreground">{f.contactNom || '—'}</p><a href={`tel:${f.telephone}`} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary mt-0.5"><Phone size={10} /> {f.telephone || '—'}</a></td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{f.email || '—'}</td>
                    <td className="px-5 py-3 text-muted-foreground text-xs">{f.ville ? `${f.ville}, ${f.pays || ''}` : f.pays || '—'}</td>
                    <td className="px-5 py-3 text-muted-foreground text-xs font-mono">{f.numeroContribuable || '—'}</td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setSelected(f)} className="inline-flex items-center gap-1 text-xs text-primary hover:underline"><Eye size={12} /> Voir</button>
                        <button onClick={() => openEdit(f)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><Pencil size={12} /> Modifier</button>
                        <button onClick={() => setDeleteTarget(f)} className="inline-flex items-center gap-1 text-xs text-negative hover:underline"><Trash2 size={12} /> Suppr.</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-border text-xs text-muted-foreground">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* ——— MODALE DÉTAIL ——— */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Building2 size={18} className="text-primary" /></div>
                <h3 className="text-base font-bold text-foreground">{selected.nomEntreprise}</h3>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-4">
              {[
                ['Contact', selected.contactNom],
                ['N° Contribuable', selected.numeroContribuable],
                ['Téléphone', selected.telephone],
                ['Email', selected.email],
                ['Adresse', selected.adresse],
                ['Ville / Pays', selected.ville ? `${selected.ville}, ${selected.pays || ''}` : selected.pays],
              ].map(([lbl, val]) => (
                <div key={lbl}>
                  <p className="text-xs text-muted-foreground mb-0.5">{lbl}</p>
                  <p className="text-sm font-semibold text-foreground">{val || '—'}</p>
                </div>
              ))}
              {selected.observations && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-0.5">Observations</p>
                  <p className="text-sm text-foreground">{selected.observations}</p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setSelected(null)} className="btn-secondary text-sm py-2">Fermer</button>
              <button onClick={() => openEdit(selected)} className="btn-primary text-sm py-2 flex items-center gap-1.5"><Pencil size={14} /> Modifier</button>
            </div>
          </div>
        </div>
      )}

      {/* ——— MODALE CRÉATION / ÉDITION ——— */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-base font-bold text-foreground">{editTarget ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">{field('Nom de la société *', 'nomEntreprise', 'text', 'Ex: Éditions Casbah')}</div>
                {field('Nom du contact', 'contactNom', 'text', 'Prénom Nom')}
                {field('N° Contribuable', 'numeroContribuable', 'text', 'Ex: 000123456789')}
                {field('Email', 'email', 'email', 'contact@societe.com')}
                {field('Téléphone', 'telephone', 'tel', '+237 6XX XX XX XX')}
                {field('Adresse', 'adresse', 'text', 'Rue, Quartier...')}
                {field('Ville', 'ville', 'text', 'Yaoundé')}
                {field('Pays', 'pays', 'text', 'Cameroun')}
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Observations</label>
                <textarea
                  value={form.observations || ''}
                  onChange={e => setForm({ ...form, observations: e.target.value })}
                  rows={3}
                  placeholder="Notes, conditions particulières..."
                  className="input-field text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button onClick={() => setShowForm(false)} className="btn-secondary text-sm py-2">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary text-sm py-2 flex items-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {editTarget ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ——— MODALE CONFIRMATION SUPPRESSION ——— */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm fade-in p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-negative/10 flex items-center justify-center shrink-0"><Trash2 size={18} className="text-negative" /></div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Supprimer ce fournisseur ?</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{deleteTarget.nomEntreprise}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Cette action est irréversible. Les bons d'achat associés ne seront pas supprimés.</p>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary text-sm py-2">Annuler</button>
              <button onClick={handleDelete} disabled={deleting} className="btn-primary text-sm py-2 bg-negative border-negative hover:bg-negative/90 flex items-center gap-2">
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
