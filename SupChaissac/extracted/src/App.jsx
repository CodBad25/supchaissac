
import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { SessionProvider } from './contexts/SessionContext';
import { Toaster } from './components/ui/toaster';
import LoginForm from './components/auth/LoginForm';
import TeacherDashboard from './components/dashboard/TeacherDashboard';
import SecretaryDashboard from './components/dashboard/SecretaryDashboard';
import PrincipalDashboard from './components/dashboard/PrincipalDashboard';
import TeacherSetup from './components/TeacherSetup';
import { Button } from './components/ui/button';
import { LogOut, ArrowLeft } from 'lucide-react';

function App() {
  const { user, logout } = useAuth();
  const [showRoleSelect, setShowRoleSelect] = useState(false);

  const handleBack = () => {
    setShowRoleSelect(true);
  };

  if (!user) {
    return <LoginForm />;
  }

  // Afficher la configuration initiale pour les nouveaux enseignants
  if (user.role === 'TEACHER' && user.needsSetup) {
    return <TeacherSetup />;
  }

  if (showRoleSelect) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-center mb-6">Sélectionner un rôle</h2>
          <div className="space-y-4">
            <Button
              className="w-full justify-start text-left"
              onClick={() => {
                logout();
                window.location.href = '/?role=teacher';
              }}
            >
              Enseignant
            </Button>
            <Button
              className="w-full justify-start text-left"
              onClick={() => {
                logout();
                window.location.href = '/?role=secretary';
              }}
            >
              Secrétariat
            </Button>
            <Button
              className="w-full justify-start text-left"
              onClick={() => {
                logout();
                window.location.href = '/?role=principal';
              }}
            >
              Direction
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm py-4 px-6">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold text-blue-600">
                Gestion des Heures Supplémentaires
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-500">{user.name} - {user.role}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
            </div>
          </div>
        </header>

        <main className="py-6">
          {user.role === 'TEACHER' && <TeacherDashboard />}
          {user.role === 'SECRETARY' && <SecretaryDashboard />}
          {user.role === 'PRINCIPAL' && <PrincipalDashboard />}
        </main>
      </div>
      <Toaster />
    </SessionProvider>
  );
}

export default App;
