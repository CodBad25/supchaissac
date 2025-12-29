import 'dotenv/config'
import { db } from '../lib/db'
import { users, sessions, systemSettings } from '../lib/schema'
import bcrypt from 'bcrypt'

// Fonction de hachage des mots de passe
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
}

// Données de test - Utilisateurs
export const TEST_USERS = [
  {
    username: "teacher1@example.com",
    password: "password123",
    name: "Sophie MARTIN",
    firstName: "Sophie",
    lastName: "MARTIN",
    civilite: "Mme" as const,
    subject: "Mathématiques",
    role: "TEACHER" as const,
    initials: "SM",
    inPacte: false,
    pacteHoursTarget: 0,
    pacteHoursCompleted: 0
  },
  {
    username: "teacher2@example.com",
    password: "password123",
    name: "Marie PETIT",
    firstName: "Marie",
    lastName: "PETIT",
    civilite: "Mme" as const,
    subject: "Français",
    role: "TEACHER" as const,
    initials: "MP",
    inPacte: true,
    pacteHoursTarget: 20,
    pacteHoursCompleted: 8
  },
  {
    username: "teacher3@example.com",
    password: "password123",
    name: "Martin DUBOIS",
    firstName: "Martin",
    lastName: "DUBOIS",
    civilite: "M." as const,
    subject: "Histoire-Géographie",
    role: "TEACHER" as const,
    initials: "MD",
    inPacte: false,
    pacteHoursTarget: 0,
    pacteHoursCompleted: 0
  },
  {
    username: "teacher4@example.com",
    password: "password123",
    name: "Philippe GARCIA",
    firstName: "Philippe",
    lastName: "GARCIA",
    civilite: "M." as const,
    subject: "SVT",
    role: "TEACHER" as const,
    initials: "PG",
    inPacte: true,
    pacteHoursTarget: 18,
    pacteHoursCompleted: 12
  },
  {
    username: "secretary@example.com",
    password: "password123",
    name: "Laure MARTIN",
    firstName: "Laure",
    lastName: "MARTIN",
    civilite: "Mme" as const,
    role: "SECRETARY" as const,
    initials: "LM"
  },
  {
    username: "principal@example.com",
    password: "password123",
    name: "Jean DUPONT",
    firstName: "Jean",
    lastName: "DUPONT",
    civilite: "M." as const,
    role: "PRINCIPAL" as const,
    initials: "JDP"
  },
  {
    username: "admin@example.com",
    password: "password123",
    name: "Admin Système",
    firstName: "Admin",
    lastName: "SYSTÈME",
    civilite: "M." as const,
    role: "ADMIN" as const,
    initials: "AS"
  }
]

// Données de test - Sessions
export const TEST_SESSIONS = [
  {
    date: "2025-09-15",
    timeSlot: "M2" as const,
    type: "RCD" as const,
    teacherId: 1,
    teacherName: "Sophie MARTIN",
    className: "6A",
    replacedTeacherPrefix: "M.",
    replacedTeacherLastName: "DUPONT",
    replacedTeacherFirstName: "Jean",
    subject: "Mathématiques",
    status: "PENDING_REVIEW" as const
  },
  {
    date: "2025-09-16", 
    timeSlot: "S3" as const,
    type: "DEVOIRS_FAITS" as const,
    teacherId: 1,
    teacherName: "Sophie MARTIN",
    gradeLevel: "6e",
    studentCount: 14,
    status: "PENDING_VALIDATION" as const
  },
  {
    date: "2025-09-17",
    timeSlot: "S2" as const, 
    type: "AUTRE" as const,
    teacherId: 2,
    teacherName: "Marie PETIT",
    description: "Réunion conseil de classe",
    status: "VALIDATED" as const
  },
  {
    date: "2025-09-18",
    timeSlot: "M3" as const,
    type: "RCD" as const, 
    teacherId: 3,
    teacherName: "Jean DUBOIS",
    className: "4B",
    replacedTeacherPrefix: "Mme",
    replacedTeacherLastName: "ROBERT",
    replacedTeacherFirstName: "Julie",
    subject: "Français",
    status: "VALIDATED" as const
  }
]

// Paramètres système
export const TEST_SETTINGS = [
  {
    key: "SESSION_EDIT_WINDOW",
    value: "60",
    description: "Fenêtre d'édition des sessions en minutes",
    updatedBy: "admin@example.com"
  },
  {
    key: "ALLOW_WEEKEND_SESSIONS", 
    value: "false",
    description: "Autoriser la création de sessions le weekend",
    updatedBy: "admin@example.com"
  }
]

// Fonction principale de seed
export async function seedDatabase() {
  console.log('🌱 Début du seeding de la base de données...')
  
  try {
    // 1. Créer les utilisateurs avec mots de passe hachés
    console.log('👥 Création des utilisateurs...')
    for (const user of TEST_USERS) {
      const hashedPassword = await hashPassword(user.password)
      await db.insert(users).values({
        ...user,
        password: hashedPassword
      }).onConflictDoUpdate({
        target: users.username,
        set: {
          firstName: user.firstName,
          lastName: user.lastName,
          civilite: user.civilite,
          subject: user.subject,
          name: user.name,
          role: user.role,
          initials: user.initials,
          inPacte: user.inPacte,
          pacteHoursTarget: user.pacteHoursTarget || 0,
          pacteHoursCompleted: user.pacteHoursCompleted || 0
        }
      })
    }
    console.log(`✅ ${TEST_USERS.length} utilisateurs créés/mis à jour`)

    // 2. Créer les sessions de test
    console.log('📋 Création des sessions...')
    await db.insert(sessions).values(TEST_SESSIONS).onConflictDoNothing()
    console.log(`✅ ${TEST_SESSIONS.length} sessions créées`)

    // 3. Créer les paramètres système
    console.log('⚙️ Création des paramètres système...')
    await db.insert(systemSettings).values(TEST_SETTINGS).onConflictDoNothing()
    console.log(`✅ ${TEST_SETTINGS.length} paramètres créés`)

    console.log('🎉 Seeding terminé avec succès !')
    
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error)
    throw error
  }
}

// Fonction pour vider et recréer les données
export async function resetDatabase() {
  console.log('🗑️ Reset de la base de données...')
  
  try {
    // Supprimer dans l'ordre (contraintes FK)
    await db.delete(sessions)
    await db.delete(users) 
    await db.delete(systemSettings)
    
    console.log('✅ Base vidée, re-seeding...')
    await seedDatabase()
    
  } catch (error) {
    console.error('❌ Erreur lors du reset:', error)
    throw error
  }
}

// Si exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().then(() => {
    console.log('🎯 Seed data appliqué avec succès !')
    process.exit(0)
  }).catch((error) => {
    console.error('💥 Erreur fatale:', error)
    process.exit(1)
  })
}
