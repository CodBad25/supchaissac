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
    username: "sophie.martin@example.com",
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
    username: "marie.petit@example.com",
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
    username: "martin.dubois@example.com",
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
    username: "philippe.garcia@example.com",
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
    username: "laure.martin@example.com",
    password: "password123",
    name: "Laure MARTIN",
    firstName: "Laure",
    lastName: "MARTIN",
    civilite: "Mme" as const,
    role: "SECRETARY" as const,
    initials: "LM"
  },
  {
    username: "jean.dupont@example.com",
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

// Données de test - Sessions (Décembre 2025)
export const TEST_SESSIONS = [
  // ========== TEACHER 1 - Sophie MARTIN (Sans PACTE) - 12 sessions ==========
  // Semaine du 2 décembre
  { date: "2025-12-02", timeSlot: "M2" as const, type: "RCD" as const, teacherId: 1, teacherName: "Sophie MARTIN", className: "6A", replacedTeacherPrefix: "M.", replacedTeacherLastName: "DUPONT", replacedTeacherFirstName: "Jean", subject: "Mathématiques", status: "VALIDATED" as const },
  { date: "2025-12-03", timeSlot: "S1" as const, type: "DEVOIRS_FAITS" as const, teacherId: 1, teacherName: "Sophie MARTIN", gradeLevel: "6e", studentCount: 12, status: "VALIDATED" as const },
  { date: "2025-12-04", timeSlot: "M3" as const, type: "RCD" as const, teacherId: 1, teacherName: "Sophie MARTIN", className: "5B", replacedTeacherPrefix: "Mme", replacedTeacherLastName: "LEROY", replacedTeacherFirstName: "Claire", subject: "Mathématiques", status: "VALIDATED" as const },
  // Semaine du 9 décembre
  { date: "2025-12-09", timeSlot: "S2" as const, type: "DEVOIRS_FAITS" as const, teacherId: 1, teacherName: "Sophie MARTIN", gradeLevel: "5e", studentCount: 15, status: "VALIDATED" as const },
  { date: "2025-12-10", timeSlot: "M1" as const, type: "RCD" as const, teacherId: 1, teacherName: "Sophie MARTIN", className: "4C", replacedTeacherPrefix: "M.", replacedTeacherLastName: "BERNARD", replacedTeacherFirstName: "Marc", subject: "Mathématiques", status: "VALIDATED" as const },
  { date: "2025-12-11", timeSlot: "S3" as const, type: "AUTRE" as const, teacherId: 1, teacherName: "Sophie MARTIN", description: "Accompagnement élèves en difficulté", status: "VALIDATED" as const },
  { date: "2025-12-12", timeSlot: "M2" as const, type: "DEVOIRS_FAITS" as const, teacherId: 1, teacherName: "Sophie MARTIN", gradeLevel: "6e", studentCount: 10, status: "VALIDATED" as const },
  // Semaine du 16 décembre
  { date: "2025-12-16", timeSlot: "S1" as const, type: "RCD" as const, teacherId: 1, teacherName: "Sophie MARTIN", className: "3A", replacedTeacherPrefix: "Mme", replacedTeacherLastName: "MOREAU", replacedTeacherFirstName: "Anne", subject: "Mathématiques", status: "PENDING_VALIDATION" as const },
  { date: "2025-12-17", timeSlot: "M3" as const, type: "DEVOIRS_FAITS" as const, teacherId: 1, teacherName: "Sophie MARTIN", gradeLevel: "4e", studentCount: 8, status: "PENDING_VALIDATION" as const },
  { date: "2025-12-18", timeSlot: "S2" as const, type: "RCD" as const, teacherId: 1, teacherName: "Sophie MARTIN", className: "6B", replacedTeacherPrefix: "M.", replacedTeacherLastName: "PETIT", replacedTeacherFirstName: "Luc", subject: "Mathématiques", status: "PENDING_REVIEW" as const },
  { date: "2025-12-19", timeSlot: "M1" as const, type: "AUTRE" as const, teacherId: 1, teacherName: "Sophie MARTIN", description: "Formation numérique", status: "PENDING_REVIEW" as const },
  { date: "2025-12-20", timeSlot: "S1" as const, type: "DEVOIRS_FAITS" as const, teacherId: 1, teacherName: "Sophie MARTIN", gradeLevel: "3e", studentCount: 6, status: "PENDING_REVIEW" as const },

  // ========== TEACHER 2 - Marie PETIT (Avec PACTE - 20h objectif) - 15 sessions ==========
  // Semaine du 2 décembre
  { date: "2025-12-02", timeSlot: "S1" as const, type: "DEVOIRS_FAITS" as const, teacherId: 2, teacherName: "Marie PETIT", gradeLevel: "6e", studentCount: 14, status: "VALIDATED" as const },
  { date: "2025-12-02", timeSlot: "S3" as const, type: "DEVOIRS_FAITS" as const, teacherId: 2, teacherName: "Marie PETIT", gradeLevel: "5e", studentCount: 12, status: "VALIDATED" as const },
  { date: "2025-12-03", timeSlot: "M2" as const, type: "RCD" as const, teacherId: 2, teacherName: "Marie PETIT", className: "5A", replacedTeacherPrefix: "M.", replacedTeacherLastName: "GARCIA", replacedTeacherFirstName: "Philippe", subject: "Français", status: "VALIDATED" as const },
  { date: "2025-12-04", timeSlot: "S2" as const, type: "AUTRE" as const, teacherId: 2, teacherName: "Marie PETIT", description: "Atelier lecture 6e", status: "VALIDATED" as const },
  { date: "2025-12-05", timeSlot: "M1" as const, type: "DEVOIRS_FAITS" as const, teacherId: 2, teacherName: "Marie PETIT", gradeLevel: "4e", studentCount: 11, status: "VALIDATED" as const },
  // Semaine du 9 décembre
  { date: "2025-12-09", timeSlot: "S1" as const, type: "RCD" as const, teacherId: 2, teacherName: "Marie PETIT", className: "4A", replacedTeacherPrefix: "Mme", replacedTeacherLastName: "DURAND", replacedTeacherFirstName: "Sophie", subject: "Français", status: "VALIDATED" as const },
  { date: "2025-12-10", timeSlot: "M3" as const, type: "DEVOIRS_FAITS" as const, teacherId: 2, teacherName: "Marie PETIT", gradeLevel: "3e", studentCount: 9, status: "VALIDATED" as const },
  { date: "2025-12-10", timeSlot: "S2" as const, type: "DEVOIRS_FAITS" as const, teacherId: 2, teacherName: "Marie PETIT", gradeLevel: "6e", studentCount: 13, status: "VALIDATED" as const },
  { date: "2025-12-11", timeSlot: "M1" as const, type: "AUTRE" as const, teacherId: 2, teacherName: "Marie PETIT", description: "Club théâtre", status: "VALIDATED" as const },
  { date: "2025-12-12", timeSlot: "S3" as const, type: "RCD" as const, teacherId: 2, teacherName: "Marie PETIT", className: "3B", replacedTeacherPrefix: "M.", replacedTeacherLastName: "MARTIN", replacedTeacherFirstName: "Pierre", subject: "Français", status: "VALIDATED" as const },
  // Semaine du 16 décembre
  { date: "2025-12-16", timeSlot: "M2" as const, type: "DEVOIRS_FAITS" as const, teacherId: 2, teacherName: "Marie PETIT", gradeLevel: "5e", studentCount: 10, status: "PENDING_VALIDATION" as const },
  { date: "2025-12-17", timeSlot: "S1" as const, type: "RCD" as const, teacherId: 2, teacherName: "Marie PETIT", className: "6C", replacedTeacherPrefix: "Mme", replacedTeacherLastName: "BLANC", replacedTeacherFirstName: "Marie", subject: "Français", status: "PENDING_VALIDATION" as const },
  { date: "2025-12-18", timeSlot: "M3" as const, type: "DEVOIRS_FAITS" as const, teacherId: 2, teacherName: "Marie PETIT", gradeLevel: "4e", studentCount: 7, status: "PENDING_REVIEW" as const },
  { date: "2025-12-19", timeSlot: "S2" as const, type: "AUTRE" as const, teacherId: 2, teacherName: "Marie PETIT", description: "Accompagnement orientation 3e", status: "PENDING_REVIEW" as const },
  { date: "2025-12-20", timeSlot: "M1" as const, type: "DEVOIRS_FAITS" as const, teacherId: 2, teacherName: "Marie PETIT", gradeLevel: "6e", studentCount: 15, status: "PENDING_REVIEW" as const },

  // ========== TEACHER 3 - Martin DUBOIS (Sans PACTE) - 8 sessions ==========
  { date: "2025-12-03", timeSlot: "M1" as const, type: "RCD" as const, teacherId: 3, teacherName: "Martin DUBOIS", className: "4B", replacedTeacherPrefix: "Mme", replacedTeacherLastName: "ROBERT", replacedTeacherFirstName: "Julie", subject: "Histoire-Géo", status: "VALIDATED" as const },
  { date: "2025-12-05", timeSlot: "S2" as const, type: "AUTRE" as const, teacherId: 3, teacherName: "Martin DUBOIS", description: "Sortie pédagogique musée", status: "VALIDATED" as const },
  { date: "2025-12-09", timeSlot: "M2" as const, type: "RCD" as const, teacherId: 3, teacherName: "Martin DUBOIS", className: "5C", replacedTeacherPrefix: "M.", replacedTeacherLastName: "THOMAS", replacedTeacherFirstName: "Eric", subject: "Histoire-Géo", status: "VALIDATED" as const },
  { date: "2025-12-11", timeSlot: "S1" as const, type: "RCD" as const, teacherId: 3, teacherName: "Martin DUBOIS", className: "3C", replacedTeacherPrefix: "Mme", replacedTeacherLastName: "NICOLAS", replacedTeacherFirstName: "Isabelle", subject: "Histoire-Géo", status: "VALIDATED" as const },
  { date: "2025-12-16", timeSlot: "M3" as const, type: "AUTRE" as const, teacherId: 3, teacherName: "Martin DUBOIS", description: "Préparation voyage scolaire", status: "PENDING_VALIDATION" as const },
  { date: "2025-12-17", timeSlot: "S3" as const, type: "RCD" as const, teacherId: 3, teacherName: "Martin DUBOIS", className: "6A", replacedTeacherPrefix: "M.", replacedTeacherLastName: "LAMBERT", replacedTeacherFirstName: "François", subject: "Histoire-Géo", status: "PENDING_REVIEW" as const },
  { date: "2025-12-19", timeSlot: "M1" as const, type: "RCD" as const, teacherId: 3, teacherName: "Martin DUBOIS", className: "4D", replacedTeacherPrefix: "Mme", replacedTeacherLastName: "GIRARD", replacedTeacherFirstName: "Nathalie", subject: "Histoire-Géo", status: "PENDING_REVIEW" as const },
  { date: "2025-12-20", timeSlot: "S2" as const, type: "AUTRE" as const, teacherId: 3, teacherName: "Martin DUBOIS", description: "Réunion conseil de classe", status: "PENDING_REVIEW" as const },

  // ========== TEACHER 4 - Philippe GARCIA (Avec PACTE - 18h objectif) - 14 sessions ==========
  { date: "2025-12-02", timeSlot: "M1" as const, type: "DEVOIRS_FAITS" as const, teacherId: 4, teacherName: "Philippe GARCIA", gradeLevel: "5e", studentCount: 11, status: "VALIDATED" as const },
  { date: "2025-12-03", timeSlot: "S2" as const, type: "RCD" as const, teacherId: 4, teacherName: "Philippe GARCIA", className: "3A", replacedTeacherPrefix: "Mme", replacedTeacherLastName: "ROUX", replacedTeacherFirstName: "Catherine", subject: "SVT", status: "VALIDATED" as const },
  { date: "2025-12-04", timeSlot: "M2" as const, type: "DEVOIRS_FAITS" as const, teacherId: 4, teacherName: "Philippe GARCIA", gradeLevel: "6e", studentCount: 13, status: "VALIDATED" as const },
  { date: "2025-12-05", timeSlot: "S1" as const, type: "AUTRE" as const, teacherId: 4, teacherName: "Philippe GARCIA", description: "Club nature", status: "VALIDATED" as const },
  { date: "2025-12-09", timeSlot: "M3" as const, type: "RCD" as const, teacherId: 4, teacherName: "Philippe GARCIA", className: "5D", replacedTeacherPrefix: "M.", replacedTeacherLastName: "DAVID", replacedTeacherFirstName: "Michel", subject: "SVT", status: "VALIDATED" as const },
  { date: "2025-12-10", timeSlot: "S3" as const, type: "DEVOIRS_FAITS" as const, teacherId: 4, teacherName: "Philippe GARCIA", gradeLevel: "4e", studentCount: 9, status: "VALIDATED" as const },
  { date: "2025-12-11", timeSlot: "M1" as const, type: "DEVOIRS_FAITS" as const, teacherId: 4, teacherName: "Philippe GARCIA", gradeLevel: "3e", studentCount: 8, status: "VALIDATED" as const },
  { date: "2025-12-12", timeSlot: "S2" as const, type: "RCD" as const, teacherId: 4, teacherName: "Philippe GARCIA", className: "6B", replacedTeacherPrefix: "Mme", replacedTeacherLastName: "SIMON", replacedTeacherFirstName: "Laurence", subject: "SVT", status: "VALIDATED" as const },
  { date: "2025-12-12", timeSlot: "S4" as const, type: "AUTRE" as const, teacherId: 4, teacherName: "Philippe GARCIA", description: "Préparation TP labo", status: "VALIDATED" as const },
  { date: "2025-12-16", timeSlot: "M2" as const, type: "DEVOIRS_FAITS" as const, teacherId: 4, teacherName: "Philippe GARCIA", gradeLevel: "5e", studentCount: 12, status: "PENDING_VALIDATION" as const },
  { date: "2025-12-17", timeSlot: "S1" as const, type: "RCD" as const, teacherId: 4, teacherName: "Philippe GARCIA", className: "4A", replacedTeacherPrefix: "M.", replacedTeacherLastName: "MOREL", replacedTeacherFirstName: "Yves", subject: "SVT", status: "PENDING_VALIDATION" as const },
  { date: "2025-12-18", timeSlot: "M3" as const, type: "DEVOIRS_FAITS" as const, teacherId: 4, teacherName: "Philippe GARCIA", gradeLevel: "6e", studentCount: 14, status: "PENDING_REVIEW" as const },
  { date: "2025-12-19", timeSlot: "S3" as const, type: "AUTRE" as const, teacherId: 4, teacherName: "Philippe GARCIA", description: "Sortie forêt", status: "PENDING_REVIEW" as const },
  { date: "2025-12-20", timeSlot: "M1" as const, type: "RCD" as const, teacherId: 4, teacherName: "Philippe GARCIA", className: "3D", replacedTeacherPrefix: "Mme", replacedTeacherLastName: "FOURNIER", replacedTeacherFirstName: "Christine", subject: "SVT", status: "PENDING_REVIEW" as const }
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
    // Ajouter validatedAt aux sessions VALIDATED avant insertion
    const sessionsWithDates = TEST_SESSIONS.map(s => {
      if (s.status === 'VALIDATED') {
        // Date de validation = 3 jours après la date de la session
        const sessionDate = new Date(s.date)
        const validatedDate = new Date(sessionDate)
        validatedDate.setDate(validatedDate.getDate() + 3)
        return { ...s, validatedAt: validatedDate }
      }
      return s
    })
    await db.insert(sessions).values(sessionsWithDates).onConflictDoNothing()
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
  if (process.env.NODE_ENV === 'production') {
    throw new Error('INTERDIT : resetDatabase() ne peut pas être exécuté en production')
  }

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
