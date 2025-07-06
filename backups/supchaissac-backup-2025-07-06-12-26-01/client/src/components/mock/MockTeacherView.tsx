import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Types pour les données simulées
interface Session {
  id: number;
  date: string;
  timeSlot: string;
  type: 'RCD' | 'DEVOIRS_FAITS' | 'HSE' | 'AUTRE';
  status: 'PENDING' | 'VALIDATED' | 'REJECTED' | 'PAID';
  description?: string;
  className?: string;
  subject?: string;
  studentCount?: number;
  comment?: string;
}

// Données simulées
const MOCK_SESSIONS: Session[] = [
  {
    id: 1,
    date: '2023-11-15',
    timeSlot: '08:00-09:00',
    type: 'RCD',
    status: 'VALIDATED',
    className: '3ème B',
    subject: 'Mathématiques'
  },
  {
    id: 2,
    date: '2023-11-16',
    timeSlot: '10:00-11:00',
    type: 'DEVOIRS_FAITS',
    status: 'PENDING',
    studentCount: 12
  },
  {
    id: 3,
    date: '2023-11-17',
    timeSlot: '14:00-15:00',
    type: 'AUTRE',
    status: 'REJECTED',
    description: 'Réunion pédagogique',
    comment: 'Hors cadre des heures supplémentaires'
  },
  {
    id: 4,
    date: '2023-11-20',
    timeSlot: '16:00-17:00',
    type: 'HSE',
    status: 'PAID',
    description: 'Soutien scolaire'
  }
];

