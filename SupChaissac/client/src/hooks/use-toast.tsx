import React, { useState, createContext, useContext } from 'react';

// Type pour un toast
export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

// Type pour le contexte de toast
interface ToastContextType {
  toasts: Toast[];
  toast: (toast: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

// Créer le contexte de toast
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Hook personnalisé pour utiliser le contexte de toast
export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast doit être utilisé à l\'intérieur d\'un ToastProvider');
  }
  return context;
}

// Provider pour le contexte de toast
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Fonction pour ajouter un toast
  const toast = ({ title, description, variant = 'default', duration = 5000 }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      id,
      title,
      description,
      variant,
      duration
    };
    
    setToasts(prev => [...prev, newToast]);
    
    // Supprimer automatiquement le toast après la durée spécifiée
    setTimeout(() => {
      dismiss(id);
    }, duration);
    
    return id;
  };
  
  // Fonction pour supprimer un toast
  const dismiss = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  // Fonction pour supprimer tous les toasts
  const dismissAll = () => {
    setToasts([]);
  };
  
  const value = {
    toasts,
    toast,
    dismiss,
    dismissAll
  };
  
  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Rendu des toasts */}
      <div className="fixed bottom-0 right-0 p-4 space-y-2 z-50">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`p-4 rounded-md shadow-md transition-all transform translate-y-0 opacity-100 ${
              toast.variant === 'destructive'
                ? 'bg-red-100 border border-red-200 text-red-800'
                : toast.variant === 'success'
                ? 'bg-green-100 border border-green-200 text-green-800'
                : 'bg-white border border-gray-200 text-gray-800'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{toast.title}</h3>
                {toast.description && <p className="text-sm mt-1">{toast.description}</p>}
              </div>
              <button
                onClick={() => dismiss(toast.id)}
                className="ml-4 text-gray-400 hover:text-gray-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Hook pour simuler les toasts dans les tests
export function useToastMock() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  const toast = ({ title, description, variant = 'default', duration = 5000 }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    console.log(`Toast: ${title}${description ? ` - ${description}` : ''} (${variant})`);
    return id;
  };
  
  const dismiss = (id: string) => {
    console.log(`Toast dismissed: ${id}`);
  };
  
  const dismissAll = () => {
    console.log('All toasts dismissed');
  };
  
  return {
    toasts,
    toast,
    dismiss,
    dismissAll
  };
}
