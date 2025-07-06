import { Switch, Route, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { PrincipalView } from "@/components/principal/PrincipalComponents";
import { SecretaryView } from "@/components/secretary/SecretaryComponents";
import { AdminView } from "@/components/admin/AdminComponents";
import { TeacherView } from "@/components/teacher/TeacherComponents";
import { Button } from "@/components/ui/button";

// Simple app for demo purposes
function App() {
  return (
    <>
      <Switch>
        <Route path="/" component={MainApp} />
        <Route path="/role-select" component={RoleSelector} />
        <Route path="/admin" component={AdminInterface} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </>
  );
}

function RoleSelector() {
  const [, setLocation] = useLocation();
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-6">Sélectionner un rôle</h2>
        <div className="space-y-4">
          <Button
            className="w-full justify-start text-left"
            onClick={() => setLocation("/?role=teacher")}
          >
            Enseignant
          </Button>
          <Button
            className="w-full justify-start text-left"
            onClick={() => setLocation("/?role=secretary")}
          >
            Secrétariat
          </Button>
          <Button
            className="w-full justify-start text-left"
            onClick={() => setLocation("/?role=principal")}
          >
            Direction
          </Button>
          <Button
            className="w-full justify-start text-left"
            onClick={() => setLocation("/admin")}
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              Administrateur
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Interface administrateur complètement séparée
function AdminInterface() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900 mr-4">Système de Gestion</h1>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              Console Admin
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.href = "/role-select"}
          >
            Changer de rôle
          </Button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminView />
      </main>
    </div>
  );
}

function MainApp() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1]);
  const role = params.get("role") || "teacher";
  
  // Add a button to return to role selector
  const RoleSelectorButton = () => (
    <Button 
      variant="outline" 
      size="sm" 
      className="fixed top-4 right-4 z-50"
      onClick={() => window.location.href = "/role-select"}
    >
      Changer de rôle
    </Button>
  );
  
  return (
    <>
      <RoleSelectorButton />
      {role === "teacher" && <TeacherView />}
      {role === "secretary" && <SecretaryView />}
      {role === "principal" && <PrincipalView />}
      {/* Retrait de l'admin view d'ici puisque maintenant c'est un chemin dédié */}
    </>
  );
}

export default App;
