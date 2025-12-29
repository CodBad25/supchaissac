import { Router } from 'express';
import { db } from '../../src/lib/db';
import { sessions, insertSessionSchema } from '../../src/lib/schema';
import { requireAuth } from '../middleware/auth';
import { eq, and, desc } from 'drizzle-orm';
import { isBlockedDate } from '../services/holidays';

const router = Router();

// Créer une nouvelle session
router.post('/', requireAuth, async (req, res) => {
  try {
    console.log('📝 [API] Création de session:', req.body);

    // Vérifier que l'utilisateur est authentifié
    if (!req.user) {
      console.log('❌ [API] Utilisateur non authentifié');
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Valider les données avec Zod
    const validationResult = insertSessionSchema.safeParse(req.body);

    if (!validationResult.success) {
      console.error('❌ [API] Validation échouée:', validationResult.error.errors);
      return res.status(400).json({
        error: 'Données invalides',
        details: validationResult.error.errors
      });
    }

    // Vérifier si la date est bloquée (vacances scolaires ou jour férié)
    const sessionDate = new Date(validationResult.data.date);
    const blockedCheck = isBlockedDate(sessionDate);
    if (blockedCheck.isBlocked) {
      console.log(`❌ [API] Date bloquée: ${validationResult.data.date} - ${blockedCheck.reason}`);
      return res.status(400).json({
        error: 'Date non disponible',
        details: `Impossible de créer une session le ${validationResult.data.date} : ${blockedCheck.reason}`
      });
    }

    // Créer la session dans la base de données avec les infos de l'enseignant
    const newSession = await db.insert(sessions).values({
      ...validationResult.data,
      teacherId: req.user.id,
      teacherName: `${req.user.firstName || ''} ${req.user.lastName || req.user.name}`.trim(),
      status: 'PENDING_REVIEW',
    }).returning();

    console.log(`✅ [API] Session créée: ${newSession[0].type} - ${newSession[0].date} (ID: ${newSession[0].id})`);

    res.status(201).json(newSession[0]);

  } catch (error) {
    console.error('❌ [API] Erreur création session:', error);
    res.status(500).json({
      error: 'Erreur lors de la création de la session',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Récupérer toutes les sessions d'un enseignant
router.get('/', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    console.log('📋 [API] Récupération sessions pour:', req.user.name);

    // Récupérer toutes les sessions de l'enseignant, triées par date de création
    const userSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.teacherId, req.user.id))
      .orderBy(desc(sessions.createdAt));

    console.log(`✅ [API] ${userSessions.length} session(s) trouvée(s)`);

    res.json(userSessions);

  } catch (error) {
    console.error('❌ [API] Erreur récupération sessions:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des sessions',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
});

// Récupérer une session spécifique
router.get('/:id', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const sessionId = parseInt(req.params.id);

    if (isNaN(sessionId)) {
      return res.status(400).json({ error: 'ID de session invalide' });
    }

    // Récupérer la session et vérifier qu'elle appartient à l'utilisateur
    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.id, sessionId),
          eq(sessions.teacherId, req.user.id)
        )
      );

    if (!session) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    res.json(session);

  } catch (error) {
    console.error('❌ [API] Erreur récupération session:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier une session existante
router.put('/:id', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const sessionId = parseInt(req.params.id);

    if (isNaN(sessionId)) {
      return res.status(400).json({ error: 'ID de session invalide' });
    }

    // Récupérer la session pour vérifier les permissions
    const [existingSession] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.id, sessionId),
          eq(sessions.teacherId, req.user.id)
        )
      );

    if (!existingSession) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    // Vérifier si la session peut être modifiée (seulement PENDING_REVIEW)
    if (existingSession.status !== 'PENDING_REVIEW') {
      return res.status(403).json({
        error: 'Cette session ne peut plus être modifiée',
        details: `Statut actuel: ${existingSession.status}. Seules les sessions en attente de révision peuvent être modifiées.`
      });
    }

    // Vérifier le délai d'édition (60 minutes)
    const createdAt = new Date(existingSession.createdAt);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));
    const maxEditWindow = 60;

    if (diffMinutes > maxEditWindow) {
      return res.status(403).json({
        error: 'Délai de modification dépassé',
        details: `Cette session a été créée il y a ${diffMinutes} minutes. Le délai maximum est de ${maxEditWindow} minutes.`
      });
    }

    // Valider les données
    const validationResult = insertSessionSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Données invalides',
        details: validationResult.error.errors
      });
    }

    // Vérifier si la nouvelle date est bloquée (vacances scolaires ou jour férié)
    const sessionDate = new Date(validationResult.data.date);
    const blockedCheck = isBlockedDate(sessionDate);
    if (blockedCheck.isBlocked) {
      console.log(`❌ [API] Date bloquée pour modification: ${validationResult.data.date} - ${blockedCheck.reason}`);
      return res.status(400).json({
        error: 'Date non disponible',
        details: `Impossible de déplacer la session vers le ${validationResult.data.date} : ${blockedCheck.reason}`
      });
    }

    // Mettre à jour la session
    const [updatedSession] = await db
      .update(sessions)
      .set({
        ...validationResult.data,
        updatedAt: new Date(),
        updatedBy: req.user.email || req.user.name,
      })
      .where(eq(sessions.id, sessionId))
      .returning();

    console.log(`✅ [API] Session ${sessionId} modifiée par ${req.user.name}`);

    res.json(updatedSession);

  } catch (error) {
    console.error('❌ [API] Erreur modification session:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la modification' });
  }
});

// Supprimer une session
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const sessionId = parseInt(req.params.id);

    if (isNaN(sessionId)) {
      return res.status(400).json({ error: 'ID de session invalide' });
    }

    // Récupérer la session pour vérifier les permissions
    const [existingSession] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.id, sessionId),
          eq(sessions.teacherId, req.user.id)
        )
      );

    if (!existingSession) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    // Vérifier si la session peut être supprimée (seulement PENDING_REVIEW)
    if (existingSession.status !== 'PENDING_REVIEW') {
      return res.status(403).json({
        error: 'Cette session ne peut pas être supprimée',
        details: `Statut actuel: ${existingSession.status}. Seules les sessions en attente de révision peuvent être supprimées.`
      });
    }

    // Supprimer la session
    await db
      .delete(sessions)
      .where(eq(sessions.id, sessionId));

    console.log(`✅ [API] Session ${sessionId} supprimée par ${req.user.name}`);

    res.json({
      success: true,
      message: 'Session supprimée avec succès'
    });

  } catch (error) {
    console.error('❌ [API] Erreur suppression session:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression' });
  }
});

export default router;

