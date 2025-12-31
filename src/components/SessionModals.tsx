import React, { useState, useEffect } from 'react';
import { X, Users, BookOpen, FileText, Sun, Moon, ChevronLeft, Plus, Trash2, AlertTriangle, Copy } from 'lucide-react';
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
  const [description, setDescription] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

            {/* Etape 3: Enseignant remplacé */}
            <div className={`relative transition-all duration-300 ${
              className ? '' : 'opacity-40 pointer-events-none'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                  className ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}>{isDuplicateMode ? '4' : '3'}</div>
                <label className="text-sm font-medium text-gray-700">
                  {replacedPrefix === 'Mme' ? 'Enseignante' : 'Enseignant'}
                </label>
              </div>
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

            {/* Etape 2: Nombre d'eleves */}
            <div className={`relative transition-all duration-500 ${
              formTimeSlot
                ? 'opacity-100 translate-y-0'
                : 'opacity-40 translate-y-2 pointer-events-none'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors duration-300 ${
                  formTimeSlot ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}>2</div>
                <label className="text-sm font-medium text-gray-700">Nombre d'eleves</label>
                {!formTimeSlot && <span className="text-xs text-gray-400 ml-auto">Selectionnez un creneau</span>}
              </div>
              <input
                type="number"
                min="1"
                value={studentCount}
                onChange={e => {
                  const count = parseInt(e.target.value) || 1;
                  setStudentCount(count);
                  generateStudentFields(count);
                }}
                className="w-full min-h-[44px] px-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Etape 3: Document et liste */}
            <div className={`relative transition-all duration-500 ${
              formTimeSlot && studentCount > 0
                ? 'opacity-100 translate-y-0'
                : 'opacity-40 translate-y-2 pointer-events-none'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center transition-colors duration-300 ${
                  formTimeSlot && studentCount > 0 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}>3</div>
                <label className="text-sm font-medium text-gray-700">
                  Document <span className="font-normal text-gray-400">(optionnel)</span>
                </label>
                {!(formTimeSlot && studentCount > 0) && <span className="text-xs text-gray-400 ml-auto">Indiquez le nombre d'eleves</span>}
              </div>
              <FileUpload
                onFileSelect={handleFileSelect}
                onStudentsParsed={handleStudentsParsed}
                acceptedTypes={['.pdf', '.xlsx', '.xls', '.jpg', '.jpeg', '.png']}
                maxSize={5}
              />
            </div>

            {/* Liste des eleves (apparait apres step 3) */}
            {studentsList.length > 0 && formTimeSlot && (
              <div className="relative transition-all duration-500 opacity-100 translate-y-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
                    <Users className="w-3 h-3" />
                  </div>
                  <label className="text-sm font-medium text-gray-700">
                    Liste des eleves ({studentsList.length})
                  </label>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {studentsList.map((student, index) => (
                    <div key={index} className="flex gap-1.5 items-center">
                      <input
                        type="text"
                        value={student.lastName}
                        onChange={e => updateStudentField(index, 'lastName', e.target.value.toUpperCase())}
                        placeholder="NOM"
                        className="flex-1 min-w-0 min-h-[40px] px-2 border border-gray-200 rounded-lg text-sm bg-gray-50 uppercase"
                      />
                      <input
                        type="text"
                        value={student.firstName}
                        onChange={e => updateStudentField(index, 'firstName', formatFirstName(e.target.value))}
                        placeholder="Prenom"
                        className="flex-1 min-w-0 min-h-[40px] px-2 border border-gray-200 rounded-lg text-sm bg-gray-50"
                      />
                      <input
                        type="text"
                        value={student.className}
                        onChange={e => updateStudentField(index, 'className', e.target.value.toUpperCase())}
                        placeholder="Cl."
                        className="w-12 min-h-[40px] px-1 border border-gray-200 rounded-lg text-sm bg-gray-50 text-center"
                      />
                      <button onClick={() => removeStudent(index)}
                        className="w-10 h-10 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center flex-shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={addStudent}
                  className={`w-full mt-2 ${touchBtn} border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:bg-gray-50 rounded-xl`}>
                  <Plus className="w-4 h-4 mr-1" /> Ajouter un eleve
                </button>
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
              className={`${touchBtn} flex-1 px-4 bg-blue-500 text-white hover:bg-blue-600`}>
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
                  {studentsList.length > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                      <div className="text-xs text-gray-500 mb-2">Liste des élèves</div>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {studentsList.map((student, i) => (
                          <div key={i} className="text-sm text-gray-700">
                            {student.lastName} {student.firstName} {student.className && `(${student.className})`}
                          </div>
                        ))}
                      </div>
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
