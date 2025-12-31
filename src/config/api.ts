/**
 * Configuration API
 * En dev, Vite proxy redirige /api vers localhost:3001
 * En prod, meme domaine (relative URL)
 */

// Toujours utiliser des URLs relatives - le proxy Vite gere la redirection en dev
export const API_BASE_URL = '';

// Helper pour les appels API
export const apiUrl = (path: string) => `${API_BASE_URL}${path}`;
