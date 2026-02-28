import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, Calendar, ArrowRight,
  ChevronLeft, ChevronRight, Sparkles,
  GraduationCap, ClipboardList, Building2,
  FileText, Users, TrendingUp, MousePointer,
  CreditCard, BarChart3, Eye
} from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

type OnboardingPhase = 'intro' | 'choose-role' | 'tutorial';
type RoleType = 'teacher' | 'secretary' | 'principal' | null;

interface Slide {
  id: number;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  bgGradient: string;
  tip?: string;
}

// Slides d'introduction (pour tous)
const introSlides: Slide[] = [
  {
    id: 1,
    icon: <Sparkles className="w-16 h-16" />,
    title: "Bienvenue sur",
    subtitle: "SupChaissac",
    description: "L'application de gestion des heures supplémentaires du Collège Gaston Chaissac",
    color: "text-yellow-500",
    bgGradient: "from-yellow-400 to-amber-500",
  },
  {
    id: 2,
    icon: <Users className="w-16 h-16" />,
    title: "Un outil",
    subtitle: "pour tous",
    description: "Enseignants, Secrétariat et Direction travaillent ensemble pour un suivi simplifié des heures",
    color: "text-blue-500",
    bgGradient: "from-blue-400 to-blue-600",
  },
  {
    id: 3,
    icon: <TrendingUp className="w-16 h-16" />,
    title: "Workflow",
    subtitle: "transparent",
    description: "Déclaration → Vérification → Validation → Mise en paiement. Chaque étape est tracée et visible.",
    color: "text-green-500",
    bgGradient: "from-green-400 to-emerald-500",
  },
];

// Tutoriel Enseignant
const teacherSlides: Slide[] = [
  {
    id: 1,
    icon: <Calendar className="w-16 h-16" />,
    title: "Étape 1",
    subtitle: "Choisir un créneau",
    description: "Cliquez sur une case vide du calendrier pour déclarer une heure sur ce créneau",
    color: "text-purple-500",
    bgGradient: "from-purple-400 to-purple-600",
    tip: "Les créneaux déjà utilisés apparaissent en couleur",
  },
  {
    id: 2,
    icon: <FileText className="w-16 h-16" />,
    title: "Étape 2",
    subtitle: "Remplir le formulaire",
    description: "Choisissez le type (RCD, Devoirs Faits, Autre) puis complétez les informations demandées",
    color: "text-blue-500",
    bgGradient: "from-blue-400 to-blue-600",
    tip: "RCD = Remplacement, DF = Devoirs Faits, Autre = À préciser",
  },
  {
    id: 3,
    icon: <Eye className="w-16 h-16" />,
    title: "Étape 3",
    subtitle: "Suivre vos déclarations",
    description: "Vos heures apparaissent sur le calendrier. Les couleurs indiquent le statut de validation.",
    color: "text-amber-500",
    bgGradient: "from-amber-400 to-orange-500",
    tip: "Orange = En attente, Vert = Validée, Rouge = Rejetée",
  },
  {
    id: 4,
    icon: <BarChart3 className="w-16 h-16" />,
    title: "Bonus",
    subtitle: "Votre progression PACTE",
    description: "Si vous êtes dans le dispositif PACTE, suivez votre avancement vers vos objectifs d'heures",
    color: "text-green-500",
    bgGradient: "from-green-400 to-emerald-500",
  },
];

// Tutoriel Secrétaire
const secretarySlides: Slide[] = [
  {
    id: 1,
    icon: <ClipboardList className="w-16 h-16" />,
    title: "Votre mission",
    subtitle: "Vérifier les heures",
    description: "Examinez les déclarations des enseignants et vérifiez que tout est conforme",
    color: "text-purple-500",
    bgGradient: "from-purple-400 to-purple-600",
    tip: "Onglet 'À vérifier' pour voir les nouvelles déclarations",
  },
  {
    id: 2,
    icon: <CheckCircle className="w-16 h-16" />,
    title: "Vérification",
    subtitle: "Documents et infos",
    description: "Vérifiez les pièces jointes, la cohérence des informations, puis transmettez à la Direction",
    color: "text-blue-500",
    bgGradient: "from-blue-400 to-blue-600",
    tip: "Vous pouvez demander des infos complémentaires si besoin",
  },
  {
    id: 3,
    icon: <CreditCard className="w-16 h-16" />,
    title: "Mise en paiement",
    subtitle: "Après validation Direction",
    description: "Une fois validées par la Direction, marquez les heures comme 'Mises en paiement'",
    color: "text-green-500",
    bgGradient: "from-green-400 to-emerald-500",
    tip: "Sélection multiple possible pour traiter en lot",
  },
  {
    id: 4,
    icon: <Users className="w-16 h-16" />,
    title: "Gestion PACTE",
    subtitle: "Contrats enseignants",
    description: "Onglet 'Contrats PACTE' pour gérer les heures contractualisées de chaque enseignant",
    color: "text-amber-500",
    bgGradient: "from-amber-400 to-orange-500",
  },
];

