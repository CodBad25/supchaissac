import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Search, Users, UserCheck, UserX, User as UserIcon,
  Upload, Key, Home, Edit2, Trash2, Plus,
  X, AlertCircle, Mail, Link2, CheckCircle,
  Copy, ExternalLink, Settings, RefreshCcw,
  GraduationCap, FileText, Eye, Check
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

// Types
interface User {
  id: number;
  username: string;
  name: string;
  firstName?: string;
  lastName?: string;
  civilite?: string;
  subject?: string;
  role: 'TEACHER' | 'SECRETARY' | 'PRINCIPAL' | 'ADMIN';
  initials?: string;
  inPacte: boolean;
  isActivated?: boolean;
  activationTokenExpiry?: string;
  createdAt?: string;
}

interface Stats {
  totalUsers: number;
  totalTeachers: number;
  teachersWithPacte: number;
  teachersWithoutPacte: number;
  pactePercentage: number;
  totalSessions: number;
  pendingSessions: number;
  validatedSessions: number;
  totalHours: number;
  hoursByType: {
    rcd: number;
    devoirsFaits: number;
    hse: number;
    autre: number;
  };
}

interface UserInfo {
  id: number;
  name: string;
  role: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  // User state
  const [user, setUser] = useState<UserInfo | null>(null);

  // Data state
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'import' | 'students' | 'maintenance'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'TEACHER' | 'SECRETARY' | 'PRINCIPAL' | 'ADMIN'>('all');
  const [pacteFilter, setPacteFilter] = useState<'all' | 'pacte' | 'non-pacte'>('all');

  // Modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<User | null>(null);
  const [showResetPassword, setShowResetPassword] = useState<User | null>(null);
  const [showActivationModal, setShowActivationModal] = useState<{ user: User; link?: string } | null>(null);
  const [activationFilter, setActivationFilter] = useState<'all' | 'activated' | 'pending'>('all');
  const [sendingActivation, setSendingActivation] = useState(false);

