import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Search, Calendar, Clock, User, FileText,
  Download, CheckCircle, Eye, AlertCircle, XCircle,
  Paperclip, Home, ClipboardCheck, X, CheckSquare, Square, HelpCircle,
  Users, TrendingUp, Pencil, Trash2, AlertTriangle, BookOpen
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import GuidedTour, { shouldShowTour } from '../components/GuidedTour';
import { ContratsPacte } from '../components/ContratsPacte';
import type { TourStep } from '../components/GuidedTour';

// Steps du tour guidé pour la direction
const principalTourSteps: TourStep[] = [
  {
    target: '[data-tour="pending-tab"]',
    title: 'Sessions à valider',
    description: 'Sessions vérifiées par le secrétariat en attente de votre validation.',
    position: 'bottom',
    clickBefore: '[data-tour="pending-tab"]',
  },
  {
    target: '[data-tour="validated-tab"]',
    title: 'Sessions validées',
    description: 'Historique des sessions que vous avez validées.',
    position: 'bottom',
    clickBefore: '[data-tour="validated-tab"]',
  },
  {
    target: '[data-tour="rejected-tab"]',
    title: 'Sessions rejetées',
    description: 'Sessions rejetées avec leurs motifs.',
    position: 'bottom',
    clickBefore: '[data-tour="rejected-tab"]',
  },
];

// Types
interface Student {
  lastName: string;
  firstName: string;
  className: string;
}

interface Session {
  id: number;
  date: string;
  timeSlot: string;
  type: 'RCD' | 'DEVOIRS_FAITS' | 'AUTRE' | 'HSE';
  status: string;
  className?: string;
  studentCount?: number;
  studentsList?: Student[];
  gradeLevel?: string;
  description?: string;
  replacedTeacherName?: string;
  replacedTeacherSubject?: string;
  replacedTeacherPrefix?: string;
  replacedTeacherFirstName?: string;
  replacedTeacherLastName?: string;
  teacherId: number;
  teacherName?: string;
  teacherSubject?: string; // Matière de l'enseignant
  comment?: string;
  reviewComments?: string;
  validationComments?: string;
  rejectionReason?: string;
  createdAt?: string;
}

interface Attachment {
  id: number;
  sessionId: number;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  isVerified: boolean;
  createdAt: string;
}

interface UserInfo {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
}

interface Quota {
  type: 'HSE' | 'DEVOIRS_FAITS' | 'RCD';
  budgetHours: number;
  consumedHours: number;
  schoolYear: string;
  id: number | null;
}

interface Teacher {
  id: number;
  name: string;
  username: string;
  initials: string;
  subject?: string;
  inPacte: boolean;
  pacteHoursTarget: number;
  pacteHoursCompleted: number;
  pacteHoursDF: number;
  pacteHoursRCD: number;
  pacteHoursCompletedDF: number;
  pacteHoursCompletedRCD: number;
  stats: {
    totalSessions: number;
    currentYearSessions: number;
    rcdSessions: number;
    devoirsFaitsSessions: number;
    hseSessions: number;
    validatedSessions: number;
  };
}

interface PacteStats {
  totalTeachers: number;
  teachersWithPacte: number;
  teachersWithoutPacte: number;
  pactePercentage: number;
}

type ActionState = null | 'VALIDATE_COMMENT_PROMPT' | 'REJECT_COMMENT_PROMPT' | 'VALIDATE' | 'REJECT';

