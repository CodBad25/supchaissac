import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { CalendarIcon, CheckCircle } from 'lucide-react';

interface SessionConfirmationProps {
  sessionData: any;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SessionConfirmation({ 
  sessionData, 
  onConfirm, 
  onCancel 
}: SessionConfirmationProps) {
  // Fonction pour formater les données selon le type de session
  const getFormattedDetails = () => {
    switch (sessionData.type) {
      case 'RCD':
        return (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Classe</span>
              <span className="font-medium">{sessionData.className}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Enseignant remplacé</span>
              <span className="font-medium">
                {sessionData.replacedTeacherPrefix} {sessionData.replacedTeacherLastName} {sessionData.replacedTeacherFirstName}
              </span>
            </div>
            {sessionData.comment && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Commentaire</span>
                <span className="font-medium">{sessionData.comment}</span>
              </div>
            )}
          </div>
        );
      
      case 'DEVOIRS_FAITS':
        return (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Nombre d'élèves</span>
              <span className="font-medium">{sessionData.studentCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Niveau</span>
              <span className="font-medium">{sessionData.gradeLevel}</span>
            </div>
          </div>
        );
      
      case 'HSE':
      case 'AUTRE':
        return (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Description</span>
              <span className="font-medium">{sessionData.description}</span>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  // Obtenir le titre selon le type de session
  const getSessionTypeTitle = () => {
    switch (sessionData.type) {
      case 'RCD':
        return 'Remplacement de Courte Durée';
      case 'DEVOIRS_FAITS':
        return 'Devoirs Faits';
      case 'HSE':
        return 'HSE';
      case 'AUTRE':
        return 'Autre activité';
      default:
        return 'Session';
    }
  };
  
  // Obtenir la couleur selon le type de session
  const getSessionTypeColor = () => {
    switch (sessionData.type) {
      case 'RCD':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'DEVOIRS_FAITS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'HSE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'AUTRE':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center mb-6">
        <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
        <h2 className="text-xl font-semibold text-center">Confirmation de la séance</h2>
        <p className="text-sm text-muted-foreground text-center">
          Veuillez vérifier les informations de la séance avant de valider
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex justify-center mb-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSessionTypeColor()}`}>
            {getSessionTypeTitle()}
          </span>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Date</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {format(new Date(sessionData.date), 'dd/MM/yyyy', { locale: fr })}
              </span>
              <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-sm">
                {sessionData.timeSlot}
              </span>
            </div>
          </div>
          
          {getFormattedDetails()}
        </div>
      </div>
      
      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        Vous allez ajouter cette nouvelle séance.
      </p>
      
      <div className="flex flex-col gap-2">
        <Button 
          onClick={onConfirm}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          Valider la séance
        </Button>
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="w-full"
        >
          Annuler
        </Button>
      </div>
    </div>
  );
}
