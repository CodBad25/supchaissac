import React, { createContext, useContext, useState } from 'react';

interface AuthContextProps {
  user: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function login(username: string, password: string) {
    console.log('AuthContext.login appelé avec:', username);
    setIsLoading(true);
    try {
      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Définition de l\'utilisateur:', username);
      setUser(username);
      console.log('Utilisateur défini, état user:', username);
    } finally {
      setIsLoading(false);
      console.log('Loading terminé');
    }
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}

// Composant pour protéger les routes nécessitant l'authentification
export const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthContext();
  console.log('RequireAuth - utilisateur actuel:', user);
  if (!user) {
    console.log('Pas d\'utilisateur, redirection vers /login');
    window.location.href = '/login';
    return null;
  }
  console.log('Utilisateur connecté, affichage du contenu');
  return <>{children}</>;
};
