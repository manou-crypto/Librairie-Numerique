'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, Eye, EyeOff, Lock, Mail, AlertCircle, Shield } from 'lucide-react';
import { authService } from '@/services/auth.service';

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
      // Appel direct de l'API d'authentification NestJS (/api/v1/auth/login)
      const { user } = await authService.login({ email, password });

      // Déterminer la redirection selon la cible demandée ou le rôle de l'utilisateur
      const target = redirectTarget || ROLE_REDIRECTS[user.roleUi] || ROLE_REDIRECTS[user.role] || '/dashboard';
      router.push(target);
    } catch (err: any) {
      setError(err.message || 'Échec de la connexion. Vérifiez vos identifiants.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary shadow-lg mb-4">
            <BookOpen size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">LibrairieNumérique</h1>
          <p className="text-sm text-muted-foreground mt-1">Plateforme de Gestion Intégrée ERP & POS</p>
        </div>

        {/* Formulaire de Connexion */}
        <div className="card-base p-8 shadow-xl">
          <div className="flex items-center gap-2 mb-6">
            <Shield size={18} className="text-primary" />
            <h2 className="text-base font-bold text-foreground">Connexion sécurisée</h2>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-lg p-3 mb-5 fade-in">
              <AlertCircle size={16} className="text-negative shrink-0 mt-0.5" />
              <p className="text-xs text-negative font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Adresse email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@librairie.ci"
                  required
                  className="input-field pl-9"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input-field pl-9 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Connexion au serveur...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          <a href="/catalogue" className="text-primary hover:underline">← Retour au catalogue public</a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <LoginForm />
    </React.Suspense>
  );
}
