import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

interface MockProtectedRouteProps {
  component: React.ComponentType;
  path?: string;
}

export function MockProtectedRoute({ component: Component, ...rest }: MockProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const user = localStorage.getItem('mockUser');
    if (user) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      setLocation('/auth');
    }
  }, [setLocation]);

  // Afficher un écran de chargement pendant la vérification
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur est authentifié, afficher le composant
  return isAuthenticated ? <Component {...rest} /> : null;
}
