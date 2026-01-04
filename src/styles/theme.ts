/**
 * 🎨 DESIGN SYSTEM - SupChaissac v2.0
 *
 * Ce fichier contient toutes les constantes de design pour assurer
 * la cohérence visuelle de l'application.
 */

// ============================================================================
// 🎨 COULEURS
// ============================================================================

export const colors = {
  // Couleur principale (Jaune signature SupChaissac)
  primary: {
    50: 'bg-yellow-50',
    100: 'bg-yellow-100',
    200: 'bg-yellow-200',
    300: 'bg-yellow-300',
    400: 'bg-yellow-400',
    500: 'bg-yellow-500',  // Couleur principale
    600: 'bg-yellow-600',
    700: 'bg-yellow-700',
    800: 'bg-yellow-800',
    900: 'bg-yellow-900',
  },

  // Couleurs neutres (Gris)
  neutral: {
    50: 'bg-gray-50',
    100: 'bg-gray-100',
    200: 'bg-gray-200',
    300: 'bg-gray-300',
    400: 'bg-gray-400',
    500: 'bg-gray-500',
    600: 'bg-gray-600',
    700: 'bg-gray-700',
    800: 'bg-gray-800',
    900: 'bg-gray-900',
  },

  // Couleurs par niveau de classe (fonctionnalité signature)
  grade: {
    '6e': {
      bg: 'bg-emerald-100',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      full: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    '5e': {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-200',
      full: 'bg-blue-100 text-blue-800 border-blue-200',
    },
    '4e': {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      border: 'border-purple-200',
      full: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    '3e': {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200',
      full: 'bg-red-100 text-red-800 border-red-200',
    },
    mixte: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      border: 'border-gray-200',
      full: 'bg-gray-100 text-gray-800 border-gray-200',
    },
  },

  // Couleurs par type de session
  sessionType: {
    RCD: {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      border: 'border-purple-200',
      full: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: 'text-purple-600',
    },
    DEVOIRS_FAITS: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-200',
      full: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: 'text-blue-600',
    },
    AUTRE: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200',
      full: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: 'text-yellow-600',
    },
    HSE: {
      bg: 'bg-rose-100',
      text: 'text-rose-800',
      border: 'border-rose-200',
      full: 'bg-rose-100 text-rose-800 border-rose-200',
      icon: 'text-rose-600',
    },
  },

  // Couleurs par statut
  status: {
    PENDING_REVIEW: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      border: 'border-orange-200',
      full: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: 'text-orange-600',
      label: 'En attente de révision',
    },
    PENDING_VALIDATION: {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      border: 'border-amber-200',
      full: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: 'text-amber-600',
      label: 'En attente de validation',
    },
    VALIDATED: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-100',
      full: 'bg-green-50 text-green-700 border-green-100',
      icon: 'text-green-600',
      label: 'Validée',
    },
    PAID: {
      bg: 'bg-green-300',
      text: 'text-green-900',
      border: 'border-green-400',
      full: 'bg-green-300 text-green-900 border-green-400',
      icon: 'text-green-700',
      label: 'Mis en paiement',
    },
    REJECTED: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200',
      full: 'bg-red-100 text-red-800 border-red-200',
      icon: 'text-red-600',
      label: 'Rejetée',
    },
  },

  // Couleurs sémantiques
  semantic: {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600',
  },
} as const;

// ============================================================================
// 📝 TYPOGRAPHIE
// ============================================================================

export const typography = {
  // Tailles de police
  fontSize: {
    xs: 'text-xs',      // 12px
    sm: 'text-sm',      // 14px
    base: 'text-base',  // 16px
    lg: 'text-lg',      // 18px
    xl: 'text-xl',      // 20px
    '2xl': 'text-2xl',  // 24px
    '3xl': 'text-3xl',  // 30px
    '4xl': 'text-4xl',  // 36px
  },

  // Poids de police
  fontWeight: {
    light: 'font-light',      // 300
    normal: 'font-normal',    // 400
    medium: 'font-medium',    // 500
    semibold: 'font-semibold',// 600
    bold: 'font-bold',        // 700
    extrabold: 'font-extrabold', // 800
  },

  // Famille de police
  fontFamily: {
    sans: 'font-sans',  // Inter (défini dans index.css)
  },
} as const;

// ============================================================================
// 📏 ESPACEMENTS
// ============================================================================

