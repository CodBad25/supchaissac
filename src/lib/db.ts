import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required')
}

// Connexion PostgreSQL
const connectionString = process.env.DATABASE_URL
const client = postgres(connectionString)
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

