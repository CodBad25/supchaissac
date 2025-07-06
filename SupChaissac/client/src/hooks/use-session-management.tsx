import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { mockSessions, mockAttachments, getTeacherSessions, getSessionAttachments, simulateApiDelay } from '@/data/mockData';

// Type pour les sessions
export interface Session {
  id: number;
  date: string; // Format YYYY-MM-DD
  timeSlot: string; // M1, M2, etc.
  type: 'RCD' | 'DEVOIRS_FAITS' | 'HSE' | 'AUTRE';
  originalType: 'RCD' | 'DEVOIRS_FAITS' | 'HSE' | 'AUTRE'; // Type initial (ne change jamais)
  teacherId?: number;
  teacherName: string;
  teacherFirstName?: string;
  inPacte?: boolean;
  status: 'SUBMITTED' | 'INCOMPLETE' | 'REVIEWED' | 'VALIDATED' | 'READY_FOR_PAYMENT' | 'PAID' | 'REJECTED';
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  
  // Fields specific to RCD
  replacedTeacherPrefix?: string;
  replacedTeacherLastName?: string;
  replacedTeacherFirstName?: string;
  replacedTeacherName?: string;
  className?: string;
  subject?: string;
  comment?: string;
  
  // Fields specific to Devoirs Faits
  studentCount?: number;
  gradeLevel?: string;
  
  // Fields specific to HSE and Autre
  description?: string;
  
  // Attachments
  attachments?: Attachment[];
};

// Type pour une pièce jointe
export interface Attachment {
  id: number;
  name: string;
  type: string;
  size: number;
  url: string;
  isVerified: boolean;
};

