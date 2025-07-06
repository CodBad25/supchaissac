import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

const CRENEAUX = {
  MATIN: ["M1", "M2", "M3", "M4"],
  SOIR: ["S1", "S2", "S3", "S4"]
};

function AddReplacement({ onAddReplacement, replacementToEdit }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    date: new Date(),
    creneauxClasses: {},
    subject: "",
    replacedTeacher: "",
    room: "",
    comments: "",
    status: "pending"
  });

  useEffect(() => {
    if (replacementToEdit) {
      const creneauxClasses = {};
      creneauxClasses[replacementToEdit.creneau] = replacementToEdit.class;

      setFormData({
        lastName: replacementToEdit.lastName || "",
        firstName: replacementToEdit.firstName || "",
        date: new Date(replacementToEdit.date),
        creneauxClasses: creneauxClasses,
        subject: replacementToEdit.subject || "",
        replacedTeacher: replacementToEdit.replacedTeacher || "",
        room: replacementToEdit.room || "",
        comments: replacementToEdit.comments || "",
        status: replacementToEdit.status || "pending"
      });
    }
  }, [replacementToEdit]);

  const handleCreneauClick = (creneau) => {
    setFormData(prev => {
      const newCreneauxClasses = { ...prev.creneauxClasses };
      if (newCreneauxClasses[creneau] !== undefined) {
        delete newCreneauxClasses[creneau];
      } else {
        newCreneauxClasses[creneau] = "";
      }
      return {
        ...prev,
        creneauxClasses: newCreneauxClasses
      };
    });
  };

  const handleClassChange = (creneau, value, event = null) => {
    const upperValue = value.toUpperCase();
    setFormData(prev => ({
      ...prev,
      creneauxClasses: { 
        ...prev.creneauxClasses, 
        [creneau]: upperValue
      }
    }));

    // Si un événement est fourni et que c'est la touche Tab
    if (event && event.key === 'Tab' && upperValue) {
      event.preventDefault();
      const creneaux = [...CRENEAUX.MATIN, ...CRENEAUX.SOIR];
      const currentIndex = creneaux.indexOf(creneau);
      const nextCreneau = creneaux[currentIndex + 1];
      
      if (nextCreneau) {
        setFormData(prev => ({
          ...prev,
          creneauxClasses: { 
            ...prev.creneauxClasses,
            [nextCreneau]: ""
          }
        }));
        // Focus sur le prochain input
        setTimeout(() => {
          const nextInput = document.querySelector(`input[data-creneau="${nextCreneau}"]`);
          if (nextInput) nextInput.focus();
        }, 0);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.lastName) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir le nom de l'enseignant.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.firstName) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir le prénom de l'enseignant.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.replacedTeacher) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir le nom de l'enseignant remplacé.",
        variant: "destructive"
      });
      return;
    }

    const hasEmptyClasses = Object.values(formData.creneauxClasses).some(classe => !classe);
    if (hasEmptyClasses) {
      toast({
        title: "Erreur",
        description: "Veuillez renseigner une classe pour chaque créneau sélectionné.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.subject) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une matière.",
        variant: "destructive"
      });
      return;
    }

    onAddReplacement(formData);

    if (!replacementToEdit) {
      setFormData({
        lastName: "",
        firstName: "",
        date: new Date(),
        creneauxClasses: {},
        subject: "",
        replacedTeacher: "",
        room: "",
        comments: "",
        status: "pending"
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-lg shadow-lg mb-8 border border-gray-100"
    >
      <h2 className="text-xl font-semibold mb-6 text-gray-800">
        {replacementToEdit ? "Modifier le remplacement" : "Ajouter un remplacement"}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom de l'enseignant</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                lastName: e.target.value.toUpperCase() 
              }))}
              className="w-full p-2 border rounded"
              placeholder="NOM"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Prénom de l'enseignant</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                firstName: e.target.value 
              }))}
              className="w-full p-2 border rounded"
              placeholder="Prénom"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Enseignant remplacé</label>
          <input
            type="text"
            value={formData.replacedTeacher}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              replacedTeacher: e.target.value.toUpperCase() 
            }))}
            className="w-full p-2 border rounded"
            placeholder="NOM de l'enseignant remplacé"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.date ? format(formData.date, "EEEE d MMMM yyyy", { locale: fr }) : <span>Choisir une date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.date}
                onSelect={(date) => setFormData(prev => ({ ...prev, date }))}
                initialFocus
                locale={fr}
                disabled={[{ dayOfWeek: [0, 6] }]}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium mb-4">Créneaux du matin</h3>
            <div className="space-y-2">
              {CRENEAUX.MATIN.map((creneau) => (
                <div key={creneau} className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={formData.creneauxClasses[creneau] !== undefined ? "default" : "outline"}
                    onClick={() => handleCreneauClick(creneau)}
                    className="w-20"
                  >
                    {creneau}
                  </Button>
                  {formData.creneauxClasses[creneau] !== undefined && (
                    <input
                      type="text"
                      data-creneau={creneau}
                      value={formData.creneauxClasses[creneau]}
                      onChange={(e) => handleClassChange(creneau, e.target.value)}
                      onKeyDown={(e) => handleClassChange(creneau, e.target.value, e)}
                      placeholder="Classe"
                      className="flex-1 p-2 border rounded"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-4">Créneaux du soir</h3>
            <div className="space-y-2">
              {CRENEAUX.SOIR.map((creneau) => (
                <div key={creneau} className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={formData.creneauxClasses[creneau] !== undefined ? "default" : "outline"}
                    onClick={() => handleCreneauClick(creneau)}
                    className="w-20"
                  >
                    {creneau}
                  </Button>
                  {formData.creneauxClasses[creneau] !== undefined && (
                    <input
                      type="text"
                      data-creneau={creneau}
                      value={formData.creneauxClasses[creneau]}
                      onChange={(e) => handleClassChange(creneau, e.target.value)}
                      onKeyDown={(e) => handleClassChange(creneau, e.target.value, e)}
                      placeholder="Classe"
                      className="flex-1 p-2 border rounded"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Matière</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              className="w-full p-2 border rounded"
              placeholder="ex: Mathématiques"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Salle</label>
            <input
              type="text"
              value={formData.room}
              onChange={(e) => setFormData(prev => ({ ...prev, room: e.target.value }))}
              className="w-full p-2 border rounded"
              placeholder="ex: B204"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Commentaires (optionnel)</label>
            <textarea
              value={formData.comments}
              onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
              className="w-full p-2 border rounded"
              rows="3"
              placeholder="Informations complémentaires..."
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            {replacementToEdit ? "Modifier" : "Ajouter"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}

export default AddReplacement;