import 'dotenv/config';
import { db } from '../src/lib/db';
import { sessions, users, attachments } from '../src/lib/schema';
import { eq, inArray } from 'drizzle-orm';

/**
 * Seed de données de démonstration cohérentes pour SupChaissac v2
 *
 * Simulation réaliste année scolaire 2025-2026 :
 * - Septembre → janvier : sessions traitées (VALIDATED, SENT_FOR_PAYMENT, quelques REJECTED)
 * - Février : vacances d'hiver Zone B (14 fév → 1er mars) — pas de sessions
 * - Début mars : sessions fraîches à différents stades du workflow
 */

const DEMO_MARKER = '[DEMO]';

// Vacances scolaires Zone B 2025-2026 (périodes sans cours)
const HOLIDAYS_2025_2026 = [
  { start: new Date(2025, 9, 18), end: new Date(2025, 10, 2) },   // Toussaint
  { start: new Date(2025, 11, 20), end: new Date(2026, 0, 4) },   // Noël
  { start: new Date(2026, 1, 14), end: new Date(2026, 2, 1) },    // Hiver
];

// Jours fériés
const JOURS_FERIES = [
  new Date(2025, 10, 1),   // Toussaint
  new Date(2025, 10, 11),  // Armistice
  new Date(2025, 11, 25),  // Noël
  new Date(2026, 0, 1),    // Jour de l'An
];

function isHolidayOrWeekend(date: Date): boolean {
  const day = date.getDay();
  if (day === 0 || day === 6) return true; // Weekend

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
    if (!isHolidayOrWeekend(date)) {
      days.push(date);
    }
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

  // Supprimer toutes les pièces jointes puis toutes les sessions
  await db.delete(attachments);
  await db.delete(sessions);
  console.log('✅ Anciennes données supprimées\n');

  console.log('🎭 Génération des données de démonstration...\n');

  // Enseignants de démo : uniquement les comptes fictifs (pas de vrais enseignants = RGPD)
  // + Badri BELHAJ (id 49) = le vrai admin/développeur
  const demoTeacherIds = [1, 2, 3, 16, 49]; // Sophie, Marie, Martin, Philippe, Badri
  const allTeachers = await db.select().from(users).where(eq(users.role, 'TEACHER'));
  const seedTeachers = allTeachers.filter(t => demoTeacherIds.includes(t.id));
  console.log(`👥 ${seedTeachers.length} enseignants sélectionnés pour le seed\n`);

  const types = ['RCD', 'DEVOIRS_FAITS', 'HSE', 'AUTRE'] as const;
  const typeWeights = [0.35, 0.40, 0.15, 0.10];
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

  // Mois de l'année scolaire 2025-2026 : sept → fév (avant vacances)
  const pastMonths = [
    { year: 2025, month: 8 },  // Septembre
    { year: 2025, month: 9 },  // Octobre
    { year: 2025, month: 10 }, // Novembre
    { year: 2025, month: 11 }, // Décembre
    { year: 2026, month: 0 },  // Janvier
    { year: 2026, month: 1 },  // Février (seulement 2 semaines avant vacances le 14)
  ];

  // Sessions par mois par enseignant (variation réaliste)
  const sessionsPerMonth = [3, 4, 5, 3, 5, 2]; // Moins en sept (rentrée) et déc (fin trimestre)

  let grandTotal = 0;
  const usedSlots = new Set<string>(); // Pour éviter les doublons (teacherId-date-timeSlot)

  for (const teacher of seedTeachers) {
    const activityFactor = 0.6 + Math.random() * 0.8; // Variation par enseignant
    let teacherTotal = 0;

    console.log(`👤 ${teacher.name} (${teacher.subject || 'N/A'}):`);

    // === MOIS PASSÉS : sessions déjà traitées ===
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

        const selectedType = weightedPick([...types], typeWeights);

        // Statut pour les mois passés : presque tout traité
        let status: string;
        const r = Math.random();
        if (r < 0.45) {
          status = 'SENT_FOR_PAYMENT'; // 45% mis en paiement
        } else if (r < 0.90) {
          status = 'VALIDATED'; // 45% validé (pas encore mis en paiement)
        } else {
          status = 'REJECTED'; // 10% rejeté
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
          updatedAt: new Date(date.getTime() + 2 * 24 * 60 * 60 * 1000), // +2 jours
        };

        // Dates de traçabilité
        if (status === 'VALIDATED' || status === 'SENT_FOR_PAYMENT') {
          sessionData.validatedAt = new Date(date.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 jours
        }

        if (status === 'SENT_FOR_PAYMENT') {
          sessionData.paidAt = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 jours
        }

        if (status === 'REJECTED') {
          sessionData.validatedAt = new Date(date.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 jours
          sessionData.rejectionReason = pick([
            'Créneau non disponible',
            'Doublon avec une autre session',
            'Information manquante',
          ]);
        }

        // Détails selon le type
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
            'Préparation brevet blanc',
          ]);
        }

        try {
          await db.insert(sessions).values(sessionData);
          teacherTotal++;
        } catch {
          // Doublon unique constraint, on ignore
        }
      }
    }

    // === DÉBUT MARS : sessions fraîches à différents stades ===
    const marchDays = getWorkingDays(2026, 2); // Mars 2026
    // Seulement les premiers jours ouvrés (2-6 mars)
    const earlyMarch = marchDays.filter(d => d.getDate() <= 6);

    if (earlyMarch.length > 0) {
      // 2-4 sessions fraîches par enseignant
      const freshCount = Math.floor(Math.random() * 3) + 2;

      for (let j = 0; j < freshCount; j++) {
        const date = pick(earlyMarch);
        const timeSlot = pick([...timeSlots]);
        const slotKey = `${teacher.id}-${formatDate(date)}-${timeSlot}`;
        if (usedSlots.has(slotKey)) continue;
        usedSlots.add(slotKey);

        const selectedType = weightedPick([...types], typeWeights);

        // Statuts variés pour mars (workflow en cours — pas encore validées)
        const status = weightedPick(
          ['PENDING_REVIEW', 'PENDING_VALIDATION'] as const,
          [0.55, 0.45]
        );

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

        // Dates de traçabilité pour mars
        if (status === 'PENDING_VALIDATION') {
          sessionData.updatedAt = new Date(date.getTime() + 1 * 24 * 60 * 60 * 1000); // examiné +1j
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

  process.exit(0);
}

seedDemoData().catch(console.error);
