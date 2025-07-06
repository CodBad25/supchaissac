import { Switch, Route, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { PrincipalView } from "@/components/principal/PrincipalComponents";
import { SecretaryView } from "@/components/secretary/SecretaryComponents";
import { AdminView } from "@/components/admin/AdminComponents";
import { TeacherView } from "@/components/teacher/TeacherComponents";
import { Button } from "@/components/ui/button";
import { AuthProvider } from "@/hooks/use-auth";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { queryClient } from "@/lib/queryClient";
import UserRoleSwitcher from "@/components/layout/UserRoleSwitcher";

// Application principale
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Routes de l'application
function AppRoutes() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={MainApp} />
      <ProtectedRoute path="/admin" component={AdminInterface} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Interface administrateur
function AdminInterface() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  // Protection supplémentaire côté client
  if (user?.role !== "ADMIN") {
    return <div className="min-h-screen flex items-center justify-center">Redirection...</div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center flex-wrap gap-2">
            <h1 className="text-xl font-semibold text-gray-900 mr-2">Administration</h1>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              Gestion des comptes
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLocation("/")}
          >
            Retour à l'accueil
          </Button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminView />
      </main>
    </div>
  );
}

// Application principale basée sur le rôle de l'utilisateur
function MainApp() {
  const { user } = useUserRole();
  
  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }
  
  return (
    <>
      <RoleDisplay />
      {user.role === "TEACHER" && <TeacherView />}
      {user.role === "SECRETARY" && <SecretaryView />}
      {user.role === "PRINCIPAL" && <PrincipalView />}
      {user.role === "ADMIN" && <AdminView />}
    </>
  );
}

// Hook pour obtenir le rôle de l'utilisateur
function useUserRole() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  return { user, location };
}

// Composant pour afficher le rôle actuel et permettre de changer
function RoleDisplay() {
  const [, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
    setLocation("/auth");
  };
  
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      {user && (
        <>
          <div className="hidden sm:flex items-center">
            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full mr-2">
              {user.role === "TEACHER" && `Enseignant${user.inPacte ? " (avec pacte)" : " (sans pacte)"}`}
              {user.role === "SECRETARY" && "Secrétariat"}
              {user.role === "PRINCIPAL" && "Direction"}
              {user.role === "ADMIN" && "Administration"}
            </span>
          </div>
          
          {/* Sélecteur de rôle */}
          <UserRoleSwitcher />
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLogout}
          >
            Déconnexion
          </Button>
        </>
      )}
    </div>
  );
}

import { useAuth } from "@/hooks/use-auth";

export default App;
