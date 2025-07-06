export type UserRole = 'TEACHER' | 'SECRETARY' | 'PRINCIPAL' | 'ADMIN';
export type TimeSlot = 'M1' | 'M2' | 'M3' | 'M4' | 'S1' | 'S2' | 'S3' | 'S4';
export type SessionType = 'RCD' | 'DEVOIRS_FAITS' | 'HSE' | 'AUTRE';
export type SessionStatus =
  | 'SUBMITTED'
  | 'INCOMPLETE'
  | 'REVIEWED'
  | 'VALIDATED'
  | 'READY_FOR_PAYMENT'
  | 'PAID'
  | 'REJECTED';

export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  initials?: string;
  signature?: string;
  inPacte?: boolean;
}

export interface Session {
  id: number;
  date: string;
  timeSlot: TimeSlot;
  type: SessionType;
  originalType: SessionType;
  teacherId: number;
  teacherName: string;
  inPacte?: boolean;
  status?: SessionStatus;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  replacedTeacherPrefix?: string;
  replacedTeacherLastName?: string;
  replacedTeacherFirstName?: string;
  replacedTeacherName?: string;
  className?: string;
  subject?: string;
  comment?: string;
  studentCount?: number;
  gradeLevel?: string;
  description?: string;
}

export interface TeacherSetup {
  id: number;
  teacherId: number;
  inPacte?: boolean;
  signature?: string;
}

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  description?: string;
  updatedAt?: string;
  updatedBy?: string;
}
