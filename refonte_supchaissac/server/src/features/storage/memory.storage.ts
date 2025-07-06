import type { User, Session, TeacherSetup, SystemSetting } from '../../../../shared/types/session.types';

export class MemStorage {
  private users: Map<number, User> = new Map();
  private sessions: Map<number, Session> = new Map();
  private teacherSetups: Map<number, TeacherSetup> = new Map();
  private systemSettings: Map<number, SystemSetting> = new Map();
  private userId = 1;
  private sessionId = 1;
  private setupId = 1;
  private settingId = 1;

  constructor() {
    // Création d'utilisateurs de test
    this.createUser({
      username: 'teacher1@example.com', password: 'password123', name: 'Sophie MARTIN', role: 'TEACHER', inPacte: false, id: this.userId++ });
    this.createUser({
      username: 'teacher2@example.com', password: 'password123', name: 'Marie PETIT', role: 'TEACHER', inPacte: true, id: this.userId++ });
    this.createUser({
      username: 'teacher3@example.com', password: 'password123', name: 'Martin DUBOIS', role: 'TEACHER', inPacte: false, id: this.userId++ });
    this.createUser({
      username: 'teacher4@example.com', password: 'password123', name: 'Philippe GARCIA', role: 'TEACHER', inPacte: true, id: this.userId++ });
    this.createUser({
      username: 'secretary@example.com', password: 'password123', name: 'Laure MARTIN', role: 'SECRETARY', id: this.userId++ });
    this.createUser({
      username: 'principal@example.com', password: 'password123', name: 'Jean DUPONT', role: 'PRINCIPAL', id: this.userId++ });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(user: Omit<User, 'id'> & { id?: number }): Promise<User> {
    const id = user.id ?? this.userId++;
    const newUser = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // ... autres méthodes CRUD à ajouter selon besoins (sessions, teacherSetups, etc.)
}

export const storage = new MemStorage();
