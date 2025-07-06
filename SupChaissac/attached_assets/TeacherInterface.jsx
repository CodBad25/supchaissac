
import React, { useState } from "react";
import { motion } from "framer-motion";
import TeacherPreferences from "./TeacherPreferences";
import ViewToggle from "./ViewToggle";
import TableView from "./TableView";
import ReplacementList from "./ReplacementList";
import { useLocalStorage } from "@/hooks/useLocalStorage";

function TeacherInterface({ replacements, onApplyForReplacement }) {
  const [preferences, setPreferences] = useLocalStorage("teacherPreferences", {
    favoriteClasses: [],
    favoriteSubjects: []
  });
  
  const [filters, setFilters] = useState({
    onlyFavorites: false
  });

  const [activeViews, setActiveViews] = useLocalStorage("teacherActiveViews", ["list"]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sortBy, setSortBy] = useState("date");

  const handleUpdatePreferences = (newPreferences) => {
    setPreferences(newPreferences);
  };

  // Filtrer les remplacements selon les préférences
  const filteredReplacements = replacements.filter(replacement => {
    if (!filters.onlyFavorites) return true;
    
    return (
      preferences.favoriteClasses.includes(replacement.class) ||
      preferences.favoriteSubjects.includes(replacement.subject)
    );
  });

  return (
    <div className="space-y-4">
      <TeacherPreferences
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
        filters={filters}
        onUpdateFilters={setFilters}
      />

      <ViewToggle 
        activeViews={activeViews} 
        onViewChange={setActiveViews} 
      />

      <div className="space-y-4">
        {activeViews.includes("table") && (
          <TableView
            replacements={filteredReplacements}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
          />
        )}

        {activeViews.includes("list") && (
          <ReplacementList
            replacements={filteredReplacements}
            userRole="teacher"
            onApplyForReplacement={onApplyForReplacement}
            onSort={setSortBy}
            currentSort={sortBy}
          />
        )}
      </div>
    </div>
  );
}

export default TeacherInterface;
