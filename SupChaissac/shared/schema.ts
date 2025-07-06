import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export const userRoleEnum = pgEnum('user_role', ['TEACHER', 'SECRETARY', 'PRINCIPAL', 'ADMIN']);

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default('TEACHER'),
  initials: text("initials"),
  signature: text("signature"),
  inPacte: boolean("in_pacte").default(false),
});

// Time slots enum
export const timeSlotEnum = pgEnum('time_slot', [
  'M1', 'M2', 'M3', 'M4',  // Morning slots
  'S1', 'S2', 'S3', 'S4'   // Afternoon slots
]);

// Session types enum
export const sessionTypeEnum = pgEnum('session_type', ['RCD', 'DEVOIRS_FAITS', 'HSE', 'AUTRE']);

// Session status enum
export const sessionStatusEnum = pgEnum('session_status', [
  'SUBMITTED',           // Créé par l'enseignant
  'INCOMPLETE',          // À compléter (il manque une info ou un document)
  'REVIEWED',            // Vérifié (par le secrétariat ou le principal)
  'VALIDATED',           // Validé par le principal (peut être transformé)
  'READY_FOR_PAYMENT',   // En attente de saisie manuelle par le secrétariat
  'PAID',                // Payée (statut final)
  'REJECTED'             // Refusé définitivement
]);

// Sessions model
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // Date in YYYY-MM-DD format
  timeSlot: timeSlotEnum("time_slot").notNull(),
  type: sessionTypeEnum("type").notNull(),
  originalType: sessionTypeEnum("original_type").notNull(), // Type initial de la session (ne change jamais)
  teacherId: integer("teacher_id").notNull(),
  teacherName: text("teacher_name").notNull(),
  inPacte: boolean("in_pacte").default(false),
  status: sessionStatusEnum("status").notNull().default('SUBMITTED'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
  updatedBy: text("updated_by"),
  
  // Fields specific to RCD
  replacedTeacherPrefix: text("replaced_teacher_prefix"), // M. or Mme
  replacedTeacherLastName: text("replaced_teacher_last_name"),
  replacedTeacherFirstName: text("replaced_teacher_first_name"),
  replacedTeacherName: text("replaced_teacher_name"),
  className: text("class_name"),
  subject: text("subject"),
  comment: text("comment"),
  
  // Fields specific to Devoirs Faits
  studentCount: integer("student_count"),
  gradeLevel: text("grade_level"),
  
  // Fields specific to Autre
  description: text("description"),
});

// Teacher setup model
export const teacherSetups = pgTable("teacher_setups", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().unique(),
  inPacte: boolean("in_pacte").default(false),
  signature: text("signature"),
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

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
  inPacte: true,
});

// Schéma de base pour l'insertion de session
const baseInsertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  updatedBy: true,
  originalType: true, // On retire originalType car il sera calculé automatiquement
});

// Schéma final avec transformation pour définir automatiquement originalType
export const insertSessionSchema = baseInsertSessionSchema.transform((data) => {
  // originalType est toujours initialisé avec la même valeur que type à la création
  return {
    ...data,
    originalType: data.type
  };
});

export const insertTeacherSetupSchema = createInsertSchema(teacherSetups).omit({
  id: true,
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export type InsertTeacherSetup = z.infer<typeof insertTeacherSetupSchema>;
export type TeacherSetup = typeof teacherSetups.$inferSelect;

export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type SystemSetting = typeof systemSettings.$inferSelect;

// Time slot mappings
export const TIME_SLOTS = {
  M1: { label: 'M1', time: '8h - 9h' },
  M2: { label: 'M2', time: '9h - 10h' },
  M3: { label: 'M3', time: '10h15 - 11h15' },
  M4: { label: 'M4', time: '11h15 - 12h15' },
  S1: { label: 'S1', time: '13h30 - 14h30' },
  S2: { label: 'S2', time: '14h30 - 15h30' },
  S3: { label: 'S3', time: '15h45 - 16h45' },
  S4: { label: 'S4', time: '16h45 - 17h45' }
};

// Session type mappings
export const SESSION_TYPES = {
  RCD: { 
    label: 'RCD', 
    description: 'Remplacement courte durée',
    color: 'rcd'
  },
  DEVOIRS_FAITS: { 
    label: 'Devoirs Faits', 
    description: 'Accompagnement',
    color: 'devoirs-faits'
  },
  HSE: { 
    label: 'HSE', 
    description: 'Heures supplémentaires effectives',
    color: 'blue'
  },
  AUTRE: { 
    label: 'Autre', 
    description: 'Activité spécifique',
    color: 'autre'
  }
};

// Session status mappings
export const SESSION_STATUS = {
  SUBMITTED: { 
    label: 'Soumise', 
    description: 'Créée par l\'enseignant',
    color: 'gray'
  },
  INCOMPLETE: { 
    label: 'Incomplète', 
    description: 'Il manque des informations ou documents',
    color: 'amber'
  },
  REVIEWED: { 
    label: 'Vérifiée', 
    description: 'Vérifiée par le secrétariat ou le principal',
    color: 'blue'
  },
  VALIDATED: { 
    label: 'Validée', 
    description: 'Validée par le principal',
    color: 'validated'
  },
  READY_FOR_PAYMENT: { 
    label: 'Prête pour paiement', 
    description: 'En attente de saisie manuelle par le secrétariat',
    color: 'green'
  },
  PAID: { 
    label: 'Payée', 
    description: 'Mise en paiement effectuée',
    color: 'paid'
  },
  REJECTED: { 
    label: 'Refusée', 
    description: 'Refusée définitivement',
    color: 'destructive'
  }
};

// Grade level options
export const GRADE_LEVELS = ['6e', '5e', '4e', '3e'];
