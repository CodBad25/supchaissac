import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

// Type définissant un utilisateur
type User = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'TEACHER' | 'SECRETARY' | 'PRINCIPAL' | 'ADMIN';
  lastLogin?: string;
};

export function PasswordReset() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  
  // Liste fictive d'utilisateurs pour la démonstration
  const [users] = useState<User[]>([
    { id: 1, username: "martin.j", firstName: "Jean", lastName: "MARTIN", email: "j.martin@example.fr", role: "TEACHER", lastLogin: "2025-03-15" },
    { id: 2, username: "dupont.s", firstName: "Sophie", lastName: "DUPONT", email: "s.dupont@example.fr", role: "TEACHER", lastLogin: "2025-03-28" },
    { id: 3, username: "admin", firstName: "Admin", lastName: "SYSTEM", email: "admin@example.fr", role: "ADMIN", lastLogin: "2025-03-30" },
    { id: 4, username: "durant.m", firstName: "Marie", lastName: "DURANT", email: "m.durant@example.fr", role: "SECRETARY", lastLogin: "2025-03-29" },
    { id: 5, username: "petit.p", firstName: "Paul", lastName: "PETIT", email: "p.petit@example.fr", role: "PRINCIPAL", lastLogin: "2025-03-25" },
    { id: 6, username: "leroy.l", firstName: "Lucie", lastName: "LEROY", email: "l.leroy@example.fr", role: "TEACHER" },
  ]);
  
  // Filtrer les utilisateurs en fonction de la recherche
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      user.firstName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });
  
  // Fonction pour générer un mot de passe aléatoire
  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let result = "";
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(result);
  };
  
  // Fonction pour ouvrir la boîte de dialogue de réinitialisation
  const openResetDialog = (user: User) => {
    setSelectedUser(user);
    setNewPassword("");
    setIsDialogOpen(true);
  };
  
  // Fonction pour réinitialiser le mot de passe
  const resetPassword = () => {
    if (!selectedUser || !newPassword) return;
    
    setIsResetting(true);
    
    // Simuler une requête API
    setTimeout(() => {
      setIsResetting(false);
      setIsDialogOpen(false);
      
      toast({
        title: "Mot de passe réinitialisé",
        description: `Le mot de passe de ${selectedUser.firstName} ${selectedUser.lastName} a été réinitialisé.`
      });
    }, 1000);
  };
  
  // Fonction pour afficher le badge de rôle avec la bonne couleur
  const getRoleBadge = (role: string) => {
    const roleStyles: Record<string, string> = {
      "TEACHER": "bg-green-100 text-green-800 border-green-200",
      "SECRETARY": "bg-blue-100 text-blue-800 border-blue-200",
      "PRINCIPAL": "bg-purple-100 text-purple-800 border-purple-200",
      "ADMIN": "bg-red-100 text-red-800 border-red-200"
    };
    
    const roleNames: Record<string, string> = {
      "TEACHER": "Enseignant",
      "SECRETARY": "Secrétariat",
      "PRINCIPAL": "Direction",
      "ADMIN": "Admin"
    };
    
    return (
      <Badge variant="outline" className={roleStyles[role]}>
        {roleNames[role]}
      </Badge>
    );
  };
  
  // Formater la date de dernière connexion
  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return "Jamais connecté";
    
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Réinitialisation de mot de passe</CardTitle>
          <CardDescription>
            Réinitialisez le mot de passe des utilisateurs qui ont perdu l'accès à leur compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Barre de recherche */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Rechercher un utilisateur..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Tableau des utilisateurs */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead className="hidden md:table-cell">Identifiant</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead className="hidden md:table-cell">Dernière connexion</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.lastName} {user.firstName}</TableCell>
                        <TableCell className="hidden md:table-cell">{user.username}</TableCell>
                        <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell className="hidden md:table-cell">{formatLastLogin(user.lastLogin)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openResetDialog(user)}
                          >
                            Réinitialiser
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                        Aucun utilisateur trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-gray-500">
            {filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? 's' : ''} trouvé{filteredUsers.length !== 1 ? 's' : ''}
          </p>
        </CardFooter>
      </Card>
      
      {/* Dialogue de réinitialisation */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <p className="text-sm">
                  Vous êtes sur le point de réinitialiser le mot de passe de :
                </p>
                <div className="flex items-center p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-medium">{selectedUser.lastName} {selectedUser.firstName}</p>
                    <p className="text-sm text-gray-500">{selectedUser.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <div className="flex space-x-2">
                  <Input
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1"
                    placeholder="Saisir un mot de passe"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={generateRandomPassword}
                  >
                    Générer
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Le mot de passe doit être communiqué à l'utilisateur de manière sécurisée.
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
            <Button 
              onClick={resetPassword} 
              disabled={!newPassword || isResetting}
            >
              {isResetting ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}