import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, {
  connect_timeout: 30,
});

async function migrate() {
  // 1. Ajouter la nouvelle valeur à l'enum
  await sql`ALTER TYPE session_status ADD VALUE IF NOT EXISTS 'SENT_FOR_PAYMENT'`;
  console.log('✅ Valeur SENT_FOR_PAYMENT ajoutée à l\'enum');

  // 2. Mettre à jour les sessions existantes
  const result = await sql`UPDATE sessions SET status = 'SENT_FOR_PAYMENT' WHERE status = 'PAID'`;
  console.log('✅ Sessions mises à jour:', result.count, 'lignes');

  // 3. Vérifier
  const check = await sql`SELECT status, count(*) FROM sessions GROUP BY status`;
  console.log('📊 Répartition des statuts:', check);

  await sql.end();
}

migrate().catch(console.error);