// Composant principal pour la vue enseignant
export function MockTeacherView({ userName }: { userName: string }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sessions] = useState<Session[]>(MOCK_SESSIONS);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fonction pour obtenir la couleur en fonction du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'VALIDATED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'PAID': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Fonction pour obtenir le libellé en français du statut
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'En attente';
      case 'VALIDATED': return 'Validée';
      case 'REJECTED': return 'Refusée';
      case 'PAID': return 'Payée';
      default: return status;
    }
  };

  // Fonction pour obtenir le libellé en français du type
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'RCD': return 'Remplacement courte durée';
      case 'DEVOIRS_FAITS': return 'Devoirs faits';
      case 'HSE': return 'HSE';
      case 'AUTRE': return 'Autre';
      default: return type;
    }
  };

  // Fonction pour afficher les détails d'une session
  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  // Fonction pour fermer la modale
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSession(null);
  };

  // Calcul des statistiques
  const pendingCount = sessions.filter(s => s.status === 'PENDING').length;
  const validatedCount = sessions.filter(s => s.status === 'VALIDATED').length;
  const rejectedCount = sessions.filter(s => s.status === 'REJECTED').length;
  const paidCount = sessions.filter(s => s.status === 'PAID').length;

  return (
    <div>
      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Carte de bienvenue */}
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Bienvenue, {userName}
          </h2>
          <p className="text-gray-600 mb-4">
            Gérez vos heures supplémentaires et suivez leur statut.
          </p>
          <div className="flex flex-wrap gap-4 mt-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Déclarer des heures
            </button>
          </div>
        </div>

        {/* Onglets */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                className={`py-4 px-6 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('dashboard')}
              >
                Tableau de bord
              </button>
              <button
                className={`py-4 px-6 font-medium text-sm ${
                  activeTab === 'sessions'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('sessions')}
              >
                Mes séances
              </button>
              <button
                className={`py-4 px-6 font-medium text-sm ${
                  activeTab === 'calendar'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('calendar')}
              >
                Calendrier
              </button>
              <button
                className={`py-4 px-6 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('profile')}
              >
                Mon profil
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Contenu du tableau de bord */}
            {activeTab === 'dashboard' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Résumé de vos heures</h3>

                {/* Statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-500">En attente</div>
                    <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
                  </div>
                  <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-500">Validées</div>
                    <div className="text-2xl font-bold text-green-600">{validatedCount}</div>
                  </div>
                  <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-500">Refusées</div>
                    <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
                  </div>
                  <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-500">Payées</div>
                    <div className="text-2xl font-bold text-blue-600">{paidCount}</div>
                  </div>
                </div>

                {/* Séances récentes */}
                <h3 className="text-lg font-medium text-gray-900 mb-4">Séances récentes</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sessions.slice(0, 3).map((session) => (
                        <tr key={session.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format(new Date(session.date), 'dd MMMM yyyy', { locale: fr })} ({session.timeSlot})
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getTypeLabel(session.type)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(session.status)}`}>
                              {getStatusLabel(session.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              className="text-blue-600 hover:text-blue-800"
                              onClick={() => handleSessionClick(session)}
                            >
                              Voir détails
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {sessions.length > 3 && (
                  <div className="mt-4 text-right">
                    <button
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      onClick={() => setActiveTab('sessions')}
                    >
                      Voir toutes les séances →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Liste complète des séances */}
            {activeTab === 'sessions' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Toutes mes séances</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Détails</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sessions.map((session) => (
                        <tr key={session.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format(new Date(session.date), 'dd MMMM yyyy', { locale: fr })} <br />
                            <span className="text-gray-500">{session.timeSlot}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {getTypeLabel(session.type)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {session.type === 'RCD' && session.className && (
                              <div>Classe: {session.className} <br /> Matière: {session.subject}</div>
                            )}
                            {session.type === 'DEVOIRS_FAITS' && (
                              <div>Nombre d'élèves: {session.studentCount}</div>
                            )}
                            {session.type === 'AUTRE' && session.description && (
                              <div>{session.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(session.status)}`}>
                              {getStatusLabel(session.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              className="text-blue-600 hover:text-blue-800"
                              onClick={() => handleSessionClick(session)}
                            >
                              Voir détails
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Vue calendrier */}
            {activeTab === 'calendar' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Calendrier des séances</h3>
                <div className="bg-gray-100 p-8 rounded-lg text-center">
                  <p className="text-gray-500">Vue calendrier (à implémenter)</p>
                  <p className="mt-2 text-sm text-gray-400">Cette fonctionnalité sera disponible prochainement</p>
                </div>
              </div>
            )}

            {/* Profil */}
            {activeTab === 'profile' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Mon profil</h3>
                <div className="bg-white border rounded-lg p-6 space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Nom complet</h4>
                    <p className="text-gray-900">{userName}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                    <p className="text-gray-900">teacher1@example.com</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Statut Pacte</h4>
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <p className="text-gray-900">Je participe au pacte</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Progression Pacte</h4>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Heures effectuées</span>
                      <span className="font-medium">12 / 36 heures</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '33%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modale de détails de session */}
      {isModalOpen && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Détails de la séance
              </h3>
              <button
                className="text-gray-400 hover:text-gray-500"
                onClick={handleCloseModal}
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Date et heure</h4>
                <p className="text-gray-900">
                  {format(new Date(selectedSession.date), 'dd MMMM yyyy', { locale: fr })} ({selectedSession.timeSlot})
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Type</h4>
                <p className="text-gray-900">{getTypeLabel(selectedSession.type)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Statut</h4>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedSession.status)}`}>
                  {getStatusLabel(selectedSession.status)}
                </span>
              </div>

              {/* Détails spécifiques au type */}
              {selectedSession.type === 'RCD' && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Détails du remplacement</h4>
                  <p className="text-gray-900">
                    Classe: {selectedSession.className} <br />
                    Matière: {selectedSession.subject}
                  </p>
                </div>
              )}

              {selectedSession.type === 'DEVOIRS_FAITS' && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Détails</h4>
                  <p className="text-gray-900">
                    Nombre d'élèves: {selectedSession.studentCount}
                  </p>
                </div>
              )}

              {selectedSession.type === 'AUTRE' && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Description</h4>
                  <p className="text-gray-900">{selectedSession.description}</p>
                </div>
              )}

              {/* Commentaire */}
              {selectedSession.comment && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Commentaire</h4>
                  <p className="text-gray-900">{selectedSession.comment}</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                onClick={handleCloseModal}
              >
                Fermer
              </button>
              {selectedSession.status === 'PENDING' && (
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Modifier
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
