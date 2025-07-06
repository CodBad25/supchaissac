import dotenv from 'dotenv';
import postgres from 'postgres';

// Load environment variables
dotenv.config();

async function testConnection() {
  console.log('🔍 Test de connexion à la base de données...\n');
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log('❌ DATABASE_URL non définie dans .env');
    console.log('📝 Veuillez configurer DATABASE_URL dans le fichier .env');
    console.log('💡 Exemple: DATABASE_URL="postgresql://username:password@localhost:5432/supchaissac"');
    return false;
  }
  
  console.log('🔗 URL de base de données:', databaseUrl.replace(/:[^:@]*@/, ':***@'));
  
  try {
    // Test de connexion
    const sql = postgres(databaseUrl);
    
    // Test simple
    const result = await sql`SELECT version()`;
    console.log('✅ Connexion réussie !');
    console.log('📊 Version PostgreSQL:', result[0].version.split(' ')[0] + ' ' + result[0].version.split(' ')[1]);
    
    // Test de création de table temporaire
    await sql`CREATE TABLE IF NOT EXISTS test_connection (id SERIAL PRIMARY KEY, created_at TIMESTAMP DEFAULT NOW())`;
    await sql`INSERT INTO test_connection DEFAULT VALUES`;
    const testResult = await sql`SELECT COUNT(*) as count FROM test_connection`;
    await sql`DROP TABLE test_connection`;
    
    console.log('✅ Test d\'écriture réussi');
    
    await sql.end();
    return true;
    
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Solutions possibles:');
      console.log('   1. Vérifiez que PostgreSQL est démarré');
      console.log('   2. Vérifiez l\'URL de connexion dans .env');
      console.log('   3. Utilisez une base cloud (Neon, Supabase, etc.)');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('\n💡 La base de données n\'existe pas. Créez-la avec:');
      console.log('   createdb supchaissac');
    } else if (error.message.includes('authentication')) {
      console.log('\n💡 Problème d\'authentification:');
      console.log('   Vérifiez le nom d\'utilisateur et mot de passe dans DATABASE_URL');
    }
    
    return false;
  }
}

// Fonction pour créer une base de données de test avec Docker
async function suggestDockerSetup() {
  console.log('\n🐳 Pour démarrer rapidement avec Docker:');
  console.log('');
  console.log('1. Créez un fichier docker-compose.yml:');
  console.log(`
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: supchaissac
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
`);
  console.log('2. Démarrez avec: docker-compose up -d');
  console.log('3. Utilisez: DATABASE_URL="postgresql://postgres:password@localhost:5432/supchaissac"');
}

// Exécution
testConnection().then(success => {
  if (!success) {
    suggestDockerSetup();
  }
}).catch(console.error);
