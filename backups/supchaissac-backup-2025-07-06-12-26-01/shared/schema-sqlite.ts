import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model for SQLite
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ['TEACHER', 'SECRETARY', 'PRINCIPAL', 'ADMIN'] }).notNull().default('TEACHER'),
  initials: text("initials"),
  signature: text("signature"),
  inPacte: integer("in_pacte", { mode: 'boolean' }).default(false),
});

// Sessions model for SQLite
export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull(), // Date in YYYY-MM-DD format
  timeSlot: text("time_slot", { 
    enum: ['M1', 'M2', 'M3', 'M4', 'S1', 'S2', 'S3', 'S4'] 
  }).notNull(),
  type: text("type", { enum: ['RCD', 'DEVOIRS_FAITS', 'HSE', 'AUTRE'] }).notNull(),
  teacherId: integer("teacher_id").notNull(),
  teacherName: text("teacher_name").notNull(),
  inPacte: integer("in_pacte", { mode: 'boolean' }).default(false),
  status: text("status", { 
    enum: ['PENDING_REVIEW', 'PENDING_VALIDATION', 'VALIDATED', 'REJECTED', 'PAID'] 
  }).notNull().default('PENDING_REVIEW'),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }),
  updatedBy: text("updated_by"),
  
  // Session details
  classes: text("classes"), // JSON string of selected classes
  subject: text("subject"),
  description: text("description"),
  
  // Validation workflow
  reviewedBy: text("reviewed_by"),
  reviewedAt: integer("reviewed_at", { mode: 'timestamp' }),
  reviewComments: text("review_comments"),
  
  validatedBy: text("validated_by"),
  validatedAt: integer("validated_at", { mode: 'timestamp' }),
  validationComments: text("validation_comments"),
  
  rejectedBy: text("rejected_by"),
  rejectedAt: integer("rejected_at", { mode: 'timestamp' }),
  rejectionReason: text("rejection_reason"),
  
  paidBy: text("paid_by"),
  paidAt: integer("paid_at", { mode: 'timestamp' }),
  paymentReference: text("payment_reference"),
});

// Teacher setups model for SQLite
export const teacherSetups = sqliteTable("teacher_setups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  teacherId: integer("teacher_id").notNull().unique(),
  preferredSubjects: text("preferred_subjects"), // JSON array
  availableTimeSlots: text("available_time_slots"), // JSON array
  maxHoursPerWeek: integer("max_hours_per_week").default(10),
  notifications: integer("notifications", { mode: 'boolean' }).default(true),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }),
});

// System settings model for SQLite
export const systemSettings = sqliteTable("system_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedBy: text("updated_by").notNull(),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

export type TeacherSetup = typeof teacherSetups.$inferSelect;
export type InsertTeacherSetup = typeof teacherSetups.$inferInsert;

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;

// Validation schemas
export const insertUserSchema = createInsertSchema(users);
export const insertSessionSchema = createInsertSchema(sessions);
export const insertTeacherSetupSchema = createInsertSchema(teacherSetups);
export const insertSystemSettingSchema = createInsertSchema(systemSettings);

// Enums for validation
export const UserRole = z.enum(['TEACHER', 'SECRETARY', 'PRINCIPAL', 'ADMIN']);
export const TimeSlot = z.enum(['M1', 'M2', 'M3', 'M4', 'S1', 'S2', 'S3', 'S4']);
export const SessionType = z.enum(['RCD', 'DEVOIRS_FAITS', 'HSE', 'AUTRE']);
export const SessionStatus = z.enum(['PENDING_REVIEW', 'PENDING_VALIDATION', 'VALIDATED', 'REJECTED', 'PAID']);
