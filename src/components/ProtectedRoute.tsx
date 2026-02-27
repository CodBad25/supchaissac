import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

/**
 * Composant pour protéger les routes
 * - Redirige vers /login si l'utilisateur n'est pas connecté
 * - Redirige vers /login si le rôle de l'utilisateur n'est pas autorisé
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  // Affiche un chargement pendant la récupération des données utilisateur
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  // Redirige vers login si pas d'utilisateur
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Vérifie les rôles autorisés si spécifiés
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
