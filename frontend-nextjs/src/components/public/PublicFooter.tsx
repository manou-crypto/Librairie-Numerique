'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Mail,
  Check,
  ShieldCheck,
  HelpCircle,
  Phone,
  ArrowRight,
  Globe,
  Share2
} from 'lucide-react';
import { useAppConfig } from '@/contexts/ConfigContext';

export default function PublicFooter() {
  const { config } = useAppConfig();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div id="footer" className="w-full mt-auto font-sans">
      
      {/* ── 1. SECTION NEWSLETTER (BANDEAU SUPÉRIEUR BELLROY) ──────────────── */}
      <section className="bg-[#FAF9F6] dark:bg-slate-900 border-t border-b border-slate-200/80 dark:border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h3 className="text-base sm:text-lg lg:text-xl font-bold text-[#E14B1C] tracking-tight">
            Abonnez-vous pour ne rien manquer des nouveautés et offres réservées aux passionnés de lecture
          </h3>

          <form onSubmit={handleSubscribe} className="max-w-md mx-auto flex flex-col sm:flex-row gap-2 pt-2">
            <div className="relative flex-1">
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Entrez votre adresse e-mail"
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-slate-800 dark:focus:border-slate-400 shadow-2xs"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold uppercase tracking-wider rounded-md transition-all shrink-0 shadow-xs flex items-center justify-center gap-1.5"
            >
              {subscribed ? (
                <>
                  <Check size={14} />
                  <span>Inscrit !</span>
                </>
              ) : (
                <span>Envoyer</span>
              )}
            </button>
          </form>

          {subscribed && (
            <p className="text-xs text-emerald-600 font-medium animate-fadeIn">
              Merci pour votre inscription à la lettre littéraire !
            </p>
          )}

          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            Vous vous inscrivez pour recevoir les nouveautés et sélections littéraires de {config?.nom_librairie || 'notre librairie'}.
            En vous inscrivant, vous acceptez notre politique de confidentialité. Vous pouvez vous désinscrire à tout moment.
          </p>
        </div>
      </section>

      {/* ── 2. GRAND FOOTER NOIR LUXE (EXACTEMENT COMME LA CAPTURE) ────────── */}
      <footer className="bg-[#141414] text-slate-300 pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Main 4 Columns + Social Icons Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-10">
            
            {/* Colonne 1 : AIDE */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-100">
                Aide
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li>
                  <Link href="/catalogue" className="hover:text-white transition-colors">
                    Service Client & Conseil
                  </Link>
                </li>
                <li>
                  <Link href="/catalogue" className="hover:text-white transition-colors">
                    Livraison & Expédition
                  </Link>
                </li>
                <li>
                  <Link href="/catalogue" className="hover:text-white transition-colors">
                    Authenticité & Qualité
                  </Link>
                </li>
                <li>
                  <Link href="/catalogue" className="hover:text-white transition-colors">
                    Foire Aux Questions (FAQ)
                  </Link>
                </li>
                <li>
                  <Link href="/catalogue" className="hover:text-white transition-colors">
                    Contactez-Nous
                  </Link>
                </li>
                <li>
                  <Link href="/catalogue" className="hover:text-white transition-colors">
                    Conditions Générales de Vente
                  </Link>
                </li>
                <li>
                  <Link href="/catalogue" className="hover:text-white transition-colors">
                    Politique de Confidentialité
                  </Link>
                </li>
              </ul>
            </div>

            {/* Colonne 2 : EXPLORER LES PRODUITS */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-100">
                Explorer les Livres
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li>
                  <Link href="/catalogue" className="hover:text-white transition-colors">
                    Tous les Ouvrages
                  </Link>
                </li>
                <li>
                  <Link href="/catalogue" className="hover:text-white transition-colors">
                    Romans & Littérature
                  </Link>
                </li>
                <li>
                  <Link href="/catalogue" className="hover:text-white transition-colors">
                    Manuels Scolaires & Éducation
                  </Link>
                </li>
                <li>
                  <Link href="/catalogue" className="hover:text-white transition-colors">
                    Savoirs & Sciences Humaines
                  </Link>
                </li>
                <li>
                  <Link href="/catalogue" className="hover:text-white transition-colors">
                    Jeunesse & Albums Illustrés
                  </Link>
                </li>
                <li>
                  <Link href="/catalogue" className="hover:text-white transition-colors">
                    Bandes Dessinées & Mangas
                  </Link>
                </li>
                <li>
                  <Link href="/catalogue" className="hover:text-white transition-colors">
                    Beaux Livres & Encyclopédies
                  </Link>
                </li>
              </ul>
            </div>

            {/* Colonne 3 : EXPLORER LA GAMME */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-100">
                Sélections & Gammes
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li>
                  <Link href="/catalogue" className="hover:text-white transition-colors font-medium text-slate-300">
                    Meilleures Ventes
                  </Link>
                </li>
                <li>
                  <Link href="/catalogue" className="hover:text-white transition-colors">
                    Nouveautés de la Semaine
                  </Link>
                </li>
                <li>
                  <Link href="/catalogue" className="hover:text-white transition-colors">
                    Coups de Cœur des Libraires
                  </Link>
                </li>
                <li>
                  <Link href="/catalogue" className="hover:text-white transition-colors">
                    Offres Spéciales & Promotions
                  </Link>
                </li>
                <li>
                  <Link href="/catalogue" className="hover:text-white transition-colors">
                    Packs Rentrée Scolaire
                  </Link>
                </li>
                <li>
                  <Link href="/catalogue" className="hover:text-white transition-colors">
                    Derniers Ajouts
                  </Link>
                </li>
              </ul>
            </div>

            {/* Colonne 4 : À PROPOS */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-100">
                À Propos
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li>
                  <Link href="/catalogue" className="hover:text-white transition-colors">
                    Notre Histoire & Mission
                  </Link>
                </li>
                <li>
                  <Link href="/catalogue" className="hover:text-white transition-colors">
                    Nos Libraires
                  </Link>
                </li>
                <li>
                  <Link href="/catalogue" className="hover:text-white transition-colors">
                    Engagement Éducatif & Culturel
                  </Link>
                </li>
                <li>
                  <Link href="/catalogue" className="hover:text-white transition-colors">
                    Journal Littéraire & Articles
                  </Link>
                </li>
                <li>
                  <Link href="/catalogue" className="hover:text-white transition-colors">
                    Nos Magasins & Partenaires
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors text-slate-300 font-medium">
                    Espace Professionnels (B2B)
                  </Link>
                </li>
                <li>
                  <Link href="/catalogue" className="hover:text-white transition-colors">
                    Plan du Site
                  </Link>
                </li>
              </ul>
            </div>

            {/* Colonne 5 : RÉSEAUX & BRANDING */}
            <div className="col-span-2 md:col-span-4 lg:col-span-1 space-y-6 lg:border-l lg:border-slate-800 lg:pl-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center">
                  <BookOpen size={16} strokeWidth={2.4} />
                </div>
                <span className="font-bold text-white text-sm">
                  {config?.nom_librairie || 'Librairie Numérique'}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Votre destination littéraire de référence. Ouvrages authentiques, expédition soignée et conseils personnalisés.
              </p>

              {/* Réseaux Sociaux (comme sur la capture) */}
              <div className="flex items-center gap-3 text-slate-400">
                <a href="#" className="p-2 rounded-full bg-slate-900 hover:bg-slate-800 hover:text-white transition-colors" title="Instagram">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="#" className="p-2 rounded-full bg-slate-900 hover:bg-slate-800 hover:text-white transition-colors" title="Facebook">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.374 14.5 5 15.667 5H18V0h-3.889C10.667 0 9 1.667 9 4.667V8z"/></svg>
                </a>
                <a href="#" className="p-2 rounded-full bg-slate-900 hover:bg-slate-800 hover:text-white transition-colors" title="YouTube">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
                <a href="#" className="p-2 rounded-full bg-slate-900 hover:bg-slate-800 hover:text-white transition-colors" title="LinkedIn">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
                <a href="#" className="p-2 rounded-full bg-slate-900 hover:bg-slate-800 hover:text-white transition-colors" title="X">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </a>
              </div>
            </div>

          </div>

          {/* Bottom Bar : Certification & Copyright */}
          <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full border border-slate-700 flex items-center justify-center font-serif text-[10px] text-slate-300">
                B
              </div>
              <p>
                Vous avez une question ? Contactez notre support : <a href="mailto:support@librairienumerique.com" className="text-slate-300 hover:underline">support@librairienumerique.com</a>
              </p>
            </div>

            <p className="text-slate-400">
              Tous droits réservés © {currentYear} {config?.nom_librairie || 'Librairie Numérique'}.
            </p>
          </div>

        </div>
      </footer>

    </div>
  );
}
