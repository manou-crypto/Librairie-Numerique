'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Eye, EyeOff, Lock, Mail, AlertCircle, Shield } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-5xl bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        
        {/* Left Side - Login Form */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center relative">
          
          <div className="flex items-center gap-3 mb-10 text-primary">
             {config?.logo_url ? (
                <img src={config.logo_url} alt="Logo" className="w-10 h-10 object-contain" />
              ) : (
                <BookOpen size={28} />
              )}
             <span className="font-bold text-xl text-slate-800">{config?.nom_librairie || 'LibrairieNumérique'}</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-8 text-center">Log in</h2>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg p-3 mb-5 fade-in">
              <AlertCircle size={16} className="text-negative shrink-0 mt-0.5" />
              <p className="text-xs text-negative font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5 max-w-sm mx-auto w-full">
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user name"
                required
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20 focus:border-[#1a237e] transition-all"
                autoComplete="email"
              />
            </div>

            <div className="relative">
              <Lock
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                required
                className="w-full pl-11 pr-12 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20 focus:border-[#1a237e] transition-all"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="flex justify-end">
              <a href="#" className="text-xs text-gray-400 hover:text-[#1a237e] transition-colors">
                forgot your password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1a237e] hover:bg-[#121858] text-white rounded-xl text-sm font-semibold shadow-lg shadow-[#1a237e]/30 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Connexion...
                </>
              ) : (
                'Log in'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            don't have any account? <a href="#" className="text-[#1a237e] font-semibold hover:underline">Sign Up</a>
          </p>
        </div>

        {/* Right Side - Branding Banner */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#1a237e] via-[#283593] to-[#000051] p-12 flex-col items-center justify-center relative overflow-hidden text-center text-white">
          {/* Abstract background shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/5 rotate-45 skew-x-12 transform origin-center"></div>
          <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-white/5 rotate-12 rounded-3xl transform origin-center"></div>
          
          <div className="relative z-10 flex flex-col items-center gap-4">
             {config?.logo_url ? (
                <img src={config.logo_url} alt="Logo" className="w-24 h-24 object-contain drop-shadow-xl mb-4" />
              ) : (
                 <BookOpen size={64} className="opacity-90 mb-4" />
              )}
            <h1 className="text-5xl font-black tracking-wider drop-shadow-md">WELCOME !</h1>
            <p className="text-blue-100 font-medium tracking-wide">Log in to continue</p>
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
