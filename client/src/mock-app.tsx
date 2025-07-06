import { Switch, Route, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { PrincipalView } from "@/components/principal/PrincipalComponents";
import { SecretaryView } from "@/components/secretary/SecretaryComponents";
import { AdminView } from "@/components/admin/AdminComponents";
import { TeacherView } from "@/components/teacher/TeacherComponents";
import { Button } from "@/components/ui/button";
import { MockAuthProvider, useMockAuth } from "@/hooks/use-mock-auth";
import AuthPage from "@/pages/auth-page";
import { NotificationProvider } from "@/hooks/use-notification";
import { queryClient } from "@/lib/queryClient";
import UserRoleSwitcher from "@/components/layout/UserRoleSwitcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MobileMenu } from "@/components/layout/mobile-menu";
import { FooterButton } from "@/components/FooterButton";

// Application principale
function MockApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <MockAuthProvider>
        <NotificationProvider>
          <AppRoutes />
          <Toaster />
        </NotificationProvider>
      </MockAuthProvider>
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

// Composant pour protéger les routes
function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useMockAuth();
  const [, setLocation] = useLocation();

  // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
  if (!isLoading && !user) {
    setLocation('/auth');
    return null;
  }

  // Afficher un indicateur de chargement pendant la vérification de l'authentification
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  return <Component {...rest} />;
}

// Interface administrateur
function AdminInterface() {
  const [, setLocation] = useLocation();
  const { user } = useMockAuth();

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
      <MobileMenu />
      {user.role === "TEACHER" && <TeacherView />}
      {user.role === "SECRETARY" && <SecretaryView />}
      {user.role === "PRINCIPAL" && <PrincipalView />}
      {user.role === "ADMIN" && <AdminView />}

      {/* Bouton Documentation fixe sur toutes les interfaces */}
      <FooterButton />
    </>
  );
}

// Hook pour obtenir le rôle de l'utilisateur
function useUserRole() {
  const [location] = useLocation();
  const { user } = useMockAuth();

  return { user, location };
}

// Composant pour afficher le rôle actuel et permettre de changer
function RoleDisplay() {
  const [, setLocation] = useLocation();
  const { user, logoutMutation } = useMockAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
    setLocation("/auth");
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      {user && (
        <>
          <div className="hidden sm:flex items-center">
            <span className="text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-3 py-1 rounded-full mr-2">
              {user.role === "TEACHER" && `Enseignant${user.inPacte ? " (avec pacte)" : " (sans pacte)"}`}
              {user.role === "SECRETARY" && "Secrétariat"}
              {user.role === "PRINCIPAL" && "Direction"}
              {user.role === "ADMIN" && "Administration"}
            </span>
          </div>

          {/* Sélecteur de rôle */}
          <UserRoleSwitcher />

          {/* Sélecteur de thème */}
          <ThemeToggle />

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

export default MockApp;
