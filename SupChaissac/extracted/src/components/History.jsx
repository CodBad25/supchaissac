
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from '../contexts/SessionContext';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Calendar as CalendarIcon,
  Filter,
  Download,
  FileText
} from 'lucide-react';

function History() {
  const { selectedSessions } = useSession();
  const [filter, setFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('month');

  // Fonction pour obtenir la couleur du statut (même logique que Calendar)
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return 'bg-gray-600 ring-2 ring-white shadow-sm'; // Nouvelle - Gris foncé
      case 'PENDING_VALIDATION':
        return 'bg-orange-500 ring-2 ring-white shadow-sm'; // En attente - Orange
      case 'VALIDATED':
        return 'bg-blue-600 ring-2 ring-white shadow-sm'; // Validée - Bleu
      case 'PAID':
        return 'bg-green-600 ring-2 ring-white shadow-sm'; // Payée - Vert
      default:
        return 'bg-gray-600 ring-2 ring-white shadow-sm';
    }
  };

  // Fonction pour obtenir le texte du statut
  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING_REVIEW':
        return 'Nouvelle';
      case 'PENDING_VALIDATION':
        return 'En attente';
      case 'VALIDATED':
        return 'Validée';
      case 'PAID':
        return 'Payée';
      default:
        return 'Inconnue';
    }
  };

  // Fonction pour obtenir les statistiques
  const getStats = () => {
    const stats = {
      total: selectedSessions.length,
      rcd: selectedSessions.filter(s => s.type === 'RCD').length,
      devoirsFaits: selectedSessions.filter(s => s.type === 'DEVOIRS FAITS').length,
      autre: selectedSessions.filter(s => s.type === 'AUTRE').length,
      pending: selectedSessions.filter(s => s.status === 'PENDING_REVIEW').length,
      validated: selectedSessions.filter(s => s.status === 'VALIDATED').length,
      paid: selectedSessions.filter(s => s.status === 'PAID').length
    };
    return stats;
  };

  const stats = getStats();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* En-tête avec statistiques globales */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Statistiques globales</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total des heures</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">{stats.rcd}</div>
            <div className="text-sm text-gray-600">Heures RCD</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{stats.devoirsFaits}</div>
            <div className="text-sm text-gray-600">Heures Devoirs Faits</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-3xl font-bold text-yellow-600">{stats.autre}</div>
            <div className="text-sm text-gray-600">Autres heures</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Filtres</h3>
          <div className="flex gap-2">
            <Button
              variant={timeRange === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('month')}
            >
              Mois
            </Button>
            <Button
              variant={timeRange === 'trimester' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('trimester')}
            >
              Trimestre
            </Button>
            <Button
              variant={timeRange === 'year' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('year')}
            >
              Année
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Toutes
          </Button>
          <Button
            variant={filter === 'PENDING_REVIEW' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('PENDING_REVIEW')}
          >
            Nouvelles
          </Button>
          <Button
            variant={filter === 'PENDING_VALIDATION' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('PENDING_VALIDATION')}
          >
            En attente
          </Button>
          <Button
            variant={filter === 'VALIDATED' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('VALIDATED')}
          >
            Validées
          </Button>
          <Button
            variant={filter === 'PAID' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('PAID')}
          >
            Payées
          </Button>
        </div>
      </div>

      {/* Liste des séances */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold mb-4">Historique des séances</h3>
        <div className="space-y-4">
          {selectedSessions
            .filter(session => {
              if (filter === 'all') return true;
              return session.status === filter;
            })
            .map(session => (
              <div
                key={session.id}
                className="border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">Séance du {session.date}</h4>
                    <p className="text-sm text-gray-600">
                      {session.type} - {session.timeSlot}
                    </p>
                    {session.type === 'RCD' && (
                      <p className="text-sm text-gray-600">
                        Prof: {session.teacher}, Classe: {session.classroom}
                      </p>
                    )}
                    {session.type === 'DEVOIRS FAITS' && session.students?.length > 0 && (
                      <p className="text-sm text-gray-600">
                        {session.students.length} élèves
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(session.status)}`} />
                    <span className="text-sm text-gray-600">
                      {getStatusText(session.status)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Légende des statuts */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium mb-2">Légende des statuts</h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-600 ring-2 ring-white shadow-sm" />
            <span className="text-xs">Nouvelle</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500 ring-2 ring-white shadow-sm" />
            <span className="text-xs">En attente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600 ring-2 ring-white shadow-sm" />
            <span className="text-xs">Validée</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600 ring-2 ring-white shadow-sm" />
            <span className="text-xs">Payée</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default History;
