import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info, LogIn, Eye, EyeOff, Shield } from "lucide-react";

// Définition des utilisateurs disponibles
const DEMO_USERS = [
  {
    id: "teacherWithoutPacte",
    label: "Sophie Martin (Enseignante sans pacte)",
    credentials: {
      username: "teacher1@example.com",
      password: "password123"
    },
    color: "bg-emerald-600"
  },
  {
    id: "teacherWithPacte",
    label: "Marie Petit (Enseignante avec pacte)",
    credentials: {
      username: "teacher2@example.com",
      password: "password123"
    },
    color: "bg-blue-600"
  },
  {
    id: "teacherWithoutPacte2",
    label: "Martin Dubois (Enseignant sans pacte)",
    credentials: {
      username: "teacher3@example.com",
      password: "password123"
    },
    color: "bg-purple-600"
  },
  {
    id: "teacherWithPacte2",
    label: "Philippe Garcia (Enseignant avec pacte)",
    credentials: {
      username: "teacher4@example.com",
      password: "password123"
    },
    color: "bg-indigo-600"
  },
  {
    id: "secretary",
    label: "Laure Martin (Secrétariat)",
    credentials: {
      username: "secretary@example.com",
      password: "password123"
    },
    color: "bg-amber-600"
  },
  {
    id: "principal",
    label: "Jean Dupont (Direction)",
    credentials: {
      username: "principal@example.com",
      password: "password123"
    },
    color: "bg-red-600"
  },
  {
    id: "admin",
    label: "Admin (Administrateur)",
    credentials: {
      username: "admin@example.com",
      password: "password123"
    },
    color: "bg-gray-700"
  }
];

export default function AuthPage() {
  // États pour le formulaire de connexion
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoMode, setShowDemoMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>("teacherWithPacte");
  const [, setLocation] = useLocation();
  const { user, loginMutation } = useAuth();

  // Rediriger si l'utilisateur est déjà connecté
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // État pour contrôler la connexion automatique
  const [autoConnectEnabled, setAutoConnectEnabled] = useState(true);
  
  // Effect pour la connexion automatique (uniquement à la première visite de la page, pas après déconnexion)
  useEffect(() => {
    // Vérifier si c'est la première visite ou une déconnexion
    const isFirstVisit = !localStorage.getItem('hasVisitedAuthPage');
    
    // Si c'est la première visite et que l'autoconnexion est activée
    if (isFirstVisit && autoConnectEnabled) {
      localStorage.setItem('hasVisitedAuthPage', 'true');
      
      // Connexion automatique avec un délai
      const timer = setTimeout(() => {
        if (!user && selectedRole) {
          handleConnect();
          setAutoConnect(true);
        }
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Fonction de connexion avec formulaire
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    loginMutation.mutate({
      username: username.trim(),
      password: password
    });
  };

  // Fonction de connexion rapide pour les tests (mode démo)
  const handleDemoLogin = (demoUser: any) => {
    setSelectedRole(demoUser.id);
    setUsername(demoUser.credentials.username);
    setPassword(demoUser.credentials.password);
    loginMutation.mutate(demoUser.credentials);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-6 bg-white shadow-lg rounded-lg">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">SupChaissac</h1>
          </div>
          <p className="text-gray-600 text-sm">Gestion des Heures Supplémentaires</p>
        </div>

        <CardContent className="space-y-6">
          {/* Formulaire de connexion principal */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Email</Label>
              <Input
                id="username"
                type="email"
                placeholder="votre.email@example.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={!username.trim() || !password.trim() || loginMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connexion en cours...
                </span>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Se connecter
                </>
              )}
            </Button>
          </form>

          {/* Mode démo pour les tests (masqué par défaut) */}
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setShowDemoMode(!showDemoMode)}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center mx-auto"
            >
              <Info className="h-4 w-4 mr-1" />
              {showDemoMode ? 'Masquer' : 'Afficher'} les comptes de test
            </button>

            {showDemoMode && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-gray-500 text-center mb-3">Comptes de test (développement uniquement)</p>
                <div className="grid grid-cols-1 gap-2">
                  {DEMO_USERS.map(demoUser => (
                    <button
                      key={demoUser.id}
                      type="button"
                      onClick={() => handleDemoLogin(demoUser)}
                      className="text-left p-2 rounded border border-gray-200 hover:bg-gray-50 text-sm"
                      disabled={loginMutation.isPending}
                    >
                      <div className="font-medium">{demoUser.label}</div>
                      <div className="text-xs text-gray-500">{demoUser.credentials.username}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>


        </CardContent>
      </Card>
    </div>
  );
}