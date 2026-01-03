import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Users, BookOpen, FileText, Sun, Moon, ChevronLeft, Plus, Trash2, AlertTriangle, Copy, Upload, Edit3, Camera, Search } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useIsMobile } from '../hooks/useMediaQuery';
import FileUpload from './FileUpload';

// Type Student (defini localement pour eviter probleme d'import)
interface Student {
  lastName: string;
  firstName: string;
  className: string;
}

// Type pour les resultats de recherche
interface StudentSearchResult {
  id: number;
  lastName: string;
  firstName: string;
  className: string;
}

// Type pour les resultats de recherche enseignants
interface TeacherSearchResult {
  id: number;
  firstName: string;
  lastName: string;
  civilite: 'M.' | 'Mme';
  subject: string;
  displayName: string;
}

/**
 * SessionModals - Formulaires de declaration de sessions
 * Design mobile-first "ROYAL" avec animations fluides
 */

interface EditSession {
  id: number;
  type: 'RCD' | 'DEVOIRS_FAITS' | 'AUTRE' | 'HSE';
  date: string;
  timeSlot: string;
  className?: string;
  replacedTeacherPrefix?: string;
  replacedTeacherLastName?: string;
  replacedTeacherFirstName?: string;
  subject?: string;
  gradeLevel?: string;
  studentCount?: number;
  description?: string;
  comment?: string;
}

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  timeSlot: string;
  onSubmit: (sessionData: any) => Promise<void>;
  onUpdate?: (sessionId: number, sessionData: any) => Promise<void>;
  onDelete?: (sessionId: number) => Promise<void>;
  onDuplicate?: (sessionData: any) => void;
  editSession?: EditSession | null;
  duplicateData?: any;
  user: {
    civilite?: 'M.' | 'Mme';
    subject?: string;
    firstName: string;
    lastName: string;
  };
}

