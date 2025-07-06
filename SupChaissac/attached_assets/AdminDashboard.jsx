
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { UserPlus, Upload, Users, Settings, ChevronDown, Eye, EyeOff, Trash2, Edit2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

function AdminDashboard({ onShowReplacementManagement }) {
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  const [users, setUsers] = useState([
    { id: "1", username: "admin@ac-nantes.fr", role: "admin", fullName: "Administrateur", active: true },
    { id: "2", username: "m.belhaj", role: "teacher", fullName: "M. Belhaj", active: true },
    { id: "3", username: "s.rio", role: "teacher", fullName: "S. Rio", active: true }
  ]);
  const { toast } = useToast();

  const [newUser, setNewUser] = useState({
    username: "",
    fullName: "",
    role: "teacher",
    active: true
  });

  const handleAddUser = () => {
    const id = Date.now().toString();
    const password = newUser.username.split(".")[1]?.charAt(0).repeat(3) || "xxx";
    
    setUsers(prev => [...prev, { ...newUser, id, password }]);
    toast({
      title: "Utilisateur ajouté",
      description: `${newUser.fullName} a été ajouté avec succès. Mot de passe : ${password}`
    });
    setNewUser({
      username: "",
      fullName: "",
      role: "teacher",
      active: true
    });
  };

  const handleImportPronote = (file) => {
    // Simulation d'import
    toast({
      title: "Import Pronote",
      description: "Fonctionnalité à venir. L'import depuis Pronote sera bientôt disponible."
    });
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec boutons d'action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Gestion des utilisateurs</h2>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {users.length} utilisateurs
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Nouvel utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un utilisateur</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Nom complet</label>
                  <input
                    type="text"
                    value={newUser.fullName}
                    onChange={(e) => setNewUser(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full mt-1 p-2 border rounded"
                    placeholder="ex: M. Dupont"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Identifiant</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value.toLowerCase() }))}
                    className="w-full mt-1 p-2 border rounded"
                    placeholder="ex: j.dupont"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Le mot de passe sera généré automatiquement
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Rôle</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full mt-1 p-2 border rounded"
                  >
                    <option value="teacher">Enseignant</option>
                    <option value="principal">Principal</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>
                <Button onClick={handleAddUser} className="w-full">
                  Ajouter l'utilisateur
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import Pronote
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import depuis Pronote</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600">
                    Déposez votre fichier d'export Pronote ici ou
                    <button className="text-blue-500 hover:text-blue-600 ml-1">
                      parcourez vos fichiers
                    </button>
                  </p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                  <p className="text-sm text-yellow-800">
                    Cette fonctionnalité sera disponible prochainement.
                    Elle permettra d'importer automatiquement la liste des enseignants depuis Pronote.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-500" />
            <h3 className="font-medium">Liste des utilisateurs</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
            className="text-gray-600"
          >
            <Settings className="h-4 w-4 mr-2" />
            Fonctionnalités avancées
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </div>
        <div className="divide-y">
          {users.map(user => (
            <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{user.fullName}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    user.role === "admin" 
                      ? "bg-purple-100 text-purple-800"
                      : user.role === "principal"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-green-100 text-green-800"
                  }`}>
                    {user.role === "admin" 
                      ? "Administrateur" 
                      : user.role === "principal"
                      ? "Principal"
                      : "Enseignant"
                    }
                  </span>
                  {!user.active && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      Désactivé
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {user.username}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUsers(prev => prev.map(u => 
                      u.id === user.id ? { ...u, active: !u.active } : u
                    ));
                    toast({
                      title: user.active ? "Compte désactivé" : "Compte activé",
                      description: `Le compte de ${user.fullName} a été ${user.active ? "désactivé" : "activé"}.`
                    });
                  }}
                >
                  {user.active ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer le compte de {user.fullName} ?
                        Cette action ne peut pas être annulée.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          setUsers(prev => prev.filter(u => u.id !== user.id));
                          toast({
                            title: "Compte supprimé",
                            description: `Le compte de ${user.fullName} a été supprimé.`
                          });
                        }}
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fonctionnalités avancées */}
      {showAdvancedFeatures && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="space-y-4">
            <h3 className="font-medium">Fonctionnalités avancées</h3>
            <div className="grid gap-2">
              <Button
                variant="outline"
                onClick={onShowReplacementManagement}
                className="justify-start"
              >
                Gestion des remplacements
              </Button>
              <Button
                variant="outline"
                className="justify-start"
              >
                Statistiques et rapports
              </Button>
              <Button
                variant="outline"
                className="justify-start"
              >
                Configuration du système
              </Button>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <p className="text-sm text-yellow-800">
                Ces fonctionnalités sont destinées aux tests et à la configuration avancée.
                Utilisez-les avec précaution.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
