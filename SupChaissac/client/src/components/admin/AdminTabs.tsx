import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SystemSettings } from "./SystemSettings";
import { 
  Users, 
  UploadCloud, 
  Key, 
  Settings,
  InfoIcon,
  Download,
  FileText
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { UserManagement } from "./UserManagement";
import { Button } from "@/components/ui/button";

export function AdminTabs() {
  return (
    <Tabs defaultValue="users" className="w-full mt-4">
      <Alert className="mb-6 border-blue-200 bg-blue-50">
        <InfoIcon className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-600">Console Administrateur</AlertTitle>
        <AlertDescription>
          Cette interface est dédiée à la gestion des comptes utilisateurs et aux paramètres système. 
          Pour le suivi et la validation des heures de remplacement, utilisez l'interface Direction.
        </AlertDescription>
      </Alert>
      
      <div className="flex justify-end mb-6">
        <a href="/download-documentation" target="_blank">
          <Button variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Télécharger la Documentation</span>
            <Download className="h-4 w-4" />
          </Button>
        </a>
      </div>
      
      <TabsList className="grid grid-cols-3 md:w-fit mb-6">
        <TabsTrigger value="users" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden md:inline">Utilisateurs</span>
        </TabsTrigger>
        
        <TabsTrigger value="import" className="flex items-center gap-2">
          <UploadCloud className="h-4 w-4" />
          <span className="hidden md:inline">Import PRONOTE</span>
        </TabsTrigger>
        
        <TabsTrigger value="settings" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          <span className="hidden md:inline">Paramètres</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="users">
        <div className="flex flex-col space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Gestion des utilisateurs</h2>
          <p className="text-muted-foreground mb-4">
            Créez, modifiez ou désactivez les comptes utilisateurs.
          </p>
          
          <UserManagement />
        </div>
      </TabsContent>
      
      <TabsContent value="import">
        <div className="flex flex-col space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Import PRONOTE</h2>
          <p className="text-muted-foreground">
            Importez les enseignants et leurs contrats depuis PRONOTE.
          </p>
          
          <div className="rounded-lg border p-8 mt-4 text-center">
            <UploadCloud className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Importation en masse</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Déposez votre fichier CSV exporté depuis PRONOTE ou cliquez pour sélectionner un fichier
            </p>
            <div className="flex justify-center">
              <button className="rounded-md bg-primary px-4 py-2 text-white">Sélectionner un fichier</button>
            </div>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="settings">
        <SystemSettings />
      </TabsContent>
    </Tabs>
  );
}