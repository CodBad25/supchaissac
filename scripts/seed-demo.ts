import 'dotenv/config';
import { db } from '../src/lib/db';
import { sessions, users } from '../src/lib/schema';
import { eq } from 'drizzle-orm';

const DEMO_MARKER = '[DEMO]';

async function seedDemoData() {
  console.log('🎭 Génération des données de démonstration...\n');

  // Récupérer TOUS les enseignants
  const teachers = await db
    .select()
    .from(users)
    .where(eq(users.role, 'TEACHER'));

  if (teachers.length === 0) {
    console.error('❌ Aucun enseignant trouvé');
    process.exit(1);
  }

  console.log(`👥 ${teachers.length} enseignants trouvés\n`);

  // Configuration par mois (variation réaliste)
  const baseSessionsPerMonth = [4, 6, 7, 5, 6, 3, 0, 0, 8, 9, 7, 5];

  const types = ['RCD', 'DEVOIRS_FAITS', 'HSE', 'AUTRE'] as const;
  const typeWeights = [0.35, 0.40, 0.15, 0.10];

  const timeSlots = ['M1', 'M2', 'M3', 'M4', 'S1', 'S2', 'S3', 'S4'] as const;
  const statuses = ['VALIDATED', 'PAID'] as const;

  const gradeLevels = ['6e', '5e', '4e', '3e', 'mixte'];
  const classes = ['6A', '6B', '5A', '5B', '4A', '4B', '3A', '3B'];

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  let grandTotal = 0;

  for (const teacher of teachers) {
    const teacherId = teacher.id;
    const teacherName = teacher.name;
    let teacherTotal = 0;

    // Variation aléatoire par enseignant (certains plus actifs que d'autres)
    const activityFactor = 0.5 + Math.random() * 1; // 0.5 à 1.5

    console.log(`\n👤 ${teacherName}:`);

    for (let i = 11; i >= 0; i--) {
      const targetMonth = (currentMonth - i + 12) % 12;
      const targetYear = currentMonth - i < 0 ? currentYear - 1 : currentYear;

      const baseCount = baseSessionsPerMonth[targetMonth];
      const count = Math.round(baseCount * activityFactor);

      if (count === 0) continue;

      for (let j = 0; j < count; j++) {
        let day = Math.floor(Math.random() * 28) + 1;
        const date = new Date(targetYear, targetMonth, day);

        while (date.getDay() === 0 || date.getDay() === 6) {
          day = Math.floor(Math.random() * 28) + 1;
          date.setDate(day);
        }

        const rand = Math.random();
        let cumulative = 0;
        let selectedType: typeof types[number] = 'DEVOIRS_FAITS';
        for (let k = 0; k < types.length; k++) {
          cumulative += typeWeights[k];
          if (rand < cumulative) {
            selectedType = types[k];
            break;
          }
        }

        const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        const sessionData: any = {
          date: date.toISOString().split('T')[0],
          timeSlot,
          type: selectedType,
          teacherId,
          teacherName,
          status,
          comment: DEMO_MARKER,
          createdAt: new Date(),
        };

        if (selectedType === 'RCD') {
          sessionData.className = classes[Math.floor(Math.random() * classes.length)];
          sessionData.replacedTeacherPrefix = Math.random() > 0.5 ? 'M.' : 'Mme';
          sessionData.replacedTeacherLastName = ['MARTIN', 'BERNARD', 'DUBOIS', 'THOMAS'][Math.floor(Math.random() * 4)];
          sessionData.subject = teacher.subject || ['Mathématiques', 'Français', 'Histoire', 'SVT'][Math.floor(Math.random() * 4)];
        } else if (selectedType === 'DEVOIRS_FAITS') {
          sessionData.gradeLevel = gradeLevels[Math.floor(Math.random() * gradeLevels.length)];
          sessionData.studentCount = Math.floor(Math.random() * 15) + 5;
        } else if (selectedType === 'AUTRE') {
          sessionData.description = 'Session de démonstration';
        }

        await db.insert(sessions).values(sessionData);
        teacherTotal++;
      }
    }

    console.log(`   📊 ${teacherTotal} sessions créées`);
    grandTotal += teacherTotal;
  }

  console.log('\n' + '='.repeat(40));
  console.log(`✅ Génération terminée!`);
  console.log(`📊 Total: ${grandTotal} sessions pour ${teachers.length} enseignants`);
  console.log(`🏷️  Marqueur: "${DEMO_MARKER}"`);
  console.log('\n💡 Pour supprimer: npm run demo:clean');

  process.exit(0);
}

seedDemoData().catch(console.error);