export const spacing = {
  // Padding internes
  padding: {
    xs: 'p-2',   // 8px
    sm: 'p-3',   // 12px
    base: 'p-4', // 16px
    lg: 'p-6',   // 24px
    xl: 'p-8',   // 32px
    '2xl': 'p-12', // 48px
  },

  // Marges externes
  margin: {
    xs: 'm-2',
    sm: 'm-3',
    base: 'm-4',
    lg: 'm-6',
    xl: 'm-8',
    '2xl': 'm-12',
  },

  // Gaps (pour flexbox/grid)
  gap: {
    xs: 'gap-2',
    sm: 'gap-3',
    base: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
  },
} as const;

// ============================================================================
// 🔲 BORDURES ET OMBRES
// ============================================================================

export const borders = {
  // Rayons de bordure (arrondis)
  radius: {
    none: 'rounded-none',
    sm: 'rounded-sm',      // 2px
    base: 'rounded',       // 4px
    md: 'rounded-md',      // 6px
    lg: 'rounded-lg',      // 8px
    xl: 'rounded-xl',      // 12px
    '2xl': 'rounded-2xl',  // 16px
    '3xl': 'rounded-3xl',  // 24px
    full: 'rounded-full',  // 9999px
  },

  // Épaisseurs de bordure
  width: {
    none: 'border-0',
    thin: 'border',      // 1px
    medium: 'border-2',  // 2px
    thick: 'border-4',   // 4px
  },
} as const;

export const shadows = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  base: 'shadow',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl',
  '2xl': 'shadow-2xl',
  inner: 'shadow-inner',

  // Ombres colorées (signature SupChaissac)
  yellow: 'shadow-lg shadow-yellow-500/25',
  yellowHover: 'hover:shadow-yellow-500/25',
} as const;

// ============================================================================
// 🎭 EFFETS VISUELS
// ============================================================================

export const effects = {
  // Backdrop blur (verre dépoli)
  backdropBlur: {
    none: 'backdrop-blur-none',
    sm: 'backdrop-blur-sm',
    base: 'backdrop-blur',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
  },

  // Opacité
  opacity: {
    0: 'opacity-0',
    50: 'opacity-50',
    75: 'opacity-75',
    90: 'opacity-90',
    95: 'opacity-95',
    100: 'opacity-100',
  },

  // Transitions
  transition: {
    none: 'transition-none',
    all: 'transition-all',
    colors: 'transition-colors',
    opacity: 'transition-opacity',
    shadow: 'transition-shadow',
    transform: 'transition-transform',
  },

  // Durées de transition
  duration: {
    75: 'duration-75',
    100: 'duration-100',
    150: 'duration-150',
    200: 'duration-200',
    300: 'duration-300',
    500: 'duration-500',
    700: 'duration-700',
    1000: 'duration-1000',
  },
} as const;

// ============================================================================
// 🎯 COMPOSANTS PRÉ-DÉFINIS
// ============================================================================

