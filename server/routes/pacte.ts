import { Router } from 'express';
import { db } from '../../src/lib/db';
import { users, sessions } from '../../src/lib/schema';
import { requireSecretary } from '../middleware/auth';
import { eq, and, sql, count, gte, isNull } from 'drizzle-orm';
import { pacteStatusSchema, pacteContratSchema } from '../validators';
import { logger } from '../utils/logger';

const router = Router();

// Récupérer tous les enseignants avec leurs stats (JOIN SQL, pas de N+1)
router.get('/teachers', requireSecretary, async (req, res) => {
  try {
    // Calculer l'année scolaire en cours
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const schoolYearStart = month >= 8 ? `${year}-09-01` : `${year - 1}-09-01`;

    // Une seule requête avec LEFT JOIN + agrégation
    const teachersWithStats = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        name: users.name,
        username: users.username,
        inPacte: users.inPacte,
        pacteHoursTarget: users.pacteHoursTarget,
        pacteHoursCompleted: users.pacteHoursCompleted,
        pacteHoursDF: users.pacteHoursDF,
        pacteHoursRCD: users.pacteHoursRCD,
        pacteHoursCompletedDF: users.pacteHoursCompletedDF,
        pacteHoursCompletedRCD: users.pacteHoursCompletedRCD,
        totalSessions: sql<number>`count(${sessions.id})::int`,
        currentYearSessions: sql<number>`count(case when ${sessions.date} >= ${schoolYearStart} then 1 end)::int`,
        rcdSessions: sql<number>`count(case when ${sessions.date} >= ${schoolYearStart} and ${sessions.type} = 'RCD' then 1 end)::int`,
        devoirsFaitsSessions: sql<number>`count(case when ${sessions.date} >= ${schoolYearStart} and ${sessions.type} = 'DEVOIRS_FAITS' then 1 end)::int`,
        hseSessions: sql<number>`count(case when ${sessions.date} >= ${schoolYearStart} and ${sessions.type} = 'HSE' then 1 end)::int`,
        validatedSessions: sql<number>`count(case when ${sessions.date} >= ${schoolYearStart} and ${sessions.status} in ('VALIDATED', 'SENT_FOR_PAYMENT') then 1 end)::int`,
      })
      .from(users)
      .leftJoin(sessions, and(eq(sessions.teacherId, users.id), isNull(sessions.deletedAt)))
      .where(eq(users.role, 'TEACHER'))
      .groupBy(users.id);

    const result = teachersWithStats.map(t => ({
      id: t.id,
      name: `${t.firstName || ''} ${t.lastName || t.name}`.trim(),
      username: t.username,
      initials: `${(t.firstName || '')[0] || ''}${(t.lastName || t.name || '')[0] || ''}`.toUpperCase(),
      inPacte: t.inPacte || false,
      pacteHoursTarget: t.pacteHoursTarget || 0,
      pacteHoursCompleted: t.pacteHoursCompleted || 0,
      pacteHoursDF: t.pacteHoursDF || 0,
      pacteHoursRCD: t.pacteHoursRCD || 0,
      pacteHoursCompletedDF: t.pacteHoursCompletedDF || 0,
      pacteHoursCompletedRCD: t.pacteHoursCompletedRCD || 0,
      stats: {
        totalSessions: t.totalSessions,
        currentYearSessions: t.currentYearSessions,
        rcdSessions: t.rcdSessions,
        devoirsFaitsSessions: t.devoirsFaitsSessions,
        hseSessions: t.hseSessions,
        validatedSessions: t.validatedSessions,
      }
    }));

    res.json(result);
  } catch (error) {
    logger.error('Erreur récupération enseignants:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Statistiques PACTE globales
router.get('/statistics', requireSecretary, async (req, res) => {
  try {
    const allTeachers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'TEACHER'));

    const teachersWithPacte = allTeachers.filter(t => t.inPacte);
    const teachersWithoutPacte = allTeachers.filter(t => !t.inPacte);

    // Recuperer toutes les sessions
    const allSessions = await db.select().from(sessions);

    // Sessions des enseignants avec PACTE
    const pacteTeacherIds = new Set(teachersWithPacte.map(t => t.id));
    const sessionsWithPacte = allSessions.filter(s => pacteTeacherIds.has(s.teacherId));
    const sessionsWithoutPacte = allSessions.filter(s => !pacteTeacherIds.has(s.teacherId));

    const stats = {
      totalTeachers: allTeachers.length,
      teachersWithPacte: teachersWithPacte.length,
      teachersWithoutPacte: teachersWithoutPacte.length,
      pactePercentage: allTeachers.length > 0
        ? Math.round((teachersWithPacte.length / allTeachers.length) * 100)
        : 0,
      sessionsWithPacte: sessionsWithPacte.length,
      sessionsWithoutPacte: sessionsWithoutPacte.length,
      pacteRcd: sessionsWithPacte.filter(s => s.type === 'RCD').length,
      pacteDevoirs: sessionsWithPacte.filter(s => s.type === 'DEVOIRS_FAITS').length,
      pacteHse: sessionsWithPacte.filter(s => s.type === 'HSE').length,
      nonPacteRcd: sessionsWithoutPacte.filter(s => s.type === 'RCD').length,
      nonPacteDevoirs: sessionsWithoutPacte.filter(s => s.type === 'DEVOIRS_FAITS').length,
      nonPacteHse: sessionsWithoutPacte.filter(s => s.type === 'HSE').length,
    };

    res.json(stats);
  } catch (error) {
    logger.error('Erreur statistiques PACTE:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier le statut PACTE d'un enseignant
router.patch('/teachers/:id/status', requireSecretary, async (req, res) => {
  try {
    const teacherId = parseInt(req.params.id);
    if (isNaN(teacherId)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const parseResult = pacteStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Données invalides', details: parseResult.error.errors });
    }

    const { inPacte, pacteHoursTarget } = parseResult.data;

    const [updatedUser] = await db
      .update(users)
      .set({
        inPacte,
        pacteHoursTarget: pacteHoursTarget || 0,
      })
      .where(eq(users.id, teacherId))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({ error: 'Enseignant non trouve' });
    }

    logger.info(`PACTE] Statut mis a jour pour ${updatedUser.name}: inPacte=${inPacte}`);

    res.json({
      success: true,
      message: 'Statut PACTE mis a jour',
      user: updatedUser
    });
  } catch (error) {
    logger.error('Erreur mise a jour PACTE:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier le contrat PACTE d'un enseignant (heures DF, RCD, réalisées)
router.patch('/teachers/:id/contrat', requireSecretary, async (req, res) => {
  try {
    const teacherId = parseInt(req.params.id);
    if (isNaN(teacherId)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const parseResult = pacteContratSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Données invalides', details: parseResult.error.errors });
    }

    const data = parseResult.data;

    const [updatedUser] = await db
      .update(users)
      .set({
        inPacte: data.inPacte,
        pacteHoursTarget: data.pacteHoursTarget || 0,
        pacteHoursCompleted: data.pacteHoursCompleted || 0,
        pacteHoursDF: data.pacteHoursDF || 0,
        pacteHoursRCD: data.pacteHoursRCD || 0,
        pacteHoursCompletedDF: data.pacteHoursCompletedDF || 0,
        pacteHoursCompletedRCD: data.pacteHoursCompletedRCD || 0,
        updatedAt: new Date(),
      })
      .where(eq(users.id, teacherId))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({ error: 'Enseignant non trouve' });
    }

    logger.info(`PACTE] Contrat mis a jour pour ${updatedUser.name}: DF=${pacteHoursDF}h, RCD=${pacteHoursRCD}h`);

    res.json({
      success: true,
      message: 'Contrat PACTE mis a jour',
      user: updatedUser
    });
  } catch (error) {
    logger.error('Erreur mise a jour contrat PACTE:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
