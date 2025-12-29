import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image, File, AlertCircle, Check, Loader2 } from 'lucide-react';

export interface Student {
  lastName: string;
  firstName: string;
  className: string;
}

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onStudentsParsed?: (students: Student[]) => void;
  onUploadComplete?: (url: string) => void;
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onStudentsParsed,
  onUploadComplete,
  acceptedTypes = ['.pdf', '.xlsx', '.xls', '.jpg', '.jpeg', '.png'],
  maxSize = 5,
  disabled = false,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<any>(firstSheet, { header: 1 });

      const students: Student[] = [];

      // Skip header row
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length < 2) continue;

        let lastName = '', firstName = '', className = '';

        if (row.length >= 3) {
          lastName = String(row[0] || '').trim().toUpperCase();
          firstName = formatFirstName(String(row[1] || '').trim());
          className = String(row[2] || '').trim().toUpperCase();
        } else if (row.length === 2) {
          const parts = String(row[0]).trim().split(/\s+/);
          lastName = parts[0]?.toUpperCase() || '';
          firstName = formatFirstName(parts.slice(1).join(' '));
          className = String(row[1] || '').trim().toUpperCase();
        }

        if (lastName) {
          students.push({ lastName, firstName, className });
        }
      }

      if (students.length > 0 && onStudentsParsed) {
        onStudentsParsed(students);
        setSuccess(true);
      }
    } catch (err) {
      console.error('Excel parsing error:', err);
      setError('Erreur lors de la lecture du fichier Excel');
    }
  };

  const formatFirstName = (name: string): string => {
    if (!name) return '';
    return name.split(/[\s-]+/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setError(null);
    setSuccess(false);
    setUploadProgress(0);
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
    </div>
  );
};

export default FileUpload;
