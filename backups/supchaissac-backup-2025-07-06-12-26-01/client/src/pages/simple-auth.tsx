import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

// Définition des profils utilisateurs pour les tests
const TEST_PROFILES = [
  { name: 'Sophie Martin', role: 'Enseignante sans pacte', username: 'teacher1@example.com', password: 'password123' },
  { name: 'Marie Petit', role: 'Enseignante avec pacte', username: 'teacher2@example.com', password: 'password123' },
  { name: 'Martin Dubois', role: 'Enseignant sans pacte', username: 'teacher3@example.com', password: 'password123' },
  { name: 'Philippe Garcia', role: 'Enseignant avec pacte', username: 'teacher4@example.com', password: 'password123' },
  { name: 'Laure Martin', role: 'Secrétariat', username: 'secretary@example.com', password: 'password123' },
  { name: 'Jean Dupont', role: 'Direction', username: 'principal@example.com', password: 'password123' },
  { name: 'Admin', role: 'Administrateur', username: 'admin@example.com', password: 'password123' },
];

export default function SimpleAuthPage() {
  const [selectedProfile, setSelectedProfile] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const user = await response.json();
          if (user) {
            setLocation('/');
          }
        }
      } catch (err) {
        console.error('Erreur lors de la vérification de l\'authentification:', err);
      }
    };
    
    checkAuth();
  }, [setLocation]);

  const handleProfileSelect = (index: number) => {
    setSelectedProfile(index);
    setError(null);
  };

  const handleLogin = async () => {
    if (selectedProfile === null) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const profile = TEST_PROFILES[selectedProfile];
      
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: profile.username,
          password: profile.password,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Identifiants incorrects');
      }
      
      const user = await response.json();
      console.log('Utilisateur connecté:', user);
      
      // Rediriger vers la page d'accueil
      setLocation('/');
    } catch (err) {
      console.error('Erreur de connexion:', err);
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-white">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-8 text-white">
          <h1 className="text-3xl font-bold text-center mb-2">Gestion des Heures Supplémentaires</h1>
          <p className="text-center text-blue-100">
            Veuillez sélectionner un profil pour vous connecter
          </p>
        </div>
        
        {/* Contenu */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          <h2 className="text-xl font-semibold text-blue-800 mb-4 text-center">
            Choisissez un profil pour tester
          </h2>
          
          <div className="space-y-2 mb-6">
            {TEST_PROFILES.map((profile, index) => (
              <button
                key={index}
                className={`w-full text-left px-4 py-3 rounded-md transition-all ${
                  selectedProfile === index
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50'
                }`}
                onClick={() => handleProfileSelect(index)}
              >
                <div className="font-medium">{profile.name}</div>
                <div className={`text-sm ${selectedProfile === index ? 'text-blue-100' : 'text-blue-600'}`}>
                  {profile.role}
                </div>
              </button>
            ))}
          </div>
          
          <button
            className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
              isLoading
                ? 'bg-blue-400 cursor-not-allowed'
                : selectedProfile === null
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            onClick={handleLogin}
            disabled={isLoading || selectedProfile === null}
          >
            {isLoading ? 'Connexion en cours...' : 'Se connecter maintenant'}
          </button>
        </div>
      </div>
    </div>
  );
}
