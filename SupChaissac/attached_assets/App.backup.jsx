
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import AddReplacement from "@/components/AddReplacement";
import ReplacementList from "@/components/ReplacementList";
import TeacherPreferences from "@/components/TeacherPreferences";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

function App() {
  const [replacements, setReplacements] = useLocalStorage("replacements", []);
  const [replacementToEdit, setReplacementToEdit] = useState(null);
  const [userRole, setUserRole] = useState("admin");
  const { toast } = useToast();
  const [preferences, setPreferences] = useLocalStorage("preferences", {
    favoriteClasses: [],
    favoriteSubjects: [],
    notifications: true
  });
  const [filters, setFilters] = useLocalStorage("filters", {
    onlyFavorites: false
  });

  // Filtrer les remplacements selon les préférences et trier par date
  const filteredReplacements = replacements
    .filter(replacement => {
      if (!filters.onlyFavorites) return true;
      const matchesClass = preferences.favoriteClasses.includes(replacement.class);
      const matchesSubject = preferences.favoriteSubjects.includes(replacement.subject);
      return matchesClass || matchesSubject;
    })
    .sort((a, b) => {
      // D'abord trier par date
      const dateComparison = new Date(a.date) - new Date(b.date);
      if (dateComparison !== 0) return dateComparison;
      
      // Si même date, trier par créneau
      const creneauOrder = {
        'M1': 1, 'M2': 2, 'M3': 3, 'M4': 4,
        'S1': 5, 'S2': 6, 'S3': 7, 'S4': 8
      };
      return creneauOrder[a.creneau] - creneauOrder[b.creneau];
    });

  const handleAddReplacement = (formData) => {
    if (replacementToEdit) {
      // Mode édition
      setReplacements(prevReplacements =>
        prevReplacements.map(replacement =>
          replacement.id === replacementToEdit.id
            ? { ...replacement, ...formData }
            : replacement
        )
      );
      setReplacementToEdit(null);
      toast({
        title: "Remplacement modifié",
        description: "Le remplacement a été mis à jour avec succès."
      });
    } else {
      // Mode création
      const newReplacement = {
        id: Date.now().toString(),
        ...formData,
        status: "pending",
        applicant: null,
        requestedRoom: null,
        comment: null,
        wantsNotification: false
      };
      setReplacements(prev => [...prev, newReplacement]);
      toast({
        title: "Remplacement créé",
        description: "Le nouveau remplacement a été créé avec succès."
      });
    }
  };

  const handleApplyForReplacement = (id, applicant, requestedRoom, comment, wantsNotification) => {
    setReplacements(prevReplacements =>
      prevReplacements.map(replacement =>
        replacement.id === id
          ? {
              ...replacement,
              applicant,
              requestedRoom,
              comment,
              wantsNotification,
              status: "pending"
            }
          : replacement
      )
    );
    toast({
      title: "Candidature envoyée",
      description: "Votre candidature a été enregistrée avec succès."
    });
  };

  const handleValidateReplacement = (id, isAccepted, isRoomAccepted, rejectionReason = null, isReset = false) => {
    setReplacements(prevReplacements =>
      prevReplacements.map(replacement =>
        replacement.id === id
          ? {
              ...replacement,
              status: isReset ? "pending" : (isAccepted ? "accepted" : "rejected"),
              roomStatus: isReset ? null : (isRoomAccepted ? "accepted" : "rejected"),
              rejectionReason: isReset ? null : rejectionReason
            }
          : replacement
      )
    );

    if (isReset) {
      toast({
        title: "Validation réinitialisée",
        description: "La validation a été réinitialisée avec succès."
      });
    } else {
      toast({
        title: isAccepted ? "Candidature acceptée" : "Candidature refusée",
        description: isAccepted
          ? "La candidature a été acceptée avec succès."
          : `La candidature a été refusée. ${rejectionReason ? `Raison : ${rejectionReason}` : ""}`
      });
    }
  };

  const handleDeleteReplacement = (id) => {
    setReplacements(prev => prev.filter(replacement => replacement.id !== id));
    toast({
      title: "Remplacement supprimé",
      description: "Le remplacement a été supprimé avec succès."
    });
  };

  const handleDuplicateReplacement = (replacement) => {
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
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <TeacherPreferences
          preferences={preferences}
          onUpdatePreferences={setPreferences}
          filters={filters}
          onUpdateFilters={setFilters}
        />
        <div className="space-y-8">
          <AddReplacement
            onAddReplacement={handleAddReplacement}
            replacementToEdit={replacementToEdit}
            onCancelEdit={() => setReplacementToEdit(null)}
            replacements={replacements}
          />
          <ReplacementList
            replacements={filteredReplacements}
            userRole={userRole}
            onApply={handleApplyForReplacement}
            onValidate={handleValidateReplacement}
            onDelete={handleDeleteReplacement}
            onDuplicate={handleDuplicateReplacement}
            onUpdate={setReplacementToEdit}
          />
        </div>
      </div>
      <Toaster />
    </div>
  );
}

export default App;
