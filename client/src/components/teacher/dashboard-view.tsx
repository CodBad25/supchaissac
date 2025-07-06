import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useAuth } from '@/hooks/use-auth';

interface Session {
  id: number;
  date: string;
  timeSlot: string;
  type: 'RCD' | 'DEVOIRS_FAITS' | 'HSE' | 'AUTRE';
  status: string;
  // Autres propriétés
}

interface DashboardViewProps {
  sessions: Session[];
  onSessionClick: (session: Session) => void;
  onViewAllSessions: () => void;
}

export function DashboardView({ 
  sessions, 
  onSessionClick,
  onViewAllSessions
}: DashboardViewProps) {
  const { user } = useAuth();
  
  // Calculer les statistiques
  const rcdSessions = sessions.filter(s => s.type === 'RCD');
  const devoirsFaitsSessions = sessions.filter(s => s.type === 'DEVOIRS_FAITS');
  const otherSessions = sessions.filter(s => s.type === 'AUTRE' || s.type === 'HSE');
  
  // Trier les sessions par date (les plus récentes d'abord)
  const recentSessions = [...sessions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 5);
  
  // Calculer le pourcentage de progression pour le pacte
  const pactePercentage = user?.pacteHoursTarget 
    ? Math.min(100, Math.round(((user.pacteHoursCompleted || 0) / user.pacteHoursTarget) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        Synthèse de mes heures supplémentaires
      </h2>
      
      {/* Cartes de synthèse */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* RCD */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-purple-800 dark:text-purple-300">RCD</h3>
              <p className="text-sm text-purple-600 dark:text-purple-400">
                Dernière session: {rcdSessions.length > 0 
                  ? format(new Date(rcdSessions[0].date), 'dd/MM/yyyy')
                  : 'Aucune'}
              </p>
            </div>
            <div className="text-2xl font-bold text-purple-800 dark:text-purple-300">
              {rcdSessions.length} h
            </div>
          </div>
        </div>
        
        {/* Devoirs Faits */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300">Devoirs Faits</h3>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Dernière session: {devoirsFaitsSessions.length > 0 
                  ? format(new Date(devoirsFaitsSessions[0].date), 'dd/MM/yyyy')
                  : 'Aucune'}
              </p>
            </div>
            <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">
              {devoirsFaitsSessions.length} h
            </div>
          </div>
        </div>
        
        {/* Autres */}
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-100 dark:border-amber-800">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-amber-800 dark:text-amber-300">Autres</h3>
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Dernière session: {otherSessions.length > 0 
                  ? format(new Date(otherSessions[0].date), 'dd/MM/yyyy')
                  : 'Aucune'}
              </p>
            </div>
            <div className="text-2xl font-bold text-amber-800 dark:text-amber-300">
              {otherSessions.length} h
            </div>
          </div>
        </div>
      </div>
      
      {/* Total des heures */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-blue-800 dark:text-blue-300">Total des heures</h3>
            <p className="text-sm text-blue-600 dark:text-blue-400">Toutes activités confondues</p>
          </div>
          <div className="text-3xl font-bold text-blue-800 dark:text-blue-300">
            {sessions.length} h
          </div>
        </div>
      </div>
      
      {/* Suivi du pacte */}
      {user?.inPacte && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium mb-2">Suivi des heures du pacte</h3>
          <div className="flex justify-between text-sm mb-1">
            <span>Progression</span>
            <span className="font-medium">
              {user.pacteHoursCompleted || 0} / {user.pacteHoursTarget || '?'} heures
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
            <div 
              className="bg-green-500 h-2.5 rounded-full"
              style={{ width: `${pactePercentage}%` }}
            ></div>
          </div>
          <div className="text-right text-sm text-gray-500 dark:text-gray-400">
            {pactePercentage}%
          </div>
        </div>
      )}
      
      {/* Séances récentes */}
      <div>
        <h3 className="text-lg font-medium mb-4">Séances récentes</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Statut</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {recentSessions.length > 0 ? (
                recentSessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {format(new Date(session.date), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${session.type === 'RCD' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 
                          session.type === 'DEVOIRS_FAITS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 
                          'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'}`}>
                        {session.type === 'RCD' ? 'RCD' : 
                         session.type === 'DEVOIRS_FAITS' ? 'Devoirs Faits' : 
                         session.type === 'HSE' ? 'HSE' : 'Autre'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={session.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSessionClick(session)}
                      >
                        Voir
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    Aucune séance récente
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {sessions.length > 5 && (
          <div className="mt-4 text-center">
            <Button variant="outline" onClick={onViewAllSessions}>
              Voir toutes les séances
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
