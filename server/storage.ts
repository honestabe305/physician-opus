import { eq, like, ilike, and, or, sql, lt } from 'drizzle-orm';
import {
  users,
  sessions,
  profiles,
  physicians,
  physicianLicenses,
  physicianCertifications,
  physicianEducation,
  physicianWorkHistory,
  physicianHospitalAffiliations,
  physicianCompliance,
  physicianDocuments,
  userSettings,
  deaRegistrations,
  csrLicenses,
  rolePolicies,
  licenseDocuments,
  type SelectUser,
  type InsertUser,
  type SelectSession,
  type InsertSession,
  type SelectProfile,
  type InsertProfile,
  type SelectPhysician,
  type InsertPhysician,
  type SelectPhysicianLicense,
  type InsertPhysicianLicense,
  type SelectPhysicianCertification,
  type InsertPhysicianCertification,
  type SelectPhysicianEducation,
  type InsertPhysicianEducation,
  type SelectPhysicianWorkHistory,
  type InsertPhysicianWorkHistory,
  type SelectPhysicianHospitalAffiliation,
  type InsertPhysicianHospitalAffiliation,
  type SelectPhysicianCompliance,
  type InsertPhysicianCompliance,
  type SelectPhysicianDocument,
  type InsertPhysicianDocument,
  type SelectUserSettings,
  type InsertUserSettings,
  type SelectDeaRegistration,
  type InsertDeaRegistration,
  type SelectCsrLicense,
  type InsertCsrLicense,
  type SelectRolePolicy,
  type InsertRolePolicy,
  type SelectLicenseDocument,
  type InsertLicenseDocument,
} from '../shared/schema';
import { MemoryStorage } from './memoryStorage';

// Storage factory - chooses between PostgreSQL and in-memory based on environment
export function createStorage(): IStorage {
  // For production deployment without database, always use in-memory storage
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    console.log('💾 Production: Using in-memory storage');
    return new MemoryStorage();
  }
  
  // Check if we have database URL and can actually connect
  if (process.env.DATABASE_URL) {
    try {
      console.log('🗄️ Attempting to use PostgreSQL storage...');
      return new PostgreSQLStorage();
    } catch (error) {
      console.warn('⚠️ PostgreSQL connection failed, falling back to in-memory storage:', error);
      return new MemoryStorage();
    }
  } else {
    console.log('💾 Using in-memory storage (no DATABASE_URL found)');
    return new MemoryStorage();
  }
}

// Storage interface definition
export interface IStorage {
  // Profile operations
  createProfile(profile: InsertProfile): Promise<SelectProfile>;
  getProfile(userId: string): Promise<SelectProfile | null>;
  getProfileById(id: string): Promise<SelectProfile | null>;
  updateProfile(id: string, updates: Partial<InsertProfile>): Promise<SelectProfile>;
  deleteProfile(id: string): Promise<void>;
  getAllProfiles(): Promise<SelectProfile[]>;

  // Physician operations
  createPhysician(physician: InsertPhysician): Promise<SelectPhysician>;
  getPhysician(id: string): Promise<SelectPhysician | null>;
  getPhysicianByNpi(npi: string): Promise<SelectPhysician | null>;
  updatePhysician(id: string, updates: Partial<InsertPhysician>): Promise<SelectPhysician>;
  deletePhysician(id: string): Promise<void>;
  getAllPhysicians(): Promise<SelectPhysician[]>;
  searchPhysicians(query: string): Promise<SelectPhysician[]>;
  getPhysiciansByStatus(status: string): Promise<SelectPhysician[]>;

  // Physician License operations
  createPhysicianLicense(license: InsertPhysicianLicense): Promise<SelectPhysicianLicense>;
  getPhysicianLicense(id: string): Promise<SelectPhysicianLicense | null>;
  getPhysicianLicenses(physicianId: string): Promise<SelectPhysicianLicense[]>;
  updatePhysicianLicense(id: string, updates: Partial<InsertPhysicianLicense>): Promise<SelectPhysicianLicense>;
  deletePhysicianLicense(id: string): Promise<void>;
  getExpiringLicenses(days: number): Promise<SelectPhysicianLicense[]>;

  // Physician Certification operations
  createPhysicianCertification(certification: InsertPhysicianCertification): Promise<SelectPhysicianCertification>;
  getPhysicianCertification(id: string): Promise<SelectPhysicianCertification | null>;
  getPhysicianCertifications(physicianId: string): Promise<SelectPhysicianCertification[]>;
  updatePhysicianCertification(id: string, updates: Partial<InsertPhysicianCertification>): Promise<SelectPhysicianCertification>;
  deletePhysicianCertification(id: string): Promise<void>;
  getExpiringCertifications(days: number): Promise<SelectPhysicianCertification[]>;

  // Physician Education operations
  createPhysicianEducation(education: InsertPhysicianEducation): Promise<SelectPhysicianEducation>;
  getPhysicianEducation(id: string): Promise<SelectPhysicianEducation | null>;
  getPhysicianEducations(physicianId: string): Promise<SelectPhysicianEducation[]>;
  updatePhysicianEducation(id: string, updates: Partial<InsertPhysicianEducation>): Promise<SelectPhysicianEducation>;
  deletePhysicianEducation(id: string): Promise<void>;

  // Physician Work History operations
  createPhysicianWorkHistory(workHistory: InsertPhysicianWorkHistory): Promise<SelectPhysicianWorkHistory>;
  getPhysicianWorkHistory(id: string): Promise<SelectPhysicianWorkHistory | null>;
  getPhysicianWorkHistories(physicianId: string): Promise<SelectPhysicianWorkHistory[]>;
  updatePhysicianWorkHistory(id: string, updates: Partial<InsertPhysicianWorkHistory>): Promise<SelectPhysicianWorkHistory>;
  deletePhysicianWorkHistory(id: string): Promise<void>;

