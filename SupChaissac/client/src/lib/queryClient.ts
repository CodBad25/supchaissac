import { QueryClient } from '@tanstack/react-query';

// Créer une instance de QueryClient
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Fonction pour effectuer des requêtes API
export async function apiRequest(
  method: string,
  url: string,
  data?: any,
  options?: RequestInit
) {
  // Dans une vraie implémentation, cette fonction ferait des appels à une API réelle
  // Pour la démo, on simule des réponses
  
  console.log(`API Request: ${method} ${url}`, data);
  
  // Simuler un délai
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Simuler une réponse
  const response = {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({ success: true, data }),
  };
  
  return response;
}
