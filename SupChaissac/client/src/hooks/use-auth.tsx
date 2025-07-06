import { useState, useEffect, createContext, useContext } from 'react';
import { mockUsers } from '@/data/mockData';

// Type pour l'utilisateur
export interface User {
  id: number;
  username: string;
  name: string;
  firstName: string;
  email: string;
  role: 'TEACHER' | 'SECRETARY' | 'PRINCIPAL' | 'ADMIN';
  inPacte?: boolean;
}

// Type pour le contexte d'authentification
interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

// Créer le contexte d'authentification
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personnalisé pour utiliser le contexte d'authentification
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
}

// Provider pour le contexte d'authentification
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Simuler la vérification de l'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Simuler un délai d'API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Simuler un utilisateur déjà connecté (pour la démo)
        // Dans une vraie implémentation, on vérifierait le token dans le localStorage ou les cookies
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          // Pour la démo, on connecte automatiquement l'utilisateur avec le rôle PRINCIPAL
          const secretaryUser = mockUsers.find(u => u.role === 'PRINCIPAL');
          if (secretaryUser) {
            const user: User = {
              id: secretaryUser.id,
              username: secretaryUser.username,
              name: secretaryUser.name,
              firstName: secretaryUser.firstName || '',
              email: secretaryUser.email,
              role: secretaryUser.role as 'TEACHER' | 'SECRETARY' | 'PRINCIPAL' | 'ADMIN',
              inPacte: secretaryUser.inPacte
            };
            setUser(user);
            localStorage.setItem('user', JSON.stringify(user));
          }
        }
      } catch (err) {
        setError('Erreur lors de la vérification de l\'authentification');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Fonction de connexion
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simuler un délai d'API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Simuler une vérification des identifiants
      const foundUser = mockUsers.find(u => u.username === username);
      
      if (foundUser) {
        const user: User = {
          id: foundUser.id,
          username: foundUser.username,
          name: foundUser.name,
          firstName: foundUser.firstName || '',
          email: foundUser.email,
          role: foundUser.role as 'TEACHER' | 'SECRETARY' | 'PRINCIPAL' | 'ADMIN',
          inPacte: foundUser.inPacte
        };
        
        setUser(user);
        localStorage.setItem('user', JSON.stringify(user));
        return true;
      } else {
        setError('Identifiants incorrects');
        return false;
      }
    } catch (err) {
      setError('Erreur lors de la connexion');
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fonction de déconnexion
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };
  
  const value = {
    user,
    login,
    logout,
    isLoading,
    error
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook pour simuler l'authentification dans les tests
export function useAuthMock(mockUser: User | null = null) {
  const [user, setUser] = useState<User | null>(mockUser);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Simuler un délai
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simuler une connexion réussie
      const foundUser = mockUsers.find(u => u.username === username);
      
      if (foundUser) {
        const user: User = {
          id: foundUser.id,
          username: foundUser.username,
          name: foundUser.name,
          firstName: foundUser.firstName || '',
          email: foundUser.email,
          role: foundUser.role as 'TEACHER' | 'SECRETARY' | 'PRINCIPAL' | 'ADMIN',
          inPacte: foundUser.inPacte
        };
        
        setUser(user);
        return true;
      } else {
        setError('Identifiants incorrects');
        return false;
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const logout = () => {
    setUser(null);
  };
  
  return {
    user,
    login,
    logout,
    isLoading,
    error
  };
}
