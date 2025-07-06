import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/hooks/use-session';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

// Type pour une session
type Session = {
  id: number;
  date: string;
  timeSlot: string;
  type: string;
  status: string;
  className?: string;
  replacedTeacherPrefix?: string;
  replacedTeacherLastName?: string;
  replacedTeacherFirstName?: string;
  gradeLevel?: string;
  studentCount?: number;
  teacherName: string;
  teacherFirstName: string;
  attachments: Attachment[];
  comment?: string;
};

// Type pour une pièce jointe
type Attachment = {
  id: number;
  name: string;
  type: string;
  size: number;
  url: string;
  isVerified: boolean;
};

// Type pour un contrat d'enseignant
type TeacherContract = {
  id: number;
  teacherId: number;
  teacherName: string;
  teacherFirstName: string;
  contractNumber: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  rcdHours: number;
  devoirsFaitsHours: number;
  completedRcdHours: number;
  completedDevoirsFaitsHours: number;
  completedOtherHours: number;
  status: 'ACTIVE' | 'COMPLETED' | 'TERMINATED';
};

export function PrincipalView() {
  const isMobile = useIsMobile();
  
  return (
    <Tabs defaultValue="pending-sessions" className="w-full">
      <TabsList className="mb-4 flex flex-wrap gap-1 justify-center">
        <TabsTrigger value="pending-sessions" className="px-2 py-1 text-xs sm:text-sm">
          {isMobile ? "À valider" : "Sessions à valider"}
        </TabsTrigger>
        <TabsTrigger value="recent-sessions" className="px-2 py-1 text-xs sm:text-sm">
          {isMobile ? "Récentes" : "Actions récentes"}
        </TabsTrigger>
        <TabsTrigger value="history" className="px-2 py-1 text-xs sm:text-sm">
          Historique
        </TabsTrigger>
        <TabsTrigger value="contracts" className="px-2 py-1 text-xs sm:text-sm">
          {isMobile ? "Contrats" : "Suivi des contrats"}
        </TabsTrigger>
        <TabsTrigger value="statistics" className="px-2 py-1 text-xs sm:text-sm">
          Stats
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="pending-sessions">
        <SessionValidation />
      </TabsContent>
      
      <TabsContent value="recent-sessions">
        <RecentSessionsHistory />
      </TabsContent>
      
      <TabsContent value="history">
        <FullSessionsHistory />
      </TabsContent>
      
      <TabsContent value="contracts">
        <ContractReview />
      </TabsContent>
      
      <TabsContent value="statistics">
        <StatisticsView />
      </TabsContent>
    </Tabs>
  );
}

