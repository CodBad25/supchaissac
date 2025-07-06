import React from 'react';
import { useAuthContext } from './AuthContext';

const demoUsers = [
  { username: 'teacher1', label: 'Sophie Martin (Enseignante)' },
  { username: 'teacher2', label: 'Marie Petit (Enseignante)' },
  { username: 'teacher3', label: 'Martin Dubois (Enseignant)' },
  { username: 'teacher4', label: 'Philippe Garcia (Enseignant)' },
  { username: 'secretary', label: 'Laure Martin (Secrétariat)' },
  { username: 'principal', label: 'Jean Dupont (Direction)' },
  { username: 'admin', label: 'Admin (Administrateur)' },
];

export default function LoginPage() {
  const { login, isLoading } = useAuthContext();

  const handleLogin = async (username: string) => {
    console.log('Tentative de connexion pour:', username);
    try {
      await login(username, '');
      console.log('Connexion réussie !');
    } catch (error) {
      console.error('Erreur de connexion:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 mb-6">
          Choisissez un profil pour vous connecter
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {demoUsers.map((user) => (
            <button
              key={user.username}
              onClick={() => handleLogin(user.username)}
              className="py-3 px-4 bg-blue-600 text-white rounded font-semibold shadow hover:bg-blue-700 transition"
              disabled={isLoading}
            >
              {user.label}
            </button>
          ))}
        </div>
        {isLoading && <div className="text-center text-blue-500 mt-4">Connexion en cours...</div>}
      </div>
    </div>
  );
}
