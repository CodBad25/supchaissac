import { Router } from 'express';
import { db } from '../../src/lib/db';
import { students } from '../../src/lib/schema';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { eq, and, like, sql, asc } from 'drizzle-orm';
import multer from 'multer';
import iconv from 'iconv-lite';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Detecter et convertir l'encodage du fichier CSV
function decodeBuffer(buffer: Buffer): string {
  // Essayer UTF-8 d'abord
  const utf8Content = buffer.toString('utf-8');

  // Verifier si le contenu UTF-8 contient des caracteres invalides (remplacement)
  // Les fichiers Windows/Excel francais utilisent souvent Windows-1252 ou ISO-8859-1
  const hasReplacementChars = utf8Content.includes('\ufffd');
  const hasBrokenAccents = /[\x80-\x9f]/.test(utf8Content) ||
    // Patterns typiques de mauvais encodage: Ã© au lieu de é, etc.
    /Ã©|Ã¨|Ã |Ã¹|Ãª|Ã®|Ã´|Ã»|Ã§|Ã‰|Ã€/.test(utf8Content);

  if (hasReplacementChars || hasBrokenAccents) {
    // Essayer Windows-1252 (plus courant que ISO-8859-1 pour les fichiers Excel)
    try {
      const win1252Content = iconv.decode(buffer, 'win1252');
      console.log('[STUDENTS] Fichier detecte comme Windows-1252');
      return win1252Content;
    } catch {
      // Fallback sur ISO-8859-1
      try {
        const latin1Content = iconv.decode(buffer, 'iso-8859-1');
        console.log('[STUDENTS] Fichier detecte comme ISO-8859-1');
        return latin1Content;
      } catch {
        console.log('[STUDENTS] Fallback sur UTF-8');
        return utf8Content;
      }
    }
  }

  console.log('[STUDENTS] Fichier detecte comme UTF-8');
  return utf8Content;
}

// Helper pour obtenir l'annee scolaire courante
function getCurrentSchoolYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (month >= 8) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

// Parser CSV avec detection des colonnes
function parseCSV(content: string): { headers: string[]; rows: Record<string, string>[] } {
  // Supprimer BOM si present (fichiers Windows/Excel)
  let cleanContent = content;
  if (cleanContent.charCodeAt(0) === 0xFEFF) {
    cleanContent = cleanContent.slice(1);
  }
  // Aussi supprimer le BOM UTF-8 en bytes
  if (cleanContent.startsWith('\uFEFF') || cleanContent.startsWith('\xEF\xBB\xBF')) {
    cleanContent = cleanContent.replace(/^\uFEFF/, '').replace(/^\xEF\xBB\xBF/, '');
  }

  const lines = cleanContent.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) {
    console.log('[STUDENTS] CSV vide - aucune ligne trouvee');
    return { headers: [], rows: [] };
  }

  console.log('[STUDENTS] CSV: ' + lines.length + ' lignes trouvees');
  console.log('[STUDENTS] Premiere ligne:', lines[0].substring(0, 200));

  // Detecter le separateur (point-virgule ou virgule ou tabulation)
  const firstLine = lines[0];
  let separator = ';';
  if (firstLine.includes('\t')) {
    separator = '\t';
  } else if (firstLine.includes(';')) {
    separator = ';';
  } else if (firstLine.includes(',')) {
    separator = ',';
  }
  console.log('[STUDENTS] Separateur detecte:', separator === '\t' ? 'TAB' : separator);

  // Extraire les headers et les normaliser
  const headers = firstLine.split(separator).map(h => h.trim().replace(/^"|"$/g, ''));
  console.log('[STUDENTS] Headers detectes:', headers);

  // Parser les lignes de donnees
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(separator).map(v => v.trim().replace(/^"|"$/g, ''));
    // Etre plus tolerant: accepter si on a au moins quelques colonnes
    if (values.length >= 2 && values.some(v => v)) {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }
  }

  console.log('[STUDENTS] ' + rows.length + ' lignes de donnees parsees');
  if (rows.length > 0) {
    console.log('[STUDENTS] Exemple premiere ligne:', JSON.stringify(rows[0]));
  }

  return { headers, rows };
}

