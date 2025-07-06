import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Eye, Check, X, Printer, BanknoteIcon } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, stringToDate } from "@/lib/dates";
import { formatTimeSlot, getAvatarForUser } from "@/lib/utils";
import { SessionDetailModal } from "@/components/session-detail-modal";
import { StatusBadge, SessionTypeBadge } from "@/components/ui/status-badge";
import { generateSessionsSummaryPDF } from "@/lib/pdf-generator";

export function SessionValidation() {
  const { sessions, updateSessionMutation } = useSession();
  const { user } = useAuth();
  
  const [selectedSessions, setSelectedSessions] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [detailSession, setDetailSession] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [currentAction, setCurrentAction] = useState<{
    type: "TRANSMIT" | "REJECT" | "MARK_PAID";
    id?: number;
  } | null>(null);
  
  // Filter sessions
  const filteredSessions = sessions.filter((session) => {
    // Filter by status
    if (statusFilter && session.status !== statusFilter) {
      return false;
    }
    
    // Filter by month
    if (monthFilter !== "all") {
      const sessionDate = new Date(session.date);
      const sessionMonth = sessionDate.getMonth() + 1; // JavaScript months are 0-indexed
      if (sessionMonth !== parseInt(monthFilter)) {
        return false;
      }
    }
    
    return true;
  });
  
  // Sort by date (newest first)
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSessions(sortedSessions.map(s => s.id));
    } else {
      setSelectedSessions([]);
    }
  };
  
  const handleSelectSession = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedSessions([...selectedSessions, id]);
    } else {
      setSelectedSessions(selectedSessions.filter(sessionId => sessionId !== id));
    }
  };
  
  const handleViewDetails = (session: any) => {
    setDetailSession(session);
    setShowDetailModal(true);
  };
  
  const handleApprove = (id: number) => {
    setCurrentAction({ type: "TRANSMIT", id });
    setShowActionDialog(true);
  };
  
  const handleReject = (id: number) => {
    setCurrentAction({ type: "REJECT", id });
    setShowActionDialog(true);
  };
  
  const handleMarkPaid = (id: number) => {
    setCurrentAction({ type: "MARK_PAID", id });
    setShowActionDialog(true);
  };
  
  const handleBulkTransmit = () => {
    setCurrentAction({ type: "TRANSMIT" });
    setShowActionDialog(true);
  };
  
  const handleConfirmAction = () => {
    if (!currentAction) return;
    
    const { type, id } = currentAction;
    
    if (id) {
      // Single session action
      if (type === "TRANSMIT") {
        updateSessionMutation.mutate({
          id,
          data: { 
            status: "PENDING_VALIDATION",
            updatedBy: user?.name
          }
        });
      } else if (type === "REJECT") {
        updateSessionMutation.mutate({
          id,
          data: { 
            status: "REJECTED",
            updatedBy: user?.name
          }
        });
      } else if (type === "MARK_PAID") {
        updateSessionMutation.mutate({
          id,
          data: { 
            status: "PAID",
            updatedBy: user?.name
          }
        });
      }
    } else {
      // Bulk action for selected sessions
      if (type === "TRANSMIT") {
        selectedSessions.forEach(sessionId => {
          updateSessionMutation.mutate({
            id: sessionId,
            data: { 
              status: "PENDING_VALIDATION",
              updatedBy: user?.name
            }
          });
        });
      }
    }
    
    setShowActionDialog(false);
    setCurrentAction(null);
  };
  
  // Get action dialog content based on current action
  const getDialogContent = () => {
    if (!currentAction) return null;
    
    const { type, id } = currentAction;
    const isBulk = !id;
    
    let title = "";
    let description = "";
    
    if (type === "TRANSMIT") {
      title = isBulk ? "Confirmer la transmission" : "Transmettre cette séance";
      description = isBulk
        ? `Êtes-vous sûr de vouloir transmettre les ${selectedSessions.length} séances sélectionnées au principal ?`
        : "Êtes-vous sûr de vouloir transmettre cette séance au principal ?";
    } else if (type === "REJECT") {
      title = "Rejeter cette séance";
      description = "Êtes-vous sûr de vouloir rejeter cette séance ? Elle ne sera pas transmise au principal.";
    } else if (type === "MARK_PAID") {
      title = "Marquer comme payée";
      description = "Êtes-vous sûr de vouloir marquer cette séance comme payée ?";
    }
    
    return (
      <>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmAction}>
            Confirmer
          </AlertDialogAction>
        </AlertDialogFooter>
      </>
    );
  };
  
  // Function to render session details based on type
  const renderSessionDetails = (session: any) => {
    if (session.type === 'RCD') {
      return (
        <>
          <div>{session.replacedTeacherPrefix} {session.replacedTeacherName}</div>
          <div>{session.className} - {session.subject}</div>
        </>
      );
    } else if (session.type === 'DEVOIRS_FAITS') {
      return (
        <>
          <div>{session.studentCount} élèves</div>
          <div>{session.gradeLevel}</div>
        </>
      );
    } else {
      return (
        <div>{session.description || ''}</div>
      );
    }
  };
  
  // Get available actions based on session status
  const getSessionActions = (session: any) => {
    const actions = [];
    
    // View details action always available
    actions.push(
      <Button 
        key="view"
        variant="ghost" 
        size="sm" 
        onClick={() => handleViewDetails(session)}
        className="text-primary-600 hover:text-primary-900"
        title="Voir les détails"
      >
        <Eye size={16} />
      </Button>
    );
    
    if (session.status === 'PENDING_REVIEW') {
      actions.push(
        <Button 
          key="approve"
          variant="ghost" 
          size="sm" 
          onClick={() => handleApprove(session.id)}
          className="text-green-600 hover:text-green-900"
          title="Transmettre"
        >
          <Check size={16} />
        </Button>
      );
      
      actions.push(
        <Button 
          key="reject"
          variant="ghost" 
          size="sm" 
          onClick={() => handleReject(session.id)}
          className="text-red-600 hover:text-red-900"
          title="Rejeter"
        >
          <X size={16} />
        </Button>
      );
    } else if (session.status === 'VALIDATED') {
      actions.push(
        <Button 
          key="paid"
          variant="ghost" 
          size="sm" 
          onClick={() => handleMarkPaid(session.id)}
          className="text-green-600 hover:text-green-900"
          title="Marquer comme payée"
        >
          <BanknoteIcon size={16} />
        </Button>
      );
    }
    
    return actions;
  };
  
  const handlePrintClick = () => {
    // Generate PDF with filtered sessions
    generateSessionsSummaryPDF(sortedSessions);
  };
  
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 bg-primary-50">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Validation des heures supplémentaires</h3>
        <p className="mt-1 text-sm text-gray-500">Gestion des déclarations des enseignants</p>
      </div>
      
      {/* Filters and actions */}
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div>
              <Select 
                value={statusFilter} 
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les statuts</SelectItem>
                  <SelectItem value="PENDING_REVIEW">En attente</SelectItem>
                  <SelectItem value="PENDING_VALIDATION">À valider</SelectItem>
                  <SelectItem value="VALIDATED">Validées</SelectItem>
                  <SelectItem value="PAID">Payées</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Select 
                value={monthFilter} 
                onValueChange={setMonthFilter}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tous les mois" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les mois</SelectItem>
                  <SelectItem value="1">Janvier</SelectItem>
                  <SelectItem value="2">Février</SelectItem>
                  <SelectItem value="3">Mars</SelectItem>
                  <SelectItem value="4">Avril</SelectItem>
                  <SelectItem value="5">Mai</SelectItem>
                  <SelectItem value="6">Juin</SelectItem>
                  <SelectItem value="7">Juillet</SelectItem>
                  <SelectItem value="8">Août</SelectItem>
                  <SelectItem value="9">Septembre</SelectItem>
                  <SelectItem value="10">Octobre</SelectItem>
                  <SelectItem value="11">Novembre</SelectItem>
                  <SelectItem value="12">Décembre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={handleBulkTransmit}
              disabled={selectedSessions.length === 0}
            >
              <Check className="h-4 w-4 mr-2" />
              Transmettre au principal
            </Button>
            
            <Button
              variant="outline"
              onClick={handlePrintClick}
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimer
            </Button>
          </div>
        </div>
      </div>
      
      {/* Sessions list */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox 
                  id="select-all" 
                  onCheckedChange={handleSelectAll}
                  checked={
                    selectedSessions.length > 0 && 
                    selectedSessions.length === sortedSessions.length
                  }
                  title="Tout sélectionner"
                />
              </TableHead>
              <TableHead>Enseignant</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Détails</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSessions.length > 0 ? (
              sortedSessions.map((session) => {
                const { initials, bgColor, textColor } = getAvatarForUser(session.teacherName, "TEACHER");
                
                return (
                  <TableRow key={session.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Checkbox 
                        id={`session-${session.id}`}
                        checked={selectedSessions.includes(session.id)}
                        onCheckedChange={(checked) => 
                          handleSelectSession(session.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full ${bgColor} flex items-center justify-center ${textColor}`}>
                          <span>{initials}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{session.teacherName}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">{formatDate(stringToDate(session.date))}</div>
                      <div className="text-sm text-gray-500">{formatTimeSlot(session.timeSlot)}</div>
                    </TableCell>
                    <TableCell>
                      <SessionTypeBadge type={session.type} />
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {renderSessionDetails(session)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={session.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {getSessionActions(session)}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="text-gray-500">Aucune séance trouvée</div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Session detail modal */}
      <SessionDetailModal 
        session={detailSession} 
        isOpen={showDetailModal} 
        onClose={() => setShowDetailModal(false)} 
      />
      
      {/* Action confirmation dialog */}
      <AlertDialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <AlertDialogContent>
          {getDialogContent()}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
