
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

function TeacherSetup() {
  const { user } = useAuth();
  const [teacherInfo, setTeacherInfo] = useState({
    inPacte: null,
    contractNumber: '',
    startDate: new Date().toISOString().split('T')[0]
  });
  const { toast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (teacherInfo.inPacte === null) {
      toast({
        title: "Choix requis",
        description: "Veuillez indiquer si vous participez au pacte",
        variant: "destructive"
      });
      return;
    }

    if (teacherInfo.inPacte && !teacherInfo.contractNumber) {
      toast({
        title: "Numéro de contrat requis",
        description: "Veuillez saisir le numéro de contrat",
        variant: "destructive"
      });
      return;
    }

    // Sauvegarder dans localStorage
    const savedTeachers = JSON.parse(localStorage.getItem('teacherSetups') || '{}');
    savedTeachers[user.id] = {
      ...teacherInfo,
      name: user.name,
      contracts: teacherInfo.inPacte ? [{
        number: teacherInfo.contractNumber,
        startDate: teacherInfo.startDate,
        status: 'active'
      }] : []
    };
    localStorage.setItem('teacherSetups', JSON.stringify(savedTeachers));

    // Marquer l'enseignant comme configuré
    const updatedUser = { ...user, needsSetup: false };
    localStorage.setItem('user', JSON.stringify(updatedUser));

    toast({
      title: "Configuration terminée",
      description: "Vos préférences ont été enregistrées avec succès",
    });

    // Recharger la page pour mettre à jour l'interface
    window.location.reload();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Configuration initiale
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Bienvenue {user.name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-6">
            <div>
              <label className="text-lg font-medium text-gray-900 mb-4 block">
                Participez-vous au pacte enseignant ?
              </label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  className={`h-20 ${
                    teacherInfo.inPacte === true
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setTeacherInfo(prev => ({ ...prev, inPacte: true }))}
                >
                  Oui, je participe
                </Button>
                <Button
                  type="button"
                  className={`h-20 ${
                    teacherInfo.inPacte === false
                      ? 'bg-gray-200 text-gray-700 border-2 border-gray-500'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setTeacherInfo(prev => ({ ...prev, inPacte: false }))}
                >
                  Non, je ne participe pas
                </Button>
              </div>
            </div>

            {teacherInfo.inPacte && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro de contrat
                  </label>
                  <input
                    type="text"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Ex: PACTE-2024-001"
                    value={teacherInfo.contractNumber}
                    onChange={(e) => setTeacherInfo(prev => ({
                      ...prev,
                      contractNumber: e.target.value
                    }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    value={teacherInfo.startDate}
                    onChange={(e) => setTeacherInfo(prev => ({
                      ...prev,
                      startDate: e.target.value
                    }))}
                  />
                </div>
              </motion.div>
            )}
          </div>

          <Button type="submit" className="w-full">
            Commencer
          </Button>
        </form>
      </div>
    </motion.div>
  );
}

export default TeacherSetup;
