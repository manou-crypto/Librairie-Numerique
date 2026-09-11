'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut,
  Warehouse,
  FileText,
  Truck,
  ClipboardList,
  CreditCard,
  Globe,
  User,
  ShoppingBag,
  ClipboardCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Icon from '@/components/ui/AppIcon';
import { useAppConfig } from '@/contexts/ConfigContext';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  group: string;
  roles: Array<'super_admin' | 'manager' | 'cashier'>;
}

const navItems: NavItem[] = [
  {
    id: 'nav-dashboard',
    label: 'Tableau de bord',
    href: '/dashboard',
    icon: LayoutDashboard,
    group: 'Principal',
    roles: ['super_admin'],
  },
  {
    id: 'nav-pos',
    label: 'Point de vente',
    href: '/caisse',
    icon: ShoppingCart,
    badge: 0,
    group: 'Ventes',
    roles: ['super_admin', 'cashier'],
  },
  {
    id: 'nav-ventes',
    label: 'Historique ventes',
    href: '/ventes',
    icon: ShoppingBag,
    group: 'Ventes',
    roles: ['super_admin', 'cashier'],
  },
  {
    id: 'nav-catalogue',
    label: 'Produits & Catalogue',
    href: '/produits',
    icon: Package,
    group: 'Catalogue',
    roles: ['super_admin', 'manager'],
  },
  {
    id: 'nav-stock',
    label: 'Stock',
    href: '/stock',
    icon: Warehouse,
    group: 'Catalogue',
    roles: ['super_admin', 'manager'],
  },
  {
    id: 'nav-inventaire',
    label: 'Inventaire',
    href: '/inventaire',
    icon: ClipboardCheck,
    group: 'Catalogue',
    roles: ['super_admin', 'manager'],
  },
  {
    id: 'nav-achats',
    label: 'Achats',
    href: '/achats',
    icon: Truck,
    group: 'Catalogue',
    roles: ['super_admin', 'manager'],
  },
  {
    id: 'nav-fournisseurs',
    label: 'Fournisseurs',
    href: '/fournisseurs',
    icon: ClipboardList,
    group: 'Catalogue',
    roles: ['super_admin', 'manager'],
  },
  {
    id: 'nav-finances',
    label: 'Finances',
    href: '/finances',
    icon: BarChart3,
    group: 'Gestion',
    roles: ['super_admin'],
  },
  {
    id: 'nav-utilisateurs',
    label: 'Utilisateurs',
    href: '/utilisateurs',
    icon: Users,
    group: 'Gestion',
    roles: ['super_admin'],
  },
  {
    id: 'nav-rapports',
    label: 'Rapports',
    href: '/rapports',
    icon: FileText,
    group: 'Gestion',
    roles: ['super_admin'],
  },
  {
    id: 'nav-caisses',
    label: 'Caisses',
    href: '/caisses',
    icon: CreditCard,
    group: 'Gestion',
    roles: ['super_admin'],
  },
  {
    id: 'nav-catalogue-public',
    label: 'Gestion Catalogue',
    href: '/gestion-catalogue',
    icon: Globe,
    group: 'Catalogue',
    roles: ['super_admin', 'manager'],
  },
  {
    id: 'nav-notifications',
    label: 'Notifications',
    href: '/notifications',
    icon: Bell,
    group: 'Système',
    roles: ['super_admin', 'manager', 'cashier'],
  },
  {
    id: 'nav-parametres',
    label: 'Paramètres',
    href: '/parametres',
    icon: Settings,
    group: 'Système',
    roles: ['super_admin'],
  },
  {
    id: 'nav-profil',
    label: 'Mon profil',
    href: '/profil',
    icon: User,
    group: 'Système',
    roles: ['super_admin', 'manager', 'cashier'],
  },
];

const PERMISSION_BY_HREF: Record<string, string> = {
  '/dashboard': 'VIEW_DASHBOARD',
  '/caisse': 'VIEW_POS',
  '/ventes': 'VIEW_VENTES',
  '/produits': 'VIEW_CATALOGUE',
  '/stock': 'VIEW_STOCK',
  '/inventaire': 'VIEW_INVENTAIRE',
  '/achats': 'VIEW_ACHATS',
  '/fournisseurs': 'VIEW_FOURNISSEURS',
  '/finances': 'VIEW_FINANCES',
  '/utilisateurs': 'VIEW_UTILISATEURS',
  '/rapports': 'VIEW_RAPPORTS',
  '/caisses': 'VIEW_CAISSES',
  '/catalogue': 'VIEW_CATALOGUE',
  '/gestion-catalogue': 'VIEW_GESTION_CATALOGUE',
  '/notifications': 'VIEW_NOTIFICATIONS',
  '/parametres': 'VIEW_PARAMETRES',
  '/profil': 'ALL',
};