// Mapper les colonnes CSV vers les champs de la DB
function mapCSVToStudent(row: Record<string, string>, schoolYear: string, importedBy: string): {
  lastName: string;
  firstName: string;
  birthDate: string | null;
  usageFirstName: string | null;
  gender: string | null;
  className: string;
  accompanimentProject: string | null;
  schoolYear: string;
  importedBy: string;
} | null {
  // Detecter les colonnes (avec plusieurs variantes possibles)
  const lastName = row['Nom'] || row['NOM'] || row['nom'] || '';
  const firstName = row['Prénom'] || row['PRENOM'] || row['prenom'] || row['Prenom'] || '';
  const birthDate = row['Né(e) le'] || row['Date de naissance'] || row['DATE_NAISSANCE'] || row['Né le'] || null;
  const usageFirstName = row['Prénom d\'usage'] || row['PRENOM_USAGE'] || row['Prenom d\'usage'] || null;
  const gender = row['Sexe'] || row['SEXE'] || row['sexe'] || null;
  const className = row['Classe'] || row['CLASSE'] || row['classe'] || '';
  const accompanimentProject = row['Projet d\'accompagnement'] || row['PAP'] || row['PPS'] || row['PROJET'] || null;

  // Validation: nom, prenom et classe obligatoires
  if (!lastName || !firstName || !className) {
    return null;
  }

  return {
    lastName: lastName.toUpperCase(),
    firstName,
    birthDate: birthDate || null,
    usageFirstName: usageFirstName || null,
    gender: gender || null,
    className: className.toUpperCase().trim(),
    accompanimentProject: accompanimentProject || null,
    schoolYear,
    importedBy,
  };
}

