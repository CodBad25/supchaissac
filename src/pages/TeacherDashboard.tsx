import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart,
  Clock,
  Calendar,
  CheckCircle,
  DollarSign,
  BookOpen,
  Users,
  FileText,
  LogOut,
  Hourglass,
  ArrowRight
} from 'lucide-react';
import SmartCalendar from '../components/SmartCalendar';
import SessionModals from '../components/SessionModals';
import { components, cn, getStatusClasses } from '../styles/theme';
import { API_BASE_URL } from '../config/api';

interface Session {
  id: number;
  type: 'RCD' | 'DEVOIRS_FAITS' | 'AUTRE' | 'HSE';
  originalType?: 'RCD' | 'DEVOIRS_FAITS' | 'AUTRE' | 'HSE' | null; // Type avant conversion
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
  pacteHoursDF?: number;
  pacteHoursRCD?: number;
  pacteHoursCompletedDF?: number;
  pacteHoursCompletedRCD?: number;
}

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [editSession, setEditSession] = useState<Session | null>(null);
  const [duplicateData, setDuplicateData] = useState<any>(null);

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
    totalHours: sessions.filter(s => s.type === 'RCD' || s.type === 'DEVOIRS_FAITS' || s.type === 'HSE').length,
    rcdHours: sessions.filter(s => s.type === 'RCD').length,
    devoirsFaitsHours: sessions.filter(s => s.type === 'DEVOIRS_FAITS').length,
    hseHours: sessions.filter(s => s.type === 'HSE').length,
    otherHours: sessions.filter(s => s.type === 'AUTRE').length,
    pendingHours: sessions.filter(s => s.status === 'PENDING_REVIEW').length,
    validatedHours: sessions.filter(s => s.status === 'VALIDATED').length,
    paidHours: sessions.filter(s => s.status === 'PAID').length
  };

  // Calculer le pourcentage de progression PACTE
  const pactePercentage = user?.pacteHoursTarget
    ? Math.min(100, Math.round(((user.pacteHoursCompleted || 0) / user.pacteHoursTarget) * 100))
    : 0;

  // Calculer les stats par semaine (4 dernières semaines)
  const getWeeklyStats = () => {
    const weeks: { label: string; count: number; startDate: Date }[] = [];
    const today = new Date();

    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1 - (i * 7)); // Lundi de la semaine
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const count = sessions.filter(s => {
        const sessionDate = new Date(s.date);
        return sessionDate >= weekStart && sessionDate <= weekEnd;
      }).length;

      const label = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
      weeks.push({ label, count, startDate: weekStart });
    }
    return weeks;
  };

  const weeklyStats = getWeeklyStats();
  const maxWeeklyCount = Math.max(...weeklyStats.map(w => w.count), 1);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'RCD': return <Users className="w-4 h-4" />;
      case 'DEVOIRS_FAITS': return <BookOpen className="w-4 h-4" />;
      case 'HSE': return <Clock className="w-4 h-4" />;
      case 'AUTRE': return <FileText className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getTypeColors = (type: string) => {
    switch (type) {
      case 'RCD': return { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-l-purple-500' };
      case 'DEVOIRS_FAITS': return { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-l-blue-500' };
      case 'HSE': return { bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-l-rose-500' };
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
    setDuplicateData(null);
    setModalOpen(true);
  };

  // Gestion de la duplication de sessions
  const handleDuplicateSession = (sessionData: any) => {
    // Ouvrir le modal en mode création avec les données pré-remplies
    setSelectedDate(''); // L'utilisateur choisira la date
    setSelectedTimeSlot(''); // L'utilisateur choisira le créneau
    setEditSession(null); // Mode création
    setDuplicateData(sessionData); // Données à pré-remplir
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50 w-full max-w-full">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-3 sm:px-6 py-2 sm:py-4">
          <div className="flex justify-between items-center">
            {/* Logo + Title + User name */}
            <div className="flex items-center space-x-2">
              <img
                src="/images/logo_supchaissac_v5_minimaliste (1).png"
                alt="Logo"
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
              />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-800">
                  Sup<span className="text-yellow-500">Chaissac</span>
                </h1>
                {/* Nom enseignant + statut PACTE */}
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-gray-600 font-medium">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                    user?.inPacte ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user?.inPacte ? 'PACTE' : 'Sans PACTE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {/* User initials */}
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-3 sm:px-6">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 sm:flex-none py-2.5 sm:py-4 px-2 sm:px-4 border-b-2 font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center sm:space-x-2">
                <PieChart className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm">Dashboard</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex-1 sm:flex-none py-2.5 sm:py-4 px-2 sm:px-4 border-b-2 font-medium transition-colors ${
                activeTab === 'calendar'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center sm:space-x-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm">Déclarer</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-3 sm:px-6 py-2 sm:py-4">
        {activeTab === 'dashboard' && (
          <div className="space-y-3 sm:space-y-4">
            {/* Hero Stats - Deux cadres pour PACTE, un seul sinon */}
            {user?.inPacte ? (
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {/* Sessions déclarées - 60% */}
                <div className="col-span-3 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-3 shadow-lg">
                  <div className="flex items-center gap-3">
                    <p className="text-white text-2xl sm:text-3xl font-bold">{stats.totalHours + stats.otherHours}</p>
                    <div>
                      <p className="text-slate-400 text-xs font-medium">sessions</p>
                      <p className="text-slate-500 text-xs">déclarées</p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-2 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <span className="text-slate-300 text-[10px]">{stats.validatedHours} validées</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="text-slate-300 text-[10px]">{stats.pendingHours} en attente</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-slate-300 text-[10px]">{stats.paidHours} en paiement</span>
                    </div>
                  </div>
                </div>

                {/* Cercle PACTE - 40% */}
                <div className="col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-3 shadow-lg flex flex-col items-center justify-center">
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16">
                    <svg className="w-14 h-14 sm:w-16 sm:h-16 transform -rotate-90">
                      <circle cx="50%" cy="50%" r="24" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
                      <circle
                        cx="50%" cy="50%" r="24" fill="none" stroke="#fbbf24" strokeWidth="5"
                        strokeDasharray={`${(() => {
                          const totalContrat = (user?.pacteHoursDF || 0) + (user?.pacteHoursRCD || 0);
                          const manualCompleted = (user?.pacteHoursCompletedDF || 0) + (user?.pacteHoursCompletedRCD || 0);
                          const appSessions = stats.rcdHours + stats.devoirsFaitsHours;
                          const totalRealise = manualCompleted + appSessions;
                          const percentage = totalContrat > 0 ? Math.min(100, (totalRealise / totalContrat) * 100) : 0;
                          return percentage * 1.51;
                        })()} 151`}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-amber-400 text-base sm:text-lg font-bold">
                        {(() => {
                          const totalContrat = (user?.pacteHoursDF || 0) + (user?.pacteHoursRCD || 0);
                          const manualCompleted = (user?.pacteHoursCompletedDF || 0) + (user?.pacteHoursCompletedRCD || 0);
                          const appSessions = stats.rcdHours + stats.devoirsFaitsHours;
                          const totalRealise = manualCompleted + appSessions;
                          return totalContrat > 0 ? Math.min(100, Math.round((totalRealise / totalContrat) * 100)) : 0;
                        })()}%
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-400 text-[10px] sm:text-xs mt-1">PACTE</p>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-3 shadow-lg">
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <p className="text-white text-2xl sm:text-3xl font-bold">{stats.totalHours + stats.otherHours}</p>
                    <div>
                      <p className="text-slate-400 text-xs font-medium">sessions</p>
                      <p className="text-slate-500 text-xs">déclarées</p>
                    </div>
                  </div>
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                      <circle
                        cx="32" cy="32" r="26" fill="none" stroke="#22c55e" strokeWidth="6"
                        strokeDasharray={`${(stats.validatedHours / (stats.totalHours + stats.otherHours || 1)) * 163} 163`}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">
                        {Math.round((stats.validatedHours / (stats.totalHours + stats.otherHours || 1)) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="relative flex gap-3 mt-2 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <span className="text-slate-300 text-[10px]">{stats.validatedHours} validées</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="text-slate-300 text-[10px]">{stats.pendingHours} en attente</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-slate-300 text-[10px]">{stats.paidHours} en paiement</span>
                  </div>
                </div>
              </div>
            )}

            {/* Carte Contrat PACTE - Compact */}
            {user?.inPacte && (user?.pacteHoursDF || 0) + (user?.pacteHoursRCD || 0) > 0 && (
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-2.5 sm:p-3 border border-amber-200 shadow-sm">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <h3 className="font-bold text-amber-800 flex items-center gap-1.5 text-xs sm:text-sm">
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Mon contrat PACTE
                  </h3>
                  <span className="text-amber-700 text-[10px] sm:text-xs font-medium">
                    {(() => {
                      const manualCompleted = (user?.pacteHoursCompletedDF || 0) + (user?.pacteHoursCompletedRCD || 0);
                      const appSessions = stats.rcdHours + stats.devoirsFaitsHours;
                      return manualCompleted + appSessions;
                    })()}h / {(user?.pacteHoursDF || 0) + (user?.pacteHoursRCD || 0)}h
                  </span>
                </div>

                {/* Barre de progression globale */}
                <div className="mb-2 sm:mb-3">
                  <div className="w-full bg-amber-100 rounded-full h-2 sm:h-2.5">
                    <div
                      className="bg-gradient-to-r from-amber-400 to-yellow-500 h-2 sm:h-2.5 rounded-full transition-all duration-500"
                      style={{
                        width: `${(() => {
                          const totalContrat = (user?.pacteHoursDF || 0) + (user?.pacteHoursRCD || 0);
                          const manualCompleted = (user?.pacteHoursCompletedDF || 0) + (user?.pacteHoursCompletedRCD || 0);
                          const appSessions = stats.rcdHours + stats.devoirsFaitsHours;
                          const totalRealise = manualCompleted + appSessions;
                          return totalContrat > 0 ? Math.min(100, (totalRealise / totalContrat) * 100) : 0;
                        })()}%`
                      }}
                    />
                  </div>
                </div>

                {/* Détails DF, RCD et HSE - toujours 3 colonnes si HSE */}
                <div className={`grid gap-1.5 sm:gap-2 ${stats.hseHours > 0 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  {/* Devoirs Faits */}
                  <div className="bg-white rounded-lg sm:rounded-xl p-1.5 sm:p-2 border border-blue-100">
                    <div className="flex items-center gap-1 mb-0.5 sm:mb-1">
                      <BookOpen className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-500" />
                      <span className="text-[10px] sm:text-xs font-medium text-gray-700">DF</span>
                    </div>
                    <div className="text-sm sm:text-lg font-bold text-blue-600">
                      {(user?.pacteHoursCompletedDF || 0) + stats.devoirsFaitsHours}h
                      <span className="text-[10px] sm:text-xs font-normal text-gray-400"> /{user?.pacteHoursDF || 0}h</span>
                    </div>
                    <div className="mt-0.5 sm:mt-1 w-full bg-blue-100 rounded-full h-0.5 sm:h-1">
                      <div
                        className="bg-blue-500 h-0.5 sm:h-1 rounded-full"
                        style={{
                          width: `${(user?.pacteHoursDF || 0) > 0
                            ? Math.min(100, (((user?.pacteHoursCompletedDF || 0) + stats.devoirsFaitsHours) / (user?.pacteHoursDF || 1)) * 100)
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* RCD */}
                  <div className="bg-white rounded-lg sm:rounded-xl p-1.5 sm:p-2 border border-purple-100">
                    <div className="flex items-center gap-1 mb-0.5 sm:mb-1">
                      <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-500" />
                      <span className="text-[10px] sm:text-xs font-medium text-gray-700">RCD</span>
                    </div>
                    <div className="text-sm sm:text-lg font-bold text-purple-600">
                      {(user?.pacteHoursCompletedRCD || 0) + stats.rcdHours}h
                      <span className="text-[10px] sm:text-xs font-normal text-gray-400"> /{user?.pacteHoursRCD || 0}h</span>
                    </div>
                    <div className="mt-0.5 sm:mt-1 w-full bg-purple-100 rounded-full h-0.5 sm:h-1">
                      <div
                        className="bg-purple-500 h-0.5 sm:h-1 rounded-full"
                        style={{
                          width: `${(user?.pacteHoursRCD || 0) > 0
                            ? Math.min(100, (((user?.pacteHoursCompletedRCD || 0) + stats.rcdHours) / (user?.pacteHoursRCD || 1)) * 100)
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* HSE - Seulement si des heures HSE existent */}
                  {stats.hseHours > 0 && (
                    <div className="bg-white rounded-lg sm:rounded-xl p-1.5 sm:p-2 border border-rose-100">
                      <div className="flex items-center gap-1 mb-0.5 sm:mb-1">
                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-500" />
                        <span className="text-[10px] sm:text-xs font-medium text-gray-700">HSE</span>
                      </div>
                      <div className="text-sm sm:text-lg font-bold text-rose-600">
                        {stats.hseHours}h
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-gray-400 mt-0.5">
                        Hors PACTE
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Par type (uniquement pour non-PACTE) + Mes semaines */}
            <div className={`grid gap-3 sm:gap-4 ${user?.inPacte ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
              {/* Répartition par type - uniquement pour les non-PACTE */}
              {!user?.inPacte && (
                <div className="rounded-2xl bg-white border border-gray-100 p-3 sm:p-5 shadow-sm">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3 sm:mb-4">Par type</h3>
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-gray-600">RCD</span>
                          <span className="font-bold text-purple-600">{stats.rcdHours}</span>
                        </div>
                        <div className="h-1 sm:h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(stats.rcdHours / (stats.totalHours + stats.otherHours || 1)) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-gray-600">DF</span>
                          <span className="font-bold text-blue-600">{stats.devoirsFaitsHours}</span>
                        </div>
                        <div className="h-1 sm:h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(stats.devoirsFaitsHours / (stats.totalHours + stats.otherHours || 1)) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-gray-600">Autre</span>
                          <span className="font-bold text-amber-600">{stats.otherHours}</span>
                        </div>
                        <div className="h-1 sm:h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(stats.otherHours / (stats.totalHours + stats.otherHours || 1)) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Activité par semaine - Barres horizontales */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 p-3 sm:p-5 shadow-lg">
                <h3 className="text-xs sm:text-sm font-semibold text-white mb-2 sm:mb-4">Mes semaines</h3>
                <div className="space-y-2 sm:space-y-3">
                  {weeklyStats.map((week, idx) => {
                    const weekStart = week.startDate;
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);

                    const weekSessions = sessions.filter(s => {
                      const d = new Date(s.date);
                      return d >= weekStart && d <= weekEnd;
                    });
                    const rcd = weekSessions.filter(s => s.type === 'RCD').length;
                    const df = weekSessions.filter(s => s.type === 'DEVOIRS_FAITS').length;
                    const hse = weekSessions.filter(s => s.type === 'HSE').length;
                    const autre = weekSessions.filter(s => s.type === 'AUTRE').length;
                    const total = rcd + df + hse + autre;

                    const today = new Date();
                    const isCurrentWeek = today >= weekStart && today <= weekEnd;

                    return (
                      <div key={idx} className="flex items-center gap-2 sm:gap-3">
                        <div className="w-14 sm:w-16 flex-shrink-0">
                          <span className={`text-[10px] sm:text-xs font-medium ${isCurrentWeek ? 'text-amber-400' : 'text-slate-400'}`}>
                            {weekStart.getDate()}-{weekEnd.getDate()}/{weekStart.getMonth() + 1}
                          </span>
                        </div>
                        <div className="flex-1 h-5 sm:h-6 bg-slate-900/40 rounded-lg overflow-hidden flex">
                          {total > 0 ? (
                            <>
                              {rcd > 0 && (
                                <div
                                  className="h-full bg-purple-500 flex items-center justify-center"
                                  style={{ width: `${(rcd / total) * 100}%` }}
                                >
                                  {rcd > 0 && <span className="text-[10px] text-white font-bold">{rcd}</span>}
                                </div>
                              )}
                              {df > 0 && (
                                <div
                                  className="h-full bg-blue-500 flex items-center justify-center"
                                  style={{ width: `${(df / total) * 100}%` }}
                                >
                                  {df > 0 && <span className="text-[10px] text-white font-bold">{df}</span>}
                                </div>
                              )}
                              {hse > 0 && (
                                <div
                                  className="h-full bg-rose-500 flex items-center justify-center"
                                  style={{ width: `${(hse / total) * 100}%` }}
                                >
                                  {hse > 0 && <span className="text-[10px] text-white font-bold">{hse}</span>}
                                </div>
                              )}
                              {autre > 0 && (
                                <div
                                  className="h-full bg-amber-500 flex items-center justify-center"
                                  style={{ width: `${(autre / total) * 100}%` }}
                                >
                                  {autre > 0 && <span className="text-[10px] text-white font-bold">{autre}</span>}
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-[10px] text-slate-500">—</span>
                            </div>
                          )}
                        </div>
                        <span className="w-5 sm:w-6 text-right text-[10px] sm:text-xs font-bold text-white">{total}</span>
                      </div>
                    );
                  })}
                </div>
                {/* Légende */}
                <div className="flex items-center justify-center gap-3 sm:gap-4 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-500/30 flex-wrap">
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-purple-500" />
                    <span className="text-[10px] sm:text-xs text-slate-300">RCD</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-blue-500" />
                    <span className="text-[10px] sm:text-xs text-slate-300">DF</span>
                  </div>
                  {stats.hseHours > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-rose-500" />
                      <span className="text-[10px] sm:text-xs text-slate-300">HSE</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded bg-amber-500" />
                    <span className="text-[10px] sm:text-xs text-slate-300">Autre</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-3 sm:px-4 py-1.5 sm:py-2 border-b border-gray-100">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Sessions récentes</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {sessions.slice(0, 3).map((session) => {
                  const statusClasses = getStatusClasses(session.status);
                  const typeColors = getTypeColors(session.type);
                  return (
                    <div
                      key={session.id}
                      className={`px-3 sm:px-4 py-2 hover:bg-gray-50 transition-colors border-l-4 ${typeColors.border}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 ${typeColors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <span className={typeColors.text}>{getTypeIcon(session.type)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate flex items-center gap-1">
                              {session.originalType ? (
                                <>
                                  <span className="text-gray-400">
                                    {session.originalType === 'RCD' && 'RCD'}
                                    {session.originalType === 'DEVOIRS_FAITS' && 'DF'}
                                    {session.originalType === 'AUTRE' && 'Autre'}
                                    {session.originalType === 'HSE' && 'HSE'}
                                  </span>
                                  <ArrowRight className="w-3 h-3 text-gray-400" />
                                  <span>
                                    {session.type === 'RCD' && 'RCD'}
                                    {session.type === 'DEVOIRS_FAITS' && 'DF'}
                                    {session.type === 'HSE' && 'HSE'}
                                    {session.type === 'AUTRE' && 'Autre'}
                                  </span>
                                </>
                              ) : (
                                <>
                                  {session.type === 'RCD' && `RCD - ${session.className}`}
                                  {session.type === 'DEVOIRS_FAITS' && `DF (${session.studentCount})`}
                                  {session.type === 'HSE' && 'HSE'}
                                  {session.type === 'AUTRE' && 'Autre'}
                                </>
                              )}
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                              {new Date(session.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - {session.timeSlot}
                            </p>
                          </div>
                        </div>
                        <span className={cn(components.badge.base, statusClasses.full, 'text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5')}>
                          {statusClasses.label}
                        </span>
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

      </div>

      {/* Modales de création/modification de session */}
      {user && (
        <SessionModals
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditSession(null);
            setDuplicateData(null);
          }}
          date={selectedDate}
          timeSlot={selectedTimeSlot}
          onSubmit={handleSubmitSession}
          onUpdate={handleUpdateSession}
          onDelete={handleDeleteSession}
          onDuplicate={handleDuplicateSession}
          editSession={editSession}
          duplicateData={duplicateData}
          user={user}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;
