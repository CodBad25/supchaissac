import { useState } from 'react';
import { X, Printer, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

interface RecapModalProps {
  open: boolean;
  onClose: () => void;
  /** Pour la secrétaire : liste d'enseignants à choisir */
  teachers?: { id: number; firstName: string; lastName: string; civilite?: string; subject?: string; inPacte?: boolean }[];
  /** Pour l'enseignant : son propre profil (pas de sélection) */
  currentTeacher?: { id: number; firstName: string; lastName: string; civilite?: string; subject?: string; inPacte?: boolean };
  /** Toutes les sessions (seront filtrées par mois + enseignant) */
  sessions: {
    id: number;
    date: string;
    timeSlot: string;
    type: 'RCD' | 'DEVOIRS_FAITS' | 'AUTRE' | 'HSE';
    status: string;
    teacherId: number;
    teacherName?: string;
    className?: string;
    studentCount?: number;
    gradeLevel?: string;
    description?: string;
    replacedTeacherPrefix?: string;
    replacedTeacherFirstName?: string;
    replacedTeacherLastName?: string;
    subject?: string;
    comment?: string;
    createdAt?: string;
    validatedAt?: string;
  }[];
}

export default function RecapModal({ open, onClose, teachers, currentTeacher, sessions }: RecapModalProps) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(currentTeacher?.id ?? null);
  const [generating, setGenerating] = useState(false);

  if (!open) return null;

  const isSecretary = !!teachers && teachers.length > 0;

  // Filtrer les sessions pour le mois/année sélectionnés + enseignant
  const filteredSessions = sessions.filter(s => {
    const [y, m] = s.date.split('-').map(Number);
    const matchMonth = m - 1 === selectedMonth && y === selectedYear;
    if (isSecretary) {
      return matchMonth && (selectedTeacherId === null || s.teacherId === selectedTeacherId);
    }
    return matchMonth;
  });

  // Grouper par enseignant (pour la secrétaire)
  const sessionsByTeacher = new Map<number, typeof filteredSessions>();
  filteredSessions.forEach(s => {
    const list = sessionsByTeacher.get(s.teacherId) || [];
    list.push(s);
    sessionsByTeacher.set(s.teacherId, list);
  });

  const prevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Import dynamique pour ne pas alourdir le bundle initial
      const { generateRecapPDF } = await import('./RecapitulatifPDF');

      if (isSecretary && selectedTeacherId === null) {
        // Générer un PDF par enseignant qui a des sessions ce mois
        for (const [teacherId, teacherSessions] of sessionsByTeacher) {
          const teacherInfo = teachers!.find(t => t.id === teacherId);
          if (!teacherInfo || teacherSessions.length === 0) continue;
          await generateRecapPDF(teacherInfo, teacherSessions, selectedMonth, selectedYear);
        }
      } else {
        // Un seul enseignant
        const teacher = isSecretary
          ? teachers!.find(t => t.id === selectedTeacherId)!
          : currentTeacher!;
        const teacherSessions = filteredSessions.filter(s =>
          isSecretary ? s.teacherId === selectedTeacherId : true
        );
        await generateRecapPDF(teacher, teacherSessions, selectedMonth, selectedYear);
      }
    } finally {
      setGenerating(false);
    }
  };

  // Enseignants avec des sessions ce mois (pour la secrétaire)
  const teachersWithSessions = isSecretary
    ? teachers!.filter(t => sessionsByTeacher.has(t.id)).sort((a, b) => a.lastName.localeCompare(b.lastName))
    : [];

  const canGenerate = isSecretary
    ? (selectedTeacherId !== null ? filteredSessions.some(s => s.teacherId === selectedTeacherId) : sessionsByTeacher.size > 0)
    : filteredSessions.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Printer className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Récapitulatif mensuel</h2>
              <p className="text-sm text-gray-500">Générer un PDF à imprimer</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Sélecteur de mois */}
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
              Mois
            </label>
            <div className="flex items-center justify-center gap-4 bg-gray-50 rounded-xl p-3">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
                {MONTHS[selectedMonth]} {selectedYear}
              </span>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Sélection enseignant (secrétaire uniquement) */}
          {isSecretary && (
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 block">
                Enseignant
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedTeacherId(null)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedTeacherId === null
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tous ({sessionsByTeacher.size})
                </button>
                {teachersWithSessions.map(t => {
                  const count = sessionsByTeacher.get(t.id)?.length || 0;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTeacherId(t.id)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedTeacherId === t.id
                          ? 'bg-amber-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {t.lastName} ({count})
                    </button>
                  );
                })}
              </div>
              {selectedTeacherId === null && sessionsByTeacher.size > 0 && (
                <p className="text-xs text-gray-500 mt-2 italic">
                  Un PDF sera généré pour chaque enseignant ayant des sessions ce mois.
                </p>
              )}
            </div>
          )}

          {/* Résumé */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Sessions trouvées</span>
              <span className="text-lg font-bold text-gray-900">
                {selectedTeacherId !== null
                  ? filteredSessions.filter(s => s.teacherId === selectedTeacherId).length
                  : filteredSessions.length}
              </span>
            </div>
            {isSecretary && selectedTeacherId === null && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-gray-600">Enseignants concernés</span>
                <span className="text-lg font-bold text-gray-900">{sessionsByTeacher.size}</span>
              </div>
            )}
          </div>

          {/* Bouton générer */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || generating}
            className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm transition-all ${
              canGenerate && !generating
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg hover:shadow-amber-500/25 hover:-translate-y-0.5'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Génération en cours…
              </>
            ) : (
              <>
                <Printer className="w-5 h-5" />
                {isSecretary && selectedTeacherId === null
                  ? `Générer ${sessionsByTeacher.size} PDF`
                  : 'Générer le PDF'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