export function useSessionManagement(options?: { 
  teacherId?: number, 
  status?: string,
  type?: string,
  startDate?: string,
  endDate?: string
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  
  // Construire la clé de requête en fonction des options
  const queryKey = ['/api/sessions'];
  if (options?.teacherId) queryKey.push(`teacher:${options.teacherId}`);
  if (options?.status) queryKey.push(`status:${options.status}`);
  if (options?.type) queryKey.push(`type:${options.type}`);
  if (options?.startDate) queryKey.push(`startDate:${options.startDate}`);
  if (options?.endDate) queryKey.push(`endDate:${options.endDate}`);
  
  // Récupérer les sessions avec les filtres appropriés
  const { 
    data: sessions = mockSessions, 
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      // Simuler un délai d'API pour un effet plus réaliste
      await simulateApiDelay(800);
      
      // Filtrer les sessions en fonction des options
      let filteredSessions = [...mockSessions];
      
      if (options?.teacherId) {
        filteredSessions = getTeacherSessions(options.teacherId);
      }
      
      if (options?.status) {
        filteredSessions = filteredSessions.filter(session => session.status === options.status);
      }
      
      if (options?.type) {
        filteredSessions = filteredSessions.filter(session => session.type === options.type);
      }
      
      if (options?.startDate) {
        const startDate = options.startDate;
        filteredSessions = filteredSessions.filter(session => session.date >= startDate);
      }
      
      if (options?.endDate) {
        const endDate = options.endDate;
        filteredSessions = filteredSessions.filter(session => session.date <= endDate);
      }
      
      // Ajouter les pièces jointes aux sessions
      filteredSessions = filteredSessions.map(session => {
        const attachments = getSessionAttachments(session.id);
        return {
          ...session,
          attachments: attachments.length > 0 ? attachments : undefined
        };
      });
      
      return filteredSessions;
    },
    enabled: true // Toujours activé pour les données de test
  });
  
  // Mutation pour créer une nouvelle session
  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: Partial<Session>) => {
      // Simuler un délai d'API
      await simulateApiDelay(1000);
      
      // Simuler la création d'une nouvelle session
      const newSession: Session = {
        id: Math.max(...mockSessions.map(s => s.id)) + 1,
        date: sessionData.date || new Date().toISOString().split('T')[0],
        timeSlot: sessionData.timeSlot || 'M1',
        type: sessionData.type as 'RCD' | 'DEVOIRS_FAITS' | 'HSE' | 'AUTRE' || 'AUTRE',
        originalType: sessionData.type as 'RCD' | 'DEVOIRS_FAITS' | 'HSE' | 'AUTRE' || 'AUTRE',
        status: 'SUBMITTED',
        teacherName: sessionData.teacherName || 'MARTIN',
        teacherFirstName: sessionData.teacherFirstName || 'Sophie',
        createdAt: new Date().toISOString(),
        ...sessionData
      };
      
      // Ajouter la nouvelle session aux données de test
      mockSessions.push(newSession);
      
      return newSession;
    },
    onSuccess: () => {
      // Simuler l'invalidation de la requête
      setTimeout(() => refetch(), 100);
      
      toast({
        title: "Séance créée",
        description: "La séance a été créée avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Mutation pour mettre à jour une session existante
  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Session> }) => {
      // Simuler un délai d'API
      await simulateApiDelay(800);
      
      // Trouver la session à mettre à jour
      const sessionIndex = mockSessions.findIndex(s => s.id === id);
      if (sessionIndex === -1) {
        throw new Error("Session non trouvée");
      }
      
      // Mettre à jour la session
      const updatedSession = {
        ...mockSessions[sessionIndex],
        ...data,
        updatedAt: new Date().toISOString(),
        updatedBy: 'LAMBERT Claire' // Simuler un utilisateur secrétaire
      };
      
      // Remplacer la session dans le tableau
      mockSessions[sessionIndex] = updatedSession;
      
      return updatedSession;
    },
    onSuccess: () => {
      // Simuler l'invalidation de la requête
      setTimeout(() => refetch(), 100);
      
      toast({
        title: "Séance mise à jour",
        description: "La séance a été mise à jour avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Mutation pour supprimer une session
  const deleteSessionMutation = useMutation({
    mutationFn: async (id: number) => {
      // Simuler un délai d'API
      await simulateApiDelay(800);
      
      // Trouver l'index de la session à supprimer
      const sessionIndex = mockSessions.findIndex(s => s.id === id);
      if (sessionIndex === -1) {
        throw new Error("Session non trouvée");
      }
      
      // Supprimer la session du tableau
      mockSessions.splice(sessionIndex, 1);
      
      return true;
    },
    onSuccess: () => {
      // Simuler l'invalidation de la requête
      setTimeout(() => refetch(), 100);
      
      toast({
        title: "Séance supprimée",
        description: "La séance a été supprimée avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Mutation pour valider une session (spécifique au rôle principal)
  const validateSessionMutation = useMutation({
    mutationFn: async ({ id, type, comment }: { id: number; type?: string; comment?: string }) => {
      // Simuler un délai d'API
      await simulateApiDelay(800);
      
      // Trouver la session à valider
      const sessionIndex = mockSessions.findIndex(s => s.id === id);
      if (sessionIndex === -1) {
        throw new Error("Session non trouvée");
      }
      
      // Mettre à jour la session
      const updatedSession: Session = {
        ...mockSessions[sessionIndex],
        status: "VALIDATED" as const,
        type: (type as 'RCD' | 'DEVOIRS_FAITS' | 'HSE' | 'AUTRE') || mockSessions[sessionIndex].type,
        comment: comment,
        updatedAt: new Date().toISOString(),
        updatedBy: 'LAMBERT Claire' // Simuler un utilisateur secrétaire
      };
      
      // Remplacer la session dans le tableau
      mockSessions[sessionIndex] = updatedSession;
      
      return updatedSession;
    },
    onSuccess: () => {
      // Simuler l'invalidation de la requête
      setTimeout(() => refetch(), 100);
      
      toast({
        title: "Séance validée",
        description: "La séance a été validée avec succès.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Mutation pour rejeter une session
  const rejectSessionMutation = useMutation({
    mutationFn: async ({ id, comment }: { id: number; comment?: string }) => {
      // Simuler un délai d'API
      await simulateApiDelay(800);
      
      // Trouver la session à rejeter
      const sessionIndex = mockSessions.findIndex(s => s.id === id);
      if (sessionIndex === -1) {
        throw new Error("Session non trouvée");
      }
      
      // Mettre à jour la session
      const updatedSession: Session = {
        ...mockSessions[sessionIndex],
        status: "REJECTED" as const,
        comment: comment ? `Rejeté: ${comment}` : undefined,
        updatedAt: new Date().toISOString(),
        updatedBy: 'LAMBERT Claire' // Simuler un utilisateur secrétaire
      };
      
      // Remplacer la session dans le tableau
      mockSessions[sessionIndex] = updatedSession;
      
      return updatedSession;
    },
    onSuccess: () => {
      // Simuler l'invalidation de la requête
      setTimeout(() => refetch(), 100);
      
      toast({
        title: "Séance rejetée",
        description: "La séance a été rejetée.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Fonction pour télécharger une pièce jointe
  const downloadAttachment = (attachment: Attachment) => {
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
  
  // Fonction pour formater la taille d'un fichier
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return {
    sessions,
    isLoading,
    error,
    refetch,
    selectedSession,
    setSelectedSession,
    createSession: createSessionMutation.mutate,
    updateSession: updateSessionMutation.mutate,
    deleteSession: deleteSessionMutation.mutate,
    validateSession: validateSessionMutation.mutate,
    rejectSession: rejectSessionMutation.mutate,
    downloadAttachment,
    formatFileSize
  };
}
