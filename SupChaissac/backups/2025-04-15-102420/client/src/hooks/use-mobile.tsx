import { useState, useEffect } from 'react';

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Fonction qui vérifie si l'écran est de taille mobile
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640); // 640px est le point de rupture sm: dans Tailwind
    };

    // Vérifier lors du montage du composant
    checkIfMobile();

    // Ajouter un écouteur pour les changements de taille de fenêtre
    window.addEventListener('resize', checkIfMobile);

    // Nettoyer l'écouteur lors du démontage du composant
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  return isMobile;
}