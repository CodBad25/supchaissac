import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";
import { useAuth } from "@/hooks/use-auth";
import { dateToString } from "@/lib/dates";
import { formatTeacherName } from "@/lib/utils";
import { TIME_SLOTS, GRADE_LEVELS } from "@shared/schema";

interface SessionFormProps {
  selectedDate: Date;
}

export function SessionForm({ selectedDate }: SessionFormProps) {
  const { user } = useAuth();
  const { createSessionMutation } = useSession();
  
  // Form state
  const [sessionType, setSessionType] = useState<"RCD" | "DEVOIRS_FAITS" | "AUTRE" | "HSE" | null>(null);
  const [timeSlot, setTimeSlot] = useState<string | null>(null);
  const [replacedTeacherPrefix, setReplacedTeacherPrefix] = useState("M.");
  const [replacedTeacherName, setReplacedTeacherName] = useState("");
  const [className, setClassName] = useState("");
  const [subject, setSubject] = useState("");
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [gradeLevel, setGradeLevel] = useState<string>("6e");
  const [description, setDescription] = useState("");
  
  // Reset form when date changes
  useEffect(() => {
    resetForm();
  }, [selectedDate]);
  
  const resetForm = () => {
    setSessionType(null);
    setTimeSlot(null);
    setReplacedTeacherPrefix("M.");
    setReplacedTeacherName("");
    setClassName("");
    setSubject("");
    setStudentCount(null);
    setGradeLevel("6e");
    setDescription("");
  };
  
  const handleSubmit = () => {
    if (!sessionType || !timeSlot || !user) return;
    
    let sessionData: any = {
      date: dateToString(selectedDate),
      timeSlot,
      type: sessionType,
      teacherId: user.id,
      teacherName: user.name,
    };
    
    // Add type-specific fields
    if (sessionType === "RCD") {
      if (!replacedTeacherName || !className || !subject) {
        return; // Validate required fields
      }
      sessionData = {
        ...sessionData,
        replacedTeacherPrefix,
        replacedTeacherName: formatTeacherName(replacedTeacherName),
        className,
        subject,
      };
    } else if (sessionType === "DEVOIRS_FAITS") {
      if (!studentCount || !gradeLevel) {
        return; // Validate required fields
      }
      sessionData = {
        ...sessionData,
        studentCount,
        gradeLevel,
      };
    } else if (sessionType === "HSE") {
      if (!description) {
        return; // Validate required fields
      }
      sessionData = {
        ...sessionData,
        description,
      };
    } else if (sessionType === "AUTRE") {
      if (!description) {
        return; // Validate required fields
      }
      sessionData = {
        ...sessionData,
        description,
      };
    }
    
    createSessionMutation.mutate(sessionData, {
      onSuccess: () => {
        resetForm();
      }
    });
  };
  
  return (
    <div className="w-full md:w-2/3">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ajouter une séance</h3>
        
        {/* Session type selection */}
        <div className="mb-6">
          <Label className="block text-sm font-medium text-gray-700 mb-2">Type de séance</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              type="button"
              onClick={() => setSessionType("RCD")}
              className={cn(
                "relative border-2 rounded-lg p-4 flex flex-col items-center",
                sessionType === "RCD"
                  ? "bg-rcd-500 bg-opacity-10 border-rcd-500"
                  : "bg-white border-gray-300 hover:bg-gray-50"
              )}
            >
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-rcd-500 text-white mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <span className={cn("text-sm font-medium", sessionType === "RCD" ? "text-rcd-700" : "text-gray-700")}>RCD</span>
              <span className="text-xs text-gray-500 mt-1">Remplacement courte durée</span>
            </Button>
            
            <Button
              type="button"
              onClick={() => setSessionType("DEVOIRS_FAITS")}
              className={cn(
                "relative border-2 rounded-lg p-4 flex flex-col items-center",
                sessionType === "DEVOIRS_FAITS"
                  ? "bg-devoirs-faits-500 bg-opacity-10 border-devoirs-faits-500"
                  : "bg-white border-gray-300 hover:bg-gray-50"
              )}
            >
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-devoirs-faits-500 text-white mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </span>
              <span className={cn("text-sm font-medium", sessionType === "DEVOIRS_FAITS" ? "text-devoirs-faits-700" : "text-gray-700")}>Devoirs Faits</span>
              <span className="text-xs text-gray-500 mt-1">Accompagnement</span>
            </Button>

            <Button
              type="button"
              onClick={() => setSessionType("HSE")}
              className={cn(
                "relative border-2 rounded-lg p-4 flex flex-col items-center",
                sessionType === "HSE"
                  ? "bg-blue-500 bg-opacity-10 border-blue-500"
                  : "bg-white border-gray-300 hover:bg-gray-50"
              )}
            >
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-blue-500 text-white mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <span className={cn("text-sm font-medium", sessionType === "HSE" ? "text-blue-700" : "text-gray-700")}>HSE</span>
              <span className="text-xs text-gray-500 mt-1">Heures supplémentaires effectives</span>
            </Button>
            
            <Button
              type="button"
              onClick={() => setSessionType("AUTRE")}
              className={cn(
                "relative border-2 rounded-lg p-4 flex flex-col items-center",
                sessionType === "AUTRE"
                  ? "bg-autre-500 bg-opacity-10 border-autre-500"
                  : "bg-white border-gray-300 hover:bg-gray-50"
              )}
            >
              <span className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-autre-500 text-white mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </span>
              <span className={cn("text-sm font-medium", sessionType === "AUTRE" ? "text-autre-700" : "text-gray-700")}>Autre</span>
              <span className="text-xs text-gray-500 mt-1">Activité spécifique</span>
            </Button>
          </div>
        </div>
        
        {/* Time slot selection */}
        {sessionType && (
          <div className="mb-6">
            <Label className="block text-sm font-medium text-gray-700 mb-2">Créneau horaire</Label>
            <div className="grid grid-cols-2 gap-4">
              {/* Morning slots */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Matin</h4>
                <div className="space-y-2">
                  {["M1", "M2", "M3", "M4"].map((slot) => (
                    <Button
                      key={slot}
                      type="button"
                      variant="outline"
                      onClick={() => setTimeSlot(slot)}
                      className={cn(
                        "w-full flex items-center justify-between p-2",
                        timeSlot === slot
                          ? "bg-primary-50 border-primary-500 shadow-sm"
                          : "border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      <span className={cn("text-sm font-medium", timeSlot === slot ? "text-primary-700" : "text-gray-900")}>
                        {slot}
                      </span>
                      <span className={cn("text-xs", timeSlot === slot ? "text-primary-600" : "text-gray-500")}>
                        {TIME_SLOTS[slot as keyof typeof TIME_SLOTS]?.time}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Afternoon slots */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Après-midi</h4>
                <div className="space-y-2">
                  {["S1", "S2", "S3", "S4"].map((slot) => (
                    <Button
                      key={slot}
                      type="button"
                      variant="outline"
                      onClick={() => setTimeSlot(slot)}
                      className={cn(
                        "w-full flex items-center justify-between p-2",
                        timeSlot === slot
                          ? "bg-primary-50 border-primary-500 shadow-sm"
                          : "border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      <span className={cn("text-sm font-medium", timeSlot === slot ? "text-primary-700" : "text-gray-900")}>
                        {slot}
                      </span>
                      <span className={cn("text-xs", timeSlot === slot ? "text-primary-600" : "text-gray-500")}>
                        {TIME_SLOTS[slot as keyof typeof TIME_SLOTS]?.time}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Additional form fields based on session type */}
        {sessionType === "RCD" && timeSlot && (
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">Professeur remplacé</Label>
              <div className="flex space-x-2 mb-2">
                <Select value={replacedTeacherPrefix} onValueChange={setReplacedTeacherPrefix}>
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="Préfixe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M.">M.</SelectItem>
                    <SelectItem value="Mme">Mme</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="text"
                  value={replacedTeacherName}
                  onChange={(e) => setReplacedTeacherName(e.target.value)}
                  className="flex-1"
                  placeholder="Nom du professeur"
                />
              </div>
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">Classe</Label>
              <Input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Ex: 5e B"
              />
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">Matière</Label>
              <Input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Mathématiques"
              />
            </div>
          </div>
        )}
        
        {sessionType === "DEVOIRS_FAITS" && timeSlot && (
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">Nombre d'élèves</Label>
              <Input
                type="number"
                value={studentCount || ""}
                onChange={(e) => setStudentCount(parseInt(e.target.value) || null)}
                placeholder="Ex: 12"
              />
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">Niveau</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un niveau" />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_LEVELS.map((grade) => (
                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        
        {sessionType === "HSE" && timeSlot && (
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">Description</Label>
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Formation continue - Référent numérique"
              />
            </div>
          </div>
        )}
        
        {sessionType === "AUTRE" && timeSlot && (
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">Description</Label>
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Formation tablettes - 4e C"
              />
            </div>
          </div>
        )}
        
        {/* Submit button */}
        {sessionType && timeSlot && (
          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              className="mr-3"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={createSessionMutation.isPending}
            >
              {createSessionMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enregistrement...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
