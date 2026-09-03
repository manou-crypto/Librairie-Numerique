import { API_BASE_URL, getAuthHeaders } from '@/lib';

/**
 * Fetcher universel pour SWR qui inclut automatiquement le token JWT
 * à partir de getAuthHeaders() de notre configuration existante.
 * @param url Le chemin de l'API (ex: '/v1/users' ou URL complète)
 */
export const fetcher = async (url: string) => {
  // S'assurer que l'URL est complète
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  const res = await fetch(fullUrl, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const error = new Error('Une erreur est survenue lors de la récupération des données.');
    // Attacher des informations supplémentaires à l'objet d'erreur.
    let info = {};
    try {
      info = await res.json();
    } catch (e) {}
    (error as any).info = info;
    (error as any).status = res.status;
    throw error;
  }

  return res.json();
};

/**
 * Configuration par défaut recommandée pour les requêtes de données sensibles au temps (ERP/POS)
 */
export const SWR_DEFAULT_CONFIG = {
  refreshInterval: 5000, // Polling toutes les 5 secondes
  revalidateOnFocus: true, // Rafraîchir quand la fenêtre reprend le focus
  shouldRetryOnError: false,
};
