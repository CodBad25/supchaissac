import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Users,
  UploadCloud,
  Key,
  Cog,
  UserCheck,
  Loader2,
  BookOpen,
  Calendar,
  ClipboardCheck,
  Clock
} from "lucide-react";

export function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 68,
    activeUsers: 62,
    teachersWithPacte: 41,
    teachersWithoutPacte: 21,
    pendingSessions: 24,
    validatedSessions: 186,
    totalHours: 248
  });

  // Simuler un rechargement des données
  const refreshStats = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };
  
  // Note: L'administrateur ne peut pas valider les remplacements
  // Cette fonctionnalité est réservée au principal/secrétaire

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord administrateur</h1>
        <Button 
          variant="outline" 
          className="self-start" 
          onClick={refreshStats} 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Chargement...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2v6h-6M21 15.5A9 9 0 0 1 6.5 19.5 9 9 0 0 1 3 12a9 9 0 0 1 14-7.5L21 8"></path>
              </svg>
              Actualiser
            </>
          )}
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.activeUsers} actifs, {stats.totalUsers - stats.activeUsers} inactifs
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enseignants Pacte</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.teachersWithPacte}</div>
            <div className="flex items-center space-x-2 mt-1">
              <Progress value={(stats.teachersWithPacte / (stats.teachersWithPacte + stats.teachersWithoutPacte)) * 100} className="h-2" />
              <span className="text-xs text-muted-foreground">{Math.round((stats.teachersWithPacte / (stats.teachersWithPacte + stats.teachersWithoutPacte)) * 100)}%</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heures déclarées</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 font-medium">{stats.validatedSessions}</span> séances validées
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingSessions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-amber-600 font-medium">Consultation uniquement</span>
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Répartition des heures par type</CardTitle>
            <CardDescription>Vue d'ensemble des activités des enseignants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm font-medium">RCD</span>
                  </div>
                  <span className="text-sm font-medium">121h</span>
                </div>
                <Progress value={121/stats.totalHours*100} className="h-2 bg-purple-100" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium">Devoirs Faits</span>
                  </div>
                  <span className="text-sm font-medium">93h</span>
                </div>
                <Progress value={93/stats.totalHours*100} className="h-2 bg-blue-100" />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                    <span className="text-sm font-medium">Autre</span>
                  </div>
                  <span className="text-sm font-medium">34h</span>
                </div>
                <Progress value={34/stats.totalHours*100} className="h-2 bg-amber-100" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Accès rapides</CardTitle>
            <CardDescription>Fonctionnalités d'administration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="#users">
                  <Users className="mr-2 h-4 w-4" />
                  Gestion des utilisateurs
                </a>
              </Button>
              
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="#import">
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Import PRONOTE
                </a>
              </Button>
              
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="#passwords">
                  <Key className="mr-2 h-4 w-4" />
                  Réinitialiser mots de passe
                </a>
              </Button>
              
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="#settings">
                  <Cog className="mr-2 h-4 w-4" />
                  Paramètres de l'application
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}