import { useState } from 'react';
import { Menu, X, Home, Calendar, List, User, Settings, LogOut } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const navigateTo = (path: string) => {
    setLocation(path);
    setIsOpen(false);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    setLocation('/auth');
    setIsOpen(false);
  };

  // Déterminer les liens de navigation en fonction du rôle de l'utilisateur
  const getNavLinks = () => {
    if (!user) return [];

    const commonLinks = [
      { label: 'Accueil', icon: <Home className="h-5 w-5 mr-2" />, path: '/' },
    ];

    switch (user.role) {
      case 'TEACHER':
        return [
          ...commonLinks,
          { label: 'Calendrier', icon: <Calendar className="h-5 w-5 mr-2" />, path: '/' },
          { label: 'Mes séances', icon: <List className="h-5 w-5 mr-2" />, path: '/' },
          { label: 'Mon profil', icon: <User className="h-5 w-5 mr-2" />, path: '/' },
        ];
      case 'SECRETARY':
        return [
          ...commonLinks,
          { label: 'Tableau de bord', icon: <Home className="h-5 w-5 mr-2" />, path: '/' },
          { label: 'Séances', icon: <Calendar className="h-5 w-5 mr-2" />, path: '/' },
          { label: 'Enseignants', icon: <User className="h-5 w-5 mr-2" />, path: '/' },
        ];
      case 'PRINCIPAL':
        return [
          ...commonLinks,
          { label: 'Tableau de bord', icon: <Home className="h-5 w-5 mr-2" />, path: '/' },
          { label: 'Validation', icon: <Calendar className="h-5 w-5 mr-2" />, path: '/' },
          { label: 'Paramètres', icon: <Settings className="h-5 w-5 mr-2" />, path: '/' },
        ];
      case 'ADMIN':
        return [
          ...commonLinks,
          { label: 'Utilisateurs', icon: <User className="h-5 w-5 mr-2" />, path: '/' },
          { label: 'Paramètres', icon: <Settings className="h-5 w-5 mr-2" />, path: '/' },
          { label: 'Administration', icon: <Settings className="h-5 w-5 mr-2" />, path: '/admin' },
        ];
      default:
        return commonLinks;
    }
  };

  return (
    <>
      {/* Bouton du menu */}
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden fixed top-4 left-4 z-50"
        onClick={toggleMenu}
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Menu</span>
      </Button>

      {/* Overlay du menu */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menu latéral */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-background dark:bg-gray-900 shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* En-tête du menu */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Menu</h2>
            <Button variant="ghost" size="icon" onClick={toggleMenu}>
              <X className="h-5 w-5" />
              <span className="sr-only">Fermer</span>
            </Button>
          </div>

          {/* Informations utilisateur */}
          {user && (
            <div className="p-4 border-b">
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.username}</div>
              <div className="mt-2">
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2 py-0.5 rounded-full">
                  {user.role === "TEACHER" && `Enseignant${user.inPacte ? " (avec pacte)" : " (sans pacte)"}`}
                  {user.role === "SECRETARY" && "Secrétariat"}
                  {user.role === "PRINCIPAL" && "Direction"}
                  {user.role === "ADMIN" && "Administration"}
                </span>
              </div>
            </div>
          )}

          {/* Liens de navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {getNavLinks().map((link, index) => (
                <li key={index}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => navigateTo(link.path)}
                  >
                    {link.icon}
                    {link.label}
                  </Button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Pied du menu */}
          <div className="p-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm">Thème</span>
              <ThemeToggle />
            </div>
            <Button
              variant="outline"
              className="w-full flex items-center justify-center"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
