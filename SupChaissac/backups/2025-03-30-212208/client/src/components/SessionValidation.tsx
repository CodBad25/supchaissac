import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Type simplifié d'une séance pour la démonstration
type Session = {
  id: number;
  date: string;
  timeSlot: string;
  type: string;
  status: string;
  className?: string;
  replacedTeacherName?: string;
  gradeLevel?: string;
  studentCount?: number;
  teacherName: string;
};

export function SessionValidation() {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Sessions fictives pour la démonstration
  const pendingSessions: Session[] = [
    {
      id: 1,
      date: '2025-03-15',
      timeSlot: 'M3',
      type: 'RCD',
      status: 'PENDING_VALIDATION',
      className: '6A',
      replacedTeacherName: 'Dubois',
      teacherName: 'Martin Jean'
    },
    {
      id: 2,
      date: '2025-03-14',
      timeSlot: 'S2',
      type: 'DEVOIRS_FAITS',
      status: 'PENDING_VALIDATION',
      gradeLevel: '5e',
      studentCount: 12,
      teacherName: 'Petit Marie'
    }
  ];
  
  const handleViewSession = (session: Session) => {
    setSelectedSession(session);
    setIsDetailModalOpen(true);
  };
  
  const validateSession = () => {
    if (selectedSession) {
      // Dans une implémentation réelle, on enverrait une requête à l'API
      console.log(`Séance ${selectedSession.id} validée`);
      setIsDetailModalOpen(false);
    }
  };
  
  const rejectSession = () => {
    if (selectedSession) {
      // Dans une implémentation réelle, on enverrait une requête à l'API
      console.log(`Séance ${selectedSession.id} refusée`);
      setIsDetailModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Séances en attente de validation</h3>
        
        {pendingSessions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Enseignant</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Détails</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingSessions.map(session => (
                <TableRow key={session.id}>
                  <TableCell>
                    {new Date(session.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    <div className="text-xs text-gray-500">{session.timeSlot}</div>
                  </TableCell>
                  <TableCell>{session.teacherName}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      session.type === 'RCD' ? 'bg-purple-100 text-purple-800' :
                      session.type === 'DEVOIRS_FAITS' ? 'bg-blue-100 text-blue-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {session.type === 'RCD' ? 'RCD' : 
                       session.type === 'DEVOIRS_FAITS' ? 'Devoirs Faits' : 'Autre'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {session.type === 'RCD' 
                      ? `${session.className} - M./Mme ${session.replacedTeacherName}` 
                      : session.type === 'DEVOIRS_FAITS' 
                        ? `${session.gradeLevel} - ${session.studentCount} élèves` 
                        : 'Autre activité'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewSession(session)}
                    >
                      Détails
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Aucune séance en attente de validation
          </div>
        )}
      </div>
      
      {/* Modal de détails de séance */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedSession && (
            <>
              <DialogHeader>
                <DialogTitle>Détails de la séance</DialogTitle>
                <DialogDescription>
                  {new Date(selectedSession.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}, {selectedSession.timeSlot}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Enseignant</Label>
                    <div className="font-medium">{selectedSession.teacherName}</div>
                  </div>
                  <div>
                    <Label>Type de séance</Label>
                    <div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        selectedSession.type === 'RCD' ? 'bg-purple-100 text-purple-800' :
                        selectedSession.type === 'DEVOIRS_FAITS' ? 'bg-blue-100 text-blue-800' : 
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedSession.type === 'RCD' ? 'RCD' : 
                         selectedSession.type === 'DEVOIRS_FAITS' ? 'Devoirs Faits' : 'Autre'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {selectedSession.type === 'RCD' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Professeur remplacé</Label>
                      <div className="font-medium">{selectedSession.replacedTeacherName}</div>
                    </div>
                    <div>
                      <Label>Classe</Label>
                      <div className="font-medium">{selectedSession.className}</div>
                    </div>
                  </div>
                )}
                
                {selectedSession.type === 'DEVOIRS_FAITS' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Niveau</Label>
                      <div className="font-medium">{selectedSession.gradeLevel}</div>
                    </div>
                    <div>
                      <Label>Nombre d'élèves</Label>
                      <div className="font-medium">{selectedSession.studentCount}</div>
                    </div>
                  </div>
                )}
                
                <div className="mt-4">
                  <Label>Commentaire (optionnel)</Label>
                  <Textarea placeholder="Ajouter un commentaire pour l'enseignant..." className="mt-2" />
                </div>
              </div>
              
              <DialogFooter className="gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="flex-1"
                >
                  Fermer
                </Button>
                <Button 
                  variant="destructive"
                  onClick={rejectSession}
                  className="flex-1"
                >
                  Refuser
                </Button>
                <Button 
                  onClick={validateSession}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Valider
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}