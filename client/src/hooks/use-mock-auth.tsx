import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Type pour l'utilisateur
interface User {
  id: number;
  username: string;
  name: string;
  role: 'TEACHER' | 'SECRETARY' | 'PRINCIPAL' | 'ADMIN';
  initials?: string;
  signature?: string | null;
  inPacte?: boolean;
  pacteHoursTarget?: number;
  pacteHoursCompleted?: number;
}

// Type pour les informations de connexion
interface LoginCredentials {
  username: string;
  password: string;
}

// Définition des profils utilisateurs pour les tests
const TEST_PROFILES = [
  {
    id: 1,
    username: 'teacher1@example.com',
    password: 'password123',
    name: 'Sophie Martin',
    role: 'TEACHER' as const,
    initials: 'SM',
    signature: null,
    inPacte: false,
    pacteHoursTarget: 0,
    pacteHoursCompleted: 0
  },
  {
    id: 2,
    username: 'teacher2@example.com',
    password: 'password123',
    name: 'Marie Petit',
    role: 'TEACHER' as const,
    initials: 'MP',
    signature: null,
    inPacte: true,
    pacteHoursTarget: 36,
    pacteHoursCompleted: 12
  },
  {
    id: 3,
    username: 'teacher3@example.com',
    password: 'password123',
    name: 'Martin Dubois',
    role: 'TEACHER' as const,
    initials: 'MD',
    signature: null,
    inPacte: false,
    pacteHoursTarget: 0,
    pacteHoursCompleted: 0
  },
  {
    id: 4,
    username: 'teacher4@example.com',
    password: 'password123',
    name: 'Philippe Garcia',
    role: 'TEACHER' as const,
    initials: 'PG',
    signature: null,
    inPacte: true,
    pacteHoursTarget: 36,
    pacteHoursCompleted: 24
  },
  {
    id: 5,
    username: 'secretary@example.com',
    password: 'password123',
    name: 'Laure Martin',
    role: 'SECRETARY' as const,
    initials: 'LM',
    signature: null
  },
  {
    id: 6,
    username: 'principal@example.com',
    password: 'password123',
    name: 'Jean Dupont',
    role: 'PRINCIPAL' as const,
    initials: 'JD',
    signature: null
  },
  {
    id: 7,
    username: 'admin@example.com',
    password: 'password123',
    name: 'Admin',
    role: 'ADMIN' as const,
    initials: 'A',
    signature: null
  },
];

// Type pour le contexte d'authentification
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: {
    mutate: (credentials: LoginCredentials) => void;
    isPending: boolean;
  };
  logoutMutation: {
    mutate: () => void;
    isPending: boolean;
  };
}

// Création du contexte d'authentification
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider pour le contexte d'authentification
export function MockAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginPending, setLoginPending] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);

  // Vérifier si l'utilisateur est déjà connecté (stocké dans localStorage)
  useEffect(() => {
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('mockUser');
      }
    }
  }, []);

  // Mutation pour la connexion
  const loginMutation = {
    mutate: (credentials: LoginCredentials) => {
      setLoginPending(true);
      setError(null);

      // Simuler un délai de connexion
      setTimeout(() => {
        const foundUser = TEST_PROFILES.find(
          profile => profile.username === credentials.username && profile.password === credentials.password
        );

        if (foundUser) {
          setUser(foundUser);
          localStorage.setItem('mockUser', JSON.stringify(foundUser));
          setError(null);
        } else {
          setError(new Error('Identifiants incorrects'));
        }
        setLoginPending(false);
      }, 800);
    },
    isPending: loginPending
  };

  // Mutation pour la déconnexion
  const logoutMutation = {
    mutate: () => {
      setLogoutPending(true);

      // Simuler un délai de déconnexion
      setTimeout(() => {
        setUser(null);
        localStorage.removeItem('mockUser');
        setLogoutPending(false);
      }, 500);
    },
    isPending: logoutPending
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook pour utiliser le contexte d'authentification
export function useMockAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useMockAuth must be used within a MockAuthProvider');
  }
  return context;
}
