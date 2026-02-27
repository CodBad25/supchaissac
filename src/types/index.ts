// Types partagés entre frontend et backend

export interface UserData {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  civilite: string | null;
  subject: string | null;
  role: 'TEACHER' | 'SECRETARY' | 'PRINCIPAL' | 'ADMIN';
  inPacte: boolean;
  pacteHoursTarget: number;
  pacteHoursCompleted: number;
  pacteHoursDF: number;
  pacteHoursRCD: number;
  pacteHoursCompletedDF: number;
  pacteHoursCompletedRCD: number;
}

export interface SessionData {
  id: number;
  date: string;
  timeSlot: string;
  type: 'RCD' | 'DEVOIRS_FAITS' | 'AUTRE' | 'HSE';
  teacherId: number;
  teacherName: string;
  status: 'PENDING_REVIEW' | 'PENDING_VALIDATION' | 'VALIDATED' | 'REJECTED' | 'PAID';
  createdAt: string;
  updatedAt: string | null;
  updatedBy: string | null;
  className: string | null;
  replacedTeacherPrefix: string | null;
  replacedTeacherLastName: string | null;
  replacedTeacherFirstName: string | null;
  subject: string | null;
  gradeLevel: string | null;
  studentCount: number | null;
  studentsList: unknown;
  description: string | null;
  comment: string | null;
  reviewComments: string | null;
  validationComments: string | null;
  rejectionReason: string | null;
  originalType: string | null;
}

export interface AttachmentData {
  id: number;
  sessionId: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string | null;
  uploadedBy: string;
  uploadedAt: string;
  isVerified: boolean;
}

export interface TeacherData {
  id: number;
  name: string;
  username: string;
  initials: string;
  inPacte: boolean;
  pacteHoursTarget: number;
  pacteHoursCompleted: number;
  pacteHoursDF: number;
  pacteHoursRCD: number;
  pacteHoursCompletedDF: number;
  pacteHoursCompletedRCD: number;
  stats: {
    totalSessions: number;
    currentYearSessions: number;
    rcdSessions: number;
    devoirsFaitsSessions: number;
    hseSessions: number;
    validatedSessions: number;
  };
}
