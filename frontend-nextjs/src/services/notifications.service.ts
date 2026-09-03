import { API_BASE_URL, getAuthHeaders } from '@/lib';

export type NotifType = 'alerte' | 'info' | 'succes' | 'vente' | 'stock' | 'caisse' | 'utilisateur';

export interface NotificationItem {
  id_notification: number;
  type: NotifType;
  titre: string;
  message: string;
  lue: boolean;
  date_creation: string;
}

export const notificationsService = {
  async getAll(): Promise<NotificationItem[]> {
    const res = await fetch(`${API_BASE_URL}/v1/notifications`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Erreur chargement notifications');
    return res.json();
  },

  async markAsRead(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/v1/notifications/${id}/lu`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Erreur maj notification');
  },

  async markAllAsRead(): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/v1/notifications/marquer-tout-lu`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Erreur maj notifications');
  },

  async remove(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/v1/notifications/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Erreur suppression notification');
  },

  async removeAll(): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/v1/notifications/supprimer-tout`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Erreur suppression notifications');
  },
};
