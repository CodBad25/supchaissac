import { Router } from 'express';
import { db } from '../../src/lib/db';
import { sessions, insertSessionSchema, users, attachments } from '../../src/lib/schema';
import { requireAuth, requireSecretary, requirePrincipal } from '../middleware/auth';
import { eq, and, desc, or, inArray } from 'drizzle-orm';
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

// ============================================================================
// ROUTES ADMIN - DOIVENT ÊTRE AVANT /:id
// ============================================================================

// Récupérer toutes les sessions (secrétaire/principal/admin)
router.get('/admin/all', requireSecretary, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const { status, type } = req.query;
    const userRole = req.user.role;

    console.log(`📋 [API] Récupération sessions admin par ${req.user.name} (${userRole})`);

    // Requête avec jointure pour récupérer la matière de l'enseignant
    let query = db
      .select({
        id: sessions.id,
        date: sessions.date,
        timeSlot: sessions.timeSlot,
        type: sessions.type,
        teacherId: sessions.teacherId,
        teacherName: sessions.teacherName,
        teacherSubject: users.subject,
        status: sessions.status,
        createdAt: sessions.createdAt,
        updatedAt: sessions.updatedAt,
        updatedBy: sessions.updatedBy,
        className: sessions.className,
        replacedTeacherPrefix: sessions.replacedTeacherPrefix,
        replacedTeacherLastName: sessions.replacedTeacherLastName,
        replacedTeacherFirstName: sessions.replacedTeacherFirstName,
        subject: sessions.subject,
        gradeLevel: sessions.gradeLevel,
        studentCount: sessions.studentCount,
        studentsList: sessions.studentsList,
        description: sessions.description,
        comment: sessions.comment,
        reviewComments: sessions.reviewComments,
        validationComments: sessions.validationComments,
        rejectionReason: sessions.rejectionReason,
        originalType: sessions.originalType,
      })
      .from(sessions)
      .leftJoin(users, eq(sessions.teacherId, users.id));

    // Filtrer par statut si spécifié
    if (status && typeof status === 'string') {
      const statuses = status.split(',') as any[];
      query = query.where(inArray(sessions.status, statuses)) as any;
    }

    // Trier par date de création (plus récent en premier)
    const allSessions = await query.orderBy(desc(sessions.createdAt));

    console.log(`✅ [API] ${allSessions.length} session(s) trouvée(s)`);

    res.json(allSessions);

  } catch (error) {
    console.error('❌ [API] Erreur récupération sessions admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================================================
// ROUTES AVEC PARAMÈTRES
// ============================================================================

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

    const isPrincipal = req.user.role === 'PRINCIPAL';
    const isAdmin = req.user.role === 'ADMIN';

    // Récupérer la session
    const [existingSession] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId));

    if (!existingSession) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    // Vérifier les permissions
    const isOwner = existingSession.teacherId === req.user.id;

    if (isPrincipal || isAdmin) {
      // Principal/Admin peut supprimer n'importe quelle session
      console.log(`🗑️ [API] Principal/Admin ${req.user.name} supprime session ${sessionId}`);
    } else if (isOwner) {
      // Enseignant peut supprimer seulement ses propres sessions en PENDING_REVIEW
      if (existingSession.status !== 'PENDING_REVIEW') {
        return res.status(403).json({
          error: 'Cette session ne peut pas être supprimée',
          details: `Statut actuel: ${existingSession.status}. Seules les sessions en attente de révision peuvent être supprimées.`
        });
      }
    } else {
      return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à supprimer cette session' });
    }

    // Supprimer les pièces jointes associées
    await db
      .delete(attachments)
      .where(eq(attachments.sessionId, sessionId));

    // Supprimer la session
    await db
      .delete(sessions)
      .where(eq(sessions.id, sessionId));

    console.log(`✅ [API] Session ${sessionId} supprimée par ${req.user.name} (${req.user.role})`);

    res.json({
      success: true,
      message: 'Session supprimée avec succès'
    });

  } catch (error) {
    console.error('❌ [API] Erreur suppression session:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression' });
  }
});

// ============================================================================
// ROUTES SECRÉTAIRE / PRINCIPAL - Validation des sessions
// ============================================================================