const groups = ['Principal', 'Ventes', 'Catalogue', 'Gestion', 'Système'];

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  manager: 'Gestionnaire',
  cashier: 'Caissier',
};
function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
interface SidebarProps {
  currentPath: string;
}

export default function Sidebar({ currentPath }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const { config } = useAppConfig();

  const rawRole = user?.roleUi ?? user?.role ?? 'super_admin';
  const roleMap: Record<string, 'super_admin' | 'manager' | 'cashier'> = {
    ADMIN: 'super_admin',
    super_admin: 'super_admin',
    GESTIONNAIRE_CATALOGUE: 'manager',
    ACHETEUR_STOCK: 'manager',
    manager: 'manager',
    CAISSIER: 'cashier',
    cashier: 'cashier',
  };
  const userRole = roleMap[rawRole] ?? 'super_admin';

  const visibleItems = navItems.filter((item) => {
    if (user?.role === 'ADMIN' || rawRole === 'ADMIN' || rawRole === 'super_admin') {
      return true;
    }
    if (item.href === '/profil') return true;

    // Si des permissions personnalisées sont définies
    if (user?.permissions && user.permissions.length > 0) {
      const reqPerm = PERMISSION_BY_HREF[item.href];
      return reqPerm ? user.permissions.includes(reqPerm) : false;
    }

    return item.roles.includes(userRole);
  });

  const isActive = (href: string) => {
    if (href === '/dashboard') return currentPath === '/dashboard' || currentPath === '/';
    return currentPath.startsWith(href);
  };

  const displayName = user?.name ?? '';
  const displayInitials = user?.name ? getInitials(user.name) : '';
  const displayRole = user ? (roleLabels[userRole] ?? userRole) : '';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div
        className={`flex items-center gap-3 px-4 py-4 border-b border-border ${collapsed ? 'justify-center' : ''}`}
      >
        {config?.logo_url ? (
          <img src={config.logo_url} alt="Logo" className="w-8 h-8 object-contain" />
        ) : (
          <AppLogo size={32} />
        )}
        {!collapsed && (
          <span className="font-bold text-base text-foreground tracking-tight">
            {config?.nom_librairie || 'LibrairieNumerique'}
          </span>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
        {groups.map((group) => {
          const items = visibleItems.filter((n) => n.group === group);
          if (!items.length) return null;
          return (
            <div key={`group-${group}`} className="mb-4">
              {!collapsed && (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 mb-1">
                  {group}
                </p>
              )}
              {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-3 px-3 py-2 mb-0.5 text-sm font-medium transition-all duration-150 ${active ? 'nav-item-active' : 'nav-item-inactive'} ${collapsed ? 'justify-center' : ''}`}
                  >
                    <Icon size={18} className="shrink-0" />
                    {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                    {!collapsed && item.badge !== undefined && item.badge > 0 && (
                      <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
      {user && (
        <div className="border-t border-border px-2 py-3">
          <div
            className={`flex items-center gap-3 px-3 py-2 rounded-lg ${collapsed ? 'justify-center' : ''}`}
          >
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-primary">{displayInitials}</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{displayName}</p>
                <p className="text-[10px] text-muted-foreground">{displayRole}</p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={logout}
                className="text-muted-foreground hover:text-negative transition-colors"
                title="Se déconnecter"
              >
                <LogOut size={15} />
              </button>
            )}
          </div>
        </div>
      )}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 bg-card border border-border rounded-full w-6 h-6 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-10"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </div>
  );

  return (
    <>
      <aside
        className={`relative hidden lg:flex flex-col bg-card border-r border-border transition-all duration-300 ease-in-out shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}
      >
        <SidebarContent />
      </aside>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col lg:hidden transform transition-transform duration-300 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <SidebarContent />
      </aside>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-30 lg:hidden bg-card border border-border rounded-lg p-2 shadow-sm"
        aria-label="Ouvrir le menu"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M2 4h14M2 9h14M2 14h14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </>
  );
}
