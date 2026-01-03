import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, ArrowRight, Info, User, Lock, Plus } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import Onboarding, { shouldShowOnboarding } from '../components/Onboarding';

interface TestAccount {
  id: string;
  name: string;
  role: string;
  email: string;
  pacteStatus: boolean;
  color: string;
  bgColor: string;
}

const testAccounts: TestAccount[] = [
  {
    id: '1',
    name: 'Sophie Martin',
    role: 'Enseignante sans pacte',
    email: 'teacher1@example.com',
    pacteStatus: false,
    color: 'text-gray-800',
    bgColor: 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300 hover:from-gray-100 hover:to-gray-200'
  },
  {
    id: '2',
    name: 'Marie Petit',
    role: 'Enseignante avec pacte',
    email: 'teacher2@example.com',
    pacteStatus: true,
    color: 'text-gray-800',
    bgColor: 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300 hover:from-yellow-100 hover:to-yellow-200'
  },
  {
    id: '3',
    name: 'Martin Dubois',
    role: 'Enseignant sans pacte',
    email: 'teacher3@example.com',
    pacteStatus: false,
    color: 'text-gray-800',
    bgColor: 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300 hover:from-gray-100 hover:to-gray-200'
  },
  {
    id: '4',
    name: 'Philippe Garcia',
    role: 'Enseignant avec pacte',
    email: 'teacher4@example.com',
    pacteStatus: true,
    color: 'text-gray-800',
    bgColor: 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300 hover:from-yellow-100 hover:to-yellow-200'
  },
  {
    id: '5',
    name: 'Laure Martin',
    role: 'Secrétariat',
    email: 'secretary@example.com',
    pacteStatus: false,
    color: 'text-gray-800',
    bgColor: 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300 hover:from-gray-100 hover:to-gray-200'
  },
  {
    id: '6',
    name: 'Jean Dupont',
    role: 'Direction',
    email: 'principal@example.com',
    pacteStatus: false,
    color: 'text-gray-800',
    bgColor: 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300 hover:from-gray-100 hover:to-gray-200'
  },
  {
    id: '7',
    name: 'Admin Système',
    role: 'Administrateur',
    email: 'admin@example.com',
    pacteStatus: false,
    color: 'text-red-800',
    bgColor: 'bg-gradient-to-r from-red-50 to-red-100 border-red-300 hover:from-red-100 hover:to-red-200'
  }
];

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isTestMode, setIsTestMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(shouldShowOnboarding());

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: email, password }),
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        // Redirection selon le role
        switch (userData.role) {
          case 'SECRETARY':
            navigate('/secretary');
            break;
          case 'PRINCIPAL':
            navigate('/principal');
            break;
          case 'ADMIN':
            navigate('/admin');
            break;
          case 'TEACHER':
          default:
            navigate('/dashboard');
            break;
        }
      } else {
        alert('Erreur de connexion');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestAccountClick = (account: TestAccount) => {
    setEmail(account.email);
    setPassword('password123');
  };

  // Show onboarding on first visit
  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50 flex items-center justify-center p-4 relative overflow-hidden w-full max-w-full">
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-grid-gray-200/30 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      
      {/* Animated Yellow Accents */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-yellow-200/20 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob"></div>
      <div className="absolute top-40 right-20 w-96 h-96 bg-yellow-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-yellow-100/20 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Main Card - Light theme with your logo colors */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 p-8 relative overflow-hidden">
          {/* Subtle yellow reflection effect */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-200/30 to-transparent rounded-full blur-2xl"></div>
          
          {/* Logo Section - Using your actual logo image */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <img 
                  src="/images/logo_supchaissac_v5_minimaliste (1).png" 
                  alt="SupChaissac Logo" 
                  className="w-32 h-32 object-contain drop-shadow-lg"
                />
                {/* Subtle glow effect around logo */}
                <div className="absolute inset-0 rounded-full bg-yellow-400/20 blur-xl"></div>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm font-medium">
              Gestion des Heures Supplémentaires
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gray-100 rounded-xl p-1 flex">
              <button
                type="button"
                onClick={() => setIsTestMode(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isTestMode
                    ? 'bg-white text-yellow-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Mode Test
              </button>
              <button
                type="button"
                onClick={() => setIsTestMode(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  !isTestMode
                    ? 'bg-white text-yellow-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Mode Réel
              </button>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <User className="w-3 h-3 text-yellow-500" />
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@example.com"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-yellow-200 focus:border-yellow-500 transition-all duration-300 text-gray-800 font-medium placeholder-gray-400 bg-white/80 backdrop-blur-sm"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-3 h-3 text-yellow-500" />
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-yellow-200 focus:border-yellow-500 transition-all duration-300 text-gray-800 font-medium bg-white/80 backdrop-blur-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-yellow-500 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white py-3 px-6 rounded-xl font-bold shadow-lg hover:shadow-yellow-500/25 transform transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Test Accounts Section - Only in test mode */}
        {isTestMode && (
          <div className="mt-6 bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-200 p-6 shadow-xl">
            <p className="text-xs text-gray-500 text-center mb-4 font-bold uppercase tracking-wider">
              Comptes de test (développement)
            </p>
            <div className="grid grid-cols-1 gap-3">
              {testAccounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => handleTestAccountClick(account)}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg ${account.bgColor} group overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <div className="relative text-left">
                    <div className={`font-bold ${account.color} text-base`}>
                      {account.name}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 font-medium">
                      {account.role}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {account.email}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .bg-grid-gray-200\/30 {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(229 231 235 / 0.3)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
        }
      `}</style>
    </div>
  );
};

export default LoginPage;