import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image, File, AlertCircle, Check, Loader2, Users, Filter } from 'lucide-react';

export interface Student {
  lastName: string;
  firstName: string;
  className: string;
}

export interface ExcelParseResult {
  students: Student[];
  detectedColumns: {
    lastName: string | null;
    firstName: string | null;
    className: string | null;
  };
  availableClasses: string[];
  totalRows: number;
}

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onStudentsParsed?: (students: Student[]) => void;
  onUploadComplete?: (url: string) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  disabled?: boolean;
  showStudentSelector?: boolean; // Afficher la modale de selection
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onStudentsParsed,
  onUploadComplete,
  acceptedTypes = ['.pdf', '.xlsx', '.xls', '.jpg', '.jpeg', '.png'],
  maxSize = 5,
  disabled = false,
  showStudentSelector = true,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, _setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Etat pour la selection des eleves
  const [showSelector, setShowSelector] = useState(false);
  const [parseResult, setParseResult] = useState<ExcelParseResult | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [studentLimit, setStudentLimit] = useState<number | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, [disabled]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;

    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [disabled]);

  const validateFile = (file: File): string | null => {
    // Check size
    if (file.size > maxSize * 1024 * 1024) {
      return `Fichier trop volumineux (max ${maxSize}MB)`;
    }

    // Check type
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    const validExt = acceptedTypes.some(t => t.toLowerCase() === ext);
    const validMime = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
    ].includes(file.type);

    if (!validExt && !validMime) {
      return 'Type de fichier non autorise';
    }

    return null;
  };

  const handleFile = async (file: File) => {
    setError(null);
    setSuccess(false);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    // Parse Excel files client-side for preview
    if (file.type.includes('spreadsheet') || file.type.includes('excel') ||
        file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      parseExcelFile(file);
    }
  };

  const parseExcelFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);

      let isExcel = false;
      if (data.length > 4) {
        const header = data.subarray(0, 4);
        isExcel = (header[0] === 0x50 && header[1] === 0x4B && header[2] === 0x03 && header[3] === 0x04) ||
                  (header[0] === 0xD0 && header[1] === 0xCF && header[2] === 0x11 && header[3] === 0xE0);
      }

      if (!isExcel) {
        setError('Format Excel invalide. Veuillez utiliser un fichier .xlsx ou .xls valide.');
        return;
      }

      setError('Parsing côté serveur uniquement. Veuillez uploader le fichier.');

      return;
    } catch (err) {
      console.error('Excel parsing error:', err);
      setError('Erreur lors de la lecture du fichier Excel');
    }
  };

  // Confirmer la selection des eleves
  const confirmSelection = () => {
    if (!parseResult) return;

    let filteredStudents = parseResult.students;

    // Filtrer par classes selectionnees
    if (selectedClasses.size > 0 && selectedClasses.size < parseResult.availableClasses.length) {
      filteredStudents = filteredStudents.filter(s => selectedClasses.has(s.className));
    }

    // Limiter le nombre si specifie
    if (studentLimit && studentLimit > 0) {
      filteredStudents = filteredStudents.slice(0, studentLimit);
    }

    if (onStudentsParsed) {
      onStudentsParsed(filteredStudents);
    }
    setShowSelector(false);
    setSuccess(true);
  };

  // Toggle une classe
  const toggleClass = (className: string) => {
    const newSelected = new Set(selectedClasses);
    if (newSelected.has(className)) {
      newSelected.delete(className);
    } else {
      newSelected.add(className);
    }
    setSelectedClasses(newSelected);
  };

  // Selectionner/Deselectionner tout
  const toggleAllClasses = () => {
    if (selectedClasses.size === parseResult?.availableClasses.length) {
      setSelectedClasses(new Set());
    } else {
      setSelectedClasses(new Set(parseResult?.availableClasses || []));
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
    setShowSelector(false);
    setParseResult(null);
    setSelectedClasses(new Set());
    setStudentLimit(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const getFileIcon = () => {
    if (!selectedFile) return <Upload className="w-8 h-8 text-gray-400" />;
    if (selectedFile.type.startsWith('image/')) return <Image className="w-8 h-8 text-blue-500" />;
    if (selectedFile.type.includes('pdf')) return <FileText className="w-8 h-8 text-red-500" />;
    if (selectedFile.type.includes('sheet') || selectedFile.type.includes('excel') ||
        selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
      return <FileText className="w-8 h-8 text-green-500" />;
    }
    return <File className="w-8 h-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`
          relative p-6 border-2 border-dashed rounded-xl cursor-pointer
          transition-all duration-200 text-center
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
          ${dragActive
            ? 'border-yellow-500 bg-yellow-50 scale-[1.02]'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}
          ${error ? 'border-red-400 bg-red-50' : ''}
          ${success ? 'border-green-400 bg-green-50' : ''}
          active:scale-[0.99]
        `}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={acceptedTypes.join(',')}
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-3">
          {uploading ? (
            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
          ) : success ? (
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          ) : (
            getFileIcon()
          )}

          {selectedFile ? (
            <div className="text-sm">
              <p className="font-medium text-gray-900 truncate max-w-[200px]">
                {selectedFile.name}
              </p>
              <p className="text-gray-500">{formatFileSize(selectedFile.size)}</p>
              {success && (
                <p className="text-green-600 text-xs mt-1">
                  Fichier pret
                </p>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              <p className="font-medium">Glissez un fichier ici</p>
              <p className="text-gray-400 text-xs mt-1">ou cliquez pour selectionner</p>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-xl overflow-hidden">
            <div
              className="h-full bg-yellow-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {/* Remove button */}
        {selectedFile && !uploading && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearFile();
            }}
            className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
          >
            <X className="w-4 h-4 text-red-500" />
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Image Preview */}
      {preview && (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          <img
            src={preview}
            alt="Apercu"
            className="w-full h-48 object-contain bg-gray-50"
          />
        </div>
      )}

      {/* Accepted formats info */}
      <p className="text-xs text-gray-400 text-center">
        PDF, Excel (.xlsx, .xls), Images (jpg, png) - Max {maxSize}MB
      </p>

      {/* Modale de selection des eleves */}
      {showSelector && parseResult && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Selection des eleves</h3>
                    <p className="text-sm text-gray-500">
                      {parseResult.totalRows} eleves detectes
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSelector(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Colonnes detectees */}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 bg-white rounded-full text-gray-600 border">
                  Nom: <span className="font-medium">{parseResult.detectedColumns.lastName || 'Col 1'}</span>
                </span>
                <span className="px-2 py-1 bg-white rounded-full text-gray-600 border">
                  Prenom: <span className="font-medium">{parseResult.detectedColumns.firstName || 'Col 2'}</span>
                </span>
                <span className="px-2 py-1 bg-white rounded-full text-gray-600 border">
                  Classe: <span className="font-medium">{parseResult.detectedColumns.className || 'Col 3'}</span>
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 overflow-y-auto">
              {/* Filtre par classe */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filtrer par classe
                  </label>
                  <button
                    onClick={toggleAllClasses}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    {selectedClasses.size === parseResult.availableClasses.length ? 'Tout desélectionner' : 'Tout selectionner'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {parseResult.availableClasses.map(className => (
                    <button
                      key={className}
                      onClick={() => toggleClass(className)}
                      className={`
                        px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                        ${selectedClasses.has(className)
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                      `}
                    >
                      {className}
                      <span className="ml-1 opacity-70">
                        ({parseResult.students.filter(s => s.className === className).length})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Limite de nombre */}
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Limiter le nombre d'eleves (optionnel)
                </label>
                <div className="flex gap-2">
                  {[null, 5, 10, 15, 20].map(limit => (
                    <button
                      key={limit ?? 'all'}
                      onClick={() => setStudentLimit(limit)}
                      className={`
                        px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                        ${studentLimit === limit
                          ? 'bg-amber-500 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                      `}
                    >
                      {limit ?? 'Tous'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apercu des eleves */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Apercu ({(() => {
                    let filtered = parseResult.students.filter(s =>
                      selectedClasses.size === 0 || selectedClasses.has(s.className)
                    );
                    if (studentLimit) filtered = filtered.slice(0, studentLimit);
                    return filtered.length;
                  })()} eleves)
                </label>
                <div className="max-h-48 overflow-y-auto bg-gray-50 rounded-lg border">
                  {(() => {
                    let filtered = parseResult.students.filter(s =>
                      selectedClasses.size === 0 || selectedClasses.has(s.className)
                    );
                    if (studentLimit) filtered = filtered.slice(0, studentLimit);
                    return filtered.map((student, i) => (
                      <div
                        key={i}
                        className="px-3 py-2 border-b border-gray-100 last:border-0 flex justify-between text-sm"
                      >
                        <span className="font-medium text-gray-900">
                          {student.lastName} {student.firstName}
                        </span>
                        <span className="text-gray-500 text-xs bg-gray-200 px-2 py-0.5 rounded">
                          {student.className || '-'}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowSelector(false)}
                className="flex-1 px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmSelection}
                disabled={selectedClasses.size === 0}
                className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmer la selection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
