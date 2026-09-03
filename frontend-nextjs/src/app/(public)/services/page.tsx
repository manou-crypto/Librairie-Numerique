'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  ArrowLeft,
  Send,
  CheckCircle2,
  Star,
  Users,
  Package,
  Sparkles,
  ChevronRight,
  LogIn,
  LayoutDashboard,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAppConfig } from '@/contexts/ConfigContext';
import PublicFooter from '@/components/public/PublicFooter';

const POINTS_DE_VENTE = [
  {
    id: 1,
    nom: 'Librairie Centrale',
    adresse: 'Avenue de la Liberation, Centre-Ville',
    ville: 'Libreville',
    horaires: 'Lun - Sam : 8h00 - 19h00',
    phone: '+241 01 23 45 67',
    badge: 'Principal',
    badgeColor: 'bg-amber-100 text-amber-800',
  },
  {
    id: 2,
    nom: 'Annexe Universite',
    adresse: 'Campus Universitaire, Batiment A',
    ville: 'Libreville',
    horaires: 'Lun - Ven : 8h30 - 17h30',
    phone: '+241 01 23 45 68',
    badge: 'Universite',
    badgeColor: 'bg-sky-100 text-sky-800',
  },
  {
    id: 3,
    nom: 'Point Relais Nord',
    adresse: 'Quartier Lalala, Rue Principale',
    ville: 'Libreville Nord',
    horaires: 'Lun - Sam : 9h00 - 18h00',
    phone: '+241 01 23 45 69',
    badge: 'Relais',
    badgeColor: 'bg-emerald-100 text-emerald-800',
  },
];

const STATS = [
  { label: 'Ouvrages disponibles', value: '2 000+', icon: BookOpen },
  { label: 'Clients satisfaits', value: '10 000+', icon: Users },
  { label: 'Points de vente', value: '3', icon: MapPin },
  { label: "Annees d'experience", value: '15+', icon: Star },
];

