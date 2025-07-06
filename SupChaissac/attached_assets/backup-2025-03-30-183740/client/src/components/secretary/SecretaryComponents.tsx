// Composants de l'interface secrétaire
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function SecretaryView() {
  // Sessions fictives pour la démonstration
  const [sessions, setSessions] = useState([
    {
      id: 1,
      teacherName: 'Mme MARTIN Lucie',
      type: 'RCD',
      date: '2025-03-05',
      timeSlot: 'M3',
      status: 'PENDING_VALIDATION',
      className: '5eA',
      replacedTeacherName: 'M. DUBOIS Jean',
    },
    {
      id: 2,
      teacherName: 'M. BERNARD Thomas',
      type: 'DEVOIRS_FAITS',
      date: '2025-03-06',
      timeSlot: 'S2',
      status: 'VALIDATED',
      gradeLevel: '6e',
      studentCount: 15,
    },
    {
      id: 3,
      teacherName: 'Mme MARTIN Lucie',
      type: 'AUTRE',
      date: '2025-03-10',
      timeSlot: 'M3',
      status: 'PAID',
      description: 'Réunion de coordination pédagogique',
    }
  ]);
  
  // État pour la navigation entre les onglets
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const validateSession = (id: number) => {
    setSessions(prev => 
      prev.map(session => 
        session.id === id 
          ? {...session, status: 'VALIDATED'} 
          : session
      )
    );
  };
  
  const rejectSession = (id: number) => {
    setSessions(prev => 
      prev.map(session => 
        session.id === id 
          ? {...session, status: 'REJECTED'} 
          : session
      )
    );
  };
  
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
                        <div className="text-lg font-semibold">{sessions.filter(s => s.status === 'PENDING_VALIDATION').length}</div>
                        <div className="text-sm">Séances à valider</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-green-50">
                      <CardContent className="p-4">
                        <div className="text-lg font-semibold">{sessions.filter(s => s.status === 'VALIDATED').length}</div>
                        <div className="text-sm">Séances validées</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-red-50">
                      <CardContent className="p-4">
                        <div className="text-lg font-semibold">{sessions.filter(s => s.status === 'REJECTED').length}</div>
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Enseignant</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.slice(0, 5).map(session => (
                        <TableRow key={session.id}>
                          <TableCell>{session.teacherName}</TableCell>
                          <TableCell>{session.date}</TableCell>
                          <TableCell>
                            <Badge className={
                              session.type === 'RCD' ? 'bg-purple-100 text-purple-800' :
                              session.type === 'DEVOIRS_FAITS' ? 'bg-blue-100 text-blue-800' :
                              'bg-amber-100 text-amber-800'
                            }>
                              {session.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              session.status === 'VALIDATED' ? 'bg-green-100 text-green-800' :
                              session.status === 'PENDING_REVIEW' ? 'bg-amber-100 text-amber-800' :
                              session.status === 'PENDING_VALIDATION' ? 'bg-blue-100 text-blue-800' :
                              session.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              session.status === 'PAID' ? 'bg-purple-100 text-purple-800' : ''
                            }>
                              {session.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Enseignant</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Détails</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions
                        .filter(session => session.status === 'PENDING_VALIDATION')
                        .map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>{session.teacherName}</TableCell>
                          <TableCell>{session.date}</TableCell>
                          <TableCell>
                            <Badge className={
                              session.type === 'RCD' ? 'bg-purple-100 text-purple-800' :
                              session.type === 'DEVOIRS_FAITS' ? 'bg-blue-100 text-blue-800' :
                              'bg-amber-100 text-amber-800'
                            }>
                              {session.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {session.type === 'RCD' && (
                              <span>Classe {session.className}, {session.replacedTeacherName}</span>
                            )}
                            {session.type === 'DEVOIRS_FAITS' && (
                              <span>{session.gradeLevel} - {session.studentCount} élèves</span>
                            )}
                            {session.type === 'AUTRE' && (
                              <span>{session.description}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-800">
                              En attente
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                className="h-8 bg-green-600 hover:bg-green-700"
                                onClick={() => validateSession(session.id)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M5 12l5 5L20 7"></path>
                                </svg>
                              </Button>
                              <Button 
                                size="sm" 
                                className="h-8 bg-red-600 hover:bg-red-700"
                                onClick={() => rejectSession(session.id)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M18 6L6 18M6 6l12 12"></path>
                                </svg>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {sessions.filter(session => session.status === 'PENDING_VALIDATION').length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                            Aucune séance en attente de validation
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Historique des validations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Enseignant</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Détails</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions
                        .filter(session => session.status !== 'PENDING_VALIDATION')
                        .map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>{session.teacherName}</TableCell>
                          <TableCell>{session.date}</TableCell>
                          <TableCell>
                            <Badge className={
                              session.type === 'RCD' ? 'bg-purple-100 text-purple-800' :
                              session.type === 'DEVOIRS_FAITS' ? 'bg-blue-100 text-blue-800' :
                              'bg-amber-100 text-amber-800'
                            }>
                              {session.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {session.type === 'RCD' && (
                              <span>Classe {session.className}, {session.replacedTeacherName}</span>
                            )}
                            {session.type === 'DEVOIRS_FAITS' && (
                              <span>{session.gradeLevel} - {session.studentCount} élèves</span>
                            )}
                            {session.type === 'AUTRE' && (
                              <span>{session.description}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              session.status === 'VALIDATED' ? 'bg-green-100 text-green-800' :
                              session.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              session.status === 'PAID' ? 'bg-purple-100 text-purple-800' : ''
                            }>
                              {session.status === 'VALIDATED' ? 'Validée' :
                               session.status === 'REJECTED' ? 'Rejetée' :
                               session.status === 'PAID' ? 'Payée' : session.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {sessions.filter(session => session.status !== 'PENDING_VALIDATION').length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                            Aucun historique disponible
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
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
    </div>
  );
}