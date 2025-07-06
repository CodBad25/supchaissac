import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Notification, NotificationProps } from '@/components/ui/notification';
import { v4 as uuidv4 } from 'uuid';

interface NotificationContextType {
  showNotification: (props: Omit<NotificationProps, 'id'>) => string;
  dismissNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  const showNotification = useCallback((props: Omit<NotificationProps, 'id'>) => {
    const id = uuidv4();
    const notification = { ...props, id };
    
    setNotifications(prev => [...prev, notification]);
    return id;
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, dismissNotification }}>
      {children}
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          {...notification}
          onClose={() => dismissNotification(notification.id)}
        />
      ))}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  
  return context;
}
