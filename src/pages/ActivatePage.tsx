import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export default function ActivatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState('');
  const [activated, setActivated] = useState(false);

  // Vérifier le token au chargement
  useEffect(() => {
    if (!token) {
      setTokenError('Aucun token fourni');
      setVerifying(false);
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/verify-token/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setTokenError(data.error || 'Token invalide');
          setTokenValid(false);
        } else {
          setTokenValid(true);
          setUserName(data.name);
          setUserEmail(data.email);
        }
      } catch (err) {
        setTokenError('Erreur de connexion au serveur');
        setTokenValid(false);
      } finally {
        setVerifying(false);
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError('');

    // Validation
    if (password.length < 8) {
      setActivationError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (password !== confirmPassword) {
      setActivationError('Les mots de passe ne correspondent pas');
      return;
    }

    setActivating(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setActivationError(data.error || 'Erreur lors de l\'activation');
      } else {
        setActivated(true);
        // Rediriger vers login après 3 secondes
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err) {
      setActivationError('Erreur de connexion au serveur');
    } finally {
      setActivating(false);
    }
  };

  // Affichage pendant la vérification
  if (loading || verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-violet-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Vérification du lien...</p>
        </div>
      </div>
    );
  }

  // Token invalide ou expiré
  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Lien invalide</h1>
          <p className="text-slate-400 mb-6">{tokenError}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  // Compte activé avec succès
  if (activated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Compte activé !</h1>
          <p className="text-slate-400 mb-6">
            Votre compte est maintenant actif. Vous allez être redirigé vers la page de connexion...
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium transition-colors"
          >
            Se connecter maintenant
          </button>
        </div>
      </div>
    );
  }

  // Formulaire d'activation
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8 max-w-md w-full">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/20">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Activer votre compte</h1>
          <p className="text-slate-400">
            Bienvenue {userName} !
          </p>
          <p className="text-sm text-slate-500 mt-1">{userEmail}</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleActivate} className="space-y-6">
          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Créez votre mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent pr-12"
                placeholder="Au moins 8 caractères"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirmation */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Confirmez le mot de passe
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent pr-12"
                placeholder="Retapez votre mot de passe"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Indicateur de correspondance */}
          {confirmPassword && (
            <div className={`flex items-center gap-2 text-sm ${password === confirmPassword ? 'text-green-400' : 'text-amber-400'}`}>
              {password === confirmPassword ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Les mots de passe correspondent</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  <span>Les mots de passe ne correspondent pas</span>
                </>
              )}
            </div>
          )}

          {/* Erreur */}
          {activationError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {activationError}
            </div>
          )}

          {/* Bouton */}
          <button
            type="submit"
            disabled={activating || password.length < 8 || password !== confirmPassword}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
          >
            {activating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Activation...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Activer mon compte
              </>
            )}
          </button>
        </form>

        {/* Info sécurité */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Votre mot de passe doit contenir au moins 8 caractères.
          Nous vous recommandons d'utiliser un mélange de lettres, chiffres et symboles.
        </p>
      </div>
    </div>
  );
}
