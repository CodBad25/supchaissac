import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge, SessionTypeBadge } from "@/components/ui/status-badge";
import { Session } from "@shared/schema";
import { formatDate, stringToDate } from "@/lib/dates";
import { formatTimeSlot } from "@/lib/utils";

interface SessionDetailModalProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SessionDetailModal({ session, isOpen, onClose }: SessionDetailModalProps) {
  if (!session) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Détails de la séance</DialogTitle>
          <DialogDescription>
            Informations complètes sur la séance
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          <div className="flex justify-between">
            <div className="text-sm text-gray-500">Date:</div>
            <div className="text-sm font-medium text-gray-900">
              {formatDate(stringToDate(session.date))}
            </div>
          </div>
          
          <div className="flex justify-between">
            <div className="text-sm text-gray-500">Créneau:</div>
            <div className="text-sm font-medium text-gray-900">
              {formatTimeSlot(session.timeSlot)}
            </div>
          </div>
          
          <div className="flex justify-between">
            <div className="text-sm text-gray-500">Type:</div>
            <div className="text-sm font-medium">
              <SessionTypeBadge type={session.type} />
            </div>
          </div>
          
          {session.type === 'RCD' && (
            <>
              <div className="flex justify-between">
                <div className="text-sm text-gray-500">Professeur remplacé:</div>
                <div className="text-sm font-medium text-gray-900">
                  {session.replacedTeacherPrefix} {session.replacedTeacherName}
                </div>
              </div>
              
              <div className="flex justify-between">
                <div className="text-sm text-gray-500">Classe:</div>
                <div className="text-sm font-medium text-gray-900">
                  {session.className}
                </div>
              </div>
              
              <div className="flex justify-between">
                <div className="text-sm text-gray-500">Matière:</div>
                <div className="text-sm font-medium text-gray-900">
                  {session.subject}
                </div>
              </div>
            </>
          )}
          
          {session.type === 'DEVOIRS_FAITS' && (
            <>
              <div className="flex justify-between">
                <div className="text-sm text-gray-500">Nombre d'élèves:</div>
                <div className="text-sm font-medium text-gray-900">
                  {session.studentCount}
                </div>
              </div>
              
              <div className="flex justify-between">
                <div className="text-sm text-gray-500">Niveau:</div>
                <div className="text-sm font-medium text-gray-900">
                  {session.gradeLevel}
                </div>
              </div>
            </>
          )}
          
          {session.type === 'AUTRE' && (
            <div className="flex justify-between">
              <div className="text-sm text-gray-500">Description:</div>
              <div className="text-sm font-medium text-gray-900">
                {session.description}
              </div>
            </div>
          )}
          
          <div className="flex justify-between">
            <div className="text-sm text-gray-500">Statut:</div>
            <div className="text-sm font-medium">
              <StatusBadge status={session.status} />
            </div>
          </div>
          
          <div className="flex justify-between">
            <div className="text-sm text-gray-500">Enseignant:</div>
            <div className="text-sm font-medium text-gray-900">
              {session.teacherName}
            </div>
          </div>
          
          {session.updatedAt && (
            <div className="flex justify-between">
              <div className="text-sm text-gray-500">Dernière mise à jour:</div>
              <div className="text-sm font-medium text-gray-900">
                {new Date(session.updatedAt).toLocaleDateString('fr-FR')} par {session.updatedBy}
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
