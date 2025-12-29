/**
 * Configuration API - Détecte automatiquement l'URL du backend
 * Sur mobile, utilise l'IP du réseau local
 */

// Détecte si on est sur localhost ou sur le réseau
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// URL de base de l'API
export const API_BASE_URL = isLocalhost
  ? 'http://localhost:3001'
  : `http://${window.location.hostname}:3001`;

// Helper pour les appels API
export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;
