import { Router, Request, Response } from 'express';
import multer from 'multer';
import { uploadFile, deleteFile, validateFile, isStorageConfigured, getSignedDownloadUrl } from '../services/storage';
import { parseStudentList, isValidExcelFile } from '../services/excelParser';
import { db } from '../../src/lib/db';
import { attachments, sessions } from '../../src/lib/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Configuration multer (stockage memoire)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
});

/**
 * POST /api/attachments/upload/:sessionId
 * Upload un fichier pour une session
 */
router.post('/upload/:sessionId', upload.single('file'), async (req: Request, res: Response) => {
  try {
    // Verifier si le storage est configure
    if (!isStorageConfigured()) {
      return res.status(503).json({
        error: 'Service de stockage non configure',
        message: 'Contactez l\'administrateur'
      });
    }

    const sessionId = parseInt(req.params.sessionId);
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: 'ID de session invalide' });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    // Valider le fichier
    const validationError = validateFile(file.mimetype, file.size, file.originalname);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Upload vers Scaleway
    const result = await uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
      sessionId
    );

    // Recuperer l'utilisateur connecte
    const user = req.user as any;
    const uploadedBy = user?.name || user?.username || 'Inconnu';

    // Sauvegarder en base de donnees
    const [attachment] = await db.insert(attachments).values({
      sessionId,
      filename: result.path,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: result.url,
      uploadedBy,
    }).returning();

    // Si c'est un Excel, parser et retourner la liste des eleves
    let students = null;
    if (isValidExcelFile(file.mimetype, file.originalname)) {
      try {
        const parseResult = parseStudentList(file.buffer);
        students = parseResult.students;
        console.log(`[UPLOAD] Excel parse: ${parseResult.successCount} eleves extraits`);
      } catch (err) {
        console.error('[UPLOAD] Erreur parsing Excel:', err);
      }
    }

    console.log(`[UPLOAD] Fichier uploade: ${file.originalname} -> ${result.url}`);

    res.json({
      success: true,
      attachment: {
        id: attachment.id,
        url: result.url,
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      },
      students, // null si pas un Excel
    });

  } catch (error) {
    console.error('[UPLOAD] Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'upload',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * PATCH /api/attachments/:id/verify
 * Marque une piece jointe comme verifiee
 */
router.patch('/:id/verify', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    // Verifier que l'attachment existe
    const [existing] = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, id))
      .limit(1);

    if (!existing) {
      return res.status(404).json({ error: 'Fichier non trouve' });
    }

    // Mettre a jour isVerified
    const [updated] = await db
      .update(attachments)
      .set({ isVerified: true })
      .where(eq(attachments.id, id))
      .returning();

    console.log(`[VERIFY] Fichier verifie: ${updated.originalName}`);

    res.json({
      success: true,
      attachment: updated
    });

  } catch (error) {
    console.error('[VERIFY] Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors de la verification',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * DELETE /api/attachments/:id
 * Supprime un fichier
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    // Recuperer l'attachment
    const [attachment] = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, id))
      .limit(1);

    if (!attachment) {
      return res.status(404).json({ error: 'Fichier non trouve' });
    }

    // Supprimer du storage
    try {
      await deleteFile(attachment.filename);
    } catch (err) {
      console.error('[DELETE] Erreur suppression storage:', err);
      // Continuer meme si le fichier n'existe plus dans le storage
    }

    // Supprimer de la base
    await db.delete(attachments).where(eq(attachments.id, id));

    console.log(`[DELETE] Fichier supprime: ${attachment.originalName}`);

    res.json({ success: true });

  } catch (error) {
    console.error('[DELETE] Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors de la suppression',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * GET /api/attachments/session/:sessionId
 * Liste les fichiers d'une session avec URLs signees (valides 1h)
 */
router.get('/session/:sessionId', requireAuth, async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: 'ID de session invalide' });
    }

    const sessionAttachments = await db
      .select()
      .from(attachments)
      .where(eq(attachments.sessionId, sessionId));

    // Generer des URLs signees pour chaque piece jointe (valides 1 heure)
    const attachmentsWithSignedUrls = await Promise.all(
      sessionAttachments.map(async (attachment) => {
        try {
          // Le champ 'filename' contient le chemin S3 (ex: sessions/123/timestamp_file.png)
          // Passer originalName pour forcer le telechargement avec le bon nom
          const signedUrl = await getSignedDownloadUrl(
            attachment.filename,
            3600,
            attachment.originalName // Nom original pour Content-Disposition
          );
          return {
            ...attachment,
            url: signedUrl, // Remplacer l'URL publique par l'URL signee
          };
        } catch (err) {
          console.error(`[LIST] Erreur generation URL signee pour ${attachment.filename}:`, err);
          return attachment; // Retourner l'attachment sans modification en cas d'erreur
        }
      })
    );

    res.json(attachmentsWithSignedUrls);

  } catch (error) {
    console.error('[LIST] Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors de la recuperation des fichiers',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * GET /api/attachments/:id/download-url
 * Genere une URL signee avec nom de fichier explicite (enseignant_date_creneau_nomoriginal)
 */
router.get('/:id/download-url', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    // Recuperer l'attachment avec sa session
    const [attachment] = await db
      .select()
      .from(attachments)
      .where(eq(attachments.id, id))
      .limit(1);

    if (!attachment) {
      return res.status(404).json({ error: 'Fichier non trouve' });
    }

    // Recuperer la session pour avoir les infos enseignant/date/creneau
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, attachment.sessionId))
      .limit(1);

    // Construire le nom explicite
    let explicitFilename = attachment.originalName;
    if (session) {
      const teacherName = session.teacherName?.replace(/\s+/g, '_') || 'Enseignant';
      const date = session.date ? session.date.replace(/-/g, '') : '';
      const slot = session.timeSlot || '';
      const ext = attachment.originalName.split('.').pop() || '';
      const baseName = attachment.originalName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
      explicitFilename = `${teacherName}_${date}_${slot}_${baseName}.${ext}`;
    }

    // Generer URL signee avec le nom explicite
    const signedUrl = await getSignedDownloadUrl(
      attachment.filename,
      3600,
      explicitFilename
    );

    res.json({
      url: signedUrl,
      filename: explicitFilename
    });

  } catch (error) {
    console.error('[DOWNLOAD-URL] Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors de la generation de l\'URL',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

/**
 * POST /api/attachments/parse-excel
 * Parse un fichier Excel sans le sauvegarder (preview)
 */
router.post('/parse-excel', requireAuth, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    if (!isValidExcelFile(file.mimetype, file.originalname)) {
      return res.status(400).json({ error: 'Le fichier doit etre un fichier Excel (.xlsx, .xls)' });
    }

    const result = parseStudentList(file.buffer);

    res.json({
      success: true,
      students: result.students,
      totalRows: result.totalRows,
      successCount: result.successCount,
      errors: result.errors,
    });

  } catch (error) {
    console.error('[PARSE] Erreur:', error);
    res.status(500).json({
      error: 'Erreur lors du parsing',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

export default router;