  // Selection state for bulk actions
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [showBulkActivationModal, setShowBulkActivationModal] = useState(false);
  const [bulkActivationResults, setBulkActivationResults] = useState<{ user: User; link: string }[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    firstName: '',
    lastName: '',
    civilite: '',
    subject: '',
    role: 'TEACHER' as User['role'],
    inPacte: false,
  });
  const [newPassword, setNewPassword] = useState('');

  // Import state
  const [csvData, setCsvData] = useState('');
  const [importResult, setImportResult] = useState<{ created: number; updated: number; errors?: string[] } | null>(null);

  // Teacher CSV import state
  const [teacherFile, setTeacherFile] = useState<File | null>(null);
  const [teacherPreview, setTeacherPreview] = useState<{
    headers: string[];
    totalRows: number;
    willBeCreated: number;
    willBeSkipped: number;
    preview: { civilite: string; nom: string; prenom: string; email: string; discipline: string; pacte: string }[];
  } | null>(null);
  const [teacherImportResult, setTeacherImportResult] = useState<{
    success: boolean;
    created: number;
    skipped: number;
    skippedNames: string[];
    errors: number;
  } | null>(null);
  const [teachersLoading, setTeachersLoading] = useState(false);

  // Student import state
  const [studentFile, setStudentFile] = useState<File | null>(null);
  const [studentPreview, setStudentPreview] = useState<{
    headers: string[];
    totalRows: number;
    classesFound: string[];
    projectsFound: string[];
    preview: { nom: string; prenom: string; classe: string; projet: string }[];
  } | null>(null);
  const [studentImportResult, setStudentImportResult] = useState<{
    success: boolean;
    imported: number;
    errors: number;
    classes: string[];
  } | null>(null);
  const [studentStats, setStudentStats] = useState<{
    totalStudents: number;
    totalClasses: number;
    classCounts: Record<string, number>;
    schoolYear: string;
  } | null>(null);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Fetch user info
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          if (data.role !== 'ADMIN') {
            navigate('/login');
            return;
          }
          setUser(data);
        } else {
          navigate('/login');
        }
      } catch {
        navigate('/login');
      }
    };
    fetchUser();
  }, [navigate]);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/stats`, { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Fetch users when tab changes
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
    if (activeTab === 'students') {
      fetchStudentStats();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch student stats
  const fetchStudentStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/students/stats`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setStudentStats(data);
      }
    } catch (error) {
      console.error('Error fetching student stats:', error);
    }
  };

  // Preview student CSV
  const handleStudentFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStudentFile(file);
    setStudentImportResult(null);
    setStudentsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/api/students/preview`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setStudentPreview(data);
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de l\'analyse du fichier');
      }
    } catch (error) {
      console.error('Error previewing file:', error);
      alert('Erreur de connexion');
    } finally {
      setStudentsLoading(false);
    }
  };

  // Import students
  const handleStudentImport = async (replaceExisting: boolean) => {
    if (!studentFile) return;

    setStudentsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', studentFile);
      formData.append('replaceExisting', String(replaceExisting));

      const response = await fetch(`${API_BASE_URL}/api/students/import`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setStudentImportResult(data);
        setStudentFile(null);
        setStudentPreview(null);
        fetchStudentStats();
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de l\'import');
      }
    } catch (error) {
      console.error('Error importing students:', error);
      alert('Erreur de connexion');
    } finally {
      setStudentsLoading(false);
    }
  };

  // Preview teacher CSV
  const handleTeacherFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTeacherFile(file);
    setTeacherImportResult(null);
    setTeachersLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/api/admin/preview-teachers-csv`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setTeacherPreview(data);
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de l\'analyse du fichier');
      }
    } catch (error) {
      console.error('Error previewing file:', error);
      alert('Erreur de connexion');
    } finally {
      setTeachersLoading(false);
    }
  };

  // Import teachers
  const handleTeacherImport = async () => {
    if (!teacherFile) return;

    setTeachersLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', teacherFile);

      const response = await fetch(`${API_BASE_URL}/api/admin/import-teachers-csv`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setTeacherImportResult(data);
        setTeacherFile(null);
        setTeacherPreview(null);
        fetchUsers(); // Rafraichir la liste
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors de l\'import');
      }
    } catch (error) {
      console.error('Error importing teachers:', error);
      alert('Erreur de connexion');
    } finally {
      setTeachersLoading(false);
    }
  };

  // Clear students
  const handleClearStudents = async () => {
    if (!confirm('Voulez-vous vraiment supprimer tous les eleves de cette annee scolaire ?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/students`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setStudentStats(null);
        setStudentImportResult(null);
        fetchStudentStats();
      }
    } catch (error) {
      console.error('Error clearing students:', error);
    }
  };

  // Filter users
  const filteredUsers = useMemo(() => {
    let filtered = users;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(search) ||
        u.username.toLowerCase().includes(search) ||
        u.subject?.toLowerCase().includes(search)
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    if (pacteFilter === 'pacte') {
      filtered = filtered.filter(u => u.role === 'TEACHER' && u.inPacte);
    } else if (pacteFilter === 'non-pacte') {
      filtered = filtered.filter(u => u.role === 'TEACHER' && !u.inPacte);
    }

    if (activationFilter === 'activated') {
      filtered = filtered.filter(u => u.isActivated);
    } else if (activationFilter === 'pending') {
      filtered = filtered.filter(u => !u.isActivated);
    }

    return filtered;
  }, [users, searchTerm, roleFilter, pacteFilter, activationFilter]);

  // Logout
  const handleLogout = async () => {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
    navigate('/login');
  };

  // Create/Update user
  const handleSaveUser = async () => {
    try {
      const url = editingUser
        ? `${API_BASE_URL}/api/admin/users/${editingUser.id}`
        : `${API_BASE_URL}/api/admin/users`;

      // Auto-générer le nom complet à partir du prénom et du nom
      const dataToSend = {
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
      };

      const response = await fetch(url, {
        method: editingUser ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        setShowUserModal(false);
        setEditingUser(null);
        fetchUsers();
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setShowDeleteConfirm(null);
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // Reset password
  const handleResetPassword = async (userId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ newPassword: newPassword || 'password123' }),
      });

      if (response.ok) {
        setShowResetPassword(null);
        setNewPassword('');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
    }
  };

  // Import CSV
  const handleImport = async () => {
    try {
      // Parse CSV
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      const importUsers = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const user: any = {};
        headers.forEach((h, i) => {
          user[h] = values[i];
        });
        return user;
      });

      const response = await fetch(`${API_BASE_URL}/api/admin/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ users: importUsers }),
      });

      if (response.ok) {
        const result = await response.json();
        setImportResult(result);
        setCsvData('');
      }
    } catch (error) {
      console.error('Error importing:', error);
    }
  };

  // Send activation link
  const handleSendActivation = async (userToActivate: User) => {
    setSendingActivation(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userToActivate.id}/send-activation`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setShowActivationModal({
          user: userToActivate,
          link: data.activationLink,
        });
        fetchUsers(); // Rafraîchir pour voir le token expiry
      }
    } catch (error) {
      console.error('Error sending activation:', error);
    } finally {
      setSendingActivation(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Get pending users (not activated) from filtered list
  const pendingUsers = useMemo(() => {
    return filteredUsers.filter(u => !u.isActivated);
  }, [filteredUsers]);

  // Toggle user selection
  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  // Select all pending users
  const selectAllPending = () => {
    if (selectedUsers.size === pendingUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(pendingUsers.map(u => u.id)));
    }
  };

  // Bulk send activation links
  const handleBulkSendActivation = async () => {
    setSendingActivation(true);
    const results: { user: User; link: string }[] = [];

    for (const userId of selectedUsers) {
      const userToActivate = users.find(u => u.id === userId);
      if (!userToActivate || userToActivate.isActivated) continue;

      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/send-activation`, {
          method: 'POST',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.activationLink) {
            results.push({ user: userToActivate, link: data.activationLink });
          }
        }
      } catch (error) {
        console.error(`Error sending activation for user ${userId}:`, error);
      }
    }

    setBulkActivationResults(results);
    setShowBulkActivationModal(true);
    setSelectedUsers(new Set());
    fetchUsers();
    setSendingActivation(false);
  };

  // Copy all links to clipboard
  const copyAllLinks = () => {
    const text = bulkActivationResults
      .map(r => `${r.user.name} (${r.user.username}): ${r.link}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
  };

  // Open edit modal
  const openEditModal = (userToEdit?: User) => {
    if (userToEdit) {
      setEditingUser(userToEdit);
      setFormData({
        username: userToEdit.username,
        name: userToEdit.name,
        firstName: userToEdit.firstName || '',
        lastName: userToEdit.lastName || '',
        civilite: userToEdit.civilite || '',
        subject: userToEdit.subject || '',
        role: userToEdit.role,
        inPacte: userToEdit.inPacte,
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        name: '',
        firstName: '',
        lastName: '',
        civilite: '',
        subject: '',
        role: 'TEACHER',
        inPacte: false,
      });
    }
    setShowUserModal(true);
  };

  // Role label
  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'TEACHER': return 'Enseignant';
      case 'SECRETARY': return 'Secrétaire';
      case 'PRINCIPAL': return 'Direction';
      case 'ADMIN': return 'Admin';
      default: return role;
    }
  };

  // Role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'TEACHER': return 'bg-blue-100 text-blue-700';
      case 'SECRETARY': return 'bg-amber-100 text-amber-700';
      case 'PRINCIPAL': return 'bg-purple-100 text-purple-700';
      case 'ADMIN': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">SupChaissac Admin</h1>
              <p className="text-red-200 text-sm">{user?.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                title="Mon profil"
              >
                <UserIcon className="w-4 h-4" />
                <span>Profil</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-4">
        <div className="max-w-7xl mx-auto flex gap-1">
          {[
            { id: 'dashboard', label: 'Tableau de bord', icon: Home },
            { id: 'users', label: 'Utilisateurs', icon: Users },
            { id: 'import', label: 'Import CSV', icon: Upload },
            { id: 'students', label: 'Eleves', icon: GraduationCap },
            { id: 'maintenance', label: 'Maintenance', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-6">
            {/* Stats cards - uniquement utilisateurs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Utilisateurs</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                    <p className="text-sm text-gray-500">{stats.totalTeachers} enseignants</p>
                  </div>
                  <Users className="w-10 h-10 text-gray-300" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Enseignants PACTE</p>
                    <p className="text-3xl font-bold text-green-600">{stats.teachersWithPacte}</p>
                    <p className="text-sm text-gray-500">{stats.pactePercentage}% du total</p>
                  </div>
                  <UserCheck className="w-10 h-10 text-green-300" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Sans PACTE</p>
                    <p className="text-3xl font-bold text-gray-600">{stats.teachersWithoutPacte}</p>
                    <p className="text-sm text-gray-500">{100 - stats.pactePercentage}% du total</p>
                  </div>
                  <UserX className="w-10 h-10 text-gray-300" />
                </div>
              </div>
            </div>

            {/* Accès rapides */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Accès rapides</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('users')}
                  className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                >
                  <Users className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900">Gestion utilisateurs</p>
                    <p className="text-sm text-gray-500">Créer, modifier, supprimer</p>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('import')}
                  className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                >
                  <Upload className="w-8 h-8 text-amber-500" />
                  <div>
                    <p className="font-medium text-gray-900">Import Pronote</p>
                    <p className="text-sm text-gray-500">Importer des enseignants</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Actions bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un utilisateur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  {(['all', 'TEACHER', 'SECRETARY', 'PRINCIPAL', 'ADMIN'] as const).map(role => (
                    <button
                      key={role}
                      onClick={() => setRoleFilter(role)}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        roleFilter === role
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {role === 'all' ? 'Tous' : getRoleLabel(role)}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => openEditModal()}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nouvel utilisateur
              </button>
            </div>

            {/* Users table */}
            {usersLoading ? (
              <div className="bg-white rounded-xl p-12 text-center">
                <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Chargement...</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="w-12 px-4 py-3">
                          {pendingUsers.length > 0 && (
                            <button
                              onClick={selectAllPending}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                selectedUsers.size > 0 && selectedUsers.size === pendingUsers.length
                                  ? 'bg-red-500 border-red-500 text-white'
                                  : selectedUsers.size > 0
                                  ? 'bg-red-200 border-red-500'
                                  : 'border-gray-300 hover:border-red-400'
                              }`}
                              title={selectedUsers.size === pendingUsers.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                            >
                              {selectedUsers.size > 0 && selectedUsers.size === pendingUsers.length && (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              {selectedUsers.size > 0 && selectedUsers.size < pendingUsers.length && (
                                <span className="w-2 h-0.5 bg-red-500 rounded" />
                              )}
                            </button>
                          )}
                        </th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Utilisateur</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Email/Login</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Rôle</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">PACTE</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Statut</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredUsers.map(u => (
                        <tr key={u.id} className={`hover:bg-gray-50 ${selectedUsers.has(u.id) ? 'bg-red-50' : ''}`}>
                          <td className="px-4 py-3">
                            {!u.isActivated ? (
                              <button
                                onClick={() => toggleUserSelection(u.id)}
                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                  selectedUsers.has(u.id)
                                    ? 'bg-red-500 border-red-500 text-white'
                                    : 'border-gray-300 hover:border-red-400'
                                }`}
                              >
                                {selectedUsers.has(u.id) && <CheckCircle className="w-3 h-3" />}
                              </button>
                            ) : (
                              <div className="w-5 h-5" />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white ${
                                u.role === 'ADMIN' ? 'bg-red-500' :
                                u.role === 'PRINCIPAL' ? 'bg-purple-500' :
                                u.role === 'SECRETARY' ? 'bg-amber-500' :
                                'bg-blue-500'
                              }`}>
                                {u.initials || u.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{u.name}</p>
                                {u.subject && <p className="text-sm text-gray-500">{u.subject}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{u.username}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-3 py-1 text-sm rounded-full font-medium ${getRoleColor(u.role)}`}>
                              {getRoleLabel(u.role)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {u.role === 'TEACHER' && (
                              <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                                u.inPacte ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {u.inPacte ? 'Oui' : 'Non'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {u.isActivated ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full font-medium bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3" />
                                Activé
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSendActivation(u)}
                                disabled={sendingActivation}
                                className="inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                              >
                                <Mail className="w-3 h-3" />
                                En attente
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditModal(u)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Modifier"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {!u.isActivated && (
                                <button
                                  onClick={() => handleSendActivation(u)}
                                  disabled={sendingActivation}
                                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                                  title="Envoyer lien d'activation"
                                >
                                  <Link2 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => setShowResetPassword(u)}
                                className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                                title="Réinitialiser mot de passe"
                              >
                                <Key className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setShowDeleteConfirm(u)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredUsers.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Aucun utilisateur trouvé</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'import' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Import enseignants par fichier */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Import des enseignants</h2>
              <p className="text-sm text-gray-500 mb-4">
                Importez un fichier CSV depuis Pronote. Les enseignants existants seront ignores.
              </p>

              {!teacherPreview ? (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {teachersLoading ? (
                      <>
                        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                        <p className="text-sm text-gray-500">Analyse du fichier...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-gray-400 mb-3" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Cliquez pour selectionner</span> ou glissez-deposez
                        </p>
                        <p className="text-xs text-gray-500">Fichier CSV uniquement</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleTeacherFileChange}
                    className="hidden"
                    disabled={teachersLoading}
                  />
                </label>
              ) : (
                <div className="space-y-4">
                  {/* Preview info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-800">{teacherFile?.name}</span>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-blue-700">
                        <strong>{teacherPreview.totalRows}</strong> enseignants dans le fichier
                      </span>
                      <span className="text-green-700">
                        <strong>{teacherPreview.willBeCreated}</strong> seront crees
                      </span>
                      {teacherPreview.willBeSkipped > 0 && (
                        <span className="text-amber-700">
                          <strong>{teacherPreview.willBeSkipped}</strong> ignores (existent deja)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Colonnes detectees */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Colonnes detectees:</p>
                    <div className="flex flex-wrap gap-2">
                      {teacherPreview.headers.map(h => (
                        <span key={h} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Apercu */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Apercu (5 premiers):</p>
                    <div className="bg-gray-50 rounded-lg p-3 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500">
                            <th className="pb-2 pr-4">Civilite</th>
                            <th className="pb-2 pr-4">Nom</th>
                            <th className="pb-2 pr-4">Prenom</th>
                            <th className="pb-2 pr-4">Email</th>
                            <th className="pb-2 pr-4">Discipline</th>
                          </tr>
                        </thead>
                        <tbody className="text-gray-700">
                          {teacherPreview.preview.map((t, i) => (
                            <tr key={i}>
                              <td className="py-1 pr-4">{t.civilite || '-'}</td>
                              <td className="py-1 pr-4 font-medium">{t.nom}</td>
                              <td className="py-1 pr-4">{t.prenom}</td>
                              <td className="py-1 pr-4 text-blue-600">{t.email}</td>
                              <td className="py-1 pr-4">{t.discipline || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setTeacherFile(null);
                        setTeacherPreview(null);
                      }}
                      className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleTeacherImport}
                      disabled={teachersLoading || teacherPreview.willBeCreated === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      {teachersLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Import en cours...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Importer {teacherPreview.willBeCreated} enseignant{teacherPreview.willBeCreated > 1 ? 's' : ''}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Resultat import */}
            {teacherImportResult && (
              <div className={`rounded-xl p-4 border ${
                teacherImportResult.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {teacherImportResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <p className={`font-medium ${
                    teacherImportResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    Import termine !
                  </p>
                </div>
                <div className="text-sm space-y-1">
                  <p className="text-green-700">
                    <strong>{teacherImportResult.created}</strong> enseignant{teacherImportResult.created > 1 ? 's' : ''} cree{teacherImportResult.created > 1 ? 's' : ''}
                  </p>
                  {teacherImportResult.skipped > 0 && (
                    <p className="text-amber-700">
                      <strong>{teacherImportResult.skipped}</strong> ignore{teacherImportResult.skipped > 1 ? 's' : ''} (existaient deja)
                      {teacherImportResult.skippedNames.length > 0 && (
                        <span className="text-gray-500 ml-1">
                          : {teacherImportResult.skippedNames.join(', ')}
                        </span>
                      )}
                    </p>
                  )}
                  {teacherImportResult.errors > 0 && (
                    <p className="text-red-600">
                      <strong>{teacherImportResult.errors}</strong> erreur{teacherImportResult.errors > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Info format */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="font-medium text-gray-800 mb-2">Format CSV attendu (Pronote)</h3>
              <p className="text-sm text-gray-600 mb-2">
                Colonnes reconnues : <code className="bg-gray-200 px-1 rounded">NOM</code>, <code className="bg-gray-200 px-1 rounded">PRENOM</code>, <code className="bg-gray-200 px-1 rounded">EMAIL</code>, <code className="bg-gray-200 px-1 rounded">CIVILITE</code>, <code className="bg-gray-200 px-1 rounded">DISCIPLINE</code> ou <code className="bg-gray-200 px-1 rounded">MATIERE_PREF</code>
              </p>
              <p className="text-xs text-gray-500">
                Les enseignants avec un email deja existant seront automatiquement ignores.
              </p>
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Stats actuelles */}
            {studentStats && studentStats.totalStudents > 0 && (
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Eleves importes</h2>
                  <span className="text-sm text-gray-500">{studentStats.schoolYear}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-blue-600">{studentStats.totalStudents}</p>
                    <p className="text-sm text-blue-700">Eleves</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-green-600">{studentStats.totalClasses}</p>
                    <p className="text-sm text-green-700">Classes</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(studentStats.classCounts)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([className, count]) => (
                      <span
                        key={className}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {className}: {count}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {/* Upload zone */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Import des eleves</h2>
              <p className="text-sm text-gray-500 mb-4">
                Importez un fichier CSV depuis Pronote avec les colonnes: Nom, Prenom, Classe, etc.
              </p>

              {!studentPreview ? (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {studentsLoading ? (
                      <>
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                        <p className="text-sm text-gray-500">Analyse du fichier...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-10 h-10 text-gray-400 mb-3" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Cliquez pour selectionner</span> ou glissez-deposez
                        </p>
                        <p className="text-xs text-gray-500">Fichier CSV uniquement</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleStudentFileChange}
                    className="hidden"
                    disabled={studentsLoading}
                  />
                </label>
              ) : (
                <div className="space-y-4">
                  {/* Preview info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-800">{studentFile?.name}</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      {studentPreview.totalRows} eleves trouves dans {studentPreview.classesFound.length} classes
                    </p>
                  </div>

                  {/* Classes detectees */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Classes detectees:</p>
                    <div className="flex flex-wrap gap-2">
                      {studentPreview.classesFound.map(c => (
                        <span key={c} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Projets detectes */}
                  {studentPreview.projectsFound.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Projets d'accompagnement:</p>
                      <div className="flex flex-wrap gap-2">
                        {studentPreview.projectsFound.map(p => (
                          <span key={p} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Apercu */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Apercu (5 premiers):</p>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500">
                            <th className="pb-2">Nom</th>
                            <th className="pb-2">Prenom</th>
                            <th className="pb-2">Classe</th>
                            <th className="pb-2">Projet</th>
                          </tr>
                        </thead>
                        <tbody className="text-gray-700">
                          {studentPreview.preview.map((s, i) => (
                            <tr key={i}>
                              <td className="py-1">{s.nom}</td>
                              <td className="py-1">{s.prenom}</td>
                              <td className="py-1 font-medium">{s.classe}</td>
                              <td className="py-1 text-purple-600">{s.projet || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setStudentFile(null);
                        setStudentPreview(null);
                      }}
                      className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Annuler
                    </button>
                    {studentStats && studentStats.totalStudents > 0 ? (
                      <>
                        <button
                          onClick={() => handleStudentImport(false)}
                          disabled={studentsLoading}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                          Ajouter aux existants
                        </button>
                        <button
                          onClick={() => handleStudentImport(true)}
                          disabled={studentsLoading}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          Remplacer tous
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleStudentImport(false)}
                        disabled={studentsLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                      >
                        {studentsLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Import en cours...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Importer {studentPreview.totalRows} eleves
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Resultat import */}
            {studentImportResult && (
              <div className={`rounded-xl p-4 border ${
                studentImportResult.success
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {studentImportResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <p className={`font-medium ${
                    studentImportResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {studentImportResult.success ? 'Import reussi !' : 'Erreurs lors de l\'import'}
                  </p>
                </div>
                <p className={`text-sm ${
                  studentImportResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {studentImportResult.imported} eleves importes
                  {studentImportResult.errors > 0 && `, ${studentImportResult.errors} erreurs`}
                </p>
                {studentImportResult.classes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {studentImportResult.classes.map(c => (
                      <span key={c} className="px-2 py-0.5 bg-green-200 text-green-800 rounded text-xs">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Danger zone */}
            {studentStats && studentStats.totalStudents > 0 && (
              <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-red-800">Supprimer tous les eleves</h3>
                    <p className="text-sm text-red-600 mt-1">
                      Supprime tous les eleves de l'annee {studentStats.schoolYear}
                    </p>
                  </div>
                  <button
                    onClick={handleClearStudents}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === 'maintenance' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Maintenance</h2>
              <p className="text-sm text-gray-500 mb-6">
                Actions de maintenance pour gérer les données de l'application.
              </p>

              <div className="space-y-4">
                {/* Supprimer toutes les sessions */}
                <div className="p-4 border border-amber-200 bg-amber-50 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-amber-800">Supprimer toutes les sessions</h3>
                      <p className="text-sm text-amber-600 mt-1">
                        Supprime toutes les déclarations d'heures. Les utilisateurs sont conservés.
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        if (window.confirm('Êtes-vous sûr de vouloir supprimer TOUTES les sessions ? Cette action est irréversible.')) {
                          try {
                            const res = await fetch(`${API_BASE_URL}/api/admin/sessions/all`, {
                              method: 'DELETE',
                              credentials: 'include',
                            });
                            if (res.ok) {
                              alert('Toutes les sessions ont été supprimées');
                              window.location.reload();
                            } else {
                              alert('Erreur lors de la suppression');
                            }
                          } catch (e) {
                            alert('Erreur de connexion');
                          }
                        }
                      }}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>

                {/* Supprimer tous les utilisateurs */}
                <div className="p-4 border border-orange-200 bg-orange-50 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-orange-800">Supprimer tous les utilisateurs</h3>
                      <p className="text-sm text-orange-600 mt-1">
                        Supprime tous les utilisateurs sauf le compte admin. Les sessions seront aussi supprimées.
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        if (window.confirm('Êtes-vous sûr de vouloir supprimer TOUS les utilisateurs (sauf admin) et leurs sessions ? Cette action est irréversible.')) {
                          try {
                            const res = await fetch(`${API_BASE_URL}/api/admin/users/all`, {
                              method: 'DELETE',
                              credentials: 'include',
                            });
                            if (res.ok) {
                              alert('Tous les utilisateurs ont été supprimés');
                              window.location.reload();
                            } else {
                              alert('Erreur lors de la suppression');
                            }
                          } catch (e) {
                            alert('Erreur de connexion');
                          }
                        }
                      }}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>

                {/* Réinitialisation complète */}
                <div className="p-4 border border-red-200 bg-red-50 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-red-800">Réinitialisation complète</h3>
                      <p className="text-sm text-red-600 mt-1">
                        Supprime toutes les sessions ET tous les utilisateurs (sauf admin). Recommencer à zéro.
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        if (window.confirm('⚠️ ATTENTION ⚠️\n\nCette action va supprimer TOUTES les données :\n- Toutes les sessions\n- Tous les utilisateurs (sauf admin)\n\nÊtes-vous VRAIMENT sûr ?')) {
                          try {
                            const res = await fetch(`${API_BASE_URL}/api/admin/reset`, {
                              method: 'DELETE',
                              credentials: 'include',
                            });
                            if (res.ok) {
                              alert('Base de données réinitialisée');
                              window.location.reload();
                            } else {
                              alert('Erreur lors de la réinitialisation');
                            }
                          } catch (e) {
                            alert('Erreur de connexion');
                          }
                        }
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

              </main>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                </h2>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email / Login</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Civilité</label>
                  <div className="flex gap-2">
                    {['M.', 'Mme'].map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormData({ ...formData, civilite: c })}
                        className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                          formData.civilite === c
                            ? 'bg-red-500 text-white border-red-500'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                  <div className="flex flex-wrap gap-1">
                    {(['TEACHER', 'SECRETARY', 'PRINCIPAL', 'ADMIN'] as const).map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setFormData({ ...formData, role })}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          formData.role === role
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {getRoleLabel(role)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {formData.role === 'TEACHER' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Matière</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, inPacte: !formData.inPacte })}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        formData.inPacte
                          ? 'bg-green-50 border-green-400 text-green-800'
                          : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Enseignant PACTE</span>
                        {formData.inPacte && <span className="text-green-600">✓</span>}
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowUserModal(false)}
                className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveUser}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Supprimer ?</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Voulez-vous vraiment supprimer <strong>{showDeleteConfirm.name}</strong> ?
                Cette action est irréversible.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDeleteUser(showDeleteConfirm.id)}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Key className="w-6 h-6 text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Mot de passe</h2>
              </div>
              <p className="text-gray-600 mb-4">
                Réinitialiser le mot de passe de <strong>{showResetPassword.name}</strong>
              </p>
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nouveau mot de passe (défaut: password123)"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowResetPassword(null);
                    setNewPassword('');
                  }}
                  className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleResetPassword(showResetPassword.id)}
                  className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activation Link Modal */}
      {showActivationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Link2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Lien d'activation</h2>
                  <p className="text-sm text-gray-500">Pour {showActivationModal.user.name}</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <p className="text-amber-800 text-sm">
                  <strong>Mode présentation</strong> : L'envoi d'emails est désactivé.
                  Partagez ce lien directement avec l'utilisateur.
                </p>
              </div>

              {showActivationModal.link && (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-2">
                    <input
                      type="text"
                      value={showActivationModal.link}
                      readOnly
                      className="flex-1 bg-transparent border-none text-sm text-gray-700 font-mono focus:outline-none"
                    />
                    <button
                      onClick={() => copyToClipboard(showActivationModal.link!)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg"
                      title="Copier"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <a
                      href={showActivationModal.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg"
                      title="Ouvrir"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    Ce lien expire dans 48 heures
                  </p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowActivationModal(null)}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Activation Modal */}
      {showBulkActivationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Liens d'activation générés</h2>
                    <p className="text-sm text-gray-500">{bulkActivationResults.length} utilisateur(s)</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowBulkActivationModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <p className="text-amber-800 text-sm">
                  <strong>Mode présentation</strong> : Partagez ces liens directement avec les utilisateurs.
                </p>
              </div>

              <div className="space-y-3">
                {bulkActivationResults.map((result, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{result.user.name}</p>
                        <p className="text-sm text-gray-500">{result.user.username}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(result.link)}
                        className="flex items-center gap-2 px-3 py-1 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <Copy className="w-3 h-3" />
                        Copier
                      </button>
                    </div>
                    <input
                      type="text"
                      value={result.link}
                      readOnly
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono text-gray-600"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={copyAllLinks}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copier tous les liens
              </button>
              <button
                onClick={() => setShowBulkActivationModal(false)}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating action bar when users are selected */}
      {selectedUsers.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center font-bold">
              {selectedUsers.size}
            </div>
            <span className="text-sm">utilisateur(s) sélectionné(s)</span>
          </div>
          <div className="h-8 w-px bg-gray-700" />
          <button
            onClick={handleBulkSendActivation}
            disabled={sendingActivation}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-400 disabled:bg-gray-600 rounded-xl transition-colors"
          >
            {sendingActivation ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Envoyer les liens d'activation
              </>
            )}
          </button>
          <button
            onClick={() => setSelectedUsers(new Set())}
            className="p-2 hover:bg-gray-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
