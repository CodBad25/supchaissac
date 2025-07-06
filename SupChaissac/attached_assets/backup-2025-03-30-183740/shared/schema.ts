import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export const userRoleEnum = pgEnum('user_role', ['TEACHER', 'SECRETARY', 'PRINCIPAL']);

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default('TEACHER'),
  initials: text("initials"),
  signature: text("signature"),
});

// Time slots enum
export const timeSlotEnum = pgEnum('time_slot', [
  'M1', 'M2', 'M3', 'M4',  // Morning slots
  'S1', 'S2', 'S3', 'S4'   // Afternoon slots
]);

// Session types enum
export const sessionTypeEnum = pgEnum('session_type', ['RCD', 'DEVOIRS_FAITS', 'AUTRE']);

// Session status enum
export const sessionStatusEnum = pgEnum('session_status', [
  'PENDING_REVIEW',      // Just created by teacher
  'PENDING_VALIDATION',  // Verified by secretary, waiting for principal
  'VALIDATED',           // Validated by principal
  'REJECTED',            // Rejected by secretary or principal
  'PAID'                 // Marked as paid by secretary
]);

// Sessions model
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(), // Date in YYYY-MM-DD format
  timeSlot: timeSlotEnum("time_slot").notNull(),
  type: sessionTypeEnum("type").notNull(),
  teacherId: integer("teacher_id").notNull(),
  teacherName: text("teacher_name").notNull(),
  inPacte: boolean("in_pacte").default(false),
  status: sessionStatusEnum("status").notNull().default('PENDING_REVIEW'),
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

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  updatedBy: true,
});

export const insertTeacherSetupSchema = createInsertSchema(teacherSetups).omit({
  id: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export type InsertTeacherSetup = z.infer<typeof insertTeacherSetupSchema>;
export type TeacherSetup = typeof teacherSetups.$inferSelect;

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
  AUTRE: { 
    label: 'Autre', 
    description: 'Activité spécifique',
    color: 'autre'
  }
};

// Session status mappings
export const SESSION_STATUS = {
  PENDING_REVIEW: { 
    label: 'En attente', 
    description: 'En attente de vérification',
    color: 'gray'
  },
  PENDING_VALIDATION: { 
    label: 'À valider', 
    description: 'En attente de validation par le principal',
    color: 'pending'
  },
  VALIDATED: { 
    label: 'Validée', 
    description: 'Validée par le principal',
    color: 'validated'
  },
  REJECTED: { 
    label: 'Refusée', 
    description: 'Refusée',
    color: 'destructive'
  },
  PAID: { 
    label: 'Payée', 
    description: 'Mise en paiement effectuée',
    color: 'paid'
  }
};

// Grade level options
export const GRADE_LEVELS = ['6e', '5e', '4e', '3e'];
