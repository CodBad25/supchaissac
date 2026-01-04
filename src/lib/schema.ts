import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export const userRoleEnum = pgEnum('user_role', ['TEACHER', 'SECRETARY', 'PRINCIPAL', 'ADMIN']);

// Civilité enum
export const civiliteEnum = pgEnum('civilite', ['M.', 'Mme']);

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  firstName: text("first_name"), // Prénom
  lastName: text("last_name"), // Nom de famille
  civilite: civiliteEnum("civilite"), // M. ou Mme
  subject: text("subject"), // Matière enseignée (pour les enseignants)
  role: userRoleEnum("role").notNull().default('TEACHER'),
  initials: text("initials"),
  signature: text("signature"),
  inPacte: boolean("in_pacte").default(false), // Géré par secrétaire/admin uniquement
  pacteHoursTarget: integer("pacte_hours_target").default(0), // Objectif annuel PACTE total
  pacteHoursCompleted: integer("pacte_hours_completed").default(0), // Heures PACTE réalisées total
  pacteHoursDF: integer("pacte_hours_df").default(0), // Heures Devoirs Faits prévues au contrat
  pacteHoursRCD: integer("pacte_hours_rcd").default(0), // Heures RCD prévues au contrat
  pacteHoursCompletedDF: integer("pacte_hours_completed_df").default(0), // Heures DF déjà réalisées (saisie manuelle)
  pacteHoursCompletedRCD: integer("pacte_hours_completed_rcd").default(0), // Heures RCD déjà réalisées (saisie manuelle)
  // Activation par email
  isActivated: boolean("is_activated").default(false), // Compte activé ?
  activationToken: text("activation_token"), // Token pour activer le compte
  activationTokenExpiry: timestamp("activation_token_expiry"), // Expiration du token
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

// Time slots enum
export const timeSlotEnum = pgEnum('time_slot', [
  'M1', 'M2', 'M3', 'M4',  // Morning slots (8h-9h, 9h-10h, 10h-11h, 11h-12h)
  'S1', 'S2', 'S3', 'S4'   // Afternoon slots (13h-14h, 14h-15h, 15h-16h, 16h-17h)
]);

// Session types enum
export const sessionTypeEnum = pgEnum('session_type', ['RCD', 'DEVOIRS_FAITS', 'AUTRE', 'HSE']);

// Session status enum
// Note: 'PAID' signifie "Mis en paiement" (transmis pour paiement), PAS "Payé"
// Un futur statut 'PAYMENT_COMPLETED' sera ajouté pour le vrai "Payé"
export const sessionStatusEnum = pgEnum('session_status', [
  'PENDING_REVIEW',      // Créée par enseignant, à vérifier par secrétaire
  'PENDING_VALIDATION',  // Vérifiée par secrétaire, à valider par principal
  'VALIDATED',           // Validée par principal
  'REJECTED',            // Refusée (avec motif)
  'PAID'                 // Mis en paiement (transmis pour paiement par secrétaire) - PAS "Payé"
]);

// Sessions model - SCHÉMA UNIFIÉ
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // Format YYYY-MM-DD
  timeSlot: timeSlotEnum("time_slot").notNull(),
  type: sessionTypeEnum("type").notNull(),
  teacherId: integer("teacher_id").notNull(),
  teacherName: text("teacher_name").notNull(),
  status: sessionStatusEnum("status").notNull().default('PENDING_REVIEW'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
  updatedBy: text("updated_by"),
  
  // Champs RCD (Remplacement Courte Durée)
  className: text("class_name"), // Ex: "6A", "5B"
  replacedTeacherPrefix: text("replaced_teacher_prefix"), // "M." ou "Mme"
  replacedTeacherLastName: text("replaced_teacher_last_name"), // "DUPONT"
  replacedTeacherFirstName: text("replaced_teacher_first_name"), // "Jean"
  subject: text("subject"), // Matière enseignée
  
  // Champs DEVOIRS_FAITS
  gradeLevel: text("grade_level"), // "6e", "5e", "4e", "3e", "mixte"
  studentCount: integer("student_count"), // Nombre d'élèves
  studentsList: jsonb("students_list"), // Liste des élèves [{lastName, firstName, className}]
  
  // Champs AUTRE
  description: text("description"), // Description libre
  
  // Commentaires et feedback
  comment: text("comment"), // Commentaire enseignant
  reviewComments: text("review_comments"), // Commentaires secrétaire
  validationComments: text("validation_comments"), // Commentaires principal
  rejectionReason: text("rejection_reason"), // Motif de rejet

  // Traçabilité des conversions
  originalType: sessionTypeEnum("original_type"), // Type original avant conversion (null si pas de conversion)
});

