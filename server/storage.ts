import { eq, like, ilike, and, or, sql } from 'drizzle-orm';
import {
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
} from '../shared/schema';
import { MemoryStorage } from './memoryStorage';

// Storage factory - chooses between PostgreSQL and in-memory based on environment
export function createStorage(): IStorage {
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
  }>;
}

// Lazy database connection (only when needed)
let db: any = null;
async function getDb() {
  if (!db) {
    const { db: dbInstance } = await import('./db');
    db = dbInstance;
  }
  return db;
}

// PostgreSQL Storage Implementation
export class PostgreSQLStorage implements IStorage {
  // Profile operations
  async createProfile(profile: InsertProfile): Promise<SelectProfile> {
    try {
      const database = await getDb();
      const [result] = await database.insert(profiles).values(profile).returning();
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
      const database = await getDb();
      const [result] = await database.select().from(profiles).where(eq(profiles.userId, userId));
      return result || null;
    } catch (error) {
      console.error('Error getting profile:', error);
      throw new Error(`Failed to get profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProfileById(id: string): Promise<SelectProfile | null> {
    try {
      const [result] = await db.select().from(profiles).where(eq(profiles.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting profile by id:', error);
      throw new Error(`Failed to get profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateProfile(id: string, updates: Partial<InsertProfile>): Promise<SelectProfile> {
    try {
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
      await db.delete(profiles).where(eq(profiles.id, id));
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw new Error(`Failed to delete profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllProfiles(): Promise<SelectProfile[]> {
    try {
      return await db.select().from(profiles);
    } catch (error) {
      console.error('Error getting all profiles:', error);
      throw new Error(`Failed to get profiles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Physician operations
  async createPhysician(physician: InsertPhysician): Promise<SelectPhysician> {
    try {
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
      const [result] = await db.select().from(physicians).where(eq(physicians.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting physician:', error);
      throw new Error(`Failed to get physician: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianByNpi(npi: string): Promise<SelectPhysician | null> {
    try {
      const [result] = await db.select().from(physicians).where(eq(physicians.npi, npi));
      return result || null;
    } catch (error) {
      console.error('Error getting physician by NPI:', error);
      throw new Error(`Failed to get physician: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updatePhysician(id: string, updates: Partial<InsertPhysician>): Promise<SelectPhysician> {
    try {
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
      await db.delete(physicians).where(eq(physicians.id, id));
    } catch (error) {
      console.error('Error deleting physician:', error);
      throw new Error(`Failed to delete physician: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllPhysicians(): Promise<SelectPhysician[]> {
    try {
      return await db.select().from(physicians);
    } catch (error) {
      console.error('Error getting all physicians:', error);
      throw new Error(`Failed to get physicians: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchPhysicians(query: string): Promise<SelectPhysician[]> {
    try {
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
      return await db.select().from(physicians).where(eq(physicians.status, status));
    } catch (error) {
      console.error('Error getting physicians by status:', error);
      throw new Error(`Failed to get physicians: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Physician License operations
  async createPhysicianLicense(license: InsertPhysicianLicense): Promise<SelectPhysicianLicense> {
    try {
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
      const [result] = await db.select().from(physicianLicenses).where(eq(physicianLicenses.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting physician license:', error);
      throw new Error(`Failed to get physician license: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianLicenses(physicianId: string): Promise<SelectPhysicianLicense[]> {
    try {
      return await db.select().from(physicianLicenses).where(eq(physicianLicenses.physicianId, physicianId));
    } catch (error) {
      console.error('Error getting physician licenses:', error);
      throw new Error(`Failed to get physician licenses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updatePhysicianLicense(id: string, updates: Partial<InsertPhysicianLicense>): Promise<SelectPhysicianLicense> {
    try {
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
      await db.delete(physicianLicenses).where(eq(physicianLicenses.id, id));
    } catch (error) {
      console.error('Error deleting physician license:', error);
      throw new Error(`Failed to delete physician license: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getExpiringLicenses(days: number): Promise<SelectPhysicianLicense[]> {
    try {
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
      const [result] = await db.select().from(physicianCertifications).where(eq(physicianCertifications.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting physician certification:', error);
      throw new Error(`Failed to get physician certification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianCertifications(physicianId: string): Promise<SelectPhysicianCertification[]> {
    try {
      return await db.select().from(physicianCertifications).where(eq(physicianCertifications.physicianId, physicianId));
    } catch (error) {
      console.error('Error getting physician certifications:', error);
      throw new Error(`Failed to get physician certifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updatePhysicianCertification(id: string, updates: Partial<InsertPhysicianCertification>): Promise<SelectPhysicianCertification> {
    try {
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
      await db.delete(physicianCertifications).where(eq(physicianCertifications.id, id));
    } catch (error) {
      console.error('Error deleting physician certification:', error);
      throw new Error(`Failed to delete physician certification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getExpiringCertifications(days: number): Promise<SelectPhysicianCertification[]> {
    try {
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
      const [result] = await db.select().from(physicianEducation).where(eq(physicianEducation.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting physician education:', error);
      throw new Error(`Failed to get physician education: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianEducations(physicianId: string): Promise<SelectPhysicianEducation[]> {
    try {
      return await db.select().from(physicianEducation).where(eq(physicianEducation.physicianId, physicianId));
    } catch (error) {
      console.error('Error getting physician educations:', error);
      throw new Error(`Failed to get physician educations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updatePhysicianEducation(id: string, updates: Partial<InsertPhysicianEducation>): Promise<SelectPhysicianEducation> {
    try {
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
      await db.delete(physicianEducation).where(eq(physicianEducation.id, id));
    } catch (error) {
      console.error('Error deleting physician education:', error);
      throw new Error(`Failed to delete physician education: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Physician Work History operations
  async createPhysicianWorkHistory(workHistory: InsertPhysicianWorkHistory): Promise<SelectPhysicianWorkHistory> {
    try {
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
      const [result] = await db.select().from(physicianWorkHistory).where(eq(physicianWorkHistory.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting physician work history:', error);
      throw new Error(`Failed to get physician work history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianWorkHistories(physicianId: string): Promise<SelectPhysicianWorkHistory[]> {
    try {
      return await db.select().from(physicianWorkHistory).where(eq(physicianWorkHistory.physicianId, physicianId));
    } catch (error) {
      console.error('Error getting physician work histories:', error);
      throw new Error(`Failed to get physician work histories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updatePhysicianWorkHistory(id: string, updates: Partial<InsertPhysicianWorkHistory>): Promise<SelectPhysicianWorkHistory> {
    try {
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
      await db.delete(physicianWorkHistory).where(eq(physicianWorkHistory.id, id));
    } catch (error) {
      console.error('Error deleting physician work history:', error);
      throw new Error(`Failed to delete physician work history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Physician Hospital Affiliation operations
  async createPhysicianHospitalAffiliation(affiliation: InsertPhysicianHospitalAffiliation): Promise<SelectPhysicianHospitalAffiliation> {
    try {
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
      const [result] = await db.select().from(physicianHospitalAffiliations).where(eq(physicianHospitalAffiliations.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting physician hospital affiliation:', error);
      throw new Error(`Failed to get physician hospital affiliation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianHospitalAffiliations(physicianId: string): Promise<SelectPhysicianHospitalAffiliation[]> {
    try {
      return await db.select().from(physicianHospitalAffiliations).where(eq(physicianHospitalAffiliations.physicianId, physicianId));
    } catch (error) {
      console.error('Error getting physician hospital affiliations:', error);
      throw new Error(`Failed to get physician hospital affiliations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updatePhysicianHospitalAffiliation(id: string, updates: Partial<InsertPhysicianHospitalAffiliation>): Promise<SelectPhysicianHospitalAffiliation> {
    try {
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
      await db.delete(physicianHospitalAffiliations).where(eq(physicianHospitalAffiliations.id, id));
    } catch (error) {
      console.error('Error deleting physician hospital affiliation:', error);
      throw new Error(`Failed to delete physician hospital affiliation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Physician Compliance operations
  async createPhysicianCompliance(compliance: InsertPhysicianCompliance): Promise<SelectPhysicianCompliance> {
    try {
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
      const [result] = await db.select().from(physicianCompliance).where(eq(physicianCompliance.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting physician compliance:', error);
      throw new Error(`Failed to get physician compliance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianComplianceByPhysicianId(physicianId: string): Promise<SelectPhysicianCompliance | null> {
    try {
      const [result] = await db.select().from(physicianCompliance).where(eq(physicianCompliance.physicianId, physicianId));
      return result || null;
    } catch (error) {
      console.error('Error getting physician compliance by physician id:', error);
      throw new Error(`Failed to get physician compliance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updatePhysicianCompliance(id: string, updates: Partial<InsertPhysicianCompliance>): Promise<SelectPhysicianCompliance> {
    try {
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
      await db.delete(physicianCompliance).where(eq(physicianCompliance.id, id));
    } catch (error) {
      console.error('Error deleting physician compliance:', error);
      throw new Error(`Failed to delete physician compliance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Physician Document operations
  async createPhysicianDocument(document: InsertPhysicianDocument): Promise<SelectPhysicianDocument> {
    try {
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
      const [result] = await db.select().from(physicianDocuments).where(eq(physicianDocuments.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting physician document:', error);
      throw new Error(`Failed to get physician document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianDocuments(physicianId: string): Promise<SelectPhysicianDocument[]> {
    try {
      return await db.select().from(physicianDocuments).where(eq(physicianDocuments.physicianId, physicianId));
    } catch (error) {
      console.error('Error getting physician documents:', error);
      throw new Error(`Failed to get physician documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianDocumentsByType(physicianId: string, documentType: string): Promise<SelectPhysicianDocument[]> {
    try {
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
      await db.delete(physicianDocuments).where(eq(physicianDocuments.id, id));
    } catch (error) {
      console.error('Error deleting physician document:', error);
      throw new Error(`Failed to delete physician document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // User Settings operations
  async createUserSettings(settings: InsertUserSettings): Promise<SelectUserSettings> {
    try {
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
      const [result] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
      return result || null;
    } catch (error) {
      console.error('Error getting user settings:', error);
      throw new Error(`Failed to get user settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUserSettingsById(id: string): Promise<SelectUserSettings | null> {
    try {
      const [result] = await db.select().from(userSettings).where(eq(userSettings.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting user settings by id:', error);
      throw new Error(`Failed to get user settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateUserSettings(userId: string, updates: Partial<InsertUserSettings>): Promise<SelectUserSettings> {
    try {
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
      await db.delete(userSettings).where(eq(userSettings.userId, userId));
    } catch (error) {
      console.error('Error deleting user settings:', error);
      throw new Error(`Failed to delete user settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        documents
      ] = await Promise.all([
        this.getPhysician(physicianId),
        this.getPhysicianLicenses(physicianId),
        this.getPhysicianCertifications(physicianId),
        this.getPhysicianEducations(physicianId),
        this.getPhysicianWorkHistories(physicianId),
        this.getPhysicianHospitalAffiliations(physicianId),
        this.getPhysicianComplianceByPhysicianId(physicianId),
        this.getPhysicianDocuments(physicianId)
      ]);

      return {
        physician,
        licenses,
        certifications,
        education,
        workHistory,
        hospitalAffiliations,
        compliance,
        documents
      };
    } catch (error) {
      console.error('Error getting physician full profile:', error);
      throw new Error(`Failed to get physician full profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// In-Memory Storage Implementation
export class MemStorage implements IStorage {
  private profiles: Map<string, SelectProfile> = new Map();
  private physicians: Map<string, SelectPhysician> = new Map();
  private physicianLicenses: Map<string, SelectPhysicianLicense> = new Map();
  private physicianCertifications: Map<string, SelectPhysicianCertification> = new Map();
  private physicianEducations: Map<string, SelectPhysicianEducation> = new Map();
  private physicianWorkHistories: Map<string, SelectPhysicianWorkHistory> = new Map();
  private physicianHospitalAffiliations: Map<string, SelectPhysicianHospitalAffiliation> = new Map();
  private physicianCompliances: Map<string, SelectPhysicianCompliance> = new Map();
  private physicianDocuments: Map<string, SelectPhysicianDocument> = new Map();

  private generateId(): string {
    return crypto.randomUUID();
  }

  // Profile operations
  async createProfile(profile: InsertProfile): Promise<SelectProfile> {
    const id = this.generateId();
    const now = new Date();
    const newProfile: SelectProfile = {
      id,
      ...profile,
      createdAt: now,
      updatedAt: now
    };
    this.profiles.set(id, newProfile);
    return newProfile;
  }

  async getProfile(userId: string): Promise<SelectProfile | null> {
    for (const profile of this.profiles.values()) {
      if (profile.userId === userId) {
        return profile;
      }
    }
    return null;
  }

  async getProfileById(id: string): Promise<SelectProfile | null> {
    return this.profiles.get(id) || null;
  }

  async updateProfile(id: string, updates: Partial<InsertProfile>): Promise<SelectProfile> {
    const profile = this.profiles.get(id);
    if (!profile) {
      throw new Error('Profile not found');
    }
    const updatedProfile = { ...profile, ...updates, updatedAt: new Date() };
    this.profiles.set(id, updatedProfile);
    return updatedProfile;
  }

  async deleteProfile(id: string): Promise<void> {
    this.profiles.delete(id);
  }

  async getAllProfiles(): Promise<SelectProfile[]> {
    return Array.from(this.profiles.values());
  }

  // Physician operations
  async createPhysician(physician: InsertPhysician): Promise<SelectPhysician> {
    const id = this.generateId();
    const now = new Date();
    const newPhysician: SelectPhysician = {
      id,
      ...physician,
      createdAt: now,
      updatedAt: now
    };
    this.physicians.set(id, newPhysician);
    return newPhysician;
  }

  async getPhysician(id: string): Promise<SelectPhysician | null> {
    return this.physicians.get(id) || null;
  }

  async getPhysicianByNpi(npi: string): Promise<SelectPhysician | null> {
    for (const physician of this.physicians.values()) {
      if (physician.npi === npi) {
        return physician;
      }
    }
    return null;
  }

  async updatePhysician(id: string, updates: Partial<InsertPhysician>): Promise<SelectPhysician> {
    const physician = this.physicians.get(id);
    if (!physician) {
      throw new Error('Physician not found');
    }
    const updatedPhysician = { ...physician, ...updates, updatedAt: new Date() };
    this.physicians.set(id, updatedPhysician);
    return updatedPhysician;
  }

  async deletePhysician(id: string): Promise<void> {
    this.physicians.delete(id);
  }

  async getAllPhysicians(): Promise<SelectPhysician[]> {
    return Array.from(this.physicians.values());
  }

  async searchPhysicians(query: string): Promise<SelectPhysician[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.physicians.values()).filter(physician =>
      physician.fullLegalName?.toLowerCase().includes(lowerQuery) ||
      physician.npi?.includes(query) ||
      physician.practiceName?.toLowerCase().includes(lowerQuery) ||
      physician.emailAddress?.toLowerCase().includes(lowerQuery)
    );
  }

  async getPhysiciansByStatus(status: string): Promise<SelectPhysician[]> {
    return Array.from(this.physicians.values()).filter(physician => physician.status === status);
  }

  // Physician License operations
  async createPhysicianLicense(license: InsertPhysicianLicense): Promise<SelectPhysicianLicense> {
    const id = this.generateId();
    const now = new Date();
    const newLicense: SelectPhysicianLicense = {
      id,
      ...license,
      createdAt: now,
      updatedAt: now
    };
    this.physicianLicenses.set(id, newLicense);
    return newLicense;
  }

  async getPhysicianLicense(id: string): Promise<SelectPhysicianLicense | null> {
    return this.physicianLicenses.get(id) || null;
  }

  async getPhysicianLicenses(physicianId: string): Promise<SelectPhysicianLicense[]> {
    return Array.from(this.physicianLicenses.values()).filter(license => license.physicianId === physicianId);
  }

  async updatePhysicianLicense(id: string, updates: Partial<InsertPhysicianLicense>): Promise<SelectPhysicianLicense> {
    const license = this.physicianLicenses.get(id);
    if (!license) {
      throw new Error('Physician license not found');
    }
    const updatedLicense = { ...license, ...updates, updatedAt: new Date() };
    this.physicianLicenses.set(id, updatedLicense);
    return updatedLicense;
  }

  async deletePhysicianLicense(id: string): Promise<void> {
    this.physicianLicenses.delete(id);
  }

  async getExpiringLicenses(days: number): Promise<SelectPhysicianLicense[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const today = new Date();
    
    return Array.from(this.physicianLicenses.values()).filter(license => {
      if (!license.expirationDate) return false;
      const expDate = new Date(license.expirationDate);
      return expDate <= futureDate && expDate >= today;
    });
  }

  // Physician Certification operations
  async createPhysicianCertification(certification: InsertPhysicianCertification): Promise<SelectPhysicianCertification> {
    const id = this.generateId();
    const now = new Date();
    const newCertification: SelectPhysicianCertification = {
      id,
      ...certification,
      createdAt: now,
      updatedAt: now
    };
    this.physicianCertifications.set(id, newCertification);
    return newCertification;
  }

  async getPhysicianCertification(id: string): Promise<SelectPhysicianCertification | null> {
    return this.physicianCertifications.get(id) || null;
  }

  async getPhysicianCertifications(physicianId: string): Promise<SelectPhysicianCertification[]> {
    return Array.from(this.physicianCertifications.values()).filter(cert => cert.physicianId === physicianId);
  }

  async updatePhysicianCertification(id: string, updates: Partial<InsertPhysicianCertification>): Promise<SelectPhysicianCertification> {
    const certification = this.physicianCertifications.get(id);
    if (!certification) {
      throw new Error('Physician certification not found');
    }
    const updatedCertification = { ...certification, ...updates, updatedAt: new Date() };
    this.physicianCertifications.set(id, updatedCertification);
    return updatedCertification;
  }

  async deletePhysicianCertification(id: string): Promise<void> {
    this.physicianCertifications.delete(id);
  }

  async getExpiringCertifications(days: number): Promise<SelectPhysicianCertification[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const today = new Date();
    
    return Array.from(this.physicianCertifications.values()).filter(cert => {
      if (!cert.expirationDate) return false;
      const expDate = new Date(cert.expirationDate);
      return expDate <= futureDate && expDate >= today;
    });
  }

  // Physician Education operations
  async createPhysicianEducation(education: InsertPhysicianEducation): Promise<SelectPhysicianEducation> {
    const id = this.generateId();
    const now = new Date();
    const newEducation: SelectPhysicianEducation = {
      id,
      ...education,
      createdAt: now,
      updatedAt: now
    };
    this.physicianEducations.set(id, newEducation);
    return newEducation;
  }

  async getPhysicianEducation(id: string): Promise<SelectPhysicianEducation | null> {
    return this.physicianEducations.get(id) || null;
  }

  async getPhysicianEducations(physicianId: string): Promise<SelectPhysicianEducation[]> {
    return Array.from(this.physicianEducations.values()).filter(edu => edu.physicianId === physicianId);
  }

  async updatePhysicianEducation(id: string, updates: Partial<InsertPhysicianEducation>): Promise<SelectPhysicianEducation> {
    const education = this.physicianEducations.get(id);
    if (!education) {
      throw new Error('Physician education not found');
    }
    const updatedEducation = { ...education, ...updates, updatedAt: new Date() };
    this.physicianEducations.set(id, updatedEducation);
    return updatedEducation;
  }

  async deletePhysicianEducation(id: string): Promise<void> {
    this.physicianEducations.delete(id);
  }

  // Physician Work History operations
  async createPhysicianWorkHistory(workHistory: InsertPhysicianWorkHistory): Promise<SelectPhysicianWorkHistory> {
    const id = this.generateId();
    const now = new Date();
    const newWorkHistory: SelectPhysicianWorkHistory = {
      id,
      ...workHistory,
      createdAt: now,
      updatedAt: now
    };
    this.physicianWorkHistories.set(id, newWorkHistory);
    return newWorkHistory;
  }

  async getPhysicianWorkHistory(id: string): Promise<SelectPhysicianWorkHistory | null> {
    return this.physicianWorkHistories.get(id) || null;
  }

  async getPhysicianWorkHistories(physicianId: string): Promise<SelectPhysicianWorkHistory[]> {
    return Array.from(this.physicianWorkHistories.values()).filter(wh => wh.physicianId === physicianId);
  }

  async updatePhysicianWorkHistory(id: string, updates: Partial<InsertPhysicianWorkHistory>): Promise<SelectPhysicianWorkHistory> {
    const workHistory = this.physicianWorkHistories.get(id);
    if (!workHistory) {
      throw new Error('Physician work history not found');
    }
    const updatedWorkHistory = { ...workHistory, ...updates, updatedAt: new Date() };
    this.physicianWorkHistories.set(id, updatedWorkHistory);
    return updatedWorkHistory;
  }

  async deletePhysicianWorkHistory(id: string): Promise<void> {
    this.physicianWorkHistories.delete(id);
  }

  // Physician Hospital Affiliation operations
  async createPhysicianHospitalAffiliation(affiliation: InsertPhysicianHospitalAffiliation): Promise<SelectPhysicianHospitalAffiliation> {
    const id = this.generateId();
    const now = new Date();
    const newAffiliation: SelectPhysicianHospitalAffiliation = {
      id,
      ...affiliation,
      createdAt: now,
      updatedAt: now
    };
    this.physicianHospitalAffiliations.set(id, newAffiliation);
    return newAffiliation;
  }

  async getPhysicianHospitalAffiliation(id: string): Promise<SelectPhysicianHospitalAffiliation | null> {
    return this.physicianHospitalAffiliations.get(id) || null;
  }

  async getPhysicianHospitalAffiliations(physicianId: string): Promise<SelectPhysicianHospitalAffiliation[]> {
    return Array.from(this.physicianHospitalAffiliations.values()).filter(aff => aff.physicianId === physicianId);
  }

  async updatePhysicianHospitalAffiliation(id: string, updates: Partial<InsertPhysicianHospitalAffiliation>): Promise<SelectPhysicianHospitalAffiliation> {
    const affiliation = this.physicianHospitalAffiliations.get(id);
    if (!affiliation) {
      throw new Error('Physician hospital affiliation not found');
    }
    const updatedAffiliation = { ...affiliation, ...updates, updatedAt: new Date() };
    this.physicianHospitalAffiliations.set(id, updatedAffiliation);
    return updatedAffiliation;
  }

  async deletePhysicianHospitalAffiliation(id: string): Promise<void> {
    this.physicianHospitalAffiliations.delete(id);
  }

  // Physician Compliance operations
  async createPhysicianCompliance(compliance: InsertPhysicianCompliance): Promise<SelectPhysicianCompliance> {
    const id = this.generateId();
    const now = new Date();
    const newCompliance: SelectPhysicianCompliance = {
      id,
      ...compliance,
      createdAt: now,
      updatedAt: now
    };
    this.physicianCompliances.set(id, newCompliance);
    return newCompliance;
  }

  async getPhysicianCompliance(id: string): Promise<SelectPhysicianCompliance | null> {
    return this.physicianCompliances.get(id) || null;
  }

  async getPhysicianComplianceByPhysicianId(physicianId: string): Promise<SelectPhysicianCompliance | null> {
    for (const compliance of this.physicianCompliances.values()) {
      if (compliance.physicianId === physicianId) {
        return compliance;
      }
    }
    return null;
  }

  async updatePhysicianCompliance(id: string, updates: Partial<InsertPhysicianCompliance>): Promise<SelectPhysicianCompliance> {
    const compliance = this.physicianCompliances.get(id);
    if (!compliance) {
      throw new Error('Physician compliance not found');
    }
    const updatedCompliance = { ...compliance, ...updates, updatedAt: new Date() };
    this.physicianCompliances.set(id, updatedCompliance);
    return updatedCompliance;
  }

  async deletePhysicianCompliance(id: string): Promise<void> {
    this.physicianCompliances.delete(id);
  }

  // Physician Document operations
  async createPhysicianDocument(document: InsertPhysicianDocument): Promise<SelectPhysicianDocument> {
    const id = this.generateId();
    const now = new Date();
    const newDocument: SelectPhysicianDocument = {
      id,
      ...document,
      createdAt: now,
      updatedAt: now
    };
    this.physicianDocuments.set(id, newDocument);
    return newDocument;
  }

  async getPhysicianDocument(id: string): Promise<SelectPhysicianDocument | null> {
    return this.physicianDocuments.get(id) || null;
  }

  async getPhysicianDocuments(physicianId: string): Promise<SelectPhysicianDocument[]> {
    return Array.from(this.physicianDocuments.values()).filter(doc => doc.physicianId === physicianId);
  }

  async getPhysicianDocumentsByType(physicianId: string, documentType: string): Promise<SelectPhysicianDocument[]> {
    return Array.from(this.physicianDocuments.values()).filter(
      doc => doc.physicianId === physicianId && doc.documentType === documentType
    );
  }

  async updatePhysicianDocument(id: string, updates: Partial<InsertPhysicianDocument>): Promise<SelectPhysicianDocument> {
    const document = this.physicianDocuments.get(id);
    if (!document) {
      throw new Error('Physician document not found');
    }
    const updatedDocument = { ...document, ...updates, updatedAt: new Date() };
    this.physicianDocuments.set(id, updatedDocument);
    return updatedDocument;
  }

  async deletePhysicianDocument(id: string): Promise<void> {
    this.physicianDocuments.delete(id);
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
  }> {
    const [
      physician,
      licenses,
      certifications,
      education,
      workHistory,
      hospitalAffiliations,
      compliance,
      documents
    ] = await Promise.all([
      this.getPhysician(physicianId),
      this.getPhysicianLicenses(physicianId),
      this.getPhysicianCertifications(physicianId),
      this.getPhysicianEducations(physicianId),
      this.getPhysicianWorkHistories(physicianId),
      this.getPhysicianHospitalAffiliations(physicianId),
      this.getPhysicianComplianceByPhysicianId(physicianId),
      this.getPhysicianDocuments(physicianId)
    ]);

    return {
      physician,
      licenses,
      certifications,
      education,
      workHistory,
      hospitalAffiliations,
      compliance,
      documents
    };
  }
}

// Export storage instance - use PostgreSQL by default, fallback to MemStorage if needed
export const storage: IStorage = new PostgreSQLStorage();