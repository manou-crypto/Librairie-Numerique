'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useAppConfig } from '@/contexts/ConfigContext';

const ROLE_REDIRECTS: Record<string, string> = {
  super_admin: '/dashboard',
  manager: '/produits',
  cashier: '/caisse',
  ADMIN: '/dashboard',
  GESTIONNAIRE_CATALOGUE: '/produits',
  ACHETEUR_STOCK: '/stock',
  CAISSIER: '/caisse',
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect');
  const { config } = useAppConfig();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user } = await authService.login({ email, password });
      const target =
        redirectTarget || ROLE_REDIRECTS[user.roleUi] || ROLE_REDIRECTS[user.role] || '/dashboard';
      router.push(target);
    } catch (err: any) {
      setError(err.message || 'Échec de la connexion. Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-8">
      
      <div className="w-full max-w-[1200px] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[700px]">
        
        {/* Left Content - Login Form */}
        <div className="w-full lg:w-[45%] p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white relative z-10">
          
          <div className="mb-12">
             {config?.logo_url ? (
                <img src={config.logo_url} alt="Logo" className="h-16 w-auto object-contain mb-6 drop-shadow-sm" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <BookOpen size={32} className="text-primary" />
                </div>
              )}
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Bienvenue, 👋
            </h1>
            <h2 className="text-xl font-bold text-slate-800 mt-2">Bon retour parmi nous !</h2>
            <p className="text-slate-500 mt-2 text-sm">Connectez-vous pour commencer votre journée.</p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            
            <div>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre adresse email"
                  required
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  required
                  className="w-full pl-5 pr-12 py-4 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center mt-2">
               <a href="#" className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors">
                 Mot de passe oublié ? 😕
               </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-8 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
          
        </div>

        {/* Right Content - Full Image with Glassmorphism Overlay */}
        <div className="w-full lg:w-[55%] relative hidden lg:block">
           <img 
              src="/assets/images/login_bg.jpg" 
              alt="Library Background" 
              className="absolute inset-0 w-full h-full object-cover" 
           />
           
           {/* Dark Gradient to ensure text readability */}
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent flex flex-col justify-end p-12">
              
              {/* Glassmorphism Blur Box */}
              <div className="backdrop-blur-xl bg-slate-900/40 border border-white/10 p-10 rounded-3xl shadow-2xl max-w-lg mx-auto w-full transform translate-y-4">
                 <h2 className="text-2xl font-bold text-white mb-3 leading-snug">
                   Espace de connexion réservé au personnel de <span className="text-blue-300">{config?.nom_librairie}</span>
                 </h2>
                 <p className="text-slate-300 text-sm font-medium">
                   Gérez efficacement votre librairie, communiquez avec votre équipe et suivez vos ventes en un clin d'œil.
                 </p>
                 
                 {/* Decorative Dots */}
                 <div className="flex gap-2 mt-8 justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-white/30"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-white/30"></div>
                 </div>
              </div>

           </div>
        </div>
        
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}
    >
      <LoginForm />
    </React.Suspense>
  );
}
