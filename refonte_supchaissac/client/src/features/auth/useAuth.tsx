import { useState } from 'react';

export function useAuth() {
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(username: string, password: string) {
    setLoading(true);
    setError(null);
    try {
      // TODO: call backend API
      if (username === 'admin' && password === 'admin') {
        // Simule une connexion
        return true;
      } else {
        throw new Error('Identifiants invalides');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return { login, isLoading, error };
}
