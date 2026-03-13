import postgres from 'postgres';

/**
 * Migration : sessions PACTE en PENDING_VALIDATION → VALIDATED
 *
 * Nouveau workflow : les sessions DF/RCD d'enseignants PACTE sont validées
 * directement par la secrétaire, sans passer par le principal.
 * Ce script corrige les sessions existantes qui étaient déjà en PENDING_VALIDATION.
 */

const sql = postgres(process.env.DATABASE_URL!, {
  connect_timeout: 30,
});

async function migrate() {
  // 1. Trouver les sessions DF/RCD en PENDING_VALIDATION dont l'enseignant est PACTE
  const sessionsToFix = await sql`
    SELECT s.id, s.type, s.teacher_id, s.teacher_name, u.in_pacte
    FROM sessions s
    JOIN users u ON s.teacher_id = u.id
    WHERE s.status = 'PENDING_VALIDATION'
      AND s.type IN ('DEVOIRS_FAITS', 'RCD')
      AND u.in_pacte = true
      AND s.deleted_at IS NULL
  `;

  console.log(`📋 Sessions PACTE en PENDING_VALIDATION trouvées : ${sessionsToFix.length}`);

  if (sessionsToFix.length === 0) {
    console.log('✅ Rien à migrer.');
    await sql.end();
    return;
  }

  // Afficher les sessions concernées
  for (const s of sessionsToFix) {
    console.log(`  - Session #${s.id} (${s.type}) — ${s.teacher_name}`);
  }

  // 2. Les passer en VALIDATED
  const ids = sessionsToFix.map(s => s.id);
  const result = await sql`
    UPDATE sessions
    SET status = 'VALIDATED',
        validated_at = NOW(),
        updated_at = NOW(),
        updated_by = 'migration-pacte-workflow'
    WHERE id = ANY(${ids})
  `;
  console.log(`✅ ${result.count} sessions mises à jour en VALIDATED`);

  // 3. Vérification finale
  const check = await sql`SELECT status, count(*) FROM sessions WHERE deleted_at IS NULL GROUP BY status ORDER BY status`;
  console.log('📊 Répartition des statuts :', check);

  await sql.end();
}

migrate().catch(console.error);