// Tutoriel Principal
const principalSlides: Slide[] = [
  {
    id: 1,
    icon: <Building2 className="w-16 h-16" />,
    title: "Votre rôle",
    subtitle: "Valider ou rejeter",
    description: "Vous êtes le décisionnaire final. Validez les heures conformes, rejetez celles qui posent problème.",
    color: "text-purple-500",
    bgGradient: "from-purple-400 to-purple-600",
    tip: "Onglet 'À valider' pour voir les heures vérifiées par le secrétariat",
  },
  {
    id: 2,
    icon: <CheckCircle className="w-16 h-16" />,
    title: "Validation",
    subtitle: "Simple et rapide",
    description: "Cliquez sur une heure pour voir le détail, puis validez directement ou rejetez si besoin",
    color: "text-green-500",
    bgGradient: "from-green-400 to-emerald-500",
    tip: "Vous pouvez aussi convertir le type (ex: Autre → HSE)",
  },
  {
    id: 3,
    icon: <TrendingUp className="w-16 h-16" />,
    title: "Statistiques",
    subtitle: "Pilotez votre établissement",
    description: "Visualisez les heures par type, par enseignant, par période. Suivez votre enveloppe budgétaire.",
    color: "text-blue-500",
    bgGradient: "from-blue-400 to-blue-600",
  },
  {
    id: 4,
    icon: <Eye className="w-16 h-16" />,
    title: "Vue complète",
    subtitle: "Historique et suivi",
    description: "Retrouvez l'historique de toutes les heures validées, rejetées ou en attente de paiement",
    color: "text-amber-500",
    bgGradient: "from-amber-400 to-orange-500",
  },
];

