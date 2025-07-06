import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Trash2 } from "lucide-react";
import { formatDate, stringToDate } from "@/lib/dates";
import { formatTimeSlot } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";
import { StatusBadge, SessionTypeBadge } from "@/components/ui/status-badge";
import { SessionDetailModal } from "@/components/session-detail-modal";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function RecentSessions() {
  const { sessions, deleteSessionMutation } = useSession();
  const [detailSession, setDetailSession] = useState(null);
  const [deleteSession, setDeleteSession] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Sort sessions by date (newest first)
  const sortedSessions = [...sessions].sort((a, b) => {
    const dateA = new Date(a.date + "T" + (a.timeSlot.startsWith("S") ? "12" : "08") + ":00:00");
    const dateB = new Date(b.date + "T" + (b.timeSlot.startsWith("S") ? "12" : "08") + ":00:00");
    return dateB.getTime() - dateA.getTime();
  });
  
  // Take the 5 most recent sessions
  const recentSessions = sortedSessions.slice(0, 5);
  
  const handleViewDetails = (session: any) => {
    setDetailSession(session);
    setShowDetailModal(true);
  };
  
  const handleDeleteClick = (session: any) => {
    setDeleteSession(session);
    setShowDeleteDialog(true);
  };
  
  const handleConfirmDelete = () => {
    if (deleteSession) {
      deleteSessionMutation.mutate(deleteSession.id);
      setShowDeleteDialog(false);
      setDeleteSession(null);
    }
  };
  
  // Function to render details based on session type
  const renderSessionDetails = (session: any) => {
    if (session.type === 'RCD') {
      return `${session.replacedTeacherPrefix} ${session.replacedTeacherName} - ${session.className} - ${session.subject}`;
    } else if (session.type === 'DEVOIRS_FAITS') {
      return `${session.studentCount} élèves - ${session.gradeLevel}`;
    } else {
      return session.description || '';
    }
  };
  
  // Function to determine if delete button should be disabled
  const isDeleteDisabled = (status: string) => {
    return status !== 'PENDING_REVIEW';
  };
  
  return (
    <>
      <div className="px-4 py-5 sm:px-6 border-t border-gray-200 bg-gray-50">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Séances récentes</h3>
        <p className="mt-1 text-sm text-gray-500">Vos dernières séances</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créneau</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Détails</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {recentSessions.length > 0 ? (
              recentSessions.map((session) => (
                <tr key={session.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(stringToDate(session.date))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimeSlot(session.timeSlot)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <SessionTypeBadge type={session.type} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {renderSessionDetails(session)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={session.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleViewDetails(session)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                      title="Voir les détails"
                    >
                      <Eye size={16} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteClick(session)}
                      className={
                        isDeleteDisabled(session.status) 
                          ? "text-gray-400 cursor-not-allowed" 
                          : "text-red-600 hover:text-red-900"
                      }
                      disabled={isDeleteDisabled(session.status)}
                      title={
                        isDeleteDisabled(session.status) 
                          ? "Suppression impossible (statut non modifiable)" 
                          : "Supprimer"
                      }
                    >
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  Aucune séance récente
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Session detail modal */}
      <SessionDetailModal 
        session={detailSession} 
        isOpen={showDetailModal} 
        onClose={() => setShowDetailModal(false)} 
      />
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette séance ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
