import { useState, useMemo } from 'react';
import { Search, UserCheck, UserX, FileText, TrendingUp, Edit2, X, CheckSquare, Square } from 'lucide-react';

// Types
export interface TeacherStats {
  totalSessions: number;
  rcdSessions: number;
  devoirsFaitsSessions: number;
  hseSessions: number;
}

export interface Teacher {
  id: number;
  name: string;
  username: string;
  initials: string;
  inPacte: boolean;
  pacteHoursTarget?: number;
  pacteHoursCompleted?: number;
  pacteHoursDF?: number;
  pacteHoursRCD?: number;
  pacteHoursCompletedDF?: number;
  pacteHoursCompletedRCD?: number;
  stats: TeacherStats;
}

export interface PacteStats {
  totalTeachers: number;
  teachersWithPacte: number;
  teachersWithoutPacte: number;
  pactePercentage: number;
}

interface ContratsPacteProps {
  teachers: Teacher[];
  pacteStats: PacteStats | null;
  loading: boolean;
  apiBaseUrl: string;
  onTeachersUpdate: (teachers: Teacher[]) => void;
  onStatsRefresh: () => void;
}

export function ContratsPacte({
  teachers,
  pacteStats,
  loading,
  apiBaseUrl,
  onTeachersUpdate,
  onStatsRefresh,
}: ContratsPacteProps) {
  // Search & filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [pacteFilter, setPacteFilter] = useState<'all' | 'pacte'>('all');

  // Modal state
  const [showContratModal, setShowContratModal] = useState(false);
  const [editingContrat, setEditingContrat] = useState<Teacher | null>(null);
  const [contratHoursDF, setContratHoursDF] = useState(0);
  const [contratHoursRCD, setContratHoursRCD] = useState(0);
  const [contratCompletedDF, setContratCompletedDF] = useState(0);
  const [contratCompletedRCD, setContratCompletedRCD] = useState(0);
  const [showPreviousHours, setShowPreviousHours] = useState(false);

  // Batch selection state
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<Set<number>>(new Set());
  const [batchPacteLoading, setBatchPacteLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    confirmColor: 'green' | 'red';
    onConfirm: () => void;
  } | null>(null);

  // Filtered teachers
  const filteredTeachers = useMemo(() => {
    let filtered = teachers;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(search) ||
        t.username.toLowerCase().includes(search)
      );
    }

    if (pacteFilter === 'pacte') {
      filtered = filtered.filter(t => t.inPacte);
    }

    return filtered;
  }, [teachers, searchTerm, pacteFilter]);

  // Toggle teacher selection
  const toggleTeacherSelection = (teacherId: number) => {
    setSelectedTeacherIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teacherId)) {
        newSet.delete(teacherId);
      } else {
        newSet.add(teacherId);
      }
      return newSet;
    });
  };

  // Select all visible teachers
  const selectAllTeachers = () => {
    if (selectedTeacherIds.size === filteredTeachers.length) {
      setSelectedTeacherIds(new Set());
    } else {
      setSelectedTeacherIds(new Set(filteredTeachers.map(t => t.id)));
    }
  };

  // Batch update PACTE
  const batchUpdatePacte = async (inPacte: boolean) => {
    if (selectedTeacherIds.size === 0) return;

    const action = inPacte ? 'activer le PACTE pour' : 'désactiver le PACTE pour';
    const count = selectedTeacherIds.size;

    setConfirmData({
      title: inPacte ? 'Activer le PACTE en lot' : 'Désactiver le PACTE en lot',
      message: `Voulez-vous ${action} ${count} enseignant${count > 1 ? 's' : ''} ?`,
      confirmLabel: inPacte ? 'Activer tous' : 'Désactiver tous',
      confirmColor: inPacte ? 'green' : 'red',
      onConfirm: async () => {
        setBatchPacteLoading(true);
        try {
          const promises = Array.from(selectedTeacherIds).map(teacherId =>
            fetch(`${apiBaseUrl}/api/pacte/teachers/${teacherId}/status`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ inPacte, pacteHoursTarget: inPacte ? 18 : 0 }),
            })
          );
          await Promise.all(promises);

          onTeachersUpdate(teachers.map(t =>
            selectedTeacherIds.has(t.id)
              ? { ...t, inPacte, pacteHoursTarget: inPacte ? 18 : 0 }
              : t
          ));
          setSelectedTeacherIds(new Set());
          onStatsRefresh();
        } catch (error) {
          console.error('Erreur mise a jour PACTE en lot:', error);
        } finally {
          setBatchPacteLoading(false);
          setShowConfirmModal(false);
          setConfirmData(null);
        }
      },
    });
    setShowConfirmModal(true);
  };

  // Save contract
  const saveContrat = async () => {
    if (!editingContrat) return;

    try {
      const totalContrat = contratHoursDF + contratHoursRCD;
      const totalCompleted = contratCompletedDF + contratCompletedRCD;

      const response = await fetch(`${apiBaseUrl}/api/pacte/teachers/${editingContrat.id}/contrat`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          pacteHoursDF: contratHoursDF,
          pacteHoursRCD: contratHoursRCD,
          pacteHoursCompletedDF: contratCompletedDF,
          pacteHoursCompletedRCD: contratCompletedRCD,
          pacteHoursTarget: totalContrat,
          pacteHoursCompleted: totalCompleted,
          inPacte: totalContrat > 0
        }),
      });

      if (response.ok) {
        onTeachersUpdate(teachers.map(t =>
          t.id === editingContrat.id
            ? {
                ...t,
                pacteHoursDF: contratHoursDF,
                pacteHoursRCD: contratHoursRCD,
                pacteHoursCompletedDF: contratCompletedDF,
                pacteHoursCompletedRCD: contratCompletedRCD,
                pacteHoursTarget: totalContrat,
                pacteHoursCompleted: totalCompleted,
                inPacte: totalContrat > 0
              }
            : t
        ));
        setShowContratModal(false);
        setEditingContrat(null);
        onStatsRefresh();
      }
    } catch (error) {
      console.error('Erreur mise a jour contrat:', error);
    }
  };

  // Open edit modal
  const openEditModal = (teacher: Teacher) => {
    setEditingContrat(teacher);
    setContratHoursDF(teacher.pacteHoursDF || 0);
    setContratHoursRCD(teacher.pacteHoursRCD || 0);
    setContratCompletedDF(teacher.pacteHoursCompletedDF || 0);
    setContratCompletedRCD(teacher.pacteHoursCompletedRCD || 0);
    // Activer par defaut pour cette annee scolaire (reprise en cours d'annee)
    setShowPreviousHours(true);
    setShowContratModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      {pacteStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Enseignants PACTE</p>
                <p className="text-3xl font-bold">{pacteStats.teachersWithPacte}</p>
                <p className="text-green-100 text-sm">{pacteStats.pactePercentage}% du total</p>
              </div>
              <UserCheck className="w-10 h-10 text-green-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Heures DF prevues</p>
                <p className="text-3xl font-bold">
                  {teachers.filter(t => t.inPacte).reduce((sum, t) => sum + (t.pacteHoursDF || 0), 0)}h
                </p>
              </div>
              <FileText className="w-10 h-10 text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Heures RCD prevues</p>
                <p className="text-3xl font-bold">
                  {teachers.filter(t => t.inPacte).reduce((sum, t) => sum + (t.pacteHoursRCD || 0), 0)}h
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-200" />
            </div>
          </div>
        </div>
      )}

      {/* Search & filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un enseignant..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setPacteFilter(pacteFilter === 'pacte' ? 'all' : 'pacte')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            pacteFilter === 'pacte'
              ? 'bg-amber-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {pacteFilter === 'pacte' ? 'Afficher tous' : 'Uniquement PACTE'}
        </button>
      </div>

      {/* Batch action bar */}
      {selectedTeacherIds.size > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-amber-800 font-medium">
              {selectedTeacherIds.size} enseignant{selectedTeacherIds.size > 1 ? 's' : ''} sélectionné{selectedTeacherIds.size > 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setSelectedTeacherIds(new Set())}
              className="text-amber-600 hover:text-amber-800 text-sm underline"
            >
              Tout désélectionner
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => batchUpdatePacte(true)}
              disabled={batchPacteLoading}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              Activer PACTE
            </button>
            <button
              onClick={() => batchUpdatePacte(false)}
              disabled={batchPacteLoading}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <UserX className="w-4 h-4" />
              Désactiver PACTE
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-center px-2 py-3 w-10">
                    <button onClick={selectAllTeachers} className="p-1 hover:bg-gray-200 rounded">
                      {selectedTeacherIds.size === filteredTeachers.length && filteredTeachers.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Enseignant</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Statut</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Heures DF</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Heures RCD</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Total contrat</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Realise</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTeachers.map((teacher) => {
                  const totalContrat = (teacher.pacteHoursDF || 0) + (teacher.pacteHoursRCD || 0);
                  const manualCompleted = (teacher.pacteHoursCompletedDF || 0) + (teacher.pacteHoursCompletedRCD || 0);
                  const appSessions = teacher.stats.devoirsFaitsSessions + teacher.stats.rcdSessions;
                  const realise = manualCompleted + appSessions;
                  const progressPercent = totalContrat > 0 ? Math.min(100, Math.round((realise / totalContrat) * 100)) : 0;

                  return (
                    <tr key={teacher.id} className={`hover:bg-gray-50 ${!teacher.inPacte ? 'opacity-50' : ''} ${selectedTeacherIds.has(teacher.id) ? 'bg-amber-50' : ''}`}>
                      <td className="px-2 py-3 text-center">
                        <button
                          onClick={() => toggleTeacherSelection(teacher.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          {selectedTeacherIds.has(teacher.id) ? (
                            <CheckSquare className="w-4 h-4 text-amber-500" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-sm font-medium text-white">
                            {teacher.initials}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{teacher.name}</p>
                            <p className="text-sm text-gray-500">{teacher.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                          teacher.inPacte
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {teacher.inPacte ? 'PACTE' : 'Sans PACTE'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-sm font-medium">
                            {(teacher.pacteHoursCompletedDF || 0) + teacher.stats.devoirsFaitsSessions}h
                            {teacher.inPacte && <span className="text-blue-400"> / {teacher.pacteHoursDF || 0}h</span>}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({teacher.pacteHoursCompletedDF || 0}h + {teacher.stats.devoirsFaitsSessions} sess.)
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-sm font-medium">
                            {(teacher.pacteHoursCompletedRCD || 0) + teacher.stats.rcdSessions}h
                            {teacher.inPacte && <span className="text-purple-400"> / {teacher.pacteHoursRCD || 0}h</span>}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({teacher.pacteHoursCompletedRCD || 0}h + {teacher.stats.rcdSessions} sess.)
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {teacher.inPacte ? (
                          <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-sm font-bold">
                            {totalContrat}h
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {teacher.inPacte ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-sm font-medium">{realise}h / {totalContrat}h</span>
                            <div className="w-full max-w-[100px] bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  progressPercent >= 100 ? 'bg-green-500' :
                                  progressPercent >= 75 ? 'bg-amber-500' :
                                  'bg-blue-500'
                                }`}
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">{progressPercent}%</span>
                          </div>
                        ) : (
                          <div className="text-center">
                            <span className="text-sm font-medium text-gray-600">{realise}h</span>
                            <p className="text-xs text-gray-400">effectuées</p>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => openEditModal(teacher)}
                          className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showContratModal && editingContrat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Modifier le contrat PACTE</h2>
                <button
                  onClick={() => {
                    setShowContratModal(false);
                    setEditingContrat(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Teacher info */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-xl font-medium text-white">
                  {editingContrat.initials}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{editingContrat.name}</h3>
                  <p className="text-sm text-gray-500">{editingContrat.username}</p>
                </div>
              </div>

              {/* Toggle reprise en cours d'annee */}
              <button
                type="button"
                onClick={() => {
                  const newValue = !showPreviousHours;
                  setShowPreviousHours(newValue);
                  if (!newValue) {
                    setContratCompletedDF(0);
                    setContratCompletedRCD(0);
                  }
                }}
                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                  showPreviousHours
                    ? 'bg-amber-50 border-amber-400 text-amber-800'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">Reprise en cours d'annee</span>
                    <p className="text-xs opacity-70">Cliquer si des heures ont ete effectuees avant l'app</p>
                  </div>
                  {showPreviousHours && (
                    <span className="text-amber-600 text-lg">✓</span>
                  )}
                </div>
              </button>

              {/* Section Devoirs Faits */}
              <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                <h4 className="font-medium text-blue-800">Devoirs Faits (DF)</h4>
                <div className={`grid gap-3 ${showPreviousHours ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <div className="space-y-1">
                    <label className="block text-xs text-gray-600">Heures au contrat</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="72"
                        value={contratHoursDF}
                        onChange={(e) => setContratHoursDF(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <span className="text-gray-500 text-sm">h</span>
                    </div>
                  </div>
                  {showPreviousHours && (
                    <div className="space-y-1">
                      <label className="block text-xs text-gray-600">Heures avant l'app</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="72"
                          value={contratCompletedDF}
                          onChange={(e) => setContratCompletedDF(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <span className="text-gray-500 text-sm">h</span>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-blue-600">
                  + {editingContrat.stats.devoirsFaitsSessions} sessions saisies dans l'app
                </p>
              </div>

              {/* Section RCD */}
              <div className="bg-purple-50 p-4 rounded-lg space-y-3">
                <h4 className="font-medium text-purple-800">Remplacement de Courte Duree (RCD)</h4>
                <div className={`grid gap-3 ${showPreviousHours ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <div className="space-y-1">
                    <label className="block text-xs text-gray-600">Heures au contrat</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="72"
                        value={contratHoursRCD}
                        onChange={(e) => setContratHoursRCD(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                      />
                      <span className="text-gray-500 text-sm">h</span>
                    </div>
                  </div>
                  {showPreviousHours && (
                    <div className="space-y-1">
                      <label className="block text-xs text-gray-600">Heures avant l'app</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="72"
                          value={contratCompletedRCD}
                          onChange={(e) => setContratCompletedRCD(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                        />
                        <span className="text-gray-500 text-sm">h</span>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-purple-600">
                  + {editingContrat.stats.rcdSessions} sessions saisies dans l'app
                </p>
              </div>

              {/* Resume */}
              {(() => {
                const totalContrat = contratHoursDF + contratHoursRCD;
                const heuresAvantApp = contratCompletedDF + contratCompletedRCD;
                const sessionsApp = editingContrat.stats.devoirsFaitsSessions + editingContrat.stats.rcdSessions;
                const totalRealise = heuresAvantApp + sessionsApp;
                const reste = Math.max(0, totalContrat - totalRealise);
                return (
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-amber-800 mb-3">Résumé du contrat PACTE</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-2 bg-white rounded-lg">
                        <p className="text-2xl font-bold text-amber-600">{totalContrat}h</p>
                        <p className="text-xs text-gray-600">Total au contrat</p>
                      </div>
                      <div className="text-center p-2 bg-white rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{totalRealise}h</p>
                        <p className="text-xs text-gray-600">Déjà réalisées</p>
                        {showPreviousHours && heuresAvantApp > 0 && (
                          <p className="text-xs text-gray-400">({heuresAvantApp}h avant + {sessionsApp} sess.)</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 text-center">
                      <p className="text-xs text-gray-500">
                        Reste à réaliser : <span className={`font-bold ${reste > 0 ? 'text-amber-700' : 'text-green-600'}`}>
                          {reste}h
                        </span>
                        {reste === 0 && totalContrat > 0 && <span className="ml-1 text-green-600">✓</span>}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setShowContratModal(false);
                  setEditingContrat(null);
                }}
                className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={saveContrat}
                className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && confirmData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmData.title}</h3>
            <p className="text-gray-600 mb-6">{confirmData.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmData(null);
                }}
                className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmData.onConfirm}
                disabled={batchPacteLoading}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                  confirmData.confirmColor === 'green'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {batchPacteLoading ? 'Traitement...' : confirmData.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
