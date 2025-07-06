import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { ToastProvider } from '@/hooks/use-toast';
import { SecretaryView } from '@/components/secretary/SecretaryComponents';

// Composant de connexion
function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(username, password);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Gestion des Heures Supplémentaires
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Connectez-vous pour accéder à l'application
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Nom d'utilisateur
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Nom d'utilisateur"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
          
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isLoading ? 'Connexion en cours...' : 'Se connecter'}
            </button>
          </div>
          
          <div className="text-sm text-center">
            <p className="text-gray-600">
              Pour la démo, utilisez n'importe quel nom d'utilisateur et mot de passe.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

// Composant principal qui gère l'authentification
function AppContent() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <LoginPage />;
  }
  
  // Afficher la vue correspondant au rôle de l'utilisateur
  switch (user.role) {
    case 'SECRETARY':
      return <SecretaryView />;
    case 'TEACHER':
      return <div>Vue Enseignant (à implémenter)</div>;
    case 'PRINCIPAL':
      return <div>Vue Direction (à implémenter)</div>;
    default:
      return <div>Rôle non reconnu</div>;
  }
}

// Composant racine de l'application
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow">
              <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                <h1 className="text-2xl font-bold text-gray-900">
                  Gestion des Heures Supplémentaires
                </h1>
              </div>
            </header>
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <AppContent />
            </main>
          </div>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
