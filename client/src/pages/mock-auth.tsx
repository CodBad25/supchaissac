import { useState } from 'react';
import { useLocation } from 'wouter';

// Définition des profils utilisateurs pour les tests
const TEST_PROFILES = [
  { 
    id: 1,
    name: 'Sophie Martin', 
    role: 'Enseignante sans pacte', 
    username: 'teacher1@example.com',
    userRole: 'TEACHER',
    inPacte: false
  },
  { 
    id: 2,
    name: 'Marie Petit', 
    role: 'Enseignante avec pacte', 
    username: 'teacher2@example.com',
    userRole: 'TEACHER',
    inPacte: true
  },
  { 
    id: 3,
    name: 'Martin Dubois', 
    role: 'Enseignant sans pacte', 
    username: 'teacher3@example.com',
    userRole: 'TEACHER',
    inPacte: false
  },
  { 
    id: 4,
    name: 'Philippe Garcia', 
    role: 'Enseignant avec pacte', 
    username: 'teacher4@example.com',
    userRole: 'TEACHER',
    inPacte: true
  },
  { 
    id: 5,
    name: 'Laure Martin', 
    role: 'Secrétariat', 
    username: 'secretary@example.com',
    userRole: 'SECRETARY',
    inPacte: false
  },
  { 
    id: 6,
    name: 'Jean Dupont', 
    role: 'Direction', 
    username: 'principal@example.com',
    userRole: 'PRINCIPAL',
    inPacte: false
  },
  { 
    id: 7,
    name: 'Admin', 
    role: 'Administrateur', 
    username: 'admin@example.com',
    userRole: 'ADMIN',
    inPacte: false
  },
];

export default function MockAuthPage() {
  const [selectedProfile, setSelectedProfile] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleProfileSelect = (index: number) => {
    setSelectedProfile(index);
  };

  const handleLogin = () => {
    if (selectedProfile === null) return;
    
    setIsLoading(true);
    
    // Simuler une connexion
    setTimeout(() => {
      const profile = TEST_PROFILES[selectedProfile];
      
      // Stocker les informations de l'utilisateur dans le localStorage
      localStorage.setItem('mockUser', JSON.stringify({
        id: profile.id,
        username: profile.username,
        name: profile.name,
        role: profile.userRole,
        inPacte: profile.inPacte
      }));
      
      // Rediriger vers la page d'accueil
      setLocation('/');
      setIsLoading(false);
    }, 800);
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
