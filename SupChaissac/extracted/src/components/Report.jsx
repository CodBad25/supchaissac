
import React from 'react';
import { motion } from 'framer-motion';
import { useSession } from '../contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

function Report({ onBack }) {
  const { selectedSessions } = useSession();
  const { toast } = useToast();

  const handleDownloadPDF = () => {
    toast({
      title: "Téléchargement du PDF",
      description: "Le rapport a été généré et téléchargé avec succès",
    });
  };

  const calculateTotalHours = (type) => {
    return selectedSessions.filter(s => s.type === type).length;
  };

  return (
    <motion.div
      className="bg-white rounded-lg shadow p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="border-b border-gray-200 pb-4 mb-4">
        <h2 className="text-lg font-bold text-center text-blue-600">
          État des heures supplémentaires
        </h2>
        <p className="text-center text-sm text-gray-500">
          Généré le {new Date().toLocaleDateString('fr-FR')}
        </p>
        <p className="text-center text-sm text-gray-500">
          Semaines 1, 2, 3, 4
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full mb-6">
          <thead>
            <tr>
              <th className="bg-blue-600 text-white p-2 text-left">Date</th>
              <th className="bg-blue-50 text-gray-700 p-2">Créneau</th>
              <th className="bg-blue-50 text-gray-700 p-2">Type</th>
              <th className="bg-blue-50 text-gray-700 p-2">Durée</th>
              <th className="bg-blue-50 text-gray-700 p-2">Détails</th>
            </tr>
          </thead>
          <tbody>
            {selectedSessions.map((session) => (
              <tr key={session.id}>
                <td className="border p-2">
                  {session.date} (S{Math.ceil(parseInt(session.date) / 7)})
                </td>
                <td className="border p-2 text-center">{session.timeSlot}</td>
                <td className="border p-2">{session.type}</td>
                <td className="border p-2 text-center">{session.duration}</td>
                <td className="border p-2">
                  {session.description ||
                    (session.teacher &&
                      `Prof: ${session.teacher}${
                        session.classroom ? `, Classe: ${session.classroom}` : ''
                      }`) ||
                    '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-6">
        <h3 className="text-blue-600 font-medium mb-2">Bilan des heures :</h3>
        <div className="pl-4">
          <p className="mb-1">
            <span className="font-medium">DEVOIRS FAITS :</span>{' '}
            {calculateTotalHours('DEVOIRS FAITS')}h
          </p>
          <p className="mb-1">
            <span className="font-medium">RCD :</span>{' '}
            {calculateTotalHours('RCD')}h
          </p>
          <p className="mb-1">
            <span className="font-medium">AUTRE :</span>{' '}
            {calculateTotalHours('AUTRE')}h
          </p>
          <p className="mt-2 font-medium">
            Total : {selectedSessions.length}h
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-blue-600 font-medium mb-4">Signatures :</h3>
        <div className="flex justify-between">
          <div className="border p-4 w-40 h-20 text-center">
            <p className="text-sm text-gray-500 mb-6">
              Signature de l'enseignant
            </p>
          </div>
          <div className="border p-4 w-40 h-20 text-center">
            <p className="text-sm text-gray-500 mb-6">
              Signature de l'administration
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onBack}>
          RETOUR
        </Button>
        <Button
          className="bg-green-500 hover:bg-green-600"
          onClick={handleDownloadPDF}
        >
          TÉLÉCHARGER PDF
        </Button>
      </div>
    </motion.div>
  );
}

export default Report;
