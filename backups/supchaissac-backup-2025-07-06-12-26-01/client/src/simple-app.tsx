import React, { useState } from 'react';

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

function SimpleApp() {
  const [selectedProfile, setSelectedProfile] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const handleProfileSelect = (index: number) => {
    setSelectedProfile(index);
  };

  const handleLogin = () => {
    if (selectedProfile === null) return;

    setIsLoading(true);

    // Simuler une connexion
    setTimeout(() => {
      const profile = TEST_PROFILES[selectedProfile];

      // Stocker les informations de l'utilisateur
      setCurrentUser({
        id: profile.id,
        username: profile.username,
        name: profile.name,
        role: profile.userRole,
        inPacte: profile.inPacte
      });

      setIsLoggedIn(true);
      setIsLoading(false);
    }, 800);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    setSelectedProfile(null);
  };

  // Page de connexion
  if (!isLoggedIn) {
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

  // Importer le composant MockTeacherView
  const MockTeacherView = React.lazy(() => import('./components/mock/MockTeacherView'));

  // Page d'accueil après connexion
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barre de navigation */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">
            Gestion des Heures Supplémentaires
          </h1>
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              {currentUser.role === "TEACHER" && `Enseignant${currentUser.inPacte ? " (avec pacte)" : " (sans pacte)"}`}
              {currentUser.role === "SECRETARY" && "Secrétariat"}
              {currentUser.role === "PRINCIPAL" && "Direction"}
              {currentUser.role === "ADMIN" && "Administration"}
            </div>
            <button
              className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-100"
              onClick={handleLogout}
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Contenu principal basé sur le rôle */}
      <React.Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }>
        {currentUser.role === "TEACHER" ? (
          <MockTeacherView userName={currentUser.name} />
        ) : (
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Bienvenue, {currentUser.name}
              </h2>
              <p className="text-gray-600 mb-4">
                Vous êtes connecté en tant que {
                  currentUser.role === "SECRETARY" ? "secrétariat" :
                  currentUser.role === "PRINCIPAL" ? "direction" : "administrateur"
                }.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-blue-800">
                <p className="font-medium">Interface de démonstration</p>
                <p className="text-sm mt-1">
                  Cette interface simplifiée est destinée à la phase de développement et de test.
                  Les fonctionnalités pour ce rôle seront implémentées prochainement.
                </p>
              </div>
            </div>
          </main>
        )}
      </React.Suspense>
    </div>
  );
}

export default SimpleApp;
