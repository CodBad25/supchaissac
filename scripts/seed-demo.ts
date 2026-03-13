import 'dotenv/config';
import { db } from '../src/lib/db';
import { sessions, users, attachments } from '../src/lib/schema';
import { eq } from 'drizzle-orm';

/**
 * Seed de données de démonstration cohérentes pour SupChaissac v2
 *
 * Respecte le workflow révisé (mars 2026) :
 * - PACTE (DF/RCD d'enseignant PACTE) : secrétaire valide directement
 * - Hors PACTE : principal décide (OK paiement / En attente / Refuser)
 * - HSE : jamais un choix enseignant, uniquement conversion par principal
 * - Statuts : PENDING_REVIEW, PENDING_DOCUMENTS, PENDING_VALIDATION, VALIDATED, ON_HOLD, REJECTED, SENT_FOR_PAYMENT
 */

const DEMO_MARKER = '[DEMO]';

// Vacances scolaires Zone B 2025-2026
const HOLIDAYS_2025_2026 = [
  { start: new Date(2025, 9, 18), end: new Date(2025, 10, 2) },   // Toussaint
  { start: new Date(2025, 11, 20), end: new Date(2026, 0, 4) },   // Noël
  { start: new Date(2026, 1, 14), end: new Date(2026, 2, 1) },    // Hiver
];

const JOURS_FERIES = [
  new Date(2025, 10, 1),   // Toussaint
  new Date(2025, 10, 11),  // Armistice
  new Date(2025, 11, 25),  // Noël
  new Date(2026, 0, 1),    // Jour de l'An
];

function isHolidayOrWeekend(date: Date): boolean {
  const day = date.getDay();
  if (day === 0 || day === 6) return true;
  for (const period of HOLIDAYS_2025_2026) {
    if (date >= period.start && date <= period.end) return true;
  }
  for (const ferie of JOURS_FERIES) {
    if (date.getFullYear() === ferie.getFullYear() &&
        date.getMonth() === ferie.getMonth() &&
        date.getDate() === ferie.getDate()) return true;
  }
  return false;
}

