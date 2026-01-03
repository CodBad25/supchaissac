import { Router } from 'express';
import { db } from '../../src/lib/db';
import { users } from '../../src/lib/schema';
import { requireAuth } from '../middleware/auth';
import { eq, and, or, ilike, asc } from 'drizzle-orm';

const router = Router();

// Normaliser une chaine pour la recherche (supprime accents et met en minuscule)
function normalizeForSearch(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9\s]/g, ''); // Garde que lettres, chiffres, espaces
}

// GET /api/teachers/search - Recherche rapide pour autocomplete (RCD)
router.get('/search', requireAuth, async (req, res) => {
  try {
    const { q, limit = '10' } = req.query;

    if (!q || (q as string).length < 2) {
      return res.json([]);
    }

    const searchTerm = normalizeForSearch(q as string);
    const maxResults = Math.min(parseInt(limit as string) || 10, 20);

    console.log(`[TEACHERS] Recherche: "${q}" -> "${searchTerm}"`);

    // Recuperer tous les enseignants
    const allTeachers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        name: users.name,
        civilite: users.civilite,
        subject: users.subject,
      })
      .from(users)
      .where(eq(users.role, 'TEACHER'))
      .orderBy(asc(users.lastName), asc(users.firstName));

    // Filtrer par nom OU prenom (recherche globale)
    const filtered = allTeachers.filter(t => {
      // Utiliser lastName/firstName si disponibles, sinon parser 'name'
      let lastName = t.lastName || '';
      let firstName = t.firstName || '';

      // Si lastName/firstName vides, parser le champ 'name'
      if (!lastName && !firstName && t.name) {
        const nameParts = t.name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      const normalizedLastName = normalizeForSearch(lastName);
      const normalizedFirstName = normalizeForSearch(firstName);
      const normalizedFullName = normalizeForSearch(t.name || '');

      return normalizedLastName.includes(searchTerm) ||
             normalizedFirstName.includes(searchTerm) ||
             normalizedFullName.includes(searchTerm);
    }).slice(0, maxResults);

    // Formater les resultats
    const results = filtered.map(t => {
      let lastName = t.lastName || '';
      let firstName = t.firstName || '';

      if (!lastName && !firstName && t.name) {
        const nameParts = t.name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      return {
        id: t.id,
        firstName,
        lastName: lastName.toUpperCase(),
        civilite: t.civilite || 'M.',
        subject: t.subject || '',
        displayName: `${t.civilite || 'M.'} ${lastName.toUpperCase()} ${firstName}`,
      };
    });

    console.log(`[TEACHERS] ${results.length} resultats pour "${q}"`);

    res.json(results);
  } catch (error) {
    console.error('Erreur recherche enseignants:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/teachers - Liste de tous les enseignants
router.get('/', requireAuth, async (req, res) => {
  try {
    const allTeachers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        name: users.name,
        civilite: users.civilite,
        subject: users.subject,
      })
      .from(users)
      .where(eq(users.role, 'TEACHER'))
      .orderBy(asc(users.lastName), asc(users.firstName));

    const results = allTeachers.map(t => {
      let lastName = t.lastName || '';
      let firstName = t.firstName || '';

      if (!lastName && !firstName && t.name) {
        const nameParts = t.name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }

      return {
        id: t.id,
        firstName,
        lastName: lastName.toUpperCase(),
        civilite: t.civilite || 'M.',
        subject: t.subject || '',
        displayName: `${t.civilite || 'M.'} ${lastName.toUpperCase()} ${firstName}`,
      };
    });

    console.log(`[TEACHERS] ${results.length} enseignants recuperes`);
    res.json(results);
  } catch (error) {
    console.error('Erreur recuperation enseignants:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
