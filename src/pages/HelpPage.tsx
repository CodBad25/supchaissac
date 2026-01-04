import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  HelpCircle,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Users,
  FileText,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Play,
  Mail,
  Sparkles,
  GraduationCap,
  ClipboardList,
  Building2,
  Shield,
  Upload,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { resetTour } from '../components/GuidedTour';

type UserRole = 'TEACHER' | 'SECRETARY' | 'PRINCIPAL' | 'ADMIN';

interface FAQItem {
  question: string;
  answer: string;
}

const HelpPage: React.FC = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<UserRole>('TEACHER');
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: 'include',
        });
        if (response.ok) {
          const user = await response.json();
          setUserRole(user.role);
        }
      } catch (error) {
        console.error('Erreur:', error);
      }
    };
    fetchUser();
  }, []);

  const handleRestartTour = () => {
    const tourId = userRole.toLowerCase() === 'teacher' ? 'teacher'
      : userRole.toLowerCase() === 'secretary' ? 'secretary'
      : userRole.toLowerCase() === 'principal' ? 'principal'
      : 'teacher';
    resetTour(tourId);

    // Navigate back to dashboard
    if (userRole === 'TEACHER') navigate('/dashboard');
    else if (userRole === 'SECRETARY') navigate('/secretary');
    else if (userRole === 'PRINCIPAL') navigate('/principal');
    else if (userRole === 'ADMIN') navigate('/admin');
  };

  const handleBack = () => {
    if (userRole === 'TEACHER') navigate('/dashboard');
    else if (userRole === 'SECRETARY') navigate('/secretary');
    else if (userRole === 'PRINCIPAL') navigate('/principal');
    else if (userRole === 'ADMIN') navigate('/admin');
  };

  // FAQ par rôle
  const faqByRole: Record<UserRole, FAQItem[]> = {
    TEACHER: [
      {
        question: "Comment déclarer une heure supplémentaire ?",
        answer: "Cliquez sur un créneau vide dans le calendrier (vue semaine ou mois). Choisissez le type (RCD, Devoirs Faits ou Autre), remplissez les informations demandées puis validez."
      },
      {
        question: "Que signifient les couleurs sur le calendrier ?",
        answer: "Violet = RCD, Bleu = Devoirs Faits, Rose = HSE, Ambre = Autre. L'opacité indique le statut : plus clair = en attente, plein = validé."
      },
      {
        question: "Puis-je modifier une session déclarée ?",
        answer: "Oui, mais uniquement si elle est encore en statut 'En attente de vérification'. Cliquez sur la session puis sur 'Modifier'."
      },
      {
        question: "Comment ajouter une pièce jointe ?",
        answer: "Cliquez sur une session existante, puis sur 'Ajouter un fichier'. Formats acceptés : PDF, images. Taille max : 10 Mo."
      },
      {
        question: "Qu'est-ce que le contrat PACTE ?",
        answer: "Le PACTE permet de contractualiser un nombre d'heures annuelles (RCD et/ou Devoirs Faits). Votre progression vers cet objectif est visible sur votre dashboard."
      }
    ],
    SECRETARY: [
      {
        question: "Comment vérifier les sessions des enseignants ?",
        answer: "Allez dans l'onglet 'À vérifier'. Pour chaque session, vérifiez les informations et les pièces jointes, puis cliquez sur 'Transmettre' pour envoyer à la Direction."
      },
      {
        question: "Puis-je rejeter une session ?",
        answer: "Non, seule la Direction peut rejeter. Vous pouvez demander des informations complémentaires à l'enseignant si besoin."
      },
      {
        question: "Comment gérer les contrats PACTE ?",
        answer: "Allez dans l'onglet 'Contrats PACTE'. Vous pouvez y modifier les heures contractualisées de chaque enseignant (heures DF et RCD)."
      },
      {
        question: "Comment mettre en paiement ?",
        answer: "Une fois les sessions validées par la Direction, elles apparaissent dans l'onglet 'À payer'. Sélectionnez-les et cliquez sur 'Marquer en paiement'."
      }
    ],
    PRINCIPAL: [
      {
        question: "Comment valider une session ?",
        answer: "Allez dans l'onglet 'À valider'. Cliquez sur une session pour voir le détail, puis cliquez sur 'Valider' ou 'Rejeter' (avec motif obligatoire)."
      },
      {
        question: "Puis-je convertir le type d'une session ?",
        answer: "Oui, vous pouvez convertir une session 'Autre' en RCD, Devoirs Faits ou HSE. Le type original reste visible dans l'historique."
      },
      {
        question: "Où voir les statistiques ?",
        answer: "Le dashboard affiche les statistiques globales. Vous pouvez aussi consulter l'onglet 'Statistiques' pour des vues plus détaillées par enseignant ou par période."
      },
      {
        question: "Comment voir l'historique des validations ?",
        answer: "L'onglet 'Historique' affiche toutes les sessions passées avec leurs statuts, dates de validation et éventuels motifs de rejet."
      }
    ],
    ADMIN: [
      {
        question: "Comment ajouter un utilisateur ?",
        answer: "Allez dans l'onglet 'Utilisateurs' puis cliquez sur 'Ajouter'. Remplissez les informations (nom, email, rôle) et enregistrez."
      },
      {
        question: "Comment importer les enseignants depuis Pronote ?",
        answer: "Exportez la liste des enseignants depuis Pronote en CSV, puis utilisez 'Importer CSV' dans l'onglet correspondant. Le format attendu est : LOGIN,CIVILITE,NOM,PRENOM,EMAIL,DISCIPLINE"
      },
      {
        question: "Comment réinitialiser un mot de passe ?",
        answer: "Cliquez sur l'utilisateur concerné, puis sur 'Réinitialiser le mot de passe'. Un nouveau mot de passe temporaire sera généré."
      },
      {
        question: "Comment activer le statut PACTE d'un enseignant ?",
        answer: "Dans la liste des utilisateurs, utilisez le toggle PACTE sur la carte de l'enseignant pour activer/désactiver son statut PACTE."
      }
    ]
  };

  // Contenu spécifique par rôle
  const roleContent: Record<UserRole, { title: string; icon: React.ReactNode; color: string; steps: { icon: React.ReactNode; title: string; description: string }[] }> = {
    TEACHER: {
      title: "Guide Enseignant",
      icon: <GraduationCap className="w-6 h-6" />,
      color: "purple",
      steps: [
        {
          icon: <Calendar className="w-5 h-5" />,
          title: "1. Choisir un créneau",
          description: "Cliquez sur une case vide du calendrier pour déclarer une heure sur ce créneau."
        },
        {
          icon: <FileText className="w-5 h-5" />,
          title: "2. Remplir le formulaire",
          description: "Choisissez le type (RCD, Devoirs Faits, Autre) puis complétez les informations."
        },
        {
          icon: <Upload className="w-5 h-5" />,
          title: "3. Ajouter des justificatifs",
          description: "Si nécessaire, ajoutez des pièces jointes (PDF, images) pour justifier votre déclaration."
        },
        {
          icon: <Clock className="w-5 h-5" />,
          title: "4. Suivre la validation",
          description: "Suivez l'état de vos déclarations : En attente → Validée → Payée."
        }
      ]
    },
    SECRETARY: {
      title: "Guide Secrétariat",
      icon: <ClipboardList className="w-6 h-6" />,
      color: "blue",
      steps: [
        {
          icon: <ClipboardList className="w-5 h-5" />,
          title: "1. Vérifier les sessions",
          description: "Examinez les déclarations des enseignants, vérifiez les pièces jointes et les informations."
        },
        {
          icon: <CheckCircle className="w-5 h-5" />,
          title: "2. Transmettre à la Direction",
          description: "Une fois vérifiée, transmettez la session à la Direction pour validation finale."
        },
        {
          icon: <Users className="w-5 h-5" />,
          title: "3. Gérer les contrats PACTE",
          description: "Configurez les heures contractualisées de chaque enseignant (DF et RCD)."
        },
        {
          icon: <CreditCard className="w-5 h-5" />,
          title: "4. Mettre en paiement",
          description: "Après validation Direction, marquez les sessions comme mises en paiement."
        }
      ]
    },
    PRINCIPAL: {
      title: "Guide Direction",
      icon: <Building2 className="w-6 h-6" />,
      color: "green",
      steps: [
        {
          icon: <ClipboardList className="w-5 h-5" />,
          title: "1. Consulter les sessions",
          description: "Visualisez les sessions vérifiées par le secrétariat dans l'onglet 'À valider'."
        },
        {
          icon: <CheckCircle className="w-5 h-5" />,
          title: "2. Valider ou rejeter",
          description: "Validez les sessions conformes ou rejetez avec un motif obligatoire."
        },
        {
          icon: <TrendingUp className="w-5 h-5" />,
          title: "3. Convertir si nécessaire",
          description: "Vous pouvez convertir le type d'une session (ex: Autre → HSE)."
        },
        {
          icon: <BookOpen className="w-5 h-5" />,
          title: "4. Suivre les statistiques",
          description: "Consultez les tableaux de bord pour piloter l'enveloppe budgétaire."
        }
      ]
    },
    ADMIN: {
      title: "Guide Admin",
      icon: <Shield className="w-6 h-6" />,
      color: "amber",
      steps: [
        {
          icon: <Users className="w-5 h-5" />,
          title: "1. Gérer les utilisateurs",
          description: "Créez, modifiez ou supprimez les comptes utilisateurs (enseignants, secrétariat, direction)."
        },
        {
          icon: <Upload className="w-5 h-5" />,
          title: "2. Importer les données",
          description: "Importez les enseignants et élèves depuis des fichiers CSV (export Pronote)."
        },
        {
          icon: <Mail className="w-5 h-5" />,
          title: "3. Envoyer les activations",
          description: "Envoyez les liens d'activation par email aux nouveaux utilisateurs."
        },
        {
          icon: <FileText className="w-5 h-5" />,
          title: "4. Configurer PACTE",
          description: "Activez le statut PACTE pour les enseignants concernés."
        }
      ]
    }
  };

  const currentRole = roleContent[userRole];
  const currentFAQ = faqByRole[userRole];
  const colorClasses = {
    purple: { bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    blue: { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    green: { bg: 'bg-green-500', light: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
    amber: { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  };
  const colors = colorClasses[currentRole.color as keyof typeof colorClasses];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-yellow-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg ${colors.light}`}>
                  <HelpCircle className={`w-5 h-5 ${colors.text}`} />
                </div>
                <h1 className="text-xl font-bold text-gray-800">Centre d'aide</h1>
              </div>
            </div>
            <button
              onClick={handleRestartTour}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-medium transition-colors"
            >
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Relancer la visite guidée</span>
              <span className="sm:hidden">Visite</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Role Header */}
        <div className={`${colors.light} rounded-2xl p-6 border ${colors.border}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 ${colors.bg} rounded-xl text-white`}>
              {currentRole.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{currentRole.title}</h2>
              <p className="text-gray-600">Votre guide pour utiliser SupChaissac</p>
            </div>
          </div>
        </div>

        {/* Workflow */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Comment ça marche ?
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {currentRole.steps.map((step, index) => (
              <div key={index} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                <div className={`p-2 ${colors.light} rounded-lg h-fit`}>
                  <span className={colors.text}>{step.icon}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">{step.title}</h4>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Workflow global */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Circuit de validation
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            <div className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium">
              Enseignant déclare
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
            <div className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg font-medium">
              En attente
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
            <div className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium">
              Secrétariat vérifie
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
            <div className="px-3 py-2 bg-green-100 text-green-700 rounded-lg font-medium">
              Direction valide
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
            <div className="px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-medium">
              Payé
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-500" />
            Questions fréquentes
          </h3>
          <div className="space-y-3">
            {currentFAQ.map((item, index) => (
              <div key={index} className="border border-gray-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-medium text-gray-800">{item.question}</span>
                  {openFAQ === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {openFAQ === index && (
                  <div className="px-4 pb-4 text-gray-600 text-sm leading-relaxed">
                    {item.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Types de sessions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-500" />
            Types de sessions
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <div>
                <span className="font-medium text-purple-800">RCD</span>
                <p className="text-xs text-purple-600">Remplacement Courte Durée</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <span className="font-medium text-blue-800">Devoirs Faits</span>
                <p className="text-xs text-blue-600">Aide aux devoirs</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
              <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
              <div>
                <span className="font-medium text-rose-800">HSE</span>
                <p className="text-xs text-rose-600">Heures Supplémentaires Effectives</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <div>
                <span className="font-medium text-amber-800">Autre</span>
                <p className="text-xs text-amber-600">Autre type d'intervention</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-2xl p-6 border border-yellow-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-yellow-500 rounded-xl text-white">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">Besoin d'aide ?</h3>
              <p className="text-gray-600 text-sm mb-3">
                Si vous rencontrez un problème technique ou avez une question, contactez l'administrateur de l'application.
              </p>
              <p className="text-sm text-gray-500">
                Application développée pour le Collège Gaston Chaissac
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