const roleOptions = [
  {
    id: 'teacher',
    icon: <GraduationCap className="w-8 h-8" />,
    label: 'Enseignant',
    description: 'Déclarer mes heures',
    color: 'from-purple-500 to-purple-600',
    hoverColor: 'hover:border-purple-400',
  },
  {
    id: 'secretary',
    icon: <ClipboardList className="w-8 h-8" />,
    label: 'Secrétariat',
    description: 'Vérifier et gérer',
    color: 'from-blue-500 to-blue-600',
    hoverColor: 'hover:border-blue-400',
  },
  {
    id: 'principal',
    icon: <Building2 className="w-8 h-8" />,
    label: 'Direction',
    description: 'Valider et piloter',
    color: 'from-green-500 to-green-600',
    hoverColor: 'hover:border-green-400',
  },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [phase, setPhase] = useState<OnboardingPhase>('intro');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [selectedRole, setSelectedRole] = useState<RoleType>(null);

  const getCurrentSlides = (): Slide[] => {
    if (phase === 'intro') return introSlides;
    if (phase === 'tutorial') {
      switch (selectedRole) {
        case 'teacher': return teacherSlides;
        case 'secretary': return secretarySlides;
        case 'principal': return principalSlides;
        default: return [];
      }
    }
    return [];
  };

  const slides = getCurrentSlides();
  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(prev => prev + 1);
    } else if (phase === 'intro') {
      // Fin de l'intro → écran de choix
      setPhase('choose-role');
    } else if (phase === 'tutorial') {
      // Fin du tutoriel → terminer
      handleComplete();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(prev => prev - 1);
    }
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  const handleSelectRole = (role: RoleType) => {
    setSelectedRole(role);
    setCurrentSlide(0);
    setPhase('tutorial');
  };

  const handleComplete = () => {
    localStorage.setItem('supchaissac_onboarding_completed', 'true');
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('supchaissac_onboarding_completed', 'true');
    onComplete();
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
  };

  // Écran de choix du rôle
  if (phase === 'choose-role') {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-4 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full opacity-20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full opacity-20 blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-md flex flex-col items-center"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="relative mb-6"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-3xl blur-xl opacity-50" />
            <div className="relative bg-gradient-to-br from-yellow-400 to-amber-500 p-5 rounded-3xl text-white shadow-2xl">
              <MousePointer className="w-12 h-12" />
            </div>
          </motion.div>

          <h1 className="text-2xl font-light text-gray-300 mb-1">Voir le tutoriel</h1>
          <h2 className="text-3xl font-bold text-yellow-500 mb-2">pour votre rôle ?</h2>
          <p className="text-gray-400 text-center mb-8">Choisissez votre profil pour un guide adapté</p>

          {/* Role options */}
          <div className="w-full space-y-3 mb-6">
            {roleOptions.map((role, index) => (
              <motion.button
                key={role.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                onClick={() => handleSelectRole(role.id as RoleType)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl bg-gray-800/50 border-2 border-gray-700 ${role.hoverColor} transition-all duration-300 group`}
              >
                <div className={`p-3 rounded-xl bg-gradient-to-br ${role.color} text-white`}>
                  {role.icon}
                </div>
                <div className="text-left flex-1">
                  <p className="text-white font-semibold">{role.label}</p>
                  <p className="text-gray-400 text-sm">{role.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
              </motion.button>
            ))}
          </div>

          {/* Skip button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            onClick={handleSkip}
            className="text-gray-400 hover:text-white text-sm font-medium transition-colors py-3"
          >
            Passer et ne plus afficher
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Slides (intro ou tutoriel)
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br ${slide?.bgGradient || 'from-yellow-400 to-amber-500'} rounded-full opacity-20 blur-3xl transition-all duration-700`} />
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br ${slide?.bgGradient || 'from-yellow-400 to-amber-500'} rounded-full opacity-20 blur-3xl transition-all duration-700`} />
      </div>

      {/* Phase indicator */}
      {phase === 'tutorial' && (
        <div className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 text-sm">
          <span className="px-2 py-1 bg-gray-800 rounded-lg">
            Tutoriel {selectedRole === 'teacher' ? 'Enseignant' : selectedRole === 'secretary' ? 'Secrétariat' : 'Direction'}
          </span>
        </div>
      )}

      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 text-gray-400 hover:text-white text-sm font-medium transition-colors z-10"
      >
        Passer
      </button>

      {/* Main content */}
      <div className="relative w-full max-w-md flex flex-col items-center">
        {/* Animated slide content */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`${phase}-${slide?.id}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 },
            }}
            className="flex flex-col items-center text-center"
          >
            {/* Icon with animated background */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
              className="relative mb-8"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${slide?.bgGradient} rounded-3xl blur-xl opacity-50`} />
              <div className={`relative bg-gradient-to-br ${slide?.bgGradient} p-6 rounded-3xl text-white shadow-2xl`}>
                {slide?.icon}
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-light text-gray-300 mb-1"
            >
              {slide?.title}
            </motion.h1>

            {/* Subtitle */}
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`text-4xl font-bold ${slide?.color} mb-6`}
            >
              {slide?.subtitle}
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-400 text-lg leading-relaxed max-w-sm"
            >
              {slide?.description}
            </motion.p>

            {/* Tip box (for tutorial slides) */}
            {slide?.tip && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-6 px-4 py-3 bg-gray-800/50 rounded-xl border border-gray-700"
              >
                <p className="text-sm text-gray-300">
                  <span className="text-yellow-500 font-medium">💡 Astuce : </span>
                  {slide.tip}
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation dots */}
        <div className="flex items-center gap-2 mt-12 mb-8">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentSlide
                  ? `w-8 h-2 bg-gradient-to-r ${slide?.bgGradient}`
                  : 'w-2 h-2 bg-gray-600 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-4 w-full max-w-xs">
          {/* Previous button */}
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className={`p-3 rounded-xl transition-all duration-300 ${
              currentSlide === 0
                ? 'opacity-0 pointer-events-none'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Next / Continue button */}
          <button
            onClick={nextSlide}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg bg-gradient-to-r ${slide?.bgGradient}`}
          >
            {phase === 'intro' && isLastSlide ? (
              <>
                <span>Continuer</span>
                <ArrowRight className="w-5 h-5" />
              </>
            ) : phase === 'tutorial' && isLastSlide ? (
              <>
                <span>C'est parti !</span>
                <Sparkles className="w-5 h-5" />
              </>
            ) : (
              <>
                <span>Suivant</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {/* Next button (for symmetry) */}
          <button
            onClick={nextSlide}
            disabled={isLastSlide && phase === 'tutorial'}
            className={`p-3 rounded-xl transition-all duration-300 ${
              isLastSlide && phase === 'tutorial'
                ? 'opacity-0 pointer-events-none'
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Swipe hint for mobile */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-6 text-gray-500 text-sm"
      >
        Glissez ou cliquez pour naviguer
      </motion.p>
    </div>
  );
}

// Helper function to check if onboarding should be shown
export function shouldShowOnboarding(): boolean {
  return localStorage.getItem('supchaissac_onboarding_completed') !== 'true';
}

// Helper function to reset onboarding (for testing)
export function resetOnboarding(): void {
  localStorage.removeItem('supchaissac_onboarding_completed');
}
