'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ArrowRight,
  Package,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  Layers,
  HelpCircle,
  MapPin,
  LogIn,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAppConfig } from '@/contexts/ConfigContext';
import { produitsService, Produit, CategorieItem } from '@/services/produits.service';
import PublicFooter from '@/components/public/PublicFooter';

const HERO_SLIDES = [
  {
    id: 1,
    tagline1: 'LISEZ JUSTE.',
    tagline2: 'PENSEZ LIBRE.',
    tagline3: 'VOYEZ GRAND.',
    subtitle:
      'Des éditions d’exception sélectionnées pour inspirer votre quotidien et nourrir votre esprit.',
    ctaLabel: 'MEILLEURES VENTES',
    ctaLink: '/catalogue',
    bgGradient: 'from-amber-950/80 via-stone-900/60 to-black/70',
    bgImage:
      'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=2000&q=80',
  },
  {
    id: 2,
    tagline1: 'CULTIVEZ L’ESPRIT.',
    tagline2: 'NOURRISSEZ VOS PASSIONS.',
    tagline3: 'DEVENEZ PLUS.',
    subtitle:
      'Manuels de référence, sciences, essais et guides pratiques pour tous les curieux et étudiants.',
    ctaLabel: 'UNIVERS SAVOIRS & ÉTUDES',
    ctaLink: '/catalogue',
    bgGradient: 'from-slate-950/85 via-stone-900/60 to-slate-900/80',
    bgImage:
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=2000&q=80',
  },
  {
    id: 3,
    tagline1: 'ÉVADEZ-VOUS.',
    tagline2: 'PAGE APRÈS PAGE.',
    tagline3: 'SANS LIMITES.',
    subtitle:
      'Plongez dans les plus grands récits contemporains, romans et bandes dessinées captivantes.',
    ctaLabel: 'DÉCOUVRIR LES NOUVEAUTÉS',
    ctaLink: '/catalogue',
    bgGradient: 'from-stone-950/80 via-neutral-900/60 to-black/80',
    bgImage:
      'https://images.unsplash.com/photo-1507842229456-1cb7d55f0535?auto=format&fit=crop&w=2000&q=80',
  },
];

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { config } = useAppConfig();
  const devise = config?.devise || 'FCFA';

  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<CategorieItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState<Produit | null>(null);

  // Charger les données du catalogue
  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          produitsService.getAll({ pageSize: 12 }).catch(() => ({ data: [] })),
          produitsService.getCategories().catch(() => []),
        ]);
        setProducts((prodRes.data || []).filter((p) => p.status !== 'MASQUE'));
        setCategories(catRes || []);
      } catch (e) {
        console.error('Erreur chargement vitrine:', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Défilement automatique du carrousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalogue?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/catalogue');
    }
  };

  const nextSlide = () => setCurrentSlide((currentSlide + 1) % HERO_SLIDES.length);
  const prevSlide = () =>
    setCurrentSlide((currentSlide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);

  return (
    <div className="min-h-screen bg-[#FAFAF8] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* ── 1. TOP UTILITY BAR (BELLROY STYLE) ────────────────────────────── */}
      <div className="bg-[#F3F3EF] dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="hidden sm:flex items-center gap-4">
            <span className="font-medium tracking-wide">📦 Disponibilité & livraison express</span>
            <span className="opacity-40">•</span>
            <span>Conseils littéraires & commande simplifiée</span>
          </div>

          <div className="flex items-center gap-5 ml-auto text-[11px]">
            <Link
              href="/services#points-de-vente"
              className="hover:text-slate-950 dark:hover:text-white transition-colors flex items-center gap-1"
            >
              <MapPin size={12} />
              <span>Points de vente</span>
            </Link>
            <a
              href="#footer"
              className="hover:text-slate-950 dark:hover:text-white transition-colors flex items-center gap-1"
            >
              <HelpCircle size={12} />
              <span>Besoin d'aide ?</span>
            </a>
            {user ? (
              <Link
                href="/dashboard"
                className="font-semibold text-slate-900 dark:text-white hover:underline flex items-center gap-1"
              >
                <LayoutDashboard size={12} />
                <span>Espace Gestion</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="font-semibold text-slate-900 dark:text-white hover:underline flex items-center gap-1"
              >
                <LogIn size={12} />
                <span>Espace Pro</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. MAIN HEADER & CATEGORY NAVIGATION ─────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#FAFAF8]/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-18 flex items-center justify-between gap-6">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center shadow-xs transition-transform group-hover:scale-105">
                <BookOpen size={16} strokeWidth={2.4} />
              </div>
              <span className="font-bold tracking-tight text-lg sm:text-xl text-slate-900 dark:text-white">
                {config?.nom_librairie || 'Bellroy Librairie'}
              </span>
            </Link>

            {/* Centered Navigation Links (Bellroy-like category tabs) */}
            <nav className="hidden lg:flex items-center gap-6 text-[13px] font-medium text-slate-700 dark:text-slate-300">
              <Link
                href="/catalogue"
                className="hover:text-slate-950 dark:hover:text-white transition-colors"
              >
                À la une
              </Link>
              <Link
                href="/catalogue?category=Romans"
                className="hover:text-slate-950 dark:hover:text-white transition-colors"
              >
                Romans &amp; Récits
              </Link>
              <Link
                href="/catalogue?category=Scolaire"
                className="hover:text-slate-950 dark:hover:text-white transition-colors"
              >
                Scolaire &amp; Études
              </Link>
              <Link
                href="/catalogue?category=Savoirs"
                className="hover:text-slate-950 dark:hover:text-white transition-colors"
              >
                Savoirs &amp; Essais
              </Link>
              <Link
                href="/catalogue?category=Jeunesse"
                className="hover:text-slate-950 dark:hover:text-white transition-colors"
              >
                Jeunesse &amp; BD
              </Link>
              <Link
                href="/services"
                className="hover:text-slate-950 dark:hover:text-white transition-colors"
              >
                À Propos
              </Link>
            </nav>

            {/* Quick Actions (Catalog & Cart link) */}
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/catalogue"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 shadow-xs transition-all"
              >
                <span>Catalogue Complet</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Central Bellroy Search Bar */}
          <div className="pb-3 max-w-2xl mx-auto">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Que recherchez-vous ? (Titre, auteur, collection, référence...)"
                className="w-full pl-5 pr-11 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-slate-400 dark:focus:border-slate-600 shadow-xs transition-all text-center sm:text-left sm:pl-6"
              />
              <button
                type="submit"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors p-1"
                title="Rechercher"
              >
                <Search size={16} />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ── 3. HERO FULL-WIDTH SECTION (EXACT BELLROY COMPOSITION) ────────── */}
      <section className="relative w-full h-[78vh] min-h-[520px] max-h-[760px] overflow-hidden bg-slate-900 flex items-center">
        {/* Carousel Slides */}
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive
                  ? 'opacity-100 pointer-events-auto z-10'
                  : 'opacity-0 pointer-events-none z-0'
              }`}
            >
              {/* Background Image with warm gradient overlay */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-7000 ease-out scale-105"
                style={{ backgroundImage: `url(${slide.bgImage})` }}
              />
              <div className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient}`} />

              {/* Foreground Typography Content */}
              <div className="relative h-full max-w-7xl mx-auto px-6 sm:px-12 lg:px-16 flex flex-col justify-center">
                <div className="max-w-2xl text-white space-y-4 sm:space-y-6">
                  {/* Punchy Tagline (Bellroy 3-lines bold typography) */}
                  <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight uppercase leading-[1.08] drop-shadow-sm">
                    <span>{slide.tagline1}</span>
                    <br />
                    <span>{slide.tagline2}</span>
                    <br />
                    <span className="text-slate-200">{slide.tagline3}</span>
                  </h1>

                  <p className="text-sm sm:text-base text-slate-200/90 font-light max-w-xl leading-relaxed">
                    {slide.subtitle}
                  </p>

                  {/* High-Impact CTA Badge */}
                  <div className="pt-2">
                    <Link
                      href={slide.ctaLink}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#E14B1C] hover:bg-[#C83E13] text-white text-xs sm:text-sm font-black tracking-wider uppercase shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>{slide.ctaLabel}</span>
                      <ArrowRight size={15} strokeWidth={2.5} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Carousel Arrow Controls (‹ ›) */}
        <button
          onClick={prevSlide}
          className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white/80 hover:text-white backdrop-blur-xs flex items-center justify-center transition-all"
          title="Précédent"
        >
          <ChevronLeft size={22} />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white/80 hover:text-white backdrop-blur-xs flex items-center justify-center transition-all"
          title="Suivant"
        >
          <ChevronRight size={22} />
        </button>

        {/* Pagination Dots at Bottom Center (• • •) */}
        <div className="absolute bottom-6 inset-x-0 z-20 flex justify-center items-center gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
              title={`Diapositive ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ── 4. CURATED BESTSELLERS & FEATURED SELECTION ───────────────────── */}
      <section className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-1">
              <Sparkles size={13} className="text-amber-500" />
              <span>Sélection de la Saison</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Les Incontournables de la Librairie
            </h2>
          </div>
          <Link
            href="/catalogue"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white hover:text-slate-600 dark:hover:text-slate-300 group"
          >
            <span>Voir tout le catalogue ({products.length} ouvrages)</span>
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="animate-pulse space-y-3">
                <div className="aspect-[3/4] bg-slate-200 dark:bg-slate-800 rounded-xl" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-sm w-2/3" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-sm w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10">
            {products.slice(0, 10).map((product) => {
              const inStock = product.stock > 0;
              return (
                <div
                  key={product.id}
                  onClick={() => setQuickViewProduct(product)}
                  className="group flex flex-col cursor-pointer"
                >
                  {/* Image container */}
                  <div className="relative aspect-[3/4] w-full rounded-xl bg-[#F2F2EE] dark:bg-slate-900 overflow-hidden flex items-center justify-center transition-all duration-300 group-hover:shadow-md">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.libelle}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 text-center text-slate-400 dark:text-slate-600">
                        <BookOpen
                          size={36}
                          strokeWidth={1.3}
                          className="mb-2 opacity-50 transition-transform duration-300 group-hover:scale-110"
                        />
                        <span className="text-[10px] uppercase font-mono tracking-wider opacity-70">
                          {product.categoryName || 'Édition'}
                        </span>
                      </div>
                    )}

                    {!inStock && (
                      <div className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md shadow-xs">
                        Épuisé
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-3 flex justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none px-3">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-white text-[11px] font-medium shadow-md backdrop-blur-xs">
                        <Eye size={12} />
                        <span>Aperçu rapide</span>
                      </span>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="mt-3 flex flex-col space-y-1">
                    <span className="text-[10px] font-medium tracking-wider text-slate-400 dark:text-slate-500 uppercase truncate">
                      {product.categoryName || 'Livre'}
                    </span>
                    <h3 className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                      {product.libelle}
                    </h3>
                    <div className="pt-1 flex items-baseline justify-between gap-2">
                      <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                        {product.prixVente.toLocaleString('fr-FR')}{' '}
                        <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">
                          {devise}
                        </span>
                      </span>
                      <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        />
                        <span className="hidden sm:inline">{inStock ? 'En stock' : 'Rupture'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 5. CURATED THEMATIC TILES (EXPLORER PAR UNIVERS) ─────────────── */}
      <section className="bg-[#F4F4F0] dark:bg-slate-900/50 py-16 sm:py-20 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Explorer par Univers
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Des collections pensées pour accompagner chaque étape de votre lecture.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Tile 1 – Romans */}
            <Link
              href="/catalogue?category=Romans"
              className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-900 flex flex-col justify-end p-6 text-white shadow-sm hover:shadow-xl transition-all"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="relative z-10 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                  Romans &amp; Littérature
                </span>
                <h3 className="text-xl font-bold">Grands Récits &amp; Auteurs</h3>
                <p className="text-xs text-slate-300 font-light line-clamp-1">
                  Les romans contemporains et classiques à ne pas manquer.
                </p>
              </div>
            </Link>

            {/* Tile 2 – Scolaire */}
            <Link
              href="/catalogue?category=Scolaire"
              className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-900 flex flex-col justify-end p-6 text-white shadow-sm hover:shadow-xl transition-all"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="relative z-10 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-sky-400">
                  Études &amp; Recherche
                </span>
                <h3 className="text-xl font-bold">Manuels &amp; Savoirs</h3>
                <p className="text-xs text-slate-300 font-light line-clamp-1">
                  Les manuels scolaires et essais universitaires de référence.
                </p>
              </div>
            </Link>

            {/* Tile 3 – Jeunesse */}
            <Link
              href="/catalogue?category=Jeunesse"
              className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-900 flex flex-col justify-end p-6 text-white shadow-sm hover:shadow-xl transition-all"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="relative z-10 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                  Culture &amp; Découverte
                </span>
                <h3 className="text-xl font-bold">Jeunesse &amp; Développement</h3>
                <p className="text-xs text-slate-300 font-light line-clamp-1">
                  Albums illustrés, éveil, BD et croissance personnelle.
                </p>
              </div>
            </Link>

            {/* Tile 4 – Savoirs */}
            <Link
              href="/catalogue?category=Savoirs"
              className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-900 flex flex-col justify-end p-6 text-white shadow-sm hover:shadow-xl transition-all"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="relative z-10 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-400">
                  Savoirs &amp; Société
                </span>
                <h3 className="text-xl font-bold">Essais &amp; Philosophie</h3>
                <p className="text-xs text-slate-300 font-light line-clamp-1">
                  Penseurs, débats contemporains, biographies et essais.
                </p>
              </div>
            </Link>

            {/* Tile 5 – Art & Design */}
            <Link
              href="/catalogue?category=Art"
              className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-900 flex flex-col justify-end p-6 text-white shadow-sm hover:shadow-xl transition-all"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?auto=format&fit=crop&w=800&q=80')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="relative z-10 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-400">
                  Art &amp; Créativité
                </span>
                <h3 className="text-xl font-bold">Beaux-Arts &amp; Design</h3>
                <p className="text-xs text-slate-300 font-light line-clamp-1">
                  Livres d'art, design graphique, architecture et photographie.
                </p>
              </div>
            </Link>

            {/* Tile 6 – Pratique */}
            <Link
              href="/catalogue?category=Pratique"
              className="group relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-900 flex flex-col justify-end p-6 text-white shadow-sm hover:shadow-xl transition-all"
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80')`,
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="relative z-10 space-y-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-400">
                  Guides &amp; Pratique
                </span>
                <h3 className="text-xl font-bold">Développement &amp; Bien-être</h3>
                <p className="text-xs text-slate-300 font-light line-clamp-1">
                  Coaching, management, santé et épanouissement personnel.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. BRAND VALUES (BELLROY VALUE PILLARS) ──────────────────────── */}
      <section className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
          <div className="space-y-3 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white mx-auto sm:mx-0">
              <BookOpen size={20} />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Sélection Rigoureuse
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
              Chaque ouvrage est vérifié, catalogué et sélectionné auprès d’éditeurs de renom pour
              vous garantir authenticité et qualité.
            </p>
          </div>

          <div className="space-y-3 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white mx-auto sm:mx-0">
              <Package size={20} />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Disponibilité en Temps Réel
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
              Notre stock est synchronisé en direct avec notre réseau de librairies pour vous
              assurer une disponibilité instantanée.
            </p>
          </div>

          <div className="space-y-3 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-2xs">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white mx-auto sm:mx-0">
              <Layers size={20} />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              Conseil & Espace Pro
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
              Un espace dédié aux libraires, institutions et passionnés pour gérer facilement leurs
              approvisionnements et commandes.
            </p>
          </div>
        </div>
      </section>

      {/* ── QUICK VIEW MODAL ─────────────────────────────────────────────── */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setQuickViewProduct(null)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800">
              <button
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <X size={16} />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2">
                <div className="bg-[#F2F2EE] dark:bg-slate-950 p-8 flex items-center justify-center min-h-[260px]">
                  {quickViewProduct.imageUrl ? (
                    <img
                      src={quickViewProduct.imageUrl}
                      alt={quickViewProduct.libelle}
                      className="max-h-72 object-contain rounded-md shadow-md"
                    />
                  ) : (
                    <div className="text-center text-slate-400">
                      <BookOpen size={64} strokeWidth={1.2} className="mx-auto mb-2 opacity-50" />
                      <span className="text-xs uppercase font-mono tracking-widest">
                        {quickViewProduct.categoryName || 'Ouvrage'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6 sm:p-8 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                      {quickViewProduct.categoryName}
                    </span>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mt-1 leading-snug">
                      {quickViewProduct.libelle}
                    </h2>

                    <div className="mt-3 text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                      {quickViewProduct.prixVente.toLocaleString('fr-FR')}{' '}
                      <span className="text-xs font-normal text-slate-500">{devise}</span>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      {quickViewProduct.stock > 0 ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                          <CheckCircle2 size={13} />
                          <span>
                            {quickViewProduct.stock} disponible
                            {quickViewProduct.stock > 1 ? 's' : ''}
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-xs font-medium">
                          <AlertCircle size={13} />
                          <span>Actuellement en rupture</span>
                        </div>
                      )}
                    </div>

                    {quickViewProduct.description && (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white mb-1">
                          Description
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-h-36 overflow-y-auto">
                          {quickViewProduct.description}
                        </p>
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/catalogue?search=${encodeURIComponent(quickViewProduct.libelle)}`}
                    className="w-full py-2.5 text-center rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-medium hover:bg-slate-800 transition-all shadow-xs"
                  >
                    Voir dans le catalogue
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. FOOTER & NEWSLETTER (BELLROY NOIR LUXE) ─────────────────── */}
      <PublicFooter />
    </div>
  );
}
