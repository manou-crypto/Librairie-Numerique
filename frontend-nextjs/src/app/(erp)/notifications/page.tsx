'use client';
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import Topbar from '@/components/Topbar';
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle,
  ShoppingBag,
  Package,
  CreditCard,
  Users,
  Loader2,
} from 'lucide-react';
import {
  notificationsService,
  NotificationItem,
  NotifType,
} from '@/services/notifications.service';

const TYPE_CONFIG: Record<NotifType, { icon: React.ElementType; className: string; bg: string }> = {
  alerte: { icon: AlertTriangle, className: 'text-negative', bg: 'bg-negative/10' },
  info: { icon: Info, className: 'text-primary', bg: 'bg-primary/10' },
  succes: { icon: CheckCircle, className: 'text-positive', bg: 'bg-positive/10' },
  vente: { icon: ShoppingBag, className: 'text-primary', bg: 'bg-primary/10' },
  stock: { icon: Package, className: 'text-warning', bg: 'bg-warning/10' },
  caisse: { icon: CreditCard, className: 'text-foreground', bg: 'bg-muted' },
  utilisateur: { icon: Users, className: 'text-primary', bg: 'bg-primary/10' },
};

type FilterTab = 'toutes' | 'non_lues' | 'alertes' | 'ventes' | 'stock';

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<NotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>('toutes');
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const data = await notificationsService.getAll();
      setNotifs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const nonLues = notifs.filter((n) => !n.lue).length;

  const filtered = notifs.filter((n) => {
    if (activeTab === 'non_lues') return !n.lue;
    if (activeTab === 'alertes') return n.type === 'alerte';
    if (activeTab === 'ventes') return n.type === 'vente';
    if (activeTab === 'stock') return n.type === 'stock';
    return true;
  });

  const markAllRead = async () => {
    await notificationsService.markAllAsRead();
    fetchNotifs();
  };
  const markRead = async (id: number) => {
    await notificationsService.markAsRead(id);
    fetchNotifs();
  };
  const deleteNotif = async (id: number) => {
    await notificationsService.remove(id);
    fetchNotifs();
  };
  const clearAll = async () => {
    await notificationsService.removeAll();
    fetchNotifs();
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'toutes', label: 'Toutes' },
    { key: 'non_lues', label: `Non lues (${nonLues})` },
    { key: 'alertes', label: 'Alertes' },
    { key: 'ventes', label: 'Ventes' },
    { key: 'stock', label: 'Stock' },
  ];

  return (
    <AppLayout currentPath="/notifications">
      <Topbar title="Notifications" subtitle="Centre de notifications et alertes système" />
      <div className="px-6 py-6 max-w-screen-2xl mx-auto space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="kpi-card-info">
            <p className="text-xs text-muted-foreground mb-1">Total notifications</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">{notifs.length}</p>
          </div>
          <div className="kpi-card-warning">
            <p className="text-xs text-muted-foreground mb-1">Non lues</p>
            <p className="text-2xl font-bold text-warning tabular-nums">{nonLues}</p>
          </div>
          <div className="kpi-card-neutral">
            <p className="text-xs text-muted-foreground mb-1">Alertes stock</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {notifs.filter((n) => n.type === 'stock').length}
            </p>
          </div>
          <div className="kpi-card-positive">
            <p className="text-xs text-muted-foreground mb-1">Lues</p>
            <p className="text-2xl font-bold text-positive tabular-nums">
              {notifs.filter((n) => n.lue).length}
            </p>
          </div>
        </div>
        <div className="card-base overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${activeTab === tab.key ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {nonLues > 0 && (
                <button
                  onClick={markAllRead}
                  className="btn-secondary flex items-center gap-1.5 text-xs py-1.5"
                >
                  <CheckCheck size={13} /> Tout marquer lu
                </button>
              )}
              {notifs.length > 0 && (
                <button
                  onClick={clearAll}
                  className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 text-negative border-negative/30 hover:bg-negative/5"
                >
                  <Trash2 size={13} /> Tout effacer
                </button>
              )}
            </div>
          </div>
          <div className="divide-y divide-border">
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <Bell size={32} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Aucune notification</p>
              </div>
            ) : (
              filtered.map((notif) => {
                const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
                const Icon = cfg.icon;
                const formattedDate = new Date(notif.date_creation).toLocaleString('fr-FR', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <div
                    key={notif.id_notification}
                    className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/30 ${!notif.lue ? 'bg-primary/5' : ''}`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}
                    >
                      <Icon size={16} className={cfg.className} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-sm font-semibold ${!notif.lue ? 'text-foreground' : 'text-muted-foreground'}`}
                          >
                            {notif.titre}
                          </p>
                          {!notif.lue && (
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                          {formattedDate}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        {!notif.lue && (
                          <button
                            onClick={() => markRead(notif.id_notification)}
                            className="text-xs text-primary hover:underline"
                          >
                            Marquer comme lu
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotif(notif.id_notification)}
                          className="text-xs text-muted-foreground hover:text-negative transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
