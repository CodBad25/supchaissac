import { Session, Attachment } from '@/hooks/use-session-management';

// Données de test pour les utilisateurs
export const mockUsers = [
  {
    id: 1,
    username: 'smartin',
    password: 'password',
    name: 'MARTIN',
    firstName: 'Sophie',
    email: 'sophie.martin@education.fr',
    role: 'TEACHER',
    inPacte: false
  },
  {
    id: 2,
    username: 'jdupont',
    password: 'password',
    name: 'DUPONT',
    firstName: 'Jean',
    email: 'jean.dupont@education.fr',
    role: 'TEACHER',
    inPacte: true
  },
  {
    id: 3,
    username: 'mleroy',
    password: 'password',
    name: 'LEROY',
    firstName: 'Marie',
    email: 'marie.leroy@education.fr',
    role: 'TEACHER',
    inPacte: false
  },
  {
    id: 4,
    username: 'pbernard',
    password: 'password',
    name: 'BERNARD',
    firstName: 'Pierre',
    email: 'pierre.bernard@education.fr',
    role: 'PRINCIPAL',
    inPacte: false
  }
];

// Données de test pour les sessions
export const mockSessions: Session[] = [
  {
    id: 1,
    date: '2025-04-15',
    timeSlot: 'M1 (8h-9h)',
    type: 'RCD',
    originalType: 'RCD',
    teacherId: 2,
    teacherName: 'DUPONT',
    teacherFirstName: 'Jean',
    inPacte: true,
    status: 'SUBMITTED',
    createdAt: '2025-04-14T10:30:00',
    replacedTeacherPrefix: 'Mme',
    replacedTeacherLastName: 'PETIT',
    replacedTeacherFirstName: 'Lucie',
    className: '3ème B',
    subject: 'Mathématiques'
  },
  {
    id: 2,
    date: '2025-04-16',
    timeSlot: 'M3 (10h-11h)',
    type: 'DEVOIRS_FAITS',
    originalType: 'DEVOIRS_FAITS',
    teacherId: 3,
    teacherName: 'LEROY',
    teacherFirstName: 'Marie',
    inPacte: false,
    status: 'VALIDATED',
    createdAt: '2025-04-14T14:15:00',
    updatedAt: '2025-04-15T09:20:00',
    updatedBy: 'MARTIN Sophie',
    studentCount: 12,
    gradeLevel: '4ème'
  },
  {
    id: 3,
    date: '2025-04-17',
    timeSlot: 'S2 (14h-15h)',
    type: 'HSE',
    originalType: 'HSE',
    teacherId: 2,
    teacherName: 'DUPONT',
    teacherFirstName: 'Jean',
    inPacte: true,
    status: 'REJECTED',
    createdAt: '2025-04-15T08:45:00',
    updatedAt: '2025-04-16T11:30:00',
    updatedBy: 'MARTIN Sophie',
    description: 'Atelier de préparation au brevet',
    comment: 'Rejeté: Activité déjà couverte par les heures supplémentaires annualisées.'
  },
  {
    id: 4,
    date: '2025-04-18',
    timeSlot: 'M2 (9h-10h)',
    type: 'RCD',
    originalType: 'RCD',
    teacherId: 3,
    teacherName: 'LEROY',
    teacherFirstName: 'Marie',
    inPacte: false,
    status: 'SUBMITTED',
    createdAt: '2025-04-16T16:20:00',
    replacedTeacherPrefix: 'M.',
    replacedTeacherLastName: 'DUBOIS',
    replacedTeacherFirstName: 'Thomas',
    className: '5ème A',
    subject: 'Français'
  },
  {
    id: 5,
    date: '2025-04-19',
    timeSlot: 'S1 (13h-14h)',
    type: 'AUTRE',
    originalType: 'AUTRE',
    teacherId: 2,
    teacherName: 'DUPONT',
    teacherFirstName: 'Jean',
    inPacte: true,
    status: 'VALIDATED',
    createdAt: '2025-04-17T09:10:00',
    updatedAt: '2025-04-18T10:05:00',
    updatedBy: 'MARTIN Sophie',
    description: 'Accompagnement personnalisé pour élève en difficulté'
  },
  {
    id: 6,
    date: '2025-04-20',
    timeSlot: 'M4 (11h-12h)',
    type: 'DEVOIRS_FAITS',
    originalType: 'DEVOIRS_FAITS',
    teacherId: 3,
    teacherName: 'LEROY',
    teacherFirstName: 'Marie',
    inPacte: false,
    status: 'READY_FOR_PAYMENT',
    createdAt: '2025-04-18T14:30:00',
    updatedAt: '2025-04-19T11:45:00',
    updatedBy: 'MARTIN Sophie',
    studentCount: 8,
    gradeLevel: '6ème'
  },
  {
    id: 7,
    date: '2025-04-21',
    timeSlot: 'S3 (15h-16h)',
    type: 'HSE',
    originalType: 'HSE',
    teacherId: 2,
    teacherName: 'DUPONT',
    teacherFirstName: 'Jean',
    inPacte: true,
    status: 'PAID',
    createdAt: '2025-04-19T08:20:00',
    updatedAt: '2025-04-20T09:15:00',
    updatedBy: 'MARTIN Sophie',
    description: 'Préparation aux Olympiades de mathématiques'
  },
  {
    id: 8,
    date: '2025-04-22',
    timeSlot: 'M1 (8h-9h)',
    type: 'RCD',
    originalType: 'RCD',
    teacherId: 3,
    teacherName: 'LEROY',
    teacherFirstName: 'Marie',
    inPacte: false,
    status: 'INCOMPLETE',
    createdAt: '2025-04-20T16:50:00',
    replacedTeacherPrefix: 'Mme',
    replacedTeacherLastName: 'MOREAU',
    replacedTeacherFirstName: 'Claire',
    className: '4ème C',
    subject: 'Histoire-Géographie'
  }
];

// Données de test pour les pièces jointes
export const mockAttachments: Attachment[] = [
  {
    id: 1,
    name: 'justificatif_absence_dubois.pdf',
    type: 'application/pdf',
    size: 245678,
    url: '/attachments/justificatif_absence_dubois.pdf',
    isVerified: true
  },
  {
    id: 2,
    name: 'emploi_du_temps_5A.pdf',
    type: 'application/pdf',
    size: 189456,
    url: '/attachments/emploi_du_temps_5A.pdf',
    isVerified: true
  },
  {
    id: 3,
    name: 'liste_eleves_devoirs_faits.xlsx',
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 34567,
    url: '/attachments/liste_eleves_devoirs_faits.xlsx',
    isVerified: false
  },
  {
    id: 4,
    name: 'programme_olympiades.docx',
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 56789,
    url: '/attachments/programme_olympiades.docx',
    isVerified: true
  }
];

// Fonction pour récupérer les sessions d'un enseignant
export function getTeacherSessions(teacherId: number): Session[] {
  return mockSessions.filter(session => session.teacherId === teacherId);
}

// Fonction pour récupérer les pièces jointes d'une session
export function getSessionAttachments(sessionId: number): Attachment[] {
  // Pour la démo, on attribue des pièces jointes à certaines sessions
  switch (sessionId) {
    case 1:
      return [mockAttachments[0]];
    case 4:
      return [mockAttachments[1]];
    case 6:
      return [mockAttachments[2]];
    case 7:
      return [mockAttachments[3]];
    default:
      return [];
  }
}

// Fonction pour simuler un délai d'API
export async function simulateApiDelay(ms: number = 500): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
