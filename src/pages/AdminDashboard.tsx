import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, Search, Users, UserCheck, UserX, Settings,
  Upload, Key, Home, TrendingUp, Edit2, Trash2, Plus,
  X, AlertCircle, FileText, Clock
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'import' | 'settings'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'TEACHER' | 'SECRETARY' | 'PRINCIPAL' | 'ADMIN'>('all');
  const [pacteFilter, setPacteFilter] = useState<'all' | 'pacte' | 'non-pacte'>('all');

  // Modal state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<User | null>(null);
  const [showResetPassword, setShowResetPassword] = useState<User | null>(null);

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

    return filtered;
  }, [users, searchTerm, roleFilter, pacteFilter]);

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

      const response = await fetch(url, {
        method: editingUser ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
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
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
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
            { id: 'settings', label: 'Paramètres', icon: Settings },
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
                <button
                  onClick={() => setActiveTab('settings')}
                  className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                >
                  <Settings className="w-8 h-8 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">Paramètres</p>
                    <p className="text-sm text-gray-500">Configuration système</p>
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
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Utilisateur</th>
                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Email/Login</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Rôle</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">PACTE</th>
                        <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredUsers.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50">
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
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditModal(u)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Modifier"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
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
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Import CSV (Pronote)</h2>
              <p className="text-sm text-gray-600 mb-4">
                Format attendu : login,civilite,nom,prenom,email,discipline,classes,statut_pacte
              </p>
              <textarea
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                placeholder="Collez votre CSV ici..."
                className="w-full h-64 p-4 border border-gray-200 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleImport}
                  disabled={!csvData.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4" />
                  Importer
                </button>
              </div>
            </div>

            {importResult && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-green-800 font-medium">Import réussi !</p>
                <p className="text-green-700 text-sm mt-1">
                  {importResult.created} créés, {importResult.updated} mis à jour
                </p>
                {importResult.errors && importResult.errors.length > 0 && (
                  <div className="mt-2 text-red-600 text-sm">
                    <p className="font-medium">Erreurs :</p>
                    <ul className="list-disc list-inside">
                      {importResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Paramètres</h2>
              <p className="text-gray-500">Les paramètres système seront disponibles prochainement.</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
                />
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
    </div>
  );
}