  // Physician Hospital Affiliation operations
  createPhysicianHospitalAffiliation(affiliation: InsertPhysicianHospitalAffiliation): Promise<SelectPhysicianHospitalAffiliation>;
  getPhysicianHospitalAffiliation(id: string): Promise<SelectPhysicianHospitalAffiliation | null>;
  getPhysicianHospitalAffiliations(physicianId: string): Promise<SelectPhysicianHospitalAffiliation[]>;
  updatePhysicianHospitalAffiliation(id: string, updates: Partial<InsertPhysicianHospitalAffiliation>): Promise<SelectPhysicianHospitalAffiliation>;
  deletePhysicianHospitalAffiliation(id: string): Promise<void>;

  // Physician Compliance operations
  createPhysicianCompliance(compliance: InsertPhysicianCompliance): Promise<SelectPhysicianCompliance>;
  getPhysicianCompliance(id: string): Promise<SelectPhysicianCompliance | null>;
  getPhysicianComplianceByPhysicianId(physicianId: string): Promise<SelectPhysicianCompliance | null>;
  updatePhysicianCompliance(id: string, updates: Partial<InsertPhysicianCompliance>): Promise<SelectPhysicianCompliance>;
  deletePhysicianCompliance(id: string): Promise<void>;

  // Physician Document operations
  createPhysicianDocument(document: InsertPhysicianDocument): Promise<SelectPhysicianDocument>;
  getPhysicianDocument(id: string): Promise<SelectPhysicianDocument | null>;
  getPhysicianDocuments(physicianId: string): Promise<SelectPhysicianDocument[]>;
  getPhysicianDocumentsByType(physicianId: string, documentType: string): Promise<SelectPhysicianDocument[]>;
  updatePhysicianDocument(id: string, updates: Partial<InsertPhysicianDocument>): Promise<SelectPhysicianDocument>;
  deletePhysicianDocument(id: string): Promise<void>;

  // User Settings operations
  createUserSettings(settings: InsertUserSettings): Promise<SelectUserSettings>;
  getUserSettings(userId: string): Promise<SelectUserSettings | null>;
  getUserSettingsById(id: string): Promise<SelectUserSettings | null>;
  updateUserSettings(userId: string, updates: Partial<InsertUserSettings>): Promise<SelectUserSettings>;
  deleteUserSettings(userId: string): Promise<void>;

  // User authentication operations
  createUser(user: InsertUser): Promise<SelectUser>;
  getUserById(id: string): Promise<SelectUser | null>;
  getUserByEmail(email: string): Promise<SelectUser | null>;
  getUserByUsername(username: string): Promise<SelectUser | null>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<SelectUser>;
  deleteUser(id: string): Promise<void>;
  getAllUsers(): Promise<SelectUser[]>;
  updateLoginAttempts(userId: string, attempts: number): Promise<void>;
  lockUserAccount(userId: string, until: Date): Promise<void>;
  unlockUserAccount(userId: string): Promise<void>;
  updateLastLoginAt(userId: string): Promise<void>;

  // Session management operations
  createSession(session: InsertSession): Promise<SelectSession>;
  getSession(sessionToken: string): Promise<SelectSession | null>;
  getSessionById(id: string): Promise<SelectSession | null>;
  getUserSessions(userId: string): Promise<SelectSession[]>;
  deleteSession(sessionToken: string): Promise<void>;
  deleteSessionById(id: string): Promise<void>;
  deleteUserSessions(userId: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;
  extendSession(sessionToken: string, newExpiresAt: Date): Promise<SelectSession>;

  // DEA Registration operations
  createDeaRegistration(registration: InsertDeaRegistration): Promise<SelectDeaRegistration>;
  getDeaRegistration(id: string): Promise<SelectDeaRegistration | null>;
  getDeaRegistrationsByPhysician(physicianId: string): Promise<SelectDeaRegistration[]>;
  getDeaRegistrationByState(physicianId: string, state: string): Promise<SelectDeaRegistration | null>;
  updateDeaRegistration(id: string, updates: Partial<InsertDeaRegistration>): Promise<SelectDeaRegistration>;
  deleteDeaRegistration(id: string): Promise<void>;
  getExpiringDeaRegistrations(days: number): Promise<SelectDeaRegistration[]>;

  // CSR License operations
  createCsrLicense(license: InsertCsrLicense): Promise<SelectCsrLicense>;
  getCsrLicense(id: string): Promise<SelectCsrLicense | null>;
  getCsrLicensesByPhysician(physicianId: string): Promise<SelectCsrLicense[]>;
  getCsrLicenseByState(physicianId: string, state: string): Promise<SelectCsrLicense | null>;
  updateCsrLicense(id: string, updates: Partial<InsertCsrLicense>): Promise<SelectCsrLicense>;
  deleteCsrLicense(id: string): Promise<void>;
  getExpiringCsrLicenses(days: number): Promise<SelectCsrLicense[]>;

  // Role Policy operations
  createRolePolicy(policy: InsertRolePolicy): Promise<SelectRolePolicy>;
  getRolePolicy(id: string): Promise<SelectRolePolicy | null>;
  getRolePolicyByRoleAndState(role: 'physician' | 'pa' | 'np', state: string): Promise<SelectRolePolicy | null>;
  getAllRolePolicies(): Promise<SelectRolePolicy[]>;
  updateRolePolicy(id: string, updates: Partial<InsertRolePolicy>): Promise<SelectRolePolicy>;
  deleteRolePolicy(id: string): Promise<void>;

  // License Document operations
  createLicenseDocument(document: InsertLicenseDocument): Promise<SelectLicenseDocument>;
  getLicenseDocument(id: string): Promise<SelectLicenseDocument | null>;
  getLicenseDocumentsByPhysician(physicianId: string): Promise<SelectLicenseDocument[]>;
  getLicenseDocumentsByType(physicianId: string, documentType: string): Promise<SelectLicenseDocument[]>;
  getCurrentLicenseDocuments(physicianId: string): Promise<SelectLicenseDocument[]>;
  updateLicenseDocument(id: string, updates: Partial<InsertLicenseDocument>): Promise<SelectLicenseDocument>;
  deleteLicenseDocument(id: string): Promise<void>;
  archiveLicenseDocument(id: string): Promise<void>;

  // Utility operations
  getPhysicianFullProfile(physicianId: string): Promise<{
    physician: SelectPhysician | null;
    licenses: SelectPhysicianLicense[];
    certifications: SelectPhysicianCertification[];
    education: SelectPhysicianEducation[];
    workHistory: SelectPhysicianWorkHistory[];
    hospitalAffiliations: SelectPhysicianHospitalAffiliation[];
    compliance: SelectPhysicianCompliance | null;
    documents: SelectPhysicianDocument[];
    deaRegistrations: SelectDeaRegistration[];
    csrLicenses: SelectCsrLicense[];
    licenseDocuments: SelectLicenseDocument[];
  }>;
}

// PostgreSQL Storage Implementation - with proper lazy loading
export class PostgreSQLStorage implements IStorage {
  private db: any = null;
  
