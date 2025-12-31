import { Router } from 'express';
import { db } from '../../src/lib/db';
import { users, sessions } from '../../src/lib/schema';
import { requireSecretary } from '../middleware/auth';
import { eq, and, sql, count } from 'drizzle-orm';

const router = Router();

// Recuperer tous les enseignants avec leurs stats
router.get('/teachers', requireSecretary, async (req, res) => {
  try {
    // Recuperer tous les enseignants
    const allUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'TEACHER'));

    // Pour chaque enseignant, calculer ses stats
    const teachersWithStats = await Promise.all(
      allUsers.map(async (user) => {
        const userSessions = await db
          .select()
          .from(sessions)
          .where(eq(sessions.teacherId, user.id));

        const currentYear = new Date().getFullYear();
        const schoolYearStart = new Date(currentYear, 8, 1); // 1er septembre
        if (new Date().getMonth() < 8) {
          schoolYearStart.setFullYear(currentYear - 1);
        }

        const currentYearSessions = userSessions.filter(
          s => new Date(s.createdAt) >= schoolYearStart
        );

        return {
          id: user.id,
          name: `${user.firstName || ''} ${user.lastName || user.name}`.trim(),
          username: user.email,
          initials: `${(user.firstName || '')[0] || ''}${(user.lastName || user.name || '')[0] || ''}`.toUpperCase(),
          inPacte: user.inPacte || false,
          pacteHoursTarget: user.pacteHoursTarget || 0,
          pacteHoursCompleted: user.pacteHoursCompleted || 0,
          pacteHoursDF: user.pacteHoursDF || 0,
          pacteHoursRCD: user.pacteHoursRCD || 0,
          pacteHoursCompletedDF: user.pacteHoursCompletedDF || 0,
          pacteHoursCompletedRCD: user.pacteHoursCompletedRCD || 0,
          stats: {
            totalSessions: userSessions.length,
            currentYearSessions: currentYearSessions.length,
            rcdSessions: currentYearSessions.filter(s => s.type === 'RCD').length,
            devoirsFaitsSessions: currentYearSessions.filter(s => s.type === 'DEVOIRS_FAITS').length,
            hseSessions: currentYearSessions.filter(s => s.type === 'HSE').length,
            validatedSessions: currentYearSessions.filter(s => s.status === 'VALIDATED' || s.status === 'PAID').length,
          }
        };
      })
    );

    res.json(teachersWithStats);
  } catch (error) {
    console.error('Erreur recuperation enseignants:', error);
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
    console.error('Erreur statistiques PACTE:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier le statut PACTE d'un enseignant
router.patch('/teachers/:id/status', requireSecretary, async (req, res) => {
  try {
    const teacherId = parseInt(req.params.id);
    const { inPacte, pacteHoursTarget } = req.body;

    if (isNaN(teacherId)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        inPacte: inPacte,
        pacteHoursTarget: pacteHoursTarget || 0,
      })
      .where(eq(users.id, teacherId))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({ error: 'Enseignant non trouve' });
    }

    console.log(`[PACTE] Statut mis a jour pour ${updatedUser.name}: inPacte=${inPacte}`);

    res.json({
      success: true,
      message: 'Statut PACTE mis a jour',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erreur mise a jour PACTE:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier le contrat PACTE d'un enseignant (heures DF, RCD, réalisées)
router.patch('/teachers/:id/contrat', requireSecretary, async (req, res) => {
  try {
    const teacherId = parseInt(req.params.id);
    const {
      pacteHoursDF,
      pacteHoursRCD,
      pacteHoursCompletedDF,
      pacteHoursCompletedRCD,
      pacteHoursTarget,
      pacteHoursCompleted,
      inPacte
    } = req.body;

    if (isNaN(teacherId)) {
      return res.status(400).json({ error: 'ID invalide' });
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        inPacte: inPacte,
        pacteHoursTarget: pacteHoursTarget || 0,
        pacteHoursCompleted: pacteHoursCompleted || 0,
        pacteHoursDF: pacteHoursDF || 0,
        pacteHoursRCD: pacteHoursRCD || 0,
        pacteHoursCompletedDF: pacteHoursCompletedDF || 0,
        pacteHoursCompletedRCD: pacteHoursCompletedRCD || 0,
        updatedAt: new Date(),
      })
      .where(eq(users.id, teacherId))
      .returning();

    if (!updatedUser) {
      return res.status(404).json({ error: 'Enseignant non trouve' });
    }

    console.log(`[PACTE] Contrat mis a jour pour ${updatedUser.name}: DF=${pacteHoursDF}h, RCD=${pacteHoursRCD}h`);

    res.json({
      success: true,
      message: 'Contrat PACTE mis a jour',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erreur mise a jour contrat PACTE:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
