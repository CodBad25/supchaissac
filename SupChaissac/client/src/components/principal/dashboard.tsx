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
import { Card, CardContent } from "@/components/ui/card";
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
import { Eye, Check, X, CheckCheck } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, stringToDate } from "@/lib/dates";
import { formatTimeSlot, getAvatarForUser } from "@/lib/utils";
import { SessionDetailModal } from "@/components/session-detail-modal";
import { StatusBadge, SessionTypeBadge } from "@/components/ui/status-badge";

export function PrincipalDashboard() {
  const { sessions, updateSessionMutation } = useSession();
  const { user } = useAuth();
  
  const [selectedSessions, setSelectedSessions] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState("PENDING_VALIDATION");
  const [monthFilter, setMonthFilter] = useState("all");
  const [detailSession, setDetailSession] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [currentAction, setCurrentAction] = useState<{
    type: "VALIDATE" | "REJECT";
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
  
  // Calculate statistics for the month
  const pendingCount = sessions.filter(s => s.status === "PENDING_VALIDATION").length;
  const validatedCount = sessions.filter(s => s.status === "VALIDATED").length;
  const paidCount = sessions.filter(s => s.status === "PAID").length;
  
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
  
  const handleValidate = (id: number) => {
    setCurrentAction({ type: "VALIDATE", id });
    setShowActionDialog(true);
  };
  
  const handleReject = (id: number) => {
    setCurrentAction({ type: "REJECT", id });
    setShowActionDialog(true);
  };
  
  const handleBulkValidate = () => {
    setCurrentAction({ type: "VALIDATE" });
    setShowActionDialog(true);
  };
  
  const handleConfirmAction = () => {
    if (!currentAction) return;
    
    const { type, id } = currentAction;
    
    if (id) {
      // Single session action
      if (type === "VALIDATE") {
        updateSessionMutation.mutate({
          id,
          data: { 
            status: "VALIDATED",
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
      }
    } else {
      // Bulk action for selected sessions
      if (type === "VALIDATE") {
        selectedSessions.forEach(sessionId => {
          updateSessionMutation.mutate({
            id: sessionId,
            data: { 
              status: "VALIDATED",
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
    
    if (type === "VALIDATE") {
      title = isBulk ? "Confirmer la validation" : "Valider cette séance";
      description = isBulk
        ? `Êtes-vous sûr de vouloir valider les ${selectedSessions.length} séances sélectionnées ?`
        : "Êtes-vous sûr de vouloir valider cette séance ?";
    } else if (type === "REJECT") {
      title = "Rejeter cette séance";
      description = "Êtes-vous sûr de vouloir rejeter cette séance ?";
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
    
    if (session.status === 'PENDING_VALIDATION') {
      actions.push(
        <Button 
          key="validate"
          variant="ghost" 
          size="sm" 
          onClick={() => handleValidate(session.id)}
          className="text-green-600 hover:text-green-900"
          title="Valider"
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
    }
    
    return actions;
  };
  
  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 bg-primary-50">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Validation des heures supplémentaires</h3>
        <p className="mt-1 text-sm text-gray-500">Approuver les déclarations des enseignants</p>
      </div>
      
      {/* Statistics */}
      <div className="px-4 py-5 sm:px-6">
        <h4 className="text-base font-medium text-gray-900 mb-4">Statistiques du mois</h4>
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {/* Sessions to validate */}
          <Card>
            <CardContent className="pt-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                À valider
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-pending-600">
                {pendingCount}
              </dd>
              <dd className="mt-2 text-sm text-gray-500">
                <span className="flex items-center">
                  <svg className="h-4 w-4 text-pending-500 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  En attente de validation
                </span>
              </dd>
            </CardContent>
          </Card>
          
          {/* Sessions validated */}
          <Card>
            <CardContent className="pt-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Validées
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-validated-600">
                {validatedCount}
              </dd>
              <dd className="mt-2 text-sm text-gray-500">
                <span className="flex items-center">
                  <svg className="h-4 w-4 text-validated-500 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Validées ce mois
                </span>
              </dd>
            </CardContent>
          </Card>
          
          {/* Sessions paid */}
          <Card>
            <CardContent className="pt-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Payées
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-paid-600">
                {paidCount}
              </dd>
              <dd className="mt-2 text-sm text-gray-500">
                <span className="flex items-center">
                  <svg className="h-4 w-4 text-paid-500 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Mises en paiement
                </span>
              </dd>
            </CardContent>
          </Card>
        </dl>
      </div>
      
      {/* Filters */}
      <div className="px-4 py-3 sm:px-6 border-t border-b border-gray-200 bg-gray-50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
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
          
          <div>
            <Button
              onClick={handleBulkValidate}
              disabled={selectedSessions.length === 0}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Valider sélection
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
                  id="principal-select-all" 
                  onCheckedChange={handleSelectAll}
                  checked={
                    selectedSessions.length > 0 && 
                    selectedSessions.length === sortedSessions.length
                  }
                  title="Tout sélectionner"
                />
              </TableHead>
              <TableHead>Enseignant</TableHead>
              <TableHead>Date & Créneau</TableHead>
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
                        id={`principal-session-${session.id}`}
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
