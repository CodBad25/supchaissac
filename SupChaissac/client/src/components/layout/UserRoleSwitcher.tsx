import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCircle2, Download, FileText } from "lucide-react";

// Liste des utilisateurs disponibles pour le changement rapide
const DEMO_USERS = [
  {
    id: "teacher1",
    name: "Sophie Martin",
    role: "TEACHER",
    credentials: {
      username: "teacher1@example.com",
      password: "password123"
    },
    description: "Enseignante sans pacte"
  },
  {
    id: "teacher2",
    name: "Marie Petit",
    role: "TEACHER",
    credentials: {
      username: "teacher2@example.com",
      password: "password123"
    },
    description: "Enseignante avec pacte"
  },
  {
    id: "teacher3",
    name: "Martin Dubois",
    role: "TEACHER",
    credentials: {
      username: "teacher3@example.com",
      password: "password123"
    },
    description: "Enseignant sans pacte"
  },
  {
    id: "teacher4",
    name: "Philippe Garcia",
    role: "TEACHER",
    credentials: {
      username: "teacher4@example.com",
      password: "password123"
    },
    description: "Enseignant avec pacte"
  },
  {
    id: "secretary",
    name: "Laure Martin",
    role: "SECRETARY",
    credentials: {
      username: "secretary@example.com",
      password: "password123"
    },
    description: "Secrétariat"
  },
  {
    id: "principal",
    name: "Jean Dupont",
    role: "PRINCIPAL",
    credentials: {
      username: "principal@example.com",
      password: "password123"
    },
    description: "Direction"
  },
  {
    id: "admin",
    name: "Admin",
    role: "ADMIN",
    credentials: {
      username: "admin@example.com",
      password: "password123"
    },
    description: "Administrateur système"
  }
];

export default function UserRoleSwitcher() {
  const [open, setOpen] = useState(false);
  const { user, logoutMutation, loginMutation } = useAuth();
  
  // Fonction pour changer d'utilisateur
  const handleUserSwitch = async (credentials: { username: string; password: string }) => {
    // Déconnexion de l'utilisateur actuel
    await logoutMutation.mutateAsync();
    
    // Connexion avec le nouvel utilisateur
    loginMutation.mutate(credentials);
    
    setOpen(false);
  };

  if (!user) return null;

  // Trouver l'utilisateur actuel
  const currentUser = DEMO_USERS.find(
    (demoUser) => demoUser.credentials.username === user.username
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="px-3 h-9">
          <UserCircle2 className="h-4 w-4 mr-2" />
          <span className="hidden md:inline">
            {currentUser?.name || user.name}
          </span>
          <span className="ml-1 text-xs text-gray-500 hidden md:inline">
            ({currentUser?.description || user.role})
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px]">
        <DropdownMenuLabel>Changer d'utilisateur</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Enseignants */}
        <DropdownMenuLabel className="text-xs font-normal text-gray-500">Enseignants</DropdownMenuLabel>
        {DEMO_USERS.filter(u => u.role === "TEACHER").map((demoUser) => (
          <DropdownMenuItem
            key={demoUser.id}
            className={`cursor-pointer ${demoUser.credentials.username === user.username ? 'bg-blue-50' : ''}`}
            onClick={() => handleUserSwitch(demoUser.credentials)}
          >
            <div className="flex flex-col">
              <span>{demoUser.name}</span>
              <span className="text-xs text-gray-500">{demoUser.description}</span>
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        {/* Administration */}
        <DropdownMenuLabel className="text-xs font-normal text-gray-500">Administration</DropdownMenuLabel>
        {DEMO_USERS.filter(u => u.role !== "TEACHER").map((demoUser) => (
          <DropdownMenuItem
            key={demoUser.id}
            className={`cursor-pointer ${demoUser.credentials.username === user.username ? 'bg-blue-50' : ''}`}
            onClick={() => handleUserSwitch(demoUser.credentials)}
          >
            <div className="flex flex-col">
              <span>{demoUser.name}</span>
              <span className="text-xs text-gray-500">{demoUser.description}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}