import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CheckCheck, X } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  sessionId: number | null;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  if (diffH < 24) return `Il y a ${diffH}h`;
  if (diffD < 7) return `Il y a ${diffD}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const typeIcons: Record<string, string> = {
  session_validated: '✅',
  session_rejected: '❌',
  session_paid: '💰',
  new_session_to_review: '📋',
  session_ready_for_payment: '💳',
  info_requested: '📎',
};

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications/unread-count`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch {
      // Silencieux en cas d'erreur réseau
    }
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/notifications?limit=20`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch {
      // Silencieux
    } finally {
      setLoading(false);
    }
  };

  // Polling toutes les 60 secondes
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fermer le panneau au clic extérieur
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
        method: 'PATCH',
        credentials: 'include',
      });
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // Silencieux
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'PATCH',
        credentials: 'include',
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Silencieux
    }
  };

  const handleNotificationClick = (notif: Notification) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }
    setIsOpen(false);
    // Navigation vers le dashboard approprié si sessionId
    // (l'utilisateur est déjà sur son dashboard, pas besoin de naviguer)
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bouton cloche */}
      <button
        onClick={handleToggle}
        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors relative"
        title="Notifications"
      >
        <Bell className="w-4 h-4 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panneau de notifications */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[480px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1"
                  title="Tout marquer comme lu"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Tout lu
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Liste */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                Chargement...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">
                Aucune notification
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors flex gap-3 ${
                    !notif.isRead ? 'bg-yellow-50/50' : ''
                  }`}
                >
                  {/* Icône */}
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {typeIcons[notif.type] || '🔔'}
                  </span>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!notif.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {timeAgo(notif.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