// GET /api/students - Liste des eleves avec filtres
router.get('/', requireAuth, async (req, res) => {
  try {
    const { className, schoolYear, search } = req.query;
    const currentSchoolYear = (schoolYear as string) || getCurrentSchoolYear();

    let query = db.select().from(students).where(eq(students.schoolYear, currentSchoolYear));

    // Filtrer par classe si specifie
    if (className && className !== 'all') {
      query = db.select().from(students).where(
        and(
          eq(students.schoolYear, currentSchoolYear),
          eq(students.className, className as string)
        )
      );
    }

    const allStudents = await query.orderBy(asc(students.className), asc(students.lastName));

    // Filtrer par recherche si specifie
    let filteredStudents = allStudents;
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredStudents = allStudents.filter(s =>
        s.lastName.toLowerCase().includes(searchLower) ||
        s.firstName.toLowerCase().includes(searchLower)
      );
    }

    console.log(`[STUDENTS] ${filteredStudents.length} eleves recuperes pour ${currentSchoolYear}`);
    res.json(filteredStudents);
  } catch (error) {
    console.error('Erreur recuperation eleves:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Normaliser une chaine pour la recherche (supprime accents et met en minuscule)
function normalizeForSearch(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/[^a-z0-9\s]/g, ''); // Garde que lettres, chiffres, espaces
}

// GET /api/students/search - Recherche rapide pour autocomplete
router.get('/search', requireAuth, async (req, res) => {
  try {
    const { q, limit = '15' } = req.query;

    if (!q || (q as string).length < 2) {
      return res.json({ students: [], matchingClass: null });
    }

    const searchTerm = normalizeForSearch(q as string);
    const searchTermUpper = (q as string).toUpperCase().trim();
    const maxResults = Math.min(parseInt(limit as string) || 15, 30);
    const currentSchoolYear = getCurrentSchoolYear();

    console.log(`[STUDENTS] Recherche: "${q}" -> "${searchTerm}"`);

    // Recuperer tous les eleves de l'annee
    const allStudents = await db
      .select({
        id: students.id,
        lastName: students.lastName,
        firstName: students.firstName,
        className: students.className,
      })
      .from(students)
      .where(eq(students.schoolYear, currentSchoolYear))
      .orderBy(asc(students.lastName), asc(students.firstName));

    // Verifier si la recherche correspond a une classe existante
    let matchingClass: { name: string; count: number } | null = null;
    const classStudents = allStudents.filter(s => s.className === searchTermUpper);
    if (classStudents.length > 0) {
      matchingClass = {
        name: searchTermUpper,
        count: classStudents.length,
      };
      console.log(`[STUDENTS] Classe detectee: ${searchTermUpper} (${classStudents.length} eleves)`);
    }

    // Filtrer par nom OU prenom (recherche globale)
    const filtered = allStudents.filter(s => {
      const normalizedLastName = normalizeForSearch(s.lastName);
      const normalizedFirstName = normalizeForSearch(s.firstName);
      return normalizedLastName.includes(searchTerm) || normalizedFirstName.includes(searchTerm);
    }).slice(0, maxResults);

    // Si on a une classe correspondante, inclure aussi les eleves de cette classe
    let studentsToReturn = filtered;
    if (matchingClass && classStudents.length > 0) {
      // Combiner: eleves de la classe + eleves trouves par nom/prenom (sans doublons)
      const classStudentIds = new Set(classStudents.map(s => s.id));
      const additionalStudents = filtered.filter(s => !classStudentIds.has(s.id));
      studentsToReturn = [...classStudents.slice(0, 10), ...additionalStudents].slice(0, maxResults);
    }

    console.log(`[STUDENTS] ${studentsToReturn.length} resultats pour "${q}"`);

    res.json({
      students: studentsToReturn,
      matchingClass,
    });
  } catch (error) {
    console.error('Erreur recherche eleves:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/students/class/:className - Tous les eleves d'une classe
router.get('/class/:className', requireAuth, async (req, res) => {
  try {
    const { className } = req.params;
    const currentSchoolYear = getCurrentSchoolYear();

    const classStudents = await db
      .select({
        id: students.id,
        lastName: students.lastName,
        firstName: students.firstName,
        className: students.className,
      })
      .from(students)
      .where(
        and(
          eq(students.schoolYear, currentSchoolYear),
          eq(students.className, className.toUpperCase())
        )
      )
      .orderBy(asc(students.lastName), asc(students.firstName));

    console.log(`[STUDENTS] Classe ${className}: ${classStudents.length} eleves`);

    res.json(classStudents);
  } catch (error) {
    console.error('Erreur recuperation classe:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/students/classes - Liste des classes uniques
router.get('/classes', requireAuth, async (req, res) => {
  try {
    const { schoolYear } = req.query;
    const currentSchoolYear = (schoolYear as string) || getCurrentSchoolYear();

    const allStudents = await db
      .select({ className: students.className })
      .from(students)
      .where(eq(students.schoolYear, currentSchoolYear))
      .groupBy(students.className)
      .orderBy(asc(students.className));

    const classes = allStudents.map(s => s.className);
    console.log(`[STUDENTS] ${classes.length} classes trouvees pour ${currentSchoolYear}:`, classes);
    res.json(classes);
  } catch (error) {
    console.error('Erreur recuperation classes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/students/stats - Statistiques d'import
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const { schoolYear } = req.query;
    const currentSchoolYear = (schoolYear as string) || getCurrentSchoolYear();

    const allStudents = await db
      .select()
      .from(students)
      .where(eq(students.schoolYear, currentSchoolYear));

    // Compter par classe
    const classCounts: Record<string, number> = {};
    allStudents.forEach(s => {
      classCounts[s.className] = (classCounts[s.className] || 0) + 1;
    });

    // Compter par projet d'accompagnement
    const projectCounts: Record<string, number> = {};
    allStudents.forEach(s => {
      if (s.accompanimentProject) {
        projectCounts[s.accompanimentProject] = (projectCounts[s.accompanimentProject] || 0) + 1;
      }
    });

    res.json({
      totalStudents: allStudents.length,
      totalClasses: Object.keys(classCounts).length,
      classCounts,
      projectCounts,
      schoolYear: currentSchoolYear,
    });
  } catch (error) {
    console.error('Erreur statistiques eleves:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/students/import - Import CSV
router.post('/import', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const schoolYear = (req.body.schoolYear as string) || getCurrentSchoolYear();
    const replaceExisting = req.body.replaceExisting === 'true';
    const importedBy = req.user?.name || 'Admin';

    // Parser le CSV
    const content = decodeBuffer(req.file.buffer);
    const { headers, rows } = parseCSV(content);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Fichier CSV vide ou invalide' });
    }

    console.log(`[STUDENTS] Import CSV: ${rows.length} lignes, headers:`, headers);

    // Si remplacement, supprimer les anciens eleves de cette annee
    if (replaceExisting) {
      const deleted = await db
        .delete(students)
        .where(eq(students.schoolYear, schoolYear));
      console.log(`[STUDENTS] Suppression des anciens eleves de ${schoolYear}`);
    }

    // Mapper et inserer les eleves
    const studentsToInsert: any[] = [];
    const errors: { line: number; reason: string }[] = [];

    rows.forEach((row, index) => {
      const student = mapCSVToStudent(row, schoolYear, importedBy);
      if (student) {
        studentsToInsert.push(student);
      } else {
        errors.push({ line: index + 2, reason: 'Donnees manquantes (nom, prenom ou classe)' });
      }
    });

    // Inserer en batch
    if (studentsToInsert.length > 0) {
      await db.insert(students).values(studentsToInsert);
    }

    // Recuperer les classes importees
    const importedClasses = [...new Set(studentsToInsert.map(s => s.className))].sort();

    console.log(`[STUDENTS] Import termine: ${studentsToInsert.length} eleves, ${importedClasses.length} classes`);

    res.json({
      success: true,
      imported: studentsToInsert.length,
      errors: errors.length,
      errorDetails: errors.slice(0, 10), // Max 10 erreurs
      classes: importedClasses,
      schoolYear,
    });
  } catch (error) {
    console.error('Erreur import eleves:', error);
    res.status(500).json({ error: 'Erreur lors de l\'import' });
  }
});

// POST /api/students/preview - Apercu avant import
router.post('/preview', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const content = decodeBuffer(req.file.buffer);
    const { headers, rows } = parseCSV(content);

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Fichier CSV vide ou invalide' });
    }

    // Extraire les classes detectees
    const classesFound = [...new Set(rows.map(r =>
      (r['Classe'] || r['CLASSE'] || r['classe'] || '').toUpperCase().trim()
    ).filter(c => c))].sort();

    // Extraire les projets d'accompagnement
    const projectsFound = [...new Set(rows.map(r =>
      r['Projet d\'accompagnement'] || r['PAP'] || r['PPS'] || r['PROJET'] || ''
    ).filter(p => p))].sort();

    // Apercu des premiers eleves
    const preview = rows.slice(0, 5).map(row => ({
      nom: row['Nom'] || row['NOM'] || '',
      prenom: row['Prénom'] || row['PRENOM'] || row['Prenom'] || '',
      classe: (row['Classe'] || row['CLASSE'] || '').toUpperCase(),
      projet: row['Projet d\'accompagnement'] || '',
    }));

    res.json({
      headers,
      totalRows: rows.length,
      classesFound,
      projectsFound,
      preview,
    });
  } catch (error) {
    console.error('Erreur preview CSV:', error);
    res.status(500).json({ error: 'Erreur lors de l\'analyse du fichier' });
  }
});

// DELETE /api/students - Supprimer tous les eleves d'une annee
router.delete('/', requireAdmin, async (req, res) => {
  try {
    const { schoolYear } = req.query;
    const targetYear = (schoolYear as string) || getCurrentSchoolYear();

    const result = await db
      .delete(students)
      .where(eq(students.schoolYear, targetYear));

    console.log(`[STUDENTS] Suppression des eleves de ${targetYear}`);
    res.json({ success: true, message: `Eleves de ${targetYear} supprimes` });
  } catch (error) {
    console.error('Erreur suppression eleves:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