// System settings model
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: text("updated_by"),
});

// Attachments model
export const attachments = pgTable("attachments", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  url: text("url"), // URL Scaleway Object Storage
  uploadedBy: text("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  isVerified: boolean("is_verified").default(false),
});

// Hour quotas model - Budgets annuels de l'établissement
export const hourQuotas = pgTable("hour_quotas", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'HSE' | 'DEVOIRS_FAITS' | 'RCD'
  budgetHours: integer("budget_hours").notNull().default(0),
  schoolYear: text("school_year").notNull(), // Format: "2024-2025"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
  updatedBy: text("updated_by"),
});

// Students model - Élèves importés depuis CSV Pronote
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  lastName: text("last_name").notNull(), // Nom
  firstName: text("first_name").notNull(), // Prénom
  birthDate: text("birth_date"), // Né(e) le - format texte pour flexibilité
  usageFirstName: text("usage_first_name"), // Prénom d'usage
  gender: text("gender"), // Sexe (M/F)
  className: text("class_name").notNull(), // Classe (6A, 5B, etc.)
  accompanimentProject: text("accompaniment_project"), // Projet d'accompagnement (PAP, PPS, etc.)
  schoolYear: text("school_year").notNull(), // Année scolaire "2024-2025"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  importedBy: text("imported_by"), // Qui a fait l'import
});

// Types TypeScript
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;
export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = typeof attachments.$inferInsert;
export type HourQuota = typeof hourQuotas.$inferSelect;
export type InsertHourQuota = typeof hourQuotas.$inferInsert;
export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;

// Schémas de validation Zod
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schéma de validation personnalisé pour les sessions
export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  updatedBy: true,
  teacherId: true,  // Sera rempli côté serveur
  teacherName: true,  // Sera rempli côté serveur
  status: true,  // Sera rempli côté serveur par défaut
}).partial({
  // Tous les champs spécifiques sont optionnels car dépendent du type
  className: true,
  replacedTeacherPrefix: true,
  replacedTeacherLastName: true,
  replacedTeacherFirstName: true,
  subject: true,
  gradeLevel: true,
  studentCount: true,
  studentsList: true,
  description: true,
  comment: true,
  reviewComments: true,
  validationComments: true,
  rejectionReason: true,
  originalType: true,
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true,
});

// Constantes pour l'UI
export const TIME_SLOTS = [
  { id: 'M1', label: '8h-9h', period: 'morning' },
  { id: 'M2', label: '9h-10h', period: 'morning' },
  { id: 'M3', label: '10h-11h', period: 'morning' },
  { id: 'M4', label: '11h-12h', period: 'morning' },
  { id: 'S1', label: '13h-14h', period: 'afternoon' },
  { id: 'S2', label: '14h-15h', period: 'afternoon' },
  { id: 'S3', label: '15h-16h', period: 'afternoon' },
  { id: 'S4', label: '16h-17h', period: 'afternoon' },
] as const;

export const GRADE_LEVELS = ['6e', '5e', '4e', '3e', 'mixte'] as const;

export const SUBJECT_CATEGORIES = {
  sciences: {
    name: 'Sciences',
    subjects: [
      { id: 'math', name: 'Mathématiques', color: 'bg-blue-600' },
      { id: 'svt', name: 'SVT', color: 'bg-green-600' },
      { id: 'physique', name: 'Physique-Chimie', color: 'bg-cyan-600' },
      { id: 'technologie', name: 'Technologie', color: 'bg-slate-700' },
    ]
  },
  lettres: {
    name: 'Lettres',
    subjects: [
      { id: 'francais', name: 'Français', color: 'bg-red-600' },
      { id: 'histoire', name: 'Histoire-Géographie', color: 'bg-yellow-600' },
      { id: 'anglais', name: 'Anglais', color: 'bg-indigo-600' },
      { id: 'espagnol', name: 'Espagnol', color: 'bg-orange-600' },
    ]
  },
  autres: {
    name: 'Autres',
    subjects: [
      { id: 'eps', name: 'EPS', color: 'bg-orange-600' },
      { id: 'arts', name: 'Arts Plastiques', color: 'bg-pink-600' },
      { id: 'musique', name: 'Éducation Musicale', color: 'bg-purple-600' },
    ]
  }
} as const;
