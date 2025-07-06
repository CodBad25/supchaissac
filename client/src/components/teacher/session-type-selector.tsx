import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  UserRound, 
  BookOpen, 
  FileText, 
  Clock 
} from 'lucide-react';

interface SessionTypeSelectorProps {
  onSelect: (type: 'RCD' | 'DEVOIRS_FAITS' | 'HSE' | 'AUTRE') => void;
}

export function SessionTypeSelector({ onSelect }: SessionTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Sélectionner un type de séance</h2>
      <p className="text-sm text-muted-foreground">Choisissez le type de séance que vous souhaitez déclarer</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* RCD */}
        <Card 
          className="p-4 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 border-purple-100 dark:border-purple-800 transition-colors"
          onClick={() => onSelect('RCD')}
        >
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-full">
              <UserRound className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium">Remplacement de Courte Durée</h3>
              <p className="text-sm text-muted-foreground">Remplacer un enseignant absent</p>
            </div>
          </div>
        </Card>
        
        {/* Devoirs Faits */}
        <Card 
          className="p-4 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-100 dark:border-blue-800 transition-colors"
          onClick={() => onSelect('DEVOIRS_FAITS')}
        >
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full">
              <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium">Devoirs Faits</h3>
              <p className="text-sm text-muted-foreground">Accompagnement des élèves pour les devoirs</p>
            </div>
          </div>
        </Card>
        
        {/* HSE */}
        <Card 
          className="p-4 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 border-green-100 dark:border-green-800 transition-colors"
          onClick={() => onSelect('HSE')}
        >
          <div className="flex items-center gap-3">
            <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-full">
              <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-medium">HSE</h3>
              <p className="text-sm text-muted-foreground">Heures Supplémentaires Effectives</p>
            </div>
          </div>
        </Card>
        
        {/* Autre */}
        <Card 
          className="p-4 cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20 border-amber-100 dark:border-amber-800 transition-colors"
          onClick={() => onSelect('AUTRE')}
        >
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 dark:bg-amber-900/50 p-3 rounded-full">
              <FileText className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-medium">Autre activité</h3>
              <p className="text-sm text-muted-foreground">Réunions, projets, sorties, etc.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
