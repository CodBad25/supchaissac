import 'dotenv/config';
import { db } from '../src/lib/db';
import { sessions } from '../src/lib/schema';
import { eq } from 'drizzle-orm';

const DEMO_MARKER = '[DEMO]';

async function cleanDemoData() {
  console.log('🧹 Suppression des données de démonstration...\n');

  // Compter avant suppression
  const demoSessions = await db
    .select()
    .from(sessions)
    .where(eq(sessions.comment, DEMO_MARKER));

  const count = demoSessions.length;

  if (count === 0) {
    console.log('ℹ️  Aucune donnée de démonstration trouvée.');
    process.exit(0);
  }

  console.log(`🔍 ${count} sessions de démonstration trouvées`);

  // Supprimer
  await db.delete(sessions).where(eq(sessions.comment, DEMO_MARKER));

  console.log(`\n✅ ${count} sessions supprimées avec succès!`);
  console.log('📊 Les autres données ont été conservées.');

  process.exit(0);
}

cleanDemoData().catch(console.error);
