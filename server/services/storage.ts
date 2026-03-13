import { promises as fs } from 'fs';
import path from 'path';

// Dossier de stockage local
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Créer le dossier uploads s'il n'existe pas
import { existsSync, mkdirSync } from 'fs';
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Types MIME autorisés
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
];

export interface UploadResult {
  url: string;
  path: string;
  filename: string;
  size: number;
  mimeType: string;
}

/**
 * Valide un fichier avant upload
 */
export function validateFile(mimeType: string, size: number, _filename: string): string | null {
  if (size > MAX_FILE_SIZE) {
    return `Fichier trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024} MB)`;
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return 'Type de fichier non autorisé (PDF, Excel, JPG, PNG uniquement)';
  }

  return null;
}

/**
 * Upload un fichier en local
 */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  sessionId: number
): Promise<UploadResult> {
  const timestamp = Date.now();
  const sanitizedFilename = filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
  const relativePath = `sessions/${sessionId}/${timestamp}_${sanitizedFilename}`;
  const fullPath = path.join(UPLOAD_DIR, relativePath);

  // Créer le dossier si nécessaire
  await fs.mkdir(path.dirname(fullPath), { recursive: true });

  // Écrire le fichier
  await fs.writeFile(fullPath, buffer);

  // URL relative servie par Express
  const url = `/uploads/${relativePath}`;

  return {
    url,
    path: relativePath,
    filename: sanitizedFilename,
    size: buffer.length,
    mimeType,
  };
}

/**
 * Supprime un fichier local
 */
export async function deleteFile(filePath: string): Promise<void> {
  const fullPath = path.join(UPLOAD_DIR, filePath);
  try {
    await fs.unlink(fullPath);
  } catch (err: any) {
    if (err.code !== 'ENOENT') throw err;
    // Fichier déjà supprimé, on ignore
  }
}

/**
 * Retourne l'URL de téléchargement d'un fichier
 * En local, pas besoin de signature — on sert via Express avec auth
 */
export async function getSignedDownloadUrl(
  filePath: string,
  expiresIn = 3600,
  originalFilename?: string
): Promise<string> {
  const params = originalFilename ? `?download=${encodeURIComponent(originalFilename)}` : '';
  return `/uploads/${filePath}${params}`;
}

/**
 * Le stockage local est toujours configuré
 */
export function isStorageConfigured(): boolean {
  return true;
}

/**
 * Retourne le dossier d'uploads
 */
export function getUploadDir(): string {
  return UPLOAD_DIR;
}
