import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour détecter si l'appareil est mobile
 * @param breakpoint - Largeur en pixels en dessous de laquelle l'appareil est considéré comme mobile (par défaut 768px)
 * @returns Un booléen indiquant si l'appareil est mobile
 */
export function useIsMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Fonction pour vérifier la taille de l'écran
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Vérifier immédiatement
    checkIsMobile();

    // Ajouter un écouteur d'événement pour les changements de taille d'écran
    window.addEventListener('resize', checkIsMobile);

    // Nettoyer l'écouteur d'événement lors du démontage
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, [breakpoint]);

  return isMobile;
}
