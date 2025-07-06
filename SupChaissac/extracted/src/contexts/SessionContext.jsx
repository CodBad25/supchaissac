
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from '@/components/ui/use-toast';

const SessionContext = createContext();

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

export function SessionProvider({ children }) {
  const [selectedSessions, setSelectedSessions] = useState([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Charger les sessions au démarrage
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = () => {
    const savedSessions = localStorage.getItem('allSessions');
    if (savedSessions) {
      setSelectedSessions(JSON.parse(savedSessions));
    }
  };

  const saveSessions = (sessions) => {
    localStorage.setItem('allSessions', JSON.stringify(sessions));
  };

  const addSession = (sessionData) => {
    const teacherSetup = JSON.parse(localStorage.getItem('teacherSetup') || '{}');
    
    const newSession = {
      ...sessionData,
      id: Date.now(),
      status: 'PENDING_REVIEW',
      teacherId: user.id,
      teacherName: user.name,
      inPacte: teacherSetup.inPacte,
      createdAt: new Date().toISOString()
    };

    setSelectedSessions(prev => {
      const updated = [...prev, newSession];
      saveSessions(updated);
      return updated;
    });

    toast({
      title: "Séance ajoutée",
      description: "La séance a été enregistrée avec succès",
    });
  };

  const updateSessionStatus = (sessionId, newStatus, newType = null) => {
    setSelectedSessions(prev => {
      const updated = prev.map(session => 
        session.id === sessionId 
          ? { 
              ...session, 
              status: newStatus,
              type: newType || session.type,
              updatedAt: new Date().toISOString(),
              updatedBy: user.name
            }
          : session
      );
      saveSessions(updated);
      return updated;
    });

    const statusMessages = {
      'PENDING_VALIDATION': 'La séance a été transmise au principal',
      'VALIDATED': 'La séance a été validée',
      'REJECTED': 'La séance a été refusée',
      'PAID': 'La séance a été marquée comme payée'
    };

    toast({
      title: "Statut mis à jour",
      description: statusMessages[newStatus] || "Le statut a été mis à jour",
    });
  };

  const deleteSession = (sessionId) => {
    setSelectedSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      saveSessions(updated);
      return updated;
    });

    toast({
      title: "Séance supprimée",
      description: "La séance a été supprimée avec succès",
    });
  };

  // Filtrer les sessions selon le rôle
  const getFilteredSessions = () => {
    if (!user) return [];

    switch (user.role) {
      case 'TEACHER':
        return selectedSessions.filter(s => s.teacherId === user.id);
      case 'SECRETARY':
        return selectedSessions;
      case 'PRINCIPAL':
        return selectedSessions;
      default:
        return [];
    }
  };

  const value = {
    selectedSessions: getFilteredSessions(),
    addSession,
    updateSessionStatus,
    deleteSession,
    loadSessions
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}
