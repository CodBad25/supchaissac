import { Router } from 'express';
import { db } from '../../src/lib/db';
import { users, sessions } from '../../src/lib/schema';
import { eq, and, gte, lte, count, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import multer from 'multer';
import iconv from 'iconv-lite';
import { generateActivationToken, sendActivationEmail, isAcademicEmail, getActivationLink, isEmailEnabled } from '../services/email';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Decoder le buffer CSV (gere Windows-1252, UTF-8, etc.)
function decodeCSVBuffer(buffer: Buffer): string {
  const utf8Content = buffer.toString('utf-8');
  const hasReplacementChars = utf8Content.includes('\ufffd');
  const hasBrokenAccents = /Ã©|Ã¨|Ã |Ã¹|Ãª|Ã®|Ã´|Ã»|Ã§|Ã‰|Ã€/.test(utf8Content);

  if (hasReplacementChars || hasBrokenAccents) {
    try {
      return iconv.decode(buffer, 'win1252');
    } catch {
      try {
        return iconv.decode(buffer, 'iso-8859-1');
      } catch {
        return utf8Content;
      }
    }
  }
  return utf8Content;
}

// Parser CSV enseignants
function parseTeacherCSV(content: string): { headers: string[]; rows: Record<string, string>[] } {
  let cleanContent = content.replace(/^\uFEFF/, '').replace(/^\xEF\xBB\xBF/, '');
  const lines = cleanContent.split(/\r?\n/).filter(line => line.trim());

  if (lines.length === 0) return { headers: [], rows: [] };

  const firstLine = lines[0];
  let separator = ';';
  if (firstLine.includes('\t')) separator = '\t';
  else if (firstLine.includes(';')) separator = ';';
  else if (firstLine.includes(',')) separator = ',';

  const headers = firstLine.split(separator).map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim().replace(/^"|"$/g, ''));
    if (values.length >= 2 && values.some(v => v)) {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }
  }

  return { headers, rows };
}

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
        isActivated: users.isActivated,
        activationTokenExpiry: users.activationTokenExpiry,
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

// POST /api/admin/import-teachers-csv - Import CSV enseignants (fichier)
router.post('/import-teachers-csv', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const content = decodeCSVBuffer(req.file.buffer);
    const { headers, rows } = parseTeacherCSV(content);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Fichier CSV vide ou invalide' });
    }

    console.log(`[ADMIN] Import CSV enseignants: ${rows.length} lignes, headers:`, headers);

    let created = 0;
    let skipped = 0;
    let errors: { line: number; reason: string }[] = [];
    const skippedNames: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        // Detecter les colonnes (format Pronote)
        const civilite = row['CIVILITE'] || row['Civilité'] || row['civilite'] || '';
        const nom = row['NOM'] || row['Nom'] || row['nom'] || '';
        const prenom = row['PRENOM'] || row['Prénom'] || row['prenom'] || '';
        const email = row['EMAIL'] || row['Email'] || row['email'] || row['LOGIN'] || '';
        const discipline = row['DISCIPLINE'] || row['MATIERE_PREF'] || row['Discipline'] || row['Matière'] || '';
        const statutPacte = row['PACTE'] || row['pacte'] || row['Statut_PACTE'] || '';

        // Validation: nom, prenom et email obligatoires
        if (!nom || !prenom || !email) {
          errors.push({ line: i + 2, reason: 'Données manquantes (nom, prénom ou email)' });
          continue;
        }

        // Verifier si l'utilisateur existe deja (par email)
        const existing = await db.select().from(users).where(eq(users.username, email)).limit(1);

        if (existing.length > 0) {
          skipped++;
          skippedNames.push(`${prenom} ${nom}`);
          console.log(`[ADMIN] Enseignant ignoré (existe déjà): ${prenom} ${nom} (${email})`);
          continue;
        }

        // Creer le nouvel enseignant
        const fullName = `${prenom} ${nom}`.trim();
        const initials = `${prenom?.[0] || ''}${nom?.[0] || ''}`.toUpperCase();
        const hashedPassword = await bcrypt.hash('password123', 10);

        await db.insert(users).values({
          username: email,
          password: hashedPassword,
          name: fullName,
          firstName: prenom,
          lastName: nom.toUpperCase(),
          civilite: civilite === 'M.' || civilite === 'M' ? 'M.' : civilite === 'Mme' || civilite === 'Mme.' ? 'Mme' : null,
          subject: discipline || null,
          role: 'TEACHER',
          initials,
          inPacte: statutPacte?.toUpperCase() === 'OUI' || statutPacte === '1' || statutPacte?.toUpperCase() === 'TRUE',
          isActivated: false,
        });

        created++;
        console.log(`[ADMIN] Enseignant créé: ${fullName} (${email})`);

      } catch (err: any) {
        errors.push({ line: i + 2, reason: err.message });
      }
    }

    console.log(`[ADMIN] Import terminé: ${created} créés, ${skipped} ignorés (existants)`);

    res.json({
      success: true,
      created,
      skipped,
      skippedNames: skippedNames.slice(0, 10), // Max 10 noms
      errors: errors.length,
      errorDetails: errors.slice(0, 10),
      headers, // Pour debug
    });
  } catch (error) {
    console.error('[ADMIN] Erreur import CSV:', error);
    res.status(500).json({ error: 'Erreur lors de l\'import' });
  }
});