function getWorkingDays(year: number, month: number): Date[] {
  const days: Date[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    if (!isHolidayOrWeekend(date)) days.push(date);
  }
  return days;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedPick<T>(items: T[], weights: number[]): T {
  const r = Math.random();
  let cumul = 0;
  for (let i = 0; i < items.length; i++) {
    cumul += weights[i];
    if (r < cumul) return items[i];
  }
  return items[items.length - 1];
}

async function seedDemoData() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Interdit en production');
    process.exit(1);
  }

  console.log('🧹 Suppression des anciennes sessions...');
  await db.delete(attachments);
  await db.delete(sessions);
  console.log('✅ Anciennes données supprimées\n');

  console.log('🎭 Génération des données de démonstration...\n');

  // Enseignants de démo
  const demoTeacherIds = [1, 2, 3, 16]; // Sans Badri (49)
  const allTeachers = await db.select().from(users).where(eq(users.role, 'TEACHER'));
  const seedTeachers = allTeachers.filter(t => demoTeacherIds.includes(t.id));
  console.log(`👥 ${seedTeachers.length} enseignants sélectionnés pour le seed`);
  for (const t of seedTeachers) {
    console.log(`   ${t.name} — PACTE: ${t.inPacte ? 'OUI' : 'NON'}`);
  }
  console.log('');

  // Types enseignant : RCD, DEVOIRS_FAITS, AUTRE (jamais HSE directement)
  const teacherTypes = ['RCD', 'DEVOIRS_FAITS', 'AUTRE'] as const;
  const teacherTypeWeights = [0.40, 0.45, 0.15];
  const timeSlots = ['M1', 'M2', 'M3', 'M4', 'S1', 'S2', 'S3', 'S4'] as const;
  const gradeLevels = ['6e', '5e', '4e', '3e', 'mixte'];
  const classes = ['6A', '6B', '5A', '5B', '4A', '4B', '3A', '3B'];
  const replacedNames = [
    { prefix: 'M.', last: 'MARTIN', first: 'Pierre' },
    { prefix: 'Mme', last: 'BERNARD', first: 'Claire' },
    { prefix: 'M.', last: 'DUBOIS', first: 'Laurent' },
    { prefix: 'Mme', last: 'THOMAS', first: 'Marie' },
    { prefix: 'M.', last: 'LEROY', first: 'Julien' },
    { prefix: 'Mme', last: 'MOREAU', first: 'Sophie' },
  ];

  const pastMonths = [
    { year: 2025, month: 8 },  // Septembre
    { year: 2025, month: 9 },  // Octobre
    { year: 2025, month: 10 }, // Novembre
    { year: 2025, month: 11 }, // Décembre
    { year: 2026, month: 0 },  // Janvier
    { year: 2026, month: 1 },  // Février
  ];

  const sessionsPerMonth = [1, 1, 1, 1, 1, 0]; // ~5 sessions passées par enseignant

  let grandTotal = 0;
  const usedSlots = new Set<string>();

  /**
   * Détermine le statut d'une session passée en respectant le workflow
   */
  function getPastStatus(teacher: typeof seedTeachers[0], type: string): {
    status: string;
    type: string;
    rejectionReason?: string;
    originalType?: string;
  } {
    const isPacte = teacher.inPacte === true;
    const isPacteSession = isPacte && (type === 'DEVOIRS_FAITS' || type === 'RCD');

    if (isPacteSession) {
      // PACTE DF/RCD → secrétaire valide directement, pas de rejet possible par principal
      const r = Math.random();
      if (r < 0.50) {
        return { status: 'SENT_FOR_PAYMENT', type };
      } else {
        return { status: 'VALIDATED', type };
      }
    }

    // Hors PACTE → passe par le principal
    if (type === 'AUTRE') {
      // Le principal a converti en HSE, RCD ou DF
      const r = Math.random();
      if (r < 0.12) {
        return { status: 'REJECTED', type: 'AUTRE', rejectionReason: pick([
          'Créneau non disponible',
          'Doublon avec une autre session',
          'Information manquante',
        ])};
      }
      // Conversion par le principal
      const convertedType = weightedPick(['HSE', 'RCD', 'DEVOIRS_FAITS'], [0.50, 0.30, 0.20]);
      if (r < 0.55) {
        return { status: 'SENT_FOR_PAYMENT', type: convertedType, originalType: 'AUTRE' };
      } else {
        return { status: 'VALIDATED', type: convertedType, originalType: 'AUTRE' };
      }
    }

    // DF/RCD hors PACTE → principal décide
    const r = Math.random();
    if (r < 0.10) {
      return { status: 'REJECTED', type, rejectionReason: pick([
        'Budget HSE insuffisant',
        'Doublon avec une autre session',
        'Créneau non couvert',
      ])};
    } else if (r < 0.55) {
      return { status: 'SENT_FOR_PAYMENT', type };
    } else {
      return { status: 'VALIDATED', type };
    }
  }

  for (const teacher of seedTeachers) {
    const activityFactor = 0.6 + Math.random() * 0.8;
    let teacherTotal = 0;
    const isPacte = teacher.inPacte === true;

    console.log(`👤 ${teacher.name} (${teacher.subject || 'N/A'}) — PACTE: ${isPacte ? 'OUI' : 'NON'}`);

    // === MOIS PASSÉS : sessions traitées ===
    for (let m = 0; m < pastMonths.length; m++) {
      const { year, month } = pastMonths[m];
      const workingDays = getWorkingDays(year, month);
      if (workingDays.length === 0) continue;

      const count = Math.round(sessionsPerMonth[m] * activityFactor);

      for (let j = 0; j < count; j++) {
        const date = pick(workingDays);
        const timeSlot = pick([...timeSlots]);
        const slotKey = `${teacher.id}-${formatDate(date)}-${timeSlot}`;
        if (usedSlots.has(slotKey)) continue;
        usedSlots.add(slotKey);

        const selectedType = weightedPick([...teacherTypes], teacherTypeWeights);
        const result = getPastStatus(teacher, selectedType);

        const sessionData: any = {
          date: formatDate(date),
          timeSlot,
          type: result.type,
          teacherId: teacher.id,
          teacherName: teacher.name,
          status: result.status,
          comment: DEMO_MARKER,
          createdAt: date,
          updatedAt: new Date(date.getTime() + 2 * 24 * 60 * 60 * 1000),
        };

        if (result.originalType) {
          sessionData.originalType = result.originalType;
        }

        if (result.status === 'VALIDATED' || result.status === 'SENT_FOR_PAYMENT') {
          sessionData.validatedAt = new Date(date.getTime() + 3 * 24 * 60 * 60 * 1000);
        }
        if (result.status === 'SENT_FOR_PAYMENT') {
          sessionData.paidAt = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);
        }
        if (result.status === 'REJECTED') {
          sessionData.validatedAt = new Date(date.getTime() + 3 * 24 * 60 * 60 * 1000);
          sessionData.rejectionReason = result.rejectionReason;
        }

        // Détails selon le type (utiliser le type original pour les champs)
        const origType = result.originalType || result.type;
        if (origType === 'RCD' || result.type === 'RCD') {
          const replaced = pick(replacedNames);
          sessionData.className = pick(classes);
          sessionData.replacedTeacherPrefix = replaced.prefix;
          sessionData.replacedTeacherLastName = replaced.last;
          sessionData.replacedTeacherFirstName = replaced.first;
          sessionData.subject = teacher.subject || 'Mathématiques';
        } else if (origType === 'DEVOIRS_FAITS' || result.type === 'DEVOIRS_FAITS') {
          sessionData.gradeLevel = pick(gradeLevels);
          sessionData.studentCount = Math.floor(Math.random() * 12) + 4;
        } else if (origType === 'AUTRE') {
          sessionData.description = pick([
            'Accompagnement personnalisé',
            'Tutorat élèves en difficulté',
            'Soutien orientation 3e',
            'Préparation brevet blanc',
          ]);
        }

        try {
          await db.insert(sessions).values(sessionData);
          teacherTotal++;
        } catch {
          // Doublon
        }
      }
    }

    // === DÉBUT MARS : sessions fraîches à différents stades du workflow ===
    const marchDays = getWorkingDays(2026, 2);
    const earlyMarch = marchDays.filter(d => d.getDate() <= 12);

    if (earlyMarch.length > 0) {
      const freshCount = 2; // 2 sessions fraîches par enseignant

      for (let j = 0; j < freshCount; j++) {
        const date = pick(earlyMarch);
        const timeSlot = pick([...timeSlots]);
        const slotKey = `${teacher.id}-${formatDate(date)}-${timeSlot}`;
        if (usedSlots.has(slotKey)) continue;
        usedSlots.add(slotKey);

        const selectedType = weightedPick([...teacherTypes], teacherTypeWeights);
        const isPacteSession = isPacte && (selectedType === 'DEVOIRS_FAITS' || selectedType === 'RCD');

        // Statut cohérent avec le workflow
        let status: string;
        let validationComments: string | undefined;

        if (isPacteSession) {
          // PACTE : majorité à examiner pour la démo
          status = weightedPick(
            ['PENDING_REVIEW', 'VALIDATED'],
            [0.70, 0.30]
          );
        } else {
          // Hors PACTE : majorité à examiner pour la démo
          status = weightedPick(
            ['PENDING_REVIEW', 'PENDING_VALIDATION', 'ON_HOLD', 'VALIDATED'],
            [0.55, 0.20, 0.10, 0.15]
          );
          if (status === 'ON_HOLD') {
            validationComments = pick([
              'En attente du prochain conseil budgétaire',
              'À revoir après les résultats trimestriels',
              'Budget HSE presque épuisé, à valider en priorité le mois prochain',
            ]);
          }
        }

        const sessionData: any = {
          date: formatDate(date),
          timeSlot,
          type: selectedType,
          teacherId: teacher.id,
          teacherName: teacher.name,
          status,
          comment: DEMO_MARKER,
          createdAt: date,
        };

        if (status === 'PENDING_VALIDATION' || status === 'ON_HOLD' || status === 'VALIDATED') {
          sessionData.updatedAt = new Date(date.getTime() + 1 * 24 * 60 * 60 * 1000);
        }
        if (status === 'VALIDATED') {
          sessionData.validatedAt = new Date(date.getTime() + 2 * 24 * 60 * 60 * 1000);
        }
        if (validationComments) {
          sessionData.validationComments = validationComments;
        }

        if (selectedType === 'RCD') {
          const replaced = pick(replacedNames);
          sessionData.className = pick(classes);
          sessionData.replacedTeacherPrefix = replaced.prefix;
          sessionData.replacedTeacherLastName = replaced.last;
          sessionData.replacedTeacherFirstName = replaced.first;
          sessionData.subject = teacher.subject || 'Mathématiques';
        } else if (selectedType === 'DEVOIRS_FAITS') {
          sessionData.gradeLevel = pick(gradeLevels);
          sessionData.studentCount = Math.floor(Math.random() * 12) + 4;
        } else if (selectedType === 'AUTRE') {
          sessionData.description = pick([
            'Accompagnement personnalisé',
            'Tutorat élèves en difficulté',
            'Soutien orientation 3e',
          ]);
        }

        try {
          await db.insert(sessions).values(sessionData);
          teacherTotal++;
        } catch {
          // Doublon
        }
      }
    }

    console.log(`   📊 ${teacherTotal} sessions créées`);
    grandTotal += teacherTotal;
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Génération terminée!`);
  console.log(`📊 Total: ${grandTotal} sessions pour ${seedTeachers.length} enseignants`);
  console.log(`📅 Période: septembre 2025 → début mars 2026`);
  console.log(`🏖️  Vacances respectées (Toussaint, Noël, Hiver Zone B)`);
  console.log(`🏷️  Marqueur: "${DEMO_MARKER}"`);
  console.log('\n📋 Workflow respecté :');
  console.log('   - PACTE (DF/RCD) → validées par secrétaire (jamais PENDING_VALIDATION)');
  console.log('   - Hors PACTE → passent par principal (PENDING_VALIDATION, ON_HOLD, VALIDATED)');
  console.log('   - HSE → uniquement par conversion principal (originalType = AUTRE)');
  console.log('   - Enseignant choisit : RCD, Devoirs Faits, Autre (jamais HSE)');

  process.exit(0);
}

seedDemoData().catch(console.error);
