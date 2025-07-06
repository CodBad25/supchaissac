
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = async (email, password) => {
    try {
      // Récupérer les enseignants créés par la secrétaire
      const teacherSetups = JSON.parse(localStorage.getItem('teacherSetups') || '{}');
      
      // Comptes de test par défaut
      const mockUsers = {
        'secretaire@test.com': { id: 4, name: 'Sophie DUBOIS', role: 'SECRETARY', email: 'secretaire@test.com' },
        'principal@test.com': { id: 5, name: 'Pierre DURAND', role: 'PRINCIPAL', email: 'principal@test.com' }
      };

      // Ajouter les enseignants créés par la secrétaire
      Object.values(teacherSetups).forEach(teacher => {
        if (teacher.email) {
          mockUsers[teacher.email] = {
            id: teacher.id,
            name: teacher.name,
            role: 'TEACHER',
            email: teacher.email,
            inPacte: teacher.inPacte,
            needsSetup: false // Les enseignants créés par la secrétaire n'ont pas besoin de setup
          };
        }
      });

      const user = mockUsers[email];
      if (user && password === 'aaa') {
        setUser(user);
        toast({
          title: "Connexion réussie",
          description: `Bienvenue ${user.name}`,
        });
        return true;
      }
      throw new Error('Identifiants invalides');
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté avec succès",
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
