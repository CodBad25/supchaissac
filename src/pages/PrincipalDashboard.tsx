import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Search, Calendar, Clock, User, FileText,
  Download, CheckCircle, Eye, AlertCircle, XCircle,
  Paperclip, Home, ClipboardCheck, X, CheckSquare, Square, HelpCircle
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import GuidedTour, { shouldShowTour } from '../components/GuidedTour';
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
interface Session {
  id: number;
  date: string;
  timeSlot: string;
  type: 'RCD' | 'DEVOIRS_FAITS' | 'AUTRE' | 'HSE';
  status: string;
  className?: string;
  studentCount?: number;
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pending' | 'validated' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

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

  // Vider la selection quand les filtres changent
  useEffect(() => {
    setSelectedIds(new Set());
  }, [typeFilter, searchTerm, activeTab]);

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

  // Annuler decision (VALIDATED/REJECTED -> PENDING_VALIDATION, PAID -> VALIDATED)
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

  // Filter sessions
  const filteredSessions = useMemo(() => {
    let filtered = sessions;

    if (activeTab === 'pending') {
      filtered = filtered.filter(s => s.status === 'PENDING_VALIDATION' || s.status === 'PENDING_REVIEW');
    } else if (activeTab === 'validated') {
      filtered = filtered.filter(s => s.status === 'VALIDATED' || s.status === 'PAID');
    } else if (activeTab === 'rejected') {
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
  }, [sessions, activeTab, searchTerm, typeFilter]);

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
              title="Aide / Tutoriel"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation tabs */}
      <nav className="bg-white border-b border-gray-200 px-4">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Tableau de bord', icon: Home, count: null },
            { id: 'pending', label: 'A valider', icon: ClipboardCheck, count: stats.pending },
            { id: 'validated', label: 'Validees', icon: CheckCircle, count: stats.validated },
            { id: 'rejected', label: 'Rejetees', icon: XCircle, count: stats.rejected },
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">A valider</p>
                  <p className="text-4xl font-bold">{stats.pending}</p>
                </div>
                <ClipboardCheck className="w-12 h-12 text-amber-200" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Validees</p>
                  <p className="text-4xl font-bold">{stats.validated}</p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-200" />
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-400 to-red-500 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Rejetees</p>
                  <p className="text-4xl font-bold">{stats.rejected}</p>
                </div>
                <XCircle className="w-12 h-12 text-red-200" />
              </div>
            </div>
          </div>
        ) : (
          <>
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
                <option value="AUTRE">Autre</option>
              </select>
            </div>

            {/* Barre d'actions en lot */}
            {activeTab === 'pending' && selectableSessions.length > 0 && (
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
          </>
        )}
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
                              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Verifie
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
                <button
                  onClick={handleCancelDecision}
                  disabled={actionLoading}
                  className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Annulation...' : selectedSession.status === 'PAID' ? 'Retirer de la mise en paiement' : 'Annuler la decision'}
                </button>
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
