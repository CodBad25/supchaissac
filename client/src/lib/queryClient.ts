import { QueryClient } from "@tanstack/react-query";

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Helper function to make API requests
export async function apiRequest(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  data?: any
) {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Important for auth cookies
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  return fetch(url, options);
}

// Helper function for query functions
export function getQueryFn(options?: {
  on401?: "throw" | "returnNull";
}) {
  const { on401 = "throw" } = options || {};

  return async ({ queryKey }: { queryKey: [string] }) => {
    const res = await apiRequest("GET", queryKey[0]);
    
    if (res.status === 401) {
      if (on401 === "returnNull") return null;
      throw new Error("Non autorisé");
    }
    
    if (!res.ok) {
      throw new Error(`Erreur lors de la requête: ${res.status}`);
    }
    
    return res.json();
  };
}