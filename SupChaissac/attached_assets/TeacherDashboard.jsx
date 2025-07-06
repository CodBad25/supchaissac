
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from '../../contexts/SessionContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import Calendar from '../Calendar';
import History from '../History';
import { PieChart, Clock, History as HistoryIcon } from 'lucide-react';

function TeacherDashboard() {
  const { selectedSessions } = useSession();
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [teacherSetup, setTeacherSetup] = useState(null);

  useEffect(() => {
    const setup = JSON.parse(localStorage.getItem('teacherSetups') || '{}')[user.id];
    setTeacherSetup(setup);
  }, [user.id]);

  const stats = {
    rcdHours: selectedSessions.filter(s => s.type === 'RCD').length,
    devoirsFaitsHours: selectedSessions.filter(s => s.type === 'DEVOIRS FAITS').length,
    otherHours: selectedSessions.filter(s => s.type === 'AUTRE').length,
    pendingHours: selectedSessions.filter(s => s.status === 'PENDING_REVIEW').length,
    validatedHours: selectedSessions.filter(s => s.status === 'VALIDATED').length,
    paidHours: selectedSessions.filter(s => s.status === 'PAID').length,
    // Le total est maintenant la somme des heures RCD et Devoirs Faits uniquement
    totalHours: selectedSessions.filter(s => s.type === 'RCD' || s.type === 'DEVOIRS FAITS').length
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex space-x-4 mb-6">
        <Button
          variant={currentView === 'dashboard' ? 'default' : 'outline'}
          onClick={() => setCurrentView('dashboard')}
          className="flex items-center gap-2"
        >
          <PieChart className="w-4 h-4" />
          Tableau de bord
        </Button>
        <Button
          variant={currentView === 'declare' ? 'default' : 'outline'}
          onClick={() => setCurrentView('declare')}
          className="flex items-center gap-2"
        >
          <Clock className="w-4 h-4" />
          Déclarer des heures
        </Button>
        <Button
          variant={currentView === 'history' ? 'default' : 'outline'}
          onClick={() => setCurrentView('history')}
          className="flex items-center gap-2"
        >
          <HistoryIcon className="w-4 h-4" />
          Historique
        </Button>
      </div>

      {currentView === 'dashboard' && (
        <div className="space-y-6">
          {teacherSetup?.inPacte ? (
            // Vue pour les enseignants avec pacte
            <div className="space-y-6">
              {/* Informations du contrat */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Contrat en cours</h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Contrat N° {teacherSetup.contracts?.[teacherSetup.contracts.length - 1]?.number}
                  </p>
                  <p className="text-sm text-gray-600">
                    Date de début : {new Date(teacherSetup.contracts?.[teacherSetup.contracts.length - 1]?.startDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Progression du pacte */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Progression du Pacte</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <span>Total des heures</span>
                    <span className="font-bold">{stats.totalHours}/60h</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((stats.totalHours / 60) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="space-y-4 mt-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-purple-700">RCD</span>
                        <span className="text-purple-700 font-medium">{stats.rcdHours}/30h</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((stats.rcdHours / 30) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-blue-700">Devoirs Faits</span>
                        <span className="text-blue-700 font-medium">{stats.devoirsFaitsHours}/20h</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((stats.devoirsFaitsHours / 20) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statuts des heures */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Statut des heures</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">{stats.pendingHours}</div>
                    <div className="text-sm text-gray-500">Nouvelles</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {selectedSessions.filter(s => s.status === 'PENDING_VALIDATION').length}
                    </div>
                    <div className="text-sm text-gray-500">En attente</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.validatedHours}</div>
                    <div className="text-sm text-gray-500">Validées</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.paidHours}</div>
                    <div className="text-sm text-gray-500">Payées</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Vue pour les enseignants sans pacte
            <div className="space-y-6">
              {/* Statistiques simples */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold">Heures effectuées</h3>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                    Hors Pacte
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">{stats.rcdHours}</div>
                    <div className="text-sm text-gray-600 mt-2">Remplacements</div>
                  </div>
                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{stats.devoirsFaitsHours}</div>
                    <div className="text-sm text-gray-600 mt-2">Devoirs Faits</div>
                  </div>
                  <div className="text-center p-6 bg-yellow-50 rounded-lg">
                    <div className="text-3xl font-bold text-yellow-600">{stats.otherHours}</div>
                    <div className="text-sm text-gray-600 mt-2">Autres</div>
                  </div>
                </div>
              </div>

              {/* Statuts des heures */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Statut des heures</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">{stats.pendingHours}</div>
                    <div className="text-sm text-gray-500">Nouvelles</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {selectedSessions.filter(s => s.status === 'PENDING_VALIDATION').length}
                    </div>
                    <div className="text-sm text-gray-500">En attente</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.validatedHours}</div>
                    <div className="text-sm text-gray-500">Validées</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.paidHours}</div>
                    <div className="text-sm text-gray-500">Payées</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {currentView === 'declare' && <Calendar onBack={() => setCurrentView('dashboard')} />}
      
      {currentView === 'history' && <History />}
    </div>
  );
}

export default TeacherDashboard;
