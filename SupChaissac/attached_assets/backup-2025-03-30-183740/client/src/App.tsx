import { Switch, Route, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import { MainLayout } from "@/components/layout/main-layout";
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
            onClick={() => setLocation("/?role=admin")}
          >
            Administrateur
          </Button>
        </div>
      </div>
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
      {role === "admin" && <AdminView />}
    </>
  );
}

export default App;
