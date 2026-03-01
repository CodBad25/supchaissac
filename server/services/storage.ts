import { promises as fs } from 'fs';
import path from 'path';

// Dossier de stockage local
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Types MIME autorises
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
export function validateFile(mimeType: string, size: number, filename: string): string | null {
  if (size > MAX_FILE_SIZE) {
    return `Fichier trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024} MB)`;
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return 'Type de fichier non autorise (PDF, Excel, JPG, PNG uniquement)';
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

  // Creer le dossier si necessaire
  await fs.mkdir(path.dirname(fullPath), { recursive: true });

  // Ecrire le fichier
  await fs.writeFile(fullPath, buffer);

  // URL relative servie par Express
  const appUrl = process.env.APP_URL || 'http://localhost:3003';
  const url = `${appUrl}/uploads/${relativePath}`;

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
    // Fichier deja supprime, on ignore
  }
}

/**
 * Retourne l'URL de telechargement d'un fichier
 * En local, pas besoin de signature — on sert via Express avec auth
 */
export async function getSignedDownloadUrl(
  filePath: string,
  expiresIn = 3600,
  originalFilename?: string
): Promise<string> {
  const appUrl = process.env.APP_URL || 'http://localhost:3003';
  const params = originalFilename ? `?download=${encodeURIComponent(originalFilename)}` : '';
  return `${appUrl}/uploads/${filePath}${params}`;
}

/**
 * Le stockage local est toujours configure
 */
export function isStorageConfigured(): boolean {
  return true;
}

/**
 * Initialise le dossier uploads
 */
export async function initStorage(): Promise<void> {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}
