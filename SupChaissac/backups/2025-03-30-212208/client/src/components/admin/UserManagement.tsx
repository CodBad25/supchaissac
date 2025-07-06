import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

// Type définissant un utilisateur
type User = {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'TEACHER' | 'SECRETARY' | 'PRINCIPAL' | 'ADMIN';
  pacteEnseignant: boolean;
  isActive: boolean;
};

export function UserManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  
  // Liste fictive d'utilisateurs pour la démonstration
  const [users, setUsers] = useState<User[]>([
    { id: 1, username: "martin.j", firstName: "Jean", lastName: "MARTIN", email: "j.martin@example.fr", role: "TEACHER", pacteEnseignant: true, isActive: true },
    { id: 2, username: "dupont.s", firstName: "Sophie", lastName: "DUPONT", email: "s.dupont@example.fr", role: "TEACHER", pacteEnseignant: false, isActive: true },
    { id: 3, username: "admin", firstName: "Admin", lastName: "SYSTEM", email: "admin@example.fr", role: "ADMIN", pacteEnseignant: false, isActive: true },
    { id: 4, username: "durant.m", firstName: "Marie", lastName: "DURANT", email: "m.durant@example.fr", role: "SECRETARY", pacteEnseignant: false, isActive: true },
    { id: 5, username: "petit.p", firstName: "Paul", lastName: "PETIT", email: "p.petit@example.fr", role: "PRINCIPAL", pacteEnseignant: false, isActive: true },
    { id: 6, username: "leroy.l", firstName: "Lucie", lastName: "LEROY", email: "l.leroy@example.fr", role: "TEACHER", pacteEnseignant: true, isActive: false },
    // Nouveaux enseignants
    { id: 7, username: "dubois.p", firstName: "Pierre", lastName: "DUBOIS", email: "p.dubois@example.fr", role: "TEACHER", pacteEnseignant: true, isActive: true },
    { id: 8, username: "leroy.j", firstName: "Julie", lastName: "LEROY", email: "j.leroy@example.fr", role: "TEACHER", pacteEnseignant: true, isActive: true },
    { id: 9, username: "moreau.t", firstName: "Thomas", lastName: "MOREAU", email: "t.moreau@example.fr", role: "TEACHER", pacteEnseignant: false, isActive: true },
    { id: 10, username: "lambert.c", firstName: "Claire", lastName: "LAMBERT", email: "c.lambert@example.fr", role: "TEACHER", pacteEnseignant: false, isActive: true },
    { id: 11, username: "bernard.p", firstName: "Philippe", lastName: "BERNARD", email: "p.bernard@example.fr", role: "TEACHER", pacteEnseignant: true, isActive: true },
    { id: 12, username: "laurent.m", firstName: "Marie", lastName: "LAURENT", email: "m.laurent@example.fr", role: "TEACHER", pacteEnseignant: false, isActive: true },
  ]);
  
  // Fonction pour ouvrir le modal d'édition
  const openEditUserModal = (user: User) => {
    setCurrentUser({...user});
    setIsNewUser(false);
    setIsDialogOpen(true);
  };
  
  // Fonction pour ouvrir le modal de création
  const openNewUserModal = () => {
    setCurrentUser({
      id: 0, // Sera remplacé lors de la création
      username: "",
      firstName: "",
      lastName: "",
      email: "",
      role: "TEACHER",
      pacteEnseignant: false,
      isActive: true
    });
    setIsNewUser(true);
    setIsDialogOpen(true);
  };
  
  // Fonction pour mettre à jour un utilisateur
  const updateUser = () => {
    if (!currentUser) return;
    
    if (isNewUser) {
      // Ajout d'un nouvel utilisateur
      const newUser = {
        ...currentUser,
        id: Math.max(0, ...users.map(u => u.id)) + 1
      };
      setUsers([...users, newUser]);
      toast({
        title: "Utilisateur créé",
        description: `${newUser.firstName} ${newUser.lastName} a été créé avec succès.`
      });
    } else {
      // Mise à jour d'un utilisateur existant
      const updatedUsers = users.map(user => 
        user.id === currentUser.id ? currentUser : user
      );
      setUsers(updatedUsers);
      toast({
        title: "Utilisateur mis à jour",
        description: `${currentUser.firstName} ${currentUser.lastName} a été mis à jour avec succès.`
      });
    }
    setIsDialogOpen(false);
  };
  
  // Fonction pour supprimer un utilisateur
  const deleteUser = (id: number) => {
    const updatedUsers = users.filter(user => user.id !== id);
    setUsers(updatedUsers);
    toast({
      title: "Utilisateur supprimé",
      description: "L'utilisateur a été supprimé avec succès."
    });
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
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Gestion des utilisateurs</h2>
        <Button onClick={openNewUserModal} className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
          Nouvel utilisateur
        </Button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Identifiant</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead className="hidden sm:table-cell">Pacte</TableHead>
              <TableHead className="hidden sm:table-cell">Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.lastName} {user.firstName}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  {user.role === "TEACHER" && (
                    user.pacteEnseignant ? 
                      <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">Oui</Badge> : 
                      <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">Non</Badge>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={user.isActive ? "outline" : "secondary"} className={
                    user.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gray-100 text-gray-500"
                  }>
                    {user.isActive ? "Actif" : "Inactif"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditUserModal(user)}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                      </svg>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => deleteUser(user.id)}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Modal d'édition/création d'utilisateur */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isNewUser ? "Créer un utilisateur" : "Modifier un utilisateur"}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="firstName">Prénom</Label>
                <Input 
                  id="firstName" 
                  value={currentUser?.firstName || ""} 
                  onChange={(e) => setCurrentUser(currentUser ? {...currentUser, firstName: e.target.value} : null)}
                />
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="lastName">NOM</Label>
                <Input 
                  id="lastName" 
                  value={currentUser?.lastName || ""} 
                  onChange={(e) => setCurrentUser(currentUser ? {...currentUser, lastName: e.target.value.toUpperCase()} : null)}
                />
              </div>
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="username">Identifiant</Label>
              <Input 
                id="username" 
                value={currentUser?.username || ""} 
                onChange={(e) => setCurrentUser(currentUser ? {...currentUser, username: e.target.value} : null)}
              />
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={currentUser?.email || ""} 
                onChange={(e) => setCurrentUser(currentUser ? {...currentUser, email: e.target.value} : null)}
              />
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="role">Rôle</Label>
              <Select 
                value={currentUser?.role || "TEACHER"} 
                onValueChange={(value: 'TEACHER' | 'SECRETARY' | 'PRINCIPAL' | 'ADMIN') => 
                  setCurrentUser(currentUser ? {...currentUser, role: value} : null)
                }
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Sélectionnez un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEACHER">Enseignant</SelectItem>
                  <SelectItem value="SECRETARY">Secrétariat</SelectItem>
                  <SelectItem value="PRINCIPAL">Direction</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {currentUser?.role === "TEACHER" && (
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={currentUser?.pacteEnseignant || false} 
                  onCheckedChange={(checked) => 
                    setCurrentUser(currentUser ? {...currentUser, pacteEnseignant: checked} : null)
                  }
                  id="pacte"
                />
                <Label htmlFor="pacte">Pacte Enseignant</Label>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Switch 
                checked={currentUser?.isActive || false} 
                onCheckedChange={(checked) => 
                  setCurrentUser(currentUser ? {...currentUser, isActive: checked} : null)
                }
                id="active"
              />
              <Label htmlFor="active">Compte actif</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Fermer</Button>
            <Button onClick={updateUser}>{isNewUser ? "Créer" : "Enregistrer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}