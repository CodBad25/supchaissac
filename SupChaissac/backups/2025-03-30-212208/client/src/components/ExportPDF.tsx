import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SignaturePanel } from './SignaturePanel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
};

type ExportPDFProps = {
  sessions: Session[];
  teacherName?: string;
};

export function ExportPDF({ sessions, teacherName = "Enseignant Test" }: ExportPDFProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [signature, setSignature] = useState<string | undefined>();
  
  const handleSignatureChange = (newSignature: string) => {
    setSignature(newSignature);
  };
  
  const generatePDF = () => {
    // Dans une implémentation réelle, ici nous utiliserions jsPDF pour générer le PDF
    console.log('Générer PDF pour:', {
      sessions,
      teacherName,
      signature
    });
    
    // Fermer la fenêtre de dialogue
    setIsDialogOpen(false);
    
    // Afficher un message de succès
    alert('PDF généré avec succès ! (simulation)');
  };

  return (
    <>
      <Button 
        onClick={() => setIsDialogOpen(true)}
        className="w-full flex items-center justify-center gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Exporter en PDF
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Récapitulatif</DialogTitle>
            <DialogDescription>
              Vérifiez les informations avant de générer le PDF
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            <div className="border rounded-md p-4 bg-white">
              <h3 className="font-medium mb-3">Séances à exporter</h3>
              {sessions.length > 0 ? (
                <div className="space-y-2">
                  {sessions.map(session => (
                    <div key={session.id} className="border-b pb-2">
                      <div className="font-medium">
                        Séance {session.id} - {new Date(session.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                      </div>
                      <div className="text-sm text-gray-600">
                        Créneaux : {session.timeSlot}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">Aucune séance à exporter</p>
              )}
            </div>
            
            <SignaturePanel 
              onSave={handleSignatureChange} 
              initialSignature={signature}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Retour
            </Button>
            <Button 
              onClick={generatePDF}
              disabled={!signature || sessions.length === 0}
            >
              Générer le PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}