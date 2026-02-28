import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required')
}

// Connexion PostgreSQL avec pooling pour Neon free tier
const connectionString = process.env.DATABASE_URL
const client = postgres(connectionString, {
  max: 5, // Connexions simultanées max
  idle_timeout: 20, // 20s avant déconnexion idle
  connect_timeout: 30, // 30s timeout pour connexion (cold start Neon)
})
export const db = drizzle(client, { schema })

// Test de connexion
export async function testConnection() {
  try {
    await client`SELECT 1`
    console.log('✅ PostgreSQL Neon connecté avec succès')
    return true
  } catch (error) {
    console.error('❌ Erreur connexion PostgreSQL:', error)
    throw error
  }
}

// Fermer la connexion gracieusement
export async function closeDb() {
  try {
    await client.end()
    console.log('✅ Connexion PostgreSQL fermée')
  } catch (error) {
    console.error('❌ Erreur fermeture connexion:', error)
    throw error
  }
}

