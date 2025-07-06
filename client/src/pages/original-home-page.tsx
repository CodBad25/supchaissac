import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { format, addWeeks, subWeeks, isToday, parseISO, isAfter, isBefore, set } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Types pour le formulaire de séance
type SessionFormData = {
  type: 'DEVOIRS_FAITS' | 'RCD' | 'AUTRE';
  date: string;
  timeSlot: string;
  duration: string;
  // Champs pour RCD
  replacedTeacherPrefix?: 'M.' | 'Mme';
  replacedTeacherLastName?: string;
  replacedTeacherFirstName?: string;
  className?: string;
  // Champs pour AUTRE
  description?: string;
  // Champs pour DEVOIRS_FAITS
  studentsList: string[];
  attachments?: File[];
  hasAttachment?: boolean;
};

export default function OriginalHomePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("calendar");
  const [hasPacte, setHasPacte] = useState(true);
  const [totalHours, setTotalHours] = useState({ total: 36, rcd: 15, devoirsFaits: 21 });
  const [completedHours, setCompletedHours] = useState({ rcd: 8, devoirsFaits: 12, autres: 3 });
  
  // État pour le formulaire de séance
  const [isSessionFormOpen, setIsSessionFormOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [studentInput, setStudentInput] = useState('');
  
  // Fonction pour ouvrir le formulaire avec date et créneau pré-remplis
  const openSessionForm = (date?: Date, timeSlot?: string) => {
    if (date) {
      setSessionFormData({
        ...sessionFormData,
        date: dateToString(date),
        timeSlot: timeSlot || sessionFormData.timeSlot
      });
    }
    setIsSessionFormOpen(true);
  };
  
  // Fonctions pour gérer les étudiants dans les séances Devoirs Faits
  const addStudent = () => {
    if (studentInput.trim() !== '' && !sessionFormData.studentsList.includes(studentInput.trim())) {
      setSessionFormData({
        ...sessionFormData,
        studentsList: [...sessionFormData.studentsList, studentInput.trim()]
      });
      setStudentInput('');
    }
  };
  
  const removeStudent = (index: number) => {
    const newList = [...sessionFormData.studentsList];
    newList.splice(index, 1);
    setSessionFormData({
      ...sessionFormData,
      studentsList: newList
    });
  };
  
  // Gestion de la soumission du formulaire
  const handleSessionTypeChange = (type: 'RCD' | 'DEVOIRS_FAITS' | 'AUTRE') => {
    setSessionFormData({
      ...sessionFormData,
      type
    });
  };
  
  const handleSubmitSession = () => {
    // Validation simple
    if (!sessionFormData.date || !sessionFormData.timeSlot) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }
    
    // Validation spécifique au type
    if (sessionFormData.type === 'RCD' && !sessionFormData.className) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez indiquer la classe pour le RCD",
        variant: "destructive",
      });
      return;
    }
    
    if (sessionFormData.type === 'DEVOIRS_FAITS' && sessionFormData.studentsList.length === 0) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez ajouter au moins un élève pour les Devoirs Faits",
        variant: "destructive",
      });
      return;
    }
    
    if (sessionFormData.type === 'AUTRE' && !sessionFormData.description) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez fournir une description pour cette activité",
        variant: "destructive",
      });
      return;
    }
    
    // Création de la nouvelle séance (simulée)
    const newSession = {
      id: sessions.length + 1,
      type: sessionFormData.type,
      date: sessionFormData.date,
      timeSlot: sessionFormData.timeSlot,
      status: 'PENDING_REVIEW',
      ...(sessionFormData.type === 'RCD' && {
        className: sessionFormData.className,
        replacedTeacherName: `${sessionFormData.replacedTeacherPrefix || ''} ${sessionFormData.replacedTeacherLastName || ''} ${sessionFormData.replacedTeacherFirstName || ''}`.trim(),
      }),
      ...(sessionFormData.type === 'DEVOIRS_FAITS' && {
        gradeLevel: '6e', // Exemple fixe
        studentCount: sessionFormData.studentsList.length,
      }),
    };
    
    setSessions([...sessions, newSession]);
    setIsSessionFormOpen(false);
    
    toast({
      title: "Séance créée",
      description: "Votre séance a été créée avec succès",
    });
  };
  
  // Fonction pour valider la signature
  const handleConfirmSignature = () => {
    // Simuler la validation des séances en attente
    const updatedSessions = sessions.map(session => {
      if (session.status === 'PENDING_REVIEW') {
        return { ...session, status: 'PENDING_VALIDATION' };
      }
      return session;
    });
    
    setSessions(updatedSessions);
    setIsSignatureModalOpen(false);
    
    toast({
      title: "Séances signées",
      description: "Vos séances ont été signées et envoyées pour validation",
    });
  };
  
  // Fonction pour convertir une date en string formaté pour l'input date
  const dateToString = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };
  
  // État pour les séances créées
  const [sessions, setSessions] = useState<any[]>([
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
  
  // État initial du formulaire
  const initialSessionFormData: SessionFormData = {
    type: 'RCD',
    date: format(new Date(), 'yyyy-MM-dd'),
    timeSlot: 'M1',
    duration: '1h',
    replacedTeacherPrefix: 'M.',
    replacedTeacherLastName: '',
    replacedTeacherFirstName: '',
    className: '',
    description: '',
    studentsList: [],
    hasAttachment: false
  };
  
  const [sessionFormData, setSessionFormData] = useState<SessionFormData>(initialSessionFormData);
  
  // Pour la démonstration, nous allons avoir des données pour les étudiants
  const [availableStudents, setAvailableStudents] = useState([
    { id: 1, name: 'DUPONT Marie', class: '6A' },
    { id: 2, name: 'MARTIN Thomas', class: '6A' },
    { id: 3, name: 'PETIT Lucas', class: '6A' },
    { id: 4, name: 'DUBOIS Emma', class: '6A' },
    { id: 5, name: 'BERNARD Jules', class: '6A' },
    { id: 6, name: 'THOMAS Léa', class: '6A' },
    { id: 7, name: 'ROBERT Noé', class: '6B' },
    { id: 8, name: 'RICHARD Chloé', class: '6B' },
    { id: 9, name: 'PETIT Maxime', class: '6B' },
    { id: 10, name: 'DURAND Camille', class: '6B' },
  ]);
  
  // Navigation dans le calendrier
  const nextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };
  
  const previousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };
  
  const goToToday = () => {
    setCurrentWeek(new Date());
  };
  
  // Générer les jours de la semaine courante
  const generateWeekDays = () => {
    const startOfWeek = set(currentWeek, { 
      hours: 0, minutes: 0, seconds: 0, milliseconds: 0
    });
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1); // Lundi
    
    const days = [];
    for (let i = 0; i < 5; i++) { // Lundi à vendredi (5 jours)
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  };
  
  // Vérifier si une session est pour un jour donné
  const getSessionsForDay = (date: Date, timeSlot?: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const filteredSessions = sessions.filter(session => 
      session.date === dateStr && (!timeSlot || session.timeSlot === timeSlot)
    );
    return filteredSessions;
  };
  
  // Réinitialiser le formulaire
  const resetSessionForm = () => {
    setSessionFormData(initialSessionFormData);
    setStudentInput('');
  };
  
  // Ouvrir le formulaire de création de séance
  const openSessionForm = (date?: Date, timeSlot?: string) => {
    // Vérifier si le jour est un weekend (samedi ou dimanche)
    if (date) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        toast({
          title: "Action impossible",
          description: "La création de séances le weekend n'est pas autorisée.",
          variant: "destructive",
        });
        return;
      }
    }
    
    resetSessionForm();
    if (date) {
      setSessionFormData({
        ...initialSessionFormData,
        date: format(date, 'yyyy-MM-dd'),
        ...(timeSlot && { timeSlot })
      });
    }
    setIsSessionFormOpen(true);
  };
  
  // Changer le type de séance
  const handleSessionTypeChange = (type: 'DEVOIRS_FAITS' | 'RCD' | 'AUTRE') => {
    setSessionFormData({
      ...sessionFormData,
      type
    });
  };
  
  // Ajouter un étudiant à la liste
  const addStudent = () => {
    if (studentInput.trim()) {
      setSessionFormData({
        ...sessionFormData,
        studentsList: [...sessionFormData.studentsList, studentInput.trim()]
      });
      setStudentInput('');
    }
  };
  
  // Supprimer un étudiant de la liste
  const removeStudent = (index: number) => {
    const newList = [...sessionFormData.studentsList];
    newList.splice(index, 1);
    setSessionFormData({
      ...sessionFormData,
      studentsList: newList
    });
  };
  
  // Gérer la soumission du formulaire
  const handleSubmitSession = () => {
    // Validation de formulaire
    if (sessionFormData.type === 'DEVOIRS_FAITS' && sessionFormData.studentsList.length === 0) {
      toast({
        title: "Erreur de validation",
        description: "La liste d'élèves est obligatoire pour les séances de type Devoirs Faits.",
        variant: "destructive",
      });
      return;
    }
    
    if (sessionFormData.type === 'RCD' && 
        (!sessionFormData.className || !sessionFormData.replacedTeacherLastName)) {
      toast({
        title: "Erreur de validation",
        description: "La classe et le nom de l'enseignant remplacé sont obligatoires pour les RCD.",
        variant: "destructive",
      });
      return;
    }
    
    if (sessionFormData.type === 'AUTRE' && !sessionFormData.description) {
      toast({
        title: "Erreur de validation",
        description: "La description est obligatoire pour les séances de type 'Autre'.",
        variant: "destructive",
      });
      return;
    }
    
    // Créer un nouvel objet séance
    const newSession = {
      id: sessions.length + 1,
      type: sessionFormData.type,
      date: sessionFormData.date,
      timeSlot: sessionFormData.timeSlot,
      status: 'PENDING_REVIEW',
      ...(sessionFormData.type === 'RCD' && {
        className: sessionFormData.className,
        replacedTeacherName: `${sessionFormData.replacedTeacherPrefix} ${sessionFormData.replacedTeacherLastName}${sessionFormData.replacedTeacherFirstName ? ' ' + sessionFormData.replacedTeacherFirstName : ''}`,
      }),
      ...(sessionFormData.type === 'DEVOIRS_FAITS' && {
        gradeLevel: '6e',
        studentCount: sessionFormData.studentsList.length,
      }),
      ...(sessionFormData.type === 'AUTRE' && {
        description: sessionFormData.description,
      }),
    };
    
    // Ajouter la nouvelle séance à la liste
    setSessions([...sessions, newSession]);
    
    // Mettre à jour les heures complétées
    const hoursValue = parseInt(sessionFormData.duration.replace('h', ''), 10) || 1;
    
    if (sessionFormData.type === 'RCD') {
      setCompletedHours(prev => ({ ...prev, rcd: prev.rcd + hoursValue }));
    } else if (sessionFormData.type === 'DEVOIRS_FAITS') {
      setCompletedHours(prev => ({ ...prev, devoirsFaits: prev.devoirsFaits + hoursValue }));
    } else {
      setCompletedHours(prev => ({ ...prev, autres: prev.autres + hoursValue }));
    }
    
    // Afficher un message de succès
    toast({
      title: "Séance créée",
      description: "Votre séance a été enregistrée avec succès.",
    });
    
    // Fermer le formulaire
    setIsSessionFormOpen(false);
    resetSessionForm();
  };
  
  // Fonction pour formater l'affichage du créneau horaire
  const formatTimeSlot = (slot: string) => {
    const slots: Record<string, string> = {
      'M1': 'Matin - 8h-9h',
      'M2': 'Matin - 9h-10h',
      'M3': 'Matin - 10h-11h',
      'M4': 'Matin - 11h-12h',
      'S1': 'Après-midi - 13h-14h',
      'S2': 'Après-midi - 14h-15h',
      'S3': 'Après-midi - 15h-16h',
      'S4': 'Après-midi - 16h-17h',
    };
    return slots[slot] || slot;
  };
  
  // Fonction pour formater l'affichage du type de séance
  const formatSessionType = (type: string) => {
    const types: Record<string, string> = {
      'RCD': 'Remplacement de courte durée',
      'DEVOIRS_FAITS': 'Devoirs Faits',
      'AUTRE': 'Autre activité',
    };
    return types[type] || type;
  };
  
  // Fonction pour formater l'affichage du statut
  const formatStatus = (status: string) => {
    const statuses: Record<string, string> = {
      'PENDING_REVIEW': 'En attente de signature',
      'PENDING_VALIDATION': 'En attente de validation',
      'VALIDATED': 'Validée',
      'PAID': 'Payée',
      'REJECTED': 'Refusée',
    };
    return statuses[status] || status;
  };
  
  // Fonction pour obtenir les classes CSS de couleur en fonction du statut
  const getStatusColorClasses = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'PENDING_VALIDATION':
        return 'bg-blue-50 text-blue-800 border-blue-300';
      case 'VALIDATED':
        return 'bg-green-50 text-green-800 border-green-300';
      case 'PAID':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'REJECTED':
        return 'bg-red-50 text-red-800 border-red-300';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-300';
    }
  };
  
  // Fonction pour obtenir les classes CSS de couleur en fonction du type de séance
  const getSessionTypeColorClasses = (type: string) => {
    switch (type) {
      case 'RCD':
        return 'bg-purple-600 text-white';
      case 'DEVOIRS_FAITS':
        return 'bg-blue-600 text-white';
      case 'AUTRE':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };
  
  // Obtenir les créneaux horaires
  const getTimeSlots = () => {
    return [
      { id: 'M1', label: '8h-9h', morning: true },
      { id: 'M2', label: '9h-10h', morning: true },
      { id: 'M3', label: '10h-11h', morning: true },
      { id: 'M4', label: '11h-12h', morning: true },
      { id: 'S1', label: '13h-14h', morning: false },
      { id: 'S2', label: '14h-15h', morning: false },
      { id: 'S3', label: '15h-16h', morning: false },
      { id: 'S4', label: '16h-17h', morning: false },
    ];
  };
  
  const handleSignSessions = () => {
    setIsSignatureModalOpen(true);
  };
  
  const handleConfirmSignature = () => {
    // Mise à jour du statut des sessions
    const updatedSessions = sessions.map(s => {
      if (s.status === 'PENDING_REVIEW') {
        return { ...s, status: 'PENDING_VALIDATION' };
      }
      return s;
    });
    
    setSessions(updatedSessions);
    setIsSignatureModalOpen(false);
    
    toast({
      title: "Sessions signées",
      description: "Vos sessions ont été signées et transmises pour validation."
    });
  };
  
  // Vue du tableau de bord
  const DashboardView = () => {
    const rcdPercentage = Math.min((completedHours.rcd / totalHours.rcd) * 100, 100);
    const devoirsFaitsPercentage = Math.min((completedHours.devoirsFaits / totalHours.devoirsFaits) * 100, 100);
    const totalCompletedHours = completedHours.rcd + completedHours.devoirsFaits + completedHours.autres;
    const totalContractHours = totalHours.total;
    const totalPercentage = Math.min((totalCompletedHours / totalContractHours) * 100, 100);
    
    const hasSessionsToSign = sessions.filter(s => s.status === 'PENDING_REVIEW').length > 0;
    
    return (
      <div className="space-y-6">
        {hasSessionsToSign && (
          <Alert className="bg-amber-50 border-amber-200 mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <AlertTitle className="text-amber-800">Sessions en attente de signature</AlertTitle>
            <AlertDescription className="text-amber-700">
              Vous avez {sessions.filter(s => s.status === 'PENDING_REVIEW').length} sessions à signer.
              <Button variant="outline" className="mt-2 bg-white" onClick={handleSignSessions}>
                Signer maintenant
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Suivi des heures contrat</h3>
              <p className="text-sm text-muted-foreground mb-4">Pacte Enseignant 2024-2025</p>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Avancement global</span>
                    <span className="text-muted-foreground">{totalCompletedHours}/{totalContractHours}h ({Math.round(totalPercentage)}%)</span>
                  </div>
                  <Progress value={totalPercentage} className="h-2" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="text-purple-600 font-medium">RCD</span>
                      <span className="text-muted-foreground">{completedHours.rcd}/{totalHours.rcd}h ({Math.round(rcdPercentage)}%)</span>
                    </div>
                    <Progress value={rcdPercentage} className="h-2 bg-purple-100" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="text-blue-600 font-medium">Devoirs Faits</span>
                      <span className="text-muted-foreground">{completedHours.devoirsFaits}/{totalHours.devoirsFaits}h ({Math.round(devoirsFaitsPercentage)}%)</span>
                    </div>
                    <Progress value={devoirsFaitsPercentage} className="h-2 bg-blue-100" />
                  </div>
                </div>
                
                {completedHours.autres > 0 && (
                  <div className="pt-2">
                    <span className="text-amber-600 text-sm font-medium">Autres activités: {completedHours.autres}h</span> 
                    <span className="text-xs text-muted-foreground ml-1">(conversion par le principal)</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Sessions récentes</h3>
          
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell">Détails</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.slice(0, 5).map(session => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="font-medium">{format(parseISO(session.date), 'dd/MM/yyyy')}</div>
                      <div className="text-xs text-muted-foreground">{formatTimeSlot(session.timeSlot)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getSessionTypeColorClasses(session.type)} px-2 py-1 rounded-sm`}>
                        {session.type === 'DEVOIRS_FAITS' ? 'Devoirs Faits' : 
                         session.type === 'RCD' ? 'RCD' : 'Autre'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {session.type === 'RCD' && (
                        <span>{session.className} - {session.replacedTeacherName}</span>
                      )}
                      {session.type === 'DEVOIRS_FAITS' && (
                        <span>{session.gradeLevel} - {session.studentCount} élèves</span>
                      )}
                      {session.type === 'AUTRE' && (
                        <span>{session.description}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColorClasses(session.status)}>
                        {formatStatus(session.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  };
  
  // Vue du calendrier
  const CalendarView = () => {
    const weekDays = generateWeekDays();
    const timeSlots = getTimeSlots();
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={previousWeek}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <div className="text-lg font-semibold">
              {format(currentWeek, 'MMMM yyyy', { locale: fr })}
              <div className="text-sm text-muted-foreground">
                Semaine du {format(weekDays[0], 'd')} au {format(weekDays[4], 'd MMMM', { locale: fr })}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={nextWeek}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Aujourd'hui
          </Button>
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="grid grid-cols-6 border-b">
            <div className="p-2 text-center font-medium border-r"></div>
            {weekDays.map((day, index) => (
              <div 
                key={index} 
                className={`p-2 text-center font-medium ${isToday(day) ? 'bg-blue-50' : ''}`}
              >
                <div>{format(day, 'EEEE', { locale: fr })}</div>
                <div className="text-sm">{format(day, 'd MMMM', { locale: fr })}</div>
              </div>
            ))}
          </div>
          
          <div className="divide-y">
            {timeSlots.map((slot, slotIndex) => (
              <div key={slotIndex} className="grid grid-cols-6">
                <div className={`p-2 text-center border-r ${slot.morning ? 'bg-blue-50' : 'bg-amber-50'}`}>
                  <div className="font-medium">{slot.id}</div>
                  <div className="text-xs">{slot.label}</div>
                </div>
                
                {weekDays.map((day, dayIndex) => {
                  const sessionsForSlot = getSessionsForDay(day, slot.id);
                  
                  return (
                    <div 
                      key={dayIndex} 
                      className={`p-2 min-h-[80px] border-r last:border-r-0 relative ${isToday(day) ? 'bg-blue-50/30' : ''}`}
                      onClick={() => openSessionForm(day, slot.id)}
                    >
                      {sessionsForSlot.length > 0 ? (
                        <div className="space-y-1">
                          {sessionsForSlot.map((session, sessionIndex) => (
                            <div 
                              key={sessionIndex} 
                              className={`p-1 rounded text-xs cursor-pointer ${getSessionTypeColorClasses(session.type)}`}
                            >
                              {session.type === 'RCD' && (
                                <div>
                                  <div className="font-medium">RCD - {session.className}</div>
                                  <div className="truncate">{session.replacedTeacherName}</div>
                                </div>
                              )}
                              {session.type === 'DEVOIRS_FAITS' && (
                                <div>
                                  <div className="font-medium">Devoirs Faits - {session.gradeLevel}</div>
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
        
        <div className="text-center text-muted-foreground text-sm mt-4">
          Déclarez une nouvelle séance
        </div>
      </div>
    );
  };
  
  // Vue de l'historique
  const HistoryView = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Historique des sessions</h3>
        </div>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Détails</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map(session => (
                <TableRow key={session.id}>
                  <TableCell>
                    <div className="font-medium">{format(parseISO(session.date), 'dd/MM/yyyy')}</div>
                    <div className="text-xs text-muted-foreground">{formatTimeSlot(session.timeSlot)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getSessionTypeColorClasses(session.type)} px-2 py-1 rounded-sm`}>
                      {session.type === 'DEVOIRS_FAITS' ? 'Devoirs Faits' : 
                       session.type === 'RCD' ? 'RCD' : 'Autre'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {session.type === 'RCD' && (
                      <div>
                        <div>Classe: {session.className}</div>
                        <div className="text-sm text-muted-foreground">Remplacé: {session.replacedTeacherName}</div>
                      </div>
                    )}
                    {session.type === 'DEVOIRS_FAITS' && (
                      <div>
                        <div>Niveau: {session.gradeLevel}</div>
                        <div className="text-sm text-muted-foreground">Élèves: {session.studentCount}</div>
                      </div>
                    )}
                    {session.type === 'AUTRE' && (
                      <div>
                        <div>{session.description}</div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColorClasses(session.status)}>
                      {formatStatus(session.status)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
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
        </Tabs>
      </div>
      
      {/* Contenu en fonction de l'onglet actif */}
      <TabsContent value="dashboard" className="m-0">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Suivi des heures du pacte</h3>
            {hasPacte ? (
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
                      <Progress value={(completedHours.rcd / totalHours.rcd) * 100} className="h-2 mt-2 bg-purple-200" indicatorClassName="bg-purple-500" />
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-blue-50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Devoirs Faits</h4>
                        <Badge variant="outline" className="bg-blue-100">{completedHours.devoirsFaits} / {totalHours.devoirsFaits} h</Badge>
                      </div>
                      <Progress value={(completedHours.devoirsFaits / totalHours.devoirsFaits) * 100} className="h-2 mt-2 bg-blue-200" indicatorClassName="bg-blue-500" />
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-amber-50">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Autres</h4>
                        <Badge variant="outline" className="bg-amber-100">{completedHours.autres} h</Badge>
                      </div>
                      <Progress value={100} className="h-2 mt-2 bg-amber-200" indicatorClassName="bg-amber-500" />
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertTitle>Pacte enseignant non configuré</AlertTitle>
                <AlertDescription>
                  Vous n'avez pas encore configuré vos heures du pacte enseignant.
                </AlertDescription>
              </Alert>
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
                        <TableCell>{format(parseISO(session.date), 'dd/MM/yyyy')}</TableCell>
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
      
      <TabsContent value="calendar" className="m-0">
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <Button variant="outline" size="sm" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
                Semaine précédente
              </Button>
              
              <h3 className="text-lg font-medium">
                Semaine du {format(currentWeek, 'dd MMMM', { locale: fr })}
              </h3>
              
              <Button variant="outline" size="sm" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
                Semaine suivante
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </Button>
            </div>
            
            <div className="grid grid-cols-5 gap-4">
              {/* En-têtes des jours */}
              {Array.from({ length: 5 }).map((_, index) => {
                const date = new Date(currentWeek);
                date.setDate(currentWeek.getDate() - currentWeek.getDay() + index + 1);
                return (
                  <div key={`header-${index}`} className="text-center">
                    <div className={`mb-2 font-medium rounded-full py-1 ${isToday(date) ? 'bg-primary text-primary-foreground' : ''}`}>
                      {format(date, 'EEEE dd/MM', { locale: fr })}
                    </div>
                    <div className="grid grid-rows-8 gap-2">
                      {/* Créneaux du matin - bleu */}
                      {['M1', 'M2', 'M3', 'M4'].map(slot => {
                        const sessionsForSlot = sessions.filter(s => 
                          s.date === format(date, 'yyyy-MM-dd') && s.timeSlot === slot
                        );
                        return (
                          <div 
                            key={`${index}-${slot}`} 
                            className={`p-2 rounded ${sessionsForSlot.length > 0 ? 'bg-blue-100' : 'bg-blue-50'} cursor-pointer`}
                            onClick={() => openSessionForm(date, slot)}
                          >
                            <div className="text-xs font-medium">{slot}</div>
                            {sessionsForSlot.map(session => (
                              <div key={session.id} className="mt-1 p-1 rounded bg-white text-xs">
                                {session.type === 'RCD' ? `RCD - ${session.className}` : 
                                 session.type === 'DEVOIRS_FAITS' ? 'Devoirs Faits' : 'Autre'}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                      
                      {/* Créneaux de l'après-midi - ambre */}
                      {['S1', 'S2', 'S3', 'S4'].map(slot => {
                        const sessionsForSlot = sessions.filter(s => 
                          s.date === format(date, 'yyyy-MM-dd') && s.timeSlot === slot
                        );
                        return (
                          <div 
                            key={`${index}-${slot}`} 
                            className={`p-2 rounded ${sessionsForSlot.length > 0 ? 'bg-amber-100' : 'bg-amber-50'} cursor-pointer`}
                            onClick={() => openSessionForm(date, slot)}
                          >
                            <div className="text-xs font-medium">{slot}</div>
                            {sessionsForSlot.map(session => (
                              <div key={session.id} className="mt-1 p-1 rounded bg-white text-xs">
                                {session.type === 'RCD' ? `RCD - ${session.className}` : 
                                 session.type === 'DEVOIRS_FAITS' ? 'Devoirs Faits' : 'Autre'}
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 flex justify-center">
              <Button onClick={() => setIsSessionFormOpen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Déclarer une nouvelle séance
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="history" className="m-0">
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
                        <TableCell>{format(parseISO(session.date), 'dd/MM/yyyy')}</TableCell>
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
                          {session.type === 'DEVOIRS_FAITS' && session.gradeLevel && (
                            <span>Niveau {session.gradeLevel} - {session.studentCount} élèves</span>
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
              <Button variant="outline" onClick={() => setIsSignatureModalOpen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
                </svg>
                Signer les séances
              </Button>
              <Button variant="outline">
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
      
      {/* Modal pour la création de session */}
      <Dialog open={isSessionFormOpen} onOpenChange={setIsSessionFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle séance</DialogTitle>
            <DialogDescription>
              Remplissez les informations pour déclarer une nouvelle séance
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Type de séance</Label>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={sessionFormData.type === 'RCD' ? 'default' : 'outline'} 
                  className={sessionFormData.type === 'RCD' ? 'bg-purple-600' : ''}
                  onClick={() => handleSessionTypeChange('RCD')}
                >
                  RCD
                </Button>
                <Button 
                  variant={sessionFormData.type === 'DEVOIRS_FAITS' ? 'default' : 'outline'} 
                  className={sessionFormData.type === 'DEVOIRS_FAITS' ? 'bg-blue-600' : ''}
                  onClick={() => handleSessionTypeChange('DEVOIRS_FAITS')}
                >
                  Devoirs Faits
                </Button>
                <Button 
                  variant={sessionFormData.type === 'AUTRE' ? 'default' : 'outline'} 
                  className={sessionFormData.type === 'AUTRE' ? 'bg-amber-500' : ''}
                  onClick={() => handleSessionTypeChange('AUTRE')}
                >
                  Autre
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date <span className="text-red-500">*</span></Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={sessionFormData.date}
                  onChange={(e) => setSessionFormData({...sessionFormData, date: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timeSlot">Créneau horaire <span className="text-red-500">*</span></Label>
                <Select 
                  value={sessionFormData.timeSlot} 
                  onValueChange={(value) => setSessionFormData({...sessionFormData, timeSlot: value})}
                >
                  <SelectTrigger id="timeSlot">
                    <SelectValue placeholder="Sélectionner un créneau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M1">Matin - 8h-9h (M1)</SelectItem>
                    <SelectItem value="M2">Matin - 9h-10h (M2)</SelectItem>
                    <SelectItem value="M3">Matin - 10h-11h (M3)</SelectItem>
                    <SelectItem value="M4">Matin - 11h-12h (M4)</SelectItem>
                    <SelectItem value="S1">Après-midi - 13h-14h (S1)</SelectItem>
                    <SelectItem value="S2">Après-midi - 14h-15h (S2)</SelectItem>
                    <SelectItem value="S3">Après-midi - 15h-16h (S3)</SelectItem>
                    <SelectItem value="S4">Après-midi - 16h-17h (S4)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Durée</Label>
              <Select 
                value={sessionFormData.duration} 
                onValueChange={(value) => setSessionFormData({...sessionFormData, duration: value})}
              >
                <SelectTrigger id="duration">
                  <SelectValue placeholder="Sélectionner une durée" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 heure</SelectItem>
                  <SelectItem value="2h">2 heures</SelectItem>
                  <SelectItem value="3h">3 heures</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Champs spécifiques au type de séance */}
            {sessionFormData.type === 'RCD' && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Détails du remplacement</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="className">Classe <span className="text-red-500">*</span></Label>
                  <Input 
                    id="className" 
                    placeholder="Ex: 5A" 
                    value={sessionFormData.className || ''}
                    onChange={(e) => setSessionFormData({...sessionFormData, className: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Enseignant remplacé</Label>
                  <div className="flex space-x-2">
                    <Select 
                      value={sessionFormData.replacedTeacherPrefix} 
                      onValueChange={(value: 'M.' | 'Mme') => setSessionFormData({...sessionFormData, replacedTeacherPrefix: value})}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="Civilité" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M.">M.</SelectItem>
                        <SelectItem value="Mme">Mme</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Input 
                      placeholder="NOM" 
                      value={sessionFormData.replacedTeacherLastName || ''} 
                      onChange={(e) => setSessionFormData({...sessionFormData, replacedTeacherLastName: e.target.value.toUpperCase()})}
                      className="uppercase"
                    />
                    
                    <Input 
                      placeholder="Prénom" 
                      value={sessionFormData.replacedTeacherFirstName || ''} 
                      onChange={(e) => setSessionFormData({...sessionFormData, replacedTeacherFirstName: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {sessionFormData.type === 'DEVOIRS_FAITS' && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Détails de la séance Devoirs Faits</h4>
                
                <div className="space-y-2">
                  <Label>Liste des élèves <span className="text-red-500">*</span></Label>
                  <div className="flex space-x-2">
                    <Input 
                      placeholder="Ajouter un élève" 
                      value={studentInput}
                      onChange={(e) => setStudentInput(e.target.value)}
                    />
                    <Button type="button" onClick={addStudent}>Ajouter</Button>
                  </div>
                  
                  {sessionFormData.studentsList.length > 0 && (
                    <div className="border rounded-md p-2 mt-2 space-y-1">
                      {sessionFormData.studentsList.map((student, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                          <span>{student}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeStudent(index)}
                            className="h-6 w-6 p-0 text-red-500"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 6L6 18"></path>
                              <path d="M6 6l12 12"></path>
                            </svg>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {sessionFormData.type === 'AUTRE' && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-medium">Détails de l'activité</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                  <Textarea 
                    id="description" 
                    placeholder="Décrivez l'activité réalisée..." 
                    value={sessionFormData.description || ''}
                    onChange={(e) => setSessionFormData({...sessionFormData, description: e.target.value})}
                    rows={4}
                  />
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
            <Button variant="outline" onClick={() => setIsSessionFormOpen(false)}>
              Fermer
            </Button>
            <Button onClick={handleSubmitSession}>
              Créer la séance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal pour la signature */}
      <Dialog open={isSignatureModalOpen} onOpenChange={setIsSignatureModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Signature des sessions</DialogTitle>
            <DialogDescription>
              Signez pour valider vos sessions en attente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="w-full h-64 bg-gray-50 border rounded flex items-center justify-center text-gray-400">
              {/* Composant de signature à implémenter */}
              <span>Composant de signature</span>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
            <Button variant="outline" onClick={() => setIsSignatureModalOpen(false)}>
              Fermer
            </Button>
            <Button onClick={handleConfirmSignature}>
              Signer et transmettre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}