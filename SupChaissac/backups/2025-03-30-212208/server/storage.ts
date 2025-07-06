import { users, sessions, teacherSetups, User, InsertUser, Session, InsertSession, TeacherSetup, InsertTeacherSetup } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  
  getSessions(): Promise<Session[]>;
  getSessionsByTeacher(teacherId: number): Promise<Session[]>;
  getSessionById(id: number): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: number, data: Partial<Session>): Promise<Session | undefined>;
  deleteSession(id: number): Promise<boolean>;
  
  getTeacherSetup(teacherId: number): Promise<TeacherSetup | undefined>;
  createTeacherSetup(setup: InsertTeacherSetup): Promise<TeacherSetup>;
  updateTeacherSetup(teacherId: number, data: Partial<TeacherSetup>): Promise<TeacherSetup | undefined>;
  
  sessionStore: any; // Using any to avoid type errors with session store
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sessions: Map<number, Session>;
  private teacherSetups: Map<number, TeacherSetup>;
  private userId: number;
  private sessionId: number;
  private setupId: number;
  sessionStore: any; // Using any to avoid type errors

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.teacherSetups = new Map();
    this.userId = 1;
    this.sessionId = 1;
    this.setupId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Add some initial users for testing
    this.createUser({
      username: "teacher1@example.com",
      password: "password",
      name: "Martin DUBOIS",
      role: "TEACHER",
    });
    
    this.createUser({
      username: "teacher2@example.com",
      password: "password",
      name: "Marie PETIT",
      role: "TEACHER",
    });
    
    this.createUser({
      username: "teacher3@example.com",
      password: "password",
      name: "Sophie LEROY",
      role: "TEACHER",
    });
    
    this.createUser({
      username: "teacher4@example.com",
      password: "password",
      name: "Philippe GARCIA",
      role: "TEACHER",
    });
    
    this.createUser({
      username: "secretary@example.com",
      password: "password",
      name: "Laure MARTIN",
      role: "SECRETARY",
    });
    
    this.createUser({
      username: "principal@example.com",
      password: "password",
      name: "Jean DUPONT",
      role: "PRINCIPAL",
    });
    
    // Ajouter des sessions simulées pour les enseignants
    const today = new Date();
    const currentDate = today.toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];
    
    // Sessions pour l'enseignant 1 (Martin DUBOIS)
    this.createSession({
      teacherId: 1,
      teacherName: "Martin DUBOIS",
      date: yesterdayStr,
      timeSlot: "M2",
      type: "RCD",
      status: "VALIDATED",
      className: "4A",
      replacedTeacherPrefix: "Mme",
      replacedTeacherLastName: "ROBERT",
      replacedTeacherFirstName: "Julie",
      comment: "Absence pour formation"
    });
    
    this.createSession({
      teacherId: 1,
      teacherName: "Martin DUBOIS",
      date: currentDate,
      timeSlot: "M3",
      type: "DEVOIRS_FAITS",
      status: "PENDING_VALIDATION",
      gradeLevel: "6e",
      studentCount: 14,
      comment: ""
    });
    
    this.createSession({
      teacherId: 1,
      teacherName: "Martin DUBOIS",
      date: tomorrowStr,
      timeSlot: "S2",
      type: "AUTRE",
      status: "PENDING_REVIEW",
      comment: "Réunion de préparation conseil de classe"
    });
    
    // Sessions pour l'enseignant 2 (Marie PETIT)
    this.createSession({
      teacherId: 2,
      teacherName: "Marie PETIT",
      date: yesterdayStr,
      timeSlot: "S3",
      type: "DEVOIRS_FAITS",
      status: "PAID",
      gradeLevel: "5e",
      studentCount: 10,
      comment: ""
    });
    
    this.createSession({
      teacherId: 2,
      teacherName: "Marie PETIT",
      date: currentDate,
      timeSlot: "M4",
      type: "RCD",
      status: "PENDING_VALIDATION",
      className: "3B",
      replacedTeacherPrefix: "M.",
      replacedTeacherLastName: "RICHARD",
      replacedTeacherFirstName: "Thomas",
      comment: "Absence maladie"
    });
    
    // Sessions pour l'enseignant 3 (Sophie LEROY)
    this.createSession({
      teacherId: 3,
      teacherName: "Sophie LEROY",
      date: currentDate,
      timeSlot: "S1",
      type: "DEVOIRS_FAITS",
      status: "REJECTED",
      gradeLevel: "4e",
      studentCount: 8,
      comment: "Nombre d'élèves insuffisant pour validation"
    });
    
    this.createSession({
      teacherId: 3,
      teacherName: "Sophie LEROY",
      date: tomorrowStr,
      timeSlot: "M1",
      type: "RCD",
      status: "PENDING_REVIEW",
      className: "6C",
      replacedTeacherPrefix: "Mme",
      replacedTeacherLastName: "BERNARD",
      replacedTeacherFirstName: "Sylvie",
      comment: ""
    });
    
    this.createSession({
      teacherId: 3,
      teacherName: "Sophie LEROY",
      date: dayAfterTomorrowStr,
      timeSlot: "S4",
      type: "AUTRE",
      status: "PENDING_VALIDATION",
      comment: "Sortie pédagogique encadrée"
    });
    
    // Sessions pour l'enseignant 4 (Philippe GARCIA)
    this.createSession({
      teacherId: 4,
      teacherName: "Philippe GARCIA",
      date: yesterdayStr,
      timeSlot: "M1",
      type: "RCD",
      status: "PAID",
      className: "5A",
      replacedTeacherPrefix: "M.",
      replacedTeacherLastName: "MOREAU",
      replacedTeacherFirstName: "Paul",
      comment: ""
    });
    
    this.createSession({
      teacherId: 4,
      teacherName: "Philippe GARCIA",
      date: currentDate,
      timeSlot: "S3",
      type: "DEVOIRS_FAITS",
      status: "VALIDATED",
      gradeLevel: "3e",
      studentCount: 15,
      comment: ""
    });
    
    this.createSession({
      teacherId: 4,
      teacherName: "Philippe GARCIA",
      date: dayAfterTomorrowStr,
      timeSlot: "M2",
      type: "AUTRE",
      status: "PENDING_REVIEW",
      comment: "Atelier préparation orientation"
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userId++;
    const initials = userData.name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
      
    const user: any = { 
      ...userData, 
      id,
      initials,
      signature: null
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values());
  }

  async getSessionsByTeacher(teacherId: number): Promise<Session[]> {
    return Array.from(this.sessions.values()).filter(
      (session) => session.teacherId === teacherId,
    );
  }
  
  async getSessionById(id: number): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async createSession(sessionData: InsertSession): Promise<Session> {
    const id = this.sessionId++;
    const session: any = {
      ...sessionData,
      id,
      createdAt: new Date(),
      updatedAt: null,
      updatedBy: null,
    };
    
    this.sessions.set(id, session);
    return session;
  }

  async updateSession(id: number, data: Partial<Session>): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { 
      ...session, 
      ...data,
      updatedAt: new Date()
    };
    
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async deleteSession(id: number): Promise<boolean> {
    return this.sessions.delete(id);
  }

  async getTeacherSetup(teacherId: number): Promise<TeacherSetup | undefined> {
    return Array.from(this.teacherSetups.values()).find(
      (setup) => setup.teacherId === teacherId,
    );
  }

  async createTeacherSetup(setupData: InsertTeacherSetup): Promise<TeacherSetup> {
    const id = this.setupId++;
    const setup: any = {
      ...setupData,
      id,
      signature: null,
      inPacte: false,
    };
    
    this.teacherSetups.set(id, setup);
    return setup;
  }

  async updateTeacherSetup(teacherId: number, data: Partial<TeacherSetup>): Promise<TeacherSetup | undefined> {
    const setup = Array.from(this.teacherSetups.values()).find(
      (s) => s.teacherId === teacherId,
    );
    
    if (!setup) return undefined;
    
    const updatedSetup = { ...setup, ...data };
    this.teacherSetups.set(setup.id, updatedSetup);
    return updatedSetup;
  }
}

export const storage = new MemStorage();
