import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Info, LogIn } from "lucide-react";

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
  const [selectedRole, setSelectedRole] = useState<string | null>("teacherWithPacte");
  const [autoConnect, setAutoConnect] = useState(false);
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

  // Fonction de connexion basée sur le rôle sélectionné
  const handleConnect = () => {
    if (!selectedRole) return;

    // Trouver l'utilisateur correspondant au rôle sélectionné
    const selectedUser = DEMO_USERS.find(user => user.id === selectedRole);
    
    if (selectedUser) {
      loginMutation.mutate(selectedUser.credentials);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-6 bg-white shadow-md rounded-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Gestion des Heures Supplémentaires</h1>
          {localStorage.getItem('hasVisitedAuthPage') ? (
            <p className="text-gray-600 text-sm mt-2">Veuillez sélectionner un profil pour vous connecter</p>
          ) : (
            <p className="text-gray-600 text-sm mt-2">Connexion automatique en cours...</p>
          )}
        </div>

        <CardContent className="px-0 pt-4">
          <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-6 flex items-start">
            <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-700">
              {localStorage.getItem('hasVisitedAuthPage') ? (
                <>
                  <p className="mb-2">Vous vous êtes déconnecté. La connexion automatique est désactivée.</p>
                  <p>Choisissez un profil pour vous connecter à nouveau.</p>
                </>
              ) : (
                <>
                  <p className="mb-2">Une connexion automatique va être effectuée dans quelques secondes.</p>
                  <p>Vous pouvez également sélectionner un profil différent pour tester les différentes interfaces.</p>
                </>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-center mb-4 font-medium text-gray-700">Choisissez un profil pour tester</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DEMO_USERS.map(demoUser => (
                <Button
                  key={demoUser.id}
                  type="button"
                  className={`justify-between ${selectedRole === demoUser.id ? demoUser.color : "bg-gray-100 text-gray-900 hover:bg-gray-200"} h-auto py-3`}
                  onClick={() => {
                    setSelectedRole(demoUser.id);
                    setAutoConnect(false);
                  }}
                >
                  <span>{demoUser.label}</span>
                  {selectedRole === demoUser.id && <LogIn className="h-4 w-4 ml-2" />}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleConnect}
              disabled={!selectedRole || loginMutation.isPending}
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
                  {autoConnect ? "Connexion automatique..." : "Se connecter maintenant"}
                </>
              )}
            </Button>
            
            {localStorage.getItem('hasVisitedAuthPage') && (
              <div className="flex justify-center">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    localStorage.removeItem('hasVisitedAuthPage');
                    window.location.reload();
                  }}
                >
                  Réactiver la connexion automatique
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}