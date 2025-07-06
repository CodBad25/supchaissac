import { createContext, ReactNode, useContext } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Session, InsertSession } from "@shared/schema";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type SessionContextType = {
  sessions: Session[];
  isLoading: boolean;
  error: Error | null;
  createSessionMutation: any;
  updateSessionMutation: any;
  deleteSessionMutation: any;
  getTeacherSetup: any;
  updateTeacherSetup: any;
  updateSignature: any;
};

// Mock empty state to prevent dependency cycles
const initialState = {
  sessions: [],
  isLoading: false,
  error: null,
  createSessionMutation: {},
  updateSessionMutation: {},
  deleteSessionMutation: {},
  getTeacherSetup: {},
  updateTeacherSetup: {},
  updateSignature: {}
};

const SessionContext = createContext<SessionContextType>(initialState);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Fetch all sessions
  const { 
    data: sessions = [], 
    isLoading,
    error
  } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Create a new session
  const createSessionMutation = useMutation({
    mutationFn: async (sessionData: InsertSession) => {
      const res = await apiRequest("POST", "/api/sessions", sessionData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "Séance ajoutée",
        description: "La séance a été enregistrée avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'ajout de la séance",
        variant: "destructive",
      });
    },
  });

  // Update an existing session
  const updateSessionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Session> }) => {
      const res = await apiRequest("PATCH", `/api/sessions/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "Séance mise à jour",
        description: "La séance a été mise à jour avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour de la séance",
        variant: "destructive",
      });
    },
  });

  // Delete a session
  const deleteSessionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/sessions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "Séance supprimée",
        description: "La séance a été supprimée avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la suppression de la séance",
        variant: "destructive",
      });
    },
  });

  // Get teacher setup
  const getTeacherSetup = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/api/teacher-setup");
      return res.json();
    },
  });

  // Update teacher setup
  const updateTeacherSetup = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/teacher-setup", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Configuration mise à jour",
        description: "Vos préférences ont été enregistrées",
      });
    },
  });

  // Update user signature
  const updateSignature = useMutation({
    mutationFn: async (signature: string) => {
      const res = await apiRequest("PATCH", "/api/user/signature", { signature });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Signature enregistrée",
        description: "Votre signature a été enregistrée avec succès",
      });
    },
  });

  return (
    <SessionContext.Provider
      value={{
        sessions,
        isLoading,
        error,
        createSessionMutation,
        updateSessionMutation,
        deleteSessionMutation,
        getTeacherSetup,
        updateTeacherSetup,
        updateSignature
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
