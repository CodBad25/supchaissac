
import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SUBJECT_GROUPS = {
  "Sciences": {
    subjects: ["Mathématiques", "SVT", "Physique-Chimie", "Technologie"],
    color: "bg-blue-600",
    textColor: "text-blue-600",
    borderColor: "border-blue-200",
    bgHover: "hover:bg-blue-50"
  },
  "Lettres & Langues": {
    subjects: ["Français", "Anglais", "Espagnol", "Allemand", "Latin"],
    color: "bg-green-600",
    textColor: "text-green-600",
    borderColor: "border-green-200",
    bgHover: "hover:bg-green-50"
  },
  "Sciences Humaines": {
    subjects: ["Histoire-Géo", "EMC"],
    color: "bg-purple-600",
    textColor: "text-purple-600",
    borderColor: "border-purple-200",
    bgHover: "hover:bg-purple-50"
  },
  "Arts & Sport": {
    subjects: ["Arts Plastiques", "Musique", "EPS"],
    color: "bg-orange-600",
    textColor: "text-orange-600",
    borderColor: "border-orange-200",
    bgHover: "hover:bg-orange-50"
  }
};

const CRENEAUX = [
  { id: "M1", label: "M1" },
  { id: "M2", label: "M2" },
  { id: "M3", label: "M3" },
  { id: "M4", label: "M4" },
  { id: "S1", label: "S1" },
  { id: "S2", label: "S2" },
  { id: "S3", label: "S3" },
  { id: "S4", label: "S4" }
];

function TableView({ replacements, currentDate, onDateChange }) {
  // Filtrer les remplacements pour la date sélectionnée
  const replacementsForDate = replacements.filter(replacement => {
    const replacementDate = new Date(replacement.date);
    return (
      replacementDate.getDate() === currentDate.getDate() &&
      replacementDate.getMonth() === currentDate.getMonth() &&
      replacementDate.getFullYear() === currentDate.getFullYear()
    );
  });

  // Fonction pour obtenir la couleur de la matière
  const getSubjectColor = (subject) => {
    for (const [_, group] of Object.entries(SUBJECT_GROUPS)) {
      if (group.subjects.includes(subject)) {
        return group.color;
      }
    }
    return "bg-gray-500"; // Couleur par défaut
  };

  // Fonction pour obtenir le remplacement pour un créneau spécifique
  const getReplacementForCreneau = (creneau) => {
    return replacementsForDate.filter(replacement => 
      replacement.creneauxClasses && replacement.creneauxClasses[creneau]
    );
  };

  // Fonction pour naviguer entre les jours
  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction);
    
    // Skip weekends
    while (newDate.getDay() === 0 || newDate.getDay() === 6) {
      newDate.setDate(newDate.getDate() + direction);
    }
    
    onDateChange(newDate);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* En-tête avec navigation de date */}
      <div className="p-4 border-b flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateDate(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="min-w-[240px] justify-center font-medium"
            >
              {format(currentDate, "EEEE d MMMM yyyy", { locale: fr })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={currentDate}
              onSelect={(date) => date && onDateChange(date)}
              disabled={[
                { dayOfWeek: [0, 6] }
              ]}
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateDate(1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Tableau des remplacements */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-2 px-4 border-b border-r text-left font-medium text-gray-500">
                Créneau
              </th>
              <th className="py-2 px-4 border-b text-left font-medium text-gray-500">
                Remplacements
              </th>
            </tr>
          </thead>
          <tbody>
            {CRENEAUX.map((creneau) => {
              const replacementsForCreneau = getReplacementForCreneau(creneau.id);
              
              return (
                <tr key={creneau.id} className="border-b">
                  <td className="py-2 px-4 border-r font-medium text-gray-600 w-24">
                    {creneau.label}
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex flex-wrap gap-2">
                      {replacementsForCreneau.map((replacement) => (
                        <div
                          key={`${replacement.id}-${creneau.id}`}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div className={`px-2 py-1 rounded text-white ${getSubjectColor(replacement.subject)}`}>
                            {replacement.subject}
                          </div>
                          <span className="font-medium">
                            {replacement.civility} {replacement.replacedTeacher}
                          </span>
                          <span className="text-gray-500">
                            {replacement.creneauxClasses[creneau.id]}
                          </span>
                          {replacement.room && (
                            <span className="text-gray-500">
                              (Salle {replacement.room})
                            </span>
                          )}
                          {replacement.status === "accepted" && (
                            <span className="text-green-600 text-sm">✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TableView;
