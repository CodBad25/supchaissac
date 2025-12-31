import { db } from '../src/lib/db';
import { sessions } from '../src/lib/schema';
import { eq } from 'drizzle-orm';

async function check() {
  const all = await db.select().from(sessions);
  console.log('Sessions actuelles:');
  all.forEach(s => console.log(`  ID ${s.id}: ${s.status} - ${s.sessionType}`));

  // Reset 5 sessions to PENDING_REVIEW for testing
  const toReset = all.filter(s => s.status !== 'PENDING_REVIEW').slice(0, 5);
  if (toReset.length > 0) {
    console.log('\nReset de 5 sessions en PENDING_REVIEW:');
    for (const s of toReset) {
      await db.update(sessions).set({ status: 'PENDING_REVIEW' }).where(eq(sessions.id, s.id));
      console.log(`  ID ${s.id} reset`);
    }
  }

  const updated = await db.select().from(sessions);
  console.log('\nSessions apres reset:');
  updated.forEach(s => console.log(`  ID ${s.id}: ${s.status} - ${s.sessionType}`));

  process.exit(0);
}
check();
