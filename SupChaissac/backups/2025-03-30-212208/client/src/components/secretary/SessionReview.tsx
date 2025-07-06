import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
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
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

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

export function SessionReview() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isSessionDetailModalOpen, setIsSessionDetailModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [feedback, setFeedback] = useState('');
  const [checkedAttachments, setCheckedAttachments] = useState<Record<number, boolean>>({});
  const [examinedSessions, setExaminedSessions] = useState<Record<number, boolean>>({});
  const [hoveredSessionId, setHoveredSessionId] = useState<number | null>(null);
  
  // Données fictives pour la démonstration
  const initialSessions: Session[] = [
    {
      id: 1,
      date: '2025-03-15',
      timeSlot: 'M3',
      type: 'RCD',
      status: 'PENDING_REVIEW',
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
      date: '2025-03-14',
      timeSlot: 'S2',
      type: 'DEVOIRS_FAITS',
      status: 'PENDING_REVIEW',
      gradeLevel: '5C',
      studentCount: 12,
      teacherName: 'PETIT',
      teacherFirstName: 'Marie',
      attachments: [
        {
          id: 1,
          name: 'liste_presence_5c_14032025.pdf',
          type: 'application/pdf',
          size: 245000,
          url: '#',
          isVerified: false
        },
        {
          id: 2,
          name: 'travail_effectue_5c.docx',
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 125000,
          url: '#',
          isVerified: false
        }
      ]
    },
    {
      id: 3,
      date: '2025-03-13',
      timeSlot: 'S1',
      type: 'AUTRE',
      status: 'PENDING_REVIEW',
      teacherName: 'LEROY',
      teacherFirstName: 'Sophie',
      attachments: [
        {
          id: 3,
          name: 'rapport_reunion.pdf',
          type: 'application/pdf',
          size: 350000,
          url: '#',
          isVerified: false
        }
      ]
    }
  ];
  
  const [pendingSessions, setPendingSessions] = useState<Session[]>(initialSessions);
  
  const handleViewSession = (session: Session) => {
    setSelectedSession(session);
    
    // Initialiser l'état des pièces jointes vérifiées
    const attachmentsState: Record<number, boolean> = {};
    session.attachments.forEach(attachment => {
      attachmentsState[attachment.id] = attachment.isVerified;
    });
    setCheckedAttachments(attachmentsState);
    
    setFeedback('');
    setIsSessionDetailModalOpen(true);
  };
  
  const toggleAttachmentCheck = (attachmentId: number) => {
    setCheckedAttachments(prev => ({
      ...prev,
      [attachmentId]: !prev[attachmentId]
    }));
  };
  
  const handleDownloadAttachment = (attachment: Attachment) => {
    // Dans une implémentation réelle, cette fonction téléchargerait le fichier
    console.log(`Téléchargement de ${attachment.name}`);
    
    // Simuler un téléchargement
    toast({
      title: "Téléchargement démarré",
      description: `Le fichier ${attachment.name} sera téléchargé dans quelques secondes.`
    });
  };
  
  const areAllAttachmentsVerified = () => {
    if (!selectedSession || selectedSession.attachments.length === 0) return true;
    
    return selectedSession.attachments.every(attachment => 
      checkedAttachments[attachment.id] === true
    );
  };
  
  const forwardToPrincipal = () => {
    if (!selectedSession) return;
    
    // Vérifier que toutes les pièces jointes ont été vérifiées
    if (!areAllAttachmentsVerified()) {
      toast({
        title: "Vérification incomplète",
        description: "Veuillez vérifier toutes les pièces jointes avant de transmettre.",
        variant: "destructive"
      });
      return;
    }
    
    // Vérifier si un commentaire a été ajouté pour demander des informations supplémentaires
    if (feedback.trim()) {
      // Dans une implémentation réelle, on enverrait une requête à l'API pour demander des infos à l'enseignant
      console.log(`Demande d'informations supplémentaires envoyée à l'enseignant pour la séance ${selectedSession.id}: ${feedback}`);
      
      toast({
        title: "Demande envoyée",
        description: "Un email a été envoyé à l'enseignant pour demander des informations supplémentaires."
      });
      
      // Marquer la session comme examinée
      setExaminedSessions(prev => ({
        ...prev,
        [selectedSession.id]: true
      }));
      
      setIsSessionDetailModalOpen(false);
      return;
    }
    
    // Dans une implémentation réelle, on enverrait une requête à l'API
    console.log(`Séance ${selectedSession.id} transmise au principal`);
    
    // Mettre à jour le statut dans pendingSessions
    setPendingSessions(prevSessions => prevSessions.map(session => 
      session.id === selectedSession.id 
        ? {...session, status: 'PENDING_VALIDATION'} 
        : session
    ));
    
    // Marquer la session comme examinée
    setExaminedSessions(prev => ({
      ...prev,
      [selectedSession.id]: true
    }));
    
    toast({
      title: "Séance transmise",
      description: "La séance a été transmise au principal pour validation."
    });
    
    setIsSessionDetailModalOpen(false);
  };
  
  // La fonction rejectSession a été supprimée car la secrétaire n'a pas la possibilité de refuser des séances
  
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
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Séances à examiner</h3>
        
        {pendingSessions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap text-xs sm:text-sm w-16 text-left">Date</TableHead>
                <TableHead className="text-xs sm:text-sm w-20 text-left">Enseignant</TableHead>
                <TableHead className="text-xs sm:text-sm w-16 text-left hidden sm:table-cell">Type</TableHead>
                <TableHead className="text-xs sm:text-sm w-16 text-left hidden sm:table-cell">Détails</TableHead>
                <TableHead className="text-xs sm:text-sm w-10 text-center">Justif.</TableHead>
                <TableHead className="text-right text-xs sm:text-sm w-14">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingSessions.map(session => (
                <TableRow key={session.id}>
                  <TableCell className="text-left p-2 sm:p-4">
                    <div className="font-medium whitespace-nowrap">
                      {new Date(session.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </div>
                    <div className={`text-xs font-medium ${
                        session.timeSlot.includes('Matin') ? 'text-sky-600' : 'text-amber-600'
                      }`}>{session.timeSlot}</div>
                  </TableCell>
                  <TableCell className="text-left p-2 sm:p-4">
                    {session.teacherName} {session.teacherFirstName.charAt(0)}.
                  </TableCell>
                  <TableCell className="text-left p-2 sm:p-4 hidden sm:table-cell">
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
                  <TableCell className="text-left p-2 sm:p-4 hidden sm:table-cell">
                    {session.type === 'RCD' ? (
                      <div className="whitespace-nowrap">
                        <span className="font-medium">{session.className}</span> - {session.replacedTeacherPrefix} {session.replacedTeacherLastName}
                      </div>
                    ) : session.type === 'DEVOIRS_FAITS' ? (
                      <div>
                        <span className="font-medium">{session.gradeLevel}</span> - {session.studentCount} élèves
                      </div>
                    ) : 'Autre activité'}
                  </TableCell>
                  <TableCell className="text-center p-2 sm:p-4 pl-8">
                    <Badge variant={session.attachments.length > 0 ? "default" : "outline"}>
                      {session.attachments.length}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right p-2 sm:p-4">
                    <div 
                      className="relative" 
                      onMouseEnter={() => setHoveredSessionId(session.id)}
                      onMouseLeave={() => setHoveredSessionId(null)}
                    >
                      <Button 
                        variant={examinedSessions[session.id] ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleViewSession(session)}
                        className={`py-1 px-2 h-auto text-xs ${
                          session.status === 'PAID' ? "bg-blue-600 hover:bg-blue-700 text-white" : 
                          examinedSessions[session.id] ? "bg-green-600 hover:bg-green-700 text-white" : ""
                        }`}
                      >
                        {session.status === 'PAID' ? (isMobile ? "💰" : "Payé") : 
                         examinedSessions[session.id] ? (isMobile ? "✓" : "Traiter paiement") : 
                         (isMobile ? "👁️" : "Examiner")}
                      </Button>
                      
                      {/* Icône de modification qui apparaît au survol si la séance est examinée */}
                      {!isMobile && examinedSessions[session.id] && hoveredSessionId === session.id && (
                        <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-gray-100 rounded-full p-1 shadow-md cursor-pointer">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-4 w-4 text-gray-600" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewSession(session);
                            }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Aucune séance en attente d'examen
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
                  <span className={`inline-block h-3 w-3 rounded-full ${
                    selectedSession.type === 'RCD' ? 'bg-purple-500' :
                    selectedSession.type === 'DEVOIRS_FAITS' ? 'bg-blue-500' :
                    'bg-yellow-500'
                  }`}></span>
                  Examen de séance
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
                  <div className="grid grid-cols-2 gap-4 mt-4">
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
                  <div className="grid grid-cols-2 gap-4 mt-4">
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
                
                {/* Section des pièces jointes */}
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-lg">Justificatifs</Label>
                    <Badge variant={selectedSession.attachments.length > 0 ? "default" : "outline"}>
                      {selectedSession.attachments.length}
                    </Badge>
                  </div>
                  
                  {selectedSession.attachments.length > 0 ? (
                    <div className="border rounded-md divide-y">
                      {selectedSession.attachments.map(attachment => (
                        <div key={attachment.id} className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {getFileIcon(attachment.type)}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{attachment.name}</div>
                              <div className="text-xs text-gray-500">{formatFileSize(attachment.size)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDownloadAttachment(attachment)}
                              className="h-8 w-8 p-0"
                              title="Télécharger"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                              </svg>
                            </Button>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id={`attachment-${attachment.id}`}
                                checked={checkedAttachments[attachment.id] || false}
                                onCheckedChange={() => toggleAttachmentCheck(attachment.id)}
                              />
                              <label
                                htmlFor={`attachment-${attachment.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Vérifié
                              </label>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 border rounded-md">
                      Aucune pièce jointe pour cette séance
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <Label htmlFor="feedback">Commentaire pour l'enseignant</Label>
                  <Textarea 
                    id="feedback" 
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Précisez ici si des informations ou pièces jointes supplémentaires sont nécessaires..." 
                    className="mt-2"
                  />
                </div>
              </div>
              
              <DialogFooter className="flex flex-col sm:flex-row gap-2 w-full">
                <Button 
                  variant="outline" 
                  onClick={() => setIsSessionDetailModalOpen(false)}
                  className="w-full sm:w-auto flex-1"
                >
                  Fermer
                </Button>
                <Button 
                  onClick={forwardToPrincipal}
                  className={`w-full sm:w-auto flex-1 ${
                    selectedSession && selectedSession.status === 'VALIDATED' ? 
                      "bg-green-700 hover:bg-green-800" : 
                      "bg-green-600 hover:bg-green-700"
                  }`}
                  disabled={!areAllAttachmentsVerified()}
                >
                  {selectedSession && selectedSession.status === 'VALIDATED'
                    ? (isMobile ? "Payer" : "Mettre en paiement")
                    : feedback.trim() 
                      ? (isMobile ? "Demander infos" : "Demander des informations") 
                      : (isMobile ? "Transmettre" : "Transmettre au principal")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}