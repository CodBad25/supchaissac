
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, BellOff, X, ChevronDown, ChevronUp, Filter } from "lucide-react";

const CLASS_GROUPS = {
  "6ème": {
    classes: ["6A", "6B", "6C", "6D"],
    color: "bg-emerald-500",
    textColor: "text-emerald-600",
    borderColor: "border-emerald-200",
    bgHover: "hover:bg-emerald-50"
  },
  "5ème": {
    classes: ["5A", "5B", "5C"],
    color: "bg-blue-500",
    textColor: "text-blue-600",
    borderColor: "border-blue-200",
    bgHover: "hover:bg-blue-50"
  },
  "4ème": {
    classes: ["4A", "4B", "4C", "4D"],
    color: "bg-purple-500",
    textColor: "text-purple-600",
    borderColor: "border-purple-200",
    bgHover: "hover:bg-purple-50"
  },
  "3ème": {
    classes: ["3A", "3B", "3C", "3D"],
    color: "bg-red-500",
    textColor: "text-red-600",
    borderColor: "border-red-200",
    bgHover: "hover:bg-red-50"
  }
};

const SUBJECT_GROUPS = {
  "Sciences": {
    subjects: ["Mathématiques", "SVT", "Physique-Chimie", "Technologie"],
    color: "bg-blue-500",
    textColor: "text-blue-600",
    borderColor: "border-blue-200",
    bgHover: "hover:bg-blue-50"
  },
  "Lettres & Langues": {
    subjects: ["Français", "Anglais", "Espagnol", "Allemand", "Latin"],
    color: "bg-green-500",
    textColor: "text-green-600",
    borderColor: "border-green-200",
    bgHover: "hover:bg-green-50"
  },
  "Sciences Humaines": {
    subjects: ["Histoire-Géo", "EMC"],
    color: "bg-purple-500",
    textColor: "text-purple-600",
    borderColor: "border-purple-200",
    bgHover: "hover:bg-purple-50"
  },
  "Arts & Sport": {
    subjects: ["Arts Plastiques", "Musique", "EPS"],
    color: "bg-orange-500",
    textColor: "text-orange-600",
    borderColor: "border-orange-200",
    bgHover: "hover:bg-orange-50"
  }
};

function TeacherPreferences({ preferences, onUpdatePreferences, filters, onUpdateFilters }) {
  const [activeTab, setActiveTab] = useState("classes");
  const [isExpanded, setIsExpanded] = useState(true);

  const clearAllFilters = () => {
    onUpdatePreferences({
      ...preferences,
      favoriteClasses: [],
      favoriteSubjects: []
    });
    onUpdateFilters({
      ...filters,
      onlyFavorites: false
    });
  };

  const toggleNotifications = () => {
    onUpdatePreferences({
      ...preferences,
      notifications: !preferences.notifications
    });
  };

  const toggleFavoriteClass = (className) => {
    const newFavorites = preferences.favoriteClasses.includes(className)
      ? preferences.favoriteClasses.filter(c => c !== className)
      : [...preferences.favoriteClasses, className];
    
    onUpdatePreferences({
      ...preferences,
      favoriteClasses: newFavorites
    });
  };

  const toggleFavoriteSubject = (subject) => {
    const newFavorites = preferences.favoriteSubjects.includes(subject)
      ? preferences.favoriteSubjects.filter(s => s !== subject)
      : [...preferences.favoriteSubjects, subject];
    
    onUpdatePreferences({
      ...preferences,
      favoriteSubjects: newFavorites
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md overflow-hidden mb-4"
    >
      {/* En-tête amélioré */}
      <div className="p-2 flex items-center justify-between border-b">
        <div className="flex items-center gap-4">
          <Button
            variant={isExpanded ? "default" : "outline"}
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 h-8 px-4 min-w-[120px]"
          >
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filtres</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.onlyFavorites}
              onChange={(e) => onUpdateFilters({ ...filters, onlyFavorites: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              id="favorites-toggle"
            />
            <label htmlFor="favorites-toggle" className="text-sm cursor-pointer select-none">
              Favoris uniquement
            </label>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="text-gray-600 hover:text-gray-800 h-8"
          >
            <X className="h-4 w-4 mr-1" />
            Effacer
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleNotifications}
            className={`${preferences.notifications ? "text-blue-600" : "text-gray-400"} h-8`}
          >
            {preferences.notifications ? (
              <Bell className="h-4 w-4" />
            ) : (
              <BellOff className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Contenu masquable */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-2">
                  <TabsTrigger value="classes" className="text-xs py-1 px-2">Classes</TabsTrigger>
                  <TabsTrigger value="subjects" className="text-xs py-1 px-2">Matières</TabsTrigger>
                </TabsList>
                
                <TabsContent value="classes" className="mt-0">
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    {Object.entries(CLASS_GROUPS).map(([level, group]) => (
                      <div key={level} className="space-y-0.5">
                        <h4 className={`text-[10px] font-medium ${group.textColor}`}>{level}</h4>
                        <div className="grid grid-cols-2 gap-0.5">
                          {group.classes.map(className => (
                            <Button
                              key={className}
                              variant={preferences.favoriteClasses.includes(className) ? "default" : "outline"}
                              onClick={() => toggleFavoriteClass(className)}
                              className={`h-6 text-[10px] px-0.5 min-w-[2rem] ${
                                preferences.favoriteClasses.includes(className)
                                  ? `text-white ${group.color}`
                                  : `${group.textColor} border ${group.borderColor} ${group.bgHover}`
                              }`}
                            >
                              {className}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="subjects" className="mt-0">
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    {Object.entries(SUBJECT_GROUPS).map(([group, data]) => (
                      <div key={group} className="space-y-0.5">
                        <h4 className={`text-[10px] font-medium ${data.textColor}`}>{group}</h4>
                        <div className="grid grid-cols-2 gap-0.5">
                          {data.subjects.map(subject => (
                            <Button
                              key={subject}
                              variant={preferences.favoriteSubjects.includes(subject) ? "default" : "outline"}
                              onClick={() => toggleFavoriteSubject(subject)}
                              className={`h-6 text-[10px] px-0.5 min-w-[2rem] ${
                                preferences.favoriteSubjects.includes(subject)
                                  ? `text-white ${data.color}`
                                  : `${data.textColor} border ${data.borderColor} ${data.bgHover}`
                              }`}
                            >
                              {subject}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default TeacherPreferences;
