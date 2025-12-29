import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Configuration Scaleway Object Storage (compatible S3)
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'https://s3.fr-par.scw.cloud',
  region: process.env.S3_REGION || 'fr-par',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true, // Requis pour Scaleway
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'supchaissac';
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
 * Upload un fichier vers Scaleway Object Storage
 */
export async function uploadFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  sessionId: number
): Promise<UploadResult> {
  // Generer un nom unique
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const path = `sessions/${sessionId}/${timestamp}_${sanitizedFilename}`;

  // Upload vers S3
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: path,
    Body: buffer,
    ContentType: mimeType,
    ACL: 'public-read', // Fichiers accessibles publiquement
  });

  await s3Client.send(command);

  // Construire l'URL publique
  const url = `${process.env.S3_ENDPOINT}/${BUCKET_NAME}/${path}`;

  return {
    url,
    path,
    filename: sanitizedFilename,
    size: buffer.length,
    mimeType,
  };
}

/**
 * Supprime un fichier du storage
 */
export async function deleteFile(path: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: path,
  });

  await s3Client.send(command);
}

/**
 * Genere une URL signee pour acces temporaire (optionnel)
 */
export async function getSignedDownloadUrl(path: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: path,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Verifie si le storage est configure
 */
export function isStorageConfigured(): boolean {
  return !!(
    process.env.S3_ENDPOINT &&
    process.env.S3_ACCESS_KEY_ID &&
    process.env.S3_SECRET_ACCESS_KEY &&
    process.env.S3_BUCKET_NAME
  );
}
