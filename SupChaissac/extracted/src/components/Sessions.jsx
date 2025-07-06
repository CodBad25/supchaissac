
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from '../contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import SessionForm from './SessionForm';
import { Trash2 } from 'lucide-react';

function Sessions({ onBack, onNext }) {
  const { selectedSessions, updateSession, deleteSession } = useSession();
  const [editingSession, setEditingSession] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const { toast } = useToast();

  const handleEditClick = (session) => {
    setEditingSession(session);
  };

  const handleSave = (updatedSession) => {
    updateSession(updatedSession.id, updatedSession);
    setEditingSession(null);
  };

  const handleSelect = (sessionId) => {
    setSelectedIds(prev => 
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(
      selectedIds.length === selectedSessions.length
        ? []
        : selectedSessions.map(session => session.id)
    );
  };

  const handleDeleteSelected = () => {
    selectedIds.forEach(id => deleteSession(id));
    toast({
      title: "Séances supprimées",
      description: `${selectedIds.length} séance(s) ont été supprimées`,
    });
    setSelectedIds([]);
  };

  return (
    <motion.div
      className="bg-white rounded-lg shadow p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Détail des séances</h2>
        <div className="flex items-center gap-4">
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer ({selectedIds.length})
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={selectedIds.length === selectedSessions.length && selectedSessions.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <label htmlFor="select-all" className="text-sm">
              Tout sélectionner
            </label>
          </div>
        </div>
      </div>

      {selectedSessions.map((session) => (
        <motion.div
          key={session.id}
          className={`mb-6 pb-4 border-b border-gray-200 ${
            selectedIds.includes(session.id) ? 'bg-blue-50 rounded-lg p-4' : ''
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-3">
            <Checkbox
              checked={selectedIds.includes(session.id)}
              onCheckedChange={() => handleSelect(session.id)}
            />
            <div className="flex-1 flex justify-between items-center">
              <h3 className="font-medium">
                Séance du {session.date}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditClick(session)}
              >
                MODIFIER
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm ml-8">
            <div>
              <p className="text-gray-500">Type :</p>
              <p>{session.type}</p>
            </div>
            <div>
              <p className="text-gray-500">Créneau :</p>
              <p>{session.timeSlot}</p>
            </div>
            <div>
              <p className="text-gray-500">Durée :</p>
              <p>1 heure</p>
            </div>
            {session.teacher && (
              <div>
                <p className="text-gray-500">Professeur remplacé :</p>
                <p>{session.teacher}</p>
              </div>
            )}
            {session.classroom && (
              <div>
                <p className="text-gray-500">Classe :</p>
                <p>{session.classroom}</p>
              </div>
            )}
            {session.description && (
              <div className="col-span-2">
                <p className="text-gray-500">Description :</p>
                <p>{session.description}</p>
              </div>
            )}
          </div>
        </motion.div>
      ))}

      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={onBack}>
          RETOUR
        </Button>
        <Button onClick={onNext}>
          GÉNÉRER LE RAPPORT
        </Button>
      </div>

      {editingSession && (
        <SessionForm
          session={editingSession}
          onSave={handleSave}
          onCancel={() => setEditingSession(null)}
        />
      )}
    </motion.div>
  );
}

export default Sessions;
