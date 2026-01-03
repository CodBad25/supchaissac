import React, { useState, useEffect, useRef } from 'react';
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
  ArrowRight,
  HelpCircle,
  User
} from 'lucide-react';
import SmartCalendar from '../components/SmartCalendar';
import SessionModals from '../components/SessionModals';
import GuidedTour, { shouldShowTour } from '../components/GuidedTour';
import type { TourStep } from '../components/GuidedTour';
import { components, cn, getStatusClasses } from '../styles/theme';
import { API_BASE_URL } from '../config/api';

// Steps du tour guidé pour les enseignants
const teacherTourSteps: TourStep[] = [
  {
    target: '[data-tour="dashboard-tab"]',
    title: 'Onglet Dashboard',
    description: 'Consultez vos statistiques et l\'historique de vos déclarations.',
    position: 'bottom',
    clickBefore: '[data-tour="dashboard-tab"]',
  },
  {
    target: '[data-tour="stats"]',
    title: 'Vos statistiques',
    description: 'Récapitulatif de vos heures déclarées, validées et en attente de paiement.',
    position: 'bottom',
  },
  {
    target: '[data-tour="calendar-tab"]',
    title: 'Onglet Déclarer',
    description: 'Accédez au calendrier pour déclarer vos heures supplémentaires.',
    position: 'bottom',
    clickBefore: '[data-tour="calendar-tab"]',
  },
  {
    target: '[data-tour="calendar"]',
    title: 'Le calendrier',
    description: 'Cliquez sur une case vide pour déclarer une heure. Les créneaux occupés apparaissent en couleur.',
    position: 'top',
    clickBefore: '[data-tour="calendar-tab"]',
  },
];

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
  const [showTour, setShowTour] = useState(shouldShowTour('teacher'));
  const [timelineView, setTimelineView] = useState<'semaines' | 'mois'>('semaines');
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  // Calculer les stats par semaine (52 dernières semaines)
  const timelineRef = useRef<HTMLDivElement>(null);

  const getWeeklyStats = () => {
    const weeks: { label: string; count: number; startDate: Date; rcd: number; df: number; hse: number; autre: number }[] = [];
    const today = new Date();

    for (let i = 51; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + 1 - (i * 7)); // Lundi de la semaine
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const weekSessions = sessions.filter(s => {
        const sessionDate = new Date(s.date);
        return sessionDate >= weekStart && sessionDate <= weekEnd;
      });

      const label = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
      weeks.push({
        label,
        count: weekSessions.length,
        startDate: weekStart,
        rcd: weekSessions.filter(s => s.type === 'RCD').length,
        df: weekSessions.filter(s => s.type === 'DEVOIRS_FAITS').length,
        hse: weekSessions.filter(s => s.type === 'HSE').length,
        autre: weekSessions.filter(s => s.type === 'AUTRE').length,
      });
    }
    return weeks;
  };

  const weeklyStats = getWeeklyStats();
  const maxWeeklyCount = Math.max(...weeklyStats.map(w => w.count), 1);

  // Calculer les stats par mois (année scolaire: Sep → Juil)
  const getMonthlyStats = () => {
    const months: { label: string; count: number; month: number; year: number; rcd: number; df: number; hse: number; autre: number }[] = [];
    const today = new Date();
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

    // Déterminer l'année scolaire en cours (Sep-Juil)
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    // Si on est entre Jan-Juil, l'année scolaire a commencé l'année précédente
    // Si on est entre Sep-Déc, l'année scolaire a commencé cette année
    const schoolYearStart = currentMonth >= 8 ? currentYear : currentYear - 1;

    // Mois de l'année scolaire: Sep(8), Oct(9), Nov(10), Déc(11), Jan(0), Fév(1), Mar(2), Avr(3), Mai(4), Juin(5), Juil(6)
    const schoolMonths = [
      { month: 8, year: schoolYearStart },      // Sep
      { month: 9, year: schoolYearStart },      // Oct
      { month: 10, year: schoolYearStart },     // Nov
      { month: 11, year: schoolYearStart },     // Déc
      { month: 0, year: schoolYearStart + 1 },  // Jan
      { month: 1, year: schoolYearStart + 1 },  // Fév
      { month: 2, year: schoolYearStart + 1 },  // Mar
      { month: 3, year: schoolYearStart + 1 },  // Avr
      { month: 4, year: schoolYearStart + 1 },  // Mai
      { month: 5, year: schoolYearStart + 1 },  // Juin
      { month: 6, year: schoolYearStart + 1 },  // Juil
    ];

    for (const { month, year } of schoolMonths) {
      const monthSessions = sessions.filter(s => {
        const sessionDate = new Date(s.date);
        return sessionDate.getMonth() === month && sessionDate.getFullYear() === year;
      });

      months.push({
        label: monthNames[month],
        count: monthSessions.length,
        month,
        year,
        rcd: monthSessions.filter(s => s.type === 'RCD').length,
        df: monthSessions.filter(s => s.type === 'DEVOIRS_FAITS').length,
        hse: monthSessions.filter(s => s.type === 'HSE').length,
        autre: monthSessions.filter(s => s.type === 'AUTRE').length,
      });
    }
    return months;
  };

  const monthlyStats = getMonthlyStats();
  const maxMonthlyCount = Math.max(...monthlyStats.map(m => m.count), 1);

  // Scroll timeline to the right (most recent) on mount
  useEffect(() => {
    if (timelineRef.current) {
      setTimeout(() => {
        if (timelineRef.current) {
          timelineRef.current.scrollLeft = timelineRef.current.scrollWidth;
        }
      }, 100);
    }
  }, [sessions, timelineView]);

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
          studentsList: sessionData.studentsList,
          comment: sessionData.comment
        }),

        ...(sessionData.type === 'AUTRE' && {
          description: sessionData.description,
          comment: sessionData.comment
        })
      };

      // DEBUG: Voir ce qui est envoyé
      console.log('🔵 [DEBUG] sessionData reçu:', sessionData);
      console.log('🔵 [DEBUG] apiData envoyé:', apiData);
      console.log('🔵 [DEBUG] studentsList:', sessionData.studentsList);

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
            setUploadError(null);
          } else {
            const errorText = await uploadResponse.text();
            console.error('Erreur upload fichier:', errorText);
            setUploadError('Le fichier n\'a pas pu être uploadé. La session a été créée sans pièce jointe.');
          }
        } catch (uploadErr) {
          console.error('Erreur upload:', uploadErr);
          setUploadError('Erreur de connexion lors de l\'upload. La session a été créée sans pièce jointe.');
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
          studentsList: sessionData.studentsList,
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
            setUploadError(null);
          } else {
            const errorText = await uploadResponse.text();
            console.error('Erreur upload fichier:', errorText);
            setUploadError('Le fichier n\'a pas pu être uploadé. La session a été modifiée sans pièce jointe.');
          }
        } catch (uploadErr) {
          console.error('Erreur upload:', uploadErr);
          setUploadError('Erreur de connexion lors de l\'upload. La session a été modifiée sans pièce jointe.');
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

              {/* Help/Tutorial */}
              <button
                onClick={() => setShowTour(true)}
                className="p-2 rounded-lg bg-yellow-100 hover:bg-yellow-200 transition-colors"
                title="Aide / Tutoriel"
              >
                <HelpCircle className="w-4 h-4 text-yellow-600" />
              </button>

              {/* Profile */}
              <button
                onClick={() => navigate('/profile')}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                title="Mon profil"
              >
                <User className="w-4 h-4 text-gray-600" />
              </button>

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
              data-tour="dashboard-tab"
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
              data-tour="calendar-tab"
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

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-2 text-red-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{uploadError}</span>
            </div>
            <button
              onClick={() => setUploadError(null)}
              className="text-red-500 hover:text-red-700 font-medium"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-3 sm:px-6 py-2 sm:py-4">
        {activeTab === 'dashboard' && (
          <div className="space-y-3 sm:space-y-4">
            {/* Hero Stats - Deux cadres pour PACTE, un seul sinon */}
            <div data-tour="stats">
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
            </div>

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

              {/* Activité - Timeline scrollable (Semaines / Mois) */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-600 via-slate-700 to-slate-800 p-3 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex bg-slate-900/50 rounded-lg p-0.5">
                      <button
                        onClick={() => setTimelineView('semaines')}
                        className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                          timelineView === 'semaines'
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Semaines
                      </button>
                      <button
                        onClick={() => setTimelineView('mois')}
                        className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                          timelineView === 'mois'
                            ? 'bg-white text-slate-800 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Mois
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    {timelineView === 'semaines' && <span className="text-slate-500 text-[10px] hidden sm:inline">← Scroll</span>}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="flex items-center gap-0.5"><div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div><span className="text-slate-400 text-[10px]">RCD</span></div>
                      <div className="flex items-center gap-0.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div><span className="text-slate-400 text-[10px]">DF</span></div>
                      <div className="flex items-center gap-0.5"><div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div><span className="text-slate-400 text-[10px]">HSE</span></div>
                      <div className="flex items-center gap-0.5"><div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div><span className="text-slate-400 text-[10px]">Autre</span></div>
                    </div>
                  </div>
                </div>

                {/* Vue Semaines */}
                {timelineView === 'semaines' && (
                  <div
                    ref={timelineRef}
                    className="overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"
                    style={{ scrollBehavior: 'smooth' }}
                  >
                    <div className="flex gap-1" style={{ minWidth: `${weeklyStats.length * 36}px` }}>
                      {weeklyStats.map((week, idx) => {
                        const today = new Date();
                        const weekEnd = new Date(week.startDate);
                        weekEnd.setDate(week.startDate.getDate() + 6);
                        const isCurrentWeek = today >= week.startDate && today <= weekEnd;

                        return (
                          <div key={idx} className="flex flex-col items-center gap-0.5 group" style={{ width: '32px' }}>
                            <div className="w-full flex flex-col items-center justify-end h-16 relative">
                              {week.count > 0 && (
                                <span className="absolute -top-4 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  {week.count}h
                                </span>
                              )}
                              <div className="w-full flex flex-col justify-end rounded-t overflow-hidden" style={{ height: `${Math.max((week.count / maxWeeklyCount) * 100, 4)}%` }}>
                                {week.autre > 0 && <div className="w-full bg-amber-500" style={{ height: `${(week.autre / week.count) * 100}%`, minHeight: '2px' }} />}
                                {week.hse > 0 && <div className="w-full bg-rose-500" style={{ height: `${(week.hse / week.count) * 100}%`, minHeight: '2px' }} />}
                                {week.df > 0 && <div className="w-full bg-blue-500" style={{ height: `${(week.df / week.count) * 100}%`, minHeight: '2px' }} />}
                                {week.rcd > 0 && <div className="w-full bg-purple-500" style={{ height: `${(week.rcd / week.count) * 100}%`, minHeight: '2px' }} />}
                                {week.count === 0 && <div className="w-full bg-slate-700 h-1 rounded-t" />}
                              </div>
                            </div>
                            <span className={`text-[8px] transition-colors ${isCurrentWeek ? 'text-amber-400 font-medium' : 'text-slate-500 group-hover:text-slate-300'}`}>{week.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Vue Mois */}
                {timelineView === 'mois' && (
                  <div className="flex gap-2 justify-center">
                    {monthlyStats.map((month, idx) => {
                      const today = new Date();
                      const isCurrentMonth = month.month === today.getMonth() && month.year === today.getFullYear();

                      return (
                        <div key={idx} className="flex flex-col items-center gap-0.5 group flex-1 max-w-[50px]">
                          <div className="w-full flex flex-col items-center justify-end h-16 relative">
                            {month.count > 0 && (
                              <span className="absolute -top-4 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {month.count}h
                              </span>
                            )}
                            <div className="w-full flex flex-col justify-end rounded-t overflow-hidden" style={{ height: `${Math.max((month.count / maxMonthlyCount) * 100, 4)}%` }}>
                              {month.autre > 0 && <div className="w-full bg-amber-500" style={{ height: `${(month.autre / month.count) * 100}%`, minHeight: '2px' }} />}
                              {month.hse > 0 && <div className="w-full bg-rose-500" style={{ height: `${(month.hse / month.count) * 100}%`, minHeight: '2px' }} />}
                              {month.df > 0 && <div className="w-full bg-blue-500" style={{ height: `${(month.df / month.count) * 100}%`, minHeight: '2px' }} />}
                              {month.rcd > 0 && <div className="w-full bg-purple-500" style={{ height: `${(month.rcd / month.count) * 100}%`, minHeight: '2px' }} />}
                              {month.count === 0 && <div className="w-full bg-slate-700 h-1 rounded-t" />}
                            </div>
                          </div>
                          <span className={`text-[8px] transition-colors ${isCurrentMonth ? 'text-amber-400 font-medium' : 'text-slate-500 group-hover:text-slate-300'}`}>{month.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                  const canEdit = session.status === 'PENDING_REVIEW' || session.status === 'PENDING_VALIDATION';
                  return (
                    <div
                      key={session.id}
                      onClick={() => handleEditSession(session)}
                      className={`px-3 sm:px-4 py-2 hover:bg-gray-50 transition-colors border-l-4 ${typeColors.border} cursor-pointer active:bg-gray-100`}
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

      {/* Tour guidé pour les enseignants */}
      {showTour && (
        <GuidedTour
          tourId="teacher"
          steps={teacherTourSteps}
          onComplete={() => setShowTour(false)}
        />
      )}
    </div>
  );
};

export default TeacherDashboard;
