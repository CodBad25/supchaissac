
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Check, FileText, Users, BookOpen, Eye, ArrowRight, Download, Search, Filter, Plus, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ContractForm from '../contracts/ContractForm';

function SecretaryDashboard() {
  const [selectedView, setSelectedView] = useState('overview');
  const [showContractForm, setShowContractForm] = useState(false);
  const [teacherSetups, setTeacherSetups] = useState({});
  const { selectedSessions, updateSessionStatus } = useSession();
  const { toast } = useToast();

  // Charger les configurations des enseignants
  useEffect(() => {
    const savedTeacherSetups = JSON.parse(localStorage.getItem('teacherSetups') || '{}');
    setTeacherSetups(savedTeacherSetups);
  }, []);

  // Statistiques pour la vue d'ensemble
  const stats = useMemo(() => {
    return {
      totalSessions: selectedSessions.length,
      pendingValidation: selectedSessions.filter(s => s.status === 'PENDING_VALIDATION').length,
      validated: selectedSessions.filter(s => s.status === 'VALIDATED').length,
      paid: selectedSessions.filter(s => s.status === 'PAID').length,
      rcd: selectedSessions.filter(s => s.type === 'RCD').length,
      devoirsFaits: selectedSessions.filter(s => s.type === 'DEVOIRS FAITS').length,
      autre: selectedSessions.filter(s => s.type === 'AUTRE').length
    };
  }, [selectedSessions]);

  const handleSaveContract = (contractData) => {
    const updatedTeacherSetups = { ...teacherSetups };
    
    // Créer un nouvel ID pour l'enseignant si c'est un nouveau
    const teacherId = contractData.teacherId || Date.now().toString();
    
    if (!updatedTeacherSetups[teacherId]) {
      // Créer un nouvel enseignant
      updatedTeacherSetups[teacherId] = {
        id: teacherId,
        name: contractData.teacherName,
        email: contractData.teacherEmail,
        inPacte: true,
        contracts: []
      };
    }

    const teacher = updatedTeacherSetups[teacherId];

    // Ajouter le nouveau contrat
    const newContract = {
      id: Date.now(),
      number: contractData.number,
      startDate: contractData.startDate,
      status: 'active',
      rcdHours: contractData.rcdHours,
      devoirsFaitsHours: contractData.devoirsFaitsHours,
      completedRcdHours: contractData.completedRcdHours || 0,
      completedDevoirsFaitsHours: contractData.completedDevoirsFaitsHours || 0,
      completedOtherHours: contractData.completedOtherHours || 0
    };

    teacher.contracts = [...(teacher.contracts || []), newContract];

    // Sauvegarder les modifications
    localStorage.setItem('teacherSetups', JSON.stringify(updatedTeacherSetups));
    setTeacherSetups(updatedTeacherSetups);

    toast({
      title: "Contrat créé",
      description: `Le contrat a été créé avec succès pour ${contractData.teacherName}`,
    });

    setShowContractForm(false);
  };

  const handleDeleteContract = (teacherId, contractId) => {
    const updatedTeacherSetups = { ...teacherSetups };
    const teacher = updatedTeacherSetups[teacherId];
    
    if (teacher) {
      teacher.contracts = teacher.contracts.filter(c => c.id !== contractId);
      
      if (teacher.contracts.length === 0) {
        // Si plus de contrats, l'enseignant n'est plus dans le pacte
        teacher.inPacte = false;
      }
      
      localStorage.setItem('teacherSetups', JSON.stringify(updatedTeacherSetups));
      setTeacherSetups(updatedTeacherSetups);
      
      toast({
        title: "Contrat supprimé",
        description: "Le contrat a été supprimé avec succès",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 max-w-7xl mx-auto"
    >
      {/* Navigation */}
      <div className="flex space-x-4 mb-6">
        <Button
          variant={selectedView === 'overview' ? 'default' : 'outline'}
          onClick={() => setSelectedView('overview')}
          className="flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          Vue d'ensemble
        </Button>
        <Button
          variant={selectedView === 'contracts' ? 'default' : 'outline'}
          onClick={() => setSelectedView('contracts')}
          className="flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Contrats Pacte
        </Button>
      </div>

      {selectedView === 'overview' && (
        <div className="space-y-6">
          {/* Statistiques globales */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Vue d'ensemble</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{stats.totalSessions}</div>
                <div className="text-sm text-gray-600">Total des séances</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600">{stats.pendingValidation}</div>
                <div className="text-sm text-gray-600">En attente</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{stats.validated}</div>
                <div className="text-sm text-gray-600">Validées</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">{stats.paid}</div>
                <div className="text-sm text-gray-600">Payées</div>
              </div>
            </div>
          </div>

          {/* Répartition par type */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Répartition par type</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">RCD</span>
                </div>
                <div className="text-2xl font-bold text-purple-600 mt-2">{stats.rcd}</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Devoirs Faits</span>
                </div>
                <div className="text-2xl font-bold text-blue-600 mt-2">{stats.devoirsFaits}</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium">Autre</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600 mt-2">{stats.autre}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedView === 'contracts' && (
        <div className="space-y-6">
          {/* En-tête avec bouton d'ajout */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestion des contrats Pacte</h2>
            <Button
              onClick={() => setShowContractForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nouveau contrat
            </Button>
          </div>

          {/* Liste des contrats existants */}
          <div className="grid gap-4">
            {Object.entries(teacherSetups)
              .filter(([_, teacher]) => teacher.inPacte)
              .map(([teacherId, teacher]) => {
                const currentContract = teacher.contracts?.[teacher.contracts.length - 1];
                if (!currentContract) return null;

                const totalHours = selectedSessions
                  .filter(s => s.teacherId === teacherId && 
                              new Date(s.date) >= new Date(currentContract.startDate))
                  .length;

                return (
                  <div key={teacherId} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{teacher.name}</h3>
                        {teacher.email && (
                          <p className="text-sm text-gray-600">{teacher.email}</p>
                        )}
                        <p className="text-sm text-gray-600">
                          Contrat N° {currentContract.number}
                        </p>
                        <p className="text-sm text-gray-600">
                          Début : {new Date(currentContract.startDate).toLocaleDateString()}
                        </p>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-purple-600">
                              RCD : {currentContract.completedRcdHours}/{currentContract.rcdHours}h
                            </p>
                            <div className="h-2 bg-gray-100 rounded-full mt-1">
                              <div
                                className="h-full bg-purple-600 rounded-full transition-all"
                                style={{
                                  width: `${Math.min((currentContract.completedRcdHours / currentContract.rcdHours) * 100, 100)}%`
                                }}
                              />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-blue-600">
                              Devoirs Faits : {currentContract.completedDevoirsFaitsHours}/{currentContract.devoirsFaitsHours}h
                            </p>
                            <div className="h-2 bg-gray-100 rounded-full mt-1">
                              <div
                                className="h-full bg-blue-600 rounded-full transition-all"
                                style={{
                                  width: `${Math.min((currentContract.completedDevoirsFaitsHours / currentContract.devoirsFaitsHours) * 100, 100)}%`
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowContractForm(true);
                            // Ajouter la logique pour éditer un contrat existant
                          }}
                        >
                          Modifier
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteContract(teacherId, currentContract.id)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Formulaire de création/modification de contrat */}
      <AnimatePresence>
        {showContractForm && (
          <ContractForm
            onClose={() => setShowContractForm(false)}
            onSave={handleSaveContract}
            onDelete={handleDeleteContract}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default SecretaryDashboard;
