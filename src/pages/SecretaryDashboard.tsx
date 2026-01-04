import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Search, Calendar, Clock, User, FileText,
  Download, CheckCircle, Eye, AlertCircle, AlertTriangle,
  Paperclip, Send, Clock3, Home, ClipboardCheck,
  CreditCard, History, X, CheckSquare, Square,
  Users, UserCheck, UserX, Edit2, TrendingUp, HelpCircle,
  Image, FileSpreadsheet, File, BookOpen
} from 'lucide-react';
import { Switch } from '../components/ui/switch';
import { API_BASE_URL } from '../config/api';
import { ContratsPacte } from '../components/ContratsPacte';
import GuidedTour, { shouldShowTour } from '../components/GuidedTour';
import type { TourStep } from '../components/GuidedTour';

// Steps du tour guidé pour le secrétariat
const secretaryTourSteps: TourStep[] = [
  {
    target: '[data-tour="sessions-tab"]',
    title: 'Onglet Sessions',
    description: 'Accédez à toutes les sessions déclarées par les enseignants.',
    position: 'bottom',
    clickBefore: '[data-tour="sessions-tab"]',
  },
  {
    target: '[data-tour="pending-filter"]',
    title: 'Sessions à examiner',
    description: 'Sessions en attente de vérification. Vérifiez les informations et pièces jointes avant de transmettre.',
    position: 'bottom',
  },
  {
    target: '[data-tour="to-pay-filter"]',
    title: 'Mise en paiement',
    description: 'Une fois validées par la direction, mettez les sessions en paiement ici.',
    position: 'bottom',
  },
  {
    target: '[data-tour="teachers-tab"]',
    title: 'Onglet Enseignants',
    description: 'Consultez la liste des enseignants et leur activité.',
    position: 'bottom',
    clickBefore: '[data-tour="teachers-tab"]',
  },
  {
    target: '[data-tour="pacte-toggle"]',
    title: 'Changer le statut PACTE',
    description: 'Cliquez sur ce bouton pour basculer un enseignant en PACTE ou hors PACTE.',
    position: 'right',
  },
  {
    target: '[data-tour="contrats-tab"]',
    title: 'Onglet Contrats PACTE',
    description: 'Gérez les heures prévues au contrat de chaque enseignant.',
    position: 'bottom',
    clickBefore: '[data-tour="contrats-tab"]',
  },
  {
    target: '[data-tour="edit-contrat"]',
    title: 'Modifier un contrat',
    description: 'Cliquez sur le crayon ✏️ pour configurer les heures DF et RCD.',
    position: 'left',
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
  comment?: string;
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
  name: string;
  role: string;
}

interface Teacher {
  id: number;
  name: string;
  username: string;
  initials: string;
  inPacte: boolean;
  pacteHoursTarget: number;
  pacteHoursCompleted: number;
  // Contrat PACTE détaillé
  pacteHoursDF: number; // Heures Devoirs Faits prévues au contrat
  pacteHoursRCD: number; // Heures RCD prévues au contrat
  // Heures déjà réalisées (saisie manuelle pour rattrapage)
  pacteHoursCompletedDF: number; // Heures DF déjà réalisées
  pacteHoursCompletedRCD: number; // Heures RCD déjà réalisées
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
  sessionsWithPacte: number;
  sessionsWithoutPacte: number;
}

export default function SecretaryDashboard() {
  const navigate = useNavigate();

  // User state
  const [user, setUser] = useState<UserInfo | null>(null);

  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  // Tour guidé
  const [showTour, setShowTour] = useState(shouldShowTour('secretary'));

  // UI state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sessions' | 'teachers' | 'contrats'>('dashboard');
  const [sessionFilter, setSessionFilter] = useState<'pending' | 'to-pay' | 'history'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal contrat PACTE
  const [showContratModal, setShowContratModal] = useState(false);
  const [editingContrat, setEditingContrat] = useState<Teacher | null>(null);
  const [contratHoursDF, setContratHoursDF] = useState(0);
  const [contratHoursRCD, setContratHoursRCD] = useState(0);
  const [contratCompletedDF, setContratCompletedDF] = useState(0);
  const [contratCompletedRCD, setContratCompletedRCD] = useState(0);
  const [showPreviousHours, setShowPreviousHours] = useState(false); // Toggle reprise en cours d'année

  // Teachers & PACTE state
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [pacteStats, setPacteStats] = useState<PacteStats | null>(null);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [pacteFilter, setPacteFilter] = useState<'all' | 'pacte' | 'non-pacte'>('all');
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [showPacteModal, setShowPacteModal] = useState(false);

  // Modal states
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [viewedAttachments, setViewedAttachments] = useState<Set<number>>(new Set()); // Suivre les PJ consultees
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Action modals
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingComment, setPendingComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Selection en lot (sessions)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchActionLoading, setBatchActionLoading] = useState(false);

  // Selection en lot (teachers PACTE)
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<number>>(new Set());
  const [batchPacteLoading, setBatchPacteLoading] = useState(false);

  // Modale de confirmation personnalisée
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    confirmColor: 'green' | 'red' | 'blue';
    onConfirm: () => void;
  } | null>(null);

  // Vider la selection quand les filtres changent
  useEffect(() => {
    setSelectedIds(new Set());
  }, [typeFilter, searchTerm, activeTab]);

  // Gestion touche Entree pour valider les modales
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;

      // Modale demande d'informations
      if (showPendingModal && !actionLoading && pendingComment.trim()) {
        e.preventDefault();
        confirmPending();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPendingModal, actionLoading, pendingComment]);

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

  // Fetch teachers when tab is active
  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'teachers' || activeTab === 'contrats') {
      fetchTeachers();
      fetchPacteStats();
    }
  }, [activeTab]);

  const fetchTeachers = async () => {
    setTeachersLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/pacte/teachers`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTeachers(data);
      }
    } catch (error) {
      console.error('Erreur chargement enseignants:', error);
    } finally {
      setTeachersLoading(false);
    }
  };

  const fetchPacteStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pacte/statistics`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setPacteStats(data);
      }
    } catch (error) {
      console.error('Erreur chargement stats PACTE:', error);
    }
  };

  // Update teacher PACTE status (avec confirmation via modale)
  const updateTeacherPacte = async (teacherId: number, inPacte: boolean, pacteHoursTarget: number, skipConfirm = false) => {
    // Trouver le nom de l'enseignant pour le message
    const teacher = teachers.find(t => t.id === teacherId);
    const teacherName = teacher?.name || 'cet enseignant';

    // Demander confirmation via modale sauf si skipConfirm est true
    if (!skipConfirm) {
      const action = inPacte ? 'activer le PACTE pour' : 'désactiver le PACTE pour';
      setConfirmData({
        title: inPacte ? 'Activer le PACTE' : 'Désactiver le PACTE',
        message: `Êtes-vous sûr de vouloir ${action} ${teacherName} ?`,
        confirmLabel: inPacte ? 'Activer' : 'Désactiver',
        confirmColor: inPacte ? 'green' : 'red',
        onConfirm: () => executeUpdatePacte(teacherId, inPacte, pacteHoursTarget),
      });
      setShowConfirmModal(true);
      return;
    }

    await executeUpdatePacte(teacherId, inPacte, pacteHoursTarget);
  };

  // Exécuter la mise à jour PACTE (après confirmation)
  const executeUpdatePacte = async (teacherId: number, inPacte: boolean, pacteHoursTarget: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pacte/teachers/${teacherId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ inPacte, pacteHoursTarget }),
      });
      if (response.ok) {
        setTeachers(prev => prev.map(t =>
          t.id === teacherId ? { ...t, inPacte, pacteHoursTarget } : t
        ));
        setShowPacteModal(false);
        setEditingTeacher(null);
        setShowConfirmModal(false);
        setConfirmData(null);
        fetchPacteStats();
      }
    } catch (error) {
      console.error('Erreur mise a jour PACTE:', error);
    }
  };

  // Batch update PACTE for multiple teachers
  const batchUpdatePacte = async (inPacte: boolean) => {
    if (selectedTeacherIds.size === 0) return;

    const action = inPacte ? 'activer le PACTE pour' : 'désactiver le PACTE pour';
    const count = selectedTeacherIds.size;

    setConfirmData({
      title: inPacte ? 'Activer le PACTE en lot' : 'Désactiver le PACTE en lot',
      message: `Voulez-vous ${action} ${count} enseignant${count > 1 ? 's' : ''} ?`,
      confirmLabel: inPacte ? 'Activer tous' : 'Désactiver tous',
      confirmColor: inPacte ? 'green' : 'red',
      onConfirm: async () => {
        setBatchPacteLoading(true);
        try {
          const promises = Array.from(selectedTeacherIds).map(teacherId =>
            fetch(`${API_BASE_URL}/api/pacte/teachers/${teacherId}/status`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ inPacte, pacteHoursTarget: inPacte ? 18 : 0 }),
            })
          );
          await Promise.all(promises);

          setTeachers(prev => prev.map(t =>
            selectedTeacherIds.has(t.id)
              ? { ...t, inPacte, pacteHoursTarget: inPacte ? 18 : 0 }
              : t
          ));
          setSelectedTeacherIds(new Set());
          fetchPacteStats();
        } catch (error) {
          console.error('Erreur mise a jour PACTE en lot:', error);
        } finally {
          setBatchPacteLoading(false);
          setShowConfirmModal(false);
          setConfirmData(null);
        }
      },
    });
    setShowConfirmModal(true);
  };

  // Toggle teacher selection
  const toggleTeacherSelection = (teacherId: number) => {
    setSelectedTeacherIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teacherId)) {
        newSet.delete(teacherId);
      } else {
        newSet.add(teacherId);
      }
      return newSet;
    });
  };

  // Select all visible teachers
  const selectAllTeachers = () => {
    if (selectedTeacherIds.size === filteredTeachers.length) {
      setSelectedTeacherIds(new Set());
    } else {
      setSelectedTeacherIds(new Set(filteredTeachers.map(t => t.id)));
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

  // Load attachments for a session
  const loadAttachments = async (sessionId: number) => {
    setAttachmentsLoading(true);
    setViewedAttachments(new Set()); // Reset des PJ consultees
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
    await loadAttachments(session.id);
  };

  // Sessions en cours de transition (pour animation)
  const [transitioningSessions, setTransitioningSessions] = useState<Set<number>>(new Set());

  // Transmettre au principal (PENDING_REVIEW -> PENDING_VALIDATION)
  const handleTransmit = async (session: Session) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${session.id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'transmit' }),
      });
      if (response.ok) {
        // 1. Mettre a jour le statut immediatement (badge change)
        setSessions(prev => prev.map(s =>
          s.id === session.id ? { ...s, status: 'PENDING_VALIDATION' } : s
        ));
        // 2. Marquer la session comme "en transition" pour l'animation
        setTransitioningSessions(prev => new Set(prev).add(session.id));
        setShowDetailModal(false);

        // 3. Apres 2 secondes, retirer de la liste des transitions (sera filtree)
        setTimeout(() => {
          setTransitioningSessions(prev => {
            const next = new Set(prev);
            next.delete(session.id);
            return next;
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Erreur transmission:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Demander des infos (ouvre le modal)
  const handleRequestInfo = (session: Session) => {
    setSelectedSession(session);
    setPendingComment('');
    setShowPendingModal(true);
  };

  // Confirmer demande d'infos
  const confirmPending = async () => {
    if (!selectedSession || !pendingComment.trim()) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${selectedSession.id}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'request-info',
          comment: pendingComment.trim()
        }),
      });
      if (response.ok) {
        setSessions(prev => prev.map(s =>
          s.id === selectedSession.id ? { ...s, status: 'PENDING_DOCUMENTS', comment: pendingComment } : s
        ));
        setShowPendingModal(false);
        setShowDetailModal(false);
      }
    } catch (error) {
      console.error('Erreur demande info:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Marquer comme "Mis en paiement" (VALIDATED -> PAID)
  const handleMarkPaid = async (session: Session) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${session.id}/mark-paid`, {
        method: 'PUT',
        credentials: 'include',
      });
      if (response.ok) {
        setSessions(prev => prev.map(s =>
          s.id === session.id ? { ...s, status: 'PAID' } : s
        ));
      }
    } catch (error) {
      console.error('Erreur mise en paiement:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Verify attachment
  const handleVerifyAttachment = async (attachmentId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/attachments/${attachmentId}/verify`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (response.ok) {
        setAttachments(prev => prev.map(a =>
          a.id === attachmentId ? { ...a, isVerified: true } : a
        ));
      }
    } catch (error) {
      console.error('Erreur verification:', error);
    }
  };

  // Download attachment avec nom explicite
  const handleDownloadAttachment = async (attachmentId: number) => {
    try {
      // Marquer comme consulte
      setViewedAttachments(prev => new Set(prev).add(attachmentId));

      // Obtenir l'URL signee avec nom explicite
      const response = await fetch(`${API_BASE_URL}/api/attachments/${attachmentId}/download-url`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la recuperation de l\'URL');
      }

      const { url, filename } = await response.json();

      // Declencher le telechargement
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erreur telechargement:', error);
    }
  };

  // Logout
  const handleLogout = async () => {
    await fetch(`${API_BASE_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    navigate('/login');
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
  const toggleSelectAll = (selectableSessions: Session[]) => {
    if (selectedIds.size === selectableSessions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableSessions.map(s => s.id)));
    }
  };

  // Transmettre en lot
  const handleBatchTransmit = async () => {
    if (selectedIds.size === 0) return;
    setBatchActionLoading(true);

    try {
      const promises = Array.from(selectedIds).map(id =>
        fetch(`${API_BASE_URL}/api/sessions/${id}/review`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ action: 'verify' }),
        })
      );

      await Promise.all(promises);

      // Animation de transition pour toutes les sessions transmises
      setTransitioningSessions(new Set(selectedIds));

      // Mise a jour du statut
      setSessions(prev => prev.map(s =>
        selectedIds.has(s.id) ? { ...s, status: 'PENDING_VALIDATION' } : s
      ));

      // Apres 2 secondes, retirer les sessions de la transition
      setTimeout(() => {
        setTransitioningSessions(new Set());
      }, 2000);

      setSelectedIds(new Set());
    } catch (error) {
      console.error('Erreur transmission en lot:', error);
    } finally {
      setBatchActionLoading(false);
    }
  };

  // Mettre en paiement en lot
  const handleBatchMarkPaid = async () => {
    if (selectedIds.size === 0) return;
    setBatchActionLoading(true);

    try {
      const promises = Array.from(selectedIds).map(id =>
        fetch(`${API_BASE_URL}/api/sessions/${id}/mark-paid`, {
          method: 'PUT',
          credentials: 'include',
        })
      );

      await Promise.all(promises);

      // Animation de transition
      setTransitioningSessions(new Set(selectedIds));

      // Mise a jour du statut
      setSessions(prev => prev.map(s =>
        selectedIds.has(s.id) ? { ...s, status: 'PAID' } : s
      ));

      // Apres 2 secondes, retirer les sessions de la transition
      setTimeout(() => {
        setTransitioningSessions(new Set());
      }, 2000);

      setSelectedIds(new Set());
    } catch (error) {
      console.error('Erreur mise en paiement en lot:', error);
    } finally {
      setBatchActionLoading(false);
    }
  };

  // Filter sessions
  const filteredSessions = useMemo(() => {
    let filtered = sessions;

    // Filter by sessionFilter (sous-filtre dans l'onglet Sessions)
    if (sessionFilter === 'pending') {
      filtered = filtered.filter(s =>
        s.status === 'PENDING_REVIEW' ||
        s.status === 'PENDING_DOCUMENTS' ||
        s.status === 'PENDING_VALIDATION' ||
        transitioningSessions.has(s.id) // Garder visible pendant la transition
      );
    } else if (sessionFilter === 'to-pay') {
      filtered = filtered.filter(s => s.status === 'VALIDATED');
    } else if (sessionFilter === 'history') {
      filtered = filtered.filter(s => s.status === 'PAID' || s.status === 'REJECTED');
    }

    // Search
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.teacherName?.toLowerCase().includes(search) ||
        s.type.toLowerCase().includes(search) ||
        s.className?.toLowerCase().includes(search)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(s => s.type === typeFilter);
    }

    return filtered;
  }, [sessions, sessionFilter, searchTerm, typeFilter, transitioningSessions]);

  // Sessions selectionnables pour operations en lot
  const selectableSessions = useMemo(() => {
    if (sessionFilter === 'pending') {
      return filteredSessions.filter(s => s.status === 'PENDING_REVIEW');
    } else if (sessionFilter === 'to-pay') {
      return filteredSessions.filter(s => s.status === 'VALIDATED');
    }
    return [];
  }, [filteredSessions, sessionFilter]);

  // Stats
  const stats = {
    pending: sessions.filter(s => s.status === 'PENDING_REVIEW' || s.status === 'PENDING_DOCUMENTS').length,
    toPay: sessions.filter(s => s.status === 'VALIDATED').length,
    paid: sessions.filter(s => s.status === 'PAID').length,
  };

  // Sessions recentes (5 dernieres)
  const recentSessions = useMemo(() => {
    return [...sessions]
      .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())
      .slice(0, 5);
  }, [sessions]);

  // Alertes
  const alerts = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const pendingTooLong = sessions.filter(s => {
      if (s.status !== 'PENDING_REVIEW' && s.status !== 'PENDING_DOCUMENTS') return false;
      const created = new Date(s.createdAt || s.date);
      return created < sevenDaysAgo;
    });

    const validatedNotPaid = sessions.filter(s => {
      if (s.status !== 'VALIDATED') return false;
      const created = new Date(s.createdAt || s.date);
      return created < fourteenDaysAgo;
    });

    return { pendingTooLong, validatedNotPaid };
  }, [sessions]);

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
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">A examiner</span>;
      case 'PENDING_DOCUMENTS':
        return <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">En attente PJ</span>;
      case 'PENDING_VALIDATION':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">A valider</span>;
      case 'VALIDATED':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-50 text-green-700 border border-green-100">Validee</span>;
      case 'REJECTED':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Rejete</span>;
      case 'PAID':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-300 text-green-900 border border-green-400">Mis en paiement</span>;
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

  // Get replaced teacher display name
  const getReplacedTeacherName = (session: Session) => {
    if (session.replacedTeacherName) return session.replacedTeacherName;
    if (session.replacedTeacherLastName) {
      const prefix = session.replacedTeacherPrefix || '';
      const firstName = session.replacedTeacherFirstName || '';
      return `${prefix} ${session.replacedTeacherLastName} ${firstName}`.trim();
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">SupChaissac</h1>
              <p className="text-xs text-amber-600 font-medium">Secretariat</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">Secrétaire</p>
            </div>
            <button
              onClick={() => setShowTour(true)}
              className="p-2 text-gray-400 hover:text-amber-500 transition-colors"
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
              className="p-2 text-gray-400 hover:text-amber-500 transition-colors"
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
            { id: 'sessions', label: 'Sessions', icon: ClipboardCheck, count: stats.pending + stats.toPay },
            { id: 'teachers', label: 'Enseignants', icon: Users, count: null },
            { id: 'contrats', label: 'Contrats PACTE', icon: FileText, count: null },
          ].map(tab => (
            <button
              key={tab.id}
              data-tour={tab.id === 'sessions' ? 'sessions-tab' : tab.id === 'teachers' ? 'teachers-tab' : tab.id === 'contrats' ? 'contrats-tab' : undefined}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== null && tab.count > 0 && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          /* Dashboard */
          <div className="space-y-6">
            {/* Cartes stats principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => { setActiveTab('sessions'); setSessionFilter('pending'); }}
                className="bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl p-6 text-white text-left hover:scale-[1.02] transition-transform cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm">A examiner</p>
                    <p className="text-4xl font-bold">{stats.pending}</p>
                  </div>
                  <ClipboardCheck className="w-12 h-12 text-yellow-200" />
                </div>
              </button>
              <button
                onClick={() => { setActiveTab('sessions'); setSessionFilter('to-pay'); }}
                className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl p-6 text-white text-left hover:scale-[1.02] transition-transform cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">A mettre en paiement</p>
                    <p className="text-4xl font-bold">{stats.toPay}</p>
                  </div>
                  <CreditCard className="w-12 h-12 text-green-200" />
                </div>
              </button>
              <button
                onClick={() => { setActiveTab('sessions'); setSessionFilter('history'); }}
                className="bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl p-6 text-white text-left hover:scale-[1.02] transition-transform cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-200 text-sm">Mis en paiement</p>
                    <p className="text-4xl font-bold">{stats.paid}</p>
                  </div>
                  <CheckCircle className="w-12 h-12 text-gray-300" />
                </div>
              </button>
            </div>

            {/* Apercu PACTE */}
            {pacteStats && (
              <button
                onClick={() => setActiveTab('contrats')}
                className="w-full bg-white rounded-xl border border-gray-200 p-4 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer text-left"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-600" />
                    Apercu PACTE
                  </h3>
                  <span className="text-xs text-gray-500">Cliquer pour gerer</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{pacteStats.teachersWithPacte}</p>
                    <p className="text-xs text-gray-500">Enseignants PACTE</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-600">{pacteStats.totalTeachers - pacteStats.teachersWithPacte}</p>
                    <p className="text-xs text-gray-500">Sans PACTE</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{pacteStats.sessionsWithPacte}</p>
                    <p className="text-xs text-gray-500">Sessions PACTE</p>
                  </div>
                </div>
              </button>
            )}

            {/* Alertes */}
            {(alerts.pendingTooLong.length > 0 || alerts.validatedNotPaid.length > 0) && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h3 className="font-semibold text-red-800 flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5" />
                  Alertes
                </h3>
                <div className="space-y-2">
                  {alerts.pendingTooLong.length > 0 && (
                    <button
                      onClick={() => { setActiveTab('sessions'); setSessionFilter('pending'); }}
                      className="w-full flex items-center justify-between p-2 bg-white rounded-lg hover:bg-red-100 transition-colors text-left"
                    >
                      <span className="text-sm text-red-700">
                        {alerts.pendingTooLong.length} session(s) en attente depuis + de 7 jours
                      </span>
                      <span className="text-xs text-red-500">Voir</span>
                    </button>
                  )}
                  {alerts.validatedNotPaid.length > 0 && (
                    <button
                      onClick={() => { setActiveTab('sessions'); setSessionFilter('to-pay'); }}
                      className="w-full flex items-center justify-between p-2 bg-white rounded-lg hover:bg-red-100 transition-colors text-left"
                    >
                      <span className="text-sm text-red-700">
                        {alerts.validatedNotPaid.length} session(s) validee(s) non mises en paiement depuis + de 14 jours
                      </span>
                      <span className="text-xs text-red-500">Voir</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Sessions recentes */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Clock3 className="w-5 h-5 text-gray-600" />
                  Sessions recentes
                </h3>
                <button
                  onClick={() => setActiveTab('sessions')}
                  className="text-xs text-amber-600 hover:text-amber-700"
                >
                  Voir toutes
                </button>
              </div>
              {recentSessions.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">Aucune session</p>
              ) : (
                <div className="space-y-2">
                  {recentSessions.map(session => (
                    <button
                      key={session.id}
                      onClick={() => {
                        setActiveTab('sessions');
                        if (session.status === 'PENDING_REVIEW' || session.status === 'PENDING_DOCUMENTS') {
                          setSessionFilter('pending');
                        } else if (session.status === 'VALIDATED') {
                          setSessionFilter('to-pay');
                        } else {
                          setSessionFilter('history');
                        }
                      }}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(session.type)}`}>
                          {getTypeLabel(session.type)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{session.teacherName}</p>
                          <p className="text-xs text-gray-500">{formatDate(session.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.status === 'PENDING_REVIEW' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">A examiner</span>
                        )}
                        {session.status === 'VALIDATED' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-50 text-green-700 border border-green-100">Validee</span>
                        )}
                        {session.status === 'PAID' && (
                          <span className="px-2 py-1 text-xs rounded-full bg-green-300 text-green-900 border border-green-400">Mis en paiement</span>
                        )}
                        <Eye className="w-4 h-4 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Onglet Enseignants */}
        {activeTab === 'teachers' && (
          <div className="space-y-6">
            {/* Stats cards */}
            {pacteStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total enseignants</p>
                      <p className="text-2xl font-bold text-gray-900">{pacteStats.totalTeachers}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Avec PACTE</p>
                      <p className="text-2xl font-bold text-green-600">{pacteStats.teachersWithPacte}</p>
                    </div>
                    <UserCheck className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Sans PACTE</p>
                      <p className="text-2xl font-bold text-amber-600">{pacteStats.teachersWithoutPacte}</p>
                    </div>
                    <UserX className="w-8 h-8 text-amber-500" />
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Sessions PACTE</p>
                      <p className="text-2xl font-bold text-purple-600">{pacteStats.sessionsWithPacte}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>
            )}

            {/* Search and filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un enseignant..."
                  value={teacherSearchTerm}
                  onChange={(e) => setTeacherSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2">
                {(['all', 'pacte', 'non-pacte'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setPacteFilter(filter)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      pacteFilter === filter
                        ? 'bg-amber-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter === 'all' ? 'Tous' : filter === 'pacte' ? 'PACTE' : 'Sans PACTE'}
                  </button>
                ))}
              </div>
            </div>

            {/* Batch action bar */}
            {selectedTeacherIds.size > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-amber-800 font-medium">
                    {selectedTeacherIds.size} enseignant{selectedTeacherIds.size > 1 ? 's' : ''} sélectionné{selectedTeacherIds.size > 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => setSelectedTeacherIds(new Set())}
                    className="text-amber-600 hover:text-amber-800 text-sm underline"
                  >
                    Tout désélectionner
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => batchUpdatePacte(true)}
                    disabled={batchPacteLoading}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <UserCheck className="w-4 h-4" />
                    Activer PACTE
                  </button>
                  <button
                    onClick={() => batchUpdatePacte(false)}
                    disabled={batchPacteLoading}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <UserX className="w-4 h-4" />
                    Désactiver PACTE
                  </button>
                </div>
              </div>
            )}

            {/* Select all checkbox */}
            {!teachersLoading && filteredTeachers.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAllTeachers}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {selectedTeacherIds.size === filteredTeachers.length ? (
                    <CheckSquare className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  {selectedTeacherIds.size === filteredTeachers.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              </div>
            )}

            {/* Teachers cards */}
            {teachersLoading ? (
              <div className="bg-white rounded-xl p-12 text-center">
                <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement...</p>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun enseignant trouve</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTeachers.map((teacher, index) => {
                  const validationRate = teacher.stats.currentYearSessions > 0
                    ? (teacher.stats.validatedSessions / teacher.stats.currentYearSessions) * 100
                    : 0;
                  const pacteProgress = teacher.pacteHoursTarget > 0
                    ? Math.min(100, Math.round((teacher.pacteHoursCompleted / teacher.pacteHoursTarget) * 100))
                    : 0;

                  return (
                    <div
                      key={teacher.id}
                      className={`rounded-xl border-2 p-4 hover:shadow-lg transition-all duration-200 ${
                        selectedTeacherIds.has(teacher.id)
                          ? 'ring-2 ring-amber-400 border-amber-300'
                          : teacher.inPacte
                            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:border-green-300'
                            : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200 hover:border-gray-300'
                      } ${
                        teacher.inPacte && !selectedTeacherIds.has(teacher.id)
                          ? 'bg-gradient-to-br from-green-50 to-emerald-50'
                          : !selectedTeacherIds.has(teacher.id)
                            ? 'bg-gradient-to-br from-gray-50 to-slate-50'
                            : 'bg-amber-50'
                      }`}
                    >
                      {/* Header: Checkbox + Avatar + Nom + Email */}
                      <div className="flex items-center gap-3 mb-3">
                        <button
                          onClick={() => toggleTeacherSelection(teacher.id)}
                          className="flex-shrink-0"
                        >
                          {selectedTeacherIds.has(teacher.id) ? (
                            <CheckSquare className="w-5 h-5 text-amber-500" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                          {teacher.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">{teacher.name}</div>
                          <div className="text-xs text-gray-500 truncate">{teacher.username}</div>
                        </div>
                      </div>

                      {/* Badge Enseignant */}
                      <div className="text-center mb-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                          Enseignant
                        </span>
                      </div>

                      {/* Bouton Toggle PACTE */}
                      <button
                        data-tour={index === 0 ? 'pacte-toggle' : undefined}
                        onClick={() => updateTeacherPacte(teacher.id, !teacher.inPacte, teacher.inPacte ? 0 : 18)}
                        className={`w-full py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                          teacher.inPacte
                            ? 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 hover:border-orange-300'
                            : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-green-50 hover:text-green-700 hover:border-green-200'
                        }`}
                      >
                        {teacher.inPacte ? '🎯 Pacte' : '📚 Hors Pacte'}
                      </button>

                      {/* Barre de progression PACTE (si en PACTE) */}
                      {teacher.inPacte && teacher.pacteHoursTarget > 0 && (
                        <div className="mt-3 p-2 bg-white/60 rounded-lg border border-amber-100">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-600">Progression PACTE</span>
                            <span className="text-xs font-medium text-amber-700">
                              {teacher.pacteHoursCompleted}/{teacher.pacteHoursTarget}h
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-amber-400 to-amber-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${pacteProgress}%` }}
                            />
                          </div>
                          <div className="text-right mt-1">
                            <span className="text-xs font-bold text-amber-600">{pacteProgress}%</span>
                          </div>
                        </div>
                      )}

                      {/* Stats: Sessions, Validation */}
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Sessions</span>
                          <span className="font-medium text-gray-900">{teacher.stats.currentYearSessions}</span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Validation</span>
                            <span className="font-medium text-gray-900">{validationRate.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                validationRate >= 80 ? 'bg-green-500' : validationRate >= 60 ? 'bg-orange-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${validationRate}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Grid RCD / DF / HSE */}
                      <div className="grid grid-cols-3 gap-1.5 mt-3">
                        <div className="bg-purple-50 rounded-lg p-1.5 text-center border border-purple-100">
                          <div className="text-sm font-bold text-purple-700">{teacher.stats.rcdSessions}</div>
                          <div className="text-xs text-purple-600">RCD</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-1.5 text-center border border-blue-100">
                          <div className="text-sm font-bold text-blue-700">{teacher.stats.devoirsFaitsSessions}</div>
                          <div className="text-xs text-blue-600">DF</div>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-1.5 text-center border border-emerald-100">
                          <div className="text-sm font-bold text-emerald-700">{teacher.stats.hseSessions}</div>
                          <div className="text-xs text-emerald-600">HSE</div>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Onglet Contrats PACTE */}
        {activeTab === 'contrats' && (
          <ContratsPacte
            teachers={teachers.map(t => ({
              ...t,
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
            onTeachersUpdate={(updated) => setTeachers(updated.map(t => ({
              ...t,
              pacteHoursTarget: t.pacteHoursTarget || 0,
              pacteHoursCompleted: t.pacteHoursCompleted || 0,
              pacteHoursDF: t.pacteHoursDF || 0,
              pacteHoursRCD: t.pacteHoursRCD || 0,
              pacteHoursCompletedDF: t.pacteHoursCompletedDF || 0,
              pacteHoursCompletedRCD: t.pacteHoursCompletedRCD || 0,
              stats: {
                ...t.stats,
                currentYearSessions: 0,
                validatedSessions: 0,
              }
            })))}
            onStatsRefresh={fetchPacteStats}
          />
        )}

        {activeTab === 'sessions' && (
          /* Sessions list avec sous-filtres */
          <>
            {/* Sous-filtres Sessions */}
            <div className="flex gap-2 mb-6">
              {[
                { id: 'pending', label: 'A examiner', count: stats.pending, icon: ClipboardCheck },
                { id: 'to-pay', label: 'A mettre en paiement', count: stats.toPay, icon: CreditCard },
                { id: 'history', label: 'Historique', count: stats.paid, icon: History },
              ].map(filter => (
                <button
                  key={filter.id}
                  data-tour={filter.id === 'pending' ? 'pending-filter' : filter.id === 'to-pay' ? 'to-pay-filter' : undefined}
                  onClick={() => setSessionFilter(filter.id as typeof sessionFilter)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    sessionFilter === filter.id
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <filter.icon className="w-4 h-4" />
                  <span>{filter.label}</span>
                  {filter.count > 0 && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      sessionFilter === filter.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-600'
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'all', label: 'Tous', color: 'gray' },
                  { id: 'RCD', label: 'RCD', color: 'purple' },
                  { id: 'DEVOIRS_FAITS', label: 'Devoirs Faits', color: 'blue' },
                  { id: 'AUTRE', label: 'Autre', color: 'amber' },
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => setTypeFilter(type.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      typeFilter === type.id
                        ? type.color === 'purple' ? 'bg-purple-500 text-white shadow-md' :
                          type.color === 'blue' ? 'bg-blue-500 text-white shadow-md' :
                          type.color === 'amber' ? 'bg-amber-500 text-white shadow-md' :
                          'bg-gray-700 text-white shadow-md'
                        : type.color === 'purple' ? 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100' :
                          type.color === 'blue' ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100' :
                          type.color === 'amber' ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100' :
                          'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Barre d'actions en lot */}
            {(sessionFilter === 'pending' || sessionFilter === 'to-pay') && selectableSessions.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleSelectAll(selectableSessions)}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-amber-600"
                    >
                      {selectedIds.size === selectableSessions.length && selectableSessions.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-amber-600" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                      {selectedIds.size === selectableSessions.length && selectableSessions.length > 0
                        ? 'Tout deselectionner'
                        : 'Tout selectionner'}
                    </button>
                    {selectedIds.size > 0 && (
                      <span className="text-sm text-amber-600 font-medium">
                        {selectedIds.size} session{selectedIds.size > 1 ? 's' : ''} selectionnee{selectedIds.size > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {selectedIds.size > 0 && sessionFilter === 'pending' && (
                    <button
                      onClick={handleBatchTransmit}
                      disabled={batchActionLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {batchActionLoading ? 'Transmission...' : `Transmettre (${selectedIds.size})`}
                    </button>
                  )}

                  {selectedIds.size > 0 && sessionFilter === 'to-pay' && (
                    <button
                      onClick={handleBatchMarkPaid}
                      disabled={batchActionLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {batchActionLoading ? 'En cours...' : `Mettre en paiement (${selectedIds.size})`}
                    </button>
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
                    className={`bg-white rounded-xl border p-4 transition-all duration-500 ${
                      transitioningSessions.has(session.id)
                        ? 'border-green-400 bg-green-50 opacity-70 scale-[0.98]'
                        : selectedIds.has(session.id)
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-gray-200 hover:shadow-md'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Checkbox pour selection en lot (PENDING_REVIEW ou VALIDATED selon le filtre) */}
                          {((sessionFilter === 'pending' && session.status === 'PENDING_REVIEW') ||
                            (sessionFilter === 'to-pay' && session.status === 'VALIDATED')) && (
                            <button
                              onClick={() => toggleSelection(session.id)}
                              className="text-gray-400 hover:text-amber-600"
                            >
                              {selectedIds.has(session.id) ? (
                                <CheckSquare className="w-5 h-5 text-amber-600" />
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
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleViewSession(session)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Details
                        </button>

                        {session.status === 'PENDING_REVIEW' && (
                          <>
                            <button
                              onClick={() => handleTransmit(session)}
                              disabled={actionLoading}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Send className="w-4 h-4" />
                              Transmettre
                            </button>
                            <button
                              onClick={() => handleRequestInfo(session)}
                              className="flex items-center gap-2 px-3 py-2 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                            >
                              <Clock3 className="w-4 h-4" />
                              Demander infos
                            </button>
                          </>
                        )}

                        {session.status === 'VALIDATED' && (
                          <button
                            onClick={() => handleMarkPaid(session)}
                            disabled={actionLoading}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Mettre en paiement
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Details de la session</h2>
                <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Header info */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{selectedSession.teacherName}</h3>
                  <p className="text-gray-600">{formatDate(selectedSession.date)} - {selectedSession.timeSlot}</p>
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(selectedSession.status)}
                  <span className={`px-2 py-1 text-xs rounded-full border ${getTypeColor(selectedSession.type)}`}>
                    {getTypeLabel(selectedSession.type)}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Informations</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-500">Type:</span> {selectedSession.type}</p>
                    <p><span className="text-gray-500">Date:</span> {formatDate(selectedSession.date)}</p>
                    <p><span className="text-gray-500">Creneau:</span> {selectedSession.timeSlot}</p>
                  </div>
                </div>

                {selectedSession.type === 'RCD' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Remplacement</h4>
                    <div className="space-y-1 text-sm">
                      {selectedSession.className && <p><span className="text-gray-500">Classe:</span> {selectedSession.className}</p>}
                      {getReplacedTeacherName(selectedSession) && <p><span className="text-gray-500">Remplace:</span> {getReplacedTeacherName(selectedSession)}</p>}
                      {selectedSession.replacedTeacherSubject && <p><span className="text-gray-500">Matiere:</span> {selectedSession.replacedTeacherSubject}</p>}
                    </div>
                  </div>
                )}

                {selectedSession.type === 'DEVOIRS_FAITS' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Devoirs Faits
                      {selectedSession.studentCount && (
                        <span className="text-sm font-normal text-gray-500">
                          ({selectedSession.studentCount} eleve{selectedSession.studentCount > 1 ? 's' : ''})
                        </span>
                      )}
                    </h4>
                    {selectedSession.gradeLevel && (
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="text-gray-500">Niveau:</span> {selectedSession.gradeLevel}
                      </p>
                    )}
                    {/* Liste des eleves */}
                    {selectedSession.studentsList && selectedSession.studentsList.length > 0 ? (
                      <div className="mt-2 max-h-40 overflow-y-auto">
                        <div className="grid gap-1">
                          {selectedSession.studentsList.map((student, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between px-2 py-1 bg-white rounded border border-gray-100 text-sm"
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
                    ) : selectedSession.studentCount ? (
                      <p className="text-sm text-gray-500 italic">
                        {attachments.length > 0
                          ? 'Voir les pieces jointes ci-dessous'
                          : 'Aucune liste detaillee fournie'}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedSession.description && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-600">{selectedSession.description}</p>
                </div>
              )}

              {/* Attachments */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Pieces jointes ({attachments.length})
                  {attachments.length > 0 && (
                    <span className="text-green-600 text-sm">
                      {attachments.filter(a => a.isVerified).length}/{attachments.length} verifiees
                    </span>
                  )}
                </h4>

                {attachmentsLoading ? (
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Chargement...</p>
                  </div>
                ) : attachments.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 p-6 rounded-lg text-center">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="text-amber-700 font-medium">Aucune piece jointe</p>
                    <p className="text-amber-600 text-sm">Vous pouvez demander des documents a l'enseignant</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attachments.map(attachment => {
                      const isImage = attachment.mimeType.startsWith('image/');
                      const isExcel = attachment.mimeType.includes('spreadsheet') || attachment.mimeType.includes('excel');
                      const isPdf = attachment.mimeType.includes('pdf');

                      // Icone selon type
                      const FileIcon = isImage ? Image : isExcel ? FileSpreadsheet : isPdf ? FileText : File;
                      const iconColor = isImage ? 'text-purple-600' : isExcel ? 'text-green-600' : isPdf ? 'text-red-600' : 'text-blue-600';

                      return (
                        <div key={attachment.id} className="bg-gray-50 rounded-lg overflow-hidden">
                          {/* Apercu image si c'est une image */}
                          {isImage && (
                            <div
                              className="relative bg-gray-100 cursor-pointer group"
                              onClick={() => {
                                setViewedAttachments(prev => new Set(prev).add(attachment.id));
                              }}
                            >
                              <img
                                src={attachment.url}
                                alt={attachment.originalName}
                                className="w-full max-h-48 object-contain"
                                onLoad={() => setViewedAttachments(prev => new Set(prev).add(attachment.id))}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                <span className="opacity-0 group-hover:opacity-100 bg-white/90 px-3 py-1 rounded-full text-sm font-medium text-gray-700 transition-opacity">
                                  Cliquer pour agrandir
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Info fichier */}
                          <div className="p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileIcon className={`w-5 h-5 ${iconColor}`} />
                              <div>
                                <p className="font-medium text-sm">{attachment.originalName}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                              </div>
                            </div>

                            {/* Statut */}
                            <div className="flex items-center gap-2">
                              {attachment.isVerified ? (
                                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Verifie
                                </span>
                              ) : viewedAttachments.has(attachment.id) ? (
                                <button
                                  onClick={() => handleVerifyAttachment(attachment.id)}
                                  className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                                  title="Cliquez pour confirmer la verification"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  Valider
                                </button>
                              ) : (
                                <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  A consulter
                                </span>
                              )}

                              {/* Bouton telecharger */}
                              <button
                                onClick={() => handleDownloadAttachment(attachment.id)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Telecharger avec nom explicite"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Actions footer */}
            {selectedSession.status === 'PENDING_REVIEW' && (
              <div className="p-6 border-t border-gray-100 flex gap-3 flex-wrap">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 min-w-[100px] px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => handleRequestInfo(selectedSession)}
                  className="flex-1 min-w-[100px] px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Clock3 className="w-4 h-4" />
                  Demander infos
                </button>
                <button
                  onClick={() => handleTransmit(selectedSession)}
                  disabled={actionLoading}
                  className="flex-1 min-w-[100px] px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Transmettre
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Request Info Modal */}
      {showPendingModal && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Demande d'informations</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm"><span className="font-medium">Enseignant:</span> {selectedSession.teacherName}</p>
                <p className="text-sm"><span className="font-medium">Date:</span> {formatDate(selectedSession.date)}</p>
                <p className="text-sm"><span className="font-medium">Type:</span> {selectedSession.type}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message a l'enseignant <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={pendingComment}
                  onChange={(e) => setPendingComment(e.target.value)}
                  placeholder="Precisez les pieces jointes ou informations necessaires..."
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  L'enseignant recevra une notification avec ce message.
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Actions automatiques:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Statut change en "En attente PJ"</li>
                      <li>Notification a l'enseignant</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowPendingModal(false)}
                className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmPending}
                disabled={!pendingComment.trim() || actionLoading}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal edition PACTE */}
      {showPacteModal && editingTeacher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Modifier le statut PACTE</h2>
                <button
                  onClick={() => {
                    setShowPacteModal(false);
                    setEditingTeacher(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Teacher info */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-xl font-medium text-blue-600">
                  {editingTeacher.initials}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{editingTeacher.name}</h3>
                  <p className="text-sm text-gray-500">{editingTeacher.username}</p>
                </div>
              </div>

              {/* Current status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Statut actuel</p>
                <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                  editingTeacher.inPacte
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {editingTeacher.inPacte ? 'PACTE' : 'Sans PACTE'}
                </span>
              </div>

              {/* Toggle PACTE */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  {editingTeacher.inPacte ? (
                    <UserCheck className="w-6 h-6 text-green-600" />
                  ) : (
                    <UserX className="w-6 h-6 text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {editingTeacher.inPacte ? 'PACTE active' : 'Sans PACTE'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {editingTeacher.inPacte ? 'Cet enseignant est dans le dispositif PACTE' : 'Cet enseignant n\'est pas dans le PACTE'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => updateTeacherPacte(editingTeacher.id, !editingTeacher.inPacte, editingTeacher.inPacte ? 0 : 18)}
                  className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                    editingTeacher.inPacte ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                      editingTeacher.inPacte ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Stats */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800 font-medium mb-2">Statistiques de l'enseignant :</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-purple-600">{editingTeacher.stats.rcdSessions}</p>
                    <p className="text-xs text-gray-600">RCD</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-600">{editingTeacher.stats.devoirsFaitsSessions}</p>
                    <p className="text-xs text-gray-600">Devoirs Faits</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-600">{editingTeacher.stats.validatedSessions}</p>
                    <p className="text-xs text-gray-600">Validees</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowPacteModal(false);
                  setEditingTeacher(null);
                }}
                className="w-full px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de confirmation personnalisée */}
      {showConfirmModal && confirmData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  confirmData.confirmColor === 'green' ? 'bg-green-100' :
                  confirmData.confirmColor === 'red' ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  <AlertCircle className={`w-6 h-6 ${
                    confirmData.confirmColor === 'green' ? 'text-green-600' :
                    confirmData.confirmColor === 'red' ? 'text-red-600' : 'text-blue-600'
                  }`} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{confirmData.title}</h2>
              </div>
              <p className="text-gray-600 mb-6">{confirmData.message}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmData(null);
                  }}
                  className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    confirmData.onConfirm();
                  }}
                  className={`flex-1 px-4 py-3 text-white rounded-xl transition-colors font-medium ${
                    confirmData.confirmColor === 'green' ? 'bg-green-500 hover:bg-green-600' :
                    confirmData.confirmColor === 'red' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                  }`}
                >
                  {confirmData.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tour guidé pour le secrétariat */}
      {showTour && (
        <GuidedTour
          tourId="secretary"
          steps={secretaryTourSteps}
          onComplete={() => setShowTour(false)}
        />
      )}
    </div>
  );
}
