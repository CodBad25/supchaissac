import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart,
  Clock,
  History as HistoryIcon,
  Calendar,
  CheckCircle,
  DollarSign,
  TrendingUp,
  BookOpen,
  Users,
  FileText,
  LogOut,
  Hourglass
} from 'lucide-react';
import SmartCalendar from '../components/SmartCalendar';
import SessionModals from '../components/SessionModals';
import { components, cn, getStatusClasses } from '../styles/theme';
import { API_BASE_URL } from '../config/api';

interface Session {
  id: number;
  type: 'RCD' | 'DEVOIRS_FAITS' | 'AUTRE';
  status: 'PENDING_REVIEW' | 'PENDING_VALIDATION' | 'VALIDATED' | 'PAID' | 'REJECTED';
  date: string;
  timeSlot: string;
  className?: string;
  replacedTeacherName?: string;
  studentCount?: number;
  description?: string;
  createdAt: string;
}

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  civilite?: 'M.' | 'Mme';
  subject?: string;
  role: 'TEACHER' | 'SECRETARY' | 'PRINCIPAL' | 'ADMIN';
  inPacte: boolean;
  pacteHoursTarget?: number;
  pacteHoursCompleted?: number;
}

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'history'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [editSession, setEditSession] = useState<Session | null>(null);

  // Récupérer les vraies données utilisateur depuis l'API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Fallback si l'API n'est pas disponible
          setUser({
            id: 1,
            email: 'teacher1@example.com',
            firstName: 'Sophie',
            lastName: 'MARTIN',
            civilite: 'Mme',
            subject: 'Mathématiques',
            role: 'TEACHER',
            inPacte: false,
            pacteHoursTarget: 0,
            pacteHoursCompleted: 0
          });
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données utilisateur:', error);
        // Fallback en cas d'erreur
        setUser({
          id: 1,
          email: 'teacher1@example.com',
          firstName: 'Sophie',
          lastName: 'MARTIN',
          civilite: 'Mme',
          subject: 'Mathématiques',
          role: 'TEACHER',
          inPacte: false,
          pacteHoursTarget: 0,
          pacteHoursCompleted: 0
        });
      }
    };

    fetchUserData();

    // Charger les sessions depuis l'API
    const fetchSessions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/sessions`, {
          credentials: 'include',
        });

        if (response.ok) {
          const sessionsData = await response.json();
          setSessions(sessionsData);
          console.log('Sessions chargées:', sessionsData.length);
        } else {
          console.warn('Impossible de charger les sessions depuis l\'API');
          setSessions([]);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des sessions:', error);
        setSessions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // Calculer les statistiques
  const stats = {
    totalHours: sessions.filter(s => s.type === 'RCD' || s.type === 'DEVOIRS_FAITS').length,
    rcdHours: sessions.filter(s => s.type === 'RCD').length,
    devoirsFaitsHours: sessions.filter(s => s.type === 'DEVOIRS_FAITS').length,
    otherHours: sessions.filter(s => s.type === 'AUTRE').length,
    pendingHours: sessions.filter(s => s.status === 'PENDING_REVIEW').length,
    validatedHours: sessions.filter(s => s.status === 'VALIDATED').length,
    paidHours: sessions.filter(s => s.status === 'PAID').length
  };

  // Calculer le pourcentage de progression PACTE
  const pactePercentage = user?.pacteHoursTarget
    ? Math.min(100, Math.round(((user.pacteHoursCompleted || 0) / user.pacteHoursTarget) * 100))
    : 0;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'RCD': return <Users className="w-4 h-4" />;
      case 'DEVOIRS_FAITS': return <BookOpen className="w-4 h-4" />;
      case 'AUTRE': return <FileText className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeColors = (type: string) => {
    switch (type) {
      case 'RCD': return { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-l-purple-500' };
      case 'DEVOIRS_FAITS': return { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-l-blue-500' };
      case 'AUTRE': return { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-l-amber-500' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-l-gray-500' };
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        navigate('/login');
      } else {
        alert('Erreur lors de la déconnexion');
      }
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      alert('Erreur réseau lors de la déconnexion');
    }
  };

  // Gestion de la création de sessions
  const handleCreateSession = (date: string, timeSlot: string) => {
    setSelectedDate(date);
    setSelectedTimeSlot(timeSlot);
    setEditSession(null); // Mode creation
    setModalOpen(true);
  };

  // Gestion de l'edition de sessions
  const handleEditSession = (session: any) => {
    setSelectedDate(session.date);
    setSelectedTimeSlot(session.timeSlot);
    setEditSession(session);
    setModalOpen(true);
  };

  const handleSubmitSession = async (sessionData: any) => {
    try {
      // Préparer les données pour l'API selon le schéma DB
      const apiData = {
        date: sessionData.date,
        timeSlot: sessionData.timeSlot,
        type: sessionData.type,
        // Les champs teacherId et teacherName seront ajoutés côté serveur
        
        // Champs spécifiques selon le type
        ...(sessionData.type === 'RCD' && {
          className: sessionData.className,
          replacedTeacherPrefix: sessionData.replacedTeacherPrefix,
          replacedTeacherLastName: sessionData.replacedTeacherLastName,
          replacedTeacherFirstName: sessionData.replacedTeacherFirstName,
          subject: sessionData.subject,
          comment: sessionData.comment
        }),
        
        ...(sessionData.type === 'DEVOIRS_FAITS' && {
          gradeLevel: sessionData.gradeLevel,
          studentCount: sessionData.studentCount,
          comment: sessionData.comment
        }),
        
        ...(sessionData.type === 'AUTRE' && {
          description: sessionData.description,
          comment: sessionData.comment
        })
      };

      // Envoyer à l'API (à implémenter côté serveur)
      const response = await fetch(`${API_BASE_URL}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erreur API:', errorData);
        throw new Error(errorData.error || 'Erreur lors de la création de la session');
      }

      const newSession = await response.json();

      // Upload du fichier si présent (pour DEVOIRS_FAITS)
      if (sessionData.attachment && sessionData.attachment instanceof File) {
        try {
          const formData = new FormData();
          formData.append('file', sessionData.attachment);

          const uploadResponse = await fetch(`${API_BASE_URL}/api/attachments/upload/${newSession.id}`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            console.log('Fichier uploadé:', uploadResult);
          } else {
            console.error('Erreur upload fichier:', await uploadResponse.text());
          }
        } catch (uploadError) {
          console.error('Erreur upload:', uploadError);
          // On ne bloque pas la création de session si l'upload échoue
        }
      }

      // Ajouter la session à l'état local
      setSessions(prev => [...prev, newSession]);

      console.log('Session créée avec succès:', newSession);

    } catch (error) {
      console.error('Erreur lors de la création de la session:', error);
      // Re-lancer l'erreur pour que la modale puisse l'attraper
      throw error;
    }
  };

  // Gestion de la mise a jour de sessions
  const handleUpdateSession = async (sessionId: number, sessionData: any) => {
    try {
      const apiData = {
        date: sessionData.date,
        timeSlot: sessionData.timeSlot,
        type: sessionData.type,

        ...(sessionData.type === 'RCD' && {
          className: sessionData.className,
          replacedTeacherPrefix: sessionData.replacedTeacherPrefix,
          replacedTeacherLastName: sessionData.replacedTeacherLastName,
          replacedTeacherFirstName: sessionData.replacedTeacherFirstName,
          subject: sessionData.subject,
          comment: sessionData.comment
        }),

        ...(sessionData.type === 'DEVOIRS_FAITS' && {
          gradeLevel: sessionData.gradeLevel,
          studentCount: sessionData.studentCount,
          comment: sessionData.comment
        }),

        ...(sessionData.type === 'AUTRE' && {
          description: sessionData.description,
          comment: sessionData.comment
        })
      };

      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erreur API:', errorData);
        throw new Error(errorData.error || 'Erreur lors de la modification de la session');
      }

      const updatedSession = await response.json();

      // Upload du fichier si présent (pour DEVOIRS_FAITS)
      if (sessionData.attachment && sessionData.attachment instanceof File) {
        try {
          const formData = new FormData();
          formData.append('file', sessionData.attachment);

          const uploadResponse = await fetch(`${API_BASE_URL}/api/attachments/upload/${sessionId}`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            console.log('Fichier uploadé:', uploadResult);
          } else {
            console.error('Erreur upload fichier:', await uploadResponse.text());
          }
        } catch (uploadError) {
          console.error('Erreur upload:', uploadError);
        }
      }

      // Mettre a jour la session dans l'etat local
      setSessions(prev => prev.map(s => s.id === sessionId ? updatedSession : s));

      console.log('Session modifiee avec succes:', updatedSession);

    } catch (error) {
      console.error('Erreur lors de la modification de la session:', error);
      throw error;
    }
  };

  const handleDeleteSession = async (sessionId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erreur API:', errorData);
        throw new Error(errorData.error || 'Erreur lors de la suppression de la session');
      }

      // Supprimer la session de l'etat local
      setSessions(prev => prev.filter(s => s.id !== sessionId));

      console.log('Session supprimee avec succes:', sessionId);

    } catch (error) {
      console.error('Erreur lors de la suppression de la session:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50 flex items-center justify-center overflow-x-hidden">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50 overflow-x-hidden w-full max-w-full">
      {/* Header - Ultra Compact Mobile */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-2 sm:px-6 py-1 sm:py-4">
          <div className="flex justify-between items-center">
            {/* Logo + Title - Micro */}
            <div className="flex items-center space-x-1.5">
              <img 
                src="/images/logo_supchaissac_v5_minimaliste (1).png" 
                alt="Logo" 
                className="w-6 h-6 sm:w-10 sm:h-10 object-contain"
              />
              <div>
                <h1 className="text-sm sm:text-2xl font-bold text-gray-800">
                  Sup<span className="text-yellow-500">Chaissac</span>
                </h1>
                {/* Statut PACTE mobile */}
                <div className="sm:hidden">
                  <span className={`inline-block px-1.5 py-0.5 rounded-full text-xs font-medium ${
                    user?.inPacte ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user?.inPacte ? 'PACTE' : 'Sans PACTE'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Actions - Micro */}
            <div className="flex items-center space-x-1.5">
              {/* Desktop user info */}
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-800">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    user?.inPacte ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user?.inPacte ? 'Avec PACTE' : 'Sans PACTE'}
                  </span>
                </div>
              </div>
              
              {/* Mobile user initial - Plus petit */}
              <div className="sm:hidden w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              
              {/* Logout - Micro */}
              <button
                onClick={handleLogout}
                className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                title="Déconnexion"
              >
                <LogOut className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation - Ultra Compact Mobile */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-2 sm:px-6">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 sm:flex-none py-1.5 sm:py-4 px-1 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center space-y-0 sm:space-y-0 sm:space-x-2">
                <PieChart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Dashboard</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex-1 sm:flex-none py-1.5 sm:py-4 px-1 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                activeTab === 'calendar'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center space-y-0 sm:space-y-0 sm:space-x-2">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Déclarer</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 sm:flex-none py-1.5 sm:py-4 px-1 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                activeTab === 'history'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center space-y-0 sm:space-y-0 sm:space-x-2">
                <HistoryIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Historique</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content - Ultra Compact */}
      <div className="px-2 sm:px-6 py-2 sm:py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            {/* Stats Cards - Layout équilibré */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Total Hours */}
              <div className={cn(components.card.simple, "p-4")}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalHours}</p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
              </div>

              {/* Pending Hours */}
              <div className={cn(components.card.simple, "p-4")}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">En attente</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pendingHours}</p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Hourglass className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
              </div>

              {/* Validated Hours */}
              <div className={cn(components.card.simple, "p-4")}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Validées</p>
                    <p className="text-2xl font-bold text-green-600">{stats.validatedHours}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </div>

              {/* Paid Hours */}
              <div className={cn(components.card.simple, "p-4")}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Payées</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.paidHours}</p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* PACTE - Seulement si l'enseignant a le PACTE */}
            {user?.inPacte && (
              <div className={cn(components.card.simple, "p-4")}>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 text-yellow-500 mr-2" />
                  Suivi PACTE
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Progression</span>
                    <span className="text-sm font-bold text-gray-900">
                      {user.pacteHoursCompleted || 0} / {user.pacteHoursTarget || '?'} heures
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${pactePercentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Objectif annuel</span>
                    <span className="text-sm font-bold text-yellow-600">{pactePercentage}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Sessions - Layout équilibré */}
            <div className={cn(components.card.simple, "p-0 overflow-hidden")}>
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Sessions récentes</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {sessions.slice(0, 4).map((session) => {
                  const statusClasses = getStatusClasses(session.status);
                  const typeColors = getTypeColors(session.type);
                  return (
                    <div
                      key={session.id}
                      className={`px-4 py-3 hover:bg-gray-50 transition-colors border-l-4 ${typeColors.border}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className={`w-9 h-9 ${typeColors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <span className={typeColors.text}>{getTypeIcon(session.type)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {session.type === 'RCD' && `RCD - ${session.className}`}
                              {session.type === 'DEVOIRS_FAITS' && `Devoirs Faits (${session.studentCount} élève${(session.studentCount || 0) > 1 ? 's' : ''})`}
                              {session.type === 'AUTRE' && 'Autre'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {new Date(session.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} - {session.timeSlot}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <span className={cn(components.badge.base, statusClasses.full)}>
                            {statusClasses.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <SmartCalendar
            sessions={sessions}
            onCreateSession={handleCreateSession}
            onEditSession={handleEditSession}
          />
        )}

        {activeTab === 'history' && (
          <div className={cn(components.card.glass)}>
            <div className="text-center">
              <HistoryIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Historique</h3>
              <p className="text-gray-600">L'historique complet sera implémenté dans la prochaine étape.</p>
            </div>
          </div>
        )}
      </div>

      {/* Modales de création/modification de session */}
      {user && (
        <SessionModals
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditSession(null);
          }}
          date={selectedDate}
          timeSlot={selectedTimeSlot}
          onSubmit={handleSubmitSession}
          onUpdate={handleUpdateSession}
          onDelete={handleDeleteSession}
          editSession={editSession}
          user={user}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;
