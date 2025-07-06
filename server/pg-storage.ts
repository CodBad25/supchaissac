import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
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
} from "@shared/schema";
import { IStorage } from "./storage";

const PgSession = ConnectPgSimple(session);

export class PgStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  private sql: ReturnType<typeof postgres>;
  public sessionStore: any;

  constructor(databaseUrl: string) {
    // Create PostgreSQL connection
    this.sql = postgres(databaseUrl);
    this.db = drizzle(this.sql);
    
    // Create session store for PostgreSQL
    this.sessionStore = new PgSession({
      pool: this.sql,
      tableName: 'session', // Use 'session' table for storing sessions
      createTableIfMissing: true,
    });
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
      return result.rowCount > 0;
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
    await this.sql.end();
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
