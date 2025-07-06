// Composants de l'interface secrétaire
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SessionTable } from "@/components/sessions/session-table";
import { SessionDetailModal } from "@/components/sessions/session-detail-modal";
import { useSessionManagement, Session } from "@/hooks/use-session-management";
import { useAuth } from "@/hooks/use-auth";

export function SecretaryView() {
  // État pour la navigation entre les onglets
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // État pour la modale de détail de session
  const [isSessionDetailModalOpen, setIsSessionDetailModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  
  // Utiliser le hook personnalisé pour la gestion des sessions
  const { 
    sessions, 
    isLoading, 
    validateSession, 
    rejectSession,
    setSelectedSession: setSessionInHook
  } = useSessionManagement();
  
  // Récupérer l'utilisateur connecté
  const { user } = useAuth();
  
  // Fonction pour ouvrir la modale de détail de session
  const handleViewSession = (session: Session) => {
    setSelectedSession(session);
    setSessionInHook(session);
    setIsSessionDetailModalOpen(true);
  };
  
  // Fonction pour valider une session
  const handleValidateSession = (id: number, type?: string, comment?: string) => {
    validateSession({ id, type, comment });
  };
  
  // Fonction pour rejeter une session
  const handleRejectSession = (id: number, comment?: string) => {
    rejectSession({ id, comment });
  };
  
  // Filtrer les sessions en fonction de leur statut
  const pendingSessions = sessions.filter((session: Session) => 
    session.status === 'SUBMITTED' || session.status === 'INCOMPLETE'
  );
  
  const validatedSessions = sessions.filter((session: Session) => 
    session.status === 'VALIDATED' || session.status === 'READY_FOR_PAYMENT' || session.status === 'PAID'
  );
  
  const rejectedSessions = sessions.filter((session: Session) => 
    session.status === 'REJECTED'
  );
  
  return (
    <div className="space-y-6">
      {/* Navigation principale */}
      <div className="bg-white p-4 rounded-lg shadow">
        <Tabs 
          defaultValue={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="flex justify-between w-full">
            <TabsTrigger value="dashboard" className="flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              Tableau de bord
            </TabsTrigger>
            <TabsTrigger value="validate" className="flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4"/>
                <path d="M12 2c-.8 0-1.6.2-2.3.6a10 10 0 0 0-6.1 6.1 10 10 0 0 0 0 6.6 10 10 0 0 0 6.1 6.1 10 10 0 0 0 6.6 0 10 10 0 0 0 6.1-6.1 10 10 0 0 0 0-6.6 10 10 0 0 0-6.1-6.1A9.5 9.5 0 0 0 12 2z"/>
              </svg>
              Validation des heures
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8v4l3 3m-3-10a9 9 0 1 0 9 9m0-14v5h-5"/>
              </svg>
              Historique
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tableau de bord</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-blue-50">
                      <CardContent className="p-4">
                        <div className="text-lg font-semibold">{pendingSessions.length}</div>
                        <div className="text-sm">Séances à valider</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-green-50">
                      <CardContent className="p-4">
                        <div className="text-lg font-semibold">{validatedSessions.length}</div>
                        <div className="text-sm">Séances validées</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-red-50">
                      <CardContent className="p-4">
                        <div className="text-lg font-semibold">{rejectedSessions.length}</div>
                        <div className="text-sm">Séances rejetées</div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Séances récentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <SessionTable 
                    sessions={sessions.slice(0, 5)}
                    isLoading={isLoading}
                    showActions={true}
                    onViewSession={handleViewSession}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="validate">
            <Card>
              <CardHeader>
                <CardTitle>Validation des heures</CardTitle>
              </CardHeader>
              <CardContent>
                <SessionTable 
                  sessions={pendingSessions}
                  isLoading={isLoading}
                  showActions={true}
                  onViewSession={handleViewSession}
                  onValidateSession={(session: Session) => handleViewSession(session)}
                  onRejectSession={(session: Session) => handleViewSession(session)}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Historique des validations</CardTitle>
              </CardHeader>
              <CardContent>
                <SessionTable 
                  sessions={[...validatedSessions, ...rejectedSessions]}
                  isLoading={isLoading}
                  showActions={true}
                  onViewSession={handleViewSession}
                />
                
                <div className="mt-6 flex justify-end">
                  <Button variant="outline">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Exporter en CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Modale de détail de session */}
      <SessionDetailModal 
        session={selectedSession}
        isOpen={isSessionDetailModalOpen}
        onClose={() => setIsSessionDetailModalOpen(false)}
        onValidate={handleValidateSession}
        onReject={handleRejectSession}
      />
    </div>
  );
}