  private async getDb() {
    if (!this.db) {
      const { db: dbInstance } = await import('./db');
      this.db = dbInstance;
    }
    return this.db;
  }

  // Profile operations
  async createProfile(profile: InsertProfile): Promise<SelectProfile> {
    try {
      const db = await this.getDb();
      const [result] = await db.insert(profiles).values(profile).returning();
      if (!result) {
        throw new Error('Failed to create profile');
      }
      return result;
    } catch (error) {
      console.error('Error creating profile:', error);
      throw new Error(`Failed to create profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProfile(userId: string): Promise<SelectProfile | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(profiles).where(eq(profiles.userId, userId));
      return result || null;
    } catch (error) {
      console.error('Error getting profile:', error);
      throw new Error(`Failed to get profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProfileById(id: string): Promise<SelectProfile | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(profiles).where(eq(profiles.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting profile by id:', error);
      throw new Error(`Failed to get profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateProfile(id: string, updates: Partial<InsertProfile>): Promise<SelectProfile> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .update(profiles)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(profiles.id, id))
        .returning();
      
      if (!result) {
        throw new Error('Profile not found');
      }
      return result;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error(`Failed to update profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteProfile(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(profiles).where(eq(profiles.id, id));
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw new Error(`Failed to delete profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllProfiles(): Promise<SelectProfile[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(profiles);
    } catch (error) {
      console.error('Error getting all profiles:', error);
      throw new Error(`Failed to get profiles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Physician operations
  async createPhysician(physician: InsertPhysician): Promise<SelectPhysician> {
    try {
      const db = await this.getDb();
      const [result] = await db.insert(physicians).values(physician).returning();
      if (!result) {
        throw new Error('Failed to create physician');
      }
      return result;
    } catch (error) {
      console.error('Error creating physician:', error);
      throw new Error(`Failed to create physician: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysician(id: string): Promise<SelectPhysician | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(physicians).where(eq(physicians.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting physician:', error);
      throw new Error(`Failed to get physician: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianByNpi(npi: string): Promise<SelectPhysician | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(physicians).where(eq(physicians.npi, npi));
      return result || null;
    } catch (error) {
      console.error('Error getting physician by NPI:', error);
      throw new Error(`Failed to get physician: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updatePhysician(id: string, updates: Partial<InsertPhysician>): Promise<SelectPhysician> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .update(physicians)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(physicians.id, id))
        .returning();
      
      if (!result) {
        throw new Error('Physician not found');
      }
      return result;
    } catch (error) {
      console.error('Error updating physician:', error);
      throw new Error(`Failed to update physician: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deletePhysician(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(physicians).where(eq(physicians.id, id));
    } catch (error) {
      console.error('Error deleting physician:', error);
      throw new Error(`Failed to delete physician: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllPhysicians(): Promise<SelectPhysician[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(physicians);
    } catch (error) {
      console.error('Error getting all physicians:', error);
      throw new Error(`Failed to get physicians: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchPhysicians(query: string): Promise<SelectPhysician[]> {
    try {
      const db = await this.getDb();
      return await db
        .select()
        .from(physicians)
        .where(
          or(
            ilike(physicians.fullLegalName, `%${query}%`),
            like(physicians.npi, `%${query}%`),
            ilike(physicians.practiceName, `%${query}%`),
            ilike(physicians.emailAddress, `%${query}%`)
          )
        );
    } catch (error) {
      console.error('Error searching physicians:', error);
      throw new Error(`Failed to search physicians: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysiciansByStatus(status: string): Promise<SelectPhysician[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(physicians).where(eq(physicians.status, status));
    } catch (error) {
      console.error('Error getting physicians by status:', error);
      throw new Error(`Failed to get physicians: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Physician License operations
  async createPhysicianLicense(license: InsertPhysicianLicense): Promise<SelectPhysicianLicense> {
    try {
      const db = await this.getDb();
      const [result] = await db.insert(physicianLicenses).values(license).returning();
      if (!result) {
        throw new Error('Failed to create physician license');
      }
      return result;
    } catch (error) {
      console.error('Error creating physician license:', error);
      throw new Error(`Failed to create physician license: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianLicense(id: string): Promise<SelectPhysicianLicense | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(physicianLicenses).where(eq(physicianLicenses.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting physician license:', error);
      throw new Error(`Failed to get physician license: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianLicenses(physicianId: string): Promise<SelectPhysicianLicense[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(physicianLicenses).where(eq(physicianLicenses.physicianId, physicianId));
    } catch (error) {
      console.error('Error getting physician licenses:', error);
      throw new Error(`Failed to get physician licenses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updatePhysicianLicense(id: string, updates: Partial<InsertPhysicianLicense>): Promise<SelectPhysicianLicense> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .update(physicianLicenses)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(physicianLicenses.id, id))
        .returning();
      
      if (!result) {
        throw new Error('Physician license not found');
      }
      return result;
    } catch (error) {
      console.error('Error updating physician license:', error);
      throw new Error(`Failed to update physician license: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deletePhysicianLicense(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(physicianLicenses).where(eq(physicianLicenses.id, id));
    } catch (error) {
      console.error('Error deleting physician license:', error);
      throw new Error(`Failed to delete physician license: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getExpiringLicenses(days: number): Promise<SelectPhysicianLicense[]> {
    try {
      const db = await this.getDb();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      
      return await db
        .select()
        .from(physicianLicenses)
        .where(
          and(
            sql`${physicianLicenses.expirationDate} <= ${futureDate.toISOString().split('T')[0]}`,
            sql`${physicianLicenses.expirationDate} >= ${new Date().toISOString().split('T')[0]}`
          )
        );
    } catch (error) {
      console.error('Error getting expiring licenses:', error);
      throw new Error(`Failed to get expiring licenses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Physician Certification operations
  async createPhysicianCertification(certification: InsertPhysicianCertification): Promise<SelectPhysicianCertification> {
    try {
      const db = await this.getDb();
      const [result] = await db.insert(physicianCertifications).values(certification).returning();
      if (!result) {
        throw new Error('Failed to create physician certification');
      }
      return result;
    } catch (error) {
      console.error('Error creating physician certification:', error);
      throw new Error(`Failed to create physician certification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianCertification(id: string): Promise<SelectPhysicianCertification | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(physicianCertifications).where(eq(physicianCertifications.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting physician certification:', error);
      throw new Error(`Failed to get physician certification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianCertifications(physicianId: string): Promise<SelectPhysicianCertification[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(physicianCertifications).where(eq(physicianCertifications.physicianId, physicianId));
    } catch (error) {
      console.error('Error getting physician certifications:', error);
      throw new Error(`Failed to get physician certifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updatePhysicianCertification(id: string, updates: Partial<InsertPhysicianCertification>): Promise<SelectPhysicianCertification> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .update(physicianCertifications)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(physicianCertifications.id, id))
        .returning();
      
      if (!result) {
        throw new Error('Physician certification not found');
      }
      return result;
    } catch (error) {
      console.error('Error updating physician certification:', error);
      throw new Error(`Failed to update physician certification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deletePhysicianCertification(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(physicianCertifications).where(eq(physicianCertifications.id, id));
    } catch (error) {
      console.error('Error deleting physician certification:', error);
      throw new Error(`Failed to delete physician certification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getExpiringCertifications(days: number): Promise<SelectPhysicianCertification[]> {
    try {
      const db = await this.getDb();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      
      return await db
        .select()
        .from(physicianCertifications)
        .where(
          and(
            sql`${physicianCertifications.expirationDate} <= ${futureDate.toISOString().split('T')[0]}`,
            sql`${physicianCertifications.expirationDate} >= ${new Date().toISOString().split('T')[0]}`
          )
        );
    } catch (error) {
      console.error('Error getting expiring certifications:', error);
      throw new Error(`Failed to get expiring certifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Physician Education operations
  async createPhysicianEducation(education: InsertPhysicianEducation): Promise<SelectPhysicianEducation> {
    try {
      const db = await this.getDb();
      const [result] = await db.insert(physicianEducation).values(education).returning();
      if (!result) {
        throw new Error('Failed to create physician education');
      }
      return result;
    } catch (error) {
      console.error('Error creating physician education:', error);
      throw new Error(`Failed to create physician education: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianEducation(id: string): Promise<SelectPhysicianEducation | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(physicianEducation).where(eq(physicianEducation.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting physician education:', error);
      throw new Error(`Failed to get physician education: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianEducations(physicianId: string): Promise<SelectPhysicianEducation[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(physicianEducation).where(eq(physicianEducation.physicianId, physicianId));
    } catch (error) {
      console.error('Error getting physician educations:', error);
      throw new Error(`Failed to get physician educations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updatePhysicianEducation(id: string, updates: Partial<InsertPhysicianEducation>): Promise<SelectPhysicianEducation> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .update(physicianEducation)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(physicianEducation.id, id))
        .returning();
      
      if (!result) {
        throw new Error('Physician education not found');
      }
      return result;
    } catch (error) {
      console.error('Error updating physician education:', error);
      throw new Error(`Failed to update physician education: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deletePhysicianEducation(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(physicianEducation).where(eq(physicianEducation.id, id));
    } catch (error) {
      console.error('Error deleting physician education:', error);
      throw new Error(`Failed to delete physician education: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Physician Work History operations
  async createPhysicianWorkHistory(workHistory: InsertPhysicianWorkHistory): Promise<SelectPhysicianWorkHistory> {
    try {
      const db = await this.getDb();
      const [result] = await db.insert(physicianWorkHistory).values(workHistory).returning();
      if (!result) {
        throw new Error('Failed to create physician work history');
      }
      return result;
    } catch (error) {
      console.error('Error creating physician work history:', error);
      throw new Error(`Failed to create physician work history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianWorkHistory(id: string): Promise<SelectPhysicianWorkHistory | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(physicianWorkHistory).where(eq(physicianWorkHistory.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting physician work history:', error);
      throw new Error(`Failed to get physician work history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianWorkHistories(physicianId: string): Promise<SelectPhysicianWorkHistory[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(physicianWorkHistory).where(eq(physicianWorkHistory.physicianId, physicianId));
    } catch (error) {
      console.error('Error getting physician work histories:', error);
      throw new Error(`Failed to get physician work histories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updatePhysicianWorkHistory(id: string, updates: Partial<InsertPhysicianWorkHistory>): Promise<SelectPhysicianWorkHistory> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .update(physicianWorkHistory)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(physicianWorkHistory.id, id))
        .returning();
      
      if (!result) {
        throw new Error('Physician work history not found');
      }
      return result;
    } catch (error) {
      console.error('Error updating physician work history:', error);
      throw new Error(`Failed to update physician work history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deletePhysicianWorkHistory(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(physicianWorkHistory).where(eq(physicianWorkHistory.id, id));
    } catch (error) {
      console.error('Error deleting physician work history:', error);
      throw new Error(`Failed to delete physician work history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Physician Hospital Affiliation operations
  async createPhysicianHospitalAffiliation(affiliation: InsertPhysicianHospitalAffiliation): Promise<SelectPhysicianHospitalAffiliation> {
    try {
      const db = await this.getDb();
      const [result] = await db.insert(physicianHospitalAffiliations).values(affiliation).returning();
      if (!result) {
        throw new Error('Failed to create physician hospital affiliation');
      }
      return result;
    } catch (error) {
      console.error('Error creating physician hospital affiliation:', error);
      throw new Error(`Failed to create physician hospital affiliation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianHospitalAffiliation(id: string): Promise<SelectPhysicianHospitalAffiliation | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(physicianHospitalAffiliations).where(eq(physicianHospitalAffiliations.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting physician hospital affiliation:', error);
      throw new Error(`Failed to get physician hospital affiliation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianHospitalAffiliations(physicianId: string): Promise<SelectPhysicianHospitalAffiliation[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(physicianHospitalAffiliations).where(eq(physicianHospitalAffiliations.physicianId, physicianId));
    } catch (error) {
      console.error('Error getting physician hospital affiliations:', error);
      throw new Error(`Failed to get physician hospital affiliations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updatePhysicianHospitalAffiliation(id: string, updates: Partial<InsertPhysicianHospitalAffiliation>): Promise<SelectPhysicianHospitalAffiliation> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .update(physicianHospitalAffiliations)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(physicianHospitalAffiliations.id, id))
        .returning();
      
      if (!result) {
        throw new Error('Physician hospital affiliation not found');
      }
      return result;
    } catch (error) {
      console.error('Error updating physician hospital affiliation:', error);
      throw new Error(`Failed to update physician hospital affiliation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deletePhysicianHospitalAffiliation(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(physicianHospitalAffiliations).where(eq(physicianHospitalAffiliations.id, id));
    } catch (error) {
      console.error('Error deleting physician hospital affiliation:', error);
      throw new Error(`Failed to delete physician hospital affiliation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Physician Compliance operations
  async createPhysicianCompliance(compliance: InsertPhysicianCompliance): Promise<SelectPhysicianCompliance> {
    try {
      const db = await this.getDb();
      const [result] = await db.insert(physicianCompliance).values(compliance).returning();
      if (!result) {
        throw new Error('Failed to create physician compliance');
      }
      return result;
    } catch (error) {
      console.error('Error creating physician compliance:', error);
      throw new Error(`Failed to create physician compliance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianCompliance(id: string): Promise<SelectPhysicianCompliance | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(physicianCompliance).where(eq(physicianCompliance.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting physician compliance:', error);
      throw new Error(`Failed to get physician compliance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianComplianceByPhysicianId(physicianId: string): Promise<SelectPhysicianCompliance | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(physicianCompliance).where(eq(physicianCompliance.physicianId, physicianId));
      return result || null;
    } catch (error) {
      console.error('Error getting physician compliance by physician id:', error);
      throw new Error(`Failed to get physician compliance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updatePhysicianCompliance(id: string, updates: Partial<InsertPhysicianCompliance>): Promise<SelectPhysicianCompliance> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .update(physicianCompliance)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(physicianCompliance.id, id))
        .returning();
      
      if (!result) {
        throw new Error('Physician compliance not found');
      }
      return result;
    } catch (error) {
      console.error('Error updating physician compliance:', error);
      throw new Error(`Failed to update physician compliance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deletePhysicianCompliance(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(physicianCompliance).where(eq(physicianCompliance.id, id));
    } catch (error) {
      console.error('Error deleting physician compliance:', error);
      throw new Error(`Failed to delete physician compliance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Physician Document operations
  async createPhysicianDocument(document: InsertPhysicianDocument): Promise<SelectPhysicianDocument> {
    try {
      const db = await this.getDb();
      const [result] = await db.insert(physicianDocuments).values(document).returning();
      if (!result) {
        throw new Error('Failed to create physician document');
      }
      return result;
    } catch (error) {
      console.error('Error creating physician document:', error);
      throw new Error(`Failed to create physician document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianDocument(id: string): Promise<SelectPhysicianDocument | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(physicianDocuments).where(eq(physicianDocuments.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting physician document:', error);
      throw new Error(`Failed to get physician document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianDocuments(physicianId: string): Promise<SelectPhysicianDocument[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(physicianDocuments).where(eq(physicianDocuments.physicianId, physicianId));
    } catch (error) {
      console.error('Error getting physician documents:', error);
      throw new Error(`Failed to get physician documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianDocumentsByType(physicianId: string, documentType: string): Promise<SelectPhysicianDocument[]> {
    try {
      const db = await this.getDb();
      return await db
        .select()
        .from(physicianDocuments)
        .where(
          and(
            eq(physicianDocuments.physicianId, physicianId),
            sql`${physicianDocuments.documentType} = ${documentType}`
          )
        );
    } catch (error) {
      console.error('Error getting physician documents by type:', error);
      throw new Error(`Failed to get physician documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updatePhysicianDocument(id: string, updates: Partial<InsertPhysicianDocument>): Promise<SelectPhysicianDocument> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .update(physicianDocuments)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(physicianDocuments.id, id))
        .returning();
      
      if (!result) {
        throw new Error('Physician document not found');
      }
      return result;
    } catch (error) {
      console.error('Error updating physician document:', error);
      throw new Error(`Failed to update physician document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deletePhysicianDocument(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(physicianDocuments).where(eq(physicianDocuments.id, id));
    } catch (error) {
      console.error('Error deleting physician document:', error);
      throw new Error(`Failed to delete physician document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // User Settings operations
  async createUserSettings(settings: InsertUserSettings): Promise<SelectUserSettings> {
    try {
      const db = await this.getDb();
      const [result] = await db.insert(userSettings).values(settings).returning();
      if (!result) {
        throw new Error('Failed to create user settings');
      }
      return result;
    } catch (error) {
      console.error('Error creating user settings:', error);
      throw new Error(`Failed to create user settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserSettings(userId: string): Promise<SelectUserSettings | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
      return result || null;
    } catch (error) {
      console.error('Error getting user settings:', error);
      throw new Error(`Failed to get user settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserSettingsById(id: string): Promise<SelectUserSettings | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(userSettings).where(eq(userSettings.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting user settings by id:', error);
      throw new Error(`Failed to get user settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateUserSettings(userId: string, updates: Partial<InsertUserSettings>): Promise<SelectUserSettings> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .update(userSettings)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(userSettings.userId, userId))
        .returning();
      if (!result) {
        throw new Error('User settings not found');
      }
      return result;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw new Error(`Failed to update user settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteUserSettings(userId: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(userSettings).where(eq(userSettings.userId, userId));
    } catch (error) {
      console.error('Error deleting user settings:', error);
      throw new Error(`Failed to delete user settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // User authentication operations
  async createUser(user: InsertUser): Promise<SelectUser> {
    try {
      const db = await this.getDb();
      const [result] = await db.insert(users).values(user).returning();
      if (!result) {
        throw new Error('Failed to create user');
      }
      return result;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserById(id: string): Promise<SelectUser | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(users).where(eq(users.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting user by id:', error);
      throw new Error(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserByEmail(email: string): Promise<SelectUser | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(users).where(eq(users.email, email));
      return result || null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw new Error(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserByUsername(username: string): Promise<SelectUser | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(users).where(eq(users.username, username));
      return result || null;
    } catch (error) {
      console.error('Error getting user by username:', error);
      throw new Error(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<SelectUser> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .update(users)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      
      if (!result) {
        throw new Error('User not found');
      }
      return result;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(users).where(eq(users.id, id));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllUsers(): Promise<SelectUser[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(users);
    } catch (error) {
      console.error('Error getting all users:', error);
      throw new Error(`Failed to get users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateLoginAttempts(userId: string, attempts: number): Promise<void> {
    try {
      const db = await this.getDb();
      await db
        .update(users)
        .set({ failedLoginAttempts: attempts, updatedAt: new Date() })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error updating login attempts:', error);
      throw new Error(`Failed to update login attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async lockUserAccount(userId: string, until: Date): Promise<void> {
    try {
      const db = await this.getDb();
      await db
        .update(users)
        .set({ lockedUntil: until, updatedAt: new Date() })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error locking user account:', error);
      throw new Error(`Failed to lock user account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async unlockUserAccount(userId: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db
        .update(users)
        .set({ lockedUntil: null, failedLoginAttempts: 0, updatedAt: new Date() })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error unlocking user account:', error);
      throw new Error(`Failed to unlock user account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateLastLoginAt(userId: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db
        .update(users)
        .set({ lastLoginAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error updating last login:', error);
      throw new Error(`Failed to update last login: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Session management operations
  async createSession(session: InsertSession): Promise<SelectSession> {
    try {
      const db = await this.getDb();
      const [result] = await db.insert(sessions).values(session).returning();
      if (!result) {
        throw new Error('Failed to create session');
      }
      return result;
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSession(sessionToken: string): Promise<SelectSession | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(sessions).where(eq(sessions.sessionToken, sessionToken));
      return result || null;
    } catch (error) {
      console.error('Error getting session:', error);
      throw new Error(`Failed to get session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getSessionById(id: string): Promise<SelectSession | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(sessions).where(eq(sessions.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting session by id:', error);
      throw new Error(`Failed to get session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserSessions(userId: string): Promise<SelectSession[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(sessions).where(eq(sessions.userId, userId));
    } catch (error) {
      console.error('Error getting user sessions:', error);
      throw new Error(`Failed to get user sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteSession(sessionToken: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
    } catch (error) {
      console.error('Error deleting session:', error);
      throw new Error(`Failed to delete session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteSessionById(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(sessions).where(eq(sessions.id, id));
    } catch (error) {
      console.error('Error deleting session by id:', error);
      throw new Error(`Failed to delete session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteUserSessions(userId: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(sessions).where(eq(sessions.userId, userId));
    } catch (error) {
      console.error('Error deleting user sessions:', error);
      throw new Error(`Failed to delete user sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteExpiredSessions(): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
    } catch (error) {
      console.error('Error deleting expired sessions:', error);
      throw new Error(`Failed to delete expired sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async extendSession(sessionToken: string, newExpiresAt: Date): Promise<SelectSession> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .update(sessions)
        .set({ expiresAt: newExpiresAt })
        .where(eq(sessions.sessionToken, sessionToken))
        .returning();
      
      if (!result) {
        throw new Error('Session not found');
      }
      return result;
    } catch (error) {
      console.error('Error extending session:', error);
      throw new Error(`Failed to extend session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // DEA Registration operations
  async createDeaRegistration(registration: InsertDeaRegistration): Promise<SelectDeaRegistration> {
    try {
      const db = await this.getDb();
      const [result] = await db.insert(deaRegistrations).values(registration).returning();
      if (!result) {
        throw new Error('Failed to create DEA registration');
      }
      return result;
    } catch (error) {
      console.error('Error creating DEA registration:', error);
      throw new Error(`Failed to create DEA registration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDeaRegistration(id: string): Promise<SelectDeaRegistration | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(deaRegistrations).where(eq(deaRegistrations.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting DEA registration:', error);
      throw new Error(`Failed to get DEA registration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDeaRegistrationsByPhysician(physicianId: string): Promise<SelectDeaRegistration[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(deaRegistrations).where(eq(deaRegistrations.physicianId, physicianId));
    } catch (error) {
      console.error('Error getting DEA registrations by physician:', error);
      throw new Error(`Failed to get DEA registrations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDeaRegistrationByState(physicianId: string, state: string): Promise<SelectDeaRegistration | null> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .select()
        .from(deaRegistrations)
        .where(
          and(
            eq(deaRegistrations.physicianId, physicianId),
            eq(deaRegistrations.state, state)
          )
        );
      return result || null;
    } catch (error) {
      console.error('Error getting DEA registration by state:', error);
      throw new Error(`Failed to get DEA registration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateDeaRegistration(id: string, updates: Partial<InsertDeaRegistration>): Promise<SelectDeaRegistration> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .update(deaRegistrations)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(deaRegistrations.id, id))
        .returning();
      
      if (!result) {
        throw new Error('DEA registration not found');
      }
      return result;
    } catch (error) {
      console.error('Error updating DEA registration:', error);
      throw new Error(`Failed to update DEA registration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteDeaRegistration(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(deaRegistrations).where(eq(deaRegistrations.id, id));
    } catch (error) {
      console.error('Error deleting DEA registration:', error);
      throw new Error(`Failed to delete DEA registration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getExpiringDeaRegistrations(days: number): Promise<SelectDeaRegistration[]> {
    try {
      const db = await this.getDb();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      
      return await db
        .select()
        .from(deaRegistrations)
        .where(
          and(
            sql`${deaRegistrations.expireDate} <= ${futureDate.toISOString().split('T')[0]}`,
            sql`${deaRegistrations.expireDate} >= ${new Date().toISOString().split('T')[0]}`
          )
        );
    } catch (error) {
      console.error('Error getting expiring DEA registrations:', error);
      throw new Error(`Failed to get expiring DEA registrations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // CSR License operations
  async createCsrLicense(license: InsertCsrLicense): Promise<SelectCsrLicense> {
    try {
      const db = await this.getDb();
      const [result] = await db.insert(csrLicenses).values(license).returning();
      if (!result) {
        throw new Error('Failed to create CSR license');
      }
      return result;
    } catch (error) {
      console.error('Error creating CSR license:', error);
      throw new Error(`Failed to create CSR license: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCsrLicense(id: string): Promise<SelectCsrLicense | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(csrLicenses).where(eq(csrLicenses.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting CSR license:', error);
      throw new Error(`Failed to get CSR license: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCsrLicensesByPhysician(physicianId: string): Promise<SelectCsrLicense[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(csrLicenses).where(eq(csrLicenses.physicianId, physicianId));
    } catch (error) {
      console.error('Error getting CSR licenses by physician:', error);
      throw new Error(`Failed to get CSR licenses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCsrLicenseByState(physicianId: string, state: string): Promise<SelectCsrLicense | null> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .select()
        .from(csrLicenses)
        .where(
          and(
            eq(csrLicenses.physicianId, physicianId),
            eq(csrLicenses.state, state)
          )
        );
      return result || null;
    } catch (error) {
      console.error('Error getting CSR license by state:', error);
      throw new Error(`Failed to get CSR license: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateCsrLicense(id: string, updates: Partial<InsertCsrLicense>): Promise<SelectCsrLicense> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .update(csrLicenses)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(csrLicenses.id, id))
        .returning();
      
      if (!result) {
        throw new Error('CSR license not found');
      }
      return result;
    } catch (error) {
      console.error('Error updating CSR license:', error);
      throw new Error(`Failed to update CSR license: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteCsrLicense(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(csrLicenses).where(eq(csrLicenses.id, id));
    } catch (error) {
      console.error('Error deleting CSR license:', error);
      throw new Error(`Failed to delete CSR license: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getExpiringCsrLicenses(days: number): Promise<SelectCsrLicense[]> {
    try {
      const db = await this.getDb();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      
      return await db
        .select()
        .from(csrLicenses)
        .where(
          and(
            sql`${csrLicenses.expireDate} <= ${futureDate.toISOString().split('T')[0]}`,
            sql`${csrLicenses.expireDate} >= ${new Date().toISOString().split('T')[0]}`
          )
        );
    } catch (error) {
      console.error('Error getting expiring CSR licenses:', error);
      throw new Error(`Failed to get expiring CSR licenses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Role Policy operations
  async createRolePolicy(policy: InsertRolePolicy): Promise<SelectRolePolicy> {
    try {
      const db = await this.getDb();
      const [result] = await db.insert(rolePolicies).values(policy).returning();
      if (!result) {
        throw new Error('Failed to create role policy');
      }
      return result;
    } catch (error) {
      console.error('Error creating role policy:', error);
      throw new Error(`Failed to create role policy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRolePolicy(id: string): Promise<SelectRolePolicy | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(rolePolicies).where(eq(rolePolicies.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting role policy:', error);
      throw new Error(`Failed to get role policy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRolePolicyByRoleAndState(role: 'physician' | 'pa' | 'np', state: string): Promise<SelectRolePolicy | null> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .select()
        .from(rolePolicies)
        .where(
          and(
            eq(rolePolicies.role, role),
            eq(rolePolicies.state, state)
          )
        );
      return result || null;
    } catch (error) {
      console.error('Error getting role policy by role and state:', error);
      throw new Error(`Failed to get role policy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllRolePolicies(): Promise<SelectRolePolicy[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(rolePolicies);
    } catch (error) {
      console.error('Error getting all role policies:', error);
      throw new Error(`Failed to get role policies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateRolePolicy(id: string, updates: Partial<InsertRolePolicy>): Promise<SelectRolePolicy> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .update(rolePolicies)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(rolePolicies.id, id))
        .returning();
      
      if (!result) {
        throw new Error('Role policy not found');
      }
      return result;
    } catch (error) {
      console.error('Error updating role policy:', error);
      throw new Error(`Failed to update role policy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteRolePolicy(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(rolePolicies).where(eq(rolePolicies.id, id));
    } catch (error) {
      console.error('Error deleting role policy:', error);
      throw new Error(`Failed to delete role policy: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // License Document operations
  async createLicenseDocument(document: InsertLicenseDocument): Promise<SelectLicenseDocument> {
    try {
      const db = await this.getDb();
      
      // If this is marked as current, update all other documents of the same type for this physician
      if (document.isCurrent) {
        await db
          .update(licenseDocuments)
          .set({ isCurrent: false, updatedAt: new Date() })
          .where(
            and(
              eq(licenseDocuments.physicianId, document.physicianId),
              eq(licenseDocuments.documentType, document.documentType!)
            )
          );
      }
      
      // Calculate version number
      const existingDocs = await db
        .select()
        .from(licenseDocuments)
        .where(
          and(
            eq(licenseDocuments.physicianId, document.physicianId),
            eq(licenseDocuments.documentType, document.documentType)
          )
        );
      
      const maxVersion = existingDocs.reduce((max, doc) => Math.max(max, doc.version || 0), 0);
      const newDocument = { ...document, version: maxVersion + 1 };
      
      const [result] = await db.insert(licenseDocuments).values(newDocument).returning();
      if (!result) {
        throw new Error('Failed to create license document');
      }
      return result;
    } catch (error) {
      console.error('Error creating license document:', error);
      throw new Error(`Failed to create license document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getLicenseDocument(id: string): Promise<SelectLicenseDocument | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(licenseDocuments).where(eq(licenseDocuments.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting license document:', error);
      throw new Error(`Failed to get license document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getLicenseDocumentsByPhysician(physicianId: string): Promise<SelectLicenseDocument[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(licenseDocuments).where(eq(licenseDocuments.physicianId, physicianId));
    } catch (error) {
      console.error('Error getting license documents by physician:', error);
      throw new Error(`Failed to get license documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getLicenseDocumentsByType(physicianId: string, documentType: string): Promise<SelectLicenseDocument[]> {
    try {
      const db = await this.getDb();
      return await db
        .select()
        .from(licenseDocuments)
        .where(
          and(
            eq(licenseDocuments.physicianId, physicianId),
            eq(licenseDocuments.documentType, documentType as 'license' | 'dea_cert' | 'csr_cert' | 'supervision_agreement' | 'collaboration_agreement' | 'cme_cert' | 'mate_cert')
          )
        );
    } catch (error) {
      console.error('Error getting license documents by type:', error);
      throw new Error(`Failed to get license documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCurrentLicenseDocuments(physicianId: string): Promise<SelectLicenseDocument[]> {
    try {
      const db = await this.getDb();
      return await db
        .select()
        .from(licenseDocuments)
        .where(
          and(
            eq(licenseDocuments.physicianId, physicianId),
            eq(licenseDocuments.isCurrent, true)
          )
        );
    } catch (error) {
      console.error('Error getting current license documents:', error);
      throw new Error(`Failed to get current license documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateLicenseDocument(id: string, updates: Partial<InsertLicenseDocument>): Promise<SelectLicenseDocument> {
    try {
      const db = await this.getDb();
      
      // If updating to current, set all other documents of same type to not current
      if (updates.isCurrent) {
        const existingDoc = await this.getLicenseDocument(id);
        if (existingDoc) {
          await db
            .update(licenseDocuments)
            .set({ isCurrent: false, updatedAt: new Date() })
            .where(
              and(
                eq(licenseDocuments.physicianId, existingDoc.physicianId),
                eq(licenseDocuments.documentType, existingDoc.documentType),
                sql`${licenseDocuments.id} != ${id}`
              )
            );
        }
      }
      
      const [result] = await db
        .update(licenseDocuments)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(licenseDocuments.id, id))
        .returning();
      
      if (!result) {
        throw new Error('License document not found');
      }
      return result;
    } catch (error) {
      console.error('Error updating license document:', error);
      throw new Error(`Failed to update license document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteLicenseDocument(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(licenseDocuments).where(eq(licenseDocuments.id, id));
    } catch (error) {
      console.error('Error deleting license document:', error);
      throw new Error(`Failed to delete license document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async archiveLicenseDocument(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db
        .update(licenseDocuments)
        .set({ isCurrent: false, updatedAt: new Date() })
        .where(eq(licenseDocuments.id, id));
    } catch (error) {
      console.error('Error archiving license document:', error);
      throw new Error(`Failed to archive license document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Utility operations
  async getPhysicianFullProfile(physicianId: string): Promise<{
    physician: SelectPhysician | null;
    licenses: SelectPhysicianLicense[];
    certifications: SelectPhysicianCertification[];
    education: SelectPhysicianEducation[];
    workHistory: SelectPhysicianWorkHistory[];
    hospitalAffiliations: SelectPhysicianHospitalAffiliation[];
    compliance: SelectPhysicianCompliance | null;
    documents: SelectPhysicianDocument[];
    deaRegistrations: SelectDeaRegistration[];
    csrLicenses: SelectCsrLicense[];
    licenseDocuments: SelectLicenseDocument[];
  }> {
    try {
      const [
        physician,
        licenses,
        certifications,
        education,
        workHistory,
        hospitalAffiliations,
        compliance,
        documents,
        deaRegistrations,
        csrLicenses,
        licenseDocuments
      ] = await Promise.all([
        this.getPhysician(physicianId),
        this.getPhysicianLicenses(physicianId),
        this.getPhysicianCertifications(physicianId),
        this.getPhysicianEducations(physicianId),
        this.getPhysicianWorkHistories(physicianId),
        this.getPhysicianHospitalAffiliations(physicianId),
        this.getPhysicianComplianceByPhysicianId(physicianId),
        this.getPhysicianDocuments(physicianId),
        this.getDeaRegistrationsByPhysician(physicianId),
        this.getCsrLicensesByPhysician(physicianId),
        this.getLicenseDocumentsByPhysician(physicianId)
      ]);

      return {
        physician,
        licenses,
        certifications,
        education,
        workHistory,
        hospitalAffiliations,
        compliance,
        documents,
        deaRegistrations,
        csrLicenses,
        licenseDocuments
      };
    } catch (error) {
      console.error('Error getting physician full profile:', error);
      throw new Error(`Failed to get physician full profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export storage instance - use the factory function to create storage
export const storage: IStorage = createStorage();