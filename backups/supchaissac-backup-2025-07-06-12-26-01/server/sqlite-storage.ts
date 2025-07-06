import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
import { 
  users, 
  sessions, 
  teacherSetups, 
  systemSettings,
  User, 
  InsertUser, 
  Session, 
  InsertSession, 
  TeacherSetup, 
  InsertTeacherSetup,
  SystemSetting,
  InsertSystemSetting
} from "../shared/schema-sqlite";
import { IStorage } from "./storage";

const MemoryStore = createMemoryStore(session);

export class SqliteStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  private sqlite: Database.Database;
  public sessionStore: any;

  constructor(dbPath: string = "./data/supchaissac.db") {
    // Create SQLite connection
    this.sqlite = new Database(dbPath);
    this.sqlite.pragma('journal_mode = WAL');
    this.db = drizzle(this.sqlite);
    
    // Create session store (using memory for now, could use SQLite)
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize database schema
    this.initializeSchema();
  }

  private initializeSchema(): void {
    // Create tables if they don't exist
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'TEACHER' CHECK (role IN ('TEACHER', 'SECRETARY', 'PRINCIPAL', 'ADMIN')),
        initials TEXT,
        signature TEXT,
        in_pacte INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        time_slot TEXT NOT NULL CHECK (time_slot IN ('M1', 'M2', 'M3', 'M4', 'S1', 'S2', 'S3', 'S4')),
        type TEXT NOT NULL CHECK (type IN ('RCD', 'DEVOIRS_FAITS', 'HSE', 'AUTRE')),
        teacher_id INTEGER NOT NULL,
        teacher_name TEXT NOT NULL,
        in_pacte INTEGER DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (status IN ('PENDING_REVIEW', 'PENDING_VALIDATION', 'VALIDATED', 'REJECTED', 'PAID')),
        created_at INTEGER NOT NULL,
        updated_at INTEGER,
        updated_by TEXT,
        classes TEXT,
        subject TEXT,
        description TEXT,
        reviewed_by TEXT,
        reviewed_at INTEGER,
        review_comments TEXT,
        validated_by TEXT,
        validated_at INTEGER,
        validation_comments TEXT,
        rejected_by TEXT,
        rejected_at INTEGER,
        rejection_reason TEXT,
        paid_by TEXT,
        paid_at INTEGER,
        payment_reference TEXT
      );

      CREATE TABLE IF NOT EXISTS teacher_setups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id INTEGER NOT NULL UNIQUE,
        preferred_subjects TEXT,
        available_time_slots TEXT,
        max_hours_per_week INTEGER DEFAULT 10,
        notifications INTEGER DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        description TEXT,
        updated_by TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await this.db.select().from(users).where(eq(users.username, username.toLowerCase())).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(userData: InsertUser): Promise<User> {
    try {
      // Generate initials from name
      const initials = userData.name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase();

      const userToInsert = {
        ...userData,
        username: userData.username.toLowerCase(),
        initials,
      };

      const result = await this.db.insert(users).values(userToInsert).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    try {
      const result = await this.db.update(users).set(data).where(eq(users.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Error updating user:', error);
      return undefined;
    }
  }

  // Session methods
  async getSessions(): Promise<Session[]> {
    try {
      return await this.db.select().from(sessions);
    } catch (error) {
      console.error('Error getting sessions:', error);
      return [];
    }
  }

  async getSessionsByTeacher(teacherId: number): Promise<Session[]> {
    try {
      return await this.db.select().from(sessions).where(eq(sessions.teacherId, teacherId));
    } catch (error) {
      console.error('Error getting sessions by teacher:', error);
      return [];
    }
  }

  async getSessionById(id: number): Promise<Session | undefined> {
    try {
      const result = await this.db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting session by id:', error);
      return undefined;
    }
  }

  async createSession(sessionData: InsertSession): Promise<Session> {
    try {
      const result = await this.db.insert(sessions).values(sessionData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async updateSession(id: number, data: Partial<Session>): Promise<Session | undefined> {
    try {
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };
      const result = await this.db.update(sessions).set(updateData).where(eq(sessions.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Error updating session:', error);
      return undefined;
    }
  }

  async deleteSession(id: number): Promise<boolean> {
    try {
      const result = await this.db.delete(sessions).where(eq(sessions.id, id));
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }

  // Teacher setup methods
  async getTeacherSetup(teacherId: number): Promise<TeacherSetup | undefined> {
    try {
      const result = await this.db.select().from(teacherSetups).where(eq(teacherSetups.teacherId, teacherId)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting teacher setup:', error);
      return undefined;
    }
  }

  async createTeacherSetup(setupData: InsertTeacherSetup): Promise<TeacherSetup> {
    try {
      const result = await this.db.insert(teacherSetups).values(setupData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating teacher setup:', error);
      throw error;
    }
  }

  async updateTeacherSetup(teacherId: number, data: Partial<TeacherSetup>): Promise<TeacherSetup | undefined> {
    try {
      const result = await this.db.update(teacherSetups).set(data).where(eq(teacherSetups.teacherId, teacherId)).returning();
      return result[0];
    } catch (error) {
      console.error('Error updating teacher setup:', error);
      return undefined;
    }
  }

  // System settings methods
  async getSystemSettings(): Promise<SystemSetting[]> {
    try {
      return await this.db.select().from(systemSettings);
    } catch (error) {
      console.error('Error getting system settings:', error);
      return [];
    }
  }

  async getSystemSettingByKey(key: string): Promise<SystemSetting | undefined> {
    try {
      const result = await this.db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error getting system setting by key:', error);
      return undefined;
    }
  }

  async createSystemSetting(settingData: InsertSystemSetting): Promise<SystemSetting> {
    try {
      const result = await this.db.insert(systemSettings).values(settingData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating system setting:', error);
      throw error;
    }
  }

  async updateSystemSetting(key: string, value: string, updatedBy: string): Promise<SystemSetting | undefined> {
    try {
      const updateData = {
        value,
        updatedBy,
        updatedAt: new Date(),
      };
      const result = await this.db.update(systemSettings).set(updateData).where(eq(systemSettings.key, key)).returning();
      return result[0];
    } catch (error) {
      console.error('Error updating system setting:', error);
      return undefined;
    }
  }

  // Utility method to close the connection
  async close(): Promise<void> {
    this.sqlite.close();
  }

  // Method to initialize with test data (similar to MemStorage)
  async initializeTestData(): Promise<void> {
    try {
      // Check if users already exist
      const existingUsers = await this.db.select().from(users).limit(1);
      if (existingUsers.length > 0) {
        console.log('Test data already exists, skipping initialization');
        return;
      }

      console.log('Initializing test data...');

      // Create test users
      const testUsers = [
        {
          username: "teacher1@example.com",
          password: "password123",
          name: "Sophie MARTIN",
          role: "TEACHER" as const,
          inPacte: false,
        },
        {
          username: "teacher2@example.com",
          password: "password123",
          name: "Marie PETIT",
          role: "TEACHER" as const,
          inPacte: true,
        },
        {
          username: "teacher3@example.com",
          password: "password123",
          name: "Martin DUBOIS",
          role: "TEACHER" as const,
          inPacte: false,
        },
        {
          username: "teacher4@example.com",
          password: "password123",
          name: "Philippe GARCIA",
          role: "TEACHER" as const,
          inPacte: true,
        },
        {
          username: "secretary@example.com",
          password: "password123",
          name: "Laure MARTIN",
          role: "SECRETARY" as const,
        },
        {
          username: "principal@example.com",
          password: "password123",
          name: "Jean DUPONT",
          role: "PRINCIPAL" as const,
        },
        {
          username: "admin@example.com",
          password: "password123",
          name: "Admin",
          role: "ADMIN" as const,
        }
      ];

      for (const userData of testUsers) {
        await this.createUser(userData);
      }

      console.log('Test data initialized successfully');
    } catch (error) {
      console.error('Error initializing test data:', error);
      throw error;
    }
  }
}