export default function ServicesPage() {
  const { user } = useAuth();
  const { config } = useAppConfig();
  const nomLibrairie = config?.nom_librairie || 'OR-SERVICE';

  const [form, setForm] = useState({ nom: '', email: '', sujet: '', message: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSent(true);
      setForm({ nom: '', email: '', sujet: '', message: '' });
      setTimeout(() => setSent(false), 6000);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">

      {/* TOP UTILITY BAR */}
      <div className="bg-[#F3F3EF] dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="hidden sm:flex items-center gap-4">
            <span className="font-medium tracking-wide">Disponibilite &amp; livraison express</span>
            <span className="opacity-40">•</span>
            <span>Conseils litteraires &amp; commande simplifiee</span>
          </div>
          <div className="flex items-center gap-5 ml-auto text-[11px]">
            <Link href="/services#points-de-vente" className="hover:text-slate-950 dark:hover:text-white transition-colors flex items-center gap-1">
              <MapPin size={12} />
              <span>Points de vente</span>
            </Link>
            <a href="#footer" className="hover:text-slate-950 dark:hover:text-white transition-colors flex items-center gap-1">
              <HelpCircle size={12} />
              <span>Besoin d aide ?</span>
            </a>
            {user ? (
              <Link href="/dashboard" className="font-semibold text-slate-900 dark:text-white hover:underline flex items-center gap-1">
                <LayoutDashboard size={12} />
                <span>Espace Gestion</span>
              </Link>
            ) : (
              <Link href="/login" className="font-semibold text-slate-900 dark:text-white hover:underline flex items-center gap-1">
                <LogIn size={12} />
                <span>Espace Pro</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#FAFAF8]/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
                <BookOpen size={16} strokeWidth={2.4} />
              </div>
              <span className="font-bold tracking-tight text-lg sm:text-xl text-slate-900 dark:text-white">
                {nomLibrairie}
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-6 text-[13px] font-medium text-slate-700 dark:text-slate-300">
              <Link href="/catalogue" className="hover:text-slate-950 dark:hover:text-white transition-colors">Catalogue</Link>
              <Link href="/catalogue?category=Romans" className="hover:text-slate-950 dark:hover:text-white transition-colors">Romans</Link>
              <Link href="/catalogue?category=Scolaire" className="hover:text-slate-950 dark:hover:text-white transition-colors">Scolaire</Link>
              <Link href="/services" className="text-slate-950 dark:text-white font-semibold border-b-2 border-slate-900 dark:border-white pb-0.5">A Propos</Link>
            </nav>

            <div className="flex items-center gap-3 shrink-0">
              <Link href="/catalogue" className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 shadow-xs transition-all">
                <span>Catalogue Complet</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative w-full overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507842229456-1cb7d55f0535?auto=format&fit=crop&w=2000&q=80')" }} />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-amber-950/40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors mb-8">
            <ArrowLeft size={13} />
            <span>Retour a l accueil</span>
          </Link>
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[11px] font-semibold tracking-wider uppercase">
              <Sparkles size={12} />
              <span>Votre libraire de confiance</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight uppercase leading-[1.08]">
              <span className="text-white">{nomLibrairie}</span><br />
              <span className="text-slate-400 text-3xl sm:text-4xl lg:text-5xl font-semibold normal-case">Bien plus qu une librairie.</span>
            </h1>
            <p className="text-base sm:text-lg text-slate-300/90 font-light max-w-2xl leading-relaxed">
              Depuis plus de 15 ans, nous accompagnons etudiants, familles et professionnels dans leur passion de la lecture.
              Trois points de vente, un catalogue en ligne, et une equipe passionnee a votre service.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <a href="#points-de-vente" className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#E14B1C] hover:bg-[#C83E13] text-white text-xs sm:text-sm font-black tracking-wider uppercase shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]">
                <MapPin size={15} /><span>Nos Points de Vente</span>
              </a>
              <a href="#contact" className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold tracking-wider uppercase border border-white/20 transition-all">
                <Mail size={15} /><span>Contactez-nous</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-[#F4F4F0] dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center mx-auto text-slate-700 dark:text-slate-300">
                    <Icon size={18} strokeWidth={1.8} />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* QUI SOMMES-NOUS */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              <Sparkles size={12} className="text-amber-500" />
              <span>Notre histoire</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Une librairie nee de la passion du livre
            </h2>
            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>Fondee il y a plus de 15 ans, <strong className="text-slate-900 dark:text-white">{nomLibrairie}</strong> est devenue une reference incontournable pour les amateurs de livres, les etudiants et les professionnels de la region.</p>
              <p>Notre mission est simple : rendre le savoir accessible a tous, a travers une selection rigoureuse d ouvrages allant des romans contemporains aux manuels universitaires, en passant par les essais, les bandes dessinees et les livres de developpement personnel.</p>
              <p>Avec notre catalogue numerique, vous pouvez desormais consulter notre stock en temps reel et trouver l ouvrage qu il vous faut avant meme de vous deplacer.</p>
            </div>
            <Link href="/catalogue" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white group">
              <span>Explorer le catalogue</span>
              <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden">
              <img src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=600&q=80" alt="Librairie interieur" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
            <div className="aspect-[3/4] rounded-2xl overflow-hidden mt-8">
              <img src="https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80" alt="Selection de livres" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
          </div>
        </div>
      </section>

      {/* POINTS DE VENTE */}
      <section id="points-de-vente" className="bg-[#F4F4F0] dark:bg-slate-900/50 border-y border-slate-200/80 dark:border-slate-800 py-16 sm:py-20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-3">
              <MapPin size={13} className="text-[#E14B1C]" />
              <span>Ou nous trouver</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Nos Points de Vente</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Retrouvez-nous dans nos trois espaces dedies a la lecture et au savoir.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {POINTS_DE_VENTE.map((pdv) => (
              <div key={pdv.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs hover:shadow-md transition-all space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-[#E14B1C]" strokeWidth={2} />
                  </div>
                  <span className={"text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full " + pdv.badgeColor + " dark:opacity-90"}>
                    {pdv.badge}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{pdv.nom}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{pdv.adresse}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{pdv.ville}</p>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <Clock size={13} className="text-slate-400 shrink-0" /><span>{pdv.horaires}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <Phone size={13} className="text-slate-400 shrink-0" /><span>{pdv.phone}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full scroll-mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-3">
                <Mail size={12} className="text-[#E14B1C]" />
                <span>Contactez-nous</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Une question ? Nous sommes la.</h2>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Que ce soit pour une commande speciale, une demande d information sur nos disponibilites ou simplement un conseil de lecture, notre equipe est disponible pour vous.</p>
            </div>
            <div className="space-y-4">
              {[
                { icon: Phone, label: 'Telephone', value: '+241 01 23 45 67' },
                { icon: Mail, label: 'E-mail', value: 'contact@orservice.ga' },
                { icon: Clock, label: 'Horaires', value: 'Lun - Sam : 8h00 - 19h00' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3 p-4 rounded-xl bg-[#F4F4F0] dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 text-slate-700 dark:text-slate-300"><Icon size={16} /></div>
                    <div>
                      <p className="text-[11px] text-slate-400 uppercase font-medium tracking-wider">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 sm:p-8">
            {sent ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Message envoye !</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Merci pour votre message. Notre equipe vous repondra dans les plus brefs delais.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-6">Envoyez-nous un message</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nom complet <span className="text-rose-500">*</span></label>
                    <input type="text" required value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Jean Dupont" className="w-full px-3.5 py-2.5 bg-[#FAFAF8] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">E-mail <span className="text-rose-500">*</span></label>
                    <input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jean@exemple.com" className="w-full px-3.5 py-2.5 bg-[#FAFAF8] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Sujet</label>
                  <select value={form.sujet} onChange={e => setForm(f => ({ ...f, sujet: e.target.value }))} className="w-full px-3.5 py-2.5 bg-[#FAFAF8] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors">
                    <option value="">Selectionner un sujet...</option>
                    <option value="commande">Commande speciale</option>
                    <option value="disponibilite">Disponibilite d un ouvrage</option>
                    <option value="conseil">Conseil de lecture</option>
                    <option value="partenariat">Partenariat / Institution</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Message <span className="text-rose-500">*</span></label>
                  <textarea required rows={5} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Decrivez votre demande..." className="w-full px-3.5 py-2.5 bg-[#FAFAF8] dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-500 transition-colors resize-none" />
                </div>
                <button type="submit" disabled={sending} className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-sm font-semibold transition-all shadow-xs disabled:opacity-60">
                  {sending ? (
                    <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /><span>Envoi en cours...</span></>
                  ) : (
                    <><Send size={15} /><span>Envoyer le message</span></>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-950 text-white py-14 sm:py-18">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] font-semibold tracking-wider text-slate-300 uppercase">
            <Package size={12} /><span>Stock en temps reel</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Plus de 2 000 ouvrages a decouvrir</h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">Consultez notre catalogue numerique pour trouver le livre qu il vous faut - disponibilite en temps reel, recherche par titre, auteur ou categorie.</p>
          <Link href="/catalogue" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md bg-[#E14B1C] hover:bg-[#C83E13] text-white font-black text-sm tracking-wider uppercase shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]">
            <span>Explorer le catalogue</span>
            <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