export default function PrincipalDashboard() {
  const navigate = useNavigate();

  // User state
  const [user, setUser] = useState<UserInfo | null>(null);

  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  // Tour guidé
  const [showTour, setShowTour] = useState(shouldShowTour('principal'));

  // UI state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sessions' | 'teachers' | 'contrats' | 'stats'>('dashboard');
  const [sessionFilter, setSessionFilter] = useState<'all' | 'pending' | 'validated' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'trimester' | 'year'>('month');
  const [analysisView, setAnalysisView] = useState<'matiere' | 'creneaux' | 'jours'>('matiere');
  const [timelineView, setTimelineView] = useState<'semaines' | 'mois'>('semaines');
  const timelineRef = useRef<HTMLDivElement>(null);

  // Quotas state
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [quotasLoading, setQuotasLoading] = useState(false);
  const [editingQuotas, setEditingQuotas] = useState(false);
  const [tempQuotas, setTempQuotas] = useState<{[key: string]: number}>({});

  // Teachers & PACTE state
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [pacteStats, setPacteStats] = useState<PacteStats | null>(null);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [pacteFilter, setPacteFilter] = useState<'all' | 'pacte' | 'non-pacte'>('all');

  // Modal states
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Action states
  const [actionState, setActionState] = useState<ActionState>(null);
  const [feedback, setFeedback] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Conversion pour sessions AUTRE ou conversion en HSE
  const [conversionType, setConversionType] = useState<string>('');
  const [conversionHours, setConversionHours] = useState<number>(1);
  const [convertToHSE, setConvertToHSE] = useState(false);

  // Selection en lot
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBatchRejectModal, setShowBatchRejectModal] = useState(false);
  const [batchRejectReason, setBatchRejectReason] = useState('');
  const [batchActionLoading, setBatchActionLoading] = useState(false);

  // Suppression session
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);

  // Vider la selection quand les filtres changent
  useEffect(() => {
    setSelectedIds(new Set());
  }, [typeFilter, searchTerm, activeTab, sessionFilter]);

  // Load quotas when dashboard tab is active
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchQuotas();
    }
  }, [activeTab]);

  // Scroll timeline to the right (most recent) when stats tab is shown
  useEffect(() => {
    if (activeTab === 'stats' && timelineRef.current) {
      setTimeout(() => {
        if (timelineRef.current) {
          timelineRef.current.scrollLeft = timelineRef.current.scrollWidth;
        }
      }, 100);
    }
  }, [activeTab]);

  // Load teachers and PACTE stats when teachers tab is active
  useEffect(() => {
    if (activeTab === 'teachers') {
      fetchTeachers();
      fetchPacteStats();
    }
  }, [activeTab]);

  // Gestion touche Entree pour valider les modales
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;

      // Modale de rejet en lot
      if (showBatchRejectModal && !batchActionLoading) {
        e.preventDefault();
        handleBatchReject();
        return;
      }

      // Modale detail
      if (showDetailModal && selectedSession && !actionLoading) {
        e.preventDefault();

        // Selon l'etat de l'action
        if (actionState === 'VALIDATE_COMMENT_PROMPT') {
          // Valider sans commentaire (si pas AUTRE ou conversion choisie)
          if (selectedSession.type !== 'AUTRE' || conversionType) {
            finishValidation();
          }
        } else if (actionState === 'REJECT_COMMENT_PROMPT') {
          // Refuser sans commentaire
          finishRejection();
        } else if (actionState === 'VALIDATE') {
          // Confirmer validation avec commentaire
          if (selectedSession.type !== 'AUTRE' || conversionType) {
            finishValidation();
          }
        } else if (actionState === 'REJECT') {
          // Confirmer rejet avec motif
          finishRejection();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDetailModal, showBatchRejectModal, selectedSession, actionState, actionLoading, batchActionLoading, conversionType]);

  // Fetch user
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/auth/me`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setUser(data))
      .catch(() => navigate('/login'));
  }, [navigate]);

  // Fetch sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/sessions/admin/all`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setSessions(data);
        }
      } catch (error) {
        console.error('Erreur chargement sessions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  // Load attachments for a session
  const loadAttachments = async (sessionId: number) => {
    setAttachmentsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/attachments/session/${sessionId}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setAttachments(data);
      } else {
        setAttachments([]);
      }
    } catch (error) {
      console.error('Erreur chargement PJ:', error);
      setAttachments([]);
    } finally {
      setAttachmentsLoading(false);
    }
  };

  // Open detail modal
  const handleViewSession = async (session: Session) => {
    setSelectedSession(session);
    setShowDetailModal(true);
    setActionState(null);
    setFeedback('');
    // Reset conversion pour AUTRE et HSE
    setConversionType('');
    setConversionHours(1);
    setConvertToHSE(false);
    await loadAttachments(session.id);
  };

  // Close modal
  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedSession(null);
    setActionState(null);
    setFeedback('');
  };

  // Initier validation
  const handleValidate = () => {
    if (!selectedSession) return;
    setActionState('VALIDATE_COMMENT_PROMPT');
  };

  // Verifier si la validation est possible (pour AUTRE, conversion requise)
  const canValidate = () => {
    if (!selectedSession) return false;
    if (selectedSession.type === 'AUTRE' && !conversionType) return false;
    return true;
  };

  // Initier rejet
  const handleReject = () => {
    setActionState('REJECT_COMMENT_PROMPT');
  };

  // Finaliser validation
  const finishValidation = async () => {
    if (!selectedSession) return;
    setActionLoading(true);

    try {
      const body: Record<string, unknown> = {
        action: 'validate',
        validationComments: feedback.trim() || undefined,
      };

      // Ajouter infos conversion si AUTRE
      if (selectedSession.type === 'AUTRE') {
        body.conversionType = conversionType;
        body.conversionHours = conversionHours;
      }

      // Conversion en HSE pour RCD ou DEVOIRS_FAITS
      if (convertToHSE && (selectedSession.type === 'RCD' || selectedSession.type === 'DEVOIRS_FAITS')) {
        body.convertToHSE = true;
      }

      console.log('🟢 Validation session:', selectedSession.id, 'commentaire:', feedback.trim() || '(aucun)');
      const response = await fetch(`${API_BASE_URL}/api/sessions/${selectedSession.id}/validate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      if (response.ok) {
        console.log('✅ Validation réussie');
        const newType = convertToHSE ? 'HSE' : (selectedSession.type === 'AUTRE' ? conversionType as Session['type'] : selectedSession.type);
        setSessions(prev => prev.map(s =>
          s.id === selectedSession.id ? { ...s, status: 'VALIDATED', validationComments: feedback, type: newType } : s
        ));
        closeModal();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erreur API validation:', response.status, errorData);
        alert(`Erreur: ${errorData.error || errorData.details || 'Erreur serveur'}`);
      }
    } catch (error) {
      console.error('❌ Erreur validation:', error);
      alert('Erreur de connexion au serveur');
    } finally {
      setActionLoading(false);
    }
  };

  // Finaliser rejet
  const finishRejection = async () => {
    if (!selectedSession) return;
    setActionLoading(true);

    try {
      console.log('🔴 Rejet session:', selectedSession.id, 'motif:', feedback.trim() || '(aucun)');
      const response = await fetch(`${API_BASE_URL}/api/sessions/${selectedSession.id}/validate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'reject',
          rejectionReason: feedback.trim() || undefined,
        }),
      });

      if (response.ok) {
        console.log('✅ Rejet réussi');
        setSessions(prev => prev.map(s =>
          s.id === selectedSession.id ? { ...s, status: 'REJECTED', rejectionReason: feedback } : s
        ));
        closeModal();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erreur API rejet:', response.status, errorData);
        alert(`Erreur: ${errorData.error || errorData.details || 'Erreur serveur'}`);
      }
    } catch (error) {
      console.error('❌ Erreur rejet:', error);
      alert('Erreur de connexion au serveur');
    } finally {
      setActionLoading(false);
    }
  };

  // Supprimer une session (uniquement Principal)
  const handleDeleteSession = async () => {
    if (!selectedSession) return;
    setActionLoading(true);

    try {
      console.log('🗑️ Suppression session:', selectedSession.id);
      const response = await fetch(`${API_BASE_URL}/api/sessions/${selectedSession.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        console.log('✅ Suppression réussie');
        setSessions(prev => prev.filter(s => s.id !== selectedSession.id));
        setShowDeleteModal(false);
        closeModal();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erreur API suppression:', response.status, errorData);
        alert(`Erreur: ${errorData.error || errorData.details || 'Erreur serveur'}`);
      }
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      alert('Erreur de connexion au serveur');
    } finally {
      setActionLoading(false);
    }
  };

  // Annuler decision (VALIDATED/REJECTED -> PENDING_VALIDATION, PAID "Mis en paiement" -> VALIDATED)
  const handleCancelDecision = async () => {
    if (!selectedSession) return;
    setActionLoading(true);

    // Determiner l'action selon le statut actuel
    const action = selectedSession.status === 'PAID' ? 'unpay' : 'cancel';
    const newStatus = selectedSession.status === 'PAID' ? 'VALIDATED' : 'PENDING_VALIDATION';

    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${selectedSession.id}/validate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        setSessions(prev => prev.map(s =>
          s.id === selectedSession.id
            ? { ...s, status: newStatus, validationComments: undefined, rejectionReason: undefined }
            : s
        ));
        closeModal();
      }
    } catch (error) {
      console.error('Erreur annulation:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    navigate('/login');
  };

  // Fetch quotas
  const fetchQuotas = async () => {
    setQuotasLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/quotas`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setQuotas(data);
      }
    } catch (error) {
      console.error('Error loading quotas:', error);
    } finally {
      setQuotasLoading(false);
    }
  };

  const saveQuotas = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quotas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          quotas: Object.entries(tempQuotas).map(([type, budgetHours]) => ({ type, budgetHours })),
        }),
      });
      if (response.ok) {
        setEditingQuotas(false);
        fetchQuotas();
      }
    } catch (error) {
      console.error('Error saving quotas:', error);
    }
  };

  const fetchTeachers = async () => {
    setTeachersLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/pacte/teachers`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setTeachers(data);
      }
    } catch (error) {
      console.error('Error loading teachers:', error);
    } finally {
      setTeachersLoading(false);
    }
  };

  const fetchPacteStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pacte/statistics`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setPacteStats(data);
      }
    } catch (error) {
      console.error('Error loading PACTE stats:', error);
    }
  };

  // === OPERATIONS EN LOT ===

  // Toggle selection d'une session
  const toggleSelection = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Tout selectionner / Tout deselectionner
  const toggleSelectAll = () => {
    if (selectedIds.size === selectableSessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableSessions.map(s => s.id)));
    }
  };

  // Valider en lot
  const handleBatchValidate = async () => {
    if (selectedIds.size === 0) return;
    setBatchActionLoading(true);

    try {
      const promises = Array.from(selectedIds).map(id =>
        fetch(`${API_BASE_URL}/api/sessions/${id}/validate`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ action: 'validate' }),
        })
      );

      await Promise.all(promises);

      setSessions(prev => prev.map(s =>
        selectedIds.has(s.id) ? { ...s, status: 'VALIDATED' } : s
      ));
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Erreur validation en lot:', error);
    } finally {
      setBatchActionLoading(false);
    }
  };

  // Ouvrir modale rejet en lot
  const openBatchRejectModal = () => {
    setBatchRejectReason('');
    setShowBatchRejectModal(true);
  };

  // Rejeter en lot
  const handleBatchReject = async () => {
    if (selectedIds.size === 0) return;
    setBatchActionLoading(true);

    try {
      const promises = Array.from(selectedIds).map(id =>
        fetch(`${API_BASE_URL}/api/sessions/${id}/validate`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            action: 'reject',
            rejectionReason: batchRejectReason.trim() || undefined,
          }),
        })
      );

      await Promise.all(promises);

      setSessions(prev => prev.map(s =>
        selectedIds.has(s.id) ? { ...s, status: 'REJECTED', rejectionReason: batchRejectReason } : s
      ));
      setSelectedIds(new Set());
      setShowBatchRejectModal(false);
      setBatchRejectReason('');
    } catch (error) {
      console.error('Erreur rejet en lot:', error);
    } finally {
      setBatchActionLoading(false);
    }
  };

  // Supprimer en lot
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    setBatchActionLoading(true);

    try {
      const promises = Array.from(selectedIds).map(id =>
        fetch(`${API_BASE_URL}/api/sessions/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        })
      );

      await Promise.all(promises);

      setSessions(prev => prev.filter(s => !selectedIds.has(s.id)));
      setSelectedIds(new Set());
      setShowBatchDeleteModal(false);
    } catch (error) {
      console.error('Erreur suppression en lot:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setBatchActionLoading(false);
    }
  };

  // Filter teachers
  const filteredTeachers = useMemo(() => {
    let filtered = teachers;
    if (teacherSearchTerm) {
      const search = teacherSearchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(search) ||
        t.username.toLowerCase().includes(search)
      );
    }
    if (pacteFilter === 'pacte') {
      filtered = filtered.filter(t => t.inPacte);
    } else if (pacteFilter === 'non-pacte') {
      filtered = filtered.filter(t => !t.inPacte);
    }
    return filtered;
  }, [teachers, teacherSearchTerm, pacteFilter]);

  // Filter sessions
  const filteredSessions = useMemo(() => {
    let filtered = sessions;

    // Filter by session status
    if (sessionFilter === 'pending') {
      filtered = filtered.filter(s => s.status === 'PENDING_VALIDATION' || s.status === 'PENDING_REVIEW');
    } else if (sessionFilter === 'validated') {
      filtered = filtered.filter(s => s.status === 'VALIDATED' || s.status === 'PAID');
    } else if (sessionFilter === 'rejected') {
      filtered = filtered.filter(s => s.status === 'REJECTED');
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.teacherName?.toLowerCase().includes(search) ||
        s.type.toLowerCase().includes(search) ||
        s.className?.toLowerCase().includes(search)
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(s => s.type === typeFilter);
    }

    return filtered;
  }, [sessions, sessionFilter, searchTerm, typeFilter]);

  // Sessions selectionnables pour operations en lot (exclure AUTRE car necessite conversion)
  const selectableSessions = useMemo(() => {
    return filteredSessions.filter(s =>
      (s.status === 'PENDING_VALIDATION' || s.status === 'PENDING_REVIEW') && s.type !== 'AUTRE'
    );
  }, [filteredSessions]);

  // Stats
  const stats = {
    pending: sessions.filter(s => s.status === 'PENDING_VALIDATION' || s.status === 'PENDING_REVIEW').length,
    validated: sessions.filter(s => s.status === 'VALIDATED' || s.status === 'PAID').length,
    rejected: sessions.filter(s => s.status === 'REJECTED').length,
  };

  // Helpers
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'short', day: 'numeric', month: 'short'
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'RCD': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DEVOIRS_FAITS': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'HSE': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'RCD': return 'RCD';
      case 'DEVOIRS_FAITS': return 'DF';
      case 'HSE': return 'HSE';
      case 'AUTRE': return 'Autre';
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Nouvelle</span>;
      case 'PENDING_VALIDATION':
        return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">A valider</span>;
      case 'VALIDATED':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Validee</span>;
      case 'REJECTED':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Rejetee</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">{status}</span>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getReplacedTeacherName = (session: Session) => {
    if (session.replacedTeacherName) return session.replacedTeacherName;
    if (session.replacedTeacherLastName) {
      const prefix = session.replacedTeacherPrefix || '';
      const firstName = session.replacedTeacherFirstName || '';
      return `${prefix} ${session.replacedTeacherLastName} ${firstName}`.trim();
    }
    return null;
  };

  // Sessions filtrées par période pour les stats
  const periodFilteredSessions = useMemo(() => {
    const today = new Date();
    let startDate: Date;

    switch (timeFilter) {
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'trimester':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 3);
        break;
      case 'year':
      default:
        startDate = new Date(today);
        startDate.setFullYear(today.getFullYear() - 1);
        break;
    }

    return sessions.filter(s => new Date(s.date) >= startDate);
  }, [sessions, timeFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">SupChaissac</h1>
              <p className="text-xs text-purple-600 font-medium">Direction</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-500">Principal</p>
            </div>
            <button
              onClick={() => setShowTour(true)}
              className="p-2 text-gray-400 hover:text-purple-500 transition-colors"
              title="Visite guidée"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/help')}
              className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
              title="Centre d'aide"
            >
              <BookOpen className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="p-2 text-gray-400 hover:text-purple-500 transition-colors"
              title="Mon profil"
            >
              <User className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation tabs - 4 onglets principaux */}
      <nav className="bg-white border-b border-gray-200 px-4">
        <div className="max-w-7xl mx-auto flex gap-1">
          {[
            { id: 'dashboard', label: 'Tableau de bord', icon: Home, count: null },
            { id: 'sessions', label: 'Sessions', icon: ClipboardCheck, count: stats.pending },
            { id: 'teachers', label: 'Enseignants', icon: Users, count: null },
            { id: 'contrats', label: 'Contrats PACTE', icon: FileText, count: null },
            { id: 'stats', label: 'Statistiques', icon: TrendingUp, count: null },
          ].map(tab => (
            <button
              key={tab.id}
              data-tour={tab.id !== 'dashboard' ? `${tab.id}-tab` : undefined}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' ? (
          <>
            {/* Cartes cliquables */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => { setActiveTab('sessions'); setSessionFilter('pending'); }}
                className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-white text-left hover:scale-[1.02] transition-transform cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm">A valider</p>
                    <p className="text-4xl font-bold">{stats.pending}</p>
                  </div>
                  <ClipboardCheck className="w-12 h-12 text-amber-200" />
                </div>
              </button>
              <button
                onClick={() => { setActiveTab('sessions'); setSessionFilter('validated'); }}
                className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl p-6 text-white text-left hover:scale-[1.02] transition-transform cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Validees</p>
                    <p className="text-4xl font-bold">{stats.validated}</p>
                  </div>
                  <CheckCircle className="w-12 h-12 text-green-200" />
                </div>
              </button>
              <button
                onClick={() => { setActiveTab('sessions'); setSessionFilter('rejected'); }}
                className="bg-gradient-to-br from-red-400 to-red-500 rounded-2xl p-6 text-white text-left hover:scale-[1.02] transition-transform cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm">Rejetees</p>
                    <p className="text-4xl font-bold">{stats.rejected}</p>
                  </div>
                  <XCircle className="w-12 h-12 text-red-200" />
                </div>
              </button>
            </div>

            {/* Budgets annuels de l'etablissement */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mt-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Budgets annuels de l'établissement</h3>
                  <p className="text-sm text-gray-500">Année scolaire 2025-2026</p>
                </div>
                <button
                  onClick={() => {
                    if (editingQuotas) {
                      saveQuotas();
                    } else {
                      setTempQuotas({
                        HSE: quotas.find(q => q.type === 'HSE')?.budgetHours || 0,
                        DEVOIRS_FAITS: quotas.find(q => q.type === 'DEVOIRS_FAITS')?.budgetHours || 0,
                        RCD: quotas.find(q => q.type === 'RCD')?.budgetHours || 0,
                      });
                      setEditingQuotas(true);
                    }
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    editingQuotas
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                >
                  {editingQuotas ? 'Enregistrer' : 'Modifier les quotas'}
                </button>
              </div>

              {/* Explication */}
              <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg">
                <span className="font-medium">Définissez ici le nombre d'heures budgétées</span> pour chaque type de session.
                Les heures consommées correspondent aux sessions validées ou mises en paiement.
              </p>

              {editingQuotas && (
                <button
                  onClick={() => setEditingQuotas(false)}
                  className="mb-4 text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Annuler les modifications
                </button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* HSE Quota */}
                {(() => {
                  const quota = quotas.find(q => q.type === 'HSE');
                  const consumed = quota?.consumedHours || 0;
                  const budget = editingQuotas ? (tempQuotas.HSE || 0) : (quota?.budgetHours || 0);
                  const percentage = budget > 0 ? Math.min(100, (consumed / budget) * 100) : 0;
                  return (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-rose-700">Heures Supp. Effectives</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">HSE</span>
                          <div className="group relative">
                            <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                            <div className="absolute right-0 top-6 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                              Heures supplémentaires hors PACTE, payées individuellement
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-rose-600 mb-2">{consumed}h validées sur {budget}h budgétées</p>
                      {editingQuotas ? (
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm text-gray-500">Budget:</span>
                          <input
                            type="number"
                            min="0"
                            value={tempQuotas.HSE || 0}
                            onChange={(e) => setTempQuotas(prev => ({...prev, HSE: Number(e.target.value)}))}
                            className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-lg font-bold text-center"
                          />
                          <span className="text-gray-500">h</span>
                        </div>
                      ) : (
                        <div className="text-2xl font-bold text-gray-900 mb-2">
                          {consumed}h <span className="text-base font-normal text-gray-400">/ {budget}h</span>
                        </div>
                      )}
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-rose-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">Consommé</span>
                        <span className="text-sm font-medium text-rose-700">{percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })()}

                {/* DEVOIRS_FAITS Quota */}
                {(() => {
                  const quota = quotas.find(q => q.type === 'DEVOIRS_FAITS');
                  const consumed = quota?.consumedHours || 0;
                  const budget = editingQuotas ? (tempQuotas.DEVOIRS_FAITS || 0) : (quota?.budgetHours || 0);
                  const percentage = budget > 0 ? Math.min(100, (consumed / budget) * 100) : 0;
                  return (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-blue-700">Devoirs Faits</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">DF</span>
                          <div className="group relative">
                            <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                            <div className="absolute right-0 top-6 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                              Accompagnement des élèves dans leurs devoirs (PACTE ou HSE)
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-blue-600 mb-2">{consumed}h validées sur {budget}h budgétées</p>
                      {editingQuotas ? (
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm text-gray-500">Budget:</span>
                          <input
                            type="number"
                            min="0"
                            value={tempQuotas.DEVOIRS_FAITS || 0}
                            onChange={(e) => setTempQuotas(prev => ({...prev, DEVOIRS_FAITS: Number(e.target.value)}))}
                            className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-lg font-bold text-center"
                          />
                          <span className="text-gray-500">h</span>
                        </div>
                      ) : (
                        <div className="text-2xl font-bold text-gray-900 mb-2">
                          {consumed}h <span className="text-base font-normal text-gray-400">/ {budget}h</span>
                        </div>
                      )}
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">Consommé</span>
                        <span className="text-sm font-medium text-blue-700">{percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })()}

                {/* RCD Quota */}
                {(() => {
                  const quota = quotas.find(q => q.type === 'RCD');
                  const consumed = quota?.consumedHours || 0;
                  const budget = editingQuotas ? (tempQuotas.RCD || 0) : (quota?.budgetHours || 0);
                  const percentage = budget > 0 ? Math.min(100, (consumed / budget) * 100) : 0;
                  return (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-purple-700">Remplacements</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">RCD</span>
                          <div className="group relative">
                            <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                            <div className="absolute right-0 top-6 w-48 p-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                              Remplacement de Courte Durée d'un collègue absent (PACTE)
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-purple-600 mb-2">{consumed}h validées sur {budget}h budgétées</p>
                      {editingQuotas ? (
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm text-gray-500">Budget:</span>
                          <input
                            type="number"
                            min="0"
                            value={tempQuotas.RCD || 0}
                            onChange={(e) => setTempQuotas(prev => ({...prev, RCD: Number(e.target.value)}))}
                            className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-lg font-bold text-center"
                          />
                          <span className="text-gray-500">h</span>
                        </div>
                      ) : (
                        <div className="text-2xl font-bold text-gray-900 mb-2">
                          {consumed}h <span className="text-base font-normal text-gray-400">/ {budget}h</span>
                        </div>
                      )}
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-purple-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-500">Consommé</span>
                        <span className="text-sm font-medium text-purple-700">{percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </>
        ) : activeTab === 'teachers' ? (
          <div className="space-y-6">
            {/* Stats PACTE */}
            {pacteStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="text-sm text-gray-500 mb-1">Total enseignants</div>
                  <div className="text-2xl font-bold text-gray-900">{pacteStats.totalTeachers}</div>
                </div>
                <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                  <div className="text-sm text-green-600 mb-1">Avec PACTE</div>
                  <div className="text-2xl font-bold text-green-700">{pacteStats.teachersWithPacte}</div>
                </div>
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                  <div className="text-sm text-gray-500 mb-1">Sans PACTE</div>
                  <div className="text-2xl font-bold text-gray-700">{pacteStats.teachersWithoutPacte}</div>
                </div>
                <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
                  <div className="text-sm text-purple-600 mb-1">Taux PACTE</div>
                  <div className="text-2xl font-bold text-purple-700">{pacteStats.pactePercentage}%</div>
                </div>
              </div>
            )}

            {/* Recherche et filtres */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un enseignant..."
                  value={teacherSearchTerm}
                  onChange={(e) => setTeacherSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPacteFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    pacteFilter === 'all' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setPacteFilter('pacte')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    pacteFilter === 'pacte' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  PACTE
                </button>
                <button
                  onClick={() => setPacteFilter('non-pacte')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    pacteFilter === 'non-pacte' ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Sans PACTE
                </button>
              </div>
            </div>

            {/* Grille des enseignants */}
            {teachersLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTeachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className={`rounded-xl border p-4 transition-all ${
                      teacher.inPacte
                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                        : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        teacher.inPacte ? 'bg-green-500' : 'bg-gray-400'
                      }`}>
                        {teacher.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{teacher.name}</div>
                        <div className="text-xs text-gray-500 truncate">{teacher.subject || 'Non renseigné'}</div>
                      </div>
                    </div>

                    {/* PACTE Status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        teacher.inPacte ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {teacher.inPacte ? 'PACTE' : 'Hors PACTE'}
                      </span>
                    </div>

                    {/* Progress bar for PACTE */}
                    {teacher.inPacte && teacher.pacteHoursTarget > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progression PACTE</span>
                          <span>{teacher.pacteHoursCompleted}/{teacher.pacteHoursTarget}h</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (teacher.pacteHoursCompleted / teacher.pacteHoursTarget) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-purple-100 rounded-lg p-2">
                        <div className="text-lg font-bold text-purple-700">{teacher.stats.rcdSessions}</div>
                        <div className="text-[10px] text-purple-600">RCD</div>
                      </div>
                      <div className="bg-blue-100 rounded-lg p-2">
                        <div className="text-lg font-bold text-blue-700">{teacher.stats.devoirsFaitsSessions}</div>
                        <div className="text-[10px] text-blue-600">DF</div>
                      </div>
                      <div className="bg-rose-100 rounded-lg p-2">
                        <div className="text-lg font-bold text-rose-700">{teacher.stats.hseSessions}</div>
                        <div className="text-[10px] text-rose-600">HSE</div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
                      <span>{teacher.stats.currentYearSessions} sessions</span>
                      <span className="text-green-600">{teacher.stats.validatedSessions} validées</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!teachersLoading && filteredTeachers.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aucun enseignant trouvé</p>
              </div>
            )}
          </div>
        ) : activeTab === 'contrats' ? (
          <ContratsPacte
            teachers={teachers.map(t => ({
              id: t.id,
              name: t.name,
              username: t.username,
              initials: t.initials,
              inPacte: t.inPacte,
              pacteHoursTarget: t.pacteHoursTarget,
              pacteHoursCompleted: t.pacteHoursCompleted,
              pacteHoursDF: t.pacteHoursDF,
              pacteHoursRCD: t.pacteHoursRCD,
              pacteHoursCompletedDF: t.pacteHoursCompletedDF,
              pacteHoursCompletedRCD: t.pacteHoursCompletedRCD,
              stats: {
                totalSessions: t.stats.totalSessions,
                rcdSessions: t.stats.rcdSessions,
                devoirsFaitsSessions: t.stats.devoirsFaitsSessions,
                hseSessions: t.stats.hseSessions,
              }
            }))}
            pacteStats={pacteStats}
            loading={teachersLoading}
            apiBaseUrl={API_BASE_URL}
            onTeachersUpdate={(updated) => setTeachers(prev => prev.map(teacher => {
              const updatedTeacher = updated.find(u => u.id === teacher.id);
              if (updatedTeacher) {
                return {
                  ...teacher,
                  pacteHoursDF: updatedTeacher.pacteHoursDF || 0,
                  pacteHoursRCD: updatedTeacher.pacteHoursRCD || 0,
                  pacteHoursCompletedDF: updatedTeacher.pacteHoursCompletedDF || 0,
                  pacteHoursCompletedRCD: updatedTeacher.pacteHoursCompletedRCD || 0,
                  pacteHoursTarget: updatedTeacher.pacteHoursTarget || 0,
                  pacteHoursCompleted: updatedTeacher.pacteHoursCompleted || 0,
                  inPacte: updatedTeacher.inPacte,
                };
              }
              return teacher;
            }))}
            onStatsRefresh={fetchPacteStats}
          />
        ) : activeTab === 'stats' ? (
          <div className="space-y-3">
            {(() => {
              const validatedSessions = periodFilteredSessions.filter(s => s.status === 'VALIDATED' || s.status === 'PAID');
              const hseCount = validatedSessions.filter(s => s.type === 'HSE').length;
              const dfCount = validatedSessions.filter(s => s.type === 'DEVOIRS_FAITS').length;
              const rcdCount = validatedSessions.filter(s => s.type === 'RCD').length;
              const teacherCount = new Set(validatedSessions.map(s => s.teacherId)).size;

              // Stats par matière
              const subjectStats = validatedSessions.reduce((acc, s) => {
                const subject = s.teacherSubject || 'Non renseigné';
                if (!acc[subject]) acc[subject] = { total: 0, hse: 0, df: 0, rcd: 0 };
                acc[subject].total++;
                if (s.type === 'HSE') acc[subject].hse++;
                else if (s.type === 'DEVOIRS_FAITS') acc[subject].df++;
                else if (s.type === 'RCD') acc[subject].rcd++;
                return acc;
              }, {} as Record<string, { total: number; hse: number; df: number; rcd: number }>);
              const sortedSubjects = Object.entries(subjectStats)
                .map(([subject, data]) => ({ subject, ...data }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 6);

              // Stats par créneaux horaires avec breakdown par type
              const slotStats = validatedSessions.reduce((acc, s) => {
                const slot = s.timeSlot || 'Inconnu';
                if (!acc[slot]) acc[slot] = { total: 0, rcd: 0, df: 0, hse: 0 };
                acc[slot].total++;
                if (s.type === 'RCD') acc[slot].rcd++;
                else if (s.type === 'DEVOIRS_FAITS') acc[slot].df++;
                else if (s.type === 'HSE') acc[slot].hse++;
                return acc;
              }, {} as Record<string, { total: number; rcd: number; df: number; hse: number }>);
              const slotLabels: Record<string, string> = {
                'M1': '8h-9h', 'M2': '9h-10h', 'M3': '10h-11h', 'M4': '11h-12h',
                'S1': '13h-14h', 'S2': '14h-15h', 'S3': '15h-16h', 'S4': '16h-17h'
              };
              const sortedSlots = Object.entries(slotStats)
                .map(([slot, data]) => ({ slot, label: slotLabels[slot] || slot, ...data }))
                .sort((a, b) => {
                  const order = ['M1', 'M2', 'M3', 'M4', 'S1', 'S2', 'S3', 'S4'];
                  return order.indexOf(a.slot) - order.indexOf(b.slot);
                });
              const maxSlotCount = Math.max(...sortedSlots.map(s => s.total), 1);

              // Stats par jour avec breakdown par type
              const dayStats = validatedSessions.reduce((acc, s) => {
                const day = new Date(s.date).getDay();
                if (!acc[day]) acc[day] = { total: 0, rcd: 0, df: 0, hse: 0 };
                acc[day].total++;
                if (s.type === 'RCD') acc[day].rcd++;
                else if (s.type === 'DEVOIRS_FAITS') acc[day].df++;
                else if (s.type === 'HSE') acc[day].hse++;
                return acc;
              }, {} as Record<number, { total: number; rcd: number; df: number; hse: number }>);
              const dayLabels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
              const sortedDays = [1, 2, 3, 4, 5].map(day => ({
                day,
                label: dayLabels[day],
                total: dayStats[day]?.total || 0,
                rcd: dayStats[day]?.rcd || 0,
                df: dayStats[day]?.df || 0,
                hse: dayStats[day]?.hse || 0,
              }));
              const maxDayCount = Math.max(...sortedDays.map(d => d.total), 1);

              // Stats par enseignant
              const teacherStatsData = validatedSessions.reduce((acc, s) => {
                if (!acc[s.teacherId]) {
                  acc[s.teacherId] = { name: s.teacherName || 'Inconnu', subject: s.teacherSubject || '', hours: 0 };
                }
                acc[s.teacherId].hours++;
                return acc;
              }, {} as Record<number, { name: string; subject: string; hours: number }>);
              const sortedTeachers = Object.entries(teacherStatsData)
                .map(([id, data]) => ({ id: Number(id), ...data }))
                .sort((a, b) => b.hours - a.hours)
                .slice(0, 5);

              // Stats évolution - 52 semaines (1 an)
              const weeks: { label: string; count: number; rcd: number; df: number; hse: number }[] = [];
              const today = new Date();
              for (let i = 51; i >= 0; i--) {
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay() + 1 - (i * 7));
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                const weekSessions = sessions.filter(s => {
                  const d = new Date(s.date);
                  return d >= weekStart && d <= weekEnd && (s.status === 'VALIDATED' || s.status === 'PAID');
                });
                weeks.push({
                  label: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
                  count: weekSessions.length,
                  rcd: weekSessions.filter(s => s.type === 'RCD').length,
                  df: weekSessions.filter(s => s.type === 'DEVOIRS_FAITS').length,
                  hse: weekSessions.filter(s => s.type === 'HSE').length,
                });
              }
              const maxWeekCount = Math.max(...weeks.map(w => w.count), 1);

              // Stats évolution - année scolaire (Sep → Juil)
              const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
              const months: { label: string; count: number; rcd: number; df: number; hse: number; month: number; year: number }[] = [];

              // Déterminer l'année scolaire en cours
              const currentMonth = today.getMonth();
              const currentYear = today.getFullYear();
              const schoolYearStart = currentMonth >= 8 ? currentYear : currentYear - 1;

              // Mois de l'année scolaire: Sep → Juil
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
                  const d = new Date(s.date);
                  return d.getMonth() === month && d.getFullYear() === year && (s.status === 'VALIDATED' || s.status === 'PAID');
                });
                months.push({
                  label: monthNames[month],
                  count: monthSessions.length,
                  rcd: monthSessions.filter(s => s.type === 'RCD').length,
                  df: monthSessions.filter(s => s.type === 'DEVOIRS_FAITS').length,
                  hse: monthSessions.filter(s => s.type === 'HSE').length,
                  month,
                  year,
                });
              }
              const maxMonthCount = Math.max(...months.map(m => m.count), 1);

              return (
                <>
                  {/* HEADER avec période */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Statistiques</h2>
                    <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                      {[
                        { id: 'week', label: '7 jours' },
                        { id: 'month', label: '30 jours' },
                        { id: 'trimester', label: '3 mois' },
                        { id: 'year', label: '1 an' },
                      ].map(period => (
                        <button
                          key={period.id}
                          onClick={() => setTimeFilter(period.id as typeof timeFilter)}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                            timeFilter === period.id
                              ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          {period.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* HERO - Chiffre principal */}
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 p-4 shadow-lg">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                    <div className="relative flex items-center justify-between">
                      <div>
                        <p className="text-white/80 text-xs font-medium">Heures validées</p>
                        <p className="text-4xl font-black text-white">{validatedSessions.length}h</p>
                        <p className="text-white/70 text-xs">{teacherCount} enseignant{teacherCount > 1 ? 's' : ''} • {timeFilter === 'week' ? '7j' : timeFilter === 'month' ? '30j' : timeFilter === 'trimester' ? '3 mois' : '1 an'}</p>
                      </div>
                      <div className="flex gap-2">
                        <div className="bg-purple-500 rounded-lg p-2.5 text-center min-w-[60px] shadow-md">
                          <p className="text-xl font-bold text-white">{rcdCount}</p>
                          <p className="text-purple-100 text-[10px]">RCD</p>
                        </div>
                        <div className="bg-blue-500 rounded-lg p-2.5 text-center min-w-[60px] shadow-md">
                          <p className="text-xl font-bold text-white">{dfCount}</p>
                          <p className="text-blue-100 text-[10px]">Dev. Faits</p>
                        </div>
                        <div className="bg-rose-500 rounded-lg p-2.5 text-center min-w-[60px] shadow-md">
                          <p className="text-xl font-bold text-white">{hseCount}</p>
                          <p className="text-rose-100 text-[10px]">HSE</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* GRID 2 colonnes */}
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                    {/* ANALYSE avec onglets */}
                    <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 text-sm">Analyse</h3>
                        <div className="flex bg-gray-100 rounded-lg p-0.5">
                          {[
                            { id: 'matiere', label: 'Matière' },
                            { id: 'creneaux', label: 'Créneaux' },
                            { id: 'jours', label: 'Jours' },
                          ].map(view => (
                            <button
                              key={view.id}
                              onClick={() => setAnalysisView(view.id as typeof analysisView)}
                              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                                analysisView === view.id
                                  ? 'bg-white text-gray-900 shadow-sm'
                                  : 'text-gray-500 hover:text-gray-700'
                              }`}
                            >
                              {view.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="p-3">
                        {/* Vue MATIÈRE */}
                        {analysisView === 'matiere' && (
                          sortedSubjects.length === 0 ? (
                            <p className="text-gray-400 text-center py-6">Aucune donnée pour cette période</p>
                          ) : (
                            <div className="space-y-3">
                              {sortedSubjects.map((item, idx) => (
                                <div key={idx}>
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-gray-400 text-sm w-5">{idx + 1}.</span>
                                      <span className="font-medium text-gray-900 text-sm">{item.subject}</span>
                                    </div>
                                    <span className="font-bold text-gray-900 text-sm">{item.total}h</span>
                                  </div>
                                  <div className="flex items-center gap-2 ml-7">
                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                                      {item.rcd > 0 && <div className="h-full bg-purple-500" style={{ width: `${(item.rcd / item.total) * 100}%` }} />}
                                      {item.df > 0 && <div className="h-full bg-blue-500" style={{ width: `${(item.df / item.total) * 100}%` }} />}
                                      {item.hse > 0 && <div className="h-full bg-rose-500" style={{ width: `${(item.hse / item.total) * 100}%` }} />}
                                    </div>
                                    <div className="flex gap-2 text-[10px] text-gray-500">
                                      {item.rcd > 0 && <span>{item.rcd} RCD</span>}
                                      {item.df > 0 && <span>{item.df} DF</span>}
                                      {item.hse > 0 && <span>{item.hse} HSE</span>}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        )}
                        {/* Vue CRÉNEAUX */}
                        {analysisView === 'creneaux' && (
                          sortedSlots.length === 0 ? (
                            <p className="text-gray-400 text-center py-6">Aucune donnée pour cette période</p>
                          ) : (
                            <div className="space-y-2">
                              {sortedSlots.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                  <span className="text-gray-600 text-sm font-medium w-16">{item.slot}</span>
                                  <span className="text-gray-400 text-xs w-16">{item.label}</span>
                                  <div className="flex-1 h-6 bg-gray-100 rounded-md overflow-hidden flex">
                                    {item.rcd > 0 && <div className="h-full bg-purple-500" style={{ width: `${(item.rcd / maxSlotCount) * 100}%` }} />}
                                    {item.df > 0 && <div className="h-full bg-blue-500" style={{ width: `${(item.df / maxSlotCount) * 100}%` }} />}
                                    {item.hse > 0 && <div className="h-full bg-rose-500" style={{ width: `${(item.hse / maxSlotCount) * 100}%` }} />}
                                  </div>
                                  <span className="font-bold text-gray-900 text-sm w-10 text-right">{item.total}h</span>
                                </div>
                              ))}
                            </div>
                          )
                        )}
                        {/* Vue JOURS */}
                        {analysisView === 'jours' && (
                          <div className="space-y-2">
                            {sortedDays.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                <span className="text-gray-600 text-sm font-medium w-12">{item.label}</span>
                                <div className="flex-1 h-6 bg-gray-100 rounded-md overflow-hidden flex">
                                  {item.rcd > 0 && <div className="h-full bg-purple-500" style={{ width: `${(item.rcd / maxDayCount) * 100}%` }} />}
                                  {item.df > 0 && <div className="h-full bg-blue-500" style={{ width: `${(item.df / maxDayCount) * 100}%` }} />}
                                  {item.hse > 0 && <div className="h-full bg-rose-500" style={{ width: `${(item.hse / maxDayCount) * 100}%` }} />}
                                </div>
                                <span className="font-bold text-gray-900 text-sm w-10 text-right">{item.total}h</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* TOP ENSEIGNANTS */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900 text-sm">Top enseignants</h3>
                      </div>
                      <div className="p-2">
                        {sortedTeachers.length === 0 ? (
                          <p className="text-gray-400 text-center py-6">Aucune donnée</p>
                        ) : (
                          <div className="space-y-1">
                            {sortedTeachers.map((teacher, idx) => (
                              <div key={teacher.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                  idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white' :
                                  idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700' :
                                  idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                                  'bg-gray-200 text-gray-600'
                                }`}>
                                  {idx < 3 ? ['🥇', '🥈', '🥉'][idx] : idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate text-sm">{teacher.name}</p>
                                  {teacher.subject && <p className="text-xs text-gray-500 truncate">{teacher.subject}</p>}
                                </div>
                                <span className="font-bold text-amber-600 text-sm">{teacher.hours}h</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ÉVOLUTION - Toggle Semaines/Mois */}
                  <div className="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-xl p-3 shadow-lg">
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
                      <div className="flex items-center gap-3">
                        {timelineView === 'semaines' && <span className="text-slate-500 text-[10px]">← Scroll</span>}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div><span className="text-slate-400 text-[10px]">RCD</span></div>
                          <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div><span className="text-slate-400 text-[10px]">DF</span></div>
                          <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div><span className="text-slate-400 text-[10px]">HSE</span></div>
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
                        <div className="flex gap-1" style={{ minWidth: `${weeks.length * 36}px` }}>
                          {weeks.map((week, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-0.5 group" style={{ width: '32px' }}>
                              <div className="w-full flex flex-col items-center justify-end h-16 relative">
                                {week.count > 0 && (
                                  <span className="absolute -top-4 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {week.count}h
                                  </span>
                                )}
                                <div className="w-full flex flex-col justify-end rounded-t overflow-hidden" style={{ height: `${Math.max((week.count / maxWeekCount) * 100, 4)}%` }}>
                                  {week.hse > 0 && <div className="w-full bg-rose-500" style={{ height: `${(week.hse / week.count) * 100}%`, minHeight: '2px' }} />}
                                  {week.df > 0 && <div className="w-full bg-blue-500" style={{ height: `${(week.df / week.count) * 100}%`, minHeight: '2px' }} />}
                                  {week.rcd > 0 && <div className="w-full bg-purple-500" style={{ height: `${(week.rcd / week.count) * 100}%`, minHeight: '2px' }} />}
                                  {week.count === 0 && <div className="w-full bg-slate-700 h-1 rounded-t" />}
                                </div>
                              </div>
                              <span className="text-[8px] text-slate-500 group-hover:text-slate-300 transition-colors">{week.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Vue Mois */}
                    {timelineView === 'mois' && (
                      <div className="flex gap-2 justify-center">
                        {months.map((month, idx) => {
                          const isCurrentMonth = month.month === today.getMonth() && month.year === today.getFullYear();
                          return (
                            <div key={idx} className="flex flex-col items-center gap-0.5 group flex-1 max-w-[50px]">
                              <div className="w-full flex flex-col items-center justify-end h-16 relative">
                                {month.count > 0 && (
                                  <span className="absolute -top-4 text-[10px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {month.count}h
                                  </span>
                                )}
                                <div className="w-full flex flex-col justify-end rounded-t overflow-hidden" style={{ height: `${Math.max((month.count / maxMonthCount) * 100, 4)}%` }}>
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
                </>
              );
            })()}
          </div>
        ) : activeTab === 'sessions' ? (
          <div className="space-y-4">
            {/* Sous-filtres de statut */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { id: 'pending', label: 'A valider', count: stats.pending, color: 'amber' },
                { id: 'validated', label: 'Validées', count: stats.validated, color: 'green' },
                { id: 'rejected', label: 'Rejetées', count: stats.rejected, color: 'red' },
                { id: 'all', label: 'Toutes', count: sessions.length, color: 'gray' },
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setSessionFilter(filter.id as typeof sessionFilter)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    sessionFilter === filter.id
                      ? filter.color === 'amber' ? 'bg-amber-500 text-white'
                        : filter.color === 'green' ? 'bg-green-500 text-white'
                        : filter.color === 'red' ? 'bg-red-500 text-white'
                        : 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                  {filter.count > 0 && (
                    <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                      sessionFilter === filter.id ? 'bg-white/20' : 'bg-gray-200'
                    }`}>
                      {filter.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par enseignant, type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Tous les types</option>
                <option value="RCD">RCD</option>
                <option value="DEVOIRS_FAITS">Devoirs Faits</option>
                <option value="HSE">HSE</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>

            {/* Barre d'actions en lot */}
            {sessionFilter === 'pending' && selectableSessions.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleSelectAll}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600"
                    >
                      {selectedIds.size === selectableSessions.length && selectableSessions.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-purple-600" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                      {selectedIds.size === selectableSessions.length && selectableSessions.length > 0
                        ? 'Tout deselectionner'
                        : 'Tout selectionner'}
                    </button>
                    {selectedIds.size > 0 && (
                      <span className="text-sm text-purple-600 font-medium">
                        {selectedIds.size} session{selectedIds.size > 1 ? 's' : ''} selectionnee{selectedIds.size > 1 ? 's' : ''}
                      </span>
                    )}
                    {filteredSessions.some(s => s.type === 'AUTRE' && s.status === 'PENDING_VALIDATION') && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        Sessions "Autre" : traitement individuel requis
                      </span>
                    )}
                  </div>

                  {selectedIds.size > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowBatchDeleteModal(true)}
                        disabled={batchActionLoading}
                        className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                        title="Supprimer la selection"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={openBatchRejectModal}
                        disabled={batchActionLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
                      >
                        Rejeter ({selectedIds.size})
                      </button>
                      <button
                        onClick={handleBatchValidate}
                        disabled={batchActionLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {batchActionLoading ? 'Traitement...' : `Valider (${selectedIds.size})`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sessions */}
            {filteredSessions.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucune session trouvee</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSessions.map(session => (
                  <div
                    key={session.id}
                    className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all ${
                      selectedIds.has(session.id) ? 'border-purple-400 bg-purple-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Checkbox pour selection en lot (sauf AUTRE) */}
                          {(session.status === 'PENDING_VALIDATION' || session.status === 'PENDING_REVIEW') && session.type !== 'AUTRE' && (
                            <button
                              onClick={() => toggleSelection(session.id)}
                              className="text-gray-400 hover:text-purple-600"
                            >
                              {selectedIds.has(session.id) ? (
                                <CheckSquare className="w-5 h-5 text-purple-600" />
                              ) : (
                                <Square className="w-5 h-5" />
                              )}
                            </button>
                          )}
                          <User className="w-5 h-5 text-gray-400" />
                          <span className="font-semibold text-gray-900">{session.teacherName}</span>
                          {getStatusBadge(session.status)}
                          <span className={`px-2 py-1 text-xs rounded-full border ${getTypeColor(session.type)}`}>
                            {getTypeLabel(session.type)}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(session.date)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{session.timeSlot}</span>
                          </div>
                        </div>

                        {session.type === 'RCD' && session.className && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Classe:</span> {session.className}
                            {getReplacedTeacherName(session) && (
                              <span className="ml-3">
                                <span className="font-medium">Remplace:</span> {getReplacedTeacherName(session)}
                              </span>
                            )}
                          </p>
                        )}

                        {session.type === 'DEVOIRS_FAITS' && (
                          <p className="text-sm text-gray-600">
                            {session.studentCount && <span><span className="font-medium">Eleves:</span> {session.studentCount}</span>}
                            {session.gradeLevel && <span className="ml-3"><span className="font-medium">Niveau:</span> {session.gradeLevel}</span>}
                          </p>
                        )}

                        {session.reviewComments && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-sm">
                            <span className="font-medium text-amber-800">Note secretariat:</span>{' '}
                            <span className="text-amber-700">{session.reviewComments}</span>
                          </div>
                        )}

                        {session.rejectionReason && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-sm">
                            <span className="font-medium text-red-800">Motif de rejet:</span>{' '}
                            <span className="text-red-700">{session.rejectionReason}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleViewSession(session)}
                          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                            (session.status === 'PENDING_VALIDATION' || session.status === 'PENDING_REVIEW')
                              ? 'bg-purple-500 hover:bg-purple-600'
                              : 'bg-gray-500 hover:bg-gray-600'
                          }`}
                        >
                          <Eye className="w-4 h-4" />
                          {(session.status === 'PENDING_VALIDATION' || session.status === 'PENDING_REVIEW') ? 'Examiner' : 'Voir'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Validation de seance</h2>
                  <p className="text-sm text-gray-600">
                    {formatDate(selectedSession.date)},{' '}
                    <span className={selectedSession.timeSlot.includes('M') ? 'text-sky-600 font-medium' : 'text-amber-600 font-medium'}>
                      {selectedSession.timeSlot}
                    </span>
                  </p>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Infos principales */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Enseignant</p>
                  <p className="font-semibold text-gray-900">{selectedSession.teacherName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Type de seance</p>
                  <span className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${getTypeColor(selectedSession.type)}`}>
                    {selectedSession.type === 'RCD' ? 'RCD' :
                     selectedSession.type === 'DEVOIRS_FAITS' ? 'Devoirs Faits' :
                     selectedSession.type === 'HSE' ? 'HSE' : 'Autre'}
                  </span>
                </div>
              </div>

              {/* Details RCD */}
              {selectedSession.type === 'RCD' && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedSession.className && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">Classe</p>
                      <p className="font-semibold text-gray-900">{selectedSession.className}</p>
                    </div>
                  )}
                  {getReplacedTeacherName(selectedSession) && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">Professeur remplace</p>
                      <p className="font-semibold text-gray-900">{getReplacedTeacherName(selectedSession)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Details Devoirs Faits */}
              {selectedSession.type === 'DEVOIRS_FAITS' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {selectedSession.gradeLevel && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">Niveau</p>
                        <p className="font-semibold text-gray-900">{selectedSession.gradeLevel}</p>
                      </div>
                    )}
                    {selectedSession.studentCount && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">Nombre d'eleves</p>
                        <p className="font-semibold text-gray-900">{selectedSession.studentCount}</p>
                      </div>
                    )}
                  </div>
                  {/* Liste des eleves */}
                  {selectedSession.studentsList && selectedSession.studentsList.length > 0 && (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-xs text-blue-700 uppercase font-medium mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Liste des eleves
                      </p>
                      <div className="max-h-40 overflow-y-auto">
                        <div className="grid gap-1">
                          {selectedSession.studentsList.map((student, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between px-2 py-1 bg-white rounded border border-blue-100 text-sm"
                            >
                              <span className="font-medium text-gray-800">
                                {student.lastName} {student.firstName}
                              </span>
                              {student.className && (
                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                  {student.className}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Option de conversion en HSE pour RCD et Devoirs Faits */}
              {(selectedSession.type === 'RCD' || selectedSession.type === 'DEVOIRS_FAITS') &&
               (selectedSession.status === 'PENDING_VALIDATION' || selectedSession.status === 'PENDING_REVIEW') &&
               (actionState === 'VALIDATE_COMMENT_PROMPT' || actionState === 'VALIDATE') && (
                <div className="border-t pt-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={convertToHSE}
                      onChange={(e) => setConvertToHSE(e.target.checked)}
                      className="w-5 h-5 rounded border-2 border-rose-300 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <span className="font-medium text-gray-900 group-hover:text-rose-700">
                        Convertir en HSE
                      </span>
                      <p className="text-xs text-gray-500">
                        Cette heure sera comptabilisée comme Heure Supplémentaire Effective
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Details AUTRE avec conversion */}
              {selectedSession.type === 'AUTRE' && (
                <div className="space-y-4">
                  {selectedSession.description && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">Description</p>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        {selectedSession.description}
                      </div>
                    </div>
                  )}

                  {(selectedSession.status === 'PENDING_VALIDATION' || selectedSession.status === 'PENDING_REVIEW') &&
                   (actionState === 'VALIDATE_COMMENT_PROMPT' || actionState === 'VALIDATE') && (
                    <div className="border-t pt-4">
                      <p className="text-sm font-medium text-gray-900 mb-2">Conversion en heures</p>
                      <p className="text-sm text-gray-500 mb-3">
                        Convertir cette activite en :
                      </p>

                      <div className="flex flex-wrap gap-3 mb-4">
                        {[
                          { value: 'RCD', label: 'RCD', color: 'purple', icon: '📋' },
                          { value: 'DEVOIRS_FAITS', label: 'Devoirs Faits', color: 'blue', icon: '📚' },
                          { value: 'HSE', label: 'HSE', color: 'rose', icon: '⏱️' },
                        ].map(option => (
                          <button
                            key={option.value}
                            onClick={() => setConversionType(option.value)}
                            className={`px-5 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                              conversionType === option.value
                                ? option.color === 'purple'
                                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-200 scale-105'
                                  : option.color === 'blue'
                                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 scale-105'
                                  : 'bg-rose-500 text-white shadow-lg shadow-rose-200 scale-105'
                                : option.color === 'purple'
                                ? 'bg-purple-50 text-purple-700 border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-100'
                                : option.color === 'blue'
                                ? 'bg-blue-50 text-blue-700 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-100'
                                : 'bg-rose-50 text-rose-700 border-2 border-rose-200 hover:border-rose-400 hover:bg-rose-100'
                            }`}
                          >
                            <span>{option.icon}</span>
                            <span>{option.label}</span>
                            {conversionType === option.value && <CheckCircle className="w-4 h-4" />}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                        <span className="text-sm font-medium text-gray-700">Nombre d'heures :</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setConversionHours(Math.max(0.5, conversionHours - 0.5))}
                            className="w-10 h-10 rounded-xl bg-white border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 text-gray-700 font-bold text-lg transition-all"
                          >
                            -
                          </button>
                          <span className="w-16 text-center font-bold text-xl text-purple-600">{conversionHours}h</span>
                          <button
                            onClick={() => setConversionHours(conversionHours + 0.5)}
                            className="w-10 h-10 rounded-xl bg-white border-2 border-gray-200 hover:border-purple-400 hover:bg-purple-50 text-gray-700 font-bold text-lg transition-all"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Note secretariat */}
              {selectedSession.reviewComments && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                  <p className="text-xs text-amber-800 uppercase font-medium mb-1">Note du secretariat</p>
                  <p className="text-sm text-amber-700">{selectedSession.reviewComments}</p>
                </div>
              )}

              {/* Pieces jointes */}
              {(selectedSession.status === 'PENDING_VALIDATION' || selectedSession.status === 'PENDING_REVIEW') && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-3 flex items-center gap-2">
                    <Paperclip className="w-4 h-4" />
                    Pieces justificatives ({attachments.length})
                  </p>

                  {attachmentsLoading ? (
                    <div className="bg-gray-50 p-6 rounded-lg text-center">
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">Chargement...</p>
                    </div>
                  ) : attachments.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg text-center">
                      <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Aucune piece jointe</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {attachments.map(attachment => (
                        <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium text-sm">{attachment.originalName}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                            </div>
                            {attachment.isVerified && (
                              <span
                                className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 flex items-center gap-1"
                                title="Ce document a ete verifie par la secretaire"
                              >
                                <CheckCircle className="w-3 h-3" />
                                Document verifie
                              </span>
                            )}
                          </div>
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Champ commentaire/motif (visible selon l'etat) */}
              {(actionState === 'VALIDATE' || actionState === 'REJECT') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {actionState === 'REJECT' ? 'Motif du refus' : 'Commentaire'}{' '}
                    <span className="text-xs text-gray-500">(optionnel)</span>
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder={actionState === 'REJECT'
                      ? 'Veuillez preciser le motif du refus...'
                      : 'Commentaire pour cette validation...'}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={3}
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Footer avec actions */}
            {(selectedSession.status === 'PENDING_VALIDATION' || selectedSession.status === 'PENDING_REVIEW') && (
              <div className="p-6 border-t border-gray-100">
                {/* Etat: choix validation avec/sans commentaire */}
                {actionState === 'VALIDATE_COMMENT_PROMPT' && (
                  <div className="space-y-3">
                    {/* Message si conversion requise pour AUTRE */}
                    {selectedSession.type === 'AUTRE' && !conversionType && (
                      <p className="text-sm text-amber-600 text-center">
                        Selectionnez un type de conversion ci-dessus pour pouvoir valider
                      </p>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={finishValidation}
                        disabled={actionLoading || (selectedSession.type === 'AUTRE' && !conversionType)}
                        className="flex-1 py-4 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-2xl mb-1">👍</span>
                          <span className="font-medium text-gray-700">Valider sans commentaire</span>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setFeedback('');
                          setActionState('VALIDATE');
                        }}
                        disabled={selectedSession.type === 'AUTRE' && !conversionType}
                        className="flex-1 py-4 px-4 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-2xl mb-1">✏️</span>
                          <span className="font-medium">Ajouter un commentaire</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Etat: choix rejet avec/sans motif */}
                {actionState === 'REJECT_COMMENT_PROMPT' && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={finishRejection}
                      disabled={actionLoading}
                      className="flex-1 py-4 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-2xl mb-1">👎</span>
                        <span className="font-medium text-gray-700">Refuser sans commentaire</span>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setFeedback('');
                        setActionState('REJECT');
                      }}
                      className="flex-1 py-4 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-2xl mb-1">✏️</span>
                        <span className="font-medium">Ajouter un motif de refus</span>
                      </div>
                    </button>
                  </div>
                )}

                {/* Etat: saisie commentaire pour validation */}
                {actionState === 'VALIDATE' && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        setActionState(null);
                        setFeedback('');
                      }}
                      className="flex-1 py-2 px-4 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={finishValidation}
                      disabled={actionLoading}
                      className="flex-1 py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    >
                      {actionLoading ? 'Envoi...' : 'Confirmer la validation'}
                    </button>
                  </div>
                )}

                {/* Etat: saisie motif pour rejet */}
                {actionState === 'REJECT' && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        setActionState(null);
                        setFeedback('');
                      }}
                      className="flex-1 py-2 px-4 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={finishRejection}
                      disabled={actionLoading}
                      className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                      {actionLoading ? 'Envoi...' : 'Confirmer le refus'}
                    </button>
                  </div>
                )}

                {/* Etat initial: boutons Refuser / Valider */}
                {actionState === null && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                      title="Supprimer cette session"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleReject}
                      className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors"
                    >
                      Refuser
                    </button>
                    <button
                      onClick={handleValidate}
                      className="flex-1 py-3 px-4 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
                    >
                      Valider
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Footer pour sessions deja traitees (VALIDATED, REJECTED ou PAID) */}
            {(selectedSession.status === 'VALIDATED' || selectedSession.status === 'REJECTED' || selectedSession.status === 'PAID') && (
              <div className="p-6 border-t border-gray-100 space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium rounded-lg transition-colors flex items-center justify-center"
                    title="Supprimer cette session"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleCancelDecision}
                    disabled={actionLoading}
                    className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? 'Annulation...' : selectedSession.status === 'PAID' ? 'Retirer de la mise en paiement' : 'Annuler la decision'}
                  </button>
                </div>
                <button
                  onClick={closeModal}
                  className="w-full py-2 px-4 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modale rejet en lot */}
      {showBatchRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Rejeter en lot</h2>
                <button
                  onClick={() => setShowBatchRejectModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">Attention</p>
                    <p>Vous allez rejeter {selectedIds.size} session{selectedIds.size > 1 ? 's' : ''}.</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motif du rejet <span className="text-xs text-gray-500">(optionnel)</span>
                </label>
                <textarea
                  value={batchRejectReason}
                  onChange={(e) => setBatchRejectReason(e.target.value)}
                  placeholder="Motif commun pour toutes les sessions..."
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowBatchRejectModal(false)}
                className="flex-1 py-2 px-4 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleBatchReject}
                disabled={batchActionLoading}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {batchActionLoading ? 'Traitement...' : `Rejeter ${selectedIds.size} session${selectedIds.size > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale confirmation suppression */}
      {showDeleteModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Supprimer la session</h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">Action irreversible</p>
                    <p>Cette session sera definitivement supprimee de la base de donnees.</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Enseignant:</span> {selectedSession.teacherName}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Date:</span> {new Date(selectedSession.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Type:</span> {selectedSession.type === 'DEVOIRS_FAITS' ? 'Devoirs Faits' : selectedSession.type}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Statut:</span> {selectedSession.status}
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2 px-4 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteSession}
                disabled={actionLoading}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {actionLoading ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale confirmation suppression en lot */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Supprimer en lot</h2>
                <button
                  onClick={() => setShowBatchDeleteModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium">Action irreversible</p>
                    <p>Vous allez supprimer definitivement <strong>{selectedIds.size} session{selectedIds.size > 1 ? 's' : ''}</strong>.</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Sessions selectionnees :</p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {sessions.filter(s => selectedIds.has(s.id)).map(s => (
                    <div key={s.id} className="text-sm text-gray-800">
                      {s.teacherName} - {new Date(s.date).toLocaleDateString('fr-FR')} - {s.type === 'DEVOIRS_FAITS' ? 'DF' : s.type}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowBatchDeleteModal(false)}
                className="flex-1 py-2 px-4 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleBatchDelete}
                disabled={batchActionLoading}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {batchActionLoading ? 'Suppression...' : `Supprimer ${selectedIds.size} session${selectedIds.size > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tour guidé pour la direction */}
      {showTour && (
        <GuidedTour
          tourId="principal"
          steps={principalTourSteps}
          onComplete={() => setShowTour(false)}
        />
      )}
    </div>
  );
}
