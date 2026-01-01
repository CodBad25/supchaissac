import { Router } from 'express';
import { db } from '../../src/lib/db';
import { users, sessions } from '../../src/lib/schema';
import { eq, and, gte, lte, count, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const router = Router();

// Middleware pour vérifier le rôle admin
const requireAdmin = (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
};

// GET /api/admin/stats - Statistiques globales
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    // Compter les utilisateurs par rôle
    const allUsers = await db.select().from(users);
    const teachers = allUsers.filter(u => u.role === 'TEACHER');
    const teachersWithPacte = teachers.filter(u => u.inPacte);

    // Année scolaire en cours
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const schoolYearStart = month >= 8 ? `${year}-09-01` : `${year - 1}-09-01`;
    const schoolYearEnd = month >= 8 ? `${year + 1}-08-31` : `${year}-08-31`;

    // Sessions de l'année scolaire
    const allSessions = await db
      .select()
      .from(sessions)
      .where(
        and(
          gte(sessions.date, schoolYearStart),
          lte(sessions.date, schoolYearEnd)
        )
      );

    const pendingSessions = allSessions.filter(s =>
      s.status === 'PENDING_REVIEW' || s.status === 'PENDING_VALIDATION'
    );
    const validatedSessions = allSessions.filter(s =>
      s.status === 'VALIDATED' || s.status === 'PAID'
    );

    // Heures par type
    const rcdHours = validatedSessions.filter(s => s.type === 'RCD').length;
    const dfHours = validatedSessions.filter(s => s.type === 'DEVOIRS_FAITS').length;
    const hseHours = validatedSessions.filter(s => s.type === 'HSE').length;
    const autreHours = validatedSessions.filter(s => s.type === 'AUTRE').length;

    res.json({
      totalUsers: allUsers.length,
      totalTeachers: teachers.length,
      teachersWithPacte: teachersWithPacte.length,
      teachersWithoutPacte: teachers.length - teachersWithPacte.length,
      pactePercentage: teachers.length > 0
        ? Math.round((teachersWithPacte.length / teachers.length) * 100)
        : 0,
      totalSessions: allSessions.length,
      pendingSessions: pendingSessions.length,
      validatedSessions: validatedSessions.length,
      totalHours: validatedSessions.length,
      hoursByType: {
        rcd: rcdHours,
        devoirsFaits: dfHours,
        hse: hseHours,
        autre: autreHours,
      },
    });
  } catch (error) {
    console.error('Erreur stats admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/admin/users - Liste des utilisateurs
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        firstName: users.firstName,
        lastName: users.lastName,
        civilite: users.civilite,
        subject: users.subject,
        role: users.role,
        initials: users.initials,
        inPacte: users.inPacte,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.name);

    res.json(allUsers);
  } catch (error) {
    console.error('Erreur liste users:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/admin/users - Créer un utilisateur
router.post('/users', requireAdmin, async (req, res) => {
  try {
    const { username, password, name, firstName, lastName, civilite, subject, role, inPacte } = req.body;

    // Vérifier que le username n'existe pas
    const existing = await db.select().from(users).where(eq(users.username, username));
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Ce nom d\'utilisateur existe déjà' });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password || 'password123', 10);

    // Générer les initiales
    const initials = name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    const [newUser] = await db
      .insert(users)
      .values({
        username,
        password: hashedPassword,
        name,
        firstName,
        lastName,
        civilite,
        subject,
        role: role || 'TEACHER',
        initials,
        inPacte: inPacte || false,
      })
      .returning();

    console.log(`[ADMIN] Utilisateur créé: ${name} (${role})`);
    res.json({
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      role: newUser.role,
    });
  } catch (error) {
    console.error('Erreur création user:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PATCH /api/admin/users/:id - Modifier un utilisateur
router.patch('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Ne pas permettre de modifier le mot de passe ici
    delete updates.password;

    await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(users.id, parseInt(id)));

    console.log(`[ADMIN] Utilisateur ${id} modifié`);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur modification user:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/admin/users/:id - Supprimer un utilisateur
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Ne pas permettre de supprimer son propre compte
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({ error: 'Impossible de supprimer votre propre compte' });
    }

    await db.delete(users).where(eq(users.id, parseInt(id)));

    console.log(`[ADMIN] Utilisateur ${id} supprimé`);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression user:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/admin/users/:id/reset-password - Réinitialiser le mot de passe
router.post('/users/:id/reset-password', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const hashedPassword = await bcrypt.hash(newPassword || 'password123', 10);

    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, parseInt(id)));

    console.log(`[ADMIN] Mot de passe réinitialisé pour l'utilisateur ${id}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur reset password:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/admin/import - Import CSV (Pronote)
router.post('/import', requireAdmin, async (req, res) => {
  try {
    const { users: importUsers } = req.body;

    if (!Array.isArray(importUsers)) {
      return res.status(400).json({ error: 'Format invalide' });
    }

    let created = 0;
    let updated = 0;
    let errors: string[] = [];

    for (const userData of importUsers) {
      try {
        const { login, civilite, nom, prenom, email, discipline, classes, statutPacte } = userData;

        // Vérifier si l'utilisateur existe
        const existing = await db.select().from(users).where(eq(users.username, login || email));

        const fullName = `${prenom} ${nom}`.trim();
        const initials = `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase();

        if (existing.length > 0) {
          // Mettre à jour
          await db
            .update(users)
            .set({
              name: fullName,
              firstName: prenom,
              lastName: nom,
              civilite: civilite === 'M.' ? 'M.' : civilite === 'Mme' ? 'Mme' : null,
              subject: discipline,
              inPacte: statutPacte?.toUpperCase() === 'OUI',
              updatedAt: new Date(),
            })
            .where(eq(users.id, existing[0].id));
          updated++;
        } else {
          // Créer
          const hashedPassword = await bcrypt.hash('password123', 10);
          await db
            .insert(users)
            .values({
              username: login || email,
              password: hashedPassword,
              name: fullName,
              firstName: prenom,
              lastName: nom,
              civilite: civilite === 'M.' ? 'M.' : civilite === 'Mme' ? 'Mme' : null,
              subject: discipline,
              role: 'TEACHER',
              initials,
              inPacte: statutPacte?.toUpperCase() === 'OUI',
            });
          created++;
        }
      } catch (err: any) {
        errors.push(`Erreur pour ${userData.login || userData.email}: ${err.message}`);
      }
    }

    console.log(`[ADMIN] Import CSV: ${created} créés, ${updated} mis à jour`);
    res.json({
      success: true,
      created,
      updated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Erreur import CSV:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
