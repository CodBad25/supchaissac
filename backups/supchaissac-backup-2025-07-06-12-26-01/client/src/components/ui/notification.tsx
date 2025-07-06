import { useState, useEffect } from 'react';
import { X, Bell, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export interface NotificationProps {
  id: string;
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
}

const notificationVariants = cva(
  "fixed bottom-4 right-4 z-50 flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        success: "bg-green-50 text-green-800 border-green-200",
        error: "bg-red-50 text-red-800 border-red-200",
        warning: "bg-amber-50 text-amber-800 border-amber-200",
        info: "bg-blue-50 text-blue-800 border-blue-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function Notification({
  id,
  title,
  description,
  type = 'info',
  duration = 5000,
  onClose,
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div
      className={cn(
        notificationVariants({ variant: type as any }),
        "max-w-sm sm:max-w-md"
      )}
      role="alert"
      data-state="open"
    >
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      <div className="flex-1">
        <h3 className="font-medium">{title}</h3>
        {description && <p className="text-sm mt-1">{description}</p>}
      </div>
      <button
        className="flex-shrink-0 rounded-md p-1 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
        onClick={() => {
          setIsVisible(false);
          if (onClose) onClose();
        }}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Fermer</span>
      </button>
    </div>
  );
}