const SessionModals: React.FC<SessionModalProps> = ({ isOpen, onClose, date, timeSlot, onSubmit, onUpdate, onDelete, onDuplicate, editSession, duplicateData, user }) => {
  const isMobile = useIsMobile();
  const [step, setStep] = useState<'type' | 'form' | 'confirmation'>('type');
  const [sessionType, setSessionType] = useState<'RCD' | 'DEVOIRS_FAITS' | 'AUTRE' | 'HSE' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [formDate, setFormDate] = useState(date);
  const [formTimeSlot, setFormTimeSlot] = useState(timeSlot);
  const [className, setClassName] = useState('');
  const [replacedPrefix, setReplacedPrefix] = useState<'M.' | 'Mme'>('M.');
  const [replacedName, setReplacedName] = useState('');
  const [replacedFirstName, setReplacedFirstName] = useState('');
  const [studentCount, setStudentCount] = useState(1);
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [justificationMode, setJustificationMode] = useState<'none' | 'excel' | 'manual' | 'photo'>('none');
  const [description, setDescription] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Autocomplete state - recherche globale eleves
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StudentSearchResult[]>([]);
  const [matchingClass, setMatchingClass] = useState<{ name: string; count: number } | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualStudent, setManualStudent] = useState<Student>({ lastName: '', firstName: '', className: '' });
  const [isAddingClass, setIsAddingClass] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Autocomplete state - recherche enseignants (RCD)
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [teacherSearchResults, setTeacherSearchResults] = useState<TeacherSearchResult[]>([]);
  const [showTeacherResults, setShowTeacherResults] = useState(false);
  const teacherSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const teacherSearchInputRef = useRef<HTMLInputElement>(null);

  // Search students for autocomplete (recherche globale nom + prenom)
  const searchStudents = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setMatchingClass(null);
      return;
    }

    try {
      const response = await fetch(`/api/students/search?q=${encodeURIComponent(query)}&limit=15`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.students || []);
        setMatchingClass(data.matchingClass || null);
      }
    } catch (error) {
      console.error('Erreur recherche eleves:', error);
    }
  }, []);

  // Add entire class
  const addEntireClass = useCallback(async (className: string) => {
    setIsAddingClass(true);
    try {
      const response = await fetch(`/api/students/class/${encodeURIComponent(className)}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const classStudents: StudentSearchResult[] = await response.json();

        // Ajouter tous les eleves de la classe (sans doublons)
        setStudentsList(prev => {
          const existingKeys = new Set(prev.map(s => `${s.lastName}-${s.firstName}-${s.className}`));
          const newStudents = classStudents
            .filter(s => !existingKeys.has(`${s.lastName}-${s.firstName}-${s.className}`))
            .map(s => ({ lastName: s.lastName, firstName: s.firstName, className: s.className }));

          // Supprimer les lignes vides et ajouter les nouveaux
          const nonEmpty = prev.filter(s => s.lastName || s.firstName);
          return [...nonEmpty, ...newStudents];
        });

        setSearchQuery('');
        setSearchResults([]);
        setMatchingClass(null);
      }
    } catch (error) {
      console.error('Erreur ajout classe:', error);
    } finally {
      setIsAddingClass(false);
    }
  }, []);

  // Debounced search
  const debouncedSearch = useCallback((query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchStudents(query);
    }, 200);
  }, [searchStudents]);

  // Search teachers for autocomplete (RCD)
  const searchTeachers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setTeacherSearchResults([]);
      setShowTeacherResults(false);
      return;
    }

    try {
      const response = await fetch(`/api/teachers/search?q=${encodeURIComponent(query)}&limit=10`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTeacherSearchResults(data || []);
        setShowTeacherResults(data.length > 0);
      }
    } catch (error) {
      console.error('Erreur recherche enseignants:', error);
    }
  }, []);

  // Debounced teacher search
  const debouncedTeacherSearch = useCallback((query: string) => {
    if (teacherSearchTimeoutRef.current) {
      clearTimeout(teacherSearchTimeoutRef.current);
    }
    teacherSearchTimeoutRef.current = setTimeout(() => {
      searchTeachers(query);
    }, 200);
  }, [searchTeachers]);

  // Handle teacher selection from search results
  const selectTeacher = (teacher: TeacherSearchResult) => {
    setReplacedPrefix(teacher.civilite);
    setReplacedName(teacher.lastName);
    setReplacedFirstName(teacher.firstName);
    setTeacherSearchQuery('');
    setTeacherSearchResults([]);
    setShowTeacherResults(false);
  };

  // Handle student selection from search results
  const addStudentFromSearch = (student: StudentSearchResult) => {
    // Verifier si l'eleve n'est pas deja dans la liste
    const alreadyExists = studentsList.some(
      s => s.lastName === student.lastName && s.firstName === student.firstName && s.className === student.className
    );
    if (alreadyExists) {
      return; // Ne pas ajouter de doublon
    }

    // Remplacer la ligne vide ou ajouter
    const emptyIndex = studentsList.findIndex(s => !s.lastName && !s.firstName);
    if (emptyIndex !== -1) {
      setStudentsList(prev => {
        const updated = [...prev];
        updated[emptyIndex] = {
          lastName: student.lastName,
          firstName: student.firstName,
          className: student.className,
        };
        return updated;
      });
    } else {
      setStudentsList(prev => [...prev, {
        lastName: student.lastName,
        firstName: student.firstName,
        className: student.className,
      }]);
    }

    // Ne PAS fermer le menu - garder les resultats pour ajouts multiples
    // Le menu se fermera quand l'utilisateur clique sur X ou tape autre chose
  };

  // Add manual student
  const addManualStudent = () => {
    if (manualStudent.lastName && manualStudent.firstName) {
      setStudentsList(prev => [...prev, { ...manualStudent }]);
      setManualStudent({ lastName: '', firstName: '', className: '' });
      setShowManualEntry(false);
    }
  };

  const isEditMode = !!editSession;
  const isDuplicateMode = !!duplicateData && !editSession;

  // Animation on open
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);

      if (editSession) {
        // Mode edition: pre-remplir avec les donnees existantes
        setStep('form');
        setSessionType(editSession.type);
        setFormDate(editSession.date);
        setFormTimeSlot(editSession.timeSlot);
        setClassName(editSession.className || '');
        setReplacedPrefix((editSession.replacedTeacherPrefix as 'M.' | 'Mme') || 'M.');
        setReplacedName(editSession.replacedTeacherLastName || '');
        setReplacedFirstName(editSession.replacedTeacherFirstName || '');
        setStudentCount(editSession.studentCount || 1);
        setDescription(editSession.description || '');
        setComment(editSession.comment || '');
      } else if (duplicateData) {
        // Mode duplication: pre-remplir avec les donnees copiees
        setStep('form');
        setSessionType(duplicateData.type);
        setFormDate(''); // L'utilisateur doit choisir la date
        setFormTimeSlot(''); // L'utilisateur doit choisir le créneau
        setClassName(duplicateData.className || '');
        setReplacedPrefix((duplicateData.replacedTeacherPrefix as 'M.' | 'Mme') || 'M.');
        setReplacedName(duplicateData.replacedTeacherLastName || '');
        setReplacedFirstName(duplicateData.replacedTeacherFirstName || '');
        setStudentCount(duplicateData.studentCount || 1);
        setStudentsList(duplicateData.studentsList || []);
        setDescription(duplicateData.description || '');
        setComment(duplicateData.comment || '');
      } else {
        // Mode creation: reinitialiser (pas de creneau par defaut pour forcer le choix)
        setStep('type');
        setSessionType(null);
        setFormDate(date);
        setFormTimeSlot('');
        setClassName('');
        setReplacedPrefix('M.');
        setReplacedName('');
        setReplacedFirstName('');
        setStudentCount(1);
        setStudentsList([]);
        setSelectedFile(null);
        setJustificationMode('none');
        setDescription('');
        setComment('');
      }
    }
  }, [isOpen, timeSlot, editSession, duplicateData]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsAnimating(false);
    setSubmitError(null);
    setIsSubmitting(false);
    setTimeout(onClose, 200);
  };

  const handleSelectType = (type: 'RCD' | 'DEVOIRS_FAITS' | 'AUTRE') => {
    setSessionType(type);
    setStep('form');
  };

  const handleGoToConfirmation = () => {
    setStep('confirmation');
  };

  const handleBackToForm = () => {
    setStep('form');
  };

  const handleSubmit = async () => {
    const data: any = {
      type: sessionType,
      date: formDate || date, // Utiliser formDate si défini, sinon date
      timeSlot: formTimeSlot,
    };

    if (sessionType === 'RCD') {
      data.className = className;
      data.replacedTeacherPrefix = replacedPrefix;
      data.replacedTeacherLastName = replacedName;
      data.replacedTeacherFirstName = replacedFirstName;
    } else if (sessionType === 'DEVOIRS_FAITS') {
      data.studentCount = studentCount;
      data.studentsList = studentsList;
      if (selectedFile) {
        data.attachment = selectedFile;
      }
    } else if (sessionType === 'AUTRE') {
      data.description = description;
    }

    if (comment) data.comment = comment;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (isEditMode && onUpdate && editSession) {
        await onUpdate(editSession.id, data);
      } else {
        await onSubmit(data);
      }
      handleClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setSubmitError(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (isEditMode && onDelete && editSession) {
      onDelete(editSession.id);
      handleClose();
    }
  };

  const handleDuplicate = () => {
    if (!isEditMode || !onDuplicate || !editSession) return;

    // Préparer les données pour la duplication
    const duplicateDataToSend: any = {
      type: sessionType,
      // Ne pas copier la date et le créneau - l'utilisateur choisira
    };

    if (sessionType === 'RCD') {
      duplicateDataToSend.className = className;
      duplicateDataToSend.replacedTeacherPrefix = replacedPrefix;
      duplicateDataToSend.replacedTeacherLastName = replacedName;
      duplicateDataToSend.replacedTeacherFirstName = replacedFirstName;
    } else if (sessionType === 'DEVOIRS_FAITS') {
      duplicateDataToSend.studentCount = studentCount;
      duplicateDataToSend.studentsList = studentsList;
    } else if (sessionType === 'AUTRE') {
      duplicateDataToSend.description = description;
    }

    if (comment) duplicateDataToSend.comment = comment;

    // Fermer immédiatement (sans animation) puis rouvrir avec les données
    setIsAnimating(false);
    onClose(); // Ferme la modale immédiatement

    // Petit délai pour laisser React mettre à jour le state avant de rouvrir
    setTimeout(() => {
      onDuplicate(duplicateDataToSend);
    }, 50);
  };

  // Student list handlers
  const generateStudentFields = (count: number) => {
    const newStudentsList: Student[] = [];
    for (let i = 0; i < count; i++) {
      newStudentsList.push({ lastName: '', firstName: '', className: '' });
    }
    setStudentsList(newStudentsList);
  };

  const updateStudentField = (index: number, field: keyof Student, value: string) => {
    const updated = [...studentsList];
    updated[index][field] = value;
    setStudentsList(updated);
  };

  const removeStudent = (index: number) => {
    const newList = studentsList.filter((_, i) => i !== index);
    setStudentsList(newList);
    setStudentCount(newList.length);
  };

  const addStudent = () => {
    setStudentsList([...studentsList, { lastName: '', firstName: '', className: '' }]);
    setStudentCount(studentsList.length + 1);
  };

  const formatFirstName = (name: string) => {
    if (!name) return '';
    return name.split(/[\s-]+/).map(part =>
      part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    ).join(' ');
  };

  // Handle file and auto-fill students from Excel
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleStudentsParsed = (students: Student[]) => {
    setStudentsList(students);
    setStudentCount(students.length);
  };

  // ============================================================================
  // STYLES - Mobile-first avec animations
  // ============================================================================
  const overlayClass = isMobile
    ? "fixed inset-0 z-50 bg-black/20 overflow-hidden"
    : "fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-hidden";

  const modalClass = isMobile
    ? `fixed inset-0 z-50 bg-white flex flex-col overflow-x-hidden ${isAnimating ? 'animate-slide-up-full' : 'animate-slide-down-full'}`
    : `bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden ${isAnimating ? 'animate-bounce-in' : ''}`;

  const headerClass = isMobile
    ? "flex items-center gap-3 px-4 py-3 border-b bg-white sticky top-0 z-10"
    : "flex items-center justify-between p-4 border-b";

  const bodyClass = isMobile
    ? "flex-1 overflow-y-auto px-4 py-4 pb-24"
    : "p-4 overflow-y-auto flex-1";

  const footerClass = isMobile
    ? "fixed bottom-0 left-0 right-0 flex gap-3 p-4 bg-white border-t shadow-lg"
    : "flex justify-end gap-3 p-4 border-t bg-gray-50";

  // Touch-friendly button base (min 44px)
  const touchBtn = "min-h-[44px] flex items-center justify-center font-medium rounded-xl transition-all active:scale-[0.98]";

  // ============================================================================
  // TYPE SELECTION
  // ============================================================================
  if (step === 'type') {
    return (
      <div className={overlayClass} onClick={!isMobile ? handleClose : undefined}>
        <div className={modalClass} onClick={e => e.stopPropagation()}>
          {/* Mobile drag handle */}
          {isMobile && (
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
          )}

          <div className={headerClass}>
            {isMobile && (
              <button onClick={handleClose} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">Nouvelle seance</h2>
              <p className="text-sm text-gray-500">
                {date ? format(new Date(date), 'EEEE d MMMM', { locale: fr }) : 'Date a selectionner'} {timeSlot && `- ${timeSlot}`}
              </p>
            </div>
            {!isMobile && (
              <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>

          <div className={bodyClass}>
            <p className="text-sm text-gray-600 mb-4">Selectionnez le type de seance</p>

            <div className="space-y-3">
              {/* RCD */}
              <button
                onClick={() => handleSelectType('RCD')}
                className={`w-full p-4 border-2 border-gray-200 rounded-2xl hover:border-purple-400 hover:bg-purple-50 transition-all text-left flex items-center gap-4 ${touchBtn}`}
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900">RCD - Remplacement</div>
                  <div className="text-sm text-gray-500">Remplacement courte duree</div>
                </div>
              </button>

              {/* Devoirs Faits */}
              <button
                onClick={() => handleSelectType('DEVOIRS_FAITS')}
                className={`w-full p-4 border-2 border-gray-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left flex items-center gap-4 ${touchBtn}`}
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900">Devoirs Faits</div>
                  <div className="text-sm text-gray-500">Accompagnement educatif</div>
                </div>
              </button>

              {/* Autre */}
              <button
                onClick={() => handleSelectType('AUTRE')}
                className={`w-full p-4 border-2 border-gray-200 rounded-2xl hover:border-yellow-400 hover:bg-yellow-50 transition-all text-left flex items-center gap-4 ${touchBtn}`}
              >
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900">Autre activite</div>
                  <div className="text-sm text-gray-500">Activite specifique</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RCD FORM
  // ============================================================================
  if (step === 'form' && sessionType === 'RCD') {
    return (
      <div className={overlayClass} onClick={!isMobile ? handleClose : undefined}>
        <div className={modalClass} onClick={e => e.stopPropagation()}>
          {isMobile && (
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
          )}

          <div className={headerClass}>
            <button onClick={() => setStep('type')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 truncate">RCD</h2>
            </div>
            {!isMobile && (
              <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>

          <div className={bodyClass + " space-y-3"}>
            {/* Mode duplication: Date + Creneau sur une ligne */}
            {isDuplicateMode && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-2 flex items-center gap-2">
                <Copy className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-green-700">Duplication</span>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className={`flex-1 px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-1 ${
                    !formDate ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
              </div>
            )}

            {/* Creneau horaire */}
            <div className={`relative transition-all duration-300 ${
              isDuplicateMode && !formDate ? 'opacity-40 pointer-events-none' : ''
            }`}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-5 h-5 rounded-full bg-purple-500 text-white text-xs font-bold flex items-center justify-center">
                  {isDuplicateMode ? '2' : '1'}
                </div>
                <label className="text-sm font-medium text-gray-700">Creneau</label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center gap-1 mb-1 text-xs text-amber-600 font-medium">
                    <Sun className="w-3 h-3" /> Matin
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {['M1', 'M2', 'M3', 'M4'].map(s => (
                      <button key={s} onClick={() => setFormTimeSlot(s)}
                        className={`min-h-[36px] text-xs font-medium rounded-lg border ${
                          formTimeSlot === s
                            ? 'bg-amber-500 border-amber-500 text-white'
                            : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1 text-xs text-indigo-600 font-medium">
                    <Moon className="w-3 h-3" /> PM
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {['S1', 'S2', 'S3', 'S4'].map(s => (
                      <button key={s} onClick={() => setFormTimeSlot(s)}
                        className={`min-h-[36px] text-xs font-medium rounded-lg border ${
                          formTimeSlot === s
                            ? 'bg-indigo-500 border-indigo-500 text-white'
                            : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Etape 2: Classe */}
            <div className={`relative transition-all duration-300 ${
              formTimeSlot ? '' : 'opacity-40 pointer-events-none'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                  formTimeSlot ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}>{isDuplicateMode ? '3' : '2'}</div>
                <label className="text-sm font-medium text-gray-700">Classe</label>
              </div>
              <div className="space-y-1">
                {[
                  { level: '6e', classes: ['6A', '6B', '6C'], color: '#3b82f6' },
                  { level: '5e', classes: ['5A', '5B', '5C', '5D'], color: '#22c55e' },
                  { level: '4e', classes: ['4A', '4B', '4C', '4D'], color: '#f97316' },
                  { level: '3e', classes: ['3A', '3B', '3C', '3D'], color: '#ef4444' },
                ].map(({ level, classes, color }) => (
                  <div key={level} className="flex items-center gap-1">
                    <span className="text-xs text-gray-400 w-5">{level}</span>
                    <div className="flex gap-1 flex-1">
                      {classes.map(cls => (
                        <button
                          key={cls}
                          onClick={() => setClassName(cls)}
                          className="flex-1 min-h-[32px] text-xs text-white rounded-md"
                          style={{
                            backgroundColor: color,
                            opacity: className === cls ? 1 : 0.6,
                            boxShadow: className === cls ? `0 0 0 2px ${color}` : 'none',
                          }}
                        >
                          {cls}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Etape 3: Enseignant remplacé - avec recherche intelligente */}
            <div className={`relative transition-all duration-300 ${
              className ? '' : 'opacity-40 pointer-events-none'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                  className ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}>{isDuplicateMode ? '4' : '3'}</div>
                <label className="text-sm font-medium text-gray-700">
                  {replacedPrefix === 'Mme' ? 'Enseignante remplacee' : 'Enseignant remplace'}
                </label>
              </div>

              {/* Champ de recherche enseignant */}
              <div className="relative mb-2">
                <input
                  ref={teacherSearchInputRef}
                  type="text"
                  value={teacherSearchQuery}
                  onChange={e => {
                    setTeacherSearchQuery(e.target.value);
                    debouncedTeacherSearch(e.target.value);
                  }}
                  onFocus={() => {
                    if (teacherSearchResults.length > 0) setShowTeacherResults(true);
                  }}
                  placeholder="Rechercher par nom ou prenom..."
                  className="w-full min-h-[36px] pl-9 pr-3 border border-purple-200 rounded-lg text-sm bg-purple-50 focus:border-purple-400 focus:ring-1 focus:ring-purple-200 outline-none"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                {teacherSearchQuery && (
                  <button
                    onClick={() => { setTeacherSearchQuery(''); setTeacherSearchResults([]); setShowTeacherResults(false); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Resultats de recherche enseignants */}
              {showTeacherResults && teacherSearchResults.length > 0 && (
                <div className="mb-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-10">
                  <div className="px-3 py-1.5 bg-purple-50 border-b border-purple-100 text-xs text-purple-600 font-medium">
                    {teacherSearchResults.length} enseignant{teacherSearchResults.length > 1 ? 's' : ''} trouve{teacherSearchResults.length > 1 ? 's' : ''}
                  </div>
                  <div className="divide-y divide-gray-100 max-h-40 overflow-y-auto">
                    {teacherSearchResults.map((teacher) => (
                      <button
                        key={teacher.id}
                        onClick={() => selectTeacher(teacher)}
                        className="w-full px-3 py-2 text-left hover:bg-purple-50 flex items-center justify-between"
                      >
                        <div>
                          <span className="font-medium text-gray-900 text-sm">
                            {teacher.civilite} {teacher.lastName} {teacher.firstName}
                          </span>
                          {teacher.subject && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({teacher.subject})
                            </span>
                          )}
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          teacher.civilite === 'Mme' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {teacher.civilite}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Affichage enseignant selectionne */}
              {replacedName && (
                <div className="mb-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      replacedPrefix === 'Mme' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {replacedPrefix}
                    </span>
                    <span className="font-medium text-gray-900 text-sm">
                      {replacedName} {replacedFirstName}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setReplacedName('');
                      setReplacedFirstName('');
                      setReplacedPrefix('M.');
                    }}
                    className="w-6 h-6 flex items-center justify-center text-red-500 hover:bg-red-100 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Saisie manuelle (si pas de resultat ou preference) */}
              {!replacedName && (
                <>
                  <div className="text-xs text-gray-500 mb-1 text-center">ou saisie manuelle</div>
                  <div className="flex gap-1 mb-2">
                    <button onClick={() => setReplacedPrefix('M.')}
                      className={`min-h-[32px] px-3 text-xs rounded-lg ${
                        replacedPrefix === 'M.'
                          ? 'bg-blue-500 text-white'
                          : 'bg-blue-50 text-blue-600 border border-blue-200'
                      }`}>
                      M.
                    </button>
                    <button onClick={() => setReplacedPrefix('Mme')}
                      className={`min-h-[32px] px-3 text-xs rounded-lg ${
                        replacedPrefix === 'Mme'
                          ? 'bg-pink-500 text-white'
                          : 'bg-pink-50 text-pink-600 border border-pink-200'
                      }`}>
                      Mme
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <input
                      type="text"
                      value={replacedName}
                      onChange={e => setReplacedName(e.target.value.toUpperCase())}
                      placeholder="NOM"
                      className="w-full min-h-[36px] px-2 border border-gray-300 rounded-lg text-sm uppercase focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <input
                      type="text"
                      value={replacedFirstName}
                      onChange={e => setReplacedFirstName(formatFirstName(e.target.value))}
                      placeholder="Prenom"
                      className="w-full min-h-[36px] px-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Commentaire (inline) */}
            <div className={`relative transition-all duration-300 ${
              replacedName ? '' : 'opacity-40 pointer-events-none'
            }`}>
              <input
                type="text"
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Commentaire (optionnel)"
                className="w-full min-h-[36px] px-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className={footerClass}>
            {isEditMode && onDelete && (
              <button
                onClick={() => {
                  if (confirm('Supprimer cette session ?')) {
                    onDelete(editSession!.id);
                    handleClose();
                  }
                }}
                className={`${touchBtn} px-4 bg-red-100 text-red-600 hover:bg-red-200`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            {isEditMode && onDuplicate && (
              <button
                onClick={handleDuplicate}
                className={`${touchBtn} px-4 bg-green-100 text-green-600 hover:bg-green-200`}
                title="Dupliquer cette session"
              >
                <Copy className="w-5 h-5" />
              </button>
            )}
            <button onClick={() => setStep('type')}
              className={`${touchBtn} flex-1 px-4 bg-gray-100 text-gray-700 hover:bg-gray-200`}>
              Retour
            </button>
            <button onClick={handleGoToConfirmation} disabled={!className || !replacedName}
              className={`${touchBtn} flex-1 px-4 bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed`}>
              Continuer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // DEVOIRS FAITS FORM
  // ============================================================================
  if (step === 'form' && sessionType === 'DEVOIRS_FAITS') {
    // Handler pour selectionner le mode de justification
    const selectJustificationMode = (mode: 'excel' | 'manual' | 'photo') => {
      setJustificationMode(mode);
      if (mode === 'manual') {
        // Generer les champs eleves vides
        generateStudentFields(studentCount);
      } else {
        // Effacer la liste si on change de mode
        setStudentsList([]);
      }
      if (mode !== 'excel' && mode !== 'photo') {
        setSelectedFile(null);
      }
    };

    return (
      <div className={overlayClass} onClick={!isMobile ? handleClose : undefined}>
        <div className={modalClass} onClick={e => e.stopPropagation()}>
          {isMobile && (
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
          )}

          <div className={headerClass}>
            <button onClick={() => setStep('type')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 truncate">Devoirs Faits</h2>
            </div>
            {!isMobile && (
              <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>

          <div className={bodyClass + " space-y-5"}>
            {/* Mode duplication: afficher le titre */}
            {isDuplicateMode && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                <Copy className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">Duplication de session</span>
              </div>
            )}

            {/* Etape 0 (duplication): Date */}
            {isDuplicateMode && (
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">1</div>
                  <label className="text-sm font-medium text-gray-700">Date <span className="text-red-500">*</span></label>
                </div>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                    !formDate
                      ? 'border-red-300 focus:ring-red-500 bg-red-50'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {!formDate && (
                  <p className="text-xs text-red-500 mt-1">Selectionnez une date</p>
                )}
              </div>
            )}

            {/* Etape 1: Creneau horaire */}
            <div className={`relative transition-all duration-500 ${
              isDuplicateMode && !formDate
                ? 'opacity-40 translate-y-2 pointer-events-none'
                : ''
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center`}>
                  {isDuplicateMode ? '2' : '1'}
                </div>
                <label className="text-sm font-medium text-gray-700">Creneau horaire</label>
                {isDuplicateMode && !formDate && <span className="text-xs text-gray-400 ml-auto">Selectionnez une date</span>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-1 mb-2 text-xs text-amber-600 font-medium">
                    <Sun className="w-3.5 h-3.5 text-amber-500" /> Matin
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['M1', 'M2', 'M3', 'M4'].map(s => (
                      <button key={s} onClick={() => setFormTimeSlot(s)}
                        className={`${touchBtn} text-sm rounded-lg border ${
                          formTimeSlot === s
                            ? 'bg-amber-500 border-amber-500 text-white'
                            : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-2 text-xs text-indigo-600 font-medium">
                    <Moon className="w-3.5 h-3.5 text-indigo-500" /> Apres-midi
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['S1', 'S2', 'S3', 'S4'].map(s => (
                      <button key={s} onClick={() => setFormTimeSlot(s)}
                        className={`${touchBtn} text-sm rounded-lg border ${
                          formTimeSlot === s
                            ? 'bg-indigo-500 border-indigo-500 text-white'
                            : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Etape 2: Nombre d'eleves (OBLIGATOIRE) */}
            <div className={`relative transition-all duration-500 ${
              formTimeSlot
                ? 'opacity-100 translate-y-0'
                : 'opacity-40 translate-y-2 pointer-events-none'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors duration-300 ${
                  formTimeSlot ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}>{isDuplicateMode ? '3' : '2'}</div>
                <label className="text-sm font-medium text-gray-700">Nombre d'eleves <span className="text-red-500">*</span></label>
                {!formTimeSlot && <span className="text-xs text-gray-400 ml-auto">Selectionnez un creneau</span>}
              </div>
              <input
                type="number"
                min="1"
                value={studentCount}
                onChange={e => {
                  const count = parseInt(e.target.value) || 1;
                  setStudentCount(count);
                  // Si mode manuel actif, regenerer les champs
                  if (justificationMode === 'manual') {
                    generateStudentFields(count);
                  }
                }}
                className="w-full min-h-[44px] px-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Etape 3: Justification (OPTIONNELLE) */}
            <div className={`relative transition-all duration-500 ${
              formTimeSlot && studentCount > 0
                ? 'opacity-100 translate-y-0'
                : 'opacity-40 translate-y-2 pointer-events-none'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors duration-300 ${
                  formTimeSlot && studentCount > 0 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}>{isDuplicateMode ? '4' : '3'}</div>
                <label className="text-sm font-medium text-gray-700">
                  Justification <span className="font-normal text-gray-400">(optionnel)</span>
                </label>
              </div>

              {/* 3 boutons de choix */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                  onClick={() => selectJustificationMode('manual')}
                  className={`${touchBtn} flex-col py-3 px-2 rounded-xl border-2 text-xs ${
                    justificationMode === 'manual'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Edit3 className="w-5 h-5 mb-1" />
                  Saisir noms
                </button>
                <button
                  onClick={() => selectJustificationMode('photo')}
                  className={`${touchBtn} flex-col py-3 px-2 rounded-xl border-2 text-xs ${
                    justificationMode === 'photo'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Camera className="w-5 h-5 mb-1" />
                  Photo/PDF
                </button>
                <button
                  onClick={() => selectJustificationMode('excel')}
                  className={`${touchBtn} flex-col py-3 px-2 rounded-xl border-2 text-xs ${
                    justificationMode === 'excel'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Upload className="w-5 h-5 mb-1" />
                  Import Excel
                </button>
              </div>

              {/* Mode Excel: FileUpload pour Excel uniquement */}
              {justificationMode === 'excel' && (
                <div className="animate-fade-in">
                  <FileUpload
                    onFileSelect={handleFileSelect}
                    onStudentsParsed={handleStudentsParsed}
                    acceptedTypes={['.xlsx', '.xls']}
                    maxSize={5}
                  />
                  {studentsList.length > 0 && (
                    <p className="text-xs text-green-600 mt-2">
                      {studentsList.length} eleves importes depuis le fichier
                    </p>
                  )}
                </div>
              )}

              {/* Mode Photo/PDF: FileUpload pour images et PDF */}
              {justificationMode === 'photo' && (
                <div className="animate-fade-in">
                  <FileUpload
                    onFileSelect={handleFileSelect}
                    onStudentsParsed={() => {}} // Pas de parsing pour photo
                    acceptedTypes={['.pdf', '.jpg', '.jpeg', '.png']}
                    maxSize={5}
                  />
                  {selectedFile && (
                    <p className="text-xs text-purple-600 mt-2">
                      Justificatif: {selectedFile.name}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Liste des eleves (mode manuel ou apres import Excel) */}
            {(justificationMode === 'manual' || (justificationMode === 'excel' && studentsList.length > 0)) && formTimeSlot && (
              <div className="relative transition-all duration-500 opacity-100 translate-y-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
                    <Users className="w-3 h-3" />
                  </div>
                  <label className="text-sm font-medium text-gray-700">
                    Eleves ({studentsList.filter(s => s.lastName || s.firstName).length})
                  </label>
                </div>

                {/* Champ de recherche global */}
                <div className="relative mb-3">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      debouncedSearch(e.target.value);
                    }}
                    placeholder="Nom, prenom ou classe (ex: 6A, 5B...)"
                    className="w-full min-h-[44px] pl-10 pr-4 border border-blue-200 rounded-xl text-sm bg-blue-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                  {searchQuery && (
                    <button
                      onClick={() => { setSearchQuery(''); setSearchResults([]); setMatchingClass(null); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Resultats de recherche */}
                {(searchResults.length > 0 || matchingClass) && (
                  <div className="mb-3 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    {/* Bouton ajouter classe entiere */}
                    {matchingClass && (
                      <button
                        onClick={() => addEntireClass(matchingClass.name)}
                        disabled={isAddingClass}
                        className="w-full px-3 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-left flex items-center justify-between hover:from-blue-600 hover:to-blue-700 disabled:opacity-70"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          <span className="font-medium">
                            {isAddingClass ? 'Ajout en cours...' : `Ajouter toute la classe ${matchingClass.name}`}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 bg-white/20 rounded text-sm">
                          {matchingClass.count} eleves
                        </span>
                      </button>
                    )}
                    {/* Header resultats individuels */}
                    {searchResults.length > 0 && (
                      <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-200 text-xs text-gray-500 font-medium flex items-center justify-between">
                        <span>{matchingClass ? 'Ou ajouter individuellement' : `${searchResults.length} eleve${searchResults.length > 1 ? 's' : ''} trouve${searchResults.length > 1 ? 's' : ''}`}</span>
                        <span className="text-gray-400">Cliquez pour ajouter</span>
                      </div>
                    )}
                    {/* Liste eleves individuels */}
                    {searchResults.length > 0 && (
                      <div className="divide-y divide-gray-100 max-h-32 overflow-y-auto">
                        {searchResults.map((result) => {
                          const isAlreadyAdded = studentsList.some(
                            s => s.lastName === result.lastName && s.firstName === result.firstName && s.className === result.className
                          );
                          return (
                            <button
                              key={result.id}
                              onClick={() => !isAlreadyAdded && addStudentFromSearch(result)}
                              disabled={isAlreadyAdded}
                              className={`w-full px-3 py-1.5 text-left flex items-center justify-between text-sm ${
                                isAlreadyAdded
                                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                  : 'hover:bg-blue-50 text-gray-900'
                              }`}
                            >
                              <span className="font-medium">
                                {result.lastName} {result.firstName}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                isAlreadyAdded ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {isAlreadyAdded ? 'Ajoute' : result.className}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Liste compacte des eleves selectionnes */}
                {studentsList.filter(s => s.lastName || s.firstName).length > 0 && (
                  <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-3 py-2 bg-green-50 border-b border-green-200 flex items-center justify-between">
                      <span className="text-sm font-medium text-green-800">
                        {studentsList.filter(s => s.lastName || s.firstName).length} eleve{studentsList.filter(s => s.lastName || s.firstName).length > 1 ? 's' : ''} selectionne{studentsList.filter(s => s.lastName || s.firstName).length > 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={() => setStudentsList([{ lastName: '', firstName: '', className: '' }])}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Tout effacer
                      </button>
                    </div>
                    <div className="divide-y divide-gray-200 max-h-40 overflow-y-auto">
                      {studentsList.map((student, index) => (
                        student.lastName || student.firstName ? (
                          <div key={index} className="flex items-center justify-between px-3 py-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-medium text-gray-900 text-sm truncate">
                                {student.lastName} {student.firstName}
                              </span>
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium flex-shrink-0">
                                {student.className || '?'}
                              </span>
                            </div>
                            <button
                              onClick={() => removeStudent(index)}
                              className="w-7 h-7 flex items-center justify-center text-red-500 hover:bg-red-100 rounded-lg flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : null
                      ))}
                    </div>
                  </div>
                )}

                {/* Bouton ajout manuel */}
                {justificationMode === 'manual' && !showManualEntry && (
                  <button
                    onClick={() => setShowManualEntry(true)}
                    className="w-full mt-2 py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Saisie manuelle
                  </button>
                )}

                {/* Formulaire saisie manuelle */}
                {showManualEntry && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs text-amber-700 mb-2 font-medium">Saisie manuelle (eleve non trouve)</p>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={manualStudent.lastName}
                        onChange={e => setManualStudent(prev => ({ ...prev, lastName: e.target.value.toUpperCase() }))}
                        placeholder="NOM"
                        className="flex-1 min-h-[36px] px-2 border border-gray-200 rounded-lg text-sm bg-white uppercase"
                      />
                      <input
                        type="text"
                        value={manualStudent.firstName}
                        onChange={e => setManualStudent(prev => ({ ...prev, firstName: formatFirstName(e.target.value) }))}
                        placeholder="Prenom"
                        className="flex-1 min-h-[36px] px-2 border border-gray-200 rounded-lg text-sm bg-white"
                      />
                      <input
                        type="text"
                        value={manualStudent.className}
                        onChange={e => setManualStudent(prev => ({ ...prev, className: e.target.value.toUpperCase() }))}
                        placeholder="Cl."
                        className="w-14 min-h-[36px] px-2 border border-gray-200 rounded-lg text-sm bg-white text-center"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowManualEntry(false); setManualStudent({ lastName: '', firstName: '', className: '' }); }}
                        className="flex-1 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={addManualStudent}
                        disabled={!manualStudent.lastName || !manualStudent.firstName}
                        className="flex-1 py-2 text-sm text-white bg-amber-500 hover:bg-amber-600 rounded-lg disabled:opacity-50"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={footerClass}>
            {isEditMode && onDelete && (
              <button
                onClick={() => {
                  if (confirm('Supprimer cette session ?')) {
                    onDelete(editSession!.id);
                    handleClose();
                  }
                }}
                className={`${touchBtn} px-4 bg-red-100 text-red-600 hover:bg-red-200`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            {isEditMode && onDuplicate && (
              <button
                onClick={handleDuplicate}
                className={`${touchBtn} px-4 bg-green-100 text-green-600 hover:bg-green-200`}
                title="Dupliquer cette session"
              >
                <Copy className="w-5 h-5" />
              </button>
            )}
            <button onClick={() => setStep('type')}
              className={`${touchBtn} flex-1 px-4 bg-gray-100 text-gray-700 hover:bg-gray-200`}>
              Retour
            </button>
            <button onClick={handleGoToConfirmation}
              disabled={!formTimeSlot || studentCount < 1}
              className={`${touchBtn} flex-1 px-4 bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed`}>
              Continuer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // AUTRE FORM
  // ============================================================================
  if (step === 'form' && sessionType === 'AUTRE') {
    return (
      <div className={overlayClass} onClick={!isMobile ? handleClose : undefined}>
        <div className={modalClass} onClick={e => e.stopPropagation()}>
          {isMobile && (
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
          )}

          <div className={headerClass}>
            <button onClick={() => setStep('type')} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-yellow-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 truncate">Autre activite</h2>
            </div>
            {!isMobile && (
              <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </div>

          <div className={bodyClass + " space-y-5"}>
            {/* Mode duplication: afficher le titre */}
            {isDuplicateMode && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                <Copy className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">Duplication de session</span>
              </div>
            )}

            {/* Etape 0 (duplication): Date */}
            {isDuplicateMode && (
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">1</div>
                  <label className="text-sm font-medium text-gray-700">Date <span className="text-red-500">*</span></label>
                </div>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 ${
                    !formDate
                      ? 'border-red-300 focus:ring-red-500 bg-red-50'
                      : 'border-gray-300 focus:ring-yellow-500'
                  }`}
                />
                {!formDate && (
                  <p className="text-xs text-red-500 mt-1">Selectionnez une date</p>
                )}
              </div>
            )}

            {/* Etape 1: Creneau horaire */}
            <div className={`relative transition-all duration-500 ${
              isDuplicateMode && !formDate
                ? 'opacity-40 translate-y-2 pointer-events-none'
                : ''
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center`}>
                  {isDuplicateMode ? '2' : '1'}
                </div>
                <label className="text-sm font-medium text-gray-700">Creneau horaire</label>
                {isDuplicateMode && !formDate && <span className="text-xs text-gray-400 ml-auto">Selectionnez une date</span>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-1 mb-2 text-xs text-amber-600 font-medium">
                    <Sun className="w-3.5 h-3.5 text-amber-500" /> Matin
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['M1', 'M2', 'M3', 'M4'].map(s => (
                      <button key={s} onClick={() => setFormTimeSlot(s)}
                        className={`${touchBtn} text-sm rounded-lg border ${
                          formTimeSlot === s
                            ? 'bg-amber-500 border-amber-500 text-white'
                            : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-2 text-xs text-indigo-600 font-medium">
                    <Moon className="w-3.5 h-3.5 text-indigo-500" /> Apres-midi
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['S1', 'S2', 'S3', 'S4'].map(s => (
                      <button key={s} onClick={() => setFormTimeSlot(s)}
                        className={`${touchBtn} text-sm rounded-lg border ${
                          formTimeSlot === s
                            ? 'bg-indigo-500 border-indigo-500 text-white'
                            : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Etape 2: Description */}
            <div className={`relative transition-all duration-500 ${
              formTimeSlot
                ? 'opacity-100 translate-y-0'
                : 'opacity-40 translate-y-2 pointer-events-none'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors duration-300 ${
                  formTimeSlot ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}>2</div>
                <label className="text-sm font-medium text-gray-700">
                  Description <span className="text-red-500">*</span>
                </label>
                {!formTimeSlot && <span className="text-xs text-gray-400 ml-auto">Selectionnez un creneau</span>}
              </div>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Decrivez l'activite realisee..."
                rows={4}
                className={`w-full px-3 py-3 border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 ${
                  formTimeSlot && !description
                    ? 'border-red-300 focus:ring-red-500 bg-red-50'
                    : 'border-gray-300 focus:ring-yellow-500'
                }`}
              />
              {formTimeSlot && !description && (
                <p className="text-xs text-red-500 mt-1">
                  Une description est requise
                </p>
              )}
            </div>
          </div>

          <div className={footerClass}>
            {isEditMode && onDelete && (
              <button
                onClick={() => {
                  if (confirm('Supprimer cette session ?')) {
                    onDelete(editSession!.id);
                    handleClose();
                  }
                }}
                className={`${touchBtn} px-4 bg-red-100 text-red-600 hover:bg-red-200`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            {isEditMode && onDuplicate && (
              <button
                onClick={handleDuplicate}
                className={`${touchBtn} px-4 bg-green-100 text-green-600 hover:bg-green-200`}
                title="Dupliquer cette session"
              >
                <Copy className="w-5 h-5" />
              </button>
            )}
            <button onClick={() => setStep('type')}
              className={`${touchBtn} flex-1 px-4 bg-gray-100 text-gray-700 hover:bg-gray-200`}>
              Retour
            </button>
            <button onClick={handleGoToConfirmation} disabled={!description}
              className={`${touchBtn} flex-1 px-4 bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed`}>
              Continuer
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // STEP 3: CONFIRMATION
  // ============================================================================
  if (step === 'confirmation' && sessionType) {
    const getTypeLabel = () => {
      switch (sessionType) {
        case 'RCD': return 'Remplacement de Courte Durée';
        case 'DEVOIRS_FAITS': return 'Devoirs Faits';
        case 'AUTRE': return 'Autre activité';
      }
    };

    const getTypeColor = () => {
      switch (sessionType) {
        case 'RCD': return 'bg-purple-500';
        case 'DEVOIRS_FAITS': return 'bg-blue-500';
        case 'AUTRE': return 'bg-amber-500';
      }
    };

    const getTypeBgColor = () => {
      switch (sessionType) {
        case 'RCD': return 'bg-purple-50 border-purple-200';
        case 'DEVOIRS_FAITS': return 'bg-blue-50 border-blue-200';
        case 'AUTRE': return 'bg-amber-50 border-amber-200';
      }
    };

    const sessionDate = isEditMode ? editSession!.date : (formDate || date);

    return (
      <div className={overlayClass} onClick={handleClose}>
        <div className={modalClass} onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className={headerClass}>
            <button onClick={handleBackToForm} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">Confirmation</h2>
            <button onClick={handleClose} className="p-2 -mr-2 rounded-full hover:bg-gray-100">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className={bodyClass}>
            <div className="text-center mb-6">
              <p className="text-gray-600">Veuillez vérifier les informations avant de valider</p>
            </div>

            {/* Résumé de la séance */}
            <div className={`rounded-2xl border-2 p-5 ${getTypeBgColor()}`}>
              {/* Type badge */}
              <div className="flex justify-center mb-4">
                <span className={`px-4 py-2 rounded-full text-white font-medium ${getTypeColor()}`}>
                  {getTypeLabel()}
                </span>
              </div>

              {/* Date et créneau */}
              <div className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">
                      {format(new Date(sessionDate), 'EEEE d MMMM yyyy', { locale: fr })}
                    </span>
                  </div>
                  <span className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
                    {formTimeSlot}
                  </span>
                </div>
              </div>

              {/* Infos spécifiques RCD */}
              {sessionType === 'RCD' && (
                <div className="space-y-3">
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="text-xs text-gray-500 mb-1">Classe</div>
                    <div className="font-semibold text-gray-900">{className}</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="text-xs text-gray-500 mb-1">
                      {replacedPrefix === 'Mme' ? 'Enseignante remplacée' : 'Enseignant remplacé'}
                    </div>
                    <div className="font-semibold text-gray-900">
                      {replacedPrefix} {replacedName} {replacedFirstName}
                    </div>
                  </div>
                </div>
              )}

              {/* Infos spécifiques Devoirs Faits */}
              {sessionType === 'DEVOIRS_FAITS' && (
                <div className="space-y-3">
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="text-xs text-gray-500 mb-1">Nombre d'élèves</div>
                    <div className="font-semibold text-gray-900 text-2xl text-center">{studentCount}</div>
                  </div>
                  {/* Afficher le type de justification */}
                  {justificationMode !== 'none' && (
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Justification</div>
                      <div className="font-medium text-gray-900">
                        {justificationMode === 'excel' && '📊 Import Excel'}
                        {justificationMode === 'manual' && '✏️ Saisie manuelle'}
                        {justificationMode === 'photo' && '📷 Photo/PDF'}
                      </div>
                    </div>
                  )}
                  {/* Liste des élèves si disponible */}
                  {studentsList.length > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                      <div className="text-xs text-gray-500 mb-2">Liste des élèves ({studentsList.length})</div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {studentsList.map((student, i) => (
                          <div key={i} className="text-sm text-gray-700">
                            {student.lastName} {student.firstName} {student.className && `(${student.className})`}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Fichier attaché si mode photo */}
                  {justificationMode === 'photo' && selectedFile && (
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                      <div className="text-xs text-gray-500 mb-1">Fichier joint</div>
                      <div className="text-sm text-purple-600">{selectedFile.name}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Infos spécifiques Autre */}
              {sessionType === 'AUTRE' && (
                <div className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="text-xs text-gray-500 mb-1">Description</div>
                  <div className="font-medium text-gray-900">{description}</div>
                </div>
              )}

              {/* Commentaire si présent */}
              {comment && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 mt-3">
                  <div className="text-xs text-gray-500 mb-1">Commentaire</div>
                  <div className="text-sm text-gray-700 italic">{comment}</div>
                </div>
              )}
            </div>

            {/* Message */}
            <div className="text-center mt-4">
              <p className="text-sm text-gray-500">
                {isEditMode
                  ? "Vous allez modifier cette séance."
                  : "Cette séance sera soumise pour validation."}
              </p>
            </div>

            {/* Delete confirmation dialog */}
            {showDeleteConfirm && (
              <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <div className="flex items-center gap-2 text-red-700 mb-3">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">Supprimer cette séance ?</span>
                </div>
                <p className="text-sm text-red-600 mb-4">
                  Cette action est irréversible. La séance sera définitivement supprimée.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className={`${touchBtn} flex-1 px-3 bg-gray-100 text-gray-700 hover:bg-gray-200`}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDelete}
                    className={`${touchBtn} flex-1 px-3 bg-red-500 text-white hover:bg-red-600`}
                  >
                    Confirmer la suppression
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Message d'erreur */}
          {submitError && (
            <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-medium">{submitError}</p>
            </div>
          )}

          {/* Footer */}
          <div className={footerClass}>
            {isEditMode && onDelete && !showDeleteConfirm && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting}
                className={`${touchBtn} px-4 bg-red-100 text-red-600 hover:bg-red-200 disabled:opacity-50`}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={handleBackToForm}
              disabled={isSubmitting}
              className={`${touchBtn} flex-1 px-4 bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50`}>
              Modifier
            </button>
            <button onClick={handleSubmit}
              disabled={isSubmitting}
              className={`${touchBtn} flex-1 px-4 ${getTypeColor()} text-white hover:opacity-90 disabled:opacity-50`}>
              {isSubmitting ? 'Enregistrement...' : (isEditMode ? 'Confirmer' : 'Valider')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SessionModals;
