import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, BookOpen, ArrowLeft, Save, Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  civilite: string;
  subject: string;
  role: string;
}

const roleLabels: Record<string, string> = {
  TEACHER: 'Enseignant',
  SECRETARY: 'Secrétariat',
  PRINCIPAL: 'Direction',
  ADMIN: 'Administrateur',
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Champs éditables
  const [firstName, setFirstName] = useState('');

  // Changement de mot de passe
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        credentials: 'include',
      });

      if (!response.ok) {
        navigate('/login');
        return;
      }

      const data = await response.json();
      setUser(data);
      setFirstName(data.firstName || '');
    } catch (error) {
      console.error('Erreur:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    // Validation mot de passe si changement demandé
    if (showPasswordSection && newPassword) {
      if (!currentPassword) {
        setError('Veuillez saisir votre mot de passe actuel');
        return;
      }
      if (newPassword.length < 8) {
        setError('Le nouveau mot de passe doit contenir au moins 8 caractères');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return;
      }
    }

    setSaving(true);

    try {
      const body: any = { firstName };

      if (showPasswordSection && newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la sauvegarde');
        return;
      }

      setSuccess('Profil mis à jour avec succès');

      // Reset password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);

      // Refresh profile
      fetchProfile();
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur de connexion au serveur');
    } finally {
      setSaving(false);
    }
  };

  const getBackUrl = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'SECRETARY': return '/secretary';
      case 'PRINCIPAL': return '/principal';
      case 'ADMIN': return '/admin';
      default: return '/dashboard';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(getBackUrl())}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Mon Profil</h1>
          <p className="text-gray-500 mt-1">Gérez vos informations personnelles</p>
        </div>

        {/* Card principale */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Section informations en lecture seule */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
              Informations du compte
            </h2>

            <div className="space-y-4">
              {/* Email */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Email</p>
                  <p className="font-medium text-gray-800">{user.email}</p>
                </div>
              </div>

              {/* Nom */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Nom</p>
                  <p className="font-medium text-gray-800">{user.civilite} {user.lastName}</p>
                </div>
              </div>

              {/* Discipline */}
              {user.subject && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Discipline</p>
                    <p className="font-medium text-gray-800">{user.subject}</p>
                  </div>
                </div>
              )}

              {/* Rôle */}
              <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                <div className="w-10 h-10 bg-yellow-200 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-yellow-700" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Rôle</p>
                  <p className="font-medium text-yellow-700">{roleLabels[user.role] || user.role}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section prénom modifiable */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
              Prénom d'usage
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Vous pouvez modifier votre prénom d'usage (celui qui sera affiché dans l'application)
            </p>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-yellow-200 focus:border-yellow-500 transition-all text-gray-800"
              placeholder="Votre prénom d'usage"
            />
          </div>

          {/* Section mot de passe */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                Mot de passe
              </h2>
              {!showPasswordSection && (
                <button
                  onClick={() => setShowPasswordSection(true)}
                  className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                >
                  Modifier
                </button>
              )}
            </div>

            {showPasswordSection ? (
              <div className="space-y-4">
                {/* Mot de passe actuel */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Mot de passe actuel</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-yellow-200 focus:border-yellow-500 transition-all text-gray-800"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Nouveau mot de passe */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Nouveau mot de passe</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-yellow-200 focus:border-yellow-500 transition-all text-gray-800"
                      placeholder="Au moins 8 caractères"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirmation */}
                <div>
                  <label className="block text-sm text-gray-600 mb-2">Confirmer le mot de passe</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-yellow-200 focus:border-yellow-500 transition-all text-gray-800"
                      placeholder="Retapez le mot de passe"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Indicateur correspondance */}
                {confirmPassword && (
                  <div className={`flex items-center gap-2 text-sm ${newPassword === confirmPassword ? 'text-green-600' : 'text-amber-600'}`}>
                    {newPassword === confirmPassword ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Les mots de passe correspondent</span>
                      </>
                    ) : (
                      <>
                        <span>Les mots de passe ne correspondent pas</span>
                      </>
                    )}
                  </div>
                )}

                <button
                  onClick={() => {
                    setShowPasswordSection(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Cliquez sur "Modifier" pour changer votre mot de passe
              </p>
            )}
          </div>

          {/* Messages d'erreur/succès */}
          {error && (
            <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {success}
            </div>
          )}

          {/* Bouton sauvegarder */}
          <div className="p-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-3 px-6 rounded-xl font-bold shadow-lg hover:shadow-yellow-500/25 transform transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Pour modifier votre email ou d'autres informations, contactez l'administrateur.
        </p>
      </div>
    </div>
  );
}
