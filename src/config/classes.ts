/**
 * Configuration des classes du collège
 *
 * INSTRUCTIONS POUR MODIFIER :
 * - Modifiez ce fichier au début de chaque année scolaire
 * - Ajoutez ou retirez des classes selon la structure de l'établissement
 * - Les couleurs sont automatiquement attribuées par niveau
 */

export interface ClassLevel {
  name: string;
  classes: string[];
  color: string; // Tailwind color class
}

// Configuration des classes par niveau
// Modifiez cette liste selon votre établissement
export const COLLEGE_LEVELS: ClassLevel[] = [
  {
    name: '6ème',
    classes: ['6A', '6B', '6C'], // 3 classes cette année
    color: 'blue'
  },
  {
    name: '5ème',
    classes: ['5A', '5B', '5C', '5D'],
    color: 'green'
  },
  {
    name: '4ème',
    classes: ['4A', '4B', '4C', '4D'],
    color: 'orange'
  },
  {
    name: '3ème',
    classes: ['3A', '3B', '3C', '3D'],
    color: 'red'
  }
];

// Fonction utilitaire pour obtenir toutes les classes à plat
export const getAllClasses = (): string[] => {
  return COLLEGE_LEVELS.flatMap(level => level.classes);
};

// Fonction pour obtenir la couleur d'une classe
export const getClassColor = (className: string): string => {
  for (const level of COLLEGE_LEVELS) {
    if (level.classes.includes(className)) {
      return level.color;
    }
  }
  return 'gray'; // Couleur par défaut pour classes personnalisées
};

// Couleurs Tailwind par niveau (pour le sélecteur)
export const LEVEL_COLORS: Record<string, { bg: string; text: string; hover: string }> = {
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    hover: 'hover:bg-blue-200'
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    hover: 'hover:bg-green-200'
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    hover: 'hover:bg-orange-200'
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    hover: 'hover:bg-red-200'
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    hover: 'hover:bg-purple-200'
  },
  gray: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    hover: 'hover:bg-gray-200'
  }
};
