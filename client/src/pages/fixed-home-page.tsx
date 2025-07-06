import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, isWeekend } from "date-fns";
import { fr } from "date-fns/locale";

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

export default function HomePage() {
  const { toast } = useToast();
  const [teacherCurrentView, setTeacherCurrentView] = useState('dashboard');
  const [hasPacte, setHasPacte] = useState(true);
  const [totalHours, setTotalHours] = useState({ total: 36, rcd: 15, devoirsFaits: 21 });
  const [completedHours, setCompletedHours] = useState({ rcd: 8, devoirsFaits: 12, autres: 3 });
  
  // État pour le formulaire de séance
  const [isSessionFormOpen, setIsSessionFormOpen] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // État pour les séances créées
  const [sessions, setSessions] = useState<any[]>([
    {
      id: 1,
      type: 'RCD',
      date: '2025-03-18',
      timeSlot: 'M2',
      status: 'PENDING_REVIEW',
      className: '4B',
      replacedTeacherName: 'M. DUBOIS',
    },
    {
      id: 2,
      type: 'DEVOIRS_FAITS',
      date: '2025-03-20',
      timeSlot: 'S3',
      status: 'VALIDATED',
      gradeLevel: '6e',
      studentCount: 15,
    },
    {
      id: 3,
      type: 'AUTRE',
      date: '2025-03-22',
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
  const [studentInput, setStudentInput] = useState('');
  
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
  
  // Réinitialiser le formulaire
  const resetSessionForm = () => {
    setSessionFormData(initialSessionFormData);
    setStudentInput('');
  };
  
  // Ouvrir le formulaire de création de séance
  const openSessionForm = () => {
    resetSessionForm();
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
    // Vérifier que les champs obligatoires sont remplis
    if (!sessionFormData.date || !sessionFormData.timeSlot) {
      toast({
        title: "Formulaire incomplet",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive"
      });
      return;
    }
    
    // Vérifier que la date n'est pas un week-end
    const selectedDate = new Date(sessionFormData.date);
    if (isWeekend(selectedDate)) {
      toast({
        title: "Date invalide",
        description: "Les séances ne peuvent pas être programmées pendant les week-ends.",
        variant: "destructive"
      });
      return;
    }
    
    // Vérifier les champs spécifiques selon le type
    if (sessionFormData.type === 'RCD') {
      if (!sessionFormData.replacedTeacherLastName || !sessionFormData.className) {
        toast({
          title: "Formulaire incomplet",
          description: "Pour une séance RCD, veuillez indiquer le nom de l'enseignant remplacé et la classe.",
          variant: "destructive"
        });
        return;
      }
    } else if (sessionFormData.type === 'DEVOIRS_FAITS') {
      if (sessionFormData.studentsList.length === 0) {
        toast({
          title: "Formulaire incomplet",
          description: "Pour une séance Devoirs Faits, veuillez ajouter au moins un élève.",
          variant: "destructive"
        });
        return;
      }
    } else if (sessionFormData.type === 'AUTRE') {
      if (!sessionFormData.description) {
        toast({
          title: "Formulaire incomplet",
          description: "Pour une séance de type Autre, veuillez fournir une description.",
          variant: "destructive"
        });
        return;
      }
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
      'PENDING_REVIEW': 'En attente de validation',
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
  
  const handleSignSession = () => {
    setIsSignatureModalOpen(true);
  };
  
  const handleSaveSignature = (signatureData: string) => {
    setSignature(signatureData);
    setIsSignatureModalOpen(false);
    toast({
      title: "Signature enregistrée",
      description: "Votre signature a été enregistrée avec succès.",
    });
  };
  
  // Vue pour le tableau de bord
  const TeacherDashboard = () => {
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
              <Button variant="outline" className="mt-2 bg-white" onClick={handleSignSession}>
                Signer maintenant
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Suivi des heures contrat</CardTitle>
            <CardDescription>Pacte Enseignant 2024-2025</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-between">
            <Button variant="ghost" className="text-xs">Voir détails</Button>
          </CardFooter>
        </Card>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 mb-4">
          <h2 className="text-xl font-semibold">Sessions récentes</h2>
          <Button onClick={openSessionForm} className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            Déclarer une session
          </Button>
        </div>
        
        <div className="rounded-lg border overflow-hidden">
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
              {sessions.length > 0 ? (
                sessions.slice().reverse().map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      {new Date(session.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      <div className="text-xs text-gray-500">{formatTimeSlot(session.timeSlot)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getSessionTypeColorClasses(session.type)} px-2 py-0.5 text-xs`}>
                        {session.type === 'DEVOIRS_FAITS' ? 'DF' : session.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {session.type === 'RCD' && (
                        <span>
                          {session.className} - {session.replacedTeacherName}
                        </span>
                      )}
                      {session.type === 'DEVOIRS_FAITS' && (
                        <span>
                          {session.gradeLevel} - {session.studentCount} élève(s)
                        </span>
                      )}
                      {session.type === 'AUTRE' && (
                        <span>{session.description}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getStatusColorClasses(session.status)}`}>
                        {formatStatus(session.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                    Aucune session n'a été déclarée.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };
  
  // Vue pour la déclaration de séance
  const TeacherSessionDeclaration = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Déclarer une nouvelle séance</h2>
          <Button 
            variant="ghost" 
            onClick={() => setTeacherCurrentView('dashboard')}
            className="flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Retour
          </Button>
        </div>
        
        <div className="rounded-lg border bg-white p-6">
          <form className="space-y-6">
            {/* Type de session */}
            <div className="space-y-2">
              <Label>Type de séance</Label>
              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                <Button 
                  type="button"
                  variant={sessionFormData.type === 'RCD' ? 'default' : 'outline'} 
                  onClick={() => handleSessionTypeChange('RCD')}
                  className={`flex-1 flex items-center justify-center ${
                    sessionFormData.type === 'RCD' 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                      : 'text-purple-600 border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                    <line x1="6" y1="1" x2="6" y2="4"></line>
                    <line x1="10" y1="1" x2="10" y2="4"></line>
                    <line x1="14" y1="1" x2="14" y2="4"></line>
                  </svg>
                  RCD
                </Button>
                <Button 
                  type="button"
                  variant={sessionFormData.type === 'DEVOIRS_FAITS' ? 'default' : 'outline'} 
                  onClick={() => handleSessionTypeChange('DEVOIRS_FAITS')}
                  className={`flex-1 flex items-center justify-center ${
                    sessionFormData.type === 'DEVOIRS_FAITS' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'text-blue-600 border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                    <path d="M9 14l2 2 4-4"></path>
                  </svg>
                  Devoirs Faits
                </Button>
                <Button 
                  type="button"
                  variant={sessionFormData.type === 'AUTRE' ? 'default' : 'outline'} 
                  onClick={() => handleSessionTypeChange('AUTRE')}
                  className={`flex-1 flex items-center justify-center ${
                    sessionFormData.type === 'AUTRE' 
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                      : 'text-yellow-600 border-yellow-300 hover:bg-yellow-50'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                  AUTRE
                </Button>
              </div>
            </div>
            
            {/* Informations communes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={sessionFormData.date} 
                  onChange={(e) => setSessionFormData({...sessionFormData, date: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeSlot">Créneau horaire</Label>
                <select 
                  id="timeSlot"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={sessionFormData.timeSlot}
                  onChange={(e) => setSessionFormData({...sessionFormData, timeSlot: e.target.value})}
                >
                  <option value="M1">Matin - 8h-9h</option>
                  <option value="M2">Matin - 9h-10h</option>
                  <option value="M3">Matin - 10h-11h</option>
                  <option value="M4">Matin - 11h-12h</option>
                  <option value="S1">Après-midi - 13h-14h</option>
                  <option value="S2">Après-midi - 14h-15h</option>
                  <option value="S3">Après-midi - 15h-16h</option>
                  <option value="S4">Après-midi - 16h-17h</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Durée</Label>
                <select 
                  id="duration"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={sessionFormData.duration}
                  onChange={(e) => setSessionFormData({...sessionFormData, duration: e.target.value})}
                >
                  <option value="1h">1 heure</option>
                  <option value="2h">2 heures</option>
                  <option value="3h">3 heures</option>
                  <option value="4h">4 heures</option>
                </select>
              </div>
            </div>
            
            {/* Champs spécifiques au type de séance */}
            {sessionFormData.type === 'RCD' && (
              <div className="space-y-4 border-l-4 border-purple-400 pl-4 py-2">
                <div className="space-y-2">
                  <Label>Enseignant remplacé</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <select 
                        id="replacedTeacherPrefix"
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        value={sessionFormData.replacedTeacherPrefix || 'M.'}
                        onChange={(e) => setSessionFormData({...sessionFormData, replacedTeacherPrefix: e.target.value as 'M.' | 'Mme'})}
                      >
                        <option value="M.">M.</option>
                        <option value="Mme">Mme</option>
                      </select>
                    </div>
                    <div>
                      <Input 
                        id="replacedTeacherLastName" 
                        value={sessionFormData.replacedTeacherLastName || ''} 
                        onChange={(e) => setSessionFormData({...sessionFormData, replacedTeacherLastName: e.target.value.toUpperCase()})}
                        placeholder="NOM"
                        className="uppercase"
                      />
                    </div>
                    <div>
                      <Input 
                        id="replacedTeacherFirstName" 
                        value={sessionFormData.replacedTeacherFirstName || ''} 
                        onChange={(e) => setSessionFormData({...sessionFormData, replacedTeacherFirstName: e.target.value})}
                        placeholder="Prénom (facultatif)"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="className">Classe</Label>
                  <Input 
                    id="className" 
                    value={sessionFormData.className || ''} 
                    onChange={(e) => setSessionFormData({...sessionFormData, className: e.target.value.toUpperCase()})}
                    placeholder="Ex: 6A, 5B, etc."
                    className="uppercase"
                  />
                </div>
              </div>
            )}
            
            {sessionFormData.type === 'DEVOIRS_FAITS' && (
              <div className="space-y-4 border-l-4 border-blue-400 pl-4 py-2">
                <div className="space-y-2">
                  <Label>Liste des élèves <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2">
                    <Input 
                      value={studentInput} 
                      onChange={(e) => setStudentInput(e.target.value)}
                      placeholder="NOM Prénom"
                      className="flex-1"
                    />
                    <Button type="button" onClick={addStudent}>Ajouter</Button>
                  </div>
                  
                  <div className="bg-gray-50 border rounded-md p-4 min-h-[100px] mt-2">
                    {sessionFormData.studentsList.length > 0 ? (
                      <ul className="space-y-1">
                        {sessionFormData.studentsList.map((student, index) => (
                          <li key={index} className="flex justify-between items-center bg-white px-3 py-1 rounded border">
                            <span>{student}</span>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 text-red-500" 
                              onClick={() => removeStudent(index)}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-gray-400 flex items-center justify-center h-full text-sm">
                        Aucun élève ajouté. La liste des élèves est obligatoire.
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Pièces jointes</Label>
                  <div className="flex items-center space-x-2">
                    <Input type="file" disabled={!sessionFormData.hasAttachment} multiple />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hasAttachment"
                      checked={sessionFormData.hasAttachment}
                      onChange={(e) => setSessionFormData({...sessionFormData, hasAttachment: e.target.checked})}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <Label htmlFor="hasAttachment" className="text-sm font-normal">
                      Je souhaite ajouter des pièces jointes (liste d'émargement, travail effectué, etc.)
                    </Label>
                  </div>
                </div>
              </div>
            )}
            
            {sessionFormData.type === 'AUTRE' && (
              <div className="space-y-4 border-l-4 border-yellow-400 pl-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="description">Description de l'activité</Label>
                  <Textarea 
                    id="description" 
                    value={sessionFormData.description || ''} 
                    onChange={(e) => setSessionFormData({...sessionFormData, description: e.target.value})}
                    placeholder="Décrivez l'activité réalisée..."
                    rows={4}
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setTeacherCurrentView('dashboard')}>
                Annuler
              </Button>
              <Button type="button" onClick={handleSubmitSession}>
                Déclarer la séance
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Interface Enseignant</h1>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            className={teacherCurrentView === 'dashboard' ? 'bg-gray-100' : ''}
            onClick={() => setTeacherCurrentView('dashboard')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            Tableau de bord
          </Button>
          <Button
            variant="ghost"
            className={teacherCurrentView === 'declaration' ? 'bg-gray-100' : ''}
            onClick={() => setTeacherCurrentView('declaration')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            Déclarer
          </Button>
        </div>
      </div>
      
      {teacherCurrentView === 'dashboard' && <TeacherDashboard />}
      {teacherCurrentView === 'declaration' && <TeacherSessionDeclaration />}
      
      {/* Modal pour le formulaire de séance */}
      <Dialog open={isSessionFormOpen} onOpenChange={setIsSessionFormOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Déclarer une nouvelle séance</DialogTitle>
            <DialogDescription>
              Remplissez ce formulaire pour déclarer une séance de remplacement, de devoirs faits ou une autre activité.
            </DialogDescription>
          </DialogHeader>
          
          {/* Contenu du formulaire */}
          <div className="grid gap-4">
            {/* Type de session */}
            <div className="space-y-2">
              <Label>Type de séance</Label>
              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                <Button 
                  type="button"
                  variant={sessionFormData.type === 'RCD' ? 'default' : 'outline'} 
                  onClick={() => handleSessionTypeChange('RCD')}
                  className={`flex-1 flex items-center justify-center ${
                    sessionFormData.type === 'RCD' 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                      : 'text-purple-600 border-purple-300 hover:bg-purple-50'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                    <path d="M15 2v4"></path>
                    <path d="M9 2v4"></path>
                    <path d="M9 14L12 11 15 14"></path>
                    <path d="M12 11V20"></path>
                  </svg>
                  RCD
                </Button>
                <Button 
                  type="button"
                  variant={sessionFormData.type === 'DEVOIRS_FAITS' ? 'default' : 'outline'} 
                  onClick={() => handleSessionTypeChange('DEVOIRS_FAITS')}
                  className={`flex-1 flex items-center justify-center ${
                    sessionFormData.type === 'DEVOIRS_FAITS' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'text-blue-600 border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                  Devoirs Faits
                </Button>
                <Button 
                  type="button"
                  variant={sessionFormData.type === 'AUTRE' ? 'default' : 'outline'} 
                  onClick={() => handleSessionTypeChange('AUTRE')}
                  className={`flex-1 flex items-center justify-center ${
                    sessionFormData.type === 'AUTRE' 
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                      : 'text-yellow-600 border-yellow-300 hover:bg-yellow-50'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                  AUTRE
                </Button>
              </div>
            </div>
            
            {/* Contenu des formulaires avec hauteur fixe */}
            <div className="min-h-[300px]">
              {/* Champs spécifiques pour RCD */}
              {sessionFormData.type === 'RCD' && (
                <div className="space-y-4 border-l-4 border-purple-400 pl-4 py-2">
                  <div className="space-y-2">
                    <Label>Enseignant remplacé</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <select 
                          id="replacedTeacherPrefix"
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          value={sessionFormData.replacedTeacherPrefix || 'M.'}
                          onChange={(e) => setSessionFormData({...sessionFormData, replacedTeacherPrefix: e.target.value as 'M.' | 'Mme'})}
                        >
                          <option value="M.">M.</option>
                          <option value="Mme">Mme</option>
                        </select>
                      </div>
                      <div>
                        <Input 
                          id="replacedTeacherLastName" 
                          value={sessionFormData.replacedTeacherLastName || ''} 
                          onChange={(e) => setSessionFormData({...sessionFormData, replacedTeacherLastName: e.target.value.toUpperCase()})}
                          placeholder="NOM"
                          className="uppercase"
                        />
                      </div>
                      <div>
                        <Input 
                          id="replacedTeacherFirstName" 
                          value={sessionFormData.replacedTeacherFirstName || ''} 
                          onChange={(e) => setSessionFormData({...sessionFormData, replacedTeacherFirstName: e.target.value})}
                          placeholder="Prénom (facultatif)"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="className">Classe</Label>
                    <Input 
                      id="className" 
                      value={sessionFormData.className || ''} 
                      onChange={(e) => setSessionFormData({...sessionFormData, className: e.target.value.toUpperCase()})}
                      placeholder="Ex: 6A, 5B, etc."
                      className="uppercase"
                    />
                  </div>
                </div>
              )}
              
              {/* Champs spécifiques pour AUTRE */}
              {sessionFormData.type === 'AUTRE' && (
                <div className="space-y-4 border-l-4 border-yellow-400 pl-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="description">Description de l'activité</Label>
                    <Textarea 
                      id="description" 
                      value={sessionFormData.description || ''} 
                      onChange={(e) => setSessionFormData({...sessionFormData, description: e.target.value})}
                      placeholder="Décrivez l'activité réalisée..."
                      rows={4}
                    />
                  </div>
                </div>
              )}
              
              {/* Champs spécifiques pour DEVOIRS_FAITS */}
              {sessionFormData.type === 'DEVOIRS_FAITS' && (
                <div className="space-y-4 border-l-4 border-blue-400 pl-4 py-2">
                  <div className="space-y-2">
                    <Label className="flex items-center">
                      Liste des élèves
                      <span className="text-red-500 ml-1">*</span>
                      <span className="ml-2 text-xs text-gray-500">(obligatoire)</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input 
                        value={studentInput} 
                        onChange={(e) => setStudentInput(e.target.value)}
                        placeholder="NOM Prénom"
                        className="flex-1"
                      />
                      <Button type="button" onClick={addStudent}>Ajouter</Button>
                    </div>
                    
                    <div className="bg-gray-50 border rounded-md p-4 min-h-[100px] mt-2">
                      {sessionFormData.studentsList.length > 0 ? (
                        <ul className="space-y-1">
                          {sessionFormData.studentsList.map((student, index) => (
                            <li key={index} className="flex justify-between items-center bg-white px-3 py-1 rounded border">
                              <span>{student}</span>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 w-6 p-0 text-red-500" 
                                onClick={() => removeStudent(index)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-gray-400 flex items-center justify-center h-full text-sm">
                          Aucun élève ajouté. La liste des élèves est obligatoire.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Informations communes sur la date et l'heure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input 
                  id="date" 
                  type="date" 
                  value={sessionFormData.date} 
                  onChange={(e) => setSessionFormData({...sessionFormData, date: e.target.value})}
                />
                {isWeekend(new Date(sessionFormData.date)) && (
                  <p className="text-red-500 text-xs mt-1">Les séances ne peuvent pas être programmées les week-ends.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeSlot">Créneau horaire</Label>
                <select 
                  id="timeSlot"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={sessionFormData.timeSlot}
                  onChange={(e) => setSessionFormData({...sessionFormData, timeSlot: e.target.value})}
                >
                  <option value="M1">Matin - 8h-9h</option>
                  <option value="M2">Matin - 9h-10h</option>
                  <option value="M3">Matin - 10h-11h</option>
                  <option value="M4">Matin - 11h-12h</option>
                  <option value="S1">Après-midi - 13h-14h</option>
                  <option value="S2">Après-midi - 14h-15h</option>
                  <option value="S3">Après-midi - 15h-16h</option>
                  <option value="S4">Après-midi - 16h-17h</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Durée</Label>
                <select 
                  id="duration"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={sessionFormData.duration}
                  onChange={(e) => setSessionFormData({...sessionFormData, duration: e.target.value})}
                >
                  <option value="1h">1 heure</option>
                  <option value="2h">2 heures</option>
                  <option value="3h">3 heures</option>
                  <option value="4h">4 heures</option>
                </select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSessionFormOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmitSession}>
              Déclarer la séance
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
              Annuler
            </Button>
            <Button onClick={() => {
              setIsSignatureModalOpen(false);
              toast({
                title: "Sessions signées",
                description: "Vos sessions ont été signées et envoyées au principal pour validation."
              });
              // Mettre à jour le statut des sessions
              const updatedSessions = sessions.map(s => {
                if (s.status === 'PENDING_REVIEW') {
                  return { ...s, status: 'PENDING_VALIDATION' };
                }
                return s;
              });
              setSessions(updatedSessions);
            }}>
              Signer et transmettre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}