export const components = {
  // Boutons
  button: {
    // Bouton principal (jaune)
    primary: `
      bg-gradient-to-r from-yellow-500 to-yellow-600
      text-white font-bold py-3 px-6 rounded-xl
      shadow-lg hover:shadow-yellow-500/25
      transform transition-all duration-300 hover:-translate-y-0.5
      focus:outline-none focus:ring-4 focus:ring-yellow-200
      disabled:opacity-50 disabled:cursor-not-allowed
      active:scale-95
    `,

    // Bouton secondaire (gris)
    secondary: `
      bg-gray-200 hover:bg-gray-300
      text-gray-800 font-medium py-3 px-6 rounded-xl
      transition-all duration-200
      focus:outline-none focus:ring-4 focus:ring-gray-200
      active:scale-95
    `,

    // Bouton danger (rouge)
    danger: `
      bg-red-500 hover:bg-red-600
      text-white font-medium py-3 px-6 rounded-xl
      transition-all duration-200
      focus:outline-none focus:ring-4 focus:ring-red-200
      active:scale-95
    `,

    // Bouton ghost (transparent)
    ghost: `
      bg-transparent hover:bg-gray-100
      text-gray-700 font-medium py-3 px-6 rounded-xl
      transition-all duration-200
      focus:outline-none focus:ring-4 focus:ring-gray-200
      active:scale-95
    `,

    // Petit bouton
    small: `
      py-2 px-4 text-sm rounded-lg
    `,
  },

  // Cartes
  card: {
    // Carte principale avec effet verre
    glass: `
      bg-white/95 backdrop-blur-xl
      rounded-3xl shadow-2xl
      border border-gray-200
      p-8
      transition-all duration-300
    `,

    // Carte simple
    simple: `
      bg-white rounded-2xl shadow-lg
      border border-gray-200
      p-6
      transition-all duration-300
    `,

    // Carte cliquable
    clickable: `
      bg-white rounded-2xl shadow-md
      border-2 border-gray-200
      p-6
      transition-all duration-300
      hover:shadow-xl hover:border-yellow-300
      cursor-pointer active:scale-[0.98]
    `,
  },

  // Champs de saisie
  input: {
    // Input standard
    base: `
      w-full px-4 py-3
      border-2 border-gray-300 rounded-xl
      bg-white/80 backdrop-blur-sm
      text-gray-800 font-medium placeholder-gray-400
      focus:ring-4 focus:ring-yellow-200 focus:border-yellow-500
      transition-all duration-300
      disabled:opacity-50 disabled:cursor-not-allowed
    `,

    // Input avec erreur
    error: `
      border-red-500 focus:ring-red-200 focus:border-red-500
    `,
  },

  // Labels
  label: `
    text-xs font-bold text-gray-700 uppercase tracking-wider
    flex items-center gap-2
  `,

  // Badges
  badge: {
    // Badge standard
    base: `
      inline-flex items-center gap-1
      px-3 py-1 rounded-full
      text-xs font-semibold
      border transition-all duration-200
    `,
  },

  // Conteneurs
  container: {
    // Container principal
    main: `
      min-h-screen
      bg-gradient-to-br from-gray-50 via-white to-yellow-50
      flex items-center justify-center
      p-4 relative overflow-hidden
    `,

    // Container centré
    centered: `
      w-full max-w-md relative z-10
    `,
  },
} as const;

// ============================================================================
// 🎬 ANIMATIONS
// ============================================================================

export const animations = {
  // Animation blob (utilisée dans LoginPage)
  blob: `
    @keyframes blob {
      0%, 100% { transform: translate(0px, 0px) scale(1); }
      33% { transform: translate(30px, -50px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
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
  `,

  // Fade in
  fadeIn: 'animate-in fade-in duration-500',

  // Slide in
  slideInFromBottom: 'animate-in slide-in-from-bottom duration-300',
  slideInFromTop: 'animate-in slide-in-from-top duration-300',
  slideInFromLeft: 'animate-in slide-in-from-left duration-300',
  slideInFromRight: 'animate-in slide-in-from-right duration-300',
} as const;

// ============================================================================
// 📱 RESPONSIVE BREAKPOINTS
// ============================================================================

export const breakpoints = {
  sm: '640px',   // Mobile large
  md: '768px',   // Tablette
  lg: '1024px',  // Desktop
  xl: '1280px',  // Desktop large
  '2xl': '1536px', // Desktop très large
} as const;

// ============================================================================
// ♿ ACCESSIBILITÉ
// ============================================================================

export const accessibility = {
  // Focus states
  focusRing: {
    yellow: 'focus:outline-none focus:ring-4 focus:ring-yellow-200',
    blue: 'focus:outline-none focus:ring-4 focus:ring-blue-200',
    gray: 'focus:outline-none focus:ring-4 focus:ring-gray-200',
    red: 'focus:outline-none focus:ring-4 focus:ring-red-200',
  },

  // Screen reader only
  srOnly: 'sr-only',

  // Skip to content
  skipLink: `
    sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
    bg-yellow-500 text-white px-4 py-2 rounded-lg z-50
  `,
} as const;

// ============================================================================
// 🔧 HELPER FUNCTIONS
// ============================================================================

/**
 * Combine des classes CSS de manière conditionnelle
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Récupère les classes pour un statut de session
 */
export function getStatusClasses(status: keyof typeof colors.status) {
  return colors.status[status];
}

/**
 * Récupère les classes pour un niveau de classe
 */
export function getGradeClasses(grade: '6e' | '5e' | '4e' | '3e' | 'mixte') {
  return colors.grade[grade];
}

/**
 * Récupère les classes pour un type de session
 */
export function getSessionTypeClasses(type: keyof typeof colors.sessionType) {
  return colors.sessionType[type];
}
