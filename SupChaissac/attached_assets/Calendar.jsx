
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '../contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, Trash2, Users } from 'lucide-react';
import SessionForm from './SessionForm';

function Calendar({ onBack }) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const { selectedSessions, addSession, deleteSession } = useSession();

  // Obtenir les jours de la semaine
  const weekDays = useMemo(() => {
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - start.getDay() + 1);
    
    const days = [];
    for (let i = 0; i < 5; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push({
        date: day.toISOString().split('T')[0],
        weekday: new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(day),
        dayMonth: new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(day)
      });
    }
    return days;
  }, [currentWeek]);

  // Navigation entre les semaines
  const navigateWeek = (direction) => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + direction * 7);
    setCurrentWeek(newDate);
  };

  // Obtenir la couleur du statut
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

  // Ajouter une nouvelle séance
  const handleNewSession = (day) => {
    setSelectedDay(day);
    setShowForm(true);
  };

  // Sauvegarder une séance
  const handleSaveSession = (sessionData) => {
    addSession(sessionData);
    setShowForm(false);
  };

  // Supprimer une séance
  const handleDeleteSession = (sessionId, e) => {
    e.stopPropagation();
    deleteSession(sessionId);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* En-tête avec navigation */}
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateWeek(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">
          Semaine du {weekDays[0].dayMonth} au {weekDays[4].dayMonth}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateWeek(1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Grille des jours */}
      <div className="grid grid-cols-5 gap-4">
        {weekDays.map((day) => {
          const daySessions = selectedSessions.filter(s => s.date === day.date);
          
          return (
            <div key={day.date} className="relative">
              <div className="text-center mb-2">
                <div className="text-sm font-medium capitalize">{day.weekday}</div>
                <div className="text-xs text-gray-500">{day.dayMonth}</div>
              </div>
              <div className="space-y-2">
                <AnimatePresence>
                  {daySessions.map((session) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`relative p-2 rounded-lg text-sm group ${
                        session.type === 'RCD' ? 'bg-purple-100 text-purple-700' :
                        session.type === 'DEVOIRS FAITS' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      <div className="font-medium">{session.timeSlot}</div>
                      <div className="text-xs">{session.type}</div>
                      {session.type === 'RCD' && (
                        <div className="text-xs mt-1">
                          {session.teacher} - {session.classroom}
                        </div>
                      )}
                      {session.type === 'DEVOIRS FAITS' && session.students?.length > 0 && (
                        <div className="flex items-center gap-1 text-xs mt-1">
                          <Users className="h-3 w-3" />
                          {session.students.length} élèves
                        </div>
                      )}
                      {/* Indicateur de statut */}
                      <div className={`absolute top-1 right-1 w-3 h-3 rounded-full ${getStatusColor(session.status)}`} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 bg-white/80 backdrop-blur-sm hover:bg-red-100 hover:text-red-600"
                        onClick={(e) => handleDeleteSession(session.id, e)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <Button
                  onClick={() => handleNewSession(day)}
                  variant="ghost"
                  className="w-full h-8 bg-gray-50 hover:bg-gray-100"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nouvelle séance
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Légende des statuts */}
      <div className="mt-6 pt-4 border-t">
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

      {/* Formulaire de nouvelle séance */}
      <AnimatePresence>
        {showForm && selectedDay && (
          <SessionForm
            day={selectedDay}
            onSave={handleSaveSession}
            onCancel={() => setShowForm(false)}
          />
        )}
      </AnimatePresence>

      {/* Bouton retour si nécessaire */}
      {onBack && (
        <div className="mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onBack}>
            Retour
          </Button>
        </div>
      )}
    </div>
  );
}

export default Calendar;
