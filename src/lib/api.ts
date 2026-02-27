// Wrapper centralisé pour les appels API avec gestion d'erreurs

const API_BASE = '/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Effectue un appel API avec gestion automatique des erreurs
 * - Inclut les credentials (cookies de session)
 * - Gère les erreurs 401 (session expirée)
 * - Gère les erreurs serveur
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Session expirée
  if (res.status === 401) {
    window.location.href = '/login';
    throw new ApiError(401, 'Session expirée');
  }

  // Erreur serveur
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Erreur serveur' }));
    throw new ApiError(res.status, data.error || `Erreur ${res.status}`);
  }

  return res.json();
}