// POST /api/admin/preview-teachers-csv - Aperçu avant import
router.post('/preview-teachers-csv', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const content = decodeCSVBuffer(req.file.buffer);
    const { headers, rows } = parseTeacherCSV(content);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Fichier CSV vide ou invalide' });
    }

    // Extraire les aperçus (format Pronote)
    const preview = rows.slice(0, 5).map(row => ({
      civilite: row['CIVILITE'] || row['Civilité'] || '',
      nom: row['NOM'] || row['Nom'] || '',
      prenom: row['PRENOM'] || row['Prénom'] || '',
      email: row['EMAIL'] || row['Email'] || row['LOGIN'] || '',
      discipline: row['DISCIPLINE'] || row['MATIERE_PREF'] || row['Discipline'] || '',
      pacte: row['PACTE'] || row['pacte'] || '',
    }));

    // Compter les emails existants
    const allEmails = rows.map(row =>
      row['EMAIL'] || row['Email'] || row['LOGIN'] || ''
    ).filter(e => e);

    let willBeSkipped = 0;
    if (allEmails.length > 0) {
      const existingUsers = await db
        .select({ username: users.username })
        .from(users);

      const existingEmails = new Set(existingUsers.map(u => u.username.toLowerCase()));
      willBeSkipped = allEmails.filter(e => existingEmails.has(e.toLowerCase())).length;
    }

    res.json({
      headers,
      totalRows: rows.length,
      willBeCreated: rows.length - willBeSkipped,
      willBeSkipped,
      preview,
    });
  } catch (error) {
    console.error('[ADMIN] Erreur preview CSV:', error);
    res.status(500).json({ error: 'Erreur lors de l\'analyse' });
  }
});

// POST /api/admin/users/:id/send-activation - Envoyer/renvoyer lien d'activation
router.post('/users/:id/send-activation', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer l'utilisateur
    const userData = await db.select().from(users).where(eq(users.id, parseInt(id))).limit(1);

    if (userData.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = userData[0];

    // Vérifier si déjà activé
    if (user.isActivated) {
      return res.status(400).json({ error: 'Ce compte est déjà activé' });
    }

    // Générer un nouveau token (48h d'expiration)
    const token = generateActivationToken();
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 48);

    // Mettre à jour l'utilisateur
    await db
      .update(users)
      .set({
        activationToken: token,
        activationTokenExpiry: expiry,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // Envoyer l'email (ou simuler)
    const result = await sendActivationEmail(user.username, user.name, token);

    console.log(`[ADMIN] Lien d'activation généré pour ${user.name} (${user.username})`);

    res.json({
      success: true,
      message: result.message,
      // En mode présentation, on retourne le lien pour l'afficher dans l'admin
      activationLink: result.link,
      emailEnabled: isEmailEnabled(),
    });
  } catch (error) {
    console.error('Erreur envoi activation:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/admin/email-status - Vérifier si l'envoi d'email est activé
router.get('/email-status', requireAdmin, async (req, res) => {
  res.json({
    emailEnabled: isEmailEnabled(),
    message: isEmailEnabled()
      ? 'Envoi d\'emails activé'
      : 'Mode présentation : les liens d\'activation sont affichés dans l\'interface admin',
  });
});

// DELETE /api/admin/sessions/all - Supprimer toutes les sessions
router.delete('/sessions/all', requireAdmin, async (req, res) => {
  try {
    const result = await db.delete(sessions);
    console.log('🗑️ [ADMIN] Toutes les sessions supprimées');
    res.json({ success: true, message: 'Toutes les sessions ont été supprimées' });
  } catch (error) {
    console.error('Erreur suppression sessions:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// DELETE /api/admin/users/all - Supprimer tous les utilisateurs sauf admin
router.delete('/users/all', requireAdmin, async (req, res) => {
  try {
    // D'abord supprimer les sessions (foreign key)
    await db.delete(sessions);
    // Puis supprimer les utilisateurs non-admin
    await db.delete(users).where(sql`${users.role} != 'ADMIN'`);
    console.log('🗑️ [ADMIN] Tous les utilisateurs (sauf admin) supprimés');
    res.json({ success: true, message: 'Tous les utilisateurs (sauf admin) ont été supprimés' });
  } catch (error) {
    console.error('Erreur suppression utilisateurs:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// DELETE /api/admin/reset - Réinitialisation complète (sessions + utilisateurs sauf admin)
router.delete('/reset', requireAdmin, async (req, res) => {
  try {
    // Supprimer toutes les sessions
    const sessionResult = await db.delete(sessions);
    // Supprimer tous les utilisateurs sauf admin
    const userResult = await db.delete(users).where(sql`${users.role} != 'ADMIN'`);
    console.log('🗑️ [ADMIN] Réinitialisation complète effectuée');
    res.json({
      success: true,
      message: 'Base de données réinitialisée (sessions et utilisateurs supprimés, admin conservé)'
    });
  } catch (error) {
    console.error('Erreur réinitialisation:', error);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation' });
  }
});

export default router;