function SessionValidation() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isSessionDetailModalOpen, setIsSessionDetailModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showFeedbackField, setShowFeedbackField] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<'VALIDATE' | 'REJECT' | 'VALIDATE_COMMENT_PROMPT' | 'REJECT_COMMENT_PROMPT' | null>(null);
  const [conversionType, setConversionType] = useState<string>('');
  const [conversionHours, setConversionHours] = useState<number>(1);
  
  // Utiliser les données de l'API avec React Query
  const { sessions, isLoading, error } = useSession();
  
  // Données fictives pour la démonstration avec dates correctes (mars 2025)
  const initialSessions: Session[] = [
    {
      id: 1,
      date: '2025-03-07', // Premier vendredi de mars 2025
      timeSlot: 'M3',
      type: 'RCD',
      status: 'PENDING_VALIDATION',
      className: '6A',
      replacedTeacherPrefix: 'M.',
      replacedTeacherLastName: 'DUBOIS',
      replacedTeacherFirstName: 'Jean',
      teacherName: 'MARTIN',
      teacherFirstName: 'Jean',
      attachments: []
    },
    {
      id: 2,
      date: '2025-03-12', // Mercredi de la deuxième semaine de mars 2025
      timeSlot: 'S2',
      type: 'DEVOIRS_FAITS',
      status: 'PENDING_VALIDATION',
      gradeLevel: '5C',
      studentCount: 12,
      teacherName: 'PETIT',
      teacherFirstName: 'Marie',
      attachments: [
        {
          id: 1,
          name: 'liste_presence_5c_12032025.pdf',
          type: 'application/pdf',
          size: 245000,
          url: '#',
          isVerified: true
        },
        {
          id: 2,
          name: 'travail_effectue_5c.docx',
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 125000,
          url: '#',
          isVerified: true
        }
      ]
    },
    {
      id: 3,
      date: '2025-03-18', // Mardi de la troisième semaine de mars 2025
      timeSlot: 'S1',
      type: 'AUTRE',
      status: 'PENDING_VALIDATION',
      teacherName: 'LEROY',
      teacherFirstName: 'Sophie',
      attachments: [
        {
          id: 3,
          name: 'rapport_reunion_18032025.pdf',
          type: 'application/pdf',
          size: 350000,
          url: '#',
          isVerified: true
        }
      ],
      comment: "Réunion de coordination pédagogique"
    }
  ];
  
  const [pendingSessions, setPendingSessions] = useState<Session[]>(initialSessions);
  
  const handleViewSession = (session: Session) => {
    setSelectedSession(session);
    
    // Réinitialiser les états pour la conversion si c'est une session "AUTRE"
    if (session.type === 'AUTRE') {
      setConversionType('');
      setConversionHours(1);
    }
    
    // Réinitialiser les états de l'interface
    setFeedback('');
    setShowFeedbackField(false);
    setActionInProgress(null);
    setIsSessionDetailModalOpen(true);
  };
  
  const handleDownloadAttachment = (attachment: Attachment) => {
    console.log(`Téléchargement de ${attachment.name}`);
    
    // Créer un lien de téléchargement temporaire
    // Dans une vraie implémentation, l'URL proviendrait de l'API
    // Pour la démo, on va créer un blob avec du contenu fictif
    const content = `Contenu fictif du fichier ${attachment.name}\nCeci est une démonstration.`;
    const blob = new Blob([content], { type: attachment.type });
    const url = URL.createObjectURL(blob);
    
    // Créer un élément <a> invisible et déclencher le téléchargement
    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.name;
    document.body.appendChild(a);
    a.click();
    
    // Nettoyer
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    toast({
      title: "Téléchargement en cours",
      description: `Le fichier ${attachment.name} est en train d'être téléchargé.`
    });
  };
  
  const validateSession = () => {
    if (!selectedSession) return;
    
    // Gérer le cas spécial des activités "AUTRE" qui nécessitent une conversion
    if (selectedSession.type === 'AUTRE') {
      if (!conversionType) {
        toast({
          title: "Conversion requise",
          description: "Veuillez sélectionner un type de conversion pour cette activité.",
          variant: "destructive"
        });
        return;
      }
    }
    
    // Plutôt que la popup, on montre des boutons spécifiques pour demander si on veut ajouter un commentaire
    setActionInProgress('VALIDATE_COMMENT_PROMPT');
  };
  
  const finishValidation = () => {
    if (!selectedSession) return;
    
    // Dans une implémentation réelle, on enverrait une requête à l'API
    if (selectedSession.type === 'AUTRE') {
      console.log(`Séance ${selectedSession.id} validée et convertie en ${conversionType} pour ${conversionHours} heure(s) ${feedback.trim() ? `avec le commentaire: ${feedback}` : 'sans commentaire'}`);
    } else {
      console.log(`Séance ${selectedSession.id} validée ${feedback.trim() ? `avec le commentaire: ${feedback}` : 'sans commentaire'}`);
    }
    
    // Mettre à jour le statut dans pendingSessions
    setPendingSessions(prevSessions => prevSessions.filter(session => 
      session.id !== selectedSession.id
    ));
    
    // Afficher une notification de succès directement sans popup
    toast({
      title: "Séance validée",
      description: "La séance a été validée et transmise pour paiement.",
      variant: "default"
    });
    
    setIsSessionDetailModalOpen(false);
    setShowFeedbackField(false);
    setActionInProgress(null);
  };
  
  const rejectSession = () => {
    if (!selectedSession) return;
    
    // Plutôt que la popup, on montre des boutons spécifiques pour demander si on veut ajouter un commentaire
    setActionInProgress('REJECT_COMMENT_PROMPT');
  };
  
  const finishRejection = () => {
    if (!selectedSession) return;
    
    // Dans une implémentation réelle, on enverrait une requête à l'API avec le commentaire si présent
    console.log(`Séance ${selectedSession.id} refusée ${feedback.trim() ? `avec le commentaire: ${feedback}` : 'sans commentaire'}`);
    
    // Mettre à jour le statut dans pendingSessions
    setPendingSessions(prevSessions => prevSessions.filter(session => 
      session.id !== selectedSession.id
    ));
    
    toast({
      title: "Séance refusée",
      description: "Un email a été envoyé à l'enseignant pour l'informer."
    });
    
    setIsSessionDetailModalOpen(false);
    setShowFeedbackField(false);
    setActionInProgress(null);
  };
  
  // Fonction pour formater la taille d'un fichier
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Fonction pour obtenir l'icône en fonction du type de fichier
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      );
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      );
    } else if (fileType.includes('image')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
      );
    } else {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
      );
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Séances en attente de validation</h3>
        
        {pendingSessions.length > 0 ? (
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm w-16">Date</TableHead>
                  <TableHead className="text-xs sm:text-sm w-20">Enseignant</TableHead>
                  <TableHead className="text-xs sm:text-sm w-16">Type</TableHead>
                  <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Détails</TableHead>
                  <TableHead className="text-xs sm:text-sm w-10">Justif.</TableHead>
                  <TableHead className="text-xs sm:text-sm text-right w-14">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingSessions.map(session => (
                  <TableRow key={session.id}>
                    <TableCell className="text-xs sm:text-sm p-2 sm:p-4">
                      <div className="font-medium whitespace-nowrap">
                        {new Date(session.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className={`text-xs font-medium ${
                        session.timeSlot.includes('Matin') ? 'text-sky-600' : 'text-amber-600'
                      }`}>{session.timeSlot}</div>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm p-2 sm:p-4">
                      {session.teacherName} {isMobile ? session.teacherFirstName.charAt(0) + "." : session.teacherFirstName}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm p-2 sm:p-4">
                      <div className="relative inline-block">
                        <span className={`absolute -top-1 -left-1 w-3 h-3 rounded-full border border-white z-10 
                          shadow-sm
                          flex items-center justify-center text-[6px] font-bold text-white
                          ${session.status === 'VALIDATED' ? 'bg-green-500' : 
                            session.status === 'REJECTED' ? 'bg-red-500' : 
                            session.status === 'PAID' ? 'bg-green-800' :
                            'bg-gray-500'}`}></span>
                        <span className={`px-3 py-1 text-xs rounded-md inline-flex items-center justify-center shadow-sm min-w-14 ${
                          session.type === 'RCD' ? 'bg-purple-600 text-white' :
                          session.type === 'DEVOIRS_FAITS' ? 'bg-blue-600 text-white' : 
                          'bg-amber-500 text-white'
                        }`}>
                          {session.type === 'RCD' ? 'RCD' : 
                           session.type === 'DEVOIRS_FAITS' ? 'DF' : 'Autre'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm p-2 sm:p-4 hidden sm:table-cell">
                      {session.type === 'RCD' ? (
                        <div className="whitespace-nowrap">
                          <span className="font-medium">{session.className}</span> - {session.replacedTeacherPrefix} {session.replacedTeacherLastName}
                        </div>
                      ) : session.type === 'DEVOIRS_FAITS' ? (
                        <div>
                          <span className="font-medium">{session.gradeLevel}</span> - {session.studentCount} élèves
                        </div>
                      ) : session.comment ? (
                        <div className="italic">{session.comment}</div>
                      ) : 'Autre activité'}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm p-2 sm:p-4 pl-8">
                      <Badge variant={session.attachments.length > 0 ? "default" : "outline"}>
                        {session.attachments.length}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm p-2 sm:p-4 text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="py-1 px-2 h-auto text-xs"
                        onClick={() => handleViewSession(session)}
                      >
                        {isMobile ? "✓" : "Vérifier"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Aucune séance en attente de validation
          </div>
        )}
      </div>
      
      {/* Modal de détail de séance */}
      <Dialog open={isSessionDetailModalOpen} onOpenChange={setIsSessionDetailModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedSession && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  Validation de séance
                </DialogTitle>
                <DialogDescription className="whitespace-nowrap">
                  {new Date(selectedSession.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}, 
                  <span className={`font-medium ${selectedSession.timeSlot.includes('Matin') ? 'text-sky-600' : 'text-amber-600'}`}>
                    {selectedSession.timeSlot}
                  </span>
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Enseignant</Label>
                    <div className="font-medium mt-1">{selectedSession.teacherName} {selectedSession.teacherFirstName}</div>
                  </div>
                  <div>
                    <Label>Type de séance</Label>
                    <div className="mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full inline-flex items-center ${
                        selectedSession.type === 'RCD' ? 'bg-purple-100 text-purple-800' :
                        selectedSession.type === 'DEVOIRS_FAITS' ? 'bg-blue-100 text-blue-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedSession.type === 'RCD' ? 'RCD' : 
                         selectedSession.type === 'DEVOIRS_FAITS' ? 'Devoirs Faits' : 'Autre'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {selectedSession.type === 'RCD' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Professeur remplacé</Label>
                      <div className="font-medium mt-1">{selectedSession.replacedTeacherPrefix} {selectedSession.replacedTeacherLastName} {selectedSession.replacedTeacherFirstName}</div>
                    </div>
                    <div>
                      <Label>Classe</Label>
                      <div className="font-medium mt-1">{selectedSession.className}</div>
                    </div>
                  </div>
                )}
                
                {selectedSession.type === 'DEVOIRS_FAITS' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Niveau</Label>
                      <div className="font-medium mt-1">{selectedSession.gradeLevel}</div>
                    </div>
                    <div>
                      <Label>Nombre d'élèves</Label>
                      <div className="font-medium mt-1">{selectedSession.studentCount}</div>
                    </div>
                  </div>
                )}
                
                {selectedSession.type === 'AUTRE' && (
                  <div className="space-y-4">
                    {selectedSession.comment && (
                      <div>
                        <Label>Description</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded border border-gray-200">
                          {selectedSession.comment}
                        </div>
                      </div>
                    )}
                    
                    <div className="border-t pt-4">
                      <Label>Conversion en heures</Label>
                      <p className="text-sm text-gray-500 mb-2">
                        Cette activité doit être convertie en heures de RCD ou de Devoirs Faits
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="conversionType">Type d'heures</Label>
                          <Select 
                            value={conversionType} 
                            onValueChange={setConversionType}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Sélectionner..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="RCD">RCD</SelectItem>
                              <SelectItem value="DEVOIRS_FAITS">Devoirs Faits</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="conversionHours">Nombre d'heures</Label>
                          <Input 
                            id="conversionHours" 
                            type="number" 
                            min="0"
                            step="0.5"
                            value={conversionHours}
                            onChange={(e) => setConversionHours(parseFloat(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedSession.attachments.length > 0 && (
                  <div>
                    <Label>{isMobile ? "Justificatifs" : "Pièces justificatives"}</Label>
                    <div className="mt-2 space-y-2">
                      {selectedSession.attachments.map(attachment => (
                        <div 
                          key={attachment.id} 
                          className="flex items-center justify-between p-3 rounded-md border border-gray-200"
                        >
                          <div className="flex items-center">
                            {getFileIcon(attachment.type)}
                            <div className="ml-3">
                              <div className="font-medium text-sm">{attachment.name}</div>
                              <div className="text-xs text-gray-500">{formatFileSize(attachment.size)}</div>
                            </div>
                          </div>
                          <Button 
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={() => handleDownloadAttachment(attachment)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="7 10 12 15 17 10"></polyline>
                              <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Champ de commentaire qui s'affiche uniquement lorsque demandé */}
                {showFeedbackField && (
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="feedback">
                      {actionInProgress === 'REJECT' 
                        ? "Motif du refus" 
                        : "Commentaire"} <span className="text-xs text-gray-500">(optionnel)</span>
                    </Label>
                    <Textarea 
                      id="feedback" 
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder={actionInProgress === 'REJECT' 
                        ? "Veuillez préciser le motif du refus..." 
                        : "Commentaire pour cette validation..."}
                      className="min-h-[80px]"
                      autoFocus
                    />
                  </div>
                )}
              </div>
              
              <DialogFooter className="flex-col-reverse sm:flex-row space-y-2 space-y-reverse sm:space-y-0 sm:space-x-2">
                {/* Affichage de boutons selon l'état courant */}
                {actionInProgress === 'VALIDATE_COMMENT_PROMPT' ? (
                  // Boutons pour demander si on veut ajouter un commentaire à la validation
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <Button 
                      variant="secondary"
                      onClick={() => {
                        // Continuer sans commentaire
                        finishValidation();
                      }}
                      className="flex-1 py-6"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-xl mb-1">👍</span>
                        <span>Valider sans commentaire</span>
                      </div>
                    </Button>
                    <Button 
                      onClick={() => {
                        // Afficher le champ de commentaire
                        setShowFeedbackField(true);
                        setActionInProgress('VALIDATE');
                      }}
                      className="flex-1 py-6"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-xl mb-1">✏️</span>
                        <span>Ajouter un commentaire</span>
                      </div>
                    </Button>
                  </div>
                ) : actionInProgress === 'REJECT_COMMENT_PROMPT' ? (
                  // Boutons pour demander si on veut ajouter un commentaire au refus
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <Button 
                      variant="secondary"
                      onClick={() => {
                        // Continuer sans commentaire
                        finishRejection();
                      }}
                      className="flex-1 py-6"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-xl mb-1">👎</span>
                        <span>Refuser sans commentaire</span>
                      </div>
                    </Button>
                    <Button 
                      onClick={() => {
                        // Afficher le champ de commentaire
                        setShowFeedbackField(true);
                        setActionInProgress('REJECT');
                      }}
                      className="flex-1 py-6"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-xl mb-1">✏️</span>
                        <span>Ajouter un motif de refus</span>
                      </div>
                    </Button>
                  </div>
                ) : (
                  // Boutons standard pour valider/refuser
                  <>
                    {showFeedbackField ? (
                      // Si le champ commentaire est affiché, on adapte les boutons
                      <div className="flex flex-col sm:flex-row gap-2 w-full">
                        <Button 
                          variant="outline"
                          onClick={() => {
                            // Annuler l'action en cours
                            setActionInProgress(null);
                            setShowFeedbackField(false);
                            setFeedback('');
                          }}
                          className="sm:flex-1"
                        >
                          Annuler
                        </Button>
                        <Button 
                          variant={actionInProgress === 'REJECT' ? "destructive" : "default"}
                          onClick={() => {
                            if (actionInProgress === 'REJECT') {
                              finishRejection();
                            } else if (actionInProgress === 'VALIDATE') {
                              finishValidation();
                            }
                          }}
                          className="sm:flex-1"
                        >
                          {actionInProgress === 'REJECT' ? "Confirmer le refus" : "Confirmer la validation"}
                        </Button>
                      </div>
                    ) : (
                      // Si le champ commentaire n'est pas affiché, boutons normaux
                      <>
                        <div className="flex flex-col sm:flex-row gap-2 sm:flex-1">
                          <Button 
                            variant="destructive"
                            onClick={() => {
                              // Commencer un processus de rejet
                              setActionInProgress('REJECT_COMMENT_PROMPT');
                            }}
                            className="sm:flex-1"
                          >
                            Refuser
                          </Button>
                        </div>
                        <Button 
                          onClick={() => {
                            // Commencer un processus de validation
                            validateSession();
                          }}
                          className="sm:flex-1"
                        >
                          Valider
                        </Button>
                      </>
                    )}
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RecentSessionsHistory() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Sessions récemment validées/refusées par le principal (pour lesquelles il peut encore intervenir)
  const recentSessions: Session[] = [
    {
      id: 101,
      date: '2025-03-06',
      timeSlot: 'M2',
      type: 'RCD',
      status: 'VALIDATED',
      className: '3B',
      replacedTeacherPrefix: 'Mme',
      replacedTeacherLastName: 'LAURENT',
      replacedTeacherFirstName: 'Caroline',
      teacherName: 'DUBOIS',
      teacherFirstName: 'Pierre',
      attachments: []
    },
    {
      id: 102,
      date: '2025-03-05',
      timeSlot: 'S3',
      type: 'DEVOIRS_FAITS',
      status: 'REJECTED',
      gradeLevel: '4A',
      studentCount: 8,
      teacherName: 'MARTIN',
      teacherFirstName: 'Jean',
      attachments: [
        {
          id: 101,
          name: 'liste_eleves_4a.pdf',
          type: 'application/pdf',
          size: 120000,
          url: '#',
          isVerified: true
        }
      ],
      comment: "Nombre d'élèves insuffisant pour une séance"
    },
    {
      id: 103,
      date: '2025-03-05',
      timeSlot: 'M4',
      type: 'AUTRE',
      status: 'VALIDATED',
      teacherName: 'PETIT',
      teacherFirstName: 'Marie',
      attachments: [],
      comment: "Réunion de préparation conseil de classe"
    }
  ];

  const handleEditDecision = (session: Session) => {
    toast({
      title: "Modification possible",
      description: "Vous pouvez modifier votre décision dans les 7 jours suivant la validation/refus.",
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Actions récentes</h3>
          <span className="text-sm text-gray-500">Derniers 7 jours</span>
        </div>
        
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs sm:text-sm w-1/5">Date</TableHead>
                <TableHead className="text-xs sm:text-sm w-1/5">Enseignant</TableHead>
                <TableHead className="text-xs sm:text-sm w-1/5">Type</TableHead>
                <TableHead className="text-xs sm:text-sm w-1/5 hidden sm:table-cell">Détails</TableHead>
                <TableHead className="text-xs sm:text-sm w-1/5">Statut</TableHead>
                <TableHead className="text-xs sm:text-sm text-right w-1/5">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSessions.map(session => (
                <TableRow key={session.id}>
                  <TableCell className="text-xs sm:text-sm p-2 sm:p-4">
                    <div className="font-medium">
                      {new Date(session.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </div>
                    <div className="text-xs text-gray-500">{session.timeSlot}</div>
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm p-2 sm:p-4">
                    {session.teacherName} {isMobile ? session.teacherFirstName.charAt(0) + "." : session.teacherFirstName}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm p-2 sm:p-4">
                    <span className={`px-2 py-1 text-xs rounded-full inline-flex items-center ${
                      session.type === 'RCD' ? 'bg-purple-100 text-purple-800' :
                      session.type === 'DEVOIRS_FAITS' ? 'bg-blue-100 text-blue-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${
                        session.type === 'RCD' ? 'bg-purple-500' :
                        session.type === 'DEVOIRS_FAITS' ? 'bg-blue-500' :
                        'bg-yellow-500'
                      }`}></span>
                      {session.type === 'RCD' ? 'RCD' : 
                       session.type === 'DEVOIRS_FAITS' ? 'DF' : 'Autre'}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm p-2 sm:p-4 hidden sm:table-cell">
                    {session.type === 'RCD' ? (
                      <div className="whitespace-nowrap">
                        <span className="font-medium">{session.className}</span> - {session.replacedTeacherPrefix} {session.replacedTeacherLastName}
                      </div>
                    ) : session.type === 'DEVOIRS_FAITS' ? (
                      <div>
                        <span className="font-medium">{session.gradeLevel}</span> - {session.studentCount} élèves
                      </div>
                    ) : session.comment ? (
                      <div className="italic">{session.comment}</div>
                    ) : 'Autre activité'}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm p-2 sm:p-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      session.status === 'VALIDATED' ? 'bg-green-100 text-green-800' : 
                      session.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {session.status === 'VALIDATED' ? 'Validée' : 
                       session.status === 'REJECTED' ? 'Refusée' : 
                       'En attente'}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm p-2 sm:p-4 text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="py-1 px-2 h-auto text-xs"
                      onClick={() => handleEditDecision(session)}
                    >
                      Modifier
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function FullSessionsHistory() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterTeacher, setFilterTeacher] = useState<string>("all");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  
  // Historique complet des sessions
  const allSessions: Session[] = [
    {
      id: 201,
      date: '2025-02-15',
      timeSlot: 'M1',
      type: 'RCD',
      status: 'VALIDATED',
      className: '4C',
      replacedTeacherPrefix: 'M.',
      replacedTeacherLastName: 'BONNET',
      replacedTeacherFirstName: 'Thierry',
      teacherName: 'GIRARD',
      teacherFirstName: 'Laura',
      attachments: []
    },
    {
      id: 202,
      date: '2025-02-18',
      timeSlot: 'S2',
      type: 'DEVOIRS_FAITS',
      status: 'VALIDATED',
      gradeLevel: '5B',
      studentCount: 15,
      teacherName: 'MARTIN',
      teacherFirstName: 'Jean',
      attachments: []
    },
    {
      id: 203,
      date: '2025-01-28',
      timeSlot: 'S1',
      type: 'AUTRE',
      status: 'VALIDATED',
      teacherName: 'PETIT',
      teacherFirstName: 'Marie',
      attachments: [],
      comment: "Préparation examens blancs"
    },
    {
      id: 204,
      date: '2025-01-10',
      timeSlot: 'M3',
      type: 'RCD',
      status: 'REJECTED',
      className: '3A',
      replacedTeacherPrefix: 'Mme',
      replacedTeacherLastName: 'MOREAU',
      replacedTeacherFirstName: 'Nathalie',
      teacherName: 'DUBOIS',
      teacherFirstName: 'Pierre',
      attachments: []
    },
    {
      id: 205,
      date: '2024-12-15',
      timeSlot: 'S4',
      type: 'DEVOIRS_FAITS',
      status: 'VALIDATED',
      gradeLevel: '6D',
      studentCount: 18,
      teacherName: 'LEROY',
      teacherFirstName: 'Sophie',
      attachments: []
    }
  ];

  // Filtrer les sessions selon les critères
  const filteredSessions = allSessions.filter(session => {
    const sessionDate = new Date(session.date);
    const monthMatch = filterMonth === "all" || 
      (filterMonth === "current" && sessionDate.getMonth() === new Date().getMonth()) ||
      (filterMonth === "previous" && sessionDate.getMonth() === new Date().getMonth() - 1);
    
    const typeMatch = filterType === "all" || session.type === filterType;
    const teacherMatch = filterTeacher === "all" || 
      session.teacherName === filterTeacher.split(' ')[0];
      
    // Filtre par matière (fictif pour la démo)
    // Dans une implémentation réelle, on récupérerait cette information de l'API
    const subject = session.id % 5 === 0 ? "math" : 
                   session.id % 4 === 0 ? "fra" : 
                   session.id % 3 === 0 ? "his" : 
                   session.id % 2 === 0 ? "svt" : "ang";
    const subjectMatch = filterSubject === "all" || subject === filterSubject;
    
    return monthMatch && typeMatch && teacherMatch && subjectMatch;
  });
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Historique complet</h3>
          
          <div className="flex flex-wrap gap-1">
            {/* Filtres par période avec des boutons */}
            <div className="flex flex-wrap">
              <Button 
                variant={filterMonth === "all" ? "default" : "outline"} 
                size="sm" 
                className="text-[10px] h-7 px-2 rounded-r-none"
                onClick={() => setFilterMonth("all")}
              >
                Tout
              </Button>
              <Button 
                variant={filterMonth === "current" ? "default" : "outline"} 
                size="sm" 
                className="text-[10px] h-7 px-2 rounded-none border-l-0"
                onClick={() => setFilterMonth("current")}
              >
                Mois actuel
              </Button>
              <Button 
                variant={filterMonth === "previous" ? "default" : "outline"} 
                size="sm" 
                className="text-[10px] h-7 px-2 rounded-l-none border-l-0"
                onClick={() => setFilterMonth("previous")}
              >
                Mois préc.
              </Button>
            </div>
            
            {/* Petite séparation */}
            <div className="h-7 border-l mx-1 hidden sm:block"></div>
            
            {/* Filtres par type avec des boutons */}
            <div className="flex flex-wrap mt-1 sm:mt-0">
              <Button 
                variant={filterType === "all" ? "default" : "outline"} 
                size="sm" 
                className="text-[10px] h-7 px-2 rounded-r-none"
                onClick={() => setFilterType("all")}
              >
                Tous
              </Button>
              <Button 
                variant={filterType === "RCD" ? "default" : "outline"} 
                size="sm" 
                className="text-[10px] h-7 px-2 rounded-none border-l-0 bg-purple-50 text-purple-800 hover:text-purple-900 hover:bg-purple-100 border-purple-200"
                onClick={() => setFilterType("RCD")}
              >
                RCD
              </Button>
              <Button 
                variant={filterType === "DEVOIRS_FAITS" ? "default" : "outline"} 
                size="sm" 
                className="text-[10px] h-7 px-2 rounded-none border-l-0 bg-blue-50 text-blue-800 hover:text-blue-900 hover:bg-blue-100 border-blue-200"
                onClick={() => setFilterType("DEVOIRS_FAITS")}
              >
                Devoirs F.
              </Button>
              <Button 
                variant={filterType === "AUTRE" ? "default" : "outline"} 
                size="sm" 
                className="text-[10px] h-7 px-2 rounded-l-none border-l-0 bg-yellow-50 text-yellow-800 hover:text-yellow-900 hover:bg-yellow-100 border-yellow-200"
                onClick={() => setFilterType("AUTRE")}
              >
                Autre
              </Button>
            </div>
            
            {/* Petite séparation */}
            <div className="h-7 border-l mx-1 hidden sm:block"></div>
            
            {/* Filtre par matière avec boîte de dialogue */}
            <div className="flex flex-wrap mt-1 sm:mt-0">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    Matière
                    {filterSubject && filterSubject !== 'all' && (
                      <Badge className="ml-1 text-[9px] px-1 py-0" variant="secondary">
                        {filterSubject === 'math' ? 'Maths' :
                         filterSubject === 'fra' ? 'Français' :
                         filterSubject === 'his' ? 'Hist-Géo' :
                         filterSubject === 'svt' ? 'SVT' :
                         filterSubject === 'phy' ? 'Phys-Chi' :
                         filterSubject === 'ang' ? 'Anglais' : ''}
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Sélectionner une matière</DialogTitle>
                    <DialogDescription>
                      Filtrez les sessions par matière enseignée
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 gap-2">
                      <div className="font-medium text-sm text-gray-700">Sciences</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant={filterSubject === 'math' ? 'default' : 'outline'} 
                                className={`${filterSubject === 'math' ? 'bg-blue-600' : ''}`}
                                onClick={() => { setFilterSubject('math'); }}>
                          Mathématiques
                        </Button>
                        <Button variant={filterSubject === 'svt' ? 'default' : 'outline'}
                                className={`${filterSubject === 'svt' ? 'bg-green-600' : ''}`}
                                onClick={() => { setFilterSubject('svt'); }}>
                          SVT
                        </Button>
                        <Button variant={filterSubject === 'phy' ? 'default' : 'outline'}
                                className={`${filterSubject === 'phy' ? 'bg-cyan-600' : ''}`}
                                onClick={() => { setFilterSubject('phy'); }}>
                          Physique-Chimie
                        </Button>
                        <Button variant={filterSubject === 'tech' ? 'default' : 'outline'}
                                className={`${filterSubject === 'tech' ? 'bg-slate-700' : ''}`}
                                onClick={() => { setFilterSubject('tech'); }}>
                          Technologie
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <div className="font-medium text-sm text-gray-700">Lettres & Langues</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant={filterSubject === 'fra' ? 'default' : 'outline'}
                                className={`${filterSubject === 'fra' ? 'bg-green-500' : ''}`}
                                onClick={() => { setFilterSubject('fra'); }}>
                          Français
                        </Button>
                        <Button variant={filterSubject === 'ang' ? 'default' : 'outline'}
                                className={`${filterSubject === 'ang' ? 'bg-amber-600' : ''}`}
                                onClick={() => { setFilterSubject('ang'); }}>
                          Anglais
                        </Button>
                        <Button variant={filterSubject === 'esp' ? 'default' : 'outline'}
                                className={`${filterSubject === 'esp' ? 'bg-red-600' : ''}`}
                                onClick={() => { setFilterSubject('esp'); }}>
                          Espagnol
                        </Button>
                        <Button variant={filterSubject === 'all' ? 'default' : 'outline'}
                                className={`${filterSubject === 'all' ? 'bg-gray-700' : ''}`}
                                onClick={() => { setFilterSubject('all'); }}>
                          Allemand
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <div className="font-medium text-sm text-gray-700">Sciences Humaines</div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant={filterSubject === 'his' ? 'default' : 'outline'}
                                className={`${filterSubject === 'his' ? 'bg-purple-600' : ''}`}
                                onClick={() => { setFilterSubject('his'); }}>
                          Histoire-Géo
                        </Button>
                        <Button variant={filterSubject === 'emc' ? 'default' : 'outline'}
                                className={`${filterSubject === 'emc' ? 'bg-violet-500' : ''}`}
                                onClick={() => { setFilterSubject('emc'); }}>
                          EMC
                        </Button>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setFilterSubject('all')}>
                      Toutes matières
                    </Button>
                    <DialogClose asChild>
                      <Button type="submit">Fermer</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Petite séparation */}
            <div className="h-7 border-l mx-1 hidden sm:block"></div>
            
            {/* On garde le menu déroulant pour les enseignants car il y en a beaucoup */}
            <div className="flex flex-wrap mt-1 sm:mt-0">
              <Select value={filterTeacher} onValueChange={setFilterTeacher}>
                <SelectTrigger className="w-[120px] h-7 text-[10px]">
                  <SelectValue placeholder="Enseignant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous enseignants</SelectItem>
                  <SelectItem value="MARTIN Jean">MARTIN Jean</SelectItem>
                  <SelectItem value="PETIT Marie">PETIT Marie</SelectItem>
                  <SelectItem value="DUBOIS Pierre">DUBOIS Pierre</SelectItem>
                  <SelectItem value="LEROY Sophie">LEROY Sophie</SelectItem>
                  <SelectItem value="GIRARD Laura">GIRARD Laura</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs sm:text-sm">Date</TableHead>
                <TableHead className="text-xs sm:text-sm">Enseignant</TableHead>
                <TableHead className="text-xs sm:text-sm">Type</TableHead>
                <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Détails</TableHead>
                <TableHead className="text-xs sm:text-sm">Statut</TableHead>
                {!isMobile && <TableHead className="text-xs sm:text-sm">Commentaire</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.map(session => (
                <TableRow key={session.id}>
                  <TableCell className="text-xs sm:text-sm p-2 sm:p-4">
                    <div className="font-medium">
                      {new Date(session.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="text-xs text-gray-500">{session.timeSlot}</div>
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm p-2 sm:p-4">
                    {session.teacherName} {isMobile ? session.teacherFirstName.charAt(0) + "." : session.teacherFirstName}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm p-2 sm:p-4">
                    <span className={`px-2 py-1 text-xs rounded-full inline-flex items-center ${
                      session.type === 'RCD' ? 'bg-purple-100 text-purple-800' :
                      session.type === 'DEVOIRS_FAITS' ? 'bg-blue-100 text-blue-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${
                        session.type === 'RCD' ? 'bg-purple-500' :
                        session.type === 'DEVOIRS_FAITS' ? 'bg-blue-500' :
                        'bg-yellow-500'
                      }`}></span>
                      {session.type === 'RCD' ? 'RCD' : 
                       session.type === 'DEVOIRS_FAITS' ? 'DF' : 'Autre'}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm p-2 sm:p-4 hidden sm:table-cell">
                    {session.type === 'RCD' ? (
                      <div className="whitespace-nowrap">
                        <span className="font-medium">{session.className}</span> - {session.replacedTeacherPrefix} {session.replacedTeacherLastName}
                      </div>
                    ) : session.type === 'DEVOIRS_FAITS' ? (
                      <div>
                        <span className="font-medium">{session.gradeLevel}</span> - {session.studentCount} élèves
                      </div>
                    ) : session.comment ? (
                      <div className="italic">{session.comment}</div>
                    ) : 'Autre activité'}
                  </TableCell>
                  <TableCell className="text-xs sm:text-sm p-2 sm:p-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      session.status === 'VALIDATED' ? 'bg-green-100 text-green-800' : 
                      session.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {session.status === 'VALIDATED' ? 'Validée' : 
                       session.status === 'REJECTED' ? 'Refusée' : 
                       'En attente'}
                    </span>
                  </TableCell>
                  {!isMobile && (
                    <TableCell className="text-xs sm:text-sm p-2 sm:p-4">
                      {session.comment ? (
                        <span className="text-gray-600 italic line-clamp-1">{session.comment}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {filteredSessions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucune séance ne correspond aux critères de filtrage
          </div>
        )}
      </div>
    </div>
  );
}

function ContractReview() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // Données fictives de contrats pour la démonstration
  const contracts: TeacherContract[] = [
    {
      id: 1,
      teacherId: 1,
      teacherName: "MARTIN",
      teacherFirstName: "Jean",
      contractNumber: "CT-2025-001",
      startDate: "2025-01-01",
      endDate: "2025-06-30",
      totalHours: 36,
      rcdHours: 18,
      devoirsFaitsHours: 18,
      completedRcdHours: 7,
      completedDevoirsFaitsHours: 9,
      completedOtherHours: 2,
      status: "ACTIVE"
    },
    {
      id: 2,
      teacherId: 2,
      teacherName: "PETIT",
      teacherFirstName: "Marie",
      contractNumber: "CT-2025-002",
      startDate: "2025-01-15",
      endDate: "2025-06-30",
      totalHours: 30,
      rcdHours: 15,
      devoirsFaitsHours: 15,
      completedRcdHours: 4,
      completedDevoirsFaitsHours: 12,
      completedOtherHours: 0,
      status: "ACTIVE"
    },
    {
      id: 3,
      teacherId: 3,
      teacherName: "LEROY",
      teacherFirstName: "Sophie",
      contractNumber: "CT-2025-003",
      startDate: "2025-02-01",
      endDate: "2025-06-30",
      totalHours: 24,
      rcdHours: 12,
      devoirsFaitsHours: 12,
      completedRcdHours: 2,
      completedDevoirsFaitsHours: 3,
      completedOtherHours: 4,
      status: "ACTIVE"
    }
  ];
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Suivi des contrats enseignants</h3>
        
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs sm:text-sm w-1/5">Enseignant</TableHead>
                <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Contrat</TableHead>
                <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Période</TableHead>
                <TableHead className="text-xs sm:text-sm w-1/5">RCD</TableHead>
                <TableHead className="text-xs sm:text-sm w-1/5">DF</TableHead>
                <TableHead className="text-xs sm:text-sm w-1/5">Total</TableHead>
                <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Progression</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map(contract => {
                const totalCompleted = contract.completedRcdHours + contract.completedDevoirsFaitsHours + contract.completedOtherHours;
                const progressPercentage = Math.round((totalCompleted / contract.totalHours) * 100);
                
                return (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium text-xs sm:text-sm p-2 sm:p-4">
                      {contract.teacherName} {isMobile ? contract.teacherFirstName.charAt(0) + "." : contract.teacherFirstName}
                      {isMobile && (
                        <div className="text-xs text-gray-500">
                          {contract.contractNumber}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{contract.contractNumber}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div>Du {new Date(contract.startDate).toLocaleDateString('fr-FR')}</div>
                      <div>Au {new Date(contract.endDate).toLocaleDateString('fr-FR')}</div>
                    </TableCell>
                    <TableCell className="p-2 sm:p-4 text-xs sm:text-sm">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <div className="sm:w-8 text-right">{contract.completedRcdHours}</div>
                        <div className="text-slate-400">/</div>
                        <div>{contract.rcdHours}h</div>
                      </div>
                    </TableCell>
                    <TableCell className="p-2 sm:p-4 text-xs sm:text-sm">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <div className="sm:w-8 text-right">{contract.completedDevoirsFaitsHours}</div>
                        <div className="text-slate-400">/</div>
                        <div>{contract.devoirsFaitsHours}h</div>
                      </div>
                    </TableCell>
                    <TableCell className="p-2 sm:p-4 text-xs sm:text-sm">
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <div className="sm:w-8 text-right">{totalCompleted}</div>
                        <div className="text-slate-400">/</div>
                        <div>{contract.totalHours}h</div>
                      </div>
                      {isMobile && (
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
                          <div 
                            className={`h-full ${
                              progressPercentage < 30 ? 'bg-red-500' : 
                              progressPercentage < 70 ? 'bg-yellow-500' : 
                              'bg-green-500'
                            }`} 
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            progressPercentage < 30 ? 'bg-red-500' : 
                            progressPercentage < 70 ? 'bg-yellow-500' : 
                            'bg-green-500'
                          }`} 
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-center mt-1">{progressPercentage}%</div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

function StatisticsView() {
  const isMobile = useIsMobile();
  
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-3 sm:p-6 border border-gray-200">
        <h3 className="text-md font-semibold mb-3">Statistiques globales</h3>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-purple-50 p-1 rounded-lg border border-purple-200 flex flex-col items-center justify-center aspect-square">
            <h4 className="text-[10px] font-medium text-purple-800 text-center">{isMobile ? "RCD" : "Total heures RCD"}</h4>
            <div className="text-lg font-bold text-purple-900 mt-0.5">42h</div>
            <div className="text-[8px] text-purple-700 mt-0">{isMobile ? "13 séan." : "13 séances validées"}</div>
          </div>
          
          <div className="bg-blue-50 p-1 rounded-lg border border-blue-200 flex flex-col items-center justify-center aspect-square">
            <h4 className="text-[10px] font-medium text-blue-800 text-center">{isMobile ? "Dev.F" : "Total Devoirs Faits"}</h4>
            <div className="text-lg font-bold text-blue-900 mt-0.5">56h</div>
            <div className="text-[8px] text-blue-700 mt-0">{isMobile ? "24 séan." : "24 séances validées"}</div>
          </div>
          
          <div className="bg-yellow-50 p-1 rounded-lg border border-yellow-200 flex flex-col items-center justify-center aspect-square">
            <h4 className="text-[10px] font-medium text-yellow-800 text-center">{isMobile ? "Autre" : "Autres activités"}</h4>
            <div className="text-lg font-bold text-yellow-900 mt-0.5">18h</div>
            <div className="text-[8px] text-yellow-700 mt-0">{isMobile ? "6 séan." : "6 séances validées"}</div>
          </div>
          
          <div className="bg-green-50 p-1 rounded-lg border border-green-200 flex flex-col items-center justify-center aspect-square">
            <h4 className="text-[10px] font-medium text-green-800 text-center">{isMobile ? "Total" : "Total global"}</h4>
            <div className="text-lg font-bold text-green-900 mt-0.5">116h</div>
            <div className="text-[8px] text-green-700 mt-0">{isMobile ? "43 séan." : "43 séances validées"}</div>
          </div>
        </div>
        
        <Separator className="my-2 sm:my-6" />
        
        <h4 className="text-[10px] sm:text-sm font-semibold mb-1 sm:mb-4">Répartition par mois</h4>
        <div className={`${isMobile ? 'h-28' : 'h-64'} flex items-end justify-between gap-1 px-0 sm:px-6`}>
          {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'].map((month, index) => {
            // Valeurs fictives pour la démo
            const rcdHeight = 20 + Math.floor(Math.random() * 30);
            const dfHeight = 15 + Math.floor(Math.random() * 35);
            const autreHeight = 5 + Math.floor(Math.random() * 15);
            
            return (
              <div key={month} className="flex flex-col items-center w-1/6">
                <div className="flex flex-col items-center w-full">
                  <div className="bg-yellow-400" style={{ height: `${autreHeight}px`, width: isMobile ? '95%' : '80%' }}></div>
                  <div className="bg-blue-400" style={{ height: `${dfHeight}px`, width: isMobile ? '95%' : '80%' }}></div>
                  <div className="bg-purple-400" style={{ height: `${rcdHeight}px`, width: isMobile ? '95%' : '80%' }}></div>
                </div>
                <div className="text-[8px] mt-0.5 sm:text-xs sm:mt-1">{month}</div>
              </div>
            );
          })}
        </div>
        
        <div className="flex flex-wrap justify-center mt-1 gap-1 sm:gap-6">
          <div className="flex items-center">
            <div className="w-1.5 h-1.5 sm:w-3 sm:h-3 bg-purple-400 rounded-full mr-0.5 sm:mr-2"></div>
            <span className="text-[8px] sm:text-xs">RCD</span>
          </div>
          <div className="flex items-center">
            <div className="w-1.5 h-1.5 sm:w-3 sm:h-3 bg-blue-400 rounded-full mr-0.5 sm:mr-2"></div>
            <span className="text-[8px] sm:text-xs">{isMobile ? "Dev.F" : "Devoirs Faits"}</span>
          </div>
          <div className="flex items-center">
            <div className="w-1.5 h-1.5 sm:w-3 sm:h-3 bg-yellow-400 rounded-full mr-0.5 sm:mr-2"></div>
            <span className="text-[8px] sm:text-xs">Autres</span>
          </div>
        </div>
      </div>
    </div>
  );
}