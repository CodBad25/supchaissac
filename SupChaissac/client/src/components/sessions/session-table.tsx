import React, { useState } from 'react';
import { StatusBadge, SessionTypeBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Session } from '@/hooks/use-session-management';

interface SessionTableProps {
  sessions: Session[];
  isLoading?: boolean;
  showActions?: boolean;
  onViewSession?: (session: Session) => void;
  onValidateSession?: (session: Session) => void;
  onRejectSession?: (session: Session) => void;
}

export function SessionTable({
  sessions,
  isLoading = false,
  showActions = false,
  onViewSession,
  onValidateSession,
  onRejectSession,
}: SessionTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Pagination
  const totalPages = Math.ceil(sessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSessions = sessions.slice(startIndex, endIndex);
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };
  
  // Format time
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    return `${hours}h${minutes}`;
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (sessions.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        Aucune séance trouvée.
      </div>
    );
  }
  
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-2 border-b">Date</th>
              <th className="p-2 border-b">Horaire</th>
              <th className="p-2 border-b">Enseignant</th>
              <th className="p-2 border-b">Type</th>
              <th className="p-2 border-b">Statut</th>
              {showActions && <th className="p-2 border-b text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {currentSessions.map((session) => (
              <tr key={session.id} className="hover:bg-gray-50">
                <td className="p-2 border-b">{formatDate(session.date)}</td>
                <td className="p-2 border-b">
                  {session.timeSlot}
                </td>
                <td className="p-2 border-b">
                  {session.teacherFirstName || ''} {session.teacherName}
                </td>
                <td className="p-2 border-b">
                  <SessionTypeBadge type={session.type} />
                </td>
                <td className="p-2 border-b">
                  <StatusBadge status={session.status} />
                </td>
                {showActions && (
                  <td className="p-2 border-b text-right">
                    <div className="flex justify-end space-x-2">
                      {onViewSession && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewSession(session)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </Button>
                      )}
                      {onValidateSession && session.status === 'SUBMITTED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onValidateSession(session)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 6L9 17l-5-5"></path>
                          </svg>
                        </Button>
                      )}
                      {onRejectSession && session.status === 'SUBMITTED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRejectSession(session)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-500">
            Affichage de {startIndex + 1} à {Math.min(endIndex, sessions.length)} sur {sessions.length} séances
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