// Secrétaire OU Principal : Vérifier une session (PENDING_REVIEW → PENDING_VALIDATION)
router.put('/:id/review', requireSecretary, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const sessionId = parseInt(req.params.id);
    const { reviewComments } = req.body;

    if (isNaN(sessionId)) {
      return res.status(400).json({ error: 'ID de session invalide' });
    }

    // Récupérer la session
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId));

    if (!session) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    // Vérifier le statut
    if (session.status !== 'PENDING_REVIEW') {
      return res.status(400).json({
        error: 'Cette session ne peut pas être vérifiée',
        details: `Statut actuel: ${session.status}. Seules les sessions en attente de révision peuvent être vérifiées.`
      });
    }

    // Mettre à jour le statut
    const [updatedSession] = await db
      .update(sessions)
      .set({
        status: 'PENDING_VALIDATION',
        reviewComments: reviewComments || null,
        updatedAt: new Date(),
        updatedBy: req.user.name,
      })
      .where(eq(sessions.id, sessionId))
      .returning();

    console.log(`✅ [API] Session ${sessionId} vérifiée par ${req.user.name} → PENDING_VALIDATION`);

    res.json(updatedSession);

  } catch (error) {
    console.error('❌ [API] Erreur vérification session:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Principal : Valider ou rejeter une session
router.put('/:id/validate', requirePrincipal, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const sessionId = parseInt(req.params.id);
    const { action, validationComments, rejectionReason, conversionType, convertToHSE } = req.body;

    if (isNaN(sessionId)) {
      return res.status(400).json({ error: 'ID de session invalide' });
    }

    if (!action || !['validate', 'reject', 'cancel', 'unpay'].includes(action)) {
      return res.status(400).json({ error: 'Action invalide (validate, reject, cancel ou unpay)' });
    }

    // Récupérer la session
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId));

    if (!session) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    // Vérifier le statut selon l'action
    if (action === 'cancel') {
      // Annuler : seulement pour VALIDATED ou REJECTED
      if (!['VALIDATED', 'REJECTED'].includes(session.status)) {
        return res.status(400).json({
          error: 'Cette session ne peut pas être annulée',
          details: `Statut actuel: ${session.status}. Seules les sessions validées ou rejetées peuvent être annulées.`
        });
      }
    } else if (action === 'unpay') {
      // Retirer de la mise en paiement : seulement pour PAID
      if (session.status !== 'PAID') {
        return res.status(400).json({
          error: 'Cette session ne peut pas être retirée de la mise en paiement',
          details: `Statut actuel: ${session.status}. Seules les sessions en paiement peuvent être retirées.`
        });
      }
    } else {
      // Valider/Rejeter : pour PENDING_VALIDATION ou PENDING_REVIEW (le Principal peut court-circuiter)
      if (!['PENDING_VALIDATION', 'PENDING_REVIEW'].includes(session.status)) {
        return res.status(400).json({
          error: 'Cette session ne peut pas être validée/rejetée',
          details: `Statut actuel: ${session.status}. Seules les sessions en attente peuvent être traitées.`
        });
      }
    }

    // Déterminer le nouveau statut et les champs à mettre à jour
    let newStatus: string;
    let updateData: Record<string, unknown>;

    if (action === 'validate') {
      newStatus = 'VALIDATED';
      updateData = {
        status: newStatus,
        validationComments: validationComments || null,
        rejectionReason: null,
        updatedAt: new Date(),
        updatedBy: req.user.name,
      };

      // Conversion de type si demandée
      if (convertToHSE) {
        // Conversion RCD ou DEVOIRS_FAITS en HSE
        updateData.originalType = session.type; // Sauvegarder le type original
        updateData.type = 'HSE';
        console.log(`📌 [API] Session ${sessionId} convertie de ${session.type} vers HSE`);
      } else if (conversionType && conversionType !== session.type) {
        // Conversion AUTRE vers RCD/DF/HSE (ou autre conversion)
        updateData.originalType = session.type; // Sauvegarder le type original
        updateData.type = conversionType;
        console.log(`📌 [API] Session ${sessionId} convertie de ${session.type} vers ${conversionType}`);
      }
    } else if (action === 'reject') {
      newStatus = 'REJECTED';
      updateData = {
        status: newStatus,
        validationComments: null,
        rejectionReason: rejectionReason || null, // Motif optionnel
        updatedAt: new Date(),
        updatedBy: req.user.name,
      };
    } else if (action === 'unpay') {
      // Retirer de la mise en paiement -> retour a VALIDATED
      newStatus = 'VALIDATED';
      updateData = {
        status: newStatus,
        updatedAt: new Date(),
        updatedBy: req.user.name,
      };
    } else {
      // cancel -> retour a PENDING_VALIDATION
      newStatus = 'PENDING_VALIDATION';
      updateData = {
        status: newStatus,
        validationComments: null,
        rejectionReason: null,
        updatedAt: new Date(),
        updatedBy: req.user.name,
      };
    }

    const [updatedSession] = await db
      .update(sessions)
      .set(updateData)
      .where(eq(sessions.id, sessionId))
      .returning();

    const actionLabels: Record<string, string> = {
      validate: 'validée',
      reject: 'rejetée',
      cancel: 'annulée',
      unpay: 'retirée de la mise en paiement'
    };
    console.log(`✅ [API] Session ${sessionId} ${actionLabels[action]} par ${req.user.name}`);

    res.json(updatedSession);

  } catch (error) {
    console.error('❌ [API] Erreur validation session:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Secrétaire : Mettre une session en paiement
router.put('/:id/mark-paid', requireSecretary, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const sessionId = parseInt(req.params.id);

    if (isNaN(sessionId)) {
      return res.status(400).json({ error: 'ID de session invalide' });
    }

    // Récupérer la session
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId));

    if (!session) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    // Vérifier le statut
    if (session.status !== 'VALIDATED') {
      return res.status(400).json({
        error: 'Cette session ne peut pas être mise en paiement',
        details: `Statut actuel: ${session.status}. Seules les sessions validées peuvent être mises en paiement.`
      });
    }

    // Mettre à jour le statut
    const [updatedSession] = await db
      .update(sessions)
      .set({
        status: 'PAID',
        updatedAt: new Date(),
        updatedBy: req.user.name,
      })
      .where(eq(sessions.id, sessionId))
      .returning();

    console.log(`✅ [API] Session ${sessionId} mise en paiement par ${req.user.name}`);

    res.json(updatedSession);

  } catch (error) {
    console.error('❌ [API] Erreur mise en paiement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

