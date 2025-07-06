
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AddReplacement from "@/components/AddReplacement";
import ReplacementList from "@/components/ReplacementList";
import TableView from "@/components/TableView";
import TeacherPreferences from "@/components/TeacherPreferences";
import AdminDashboard from "@/components/AdminDashboard";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { LogOut, Table, List, LayoutPanelTop } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [replacements, setReplacements] = useLocalStorage("replacements", []);
  const [replacementToEdit, setReplacementToEdit] = useState(null);
  const [preferences, setPreferences] = useLocalStorage("preferences", {
    favoriteClasses: [],
    favoriteSubjects: [],
    notifications: true
  });
  const [filters, setFilters] = useLocalStorage("filters", {
    onlyFavorites: false
  });
  const [viewMode, setViewMode] = useLocalStorage("viewMode", "both"); // "table", "list", "both"
  const [showReplacementManagement, setShowReplacementManagement] = useState(false);
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Tri chronologique
  const sortedReplacements = [...replacements].sort((a, b) => {
    const dateComparison = new Date(a.date) - new Date(b.date);
    if (dateComparison !== 0) return dateComparison;
    
    const creneauOrder = {
      'M1': 1, 'M2': 2, 'M3': 3, 'M4': 4,
      'S1': 5, 'S2': 6, 'S3': 7, 'S4': 8
    };
    return creneauOrder[a.creneau] - creneauOrder[b.creneau];
  });

  const handleValidate = (id, isAccepted, isRoomAccepted, rejectionReason = null, isReset = false) => {
    setReplacements(prev => prev.map(r => {
      if (r.id === id) {
        if (isReset) {
          return {
            ...r,
            status: "pending",
            roomStatus: null,
            rejectionReason: null
          };
        } else {
          return {
            ...r,
            status: isAccepted ? "accepted" : "rejected",
            roomStatus: isRoomAccepted ? "accepted" : "rejected",
            rejectionReason
          };
        }
      }
      return r;
    }));

    toast({
      title: isReset 
        ? "Validation réinitialisée"
        : isAccepted ? "Candidature acceptée" : "Candidature refusée",
      description: isReset
        ? "La validation a été réinitialisée avec succès."
        : isAccepted
          ? "La candidature a été acceptée avec succès."
          : `La candidature a été refusée. ${rejectionReason ? `Raison : ${rejectionReason}` : ""}`
    });
  };

  if (user.role === "admin" && !showReplacementManagement) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Administration
              </h1>
              <span className="ml-4 px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                Administrateur
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.fullName}</span>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AdminDashboard onShowReplacementManagement={() => setShowReplacementManagement(true)} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Tableau de bord
            </h1>
            <span className="ml-4 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {user.role === "admin" ? "Administrateur" : user.role === "teacher" ? "Enseignant" : "Principal"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {user.role === "admin" && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowReplacementManagement(false)}
              >
                Retour à l'administration
              </Button>
            )}
            <div className="flex items-center gap-2 border-l pl-4">
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
              >
                <Table className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "both" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("both")}
              >
                <LayoutPanelTop className="h-4 w-4" />
              </Button>
            </div>
            <span className="text-sm text-gray-600">{user.fullName}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user.role === "teacher" && (
          <TeacherPreferences
            preferences={preferences}
            onUpdatePreferences={setPreferences}
            filters={filters}
            onUpdateFilters={setFilters}
          />
        )}
        
        {(user.role === "admin" || user.role === "principal") && (
          <AddReplacement
            onAddReplacement={(formData) => {
              if (replacementToEdit) {
                setReplacements(prev =>
                  prev.map(r =>
                    r.id === replacementToEdit.id ? { ...r, ...formData } : r
                  )
                );
                setReplacementToEdit(null);
              } else {
                setReplacements(prev => [...prev, {
                  id: Date.now().toString(),
                  ...formData,
                  status: "pending"
                }]);
              }
            }}
            replacementToEdit={replacementToEdit}
            onCancelEdit={() => setReplacementToEdit(null)}
            replacements={replacements}
          />
        )}

        <div className="mt-8 space-y-8">
          {(viewMode === "table" || viewMode === "both") && (
            <TableView
              replacements={sortedReplacements}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
            />
          )}
          
          {(viewMode === "list" || viewMode === "both") && (
            <ReplacementList
              replacements={sortedReplacements}
              userRole={user.role}
              onApply={(id, applicant, requestedRoom, comment, wantsNotification) => {
                setReplacements(prev =>
                  prev.map(r =>
                    r.id === id
                      ? { ...r, applicant, requestedRoom, comment, wantsNotification, status: "pending" }
                      : r
                  )
                );
                toast({
                  title: "Candidature envoyée",
                  description: "Votre candidature a été enregistrée avec succès."
                });
              }}
              onValidate={handleValidate}
              onDelete={(id) => {
                setReplacements(prev => prev.filter(r => r.id !== id));
                toast({
                  title: "Remplacement supprimé",
                  description: "Le remplacement a été supprimé avec succès."
                });
              }}
              onDuplicate={(replacement) => {
                const newReplacement = {
                  ...replacement,
                  id: Date.now().toString(),
                  status: "pending",
                  applicant: null,
                  requestedRoom: null,
                  comment: null,
                  wantsNotification: false
                };
                setReplacements(prev => [...prev, newReplacement]);
                toast({
                  title: "Remplacement dupliqué",
                  description: "Le remplacement a été dupliqué avec succès."
                });
              }}
              onUpdate={setReplacementToEdit}
            />
          )}
        </div>
      </main>
    </div>
  );
}
