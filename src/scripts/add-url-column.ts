import 'dotenv/config';
import postgres from 'postgres';

async function migrate() {
  const sql = postgres(process.env.DATABASE_URL!);

  try {
    // Ajouter la colonne url si elle n'existe pas
    await sql`
      ALTER TABLE attachments
      ADD COLUMN IF NOT EXISTS url text;
    `;
    console.log('✅ Colonne "url" ajoutée à la table attachments');
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await sql.end();
  }
}

migrate();
