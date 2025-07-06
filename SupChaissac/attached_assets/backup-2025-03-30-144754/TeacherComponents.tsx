// Composants de l'interface enseignant
import { useState } from 'react';
import { addWeeks, subWeeks, format, parseISO, isToday, set, addDays, startOfWeek, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Users, BookOpen, Clock, Sun, Moon, Camera, Upload, Download, FileSpreadsheet, FileText } from "lucide-react";

export function TeacherView() {
  // Récupérer le hook toast pour les notifications
  const { toast } = useToast();

  // États pour le suivi des heures
  const [hasPacte, setHasPacte] = useState(true);
  const [totalHours] = useState({ total: 36, rcd: 15, devoirsFaits: 21 });
  const [completedHours] = useState({ rcd: 8, devoirsFaits: 12, autres: 3 });
  
  // État du calendrier (initialisé sur la date actuelle)
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = dimanche, 6 = samedi
  
  // Fonction pour déterminer la date initiale selon le jour de la semaine
  const getInitialDate = () => {
    // Toujours retourner le lundi de la semaine courante
    return startOfWeek(today, { weekStartsOn: 1 });
  };
  
  // État pour la navigation entre les onglets (démarrer sur le calendrier)
  const [activeTab, setActiveTab] = useState("calendar");
  
  // État pour la semaine actuelle
  const [currentWeek, setCurrentWeek] = useState(getInitialDate());
  
  // États pour les modales
  const [isSessionFormOpen, setIsSessionFormOpen] = useState(false);
  const [isRCDModalOpen, setIsRCDModalOpen] = useState(false);
  const [isDevoirsFaitsModalOpen, setIsDevoirsFaitsModalOpen] = useState(false);
  const [isAutreModalOpen, setIsAutreModalOpen] = useState(false);
  const [isClassSelectorOpen, setIsClassSelectorOpen] = useState(false);
  const [isClassSelectorModalOpen, setIsClassSelectorModalOpen] = useState(false);
  
  // État pour stocker les détails du créneau sélectionné
  const [selectedSlot, setSelectedSlot] = useState<{
    date: Date;
    timeSlot: string;
  } | null>(null);
  
  // État pour les formulaires
  const [sessionType, setSessionType] = useState<'RCD' | 'DEVOIRS_FAITS' | 'AUTRE'>('RCD');
  const [rcdForm, setRCDForm] = useState({
    className: '',
    replacedTeacherPrefix: 'M.',
    replacedTeacherLastName: '',
    replacedTeacherFirstName: '',
  });
  // Structure pour les élèves avec des champs séparés
  type Student = {
    lastName: string;
    firstName: string;
    className: string;
  };
  
  const [devoirsFaitsForm, setDevoirsFaitsForm] = useState({
    studentCount: 1,
    studentsList: [] as Student[],
    hasAttachment: false,
    attachmentType: null as 'excel' | 'pdf' | 'image' | null
  });
  const [autreForm, setAutreForm] = useState({
    description: ''
  });
  
  // Fonctions pour la navigation des semaines
  const goToPreviousWeek = () => {
    // Pour déboguer: afficher l'état actuel
    console.log("AVANT NAVIGATION - Semaine actuelle:", format(currentWeek, 'yyyy-MM-dd'));
    
    // Calculer le lundi de la semaine
    const currentMonday = startOfWeek(currentWeek, { weekStartsOn: 1 });
    // Reculer d'une semaine entière
    const previousMonday = subDays(currentMonday, 7);
    
    console.log("Navigation vers la semaine précédente:", format(previousMonday, 'yyyy-MM-dd'));
    // Mettre à jour l'état
    setCurrentWeek(previousMonday);
  };
  
  const goToNextWeek = () => {
    // Pour déboguer: afficher l'état actuel
    console.log("AVANT NAVIGATION - Semaine actuelle:", format(currentWeek, 'yyyy-MM-dd'));
    
    // Calculer le lundi de la semaine
    const currentMonday = startOfWeek(currentWeek, { weekStartsOn: 1 });
    // Avancer d'une semaine entière
    const nextMonday = addDays(currentMonday, 7);
    
    console.log("Navigation vers la semaine suivante:", format(nextMonday, 'yyyy-MM-dd'));
    // Mettre à jour l'état
    setCurrentWeek(nextMonday);
  };
  
  const goToToday = () => {
    setCurrentWeek(getInitialDate());
  };
  
  // Générer les jours à afficher en fonction du contexte (avec forçage du recalcul)
  const generateWeekDays = () => {
    console.log("🔄 Génération des jours, currentWeek =", format(currentWeek, 'yyyy-MM-dd'));
    
    // Récupérer le jour actuel pour les logs de test
    const todayCurrent = new Date();
    const todayDayOfWeek = todayCurrent.getDay(); // 0 = dimanche, 6 = samedi
    
    // Vérifier si aujourd'hui est un weekend (pour la vue spéciale du pont)
    const isWeekend = todayDayOfWeek === 0 || todayDayOfWeek === 6;
    const isSameDay = format(today, 'yyyy-MM-dd') === format(todayCurrent, 'yyyy-MM-dd');
    
    // Si on est actuellement sur la date d'aujourd'hui et que c'est le weekend
    if (isWeekend && isSameDay && currentWeek.getTime() === today.getTime()) {
      console.log("📅 Mode vue pont (weekend)");
      // Détermine le jour de départ pour la semaine (vue pont)
      let startingDay;
      if (todayDayOfWeek === 6) { // Samedi
        // Afficher du jeudi précédent au lundi suivant
        startingDay = addDays(todayCurrent, -2); // Jeudi (samedi - 2 jours)
      } else { // Dimanche
        // Afficher du vendredi précédent au mardi suivant
        startingDay = addDays(todayCurrent, -2); // Vendredi (dimanche - 2 jours)
      }
      
      // Réinitialiser à minuit
      const midnight = set(startingDay, { 
        hours: 0, minutes: 0, seconds: 0, milliseconds: 0
      });
      
      console.log("📅 Premier jour de la vue pont:", format(midnight, 'yyyy-MM-dd'));
      
      const days = [];
      for (let i = 0; i < 5; i++) { // 5 jours à partir du jour de départ
        const day = addDays(midnight, i);
        days.push(day);
        console.log(`📅 Jour ${i+1} de la vue pont:`, format(day, 'yyyy-MM-dd'));
      }
      return days;
    } else {
      console.log("📅 Mode vue semaine standard");
      // Pour toute autre vue de navigation, afficher simplement la semaine à partir de currentWeek
      const firstDay = startOfWeek(currentWeek, { weekStartsOn: 1 });
      
      // Réinitialiser à minuit
      const mondayMidnight = set(firstDay, { 
        hours: 0, minutes: 0, seconds: 0, milliseconds: 0
      });
      
      console.log("📅 Premier jour de la semaine:", format(mondayMidnight, 'yyyy-MM-dd'));
      
      const days = [];
      for (let i = 0; i < 5; i++) { // Lundi à vendredi (5 jours)
        // Utiliser addDays pour éviter de modifier l'objet original
        const day = addDays(mondayMidnight, i);
        days.push(day);
        console.log(`📅 Jour ${i+1} de la semaine:`, format(day, 'yyyy-MM-dd'));
      }
      return days;
    }
  };
  
  // Fonction isToday déjà importée de date-fns à la ligne 3
  
  // Obtenir les créneaux horaires
  const getTimeSlots = () => {
    return [
      { id: 'M1', label: '', morning: true },
      { id: 'M2', label: '', morning: true },
      { id: 'M3', label: '', morning: true },
      { id: 'M4', label: '', morning: true },
      { id: 'S1', label: '', morning: false },
      { id: 'S2', label: '', morning: false },
      { id: 'S3', label: '', morning: false },
      { id: 'S4', label: '', morning: false },
    ];
  };
  
  // Vérifier si une session est pour un jour et créneau donnés
  const getSessionsForDay = (date: Date, timeSlot?: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    console.log("Recherche de sessions pour", dateStr, timeSlot);
    console.log("Sessions disponibles:", sessions);
    
    const filteredSessions = sessions.filter(session => {
      console.log("Comparaison:", session.date, dateStr, session.date === dateStr);
      return session.date === dateStr && (!timeSlot || session.timeSlot === timeSlot);
    });
    
    console.log("Sessions filtrées:", filteredSessions);
    return filteredSessions;
  };
  
  // Fonction pour ouvrir la modale en fonction du type de séance
  const openSessionModal = (type: 'RCD' | 'DEVOIRS_FAITS' | 'AUTRE') => {
    setSessionType(type);
    if (type === 'RCD') {
      setIsRCDModalOpen(true);
    } else if (type === 'DEVOIRS_FAITS') {
      setIsDevoirsFaitsModalOpen(true);
    } else {
      setIsAutreModalOpen(true);
    }
  };
  
  // Fonction pour ouvrir le formulaire de sélection du type de séance
  const openSessionForm = (date?: Date, timeSlot?: string) => {
    if (date && timeSlot) {
      setSelectedSlot({ date, timeSlot });
    } else {
      setSelectedSlot(null);
    }
    setIsSessionFormOpen(true);
  };
  
  // Fonction pour gérer la sélection d'un créneau
  const handleSlotClick = (day: number, slot: string) => {
    const date = new Date(currentWeek);
    date.setDate(date.getDate() + day);
    openSessionForm(date, slot);
  };
  
  // Fonction pour ouvrir le sélecteur de classe pour RCD
  const openClassSelector = () => {
    setIsClassSelectorOpen(true);
  };
  
  // Fonction pour ouvrir le sélecteur de classe pour Devoirs Faits
  const openClassSelectorModal = () => {
    setIsClassSelectorModalOpen(true);
  };
  
  // Fonction pour gérer la sélection d'une classe pour RCD
  const handleClassSelection = (className: string) => {
    if (isClassSelectorOpen) {
      setRCDForm({...rcdForm, className});
      setIsClassSelectorOpen(false);
    } else if (isClassSelectorModalOpen) {
      setIsClassSelectorModalOpen(false);
    }
  };
  
  // Fonction pour sélectionner "Classe prise en charge"
  const handleGenericClassSelection = () => {
    if (isClassSelectorOpen) {
      setRCDForm({...rcdForm, className: "Classe prise en charge"});
      setIsClassSelectorOpen(false);
    } else if (isClassSelectorModalOpen) {
      setIsClassSelectorModalOpen(false);
    }
  };
  
  // Fonction pour formater les prénoms (1ère lettre en majuscule, reste en minuscule)
  const formatFirstName = (name: string) => {
    if (!name) return '';
    // Diviser en cas de prénoms composés (séparés par espace, tiret, etc.)
    return name.split(/[\s-]+/).map(part => 
      part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    ).join(' ');
  };
  
  // Fonction pour soumettre le formulaire RCD
  const handleRCDSubmit = () => {
    // Si aucun créneau n'est sélectionné, utiliser le lundi de la semaine courante
    let dateToUse;
    if (selectedSlot) {
      dateToUse = selectedSlot.date;
    } else {
      // Utiliser le premier jour de la semaine actuellement affichée
      const weekdays = generateWeekDays();
      dateToUse = weekdays[0]; // Lundi de la semaine courante
    }
    
    const dateStr = format(dateToUse, 'yyyy-MM-dd');
    const timeSlot = selectedSlot ? selectedSlot.timeSlot : 'M1'; // Par défaut M1 si aucun créneau sélectionné
    
    console.log("Création d'une session RCD pour la date:", dateStr);
    
    // Construction du nom complet de l'enseignant remplacé
    const replacedTeacherName = rcdForm.replacedTeacherPrefix && rcdForm.replacedTeacherLastName 
      ? `${rcdForm.replacedTeacherPrefix} ${rcdForm.replacedTeacherLastName} ${rcdForm.replacedTeacherFirstName || ''}`
      : '';
    
    // Création de la nouvelle session
    const newSession = {
      id: nextId,
      type: 'RCD',
      date: dateStr,
      timeSlot: timeSlot,
      status: 'PENDING_REVIEW',
      className: rcdForm.className || '',
      replacedTeacherName: replacedTeacherName.trim(),
    };
    
    // Ajout à la liste des sessions
    setSessions(prevSessions => {
      const updatedSessions = [...prevSessions, newSession];
      console.log("Sessions après ajout:", updatedSessions);
      return updatedSessions;
    });
    
    // Incrémentation de l'ID pour la prochaine session
    setNextId(nextId + 1);
    
    // Fermeture de la modale
    setIsRCDModalOpen(false);
    
    // Réinitialisation du créneau sélectionné
    setSelectedSlot(null);
    
    // Notification à l'utilisateur
    toast({
      title: "Remplacement ajouté",
      description: `RCD pour ${rcdForm.className} ajouté avec succès.`,
    });
  };
  
  // Fonction pour soumettre le formulaire Devoirs Faits
  const handleDevoirsFaitsSubmit = () => {
    // Si aucun créneau n'est sélectionné, utiliser le lundi de la semaine courante
    let dateToUse;
    if (selectedSlot) {
      dateToUse = selectedSlot.date;
    } else {
      // Utiliser le premier jour de la semaine actuellement affichée
      const weekdays = generateWeekDays();
      dateToUse = weekdays[0]; // Lundi de la semaine courante
    }
    
    const dateStr = format(dateToUse, 'yyyy-MM-dd');
    const timeSlot = selectedSlot ? selectedSlot.timeSlot : 'M1'; // Par défaut M1 si aucun créneau sélectionné
    
    console.log("Création d'une session Devoirs Faits pour la date:", dateStr);
    
    // Création de la nouvelle session
    const newSession = {
      id: nextId,
      type: 'DEVOIRS_FAITS',
      date: dateStr,
      timeSlot: timeSlot,
      status: 'PENDING_REVIEW',
      gradeLevel: '6e', // Par défaut, peut être déterminé à partir des élèves
      studentCount: devoirsFaitsForm.studentCount || 0,
      // On pourrait aussi stocker la liste des élèves si nécessaire
    };
    
    // Ajout à la liste des sessions
    setSessions(prevSessions => {
      const updatedSessions = [...prevSessions, newSession];
      console.log("Sessions après ajout de Devoirs Faits:", updatedSessions);
      return updatedSessions;
    });
    
    // Incrémentation de l'ID pour la prochaine session
    setNextId(nextId + 1);
    
    // Fermeture de la modale
    setIsDevoirsFaitsModalOpen(false);
    
    // Réinitialisation du créneau sélectionné
    setSelectedSlot(null);
    
    // Notification à l'utilisateur
    toast({
      title: "Devoirs Faits ajouté",
      description: `Séance de Devoirs Faits ajoutée avec succès.`,
    });
  };
  
  // Fonction pour soumettre le formulaire Autre
  const handleAutreSubmit = () => {
    // Vérification que la description est bien renseignée
    if (!autreForm.description || autreForm.description.trim() === '') {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une description pour cette activité.",
        variant: "destructive",
      });
      return;
    }

    // Si aucun créneau n'est sélectionné, utiliser le lundi de la semaine courante
    let dateToUse;
    if (selectedSlot) {
      dateToUse = selectedSlot.date;
    } else {
      // Utiliser le premier jour de la semaine actuellement affichée
      const weekdays = generateWeekDays();
      dateToUse = weekdays[0]; // Lundi de la semaine courante
    }
    
    const dateStr = format(dateToUse, 'yyyy-MM-dd');
    const timeSlot = selectedSlot ? selectedSlot.timeSlot : 'M1'; // Par défaut M1 si aucun créneau sélectionné
    
    console.log("Création d'une session Autre pour la date:", dateStr);
    
    // Création de la nouvelle session
    const newSession = {
      id: nextId,
      type: 'AUTRE',
      date: dateStr,
      timeSlot: timeSlot,
      status: 'PENDING_REVIEW',
      description: autreForm.description,
    };
    
    // Ajout à la liste des sessions
    setSessions(prevSessions => {
      const updatedSessions = [...prevSessions, newSession];
      console.log("Sessions après ajout d'Autre activité:", updatedSessions);
      return updatedSessions;
    });
    
    // Incrémentation de l'ID pour la prochaine session
    setNextId(nextId + 1);
    
    // Fermeture de la modale
    setIsAutreModalOpen(false);
    
    // Réinitialisation du créneau sélectionné
    setSelectedSlot(null);
    
    // Notification à l'utilisateur
    toast({
      title: "Activité ajoutée",
      description: "Activité ajoutée avec succès.",
    });
  };
  
  // Fonction pour ajouter un élève à la liste
  const addStudent = () => {
    setDevoirsFaitsForm(prev => ({
      ...prev,
      studentsList: [...prev.studentsList, { lastName: '', firstName: '', className: '' }]
    }));
  };
  
  // Fonction pour supprimer un élève de la liste
  const removeStudent = (index: number) => {
    setDevoirsFaitsForm(prev => ({
      ...prev,
      studentsList: prev.studentsList.filter((_, i) => i !== index)
    }));
  };
  
  // Fonction pour mettre à jour un élève dans la liste
  const updateStudentField = (index: number, field: keyof Student, value: string) => {
    setDevoirsFaitsForm(prev => {
      const newList = [...prev.studentsList];
      newList[index] = { ...newList[index], [field]: value };
      return {
        ...prev,
        studentsList: newList
      };
    });
  };
  
  // Séances fictives pour la démonstration
  const [sessions, setSessions] = useState([
    {
      id: 1,
      type: 'RCD',
      date: '2025-03-05',
      timeSlot: 'M3',
      status: 'PENDING_REVIEW',
      className: '5e',
      replacedTeacherName: 'M. DUBOIS Jean',
    },
    {
      id: 2,
      type: 'DEVOIRS_FAITS',
      date: '2025-03-06',
      timeSlot: 'S2',
      status: 'VALIDATED',
      gradeLevel: '6e',
      studentCount: 15,
    },
    {
      id: 3,
      type: 'AUTRE',
      date: '2025-03-10',
      timeSlot: 'M3',
      status: 'PAID',
      description: 'Réunion de coordination pédagogique',
    }
  ]);
  
  // ID pour les nouvelles sessions (normalement géré par le backend)
  const [nextId, setNextId] = useState(4);
  
  return (
    <div className="space-y-6">
      {/* Modales pour les formulaires de séances */}
      <Dialog open={isSessionFormOpen} onOpenChange={setIsSessionFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choisir le type de séance</DialogTitle>
            <DialogDescription>
              Sélectionnez le type de séance que vous souhaitez déclarer {selectedSlot && ` pour le créneau ${selectedSlot.timeSlot} du ${format(selectedSlot.date, 'dd/MM/yyyy')}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de séance
            </label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                className={`flex items-center gap-2 bg-purple-100 text-purple-700 hover:bg-purple-200`}
                onClick={() => {
                  setSessionType('RCD');
                  setIsSessionFormOpen(false);
                  openSessionModal('RCD');
                }}
              >
                <Users className="h-4 w-4" />
                RCD
              </Button>
              <Button
                type="button"
                className={`flex items-center gap-2 bg-blue-100 text-blue-700 hover:bg-blue-200`}
                onClick={() => {
                  setSessionType('DEVOIRS_FAITS');
                  setIsSessionFormOpen(false);
                  openSessionModal('DEVOIRS_FAITS');
                }}
              >
                <BookOpen className="h-4 w-4" />
                Devoirs Faits
              </Button>
              <Button
                type="button"
                className={`flex items-center gap-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200`}
                onClick={() => {
                  setSessionType('AUTRE');
                  setIsSessionFormOpen(false);
                  openSessionModal('AUTRE');
                }}
              >
                <Clock className="h-4 w-4" />
                Autre
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSessionFormOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modale pour RCD */}
      <Dialog open={isRCDModalOpen} onOpenChange={setIsRCDModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Remplacement de Courte Durée</DialogTitle>
            <DialogDescription>
              Veuillez remplir les informations du remplacement
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Créneau horaire
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                    <Sun className="h-4 w-4" /> Matin
                  </h4>
                  <div className="grid grid-cols-2 gap-1">
                    {['M1', 'M2', 'M3', 'M4'].map((slot) => (
                      <Button
                        key={slot}
                        type="button"
                        size="sm"
                        className={`${
                          selectedSlot?.timeSlot === slot
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedSlot(prev => prev ? { ...prev, timeSlot: slot } : { date: new Date(), timeSlot: slot })}
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                    <Moon className="h-4 w-4" /> Après-midi
                  </h4>
                  <div className="grid grid-cols-2 gap-1">
                    {['S1', 'S2', 'S3', 'S4'].map((slot) => (
                      <Button
                        key={slot}
                        type="button"
                        size="sm"
                        className={`${
                          selectedSlot?.timeSlot === slot
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                        onClick={() => setSelectedSlot(prev => prev ? { ...prev, timeSlot: slot } : { date: new Date(), timeSlot: slot })}
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="classe" className="text-right">Classe</Label>
              <div className="col-span-3">
                <Button
                  type="button"
                  variant={rcdForm.className ? "default" : "outline"}
                  onClick={openClassSelector}
                  className={`w-full justify-between ${
                    rcdForm.className ? (
                      rcdForm.className.startsWith('6') ? 'bg-emerald-500 hover:bg-emerald-600 text-white' :
                      rcdForm.className.startsWith('5') ? 'bg-blue-500 hover:bg-blue-600 text-white' :
                      rcdForm.className.startsWith('4') ? 'bg-purple-500 hover:bg-purple-600 text-white' :
                      rcdForm.className.startsWith('3') ? 'bg-red-500 hover:bg-red-600 text-white' : ''
                    ) : ''
                  }`}
                >
                  <span>{rcdForm.className || "Sélectionner une classe"}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                {rcdForm.replacedTeacherPrefix === 'Mme' ? 'Enseignante remplacée' : 'Enseignant remplacé'}
              </Label>
              <div className="col-span-3 flex gap-2">
                <div className="flex gap-2 w-[80px]">
                  <Button 
                    type="button"
                    variant={rcdForm.replacedTeacherPrefix === 'M.' ? 'default' : 'outline'} 
                    onClick={() => setRCDForm({...rcdForm, replacedTeacherPrefix: 'M.'})}
                    className={`${rcdForm.replacedTeacherPrefix === 'M.' ? 'bg-blue-500 text-white' : 'text-blue-600 border-blue-300'} w-full text-xs px-1`}
                    size="sm"
                  >
                    M.
                  </Button>
                  <Button 
                    type="button"
                    variant={rcdForm.replacedTeacherPrefix === 'Mme' ? 'default' : 'outline'} 
                    onClick={() => setRCDForm({...rcdForm, replacedTeacherPrefix: 'Mme'})}
                    className={`${rcdForm.replacedTeacherPrefix === 'Mme' ? 'bg-pink-500 text-white' : 'text-pink-600 border-pink-300'} w-full text-xs px-1`}
                    size="sm"
                  >
                    Mme
                  </Button>
                </div>
                
                <Input 
                  placeholder="NOM" 
                  value={rcdForm.replacedTeacherLastName}
                  onChange={(e) => setRCDForm({...rcdForm, replacedTeacherLastName: e.target.value.toUpperCase()})}
                  className="uppercase"
                />
                
                <Input 
                  placeholder="Prénom" 
                  value={rcdForm.replacedTeacherFirstName}
                  onChange={(e) => setRCDForm({...rcdForm, replacedTeacherFirstName: formatFirstName(e.target.value)})}
                />
              </div>
            </div>
          </div>
          
          <form id="rcdForm" onSubmit={(e) => { 
            e.preventDefault(); 
            console.log("Formulaire RCD soumis via Enter");
            handleRCDSubmit(); 
          }}>
            <input type="submit" className="hidden" />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsRCDModalOpen(false)}>Fermer</Button>
              <Button type="submit">Soumettre</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Modale pour Devoirs Faits */}
      <Dialog open={isDevoirsFaitsModalOpen} onOpenChange={setIsDevoirsFaitsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Devoirs Faits</DialogTitle>
            <DialogDescription>
              Veuillez remplir les informations de la séance de Devoirs Faits
            </DialogDescription>
          </DialogHeader>
          
          <form id="devoirsFaitsForm" onSubmit={(e) => { 
            e.preventDefault(); 
            console.log("Formulaire Devoirs Faits soumis via Enter"); 
            handleDevoirsFaitsSubmit(); 
          }}>
            <input type="submit" className="hidden" />
            <div className="grid gap-4 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Créneau horaire
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                      <Sun className="h-4 w-4" /> Matin
                    </h4>
                    <div className="grid grid-cols-2 gap-1">
                      {['M1', 'M2', 'M3', 'M4'].map((slot) => (
                        <Button
                          key={slot}
                          type="button"
                          size="sm"
                          className={`${
                            selectedSlot?.timeSlot === slot
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => setSelectedSlot(prev => prev ? { ...prev, timeSlot: slot } : { date: new Date(), timeSlot: slot })}
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                      <Moon className="h-4 w-4" /> Après-midi
                    </h4>
                    <div className="grid grid-cols-2 gap-1">
                      {['S1', 'S2', 'S3', 'S4'].map((slot) => (
                        <Button
                          key={slot}
                          type="button"
                          size="sm"
                          className={`${
                            selectedSlot?.timeSlot === slot
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => setSelectedSlot(prev => prev ? { ...prev, timeSlot: slot } : { date: new Date(), timeSlot: slot })}
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              

              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nbEleves" className="text-right">Nombre d'élèves</Label>
                <Input 
                  id="nbEleves" 
                  type="number" 
                  min="1"
                  value={devoirsFaitsForm.studentCount}
                  onChange={(e) => setDevoirsFaitsForm({...devoirsFaitsForm, studentCount: parseInt(e.target.value) || 1})}
                  className="col-span-3" 
                />
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <Label className="text-right mt-2">Joindre un document</Label>
                <div className="col-span-3 space-y-2">
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="hasAttachment" 
                        checked={devoirsFaitsForm.hasAttachment}
                        onCheckedChange={(checked) => setDevoirsFaitsForm({...devoirsFaitsForm, hasAttachment: checked === true})}
                      />
                      <Label htmlFor="hasAttachment" className="font-normal">Joindre un document</Label>
                    </div>
                    
                    {devoirsFaitsForm.hasAttachment && (
                      <div className="pl-6 space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            type="button"
                            variant={devoirsFaitsForm.attachmentType === 'excel' ? "default" : "outline"}
                            className={`${devoirsFaitsForm.attachmentType === 'excel' ? "bg-green-500 hover:bg-green-600" : "hover:bg-green-50"} flex items-center gap-2`}
                            onClick={() => setDevoirsFaitsForm({...devoirsFaitsForm, attachmentType: 'excel'})}
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                            Excel
                          </Button>
                          <Button
                            type="button"
                            variant={devoirsFaitsForm.attachmentType === 'pdf' ? "default" : "outline"}
                            className={`${devoirsFaitsForm.attachmentType === 'pdf' ? "bg-red-500 hover:bg-red-600" : "hover:bg-red-50"} flex items-center gap-2`}
                            onClick={() => setDevoirsFaitsForm({...devoirsFaitsForm, attachmentType: 'pdf'})}
                          >
                            <FileText className="h-4 w-4" />
                            PDF
                          </Button>
                          <Button
                            type="button"
                            variant={devoirsFaitsForm.attachmentType === 'image' ? "default" : "outline"}
                            className={`${devoirsFaitsForm.attachmentType === 'image' ? "bg-blue-500 hover:bg-blue-600" : "hover:bg-blue-50"} flex items-center gap-2`}
                            onClick={() => setDevoirsFaitsForm({...devoirsFaitsForm, attachmentType: 'image'})}
                          >
                            <Camera className="h-4 w-4" />
                            Photo
                          </Button>
                        </div>
                        
                        {devoirsFaitsForm.attachmentType && (
                          <div className="border border-dashed border-gray-300 rounded-md p-4 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <Upload className="h-8 w-8 text-gray-400" />
                              <div className="text-sm text-gray-500">
                                {devoirsFaitsForm.attachmentType === 'excel' && "Glissez un fichier Excel ou cliquez pour parcourir"}
                                {devoirsFaitsForm.attachmentType === 'pdf' && "Glissez un fichier PDF ou cliquez pour parcourir"}
                                {devoirsFaitsForm.attachmentType === 'image' && "Prenez une photo ou sélectionnez une image"}
                              </div>
                              <Button 
                                type="button" 
                                variant="secondary" 
                                size="sm" 
                                className="mt-2"
                              >
                                {devoirsFaitsForm.attachmentType === 'image' ? 'Prendre une photo' : 'Parcourir...'}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <Label className="text-right mt-2">Liste des élèves</Label>
                <div className="col-span-3 space-y-2">
                  {devoirsFaitsForm.studentsList.map((student, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <Input 
                          value={student.lastName}
                          onChange={(e) => updateStudentField(index, 'lastName', e.target.value.toUpperCase())}
                          placeholder="NOM" 
                          className="uppercase"
                        />
                        <Input 
                          value={student.firstName}
                          onChange={(e) => updateStudentField(index, 'firstName', formatFirstName(e.target.value))}
                          placeholder="Prénom" 
                        />
                        <Input 
                          value={student.className}
                          onChange={(e) => updateStudentField(index, 'className', e.target.value)}
                          placeholder="CLASSE" 
                        />
                      </div>
                      <Button 
                        type="button"
                        variant="destructive" 
                        size="icon"
                        onClick={() => removeStudent(index)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </Button>
                    </div>
                  ))}
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={addStudent}
                    className="w-full"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Ajouter un élève
                  </Button>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDevoirsFaitsModalOpen(false)}>Fermer</Button>
              <Button type="submit">
                Soumettre
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Modale pour sélection de classe (RCD) */}
      <Dialog open={isClassSelectorOpen} onOpenChange={setIsClassSelectorOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Sélection de la classe</DialogTitle>
            <DialogDescription>
              Veuillez sélectionner le niveau et la classe
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* Option "Classe prise en charge" */}
            <div>
              <Button
                variant="default"
                onClick={handleGenericClassSelection}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white"
              >
                Classe prise en charge
              </Button>
            </div>
            
            {/* 6ème */}
            <div>
              <h3 className="font-medium text-base mb-2 px-2 py-1 bg-emerald-100 text-emerald-800 rounded">6ème</h3>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {['A', 'B', 'C', 'D'].map(classLetter => (
                  <Button
                    key={`6${classLetter}`}
                    variant="outline"
                    onClick={() => handleClassSelection(`6${classLetter}`)}
                    className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                  >
                    {classLetter}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* 5ème */}
            <div>
              <h3 className="font-medium text-base mb-2 px-2 py-1 bg-blue-100 text-blue-800 rounded">5ème</h3>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {['A', 'B', 'C', 'D'].map(classLetter => (
                  <Button
                    key={`5${classLetter}`}
                    variant="outline"
                    onClick={() => handleClassSelection(`5${classLetter}`)}
                    className="text-blue-700 border-blue-300 hover:bg-blue-50"
                  >
                    {classLetter}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* 4ème */}
            <div>
              <h3 className="font-medium text-base mb-2 px-2 py-1 bg-purple-100 text-purple-800 rounded">4ème</h3>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {['A', 'B', 'C', 'D'].map(classLetter => (
                  <Button
                    key={`4${classLetter}`}
                    variant="outline"
                    onClick={() => handleClassSelection(`4${classLetter}`)}
                    className="text-purple-700 border-purple-300 hover:bg-purple-50"
                  >
                    {classLetter}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* 3ème */}
            <div>
              <h3 className="font-medium text-base mb-2 px-2 py-1 bg-red-100 text-red-800 rounded">3ème</h3>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {['A', 'B', 'C', 'D'].map(classLetter => (
                  <Button
                    key={`3${classLetter}`}
                    variant="outline"
                    onClick={() => handleClassSelection(`3${classLetter}`)}
                    className="text-red-700 border-red-300 hover:bg-red-50"
                  >
                    {classLetter}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsClassSelectorOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modale pour sélection de classe (Devoirs Faits) */}
      <Dialog open={isClassSelectorModalOpen} onOpenChange={setIsClassSelectorModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Sélection de la classe</DialogTitle>
            <DialogDescription>
              Veuillez sélectionner le niveau et la classe
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* Option "Classe prise en charge" */}
            <div>
              <Button
                variant="default"
                onClick={handleGenericClassSelection}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white"
              >
                Classe prise en charge
              </Button>
            </div>
            
            {/* 6ème */}
            <div>
              <h3 className="font-medium text-base mb-2 px-2 py-1 bg-emerald-100 text-emerald-800 rounded">6ème</h3>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {['A', 'B', 'C', 'D'].map(classLetter => (
                  <Button
                    key={`6${classLetter}`}
                    variant="outline"
                    onClick={() => handleClassSelection(`6${classLetter}`)}
                    className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                  >
                    {classLetter}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* 5ème */}
            <div>
              <h3 className="font-medium text-base mb-2 px-2 py-1 bg-blue-100 text-blue-800 rounded">5ème</h3>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {['A', 'B', 'C', 'D'].map(classLetter => (
                  <Button
                    key={`5${classLetter}`}
                    variant="outline"
                    onClick={() => handleClassSelection(`5${classLetter}`)}
                    className="text-blue-700 border-blue-300 hover:bg-blue-50"
                  >
                    {classLetter}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* 4ème */}
            <div>
              <h3 className="font-medium text-base mb-2 px-2 py-1 bg-purple-100 text-purple-800 rounded">4ème</h3>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {['A', 'B', 'C', 'D'].map(classLetter => (
                  <Button
                    key={`4${classLetter}`}
                    variant="outline"
                    onClick={() => handleClassSelection(`4${classLetter}`)}
                    className="text-purple-700 border-purple-300 hover:bg-purple-50"
                  >
                    {classLetter}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* 3ème */}
            <div>
              <h3 className="font-medium text-base mb-2 px-2 py-1 bg-red-100 text-red-800 rounded">3ème</h3>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {['A', 'B', 'C', 'D'].map(classLetter => (
                  <Button
                    key={`3${classLetter}`}
                    variant="outline"
                    onClick={() => handleClassSelection(`3${classLetter}`)}
                    className="text-red-700 border-red-300 hover:bg-red-50"
                  >
                    {classLetter}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsClassSelectorModalOpen(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modale pour Autre */}
      <Dialog open={isAutreModalOpen} onOpenChange={setIsAutreModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Autre activité</DialogTitle>
            <DialogDescription>
              Veuillez décrire l'activité réalisée
            </DialogDescription>
          </DialogHeader>
          
          <form id="autreForm" onSubmit={(e) => { 
            e.preventDefault(); 
            console.log("Formulaire Autre soumis via Enter");
            handleAutreSubmit(); 
          }}>
            <input type="submit" className="hidden" />
            <div className="grid gap-4 py-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Créneau horaire
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                      <Sun className="h-4 w-4" /> Matin
                    </h4>
                    <div className="grid grid-cols-2 gap-1">
                      {['M1', 'M2', 'M3', 'M4'].map((slot) => (
                        <Button
                          key={slot}
                          type="button"
                          size="sm"
                          className={`${
                            selectedSlot?.timeSlot === slot
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => setSelectedSlot(prev => prev ? { ...prev, timeSlot: slot } : { date: new Date(), timeSlot: slot })}
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                      <Moon className="h-4 w-4" /> Après-midi
                    </h4>
                    <div className="grid grid-cols-2 gap-1">
                      {['S1', 'S2', 'S3', 'S4'].map((slot) => (
                        <Button
                          key={slot}
                          type="button"
                          size="sm"
                          className={`${
                            selectedSlot?.timeSlot === slot
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                          onClick={() => setSelectedSlot(prev => prev ? { ...prev, timeSlot: slot } : { date: new Date(), timeSlot: slot })}
                        >
                          {slot}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Description</Label>
                <Textarea 
                  id="description" 
                  value={autreForm.description}
                  onChange={(e) => setAutreForm({...autreForm, description: e.target.value})}
                  className={`col-span-3 ${!autreForm.description ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`} 
                  placeholder="Description de l'activité (obligatoire)"
                  rows={4}
                  required
                />
                {!autreForm.description && (
                  <div className="col-span-4 text-sm text-red-500 mt-1">
                    Une description est requise pour ce type d'activité
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAutreModalOpen(false)}>Fermer</Button>
              <Button type="submit">Soumettre</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    
      {/* Navigation principale */}
      <div className="bg-white p-4 rounded-lg shadow">
        <Tabs 
          defaultValue={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="flex justify-between w-full">
            <TabsTrigger value="dashboard" className="flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              Tableau de bord
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Déclarer des heures
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8v4l3 3"></path>
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
              Historique
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                {/* Bouton pour basculer entre enseignant dans le pacte et hors pacte (pour la démo) */}
                <div className="flex justify-end mb-4">
                  <div className="bg-gray-100 p-1 rounded-lg inline-flex items-center">
                    <Button 
                      variant={hasPacte ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setHasPacte(true)}
                      className={`mr-1 ${hasPacte ? "bg-blue-500" : ""}`}
                    >
                      Enseignant Pacte
                    </Button>
                    <Button 
                      variant={!hasPacte ? "default" : "outline"} 
                      size="sm" 
                      onClick={() => setHasPacte(false)}
                      className={`${!hasPacte ? "bg-blue-500" : ""}`}
                    >
                      Enseignant Hors Pacte
                    </Button>
                  </div>
                </div>
              
                {hasPacte ? (
                  <>
                    <h3 className="text-lg font-semibold mb-4">Suivi des heures du pacte</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total: {completedHours.rcd + completedHours.devoirsFaits + completedHours.autres} / {totalHours.total} heures</span>
                        <span className="text-sm font-medium">{Math.round(((completedHours.rcd + completedHours.devoirsFaits + completedHours.autres) / totalHours.total) * 100)}%</span>
                      </div>
                      <Progress value={((completedHours.rcd + completedHours.devoirsFaits + completedHours.autres) / totalHours.total) * 100} className="h-2" />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <Card className="bg-purple-50">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium">RCD</h4>
                              <Badge variant="outline" className="bg-purple-100">{completedHours.rcd} / {totalHours.rcd} h</Badge>
                            </div>
                            <Progress value={(completedHours.rcd / totalHours.rcd) * 100} className="h-2 mt-2" />
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-blue-50">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium">Devoirs Faits</h4>
                              <Badge variant="outline" className="bg-blue-100">{completedHours.devoirsFaits} / {totalHours.devoirsFaits} h</Badge>
                            </div>
                            <Progress value={(completedHours.devoirsFaits / totalHours.devoirsFaits) * 100} className="h-2 mt-2" />
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-amber-50">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium">Autres</h4>
                              <Badge variant="outline" className="bg-amber-100">{completedHours.autres} h</Badge>
                            </div>
                            <Progress value={100} className="h-2 mt-2" />
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold mb-4">Synthèse de mes heures supplémentaires</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-purple-50 hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium">RCD</h4>
                              <Badge variant="outline" className="bg-purple-100">{completedHours.rcd} h</Badge>
                            </div>
                            <div className="mt-3 text-sm text-gray-600">
                              Dernière session: <span className="font-medium">05/03/2025</span>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-blue-50 hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium">Devoirs Faits</h4>
                              <Badge variant="outline" className="bg-blue-100">{completedHours.devoirsFaits} h</Badge>
                            </div>
                            <div className="mt-3 text-sm text-gray-600">
                              Dernière session: <span className="font-medium">06/03/2025</span>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card className="bg-amber-50 hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center">
                              <h4 className="font-medium">Autres</h4>
                              <Badge variant="outline" className="bg-amber-100">{completedHours.autres} h</Badge>
                            </div>
                            <div className="mt-3 text-sm text-gray-600">
                              Dernière session: <span className="font-medium">10/03/2025</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg mt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-blue-800">Total des heures</h3>
                            <p className="text-sm text-blue-600 mt-1">Toutes activités confondues</p>
                          </div>
                          <Badge className="bg-blue-200 text-blue-800 text-lg px-3 py-1">
                            {completedHours.rcd + completedHours.devoirsFaits + completedHours.autres} h
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Séances récentes</h3>
                {sessions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sessions.slice(0, 5).map((session) => (
                          <TableRow key={session.id}>
                            <TableCell>{session.date}</TableCell>
                            <TableCell>{session.type}</TableCell>
                            <TableCell>
                              <Badge className={
                                session.status === 'VALIDATED' ? 'bg-green-100 text-green-800' :
                                session.status === 'PENDING_REVIEW' ? 'bg-amber-100 text-amber-800' :
                                session.status === 'PENDING_VALIDATION' ? 'bg-blue-100 text-blue-800' :
                                session.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                session.status === 'PAID' ? 'bg-purple-100 text-purple-800' : ''
                              }>
                                {session.status === 'VALIDATED' ? 'Validée' :
                                session.status === 'PENDING_REVIEW' ? 'En attente' :
                                session.status === 'PENDING_VALIDATION' ? 'À valider' :
                                session.status === 'REJECTED' ? 'Rejetée' :
                                session.status === 'PAID' ? 'Payée' : session.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Aucune séance récente
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="calendar">
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow p-6">
                {/* Navigation du calendrier et boutons */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </Button>
                    <div className="text-lg font-semibold">
                      {format(currentWeek, 'MMMM yyyy', { locale: fr })}
                      <div className="text-sm text-muted-foreground">
                        {generateWeekDays().length > 0 && 
                          (dayOfWeek === 0 || dayOfWeek === 6) 
                            ? `Du ${format(generateWeekDays()[0], 'd')} au ${format(generateWeekDays()[4], 'd MMMM', { locale: fr })}`
                            : `Semaine du ${format(generateWeekDays()[0], 'd')} au ${format(generateWeekDays()[4], 'd MMMM', { locale: fr })}`
                        }
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={goToNextWeek}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={goToToday}>
                      Aujourd'hui
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => openSessionForm()}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      Ajouter
                    </Button>
                  </div>
                </div>
              
                {/* Grille des jours et créneaux */}
                <div className="mb-6 bg-white shadow rounded-lg overflow-hidden border">
                  {/* En-têtes des jours */}
                  <div className="grid grid-cols-6 border-b">
                    <div className="p-2 text-center font-medium border-r"></div>
                    {generateWeekDays().map((day, index) => (
                      <div 
                        key={index} 
                        className={`p-2 text-center font-medium ${isToday(day) ? 'bg-blue-100 border-b-2 border-blue-500' : ''}`}
                      >
                        <div className="text-xs uppercase">{format(day, 'EEEE', { locale: fr })}</div>
                        <div className="text-sm font-bold">{format(day, 'd', { locale: fr })}</div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Grille des créneaux */}
                  <div className="divide-y">
                    {getTimeSlots().map((slot, slotIndex) => (
                      <div key={slotIndex} className={`grid grid-cols-6 ${slotIndex === 4 ? 'border-t-4 border-gray-200' : ''}`}>
                        <div className={`p-2 text-center border-r ${slot.morning ? 'bg-blue-50' : 'bg-amber-50'}`}>
                          <div className="font-medium">{slot.id}</div>
                        </div>
                        
                        {generateWeekDays().map((day, dayIndex) => {
                          const sessionsForSlot = getSessionsForDay(day, slot.id);
                          
                          return (
                            <div 
                              key={dayIndex} 
                              className={`p-1 min-h-[60px] border-r last:border-r-0 relative ${isToday(day) ? 'bg-blue-100/40 border-l-2 border-blue-500' : ''}`}
                              onClick={() => openSessionForm(day, slot.id)}
                            >
                              {sessionsForSlot.length > 0 ? (
                                <div className="space-y-1">
                                  {sessionsForSlot.map((session, sessionIndex) => (
                                    <div 
                                      key={sessionIndex} 
                                      className={`p-1 rounded text-xs cursor-pointer ${
                                        session.type === 'RCD' ? 'bg-purple-600 text-white' : 
                                        session.type === 'DEVOIRS_FAITS' ? 'bg-blue-600 text-white' : 
                                        'bg-amber-500 text-white'
                                      }`}
                                    >
                                      {session.type === 'RCD' && (
                                        <div>
                                          <div className="font-medium">RCD - {session.className}</div>
                                          <div className="truncate">{session.replacedTeacherName}</div>
                                        </div>
                                      )}
                                      {session.type === 'DEVOIRS_FAITS' && (
                                        <div>
                                          <div className="font-medium">Devoirs Faits</div>
                                          <div>{session.studentCount} élèves</div>
                                        </div>
                                      )}
                                      {session.type === 'AUTRE' && (
                                        <div>
                                          <div className="font-medium">Autre</div>
                                          <div className="truncate">{session.description}</div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex items-center justify-center h-full opacity-0 hover:opacity-100 transition-opacity">
                                  <Button variant="ghost" size="sm" className="text-xs">Ajouter</Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Liste des séances */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Résumé des séances</h3>
                    <Badge variant="outline" className="text-xs">
                      {sessions.length} séance{sessions.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  {sessions.length > 0 ? (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {sessions.map(session => (
                        <div 
                          key={session.id} 
                          className="border rounded-lg p-2 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => {
                            toast({
                              title: "Fonctionnalité à venir",
                              description: "La modification de séances sera bientôt disponible"
                            });
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  className={`
                                    ${session.type === 'RCD' ? 'bg-purple-100 text-purple-800 hover:bg-purple-100' : 
                                     session.type === 'DEVOIRS_FAITS' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' : 
                                     'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'}
                                  `}
                                >
                                  {session.type === 'RCD' ? 'RCD' :
                                   session.type === 'DEVOIRS_FAITS' ? 'Devoirs Faits' : 'Autre'}
                                </Badge>
                                <div className="text-sm font-medium">
                                  {session.type === 'RCD' ? `Classe ${session.className}` :
                                   session.type === 'DEVOIRS_FAITS' ? `${session.studentCount} élèves` :
                                   session.description ? (session.description.substring(0, 30) + (session.description.length > 30 ? '...' : '')) : ''}
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {new Date(session.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} - Créneau {session.timeSlot}
                                {session.type === 'RCD' && session.replacedTeacherName && (
                                  <span className="ml-2">| {session.replacedTeacherName}</span>
                                )}
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`
                                ${session.status === 'PENDING_REVIEW' ? 'border-orange-200 text-orange-600' : 
                                 session.status === 'VALIDATED' ? 'border-green-200 text-green-600' : 
                                 'border-blue-200 text-blue-600'}
                              `}
                            >
                              {session.status === 'PENDING_REVIEW' ? 'En attente' :
                               session.status === 'VALIDATED' ? 'Validé' : 'Payé'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 border rounded-lg">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                      </div>
                      <h3 className="text-sm font-medium">Aucune séance pour cette semaine</h3>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="history">
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Historique des séances</h3>
                
                {sessions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Créneau</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Détails</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sessions.map((session) => (
                          <TableRow key={session.id}>
                            <TableCell>{session.date}</TableCell>
                            <TableCell>{session.timeSlot}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={
                                session.type === 'RCD' ? 'bg-purple-100 text-purple-800' :
                                session.type === 'DEVOIRS_FAITS' ? 'bg-blue-100 text-blue-800' :
                                'bg-amber-100 text-amber-800'
                              }>
                                {session.type === 'RCD' ? 'RCD' :
                                  session.type === 'DEVOIRS_FAITS' ? 'Devoirs Faits' : 'Autre'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {session.type === 'RCD' && session.className && (
                                <span>Classe {session.className}</span>
                              )}
                              {session.type === 'DEVOIRS_FAITS' && (
                                <span>{session.studentCount} élèves</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                session.status === 'VALIDATED' ? 'bg-green-100 text-green-800' :
                                session.status === 'PENDING_REVIEW' ? 'bg-amber-100 text-amber-800' :
                                session.status === 'PENDING_VALIDATION' ? 'bg-blue-100 text-blue-800' :
                                session.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                session.status === 'PAID' ? 'bg-purple-100 text-purple-800' : ''
                              }>
                                {session.status === 'VALIDATED' ? 'Validée' :
                                session.status === 'PENDING_REVIEW' ? 'En attente' :
                                session.status === 'PENDING_VALIDATION' ? 'À valider' :
                                session.status === 'REJECTED' ? 'Rejetée' :
                                session.status === 'PAID' ? 'Payée' : session.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="1" />
                                  <circle cx="19" cy="12" r="1" />
                                  <circle cx="5" cy="12" r="1" />
                                </svg>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Aucune séance enregistrée
                  </div>
                )}
                
                <div className="mt-6 flex justify-end space-x-4">
                  <Button variant="outline" onClick={() => alert("Fonctionnalité de signature électronique à implémenter")}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                    </svg>
                    Signer les séances
                  </Button>
                  <Button variant="outline" onClick={() => alert("Fonctionnalité d'export PDF à implémenter")}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                    </svg>
                    Exporter en PDF
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}