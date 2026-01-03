import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, ArrowRight, Info, User, Lock, Plus, GraduationCap, ClipboardList, Building2, Settings } from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import Onboarding, { shouldShowOnboarding } from '../components/Onboarding';

interface DBUser {
  id: number;
  name: string;
  username: string;
  role: 'TEACHER' | 'SECRETARY' | 'PRINCIPAL' | 'ADMIN';
  inPacte: boolean;
  civilite: string | null;
}

interface DisplayAccount {
  id: string;
  name: string;
  role: string;
  roleType: 'teacher' | 'secretary' | 'principal' | 'admin';
  email: string;
  pacteStatus: boolean;
  color: string;
  bgColor: string;
}

const getRoleDisplay = (role: string, civilite: string | null): { roleType: 'teacher' | 'secretary' | 'principal' | 'admin'; roleLabel: string; color: string; bgColor: string } => {
  switch (role) {
    case 'TEACHER':
      return {
        roleType: 'teacher',
        roleLabel: civilite === 'Mme' ? 'Enseignante' : 'Enseignant',
        color: 'text-gray-800',
        bgColor: 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300 hover:from-gray-100 hover:to-gray-200'
      };
    case 'SECRETARY':
      return {
        roleType: 'secretary',
        roleLabel: 'Secrétariat',
        color: 'text-blue-800',
        bgColor: 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-300 hover:from-blue-100 hover:to-blue-200'
      };
    case 'PRINCIPAL':
      return {
        roleType: 'principal',
        roleLabel: 'Direction',
        color: 'text-purple-800',
        bgColor: 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-300 hover:from-purple-100 hover:to-purple-200'
      };
    case 'ADMIN':
      return {
        roleType: 'admin',
        roleLabel: 'Administrateur',
        color: 'text-red-800',
        bgColor: 'bg-gradient-to-r from-red-50 to-red-100 border-red-300 hover:from-red-100 hover:to-red-200'
      };
    default:
      return {
        roleType: 'teacher',
        roleLabel: 'Utilisateur',
        color: 'text-gray-800',
        bgColor: 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300 hover:from-gray-100 hover:to-gray-200'
      };
  }
};

const getRoleIcon = (roleType: string) => {
  switch (roleType) {
    case 'teacher': return <GraduationCap className="w-5 h-5" />;
    case 'secretary': return <ClipboardList className="w-5 h-5" />;
    case 'principal': return <Building2 className="w-5 h-5" />;
    case 'admin': return <Settings className="w-5 h-5" />;
    default: return <User className="w-5 h-5" />;
  }
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isTestMode, setIsTestMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(shouldShowOnboarding());

  // Utilisateurs chargés depuis la base de données
  const [teacherAccounts, setTeacherAccounts] = useState<DisplayAccount[]>([]);
  const [adminAccounts, setAdminAccounts] = useState<DisplayAccount[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Charger les utilisateurs au montage (seulement les comptes de démo @example.com)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/users-list`, {
          credentials: 'include',
        });
        if (response.ok) {
          const users: DBUser[] = await response.json();

          // Filtrer les comptes de démo (@example.com) + secrétaire et principal réels
          const demoUsers = users.filter(u =>
            u.username.endsWith('@example.com') ||
            u.role === 'SECRETARY' ||
            u.role === 'PRINCIPAL'
          );

          // Transformer les utilisateurs en DisplayAccount
          const teachers: DisplayAccount[] = [];
          const admins: DisplayAccount[] = [];

          demoUsers.forEach((user) => {
            const roleInfo = getRoleDisplay(user.role, user.civilite);
            const account: DisplayAccount = {
              id: user.id.toString(),
              name: user.name,
              role: roleInfo.roleLabel,
              roleType: roleInfo.roleType,
              email: user.username,
              pacteStatus: user.inPacte || false,
              color: roleInfo.color,
              bgColor: user.inPacte
                ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-300 hover:from-yellow-100 hover:to-yellow-200'
                : roleInfo.bgColor,
            };

            if (user.role === 'TEACHER') {
              teachers.push(account);
            } else {
              admins.push(account);
            }
          });

          setTeacherAccounts(teachers);
          setAdminAccounts(admins);
        }
      } catch (error) {
        console.error('Erreur chargement utilisateurs:', error);
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, []);

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

  const handleTestAccountClick = (account: DisplayAccount) => {
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
      
      <div className={`w-full relative z-10 ${isTestMode ? 'max-w-4xl' : 'max-w-md'}`}>
        <div className={`${isTestMode ? 'lg:grid lg:grid-cols-2 lg:gap-6' : ''}`}>
        {/* Main Card - Light theme with your logo colors */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 p-8 relative overflow-hidden">
          {/* Subtle yellow reflection effect */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-200/30 to-transparent rounded-full blur-2xl"></div>
          
          {/* Logo Section - Using your actual logo image */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <img
                  src="/logo.png"
                  alt="SupChaissac Logo"
                  className="w-40 h-40 object-contain drop-shadow-lg"
                />
                {/* Subtle glow effect around logo */}
                <div className="absolute inset-0 rounded-full bg-yellow-400/20 blur-xl"></div>
              </div>
            </div>
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
          <div className="mt-6 lg:mt-0 bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-200 p-4 shadow-xl lg:max-h-[600px] lg:overflow-y-auto">
            {/* Section Enseignants */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3 px-1">
                <GraduationCap className="w-4 h-4 text-yellow-600" />
                <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">
                  Enseignants
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {teacherAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => handleTestAccountClick(account)}
                    className={`relative p-3 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg ${account.bgColor} group overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    <div className="relative text-left flex items-center gap-3">
                      <div className={`${account.pacteStatus ? 'text-yellow-600' : 'text-gray-500'}`}>
                        {getRoleIcon(account.roleType)}
                      </div>
                      <div className="flex-1">
                        <div className={`font-bold ${account.color} text-sm`}>
                          {account.name}
                        </div>
                      </div>
                      {account.pacteStatus ? (
                        <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 text-[10px] font-bold rounded-full">PACTE</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-medium rounded-full">Sans PACTE</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Separateur */}
            <div className="border-t border-gray-200 my-4"></div>

            {/* Section Administration */}
            <div>
              <div className="flex items-center gap-2 mb-3 px-1">
                <Building2 className="w-4 h-4 text-purple-600" />
                <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">
                  Administration
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {adminAccounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => handleTestAccountClick(account)}
                    className={`relative p-3 rounded-xl border-2 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg ${account.bgColor} group overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    <div className="relative text-left flex items-center gap-3">
                      <div className={account.color}>
                        {getRoleIcon(account.roleType)}
                      </div>
                      <div className="flex-1">
                        <div className={`font-bold ${account.color} text-sm`}>
                          {account.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {account.role}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        </div>
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