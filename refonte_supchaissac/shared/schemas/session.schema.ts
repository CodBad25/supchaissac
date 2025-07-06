import { z } from 'zod';

export const userRoleEnum = z.enum(['TEACHER', 'SECRETARY', 'PRINCIPAL', 'ADMIN']);
export const timeSlotEnum = z.enum(['M1', 'M2', 'M3', 'M4', 'S1', 'S2', 'S3', 'S4']);
export const sessionTypeEnum = z.enum(['RCD', 'DEVOIRS_FAITS', 'HSE', 'AUTRE']);
export const sessionStatusEnum = z.enum([
  'SUBMITTED',
  'INCOMPLETE',
  'REVIEWED',
  'VALIDATED',
  'READY_FOR_PAYMENT',
  'PAID',
  'REJECTED',
]);

export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
  name: z.string(),
  role: userRoleEnum,
  inPacte: z.boolean().optional(),
});

export const insertSessionSchema = z.object({
  date: z.string(),
  timeSlot: timeSlotEnum,
  type: sessionTypeEnum,
  originalType: sessionTypeEnum,
  teacherId: z.number(),
  teacherName: z.string(),
  inPacte: z.boolean().optional(),
  status: sessionStatusEnum.optional(),
  replacedTeacherPrefix: z.string().optional(),
  replacedTeacherLastName: z.string().optional(),
  replacedTeacherFirstName: z.string().optional(),
  replacedTeacherName: z.string().optional(),
  className: z.string().optional(),
  subject: z.string().optional(),
  comment: z.string().optional(),
  studentCount: z.number().optional(),
  gradeLevel: z.string().optional(),
  description: z.string().optional(),
});

export const insertTeacherSetupSchema = z.object({
  teacherId: z.number(),
  inPacte: z.boolean().optional(),
  signature: z.string().optional(),
});

export const insertSystemSettingSchema = z.object({
  key: z.string(),
  value: z.string(),
  description: z.string().optional(),
});

export const TIME_SLOTS = {
  M1: { label: 'M1', time: '8h - 9h' },
  M2: { label: 'M2', time: '9h - 10h' },
  M3: { label: 'M3', time: '10h - 11h' },
  M4: { label: 'M4', time: '11h - 12h' },
  S1: { label: 'S1', time: '13h - 14h' },
  S2: { label: 'S2', time: '14h - 15h' },
  S3: { label: 'S3', time: '15h - 16h' },
  S4: { label: 'S4', time: '16h - 17h' },
};
