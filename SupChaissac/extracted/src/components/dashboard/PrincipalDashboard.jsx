
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import {
  Check,
  X,
  FileText,
  Users,
  BookOpen,
  BarChart,
  Download,
  Calendar as CalendarIcon,
  Filter,
  PieChart,
  TrendingUp,
  CheckSquare
} from 'lucide-react';

function PrincipalDashboard() {
  const { selectedSessions, updateSessionStatus } = useSession();
  const { toast } = useToast();
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  // Obtenir la liste unique des enseignants
  const teachers = useMemo(() => {
    const uniqueTeachers = [...new Set(selectedSessions.map(s => s.teacherName))];
    return uniqueTeachers.sort();
  }, [selectedSessions]);

  // Statistiques détaillées
  const stats = useMemo(() => {
    const filteredSessions = selectedSessions.filter(session => {
      if (selectedMonth && !session.date.includes(selectedMonth)) return false;
      if (selectedTeacher && session.teacherName !== selectedTeacher) return false;
      return true;
    });

    return {
      total: filteredSessions.length,
      rcd: filteredSessions.filter(s => s.type === 'RCD').length,
      devoirsFaits: filteredSessions.filter(s => s.type === 'DEVOIRS FAITS').length,
      autre: filteredSessions.filter(s => s.type === 'AUTRE').length,
      pending: filteredSessions.filter(s => s.status === 'PENDING_VALIDATION').length,
      validated: filteredSessions.filter(s => s.status === 'VALIDATED').length,
      paid: filteredSessions.filter(s => s.status === 'PAID').length,
      // Statistiques par enseignant
      byTeacher: teachers.map(teacher => ({
        name: teacher,
        total: filteredSessions.filter(s => s.teacherName === teacher).length,
        rcd: filteredSessions.filter(s => s.teacherName === teacher && s.type === 'RCD').length,
        devoirsFaits: filteredSessions.filter(s => s.teacherName === teacher && s.type === 'DEVOIRS FAITS').length,
        autre: filteredSessions.filter(s => s.teacherName === teacher && s.type === 'AUTRE').length
      }))
    };
  }, [selectedSessions, selectedMonth, selectedTeacher, teachers]);

  // Filtrer uniquement les sessions "AUTRE" pour la validation
  const pendingValidation = selectedSessions.filter(s => 
    s.status === 'PENDING_VALIDATION' && s.type === 'AUTRE'
  );

  const handleValidateMultiple = (type) => {
    selectedIds.forEach(id => {
      updateSessionStatus(id, 'VALIDATED', type);
    });

    toast({
      title: "Sessions validées",
      description: `${selectedIds.length} séances ont été validées comme ${type}`,
    });

    setSelectedIds([]);
  };

  const handleRejectMultiple = () => {
    selectedIds.forEach(id => {
      updateSessionStatus(id, 'REJECTED');
    });

    toast({
      title: "Sessions refusées",
      description: `${selectedIds.length} séances ont été refusées`,
      variant: "destructive"
    });

    setSelectedIds([]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === pendingValidation.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingValidation.map(s => s.id));
    }
  };

  const handleSelect = (sessionId) => {
    setSelectedIds(prev => 
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const handleExport = () => {
    // Créer le contenu CSV
    const headers = ['Enseignant', 'Date', 'Type', 'Créneau', 'Statut', 'Détails'];
    const rows = selectedSessions.map(s => [
      s.teacherName,
      s.date,
      s.type,
      s.timeSlot,
      s.status,
      s.description || (s.teacher ? `Prof: ${s.teacher}, Classe: ${s.classroom}` : '')
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Créer et télécharger le fichier
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `export_heures_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Export réussi",
      description: "Les données ont été exportées avec succès",
    });
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
          <PieChart className="h-4 w-4" />
          Vue d'ensemble
        </Button>
        <Button
          variant={selectedView === 'validation' ? 'default' : 'outline'}
          onClick={() => setSelectedView('validation')}
          className="flex items-center gap-2"
        >
          <CheckSquare className="h-4 w-4" />
          Validation
        </Button>
        <Button
          variant={selectedView === 'stats' ? 'default' : 'outline'}
          onClick={() => setSelectedView('stats')}
          className="flex items-center gap-2"
        >
          <BarChart className="h-4 w-4" />
          Statistiques
        </Button>
      </div>

      {selectedView === 'overview' && (
        <div className="space-y-6">
          {/* Vue d'ensemble */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Vue d'ensemble</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Total des séances</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                <div className="text-sm text-gray-600">En attente</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{stats.validated}</div>
                <div className="text-sm text-gray-600">Validées</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{stats.paid}</div>
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
                  <FileText className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium">Autre</span>
                </div>
                <div className="text-2xl font-bold text-yellow-600 mt-2">{stats.autre}</div>
              </div>
            </div>
          </div>

          {/* Tableau récapitulatif par enseignant */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Détail par enseignant</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exporter
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left">Enseignant</th>
                    <th className="px-4 py-2 text-center">RCD</th>
                    <th className="px-4 py-2 text-center">Devoirs Faits</th>
                    <th className="px-4 py-2 text-center">Autre</th>
                    <th className="px-4 py-2 text-center">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.byTeacher.map(teacher => (
                    <tr key={teacher.name} className="border-t">
                      <td className="px-4 py-2">{teacher.name}</td>
                      <td className="px-4 py-2 text-center">{teacher.rcd}</td>
                      <td className="px-4 py-2 text-center">{teacher.devoirsFaits}</td>
                      <td className="px-4 py-2 text-center">{teacher.autre}</td>
                      <td className="px-4 py-2 text-center font-medium">{teacher.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedView === 'validation' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Séances à valider</h3>
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRejectMultiple}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Refuser ({selectedIds.length})
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleValidateMultiple('RCD')}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Valider RCD ({selectedIds.length})
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleValidateMultiple('DEVOIRS FAITS')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Valider Devoirs Faits ({selectedIds.length})
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mb-4">
              <Checkbox
                id="select-all"
                checked={selectedIds.length === pendingValidation.length && pendingValidation.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm">
                Tout sélectionner
              </label>
            </div>

            <div className="space-y-4">
              {pendingValidation.map(session => (
                <div key={session.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedIds.includes(session.id)}
                      onCheckedChange={() => handleSelect(session.id)}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{session.teacherName}</p>
                          <p className="text-sm text-gray-600">{session.date} - {session.timeSlot}</p>
                          {session.description && (
                            <p className="text-sm text-gray-600 mt-1">{session.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {pendingValidation.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  Aucune séance en attente de validation
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedView === 'stats' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Statistiques détaillées</h3>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={handleExport}
              >
                <Download className="h-4 w-4" />
                Exporter
              </Button>
            </div>

            <div className="space-y-6">
              {/* Filtres */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mois
                  </label>
                  <select
                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    <option value="">Tous les mois</option>
                    <option value="01">Janvier</option>
                    <option value="02">Février</option>
                    <option value="03">Mars</option>
                    <option value="04">Avril</option>
                    <option value="05">Mai</option>
                    <option value="06">Juin</option>
                    <option value="07">Juillet</option>
                    <option value="08">Août</option>
                    <option value="09">Septembre</option>
                    <option value="10">Octobre</option>
                    <option value="11">Novembre</option>
                    <option value="12">Décembre</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enseignant
                  </label>
                  <select
                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2"
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                  >
                    <option value="">Tous les enseignants</option>
                    {teachers.map(teacher => (
                      <option key={teacher} value={teacher}>
                        {teacher}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Graphiques et statistiques détaillées */}
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-4">Répartition par type</h4>
                  {/* Placeholder pour graphique */}
                  <div className="h-48 bg-white rounded-lg border flex items-center justify-center">
                    Graphique à venir
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-4">Évolution mensuelle</h4>
                  {/* Placeholder pour graphique */}
                  <div className="h-48 bg-white rounded-lg border flex items-center justify-center">
                    Graphique à venir
                  </div>
                </div>
              </div>

              {/* Tableau récapitulatif */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left">Enseignant</th>
                      <th className="px-4 py-2 text-center">RCD</th>
                      <th className="px-4 py-2 text-center">Devoirs Faits</th>
                      <th className="px-4 py-2 text-center">Autre</th>
                      <th className="px-4 py-2 text-center">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.byTeacher.map(teacher => (
                      <tr key={teacher.name} className="border-t">
                        <td className="px-4 py-2">{teacher.name}</td>
                        <td className="px-4 py-2 text-center">{teacher.rcd}</td>
                        <td className="px-4 py-2 text-center">{teacher.devoirsFaits}</td>
                        <td className="px-4 py-2 text-center">{teacher.autre}</td>
                        <td className="px-4 py-2 text-center font-medium">{teacher.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default PrincipalDashboard;
