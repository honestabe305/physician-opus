import { eq, like, ilike, and, or, sql, lt, desc, asc, count } from 'drizzle-orm';
import { encrypt, decrypt, redactBankingData, validatePrivilegedAccess, decryptBankingData, migrateBankingDataEncryption } from './utils/encryption';
import {
  users,
  sessions,
  profiles,
  practices,
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
  notifications,
  renewalWorkflows,
  payers,
  practiceLocations,
  providerBanking,
  professionalReferences,
  payerEnrollments,
  type SelectUser,
  type InsertUser,
  type SelectSession,
  type InsertSession,
  type SelectProfile,
  type InsertProfile,
  type SelectPractice,
  type InsertPractice,
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
  type SelectNotification,
  type InsertNotification,
  type SelectRenewalWorkflow,
  type InsertRenewalWorkflow,
  type SelectPayer,
  type InsertPayer,
  type SelectPracticeLocation,
  type InsertPracticeLocation,
  type SelectProviderBanking,
  type InsertProviderBanking,
  type SelectProfessionalReference,
  type InsertProfessionalReference,
  type SelectPayerEnrollment,
  type InsertPayerEnrollment,
} from '../shared/schema';
import {
  type RenewalStatus,
  type EnrollmentStatus,
  type NotificationType,
  type ProviderRole,
  type GenericStatus,
  validateRenewalStatus,
  validateEnrollmentStatus,
  validateNotificationType,
  validateProviderRole,
  validateGenericStatus,
} from '../shared/enum-validation';
import { MemoryStorage } from './memoryStorage';
import { type PaginationQuery, type SearchFilter } from './middleware/pagination-middleware';

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
  getAllProfilesPaginated(pagination: PaginationQuery, filters?: SearchFilter[]): Promise<SelectProfile[]>;
  getAllProfilesCount(filters?: SearchFilter[]): Promise<number>;

  // Practice operations
  createPractice(practice: InsertPractice): Promise<SelectPractice>;
  getPractice(id: string): Promise<SelectPractice | null>;
  getPracticeByName(name: string): Promise<SelectPractice | null>;
  getPracticeByNpi(npi: string): Promise<SelectPractice | null>;
  updatePractice(id: string, updates: Partial<InsertPractice>): Promise<SelectPractice>;
  deletePractice(id: string): Promise<void>;
  getAllPractices(): Promise<SelectPractice[]>;
  getAllPracticesPaginated(pagination: PaginationQuery, filters?: SearchFilter[]): Promise<SelectPractice[]>;
  getAllPracticesCount(filters?: SearchFilter[]): Promise<number>;
  searchPractices(query: string): Promise<SelectPractice[]>;
  searchPracticesPaginated(query: string, pagination: PaginationQuery): Promise<SelectPractice[]>;
  searchPracticesCount(query: string): Promise<number>;
  getPhysiciansByPractice(practiceId: string): Promise<SelectPhysician[]>;
  getPhysiciansByPracticePaginated(practiceId: string, pagination: PaginationQuery): Promise<SelectPhysician[]>;
  getPhysiciansByPracticeCount(practiceId: string): Promise<number>;

  // Physician operations
  createPhysician(physician: InsertPhysician): Promise<SelectPhysician>;
  getPhysician(id: string): Promise<SelectPhysician | null>;
  getPhysicianByNpi(npi: string): Promise<SelectPhysician | null>;
  updatePhysician(id: string, updates: Partial<InsertPhysician>): Promise<SelectPhysician>;
  deletePhysician(id: string): Promise<void>;
  getAllPhysicians(): Promise<SelectPhysician[]>;
  getAllPhysiciansPaginated(pagination: PaginationQuery, filters?: SearchFilter[]): Promise<SelectPhysician[]>;
  getAllPhysiciansCount(filters?: SearchFilter[]): Promise<number>;
  searchPhysicians(query: string): Promise<SelectPhysician[]>;
  searchPhysiciansPaginated(query: string, pagination: PaginationQuery): Promise<SelectPhysician[]>;
  searchPhysiciansCount(query: string): Promise<number>;
  getPhysiciansByStatus(status: GenericStatus): Promise<SelectPhysician[]>;
  getPhysiciansByStatusPaginated(status: GenericStatus, pagination: PaginationQuery): Promise<SelectPhysician[]>;
  getPhysiciansByStatusCount(status: GenericStatus): Promise<number>;

  // Physician License operations
  createPhysicianLicense(license: InsertPhysicianLicense): Promise<SelectPhysicianLicense>;
  getPhysicianLicense(id: string): Promise<SelectPhysicianLicense | null>;
  getPhysicianLicenses(physicianId: string): Promise<SelectPhysicianLicense[]>;
  getPhysicianLicensesPaginated(physicianId: string, pagination: PaginationQuery): Promise<SelectPhysicianLicense[]>;
  getPhysicianLicensesCount(physicianId: string): Promise<number>;
  updatePhysicianLicense(id: string, updates: Partial<InsertPhysicianLicense>): Promise<SelectPhysicianLicense>;
  deletePhysicianLicense(id: string): Promise<void>;
  getExpiringLicenses(days: number): Promise<SelectPhysicianLicense[]>;
  getExpiringLicensesPaginated(days: number, pagination: PaginationQuery): Promise<SelectPhysicianLicense[]>;
  getExpiringLicensesCount(days: number): Promise<number>;

  // Physician Certification operations
  createPhysicianCertification(certification: InsertPhysicianCertification): Promise<SelectPhysicianCertification>;
  getPhysicianCertification(id: string): Promise<SelectPhysicianCertification | null>;
  getPhysicianCertifications(physicianId: string): Promise<SelectPhysicianCertification[]>;
  getPhysicianCertificationsPaginated(physicianId: string, pagination: PaginationQuery): Promise<SelectPhysicianCertification[]>;
  getPhysicianCertificationsCount(physicianId: string): Promise<number>;
  updatePhysicianCertification(id: string, updates: Partial<InsertPhysicianCertification>): Promise<SelectPhysicianCertification>;
  deletePhysicianCertification(id: string): Promise<void>;
  getExpiringCertifications(days: number): Promise<SelectPhysicianCertification[]>;
  getExpiringCertificationsPaginated(days: number, pagination: PaginationQuery): Promise<SelectPhysicianCertification[]>;
  getExpiringCertificationsCount(days: number): Promise<number>;

  // Physician Education operations
  createPhysicianEducation(education: InsertPhysicianEducation): Promise<SelectPhysicianEducation>;
  getPhysicianEducation(id: string): Promise<SelectPhysicianEducation | null>;
  getPhysicianEducations(physicianId: string): Promise<SelectPhysicianEducation[]>;
  getPhysicianEducationsPaginated(physicianId: string, pagination: PaginationQuery): Promise<SelectPhysicianEducation[]>;
  getPhysicianEducationsCount(physicianId: string): Promise<number>;
  updatePhysicianEducation(id: string, updates: Partial<InsertPhysicianEducation>): Promise<SelectPhysicianEducation>;
  deletePhysicianEducation(id: string): Promise<void>;

  // Physician Work History operations
  createPhysicianWorkHistory(workHistory: InsertPhysicianWorkHistory): Promise<SelectPhysicianWorkHistory>;
  getPhysicianWorkHistory(id: string): Promise<SelectPhysicianWorkHistory | null>;
  getPhysicianWorkHistories(physicianId: string): Promise<SelectPhysicianWorkHistory[]>;
  getPhysicianWorkHistoriesPaginated(physicianId: string, pagination: PaginationQuery): Promise<SelectPhysicianWorkHistory[]>;
  getPhysicianWorkHistoriesCount(physicianId: string): Promise<number>;
  updatePhysicianWorkHistory(id: string, updates: Partial<InsertPhysicianWorkHistory>): Promise<SelectPhysicianWorkHistory>;
  deletePhysicianWorkHistory(id: string): Promise<void>;

  // Physician Hospital Affiliation operations
  createPhysicianHospitalAffiliation(affiliation: InsertPhysicianHospitalAffiliation): Promise<SelectPhysicianHospitalAffiliation>;
  getPhysicianHospitalAffiliation(id: string): Promise<SelectPhysicianHospitalAffiliation | null>;
  getPhysicianHospitalAffiliations(physicianId: string): Promise<SelectPhysicianHospitalAffiliation[]>;
  getPhysicianHospitalAffiliationsPaginated(physicianId: string, pagination: PaginationQuery): Promise<SelectPhysicianHospitalAffiliation[]>;
  getPhysicianHospitalAffiliationsCount(physicianId: string): Promise<number>;
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
  getRolePolicyByRoleAndState(role: ProviderRole, state: string): Promise<SelectRolePolicy | null>;
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

  // Notification operations
  createNotification(notification: InsertNotification): Promise<SelectNotification>;
  getNotification(id: string): Promise<SelectNotification | null>;
  getNotificationsByPhysician(physicianId: string): Promise<SelectNotification[]>;
  getUpcomingNotifications(days?: number): Promise<SelectNotification[]>;
  getPendingNotifications(): Promise<SelectNotification[]>;
  getFailedNotifications(): Promise<SelectNotification[]>;
  updateNotification(id: string, updates: Partial<InsertNotification>): Promise<SelectNotification>;
  markNotificationSent(id: string, sentAt: Date): Promise<SelectNotification>;
  markNotificationFailed(id: string, errorMessage: string): Promise<SelectNotification>;
  markNotificationRead(id: string): Promise<SelectNotification>;
  deleteNotification(id: string): Promise<void>;
  deleteOldNotifications(olderThan: Date): Promise<void>;
  getNotificationsByType(type: NotificationType): Promise<SelectNotification[]>;

  // Renewal Workflow operations
  createRenewalWorkflow(workflow: InsertRenewalWorkflow): Promise<SelectRenewalWorkflow>;
  getRenewalWorkflow(id: string): Promise<SelectRenewalWorkflow | null>;
  getRenewalWorkflowsByPhysician(physicianId: string): Promise<SelectRenewalWorkflow[]>;
  getRenewalWorkflowsByEntity(entityType: string, entityId: string): Promise<SelectRenewalWorkflow[]>;
  getActiveRenewalWorkflows(): Promise<SelectRenewalWorkflow[]>;
  getUpcomingRenewals(days: number): Promise<SelectRenewalWorkflow[]>;
  updateRenewalWorkflow(id: string, updates: Partial<InsertRenewalWorkflow>): Promise<SelectRenewalWorkflow>;
  updateRenewalStatus(id: string, status: RenewalStatus): Promise<SelectRenewalWorkflow>;
  updateRenewalProgress(id: string, progress: number, checklist?: any): Promise<SelectRenewalWorkflow>;
  deleteRenewalWorkflow(id: string): Promise<void>;

  // Payer operations
  createPayer(payer: InsertPayer): Promise<SelectPayer>;
  getPayer(id: string): Promise<SelectPayer | null>;
  getPayerByName(name: string): Promise<SelectPayer | null>;
  updatePayer(id: string, updates: Partial<InsertPayer>): Promise<SelectPayer>;
  deletePayer(id: string): Promise<void>;
  getAllPayers(): Promise<SelectPayer[]>;
  searchPayers(query: string): Promise<SelectPayer[]>;

  // Practice Location operations  
  createPracticeLocation(location: InsertPracticeLocation): Promise<SelectPracticeLocation>;
  getPracticeLocation(id: string): Promise<SelectPracticeLocation | null>;
  getPracticeLocationsByPractice(practiceId: string): Promise<SelectPracticeLocation[]>;
  updatePracticeLocation(id: string, updates: Partial<InsertPracticeLocation>): Promise<SelectPracticeLocation>;
  deletePracticeLocation(id: string): Promise<void>;
  getAllPracticeLocations(): Promise<SelectPracticeLocation[]>;

  // Provider Banking operations
  createProviderBanking(banking: InsertProviderBanking): Promise<SelectProviderBanking>;
  // SECURE DEFAULT: These methods return redacted data by default
  getProviderBanking(id: string): Promise<SelectProviderBanking | null>;
  getProviderBankingByPhysician(physicianId: string): Promise<SelectProviderBanking | null>;
  // PRIVILEGED ACCESS: These methods require role validation and return decrypted data
  getProviderBankingDecrypted(id: string, userId: string, role: string): Promise<SelectProviderBanking | null>;
  getProviderBankingByPhysicianDecrypted(physicianId: string, userId: string, role: string): Promise<SelectProviderBanking | null>;
  updateProviderBanking(id: string, updates: Partial<InsertProviderBanking>): Promise<SelectProviderBanking>;
  deleteProviderBanking(id: string): Promise<void>;

  // Professional Reference operations
  createProfessionalReference(reference: InsertProfessionalReference): Promise<SelectProfessionalReference>;
  getProfessionalReference(id: string): Promise<SelectProfessionalReference | null>;
  getProfessionalReferencesByPhysician(physicianId: string): Promise<SelectProfessionalReference[]>;
  getAllProfessionalReferences(): Promise<SelectProfessionalReference[]>;
  getAllProfessionalReferencesPaginated(pagination: PaginationQuery, filters?: SearchFilter[]): Promise<SelectProfessionalReference[]>;
  getAllProfessionalReferencesCount(filters?: SearchFilter[]): Promise<number>;
  updateProfessionalReference(id: string, updates: Partial<InsertProfessionalReference>): Promise<SelectProfessionalReference>;
  deleteProfessionalReference(id: string): Promise<void>;

  // Payer Enrollment operations
  createPayerEnrollment(enrollment: InsertPayerEnrollment): Promise<SelectPayerEnrollment>;
  getPayerEnrollment(id: string): Promise<SelectPayerEnrollment | null>;
  getPayerEnrollmentsByPhysician(physicianId: string): Promise<SelectPayerEnrollment[]>;
  getPayerEnrollmentsByPayer(payerId: string): Promise<SelectPayerEnrollment[]>;
  getPayerEnrollmentsByLocation(locationId: string): Promise<SelectPayerEnrollment[]>;
  getPayerEnrollmentsByStatus(status: EnrollmentStatus): Promise<SelectPayerEnrollment[]>;
  getExpiringEnrollments(days: number): Promise<SelectPayerEnrollment[]>;
  getAllPayerEnrollments(): Promise<SelectPayerEnrollment[]>;
  updatePayerEnrollment(id: string, updates: Partial<InsertPayerEnrollment>): Promise<SelectPayerEnrollment>;
  updateEnrollmentStatus(id: string, status: EnrollmentStatus): Promise<SelectPayerEnrollment>;
  updateEnrollmentProgress(id: string, progress: number): Promise<SelectPayerEnrollment>;
  deletePayerEnrollment(id: string): Promise<void>;

  // Payer Enrollment operations - Paginated versions
  getAllPayerEnrollmentsPaginated(pagination: PaginationQuery, filters?: SearchFilter[]): Promise<SelectPayerEnrollment[]>;
  getAllPayerEnrollmentsCount(filters?: SearchFilter[]): Promise<number>;
  getPayerEnrollmentsByPhysicianPaginated(physicianId: string, pagination: PaginationQuery): Promise<SelectPayerEnrollment[]>;
  getPayerEnrollmentsByPhysicianCount(physicianId: string): Promise<number>;
  getPayerEnrollmentsByPayerPaginated(payerId: string, pagination: PaginationQuery): Promise<SelectPayerEnrollment[]>;
  getPayerEnrollmentsByPayerCount(payerId: string): Promise<number>;
  getPayerEnrollmentsByLocationPaginated(locationId: string, pagination: PaginationQuery): Promise<SelectPayerEnrollment[]>;
  getPayerEnrollmentsByLocationCount(locationId: string): Promise<number>;
  getPayerEnrollmentsByStatusPaginated(status: EnrollmentStatus, pagination: PaginationQuery): Promise<SelectPayerEnrollment[]>;
  getPayerEnrollmentsByStatusCount(status: EnrollmentStatus): Promise<number>;
  getExpiringEnrollmentsPaginated(days: number, pagination: PaginationQuery): Promise<SelectPayerEnrollment[]>;
  getExpiringEnrollmentsCount(days: number): Promise<number>;

  // Payer operations - Paginated versions  
  getAllPayersPaginated(pagination: PaginationQuery, filters?: SearchFilter[]): Promise<SelectPayer[]>;
  getAllPayersCount(filters?: SearchFilter[]): Promise<number>;
  searchPayersPaginated(query: string, pagination: PaginationQuery): Promise<SelectPayer[]>;
  searchPayersCount(query: string): Promise<number>;
  getPayersByLineOfBusinessPaginated(lineOfBusiness: string, pagination: PaginationQuery): Promise<SelectPayer[]>;
  getPayersByLineOfBusinessCount(lineOfBusiness: string): Promise<number>;
  getPayersByStatusPaginated(isActive: boolean, pagination: PaginationQuery): Promise<SelectPayer[]>;
  getPayersByStatusCount(isActive: boolean): Promise<number>;

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
    providerBanking: SelectProviderBanking | null;
    professionalReferences: SelectProfessionalReference[];
    payerEnrollments: SelectPayerEnrollment[];
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

  async getAllProfilesPaginated(pagination: PaginationQuery, filters: SearchFilter[] = []): Promise<SelectProfile[]> {
    try {
      const db = await this.getDb();
      let query = db.select().from(profiles);
      
      // Apply filters
      if (filters.length > 0) {
        const conditions = filters.map(filter => {
          const column = (profiles as any)[filter.field];
          if (!column) return null;
          
          switch (filter.operator) {
            case 'eq':
              return eq(column, filter.value);
            case 'like':
              return ilike(column, `%${filter.value}%`);
            default:
              return null;
          }
        }).filter(Boolean);
        
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
      }
      
      // Apply sorting with stable ordering
      if (pagination.sort) {
        const orderDirection = pagination.order === 'asc' ? asc : desc;
        const column = (profiles as any)[pagination.sort];
        if (column) {
          query = query.orderBy(orderDirection(column), desc(profiles.createdAt), desc(profiles.id));
        } else {
          query = query.orderBy(desc(profiles.createdAt), desc(profiles.id));
        }
      } else {
        query = query.orderBy(desc(profiles.createdAt), desc(profiles.id));
      }
      
      return await query.limit(pagination.limit).offset(pagination.offset!);
    } catch (error) {
      console.error('Error getting paginated profiles:', error);
      throw new Error(`Failed to get paginated profiles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllProfilesCount(filters: SearchFilter[] = []): Promise<number> {
    try {
      const db = await this.getDb();
      let query = db.select({ count: count() }).from(profiles);
      
      // Apply filters
      if (filters.length > 0) {
        const conditions = filters.map(filter => {
          const column = (profiles as any)[filter.field];
          if (!column) return null;
          
          switch (filter.operator) {
            case 'eq':
              return eq(column, filter.value);
            case 'like':
              return ilike(column, `%${filter.value}%`);
            default:
              return null;
          }
        }).filter(Boolean);
        
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
      }
      
      const result = await query;
      return result[0].count;
    } catch (error) {
      console.error('Error getting profiles count:', error);
      throw new Error(`Failed to get profiles count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Practice operations
  async createPractice(practice: InsertPractice): Promise<SelectPractice> {
    try {
      const db = await this.getDb();
      const [result] = await db.insert(practices).values(practice).returning();
      if (!result) {
        throw new Error('Failed to create practice');
      }
      return result;
    } catch (error) {
      console.error('Error creating practice:', error);
      throw new Error(`Failed to create practice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPractice(id: string): Promise<SelectPractice | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(practices).where(eq(practices.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting practice:', error);
      throw new Error(`Failed to get practice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPracticeByName(name: string): Promise<SelectPractice | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(practices).where(eq(practices.name, name));
      return result || null;
    } catch (error) {
      console.error('Error getting practice by name:', error);
      throw new Error(`Failed to get practice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPracticeByNpi(npi: string): Promise<SelectPractice | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(practices).where(eq(practices.npi, npi));
      return result || null;
    } catch (error) {
      console.error('Error getting practice by NPI:', error);
      throw new Error(`Failed to get practice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updatePractice(id: string, updates: Partial<InsertPractice>): Promise<SelectPractice> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .update(practices)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(practices.id, id))
        .returning();
      
      if (!result) {
        throw new Error('Practice not found');
      }
      return result;
    } catch (error) {
      console.error('Error updating practice:', error);
      throw new Error(`Failed to update practice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deletePractice(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(practices).where(eq(practices.id, id));
    } catch (error) {
      console.error('Error deleting practice:', error);
      throw new Error(`Failed to delete practice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllPractices(): Promise<SelectPractice[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(practices).where(eq(practices.isActive, true));
    } catch (error) {
      console.error('Error getting all practices:', error);
      throw new Error(`Failed to get practices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchPractices(query: string): Promise<SelectPractice[]> {
    try {
      const db = await this.getDb();
      return await db
        .select()
        .from(practices)
        .where(
          and(
            eq(practices.isActive, true),
            or(
              ilike(practices.name, `%${query}%`),
              ilike(practices.specialty, `%${query}%`),
              ilike(practices.primaryAddress, `%${query}%`)
            )
          )
        );
    } catch (error) {
      console.error('Error searching practices:', error);
      throw new Error(`Failed to search practices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysiciansByPractice(practiceId: string): Promise<SelectPhysician[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(physicians).where(eq(physicians.practiceId, practiceId));
    } catch (error) {
      console.error('Error getting physicians by practice:', error);
      throw new Error(`Failed to get physicians: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllPracticesPaginated(pagination: PaginationQuery, filters: SearchFilter[] = []): Promise<SelectPractice[]> {
    try {
      const db = await this.getDb();
      let query = db.select().from(practices).where(eq(practices.isActive, true));
      
      // Apply filters
      if (filters.length > 0) {
        const conditions = filters.map(filter => {
          const column = (practices as any)[filter.field];
          if (!column) return null;
          
          switch (filter.operator) {
            case 'eq':
              return eq(column, filter.value);
            case 'like':
              return ilike(column, `%${filter.value}%`);
            default:
              return null;
          }
        }).filter(Boolean);
        
        if (conditions.length > 0) {
          query = query.where(and(eq(practices.isActive, true), ...conditions));
        }
      }
      
      // Apply sorting with stable ordering
      if (pagination.sort) {
        const orderDirection = pagination.order === 'asc' ? asc : desc;
        const column = (practices as any)[pagination.sort];
        if (column) {
          query = query.orderBy(orderDirection(column), desc(practices.createdAt), desc(practices.id));
        } else {
          query = query.orderBy(desc(practices.createdAt), desc(practices.id));
        }
      } else {
        query = query.orderBy(desc(practices.createdAt), desc(practices.id));
      }
      
      return await query.limit(pagination.limit).offset(pagination.offset!);
    } catch (error) {
      console.error('Error getting paginated practices:', error);
      throw new Error(`Failed to get paginated practices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllPracticesCount(filters: SearchFilter[] = []): Promise<number> {
    try {
      const db = await this.getDb();
      let query = db.select({ count: count() }).from(practices).where(eq(practices.isActive, true));
      
      // Apply filters
      if (filters.length > 0) {
        const conditions = filters.map(filter => {
          const column = (practices as any)[filter.field];
          if (!column) return null;
          
          switch (filter.operator) {
            case 'eq':
              return eq(column, filter.value);
            case 'like':
              return ilike(column, `%${filter.value}%`);
            default:
              return null;
          }
        }).filter(Boolean);
        
        if (conditions.length > 0) {
          query = query.where(and(eq(practices.isActive, true), ...conditions));
        }
      }
      
      const result = await query;
      return result[0].count;
    } catch (error) {
      console.error('Error getting practices count:', error);
      throw new Error(`Failed to get practices count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchPracticesPaginated(searchQuery: string, pagination: PaginationQuery): Promise<SelectPractice[]> {
    try {
      const db = await this.getDb();
      let query = db
        .select()
        .from(practices)
        .where(
          and(
            eq(practices.isActive, true),
            or(
              ilike(practices.name, `%${searchQuery}%`),
              ilike(practices.specialty, `%${searchQuery}%`),
              ilike(practices.primaryAddress, `%${searchQuery}%`)
            )
          )
        );
      
      // Apply sorting with stable ordering
      if (pagination.sort) {
        const orderDirection = pagination.order === 'asc' ? asc : desc;
        const column = (practices as any)[pagination.sort];
        if (column) {
          query = query.orderBy(orderDirection(column), desc(practices.createdAt), desc(practices.id));
        } else {
          query = query.orderBy(desc(practices.createdAt), desc(practices.id));
        }
      } else {
        query = query.orderBy(desc(practices.createdAt), desc(practices.id));
      }
      
      return await query.limit(pagination.limit).offset(pagination.offset!);
    } catch (error) {
      console.error('Error searching paginated practices:', error);
      throw new Error(`Failed to search paginated practices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchPracticesCount(searchQuery: string): Promise<number> {
    try {
      const db = await this.getDb();
      const result = await db
        .select({ count: count() })
        .from(practices)
        .where(
          and(
            eq(practices.isActive, true),
            or(
              ilike(practices.name, `%${searchQuery}%`),
              ilike(practices.specialty, `%${searchQuery}%`),
              ilike(practices.primaryAddress, `%${searchQuery}%`)
            )
          )
        );
      return result[0].count;
    } catch (error) {
      console.error('Error getting search practices count:', error);
      throw new Error(`Failed to get search practices count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysiciansByPracticePaginated(practiceId: string, pagination: PaginationQuery): Promise<SelectPhysician[]> {
    try {
      const db = await this.getDb();
      let query = db.select().from(physicians).where(eq(physicians.practiceId, practiceId));
      
      // Apply sorting with stable ordering
      if (pagination.sort) {
        const orderDirection = pagination.order === 'asc' ? asc : desc;
        const column = (physicians as any)[pagination.sort];
        if (column) {
          query = query.orderBy(orderDirection(column), desc(physicians.createdAt), desc(physicians.id));
        } else {
          query = query.orderBy(desc(physicians.createdAt), desc(physicians.id));
        }
      } else {
        query = query.orderBy(desc(physicians.createdAt), desc(physicians.id));
      }
      
      return await query.limit(pagination.limit).offset(pagination.offset!);
    } catch (error) {
      console.error('Error getting paginated physicians by practice:', error);
      throw new Error(`Failed to get paginated physicians: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysiciansByPracticeCount(practiceId: string): Promise<number> {
    try {
      const db = await this.getDb();
      const result = await db.select({ count: count() }).from(physicians).where(eq(physicians.practiceId, practiceId));
      return result[0].count;
    } catch (error) {
      console.error('Error getting physicians count by practice:', error);
      throw new Error(`Failed to get physicians count: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  async getPhysiciansByStatus(status: GenericStatus): Promise<SelectPhysician[]> {
    try {
      // Validate enum value
      const validatedStatus = validateGenericStatus(status);
      
      const db = await this.getDb();
      return await db.select().from(physicians).where(eq(physicians.status, validatedStatus));
    } catch (error) {
      console.error('Error getting physicians by status:', error);
      throw new Error(`Failed to get physicians: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllPhysiciansPaginated(pagination: PaginationQuery, filters: SearchFilter[] = []): Promise<SelectPhysician[]> {
    try {
      const db = await this.getDb();
      let query = db.select().from(physicians);
      
      // Apply filters
      if (filters.length > 0) {
        const conditions = filters.map(filter => {
          const column = (physicians as any)[filter.field];
          if (!column) return null;
          
          switch (filter.operator) {
            case 'eq':
              return eq(column, filter.value);
            case 'like':
              return ilike(column, `%${filter.value}%`);
            default:
              return null;
          }
        }).filter(Boolean);
        
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
      }
      
      // Apply sorting with stable ordering
      if (pagination.sort) {
        const orderDirection = pagination.order === 'asc' ? asc : desc;
        const column = (physicians as any)[pagination.sort];
        if (column) {
          query = query.orderBy(orderDirection(column), desc(physicians.createdAt), desc(physicians.id));
        } else {
          query = query.orderBy(desc(physicians.createdAt), desc(physicians.id));
        }
      } else {
        query = query.orderBy(desc(physicians.createdAt), desc(physicians.id));
      }
      
      return await query.limit(pagination.limit).offset(pagination.offset!);
    } catch (error) {
      console.error('Error getting paginated physicians:', error);
      throw new Error(`Failed to get paginated physicians: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllPhysiciansCount(filters: SearchFilter[] = []): Promise<number> {
    try {
      const db = await this.getDb();
      let query = db.select({ count: count() }).from(physicians);
      
      // Apply filters
      if (filters.length > 0) {
        const conditions = filters.map(filter => {
          const column = (physicians as any)[filter.field];
          if (!column) return null;
          
          switch (filter.operator) {
            case 'eq':
              return eq(column, filter.value);
            case 'like':
              return ilike(column, `%${filter.value}%`);
            default:
              return null;
          }
        }).filter(Boolean);
        
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
      }
      
      const result = await query;
      return result[0].count;
    } catch (error) {
      console.error('Error getting physicians count:', error);
      throw new Error(`Failed to get physicians count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchPhysiciansPaginated(searchQuery: string, pagination: PaginationQuery): Promise<SelectPhysician[]> {
    try {
      const db = await this.getDb();
      let query = db
        .select()
        .from(physicians)
        .where(
          or(
            ilike(physicians.fullLegalName, `%${searchQuery}%`),
            like(physicians.npi, `%${searchQuery}%`),
            ilike(physicians.practiceName, `%${searchQuery}%`),
            ilike(physicians.emailAddress, `%${searchQuery}%`)
          )
        );
      
      // Apply sorting with stable ordering
      if (pagination.sort) {
        const orderDirection = pagination.order === 'asc' ? asc : desc;
        const column = (physicians as any)[pagination.sort];
        if (column) {
          query = query.orderBy(orderDirection(column), desc(physicians.createdAt), desc(physicians.id));
        } else {
          query = query.orderBy(desc(physicians.createdAt), desc(physicians.id));
        }
      } else {
        query = query.orderBy(desc(physicians.createdAt), desc(physicians.id));
      }
      
      return await query.limit(pagination.limit).offset(pagination.offset!);
    } catch (error) {
      console.error('Error searching paginated physicians:', error);
      throw new Error(`Failed to search paginated physicians: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchPhysiciansCount(searchQuery: string): Promise<number> {
    try {
      const db = await this.getDb();
      const result = await db
        .select({ count: count() })
        .from(physicians)
        .where(
          or(
            ilike(physicians.fullLegalName, `%${searchQuery}%`),
            like(physicians.npi, `%${searchQuery}%`),
            ilike(physicians.practiceName, `%${searchQuery}%`),
            ilike(physicians.emailAddress, `%${searchQuery}%`)
          )
        );
      return result[0].count;
    } catch (error) {
      console.error('Error getting search physicians count:', error);
      throw new Error(`Failed to get search physicians count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysiciansByStatusPaginated(status: GenericStatus, pagination: PaginationQuery): Promise<SelectPhysician[]> {
    try {
      // Validate enum value
      const validatedStatus = validateGenericStatus(status);
      
      const db = await this.getDb();
      let query = db.select().from(physicians).where(eq(physicians.status, validatedStatus));
      
      // Apply sorting with stable ordering
      if (pagination.sort) {
        const orderDirection = pagination.order === 'asc' ? asc : desc;
        const column = (physicians as any)[pagination.sort];
        if (column) {
          query = query.orderBy(orderDirection(column), desc(physicians.createdAt), desc(physicians.id));
        } else {
          query = query.orderBy(desc(physicians.createdAt), desc(physicians.id));
        }
      } else {
        query = query.orderBy(desc(physicians.createdAt), desc(physicians.id));
      }
      
      return await query.limit(pagination.limit).offset(pagination.offset!);
    } catch (error) {
      console.error('Error getting paginated physicians by status:', error);
      throw new Error(`Failed to get paginated physicians: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysiciansByStatusCount(status: GenericStatus): Promise<number> {
    try {
      // Validate enum value
      const validatedStatus = validateGenericStatus(status);
      
      const db = await this.getDb();
      const result = await db.select({ count: count() }).from(physicians).where(eq(physicians.status, validatedStatus));
      return result[0].count;
    } catch (error) {
      console.error('Error getting physicians count by status:', error);
      throw new Error(`Failed to get physicians count: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  async getPhysicianLicensesPaginated(physicianId: string, pagination: PaginationQuery): Promise<SelectPhysicianLicense[]> {
    try {
      const db = await this.getDb();
      let query = db.select().from(physicianLicenses).where(eq(physicianLicenses.physicianId, physicianId));
      
      // Apply sorting with stable ordering
      if (pagination.sort) {
        const orderDirection = pagination.order === 'asc' ? asc : desc;
        const column = (physicianLicenses as any)[pagination.sort];
        if (column) {
          query = query.orderBy(orderDirection(column), desc(physicianLicenses.createdAt), desc(physicianLicenses.id));
        } else {
          query = query.orderBy(desc(physicianLicenses.createdAt), desc(physicianLicenses.id));
        }
      } else {
        query = query.orderBy(desc(physicianLicenses.createdAt), desc(physicianLicenses.id));
      }
      
      return await query.limit(pagination.limit).offset(pagination.offset!);
    } catch (error) {
      console.error('Error getting paginated physician licenses:', error);
      throw new Error(`Failed to get paginated physician licenses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianLicensesCount(physicianId: string): Promise<number> {
    try {
      const db = await this.getDb();
      const result = await db.select({ count: count() }).from(physicianLicenses).where(eq(physicianLicenses.physicianId, physicianId));
      return result[0].count;
    } catch (error) {
      console.error('Error getting physician licenses count:', error);
      throw new Error(`Failed to get physician licenses count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getExpiringLicensesPaginated(days: number, pagination: PaginationQuery): Promise<SelectPhysicianLicense[]> {
    try {
      const db = await this.getDb();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      
      let query = db
        .select()
        .from(physicianLicenses)
        .where(
          and(
            sql`${physicianLicenses.expirationDate} <= ${futureDate.toISOString().split('T')[0]}`,
            sql`${physicianLicenses.expirationDate} >= ${new Date().toISOString().split('T')[0]}`
          )
        );
      
      // Apply sorting with stable ordering
      if (pagination.sort) {
        const orderDirection = pagination.order === 'asc' ? asc : desc;
        const column = (physicianLicenses as any)[pagination.sort];
        if (column) {
          query = query.orderBy(orderDirection(column), desc(physicianLicenses.createdAt), desc(physicianLicenses.id));
        } else {
          query = query.orderBy(desc(physicianLicenses.createdAt), desc(physicianLicenses.id));
        }
      } else {
        query = query.orderBy(desc(physicianLicenses.createdAt), desc(physicianLicenses.id));
      }
      
      return await query.limit(pagination.limit).offset(pagination.offset!);
    } catch (error) {
      console.error('Error getting paginated expiring licenses:', error);
      throw new Error(`Failed to get paginated expiring licenses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getExpiringLicensesCount(days: number): Promise<number> {
    try {
      const db = await this.getDb();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      
      const result = await db
        .select({ count: count() })
        .from(physicianLicenses)
        .where(
          and(
            sql`${physicianLicenses.expirationDate} <= ${futureDate.toISOString().split('T')[0]}`,
            sql`${physicianLicenses.expirationDate} >= ${new Date().toISOString().split('T')[0]}`
          )
        );
      return result[0].count;
    } catch (error) {
      console.error('Error getting expiring licenses count:', error);
      throw new Error(`Failed to get expiring licenses count: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  async getPhysicianCertificationsPaginated(physicianId: string, pagination: PaginationQuery): Promise<SelectPhysicianCertification[]> {
    try {
      const db = await this.getDb();
      let query = db.select().from(physicianCertifications).where(eq(physicianCertifications.physicianId, physicianId));
      
      // Apply sorting with stable ordering
      if (pagination.sort) {
        const orderDirection = pagination.order === 'asc' ? asc : desc;
        const column = (physicianCertifications as any)[pagination.sort];
        if (column) {
          query = query.orderBy(orderDirection(column), desc(physicianCertifications.createdAt), desc(physicianCertifications.id));
        } else {
          query = query.orderBy(desc(physicianCertifications.createdAt), desc(physicianCertifications.id));
        }
      } else {
        query = query.orderBy(desc(physicianCertifications.createdAt), desc(physicianCertifications.id));
      }
      
      return await query.limit(pagination.limit).offset(pagination.offset!);
    } catch (error) {
      console.error('Error getting paginated physician certifications:', error);
      throw new Error(`Failed to get paginated physician certifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianCertificationsCount(physicianId: string): Promise<number> {
    try {
      const db = await this.getDb();
      const result = await db.select({ count: count() }).from(physicianCertifications).where(eq(physicianCertifications.physicianId, physicianId));
      return result[0].count;
    } catch (error) {
      console.error('Error getting physician certifications count:', error);
      throw new Error(`Failed to get physician certifications count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getExpiringCertificationsPaginated(days: number, pagination: PaginationQuery): Promise<SelectPhysicianCertification[]> {
    try {
      const db = await this.getDb();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      
      let query = db
        .select()
        .from(physicianCertifications)
        .where(
          and(
            sql`${physicianCertifications.expirationDate} <= ${futureDate.toISOString().split('T')[0]}`,
            sql`${physicianCertifications.expirationDate} >= ${new Date().toISOString().split('T')[0]}`
          )
        );
      
      // Apply sorting with stable ordering
      if (pagination.sort) {
        const orderDirection = pagination.order === 'asc' ? asc : desc;
        const column = (physicianCertifications as any)[pagination.sort];
        if (column) {
          query = query.orderBy(orderDirection(column), desc(physicianCertifications.createdAt), desc(physicianCertifications.id));
        } else {
          query = query.orderBy(desc(physicianCertifications.createdAt), desc(physicianCertifications.id));
        }
      } else {
        query = query.orderBy(desc(physicianCertifications.createdAt), desc(physicianCertifications.id));
      }
      
      return await query.limit(pagination.limit).offset(pagination.offset!);
    } catch (error) {
      console.error('Error getting paginated expiring certifications:', error);
      throw new Error(`Failed to get paginated expiring certifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getExpiringCertificationsCount(days: number): Promise<number> {
    try {
      const db = await this.getDb();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      
      const result = await db
        .select({ count: count() })
        .from(physicianCertifications)
        .where(
          and(
            sql`${physicianCertifications.expirationDate} <= ${futureDate.toISOString().split('T')[0]}`,
            sql`${physicianCertifications.expirationDate} >= ${new Date().toISOString().split('T')[0]}`
          )
        );
      return result[0].count;
    } catch (error) {
      console.error('Error getting expiring certifications count:', error);
      throw new Error(`Failed to get expiring certifications count: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  async getPhysicianEducationsPaginated(physicianId: string, pagination: PaginationQuery): Promise<SelectPhysicianEducation[]> {
    try {
      const db = await this.getDb();
      let query = db.select().from(physicianEducation).where(eq(physicianEducation.physicianId, physicianId));
      
      // Apply sorting with stable ordering
      if (pagination.sort) {
        const orderDirection = pagination.order === 'asc' ? asc : desc;
        const column = (physicianEducation as any)[pagination.sort];
        if (column) {
          query = query.orderBy(orderDirection(column), desc(physicianEducation.createdAt), desc(physicianEducation.id));
        } else {
          query = query.orderBy(desc(physicianEducation.createdAt), desc(physicianEducation.id));
        }
      } else {
        query = query.orderBy(desc(physicianEducation.createdAt), desc(physicianEducation.id));
      }
      
      return await query.limit(pagination.limit).offset(pagination.offset!);
    } catch (error) {
      console.error('Error getting paginated physician educations:', error);
      throw new Error(`Failed to get paginated physician educations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianEducationsCount(physicianId: string): Promise<number> {
    try {
      const db = await this.getDb();
      const result = await db.select({ count: count() }).from(physicianEducation).where(eq(physicianEducation.physicianId, physicianId));
      return result[0].count;
    } catch (error) {
      console.error('Error getting physician educations count:', error);
      throw new Error(`Failed to get physician educations count: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  async getPhysicianWorkHistoriesPaginated(physicianId: string, pagination: PaginationQuery): Promise<SelectPhysicianWorkHistory[]> {
    try {
      const db = await this.getDb();
      let query = db.select().from(physicianWorkHistory).where(eq(physicianWorkHistory.physicianId, physicianId));
      
      // Apply sorting with stable ordering
      if (pagination.sort) {
        const orderDirection = pagination.order === 'asc' ? asc : desc;
        const column = (physicianWorkHistory as any)[pagination.sort];
        if (column) {
          query = query.orderBy(orderDirection(column), desc(physicianWorkHistory.createdAt), desc(physicianWorkHistory.id));
        } else {
          query = query.orderBy(desc(physicianWorkHistory.createdAt), desc(physicianWorkHistory.id));
        }
      } else {
        query = query.orderBy(desc(physicianWorkHistory.createdAt), desc(physicianWorkHistory.id));
      }
      
      return await query.limit(pagination.limit).offset(pagination.offset!);
    } catch (error) {
      console.error('Error getting paginated physician work histories:', error);
      throw new Error(`Failed to get paginated physician work histories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianWorkHistoriesCount(physicianId: string): Promise<number> {
    try {
      const db = await this.getDb();
      const result = await db.select({ count: count() }).from(physicianWorkHistory).where(eq(physicianWorkHistory.physicianId, physicianId));
      return result[0].count;
    } catch (error) {
      console.error('Error getting physician work histories count:', error);
      throw new Error(`Failed to get physician work histories count: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  async getPhysicianHospitalAffiliationsPaginated(physicianId: string, pagination: PaginationQuery): Promise<SelectPhysicianHospitalAffiliation[]> {
    try {
      const db = await this.getDb();
      let query = db.select().from(physicianHospitalAffiliations).where(eq(physicianHospitalAffiliations.physicianId, physicianId));
      
      // Apply sorting with stable ordering
      if (pagination.sort) {
        const orderDirection = pagination.order === 'asc' ? asc : desc;
        const column = (physicianHospitalAffiliations as any)[pagination.sort];
        if (column) {
          query = query.orderBy(orderDirection(column), desc(physicianHospitalAffiliations.createdAt), desc(physicianHospitalAffiliations.id));
        } else {
          query = query.orderBy(desc(physicianHospitalAffiliations.createdAt), desc(physicianHospitalAffiliations.id));
        }
      } else {
        query = query.orderBy(desc(physicianHospitalAffiliations.createdAt), desc(physicianHospitalAffiliations.id));
      }
      
      return await query.limit(pagination.limit).offset(pagination.offset!);
    } catch (error) {
      console.error('Error getting paginated physician hospital affiliations:', error);
      throw new Error(`Failed to get paginated physician hospital affiliations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPhysicianHospitalAffiliationsCount(physicianId: string): Promise<number> {
    try {
      const db = await this.getDb();
      const result = await db.select({ count: count() }).from(physicianHospitalAffiliations).where(eq(physicianHospitalAffiliations.physicianId, physicianId));
      return result[0].count;
    } catch (error) {
      console.error('Error getting physician hospital affiliations count:', error);
      throw new Error(`Failed to get physician hospital affiliations count: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  async getRolePolicyByRoleAndState(role: ProviderRole, state: string): Promise<SelectRolePolicy | null> {
    try {
      // Validate enum value
      const validatedRole = validateProviderRole(role);
      
      const db = await this.getDb();
      const [result] = await db
        .select()
        .from(rolePolicies)
        .where(
          and(
            eq(rolePolicies.role, validatedRole),
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

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<SelectNotification> {
    try {
      const db = await this.getDb();
      const [result] = await db.insert(notifications).values(notification).returning();
      if (!result) {
        throw new Error('Failed to create notification');
      }
      return result;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error(`Failed to create notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getNotification(id: string): Promise<SelectNotification | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(notifications).where(eq(notifications.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting notification:', error);
      throw new Error(`Failed to get notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getNotificationsByPhysician(physicianId: string): Promise<SelectNotification[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(notifications).where(eq(notifications.physicianId, physicianId))
        .orderBy(notifications.notificationDate);
    } catch (error) {
      console.error('Error getting notifications by physician:', error);
      throw new Error(`Failed to get notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUpcomingNotifications(days: number = 30): Promise<SelectNotification[]> {
    try {
      const db = await this.getDb();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      
      return await db.select().from(notifications)
        .where(
          and(
            lt(notifications.notificationDate, futureDate.toISOString()),
            eq(notifications.sentStatus, 'pending')
          )
        )
        .orderBy(notifications.notificationDate);
    } catch (error) {
      console.error('Error getting upcoming notifications:', error);
      throw new Error(`Failed to get upcoming notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllNotifications(): Promise<SelectNotification[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(notifications).orderBy(notifications.notificationDate);
    } catch (error) {
      console.error('Error getting all notifications:', error);
      throw new Error(`Failed to get notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getNotificationsByType(type: NotificationType): Promise<SelectNotification[]> {
    try {
      // Validate enum value
      const validatedType = validateNotificationType(type);
      
      const db = await this.getDb();
      return await db.select().from(notifications)
        .where(eq(notifications.type, validatedType))
        .orderBy(notifications.notificationDate);
    } catch (error) {
      console.error('Error getting notifications by type:', error);
      throw new Error(`Failed to get notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async markNotificationSent(id: string, sentAt: Date): Promise<SelectNotification> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .update(notifications)
        .set({ 
          sentStatus: 'sent',
          sentAt: sentAt,
          updatedAt: new Date() 
        })
        .where(eq(notifications.id, id))
        .returning();
      
      if (!result) {
        throw new Error('Notification not found');
      }
      return result;
    } catch (error) {
      console.error('Error marking notification sent:', error);
      throw new Error(`Failed to mark notification sent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateNotification(id: string, updates: Partial<InsertNotification>): Promise<SelectNotification> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .update(notifications)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(notifications.id, id))
        .returning();
      
      if (!result) {
        throw new Error('Notification not found');
      }
      return result;
    } catch (error) {
      console.error('Error updating notification:', error);
      throw new Error(`Failed to update notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPendingNotifications(): Promise<SelectNotification[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(notifications)
        .where(eq(notifications.sentStatus, 'pending'))
        .orderBy(notifications.notificationDate);
    } catch (error) {
      console.error('Error getting pending notifications:', error);
      throw new Error(`Failed to get pending notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFailedNotifications(): Promise<SelectNotification[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(notifications)
        .where(eq(notifications.sentStatus, 'failed'))
        .orderBy(notifications.notificationDate);
    } catch (error) {
      console.error('Error getting failed notifications:', error);
      throw new Error(`Failed to get failed notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async markNotificationFailed(id: string, errorMessage: string): Promise<SelectNotification> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .update(notifications)
        .set({ 
          sentStatus: 'failed',
          errorMessage: errorMessage,
          updatedAt: new Date() 
        })
        .where(eq(notifications.id, id))
        .returning();
      
      if (!result) {
        throw new Error('Notification not found');
      }
      return result;
    } catch (error) {
      console.error('Error marking notification failed:', error);
      throw new Error(`Failed to mark notification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async markNotificationRead(id: string): Promise<SelectNotification> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .update(notifications)
        .set({ 
          sentStatus: 'read',
          updatedAt: new Date() 
        })
        .where(eq(notifications.id, id))
        .returning();
      
      if (!result) {
        throw new Error('Notification not found');
      }
      return result;
    } catch (error) {
      console.error('Error marking notification read:', error);
      throw new Error(`Failed to mark notification read: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteOldNotifications(olderThan: Date): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(notifications).where(lt(notifications.createdAt, olderThan));
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      throw new Error(`Failed to delete old notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteNotification(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(notifications).where(eq(notifications.id, id));
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error(`Failed to delete notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Renewal Workflow operations
  async createRenewalWorkflow(workflow: InsertRenewalWorkflow): Promise<SelectRenewalWorkflow> {
    try {
      const db = await this.getDb();
      const [result] = await db.insert(renewalWorkflows).values(workflow).returning();
      if (!result) {
        throw new Error('Failed to create renewal workflow');
      }
      return result;
    } catch (error) {
      console.error('Error creating renewal workflow:', error);
      throw new Error(`Failed to create renewal workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRenewalWorkflow(id: string): Promise<SelectRenewalWorkflow | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(renewalWorkflows).where(eq(renewalWorkflows.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting renewal workflow:', error);
      throw new Error(`Failed to get renewal workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRenewalWorkflowsByPhysician(physicianId: string): Promise<SelectRenewalWorkflow[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(renewalWorkflows)
        .where(eq(renewalWorkflows.physicianId, physicianId))
        .orderBy(renewalWorkflows.createdAt);
    } catch (error) {
      console.error('Error getting renewal workflows by physician:', error);
      throw new Error(`Failed to get renewal workflows: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRenewalWorkflowsByEntity(entityType: string, entityId: string): Promise<SelectRenewalWorkflow[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(renewalWorkflows)
        .where(and(
          eq(renewalWorkflows.entityType, entityType as 'license' | 'dea' | 'csr'),
          eq(renewalWorkflows.entityId, entityId)
        ))
        .orderBy(renewalWorkflows.createdAt);
    } catch (error) {
      console.error('Error getting renewal workflows by entity:', error);
      throw new Error(`Failed to get renewal workflows: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getActiveRenewalWorkflows(): Promise<SelectRenewalWorkflow[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(renewalWorkflows)
        .where(or(
          eq(renewalWorkflows.renewalStatus, 'in_progress'),
          eq(renewalWorkflows.renewalStatus, 'filed'),
          eq(renewalWorkflows.renewalStatus, 'under_review')
        ))
        .orderBy(renewalWorkflows.nextActionDueDate);
    } catch (error) {
      console.error('Error getting active renewal workflows:', error);
      throw new Error(`Failed to get active renewal workflows: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getUpcomingRenewals(days: number): Promise<SelectRenewalWorkflow[]> {
    try {
      const db = await this.getDb();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      
      return await db.select().from(renewalWorkflows)
        .where(and(
          lt(renewalWorkflows.nextActionDueDate, futureDate.toISOString()),
          or(
            eq(renewalWorkflows.renewalStatus, 'not_started'),
            eq(renewalWorkflows.renewalStatus, 'in_progress')
          )
        ))
        .orderBy(renewalWorkflows.nextActionDueDate);
    } catch (error) {
      console.error('Error getting upcoming renewals:', error);
      throw new Error(`Failed to get upcoming renewals: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateRenewalWorkflow(id: string, updates: Partial<InsertRenewalWorkflow>): Promise<SelectRenewalWorkflow> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .update(renewalWorkflows)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(renewalWorkflows.id, id))
        .returning();
      if (!result) {
        throw new Error('Renewal workflow not found');
      }
      return result;
    } catch (error) {
      console.error('Error updating renewal workflow:', error);
      throw new Error(`Failed to update renewal workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateRenewalStatus(id: string, status: RenewalStatus): Promise<SelectRenewalWorkflow> {
    try {
      // Validate enum value
      const validatedStatus = validateRenewalStatus(status);
      
      const db = await this.getDb();
      const statusDate: any = {};
      
      // Set appropriate date based on status
      switch(validatedStatus) {
        case 'filed':
          statusDate.filedDate = new Date();
          break;
        case 'approved':
          statusDate.approvalDate = new Date();
          break;
        case 'rejected':
          statusDate.rejectionDate = new Date();
          break;
        case 'in_progress':
          statusDate.applicationDate = new Date();
          break;
      }
      
      const [result] = await db
        .update(renewalWorkflows)
        .set({ 
          renewalStatus: validatedStatus, 
          ...statusDate,
          updatedAt: new Date() 
        })
        .where(eq(renewalWorkflows.id, id))
        .returning();
      if (!result) {
        throw new Error('Renewal workflow not found');
      }
      return result;
    } catch (error) {
      console.error('Error updating renewal status:', error);
      throw new Error(`Failed to update renewal status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateRenewalProgress(id: string, progress: number, checklist?: any): Promise<SelectRenewalWorkflow> {
    try {
      const db = await this.getDb();
      const updates: any = {
        progressPercentage: progress,
        updatedAt: new Date()
      };
      
      if (checklist !== undefined) {
        updates.checklist = checklist;
      }
      
      const [result] = await db
        .update(renewalWorkflows)
        .set(updates)
        .where(eq(renewalWorkflows.id, id))
        .returning();
      if (!result) {
        throw new Error('Renewal workflow not found');
      }
      return result;
    } catch (error) {
      console.error('Error updating renewal progress:', error);
      throw new Error(`Failed to update renewal progress: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteRenewalWorkflow(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(renewalWorkflows).where(eq(renewalWorkflows.id, id));
    } catch (error) {
      console.error('Error deleting renewal workflow:', error);
      throw new Error(`Failed to delete renewal workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Payer operations
  async createPayer(payer: InsertPayer): Promise<SelectPayer> {
    try {
      const db = await this.getDb();
      const [result] = await db.insert(payers).values(payer).returning();
      if (!result) {
        throw new Error('Failed to create payer');
      }
      return result;
    } catch (error) {
      console.error('Error creating payer:', error);
      throw new Error(`Failed to create payer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayer(id: string): Promise<SelectPayer | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(payers).where(eq(payers.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting payer:', error);
      throw new Error(`Failed to get payer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayerByName(name: string): Promise<SelectPayer | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(payers).where(eq(payers.name, name));
      return result || null;
    } catch (error) {
      console.error('Error getting payer by name:', error);
      throw new Error(`Failed to get payer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updatePayer(id: string, updates: Partial<InsertPayer>): Promise<SelectPayer> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .update(payers)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(payers.id, id))
        .returning();
      
      if (!result) {
        throw new Error('Payer not found');
      }
      return result;
    } catch (error) {
      console.error('Error updating payer:', error);
      throw new Error(`Failed to update payer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deletePayer(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(payers).where(eq(payers.id, id));
    } catch (error) {
      console.error('Error deleting payer:', error);
      throw new Error(`Failed to delete payer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllPayers(): Promise<SelectPayer[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(payers).where(eq(payers.isActive, true));
    } catch (error) {
      console.error('Error getting all payers:', error);
      throw new Error(`Failed to get payers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchPayers(query: string): Promise<SelectPayer[]> {
    try {
      const db = await this.getDb();
      return await db
        .select()
        .from(payers)
        .where(
          and(
            eq(payers.isActive, true),
            ilike(payers.name, `%${query}%`)
          )
        );
    } catch (error) {
      console.error('Error searching payers:', error);
      throw new Error(`Failed to search payers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Practice Location operations
  async createPracticeLocation(location: InsertPracticeLocation): Promise<SelectPracticeLocation> {
    try {
      const db = await this.getDb();
      const [result] = await db.insert(practiceLocations).values(location).returning();
      if (!result) {
        throw new Error('Failed to create practice location');
      }
      return result;
    } catch (error) {
      console.error('Error creating practice location:', error);
      throw new Error(`Failed to create practice location: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPracticeLocation(id: string): Promise<SelectPracticeLocation | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(practiceLocations).where(eq(practiceLocations.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting practice location:', error);
      throw new Error(`Failed to get practice location: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPracticeLocationsByPractice(practiceId: string): Promise<SelectPracticeLocation[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(practiceLocations).where(
        and(
          eq(practiceLocations.practiceId, practiceId),
          eq(practiceLocations.isActive, true)
        )
      );
    } catch (error) {
      console.error('Error getting practice locations by practice:', error);
      throw new Error(`Failed to get practice locations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updatePracticeLocation(id: string, updates: Partial<InsertPracticeLocation>): Promise<SelectPracticeLocation> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .update(practiceLocations)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(practiceLocations.id, id))
        .returning();
      
      if (!result) {
        throw new Error('Practice location not found');
      }
      return result;
    } catch (error) {
      console.error('Error updating practice location:', error);
      throw new Error(`Failed to update practice location: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deletePracticeLocation(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(practiceLocations).where(eq(practiceLocations.id, id));
    } catch (error) {
      console.error('Error deleting practice location:', error);
      throw new Error(`Failed to delete practice location: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllPracticeLocations(): Promise<SelectPracticeLocation[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(practiceLocations).where(eq(practiceLocations.isActive, true));
    } catch (error) {
      console.error('Error getting all practice locations:', error);
      throw new Error(`Failed to get practice locations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Provider Banking operations
  async createProviderBanking(banking: InsertProviderBanking): Promise<SelectProviderBanking> {
    try {
      const db = await this.getDb();
      
      // Encrypt sensitive fields before storage using enhanced encryption
      const encryptedBanking = {
        ...banking,
        routingNumber: banking.routingNumber ? encrypt(banking.routingNumber, { dataType: 'banking' }) : banking.routingNumber,
        accountNumber: banking.accountNumber ? encrypt(banking.accountNumber, { dataType: 'banking' }) : banking.accountNumber
      };
      
      const [result] = await db.insert(providerBanking).values(encryptedBanking).returning();
      if (!result) {
        throw new Error('Failed to create provider banking');
      }
      
      // Return redacted data by default for security
      return redactBankingData(result);
    } catch (error) {
      console.error('Error creating provider banking:', error);
      throw new Error(`Failed to create provider banking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // SECURE DEFAULT: Returns redacted banking data
  async getProviderBanking(id: string): Promise<SelectProviderBanking | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(providerBanking).where(eq(providerBanking.id, id));
      if (!result) return null;
      
      // Return redacted version for secure display (default behavior)
      return redactBankingData(result);
    } catch (error) {
      console.error('Error getting provider banking (redacted):', error);
      throw new Error(`Failed to get provider banking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // PRIVILEGED ACCESS: Returns decrypted banking data with role validation
  async getProviderBankingDecrypted(id: string, userId: string, role: string): Promise<SelectProviderBanking | null> {
    try {
      // Validate privileged access
      validatePrivilegedAccess(userId, role, 'getProviderBankingDecrypted');
      
      const db = await this.getDb();
      const [result] = await db.select().from(providerBanking).where(eq(providerBanking.id, id));
      if (!result) return null;
      
      // Decrypt sensitive fields for privileged access
      return decryptBankingData(result, { userId, role, autoMigrate: true });
    } catch (error) {
      console.error('Error getting provider banking (decrypted):', error);
      throw new Error(`Failed to get provider banking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // SECURE DEFAULT: Returns redacted banking data by physician
  async getProviderBankingByPhysician(physicianId: string): Promise<SelectProviderBanking | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(providerBanking).where(
        and(
          eq(providerBanking.physicianId, physicianId),
          eq(providerBanking.isActive, true)
        )
      );
      if (!result) return null;
      
      // Return redacted version for secure display (default behavior)
      return redactBankingData(result);
    } catch (error) {
      console.error('Error getting provider banking by physician (redacted):', error);
      throw new Error(`Failed to get provider banking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // PRIVILEGED ACCESS: Returns decrypted banking data by physician with role validation
  async getProviderBankingByPhysicianDecrypted(physicianId: string, userId: string, role: string): Promise<SelectProviderBanking | null> {
    try {
      // Validate privileged access
      validatePrivilegedAccess(userId, role, 'getProviderBankingByPhysicianDecrypted');
      
      const db = await this.getDb();
      const [result] = await db.select().from(providerBanking).where(
        and(
          eq(providerBanking.physicianId, physicianId),
          eq(providerBanking.isActive, true)
        )
      );
      if (!result) return null;
      
      // Decrypt sensitive fields for privileged access
      return decryptBankingData(result, { userId, role, autoMigrate: true });
    } catch (error) {
      console.error('Error getting provider banking by physician (decrypted):', error);
      throw new Error(`Failed to get provider banking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateProviderBanking(id: string, updates: Partial<InsertProviderBanking>): Promise<SelectProviderBanking> {
    try {
      const db = await this.getDb();
      
      // Encrypt sensitive fields if they're being updated using enhanced encryption
      const encryptedUpdates = {
        ...updates,
        updatedAt: new Date()
      };
      
      if (updates.routingNumber !== undefined) {
        encryptedUpdates.routingNumber = updates.routingNumber ? encrypt(updates.routingNumber, { dataType: 'banking' }) : updates.routingNumber;
      }
      if (updates.accountNumber !== undefined) {
        encryptedUpdates.accountNumber = updates.accountNumber ? encrypt(updates.accountNumber, { dataType: 'banking' }) : updates.accountNumber;
      }
      
      const [result] = await db
        .update(providerBanking)
        .set(encryptedUpdates)
        .where(eq(providerBanking.id, id))
        .returning();
      
      if (!result) {
        throw new Error('Provider banking not found');
      }
      
      // Return redacted data by default for security
      return redactBankingData(result);
    } catch (error) {
      console.error('Error updating provider banking:', error);
      throw new Error(`Failed to update provider banking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }



  async deleteProviderBanking(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(providerBanking).where(eq(providerBanking.id, id));
    } catch (error) {
      console.error('Error deleting provider banking:', error);
      throw new Error(`Failed to delete provider banking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Helper method to decrypt sensitive banking data fields
   */
  private decryptBankingData(banking: SelectProviderBanking): SelectProviderBanking {
    try {
      return {
        ...banking,
        routingNumber: banking.routingNumber ? decrypt(banking.routingNumber) : banking.routingNumber,
        accountNumber: banking.accountNumber ? decrypt(banking.accountNumber) : banking.accountNumber
      };
    } catch (error) {
      console.error('Error decrypting banking data - data may be corrupted or using old encryption:', error);
      // For backward compatibility, if decryption fails, return original data
      // In production, you might want to handle this differently
      return banking;
    }
  }

  // Professional Reference operations
  async createProfessionalReference(reference: InsertProfessionalReference): Promise<SelectProfessionalReference> {
    try {
      const db = await this.getDb();
      const [result] = await db.insert(professionalReferences).values(reference).returning();
      if (!result) {
        throw new Error('Failed to create professional reference');
      }
      return result;
    } catch (error) {
      console.error('Error creating professional reference:', error);
      throw new Error(`Failed to create professional reference: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProfessionalReference(id: string): Promise<SelectProfessionalReference | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(professionalReferences).where(eq(professionalReferences.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting professional reference:', error);
      throw new Error(`Failed to get professional reference: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProfessionalReferencesByPhysician(physicianId: string): Promise<SelectProfessionalReference[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(professionalReferences).where(eq(professionalReferences.physicianId, physicianId));
    } catch (error) {
      console.error('Error getting professional references by physician:', error);
      throw new Error(`Failed to get professional references: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateProfessionalReference(id: string, updates: Partial<InsertProfessionalReference>): Promise<SelectProfessionalReference> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .update(professionalReferences)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(professionalReferences.id, id))
        .returning();
      
      if (!result) {
        throw new Error('Professional reference not found');
      }
      return result;
    } catch (error) {
      console.error('Error updating professional reference:', error);
      throw new Error(`Failed to update professional reference: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteProfessionalReference(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(professionalReferences).where(eq(professionalReferences.id, id));
    } catch (error) {
      console.error('Error deleting professional reference:', error);
      throw new Error(`Failed to delete professional reference: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllProfessionalReferences(): Promise<SelectProfessionalReference[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(professionalReferences);
    } catch (error) {
      console.error('Error getting all professional references:', error);
      throw new Error(`Failed to get professional references: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllProfessionalReferencesPaginated(pagination: PaginationQuery, filters?: SearchFilter[]): Promise<SelectProfessionalReference[]> {
    try {
      const db = await this.getDb();
      let query = db.select().from(professionalReferences);
      
      if (filters && filters.length > 0) {
        const conditions = filters.map(filter => this.buildFilterCondition(filter, professionalReferences));
        query = query.where(and(...conditions));
      }
      
      return await query
        .limit(pagination.limit)
        .offset(pagination.offset);
    } catch (error) {
      console.error('Error getting paginated professional references:', error);
      throw new Error(`Failed to get professional references: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllProfessionalReferencesCount(filters?: SearchFilter[]): Promise<number> {
    try {
      const db = await this.getDb();
      let query = db.select({ count: count() }).from(professionalReferences);
      
      if (filters && filters.length > 0) {
        const conditions = filters.map(filter => this.buildFilterCondition(filter, professionalReferences));
        query = query.where(and(...conditions));
      }
      
      const [result] = await query;
      return result.count;
    } catch (error) {
      console.error('Error getting professional references count:', error);
      throw new Error(`Failed to get professional references count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Payer Enrollment operations
  async createPayerEnrollment(enrollment: InsertPayerEnrollment): Promise<SelectPayerEnrollment> {
    try {
      const db = await this.getDb();
      const [result] = await db.insert(payerEnrollments).values(enrollment).returning();
      if (!result) {
        throw new Error('Failed to create payer enrollment');
      }
      return result;
    } catch (error) {
      console.error('Error creating payer enrollment:', error);
      throw new Error(`Failed to create payer enrollment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayerEnrollment(id: string): Promise<SelectPayerEnrollment | null> {
    try {
      const db = await this.getDb();
      const [result] = await db.select().from(payerEnrollments).where(eq(payerEnrollments.id, id));
      return result || null;
    } catch (error) {
      console.error('Error getting payer enrollment:', error);
      throw new Error(`Failed to get payer enrollment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayerEnrollmentsByPhysician(physicianId: string): Promise<SelectPayerEnrollment[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(payerEnrollments).where(eq(payerEnrollments.physicianId, physicianId));
    } catch (error) {
      console.error('Error getting payer enrollments by physician:', error);
      throw new Error(`Failed to get payer enrollments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayerEnrollmentsByPayer(payerId: string): Promise<SelectPayerEnrollment[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(payerEnrollments).where(eq(payerEnrollments.payerId, payerId));
    } catch (error) {
      console.error('Error getting payer enrollments by payer:', error);
      throw new Error(`Failed to get payer enrollments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayerEnrollmentsByLocation(locationId: string): Promise<SelectPayerEnrollment[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(payerEnrollments).where(eq(payerEnrollments.practiceLocationId, locationId));
    } catch (error) {
      console.error('Error getting payer enrollments by location:', error);
      throw new Error(`Failed to get payer enrollments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayerEnrollmentsByStatus(status: EnrollmentStatus): Promise<SelectPayerEnrollment[]> {
    try {
      // Validate enum value
      const validatedStatus = validateEnrollmentStatus(status);
      
      const db = await this.getDb();
      return await db.select().from(payerEnrollments).where(eq(payerEnrollments.enrollmentStatus, validatedStatus));
    } catch (error) {
      console.error('Error getting payer enrollments by status:', error);
      throw new Error(`Failed to get payer enrollments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getExpiringEnrollments(days: number): Promise<SelectPayerEnrollment[]> {
    try {
      const db = await this.getDb();
      return await db
        .select()
        .from(payerEnrollments)
        .where(
          and(
            sql`${payerEnrollments.revalidationDate} <= CURRENT_DATE + INTERVAL '${days} days'`,
            sql`${payerEnrollments.revalidationDate} IS NOT NULL`
          )
        );
    } catch (error) {
      console.error('Error getting expiring enrollments:', error);
      throw new Error(`Failed to get expiring enrollments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updatePayerEnrollment(id: string, updates: Partial<InsertPayerEnrollment>): Promise<SelectPayerEnrollment> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .update(payerEnrollments)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(payerEnrollments.id, id))
        .returning();
      
      if (!result) {
        throw new Error('Payer enrollment not found');
      }
      return result;
    } catch (error) {
      console.error('Error updating payer enrollment:', error);
      throw new Error(`Failed to update payer enrollment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateEnrollmentStatus(id: string, status: EnrollmentStatus): Promise<SelectPayerEnrollment> {
    try {
      // Validate enum value
      const validatedStatus = validateEnrollmentStatus(status);
      
      const db = await this.getDb();
      const [result] = await db
        .update(payerEnrollments)
        .set({ 
          enrollmentStatus: validatedStatus,
          updatedAt: new Date() 
        })
        .where(eq(payerEnrollments.id, id))
        .returning();
      
      if (!result) {
        throw new Error('Payer enrollment not found');
      }
      return result;
    } catch (error) {
      console.error('Error updating enrollment status:', error);
      throw new Error(`Failed to update enrollment status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateEnrollmentProgress(id: string, progress: number): Promise<SelectPayerEnrollment> {
    try {
      const db = await this.getDb();
      const [result] = await db
        .update(payerEnrollments)
        .set({ 
          progressPercentage: progress,
          updatedAt: new Date() 
        })
        .where(eq(payerEnrollments.id, id))
        .returning();
      
      if (!result) {
        throw new Error('Payer enrollment not found');
      }
      return result;
    } catch (error) {
      console.error('Error updating enrollment progress:', error);
      throw new Error(`Failed to update enrollment progress: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deletePayerEnrollment(id: string): Promise<void> {
    try {
      const db = await this.getDb();
      await db.delete(payerEnrollments).where(eq(payerEnrollments.id, id));
    } catch (error) {
      console.error('Error deleting payer enrollment:', error);
      throw new Error(`Failed to delete payer enrollment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllPayerEnrollments(): Promise<SelectPayerEnrollment[]> {
    try {
      const db = await this.getDb();
      return await db.select().from(payerEnrollments).orderBy(desc(payerEnrollments.createdAt));
    } catch (error) {
      console.error('Error getting all payer enrollments:', error);
      throw new Error(`Failed to get payer enrollments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Paginated payer enrollment methods
  async getAllPayerEnrollmentsPaginated(pagination: PaginationQuery, filters: SearchFilter[] = []): Promise<SelectPayerEnrollment[]> {
    try {
      const db = await this.getDb();
      let query = db.select().from(payerEnrollments);
      
      // Apply filters if provided
      if (filters.length > 0) {
        // Apply basic search filter logic
        const searchConditions = filters.map(filter => {
          switch (filter.operator) {
            case 'eq':
              return eq((payerEnrollments as any)[filter.field], filter.value);
            case 'like':
              return like((payerEnrollments as any)[filter.field], `%${filter.value}%`);
            case 'ilike':
              return ilike((payerEnrollments as any)[filter.field], `%${filter.value}%`);
            default:
              return eq((payerEnrollments as any)[filter.field], filter.value);
          }
        });
        query = query.where(and(...searchConditions));
      }
      
      // Apply sorting
      if (pagination.sort) {
        const orderDirection = pagination.order === 'asc' ? asc : desc;
        query = query.orderBy(orderDirection((payerEnrollments as any)[pagination.sort]));
      } else {
        query = query.orderBy(desc(payerEnrollments.createdAt));
      }
      
      // Apply pagination
      return await query.limit(pagination.limit).offset(pagination.offset!);
    } catch (error) {
      console.error('Error getting paginated payer enrollments:', error);
      throw new Error(`Failed to get paginated payer enrollments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllPayerEnrollmentsCount(filters: SearchFilter[] = []): Promise<number> {
    try {
      const db = await this.getDb();
      let query = db.select({ count: count() }).from(payerEnrollments);
      
      // Apply filters if provided
      if (filters.length > 0) {
        const searchConditions = filters.map(filter => {
          switch (filter.operator) {
            case 'eq':
              return eq((payerEnrollments as any)[filter.field], filter.value);
            case 'like':
              return like((payerEnrollments as any)[filter.field], `%${filter.value}%`);
            case 'ilike':
              return ilike((payerEnrollments as any)[filter.field], `%${filter.value}%`);
            default:
              return eq((payerEnrollments as any)[filter.field], filter.value);
          }
        });
        query = query.where(and(...searchConditions));
      }
      
      const result = await query;
      return result[0].count;
    } catch (error) {
      console.error('Error getting payer enrollments count:', error);
      throw new Error(`Failed to get payer enrollments count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayerEnrollmentsByPhysicianPaginated(physicianId: string, pagination: PaginationQuery): Promise<SelectPayerEnrollment[]> {
    try {
      const db = await this.getDb();
      let query = db.select().from(payerEnrollments).where(eq(payerEnrollments.physicianId, physicianId));
      
      // Apply sorting
      if (pagination.sort) {
        const orderDirection = pagination.order === 'asc' ? asc : desc;
        query = query.orderBy(orderDirection((payerEnrollments as any)[pagination.sort]));
      } else {
        query = query.orderBy(desc(payerEnrollments.createdAt));
      }
      
      return await query.limit(pagination.limit).offset(pagination.offset!);
    } catch (error) {
      console.error('Error getting paginated payer enrollments by physician:', error);
      throw new Error(`Failed to get paginated payer enrollments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayerEnrollmentsByPhysicianCount(physicianId: string): Promise<number> {
    try {
      const db = await this.getDb();
      const result = await db.select({ count: count() }).from(payerEnrollments).where(eq(payerEnrollments.physicianId, physicianId));
      return result[0].count;
    } catch (error) {
      console.error('Error getting payer enrollments count by physician:', error);
      throw new Error(`Failed to get payer enrollments count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayerEnrollmentsByPayerPaginated(payerId: string, pagination: PaginationQuery): Promise<SelectPayerEnrollment[]> {
    try {
      const db = await this.getDb();
      let query = db.select().from(payerEnrollments).where(eq(payerEnrollments.payerId, payerId));
      
      if (pagination.sort) {
        const orderDirection = pagination.order === 'asc' ? asc : desc;
        query = query.orderBy(orderDirection((payerEnrollments as any)[pagination.sort]));
      } else {
        query = query.orderBy(desc(payerEnrollments.createdAt));
      }
      
      return await query.limit(pagination.limit).offset(pagination.offset!);
    } catch (error) {
      console.error('Error getting paginated payer enrollments by payer:', error);
      throw new Error(`Failed to get paginated payer enrollments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayerEnrollmentsByPayerCount(payerId: string): Promise<number> {
    try {
      const db = await this.getDb();
      const result = await db.select({ count: count() }).from(payerEnrollments).where(eq(payerEnrollments.payerId, payerId));
      return result[0].count;
    } catch (error) {
      console.error('Error getting payer enrollments count by payer:', error);
      throw new Error(`Failed to get payer enrollments count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayerEnrollmentsByLocationPaginated(locationId: string, pagination: PaginationQuery): Promise<SelectPayerEnrollment[]> {
    try {
      const db = await this.getDb();
      let query = db.select().from(payerEnrollments).where(eq(payerEnrollments.practiceLocationId, locationId));
      
      if (pagination.sort) {
        const orderDirection = pagination.order === 'asc' ? asc : desc;
        query = query.orderBy(orderDirection((payerEnrollments as any)[pagination.sort]));
      } else {
        query = query.orderBy(desc(payerEnrollments.createdAt));
      }
      
      return await query.limit(pagination.limit).offset(pagination.offset!);
    } catch (error) {
      console.error('Error getting paginated payer enrollments by location:', error);
      throw new Error(`Failed to get paginated payer enrollments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayerEnrollmentsByLocationCount(locationId: string): Promise<number> {
    try {
      const db = await this.getDb();
      const result = await db.select({ count: count() }).from(payerEnrollments).where(eq(payerEnrollments.practiceLocationId, locationId));
      return result[0].count;
    } catch (error) {
      console.error('Error getting payer enrollments count by location:', error);
      throw new Error(`Failed to get payer enrollments count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayerEnrollmentsByStatusPaginated(status: EnrollmentStatus, pagination: PaginationQuery): Promise<SelectPayerEnrollment[]> {
    try {
      const db = await this.getDb();
      let query = db.select().from(payerEnrollments).where(eq(payerEnrollments.enrollmentStatus, status));
      
      if (pagination.sort) {
        const orderDirection = pagination.order === 'asc' ? asc : desc;
        query = query.orderBy(orderDirection((payerEnrollments as any)[pagination.sort]));
      } else {
        query = query.orderBy(desc(payerEnrollments.createdAt));
      }
      
      return await query.limit(pagination.limit).offset(pagination.offset!);
    } catch (error) {
      console.error('Error getting paginated payer enrollments by status:', error);
      throw new Error(`Failed to get paginated payer enrollments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayerEnrollmentsByStatusCount(status: EnrollmentStatus): Promise<number> {
    try {
      const db = await this.getDb();
      const result = await db.select({ count: count() }).from(payerEnrollments).where(eq(payerEnrollments.enrollmentStatus, status));
      return result[0].count;
    } catch (error) {
      console.error('Error getting payer enrollments count by status:', error);
      throw new Error(`Failed to get payer enrollments count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getExpiringEnrollmentsPaginated(days: number, pagination: PaginationQuery): Promise<SelectPayerEnrollment[]> {
    try {
      const db = await this.getDb();
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + days);
      
      let query = db.select().from(payerEnrollments).where(
        and(
          lt(payerEnrollments.revalidationDate!, expirationDate),
          or(
            eq(payerEnrollments.enrollmentStatus, 'active'),
            eq(payerEnrollments.enrollmentStatus, 'approved')
          )
        )
      );
      
      if (pagination.sort) {
        const orderDirection = pagination.order === 'asc' ? asc : desc;
        query = query.orderBy(orderDirection((payerEnrollments as any)[pagination.sort]));
      } else {
        query = query.orderBy(asc(payerEnrollments.revalidationDate));
      }
      
      return await query.limit(pagination.limit).offset(pagination.offset!);
    } catch (error) {
      console.error('Error getting paginated expiring enrollments:', error);
      throw new Error(`Failed to get paginated expiring enrollments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getExpiringEnrollmentsCount(days: number): Promise<number> {
    try {
      const db = await this.getDb();
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + days);
      
      const result = await db.select({ count: count() }).from(payerEnrollments).where(
        and(
          lt(payerEnrollments.revalidationDate!, expirationDate),
          or(
            eq(payerEnrollments.enrollmentStatus, 'active'),
            eq(payerEnrollments.enrollmentStatus, 'approved')
          )
        )
      );
      return result[0].count;
    } catch (error) {
      console.error('Error getting expiring enrollments count:', error);
      throw new Error(`Failed to get expiring enrollments count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Paginated payer methods
  async getAllPayersPaginated(pagination: PaginationQuery, filters: SearchFilter[] = []): Promise<SelectPayer[]> {
    try {
      const db = await this.getDb();
      let query = db.select().from(payers).where(eq(payers.isActive, true));
      
      // Apply filters if provided
      if (filters.length > 0) {
        const searchConditions = filters.map(filter => {
          switch (filter.operator) {
            case 'eq':
              return eq((payers as any)[filter.field], filter.value);
            case 'like':
              return like((payers as any)[filter.field], `%${filter.value}%`);
            case 'ilike':
              return ilike((payers as any)[filter.field], `%${filter.value}%`);
            default:
              return eq((payers as any)[filter.field], filter.value);
          }
        });
        query = query.where(and(eq(payers.isActive, true), ...searchConditions));
      }
      
      // Apply sorting
      if (pagination.sort) {
        const orderDirection = pagination.order === 'asc' ? asc : desc;
        query = query.orderBy(orderDirection((payers as any)[pagination.sort]));
      } else {
        query = query.orderBy(asc(payers.name));
      }
      
      return await query.limit(pagination.limit).offset(pagination.offset!);
    } catch (error) {
      console.error('Error getting paginated payers:', error);
      throw new Error(`Failed to get paginated payers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAllPayersCount(filters: SearchFilter[] = []): Promise<number> {
    try {
      const db = await this.getDb();
      let query = db.select({ count: count() }).from(payers).where(eq(payers.isActive, true));
      
      // Apply filters if provided
      if (filters.length > 0) {
        const searchConditions = filters.map(filter => {
          switch (filter.operator) {
            case 'eq':
              return eq((payers as any)[filter.field], filter.value);
            case 'like':
              return like((payers as any)[filter.field], `%${filter.value}%`);
            case 'ilike':
              return ilike((payers as any)[filter.field], `%${filter.value}%`);
            default:
              return eq((payers as any)[filter.field], filter.value);
          }
        });
        query = query.where(and(eq(payers.isActive, true), ...searchConditions));
      }
      
      const result = await query;
      return result[0].count;
    } catch (error) {
      console.error('Error getting payers count:', error);
      throw new Error(`Failed to get payers count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchPayersPaginated(searchQuery: string, pagination: PaginationQuery): Promise<SelectPayer[]> {
    try {
      const db = await this.getDb();
      let query = db.select().from(payers).where(
        and(
          eq(payers.isActive, true),
          ilike(payers.name, `%${searchQuery}%`)
        )
      );
      
      if (pagination.sort) {
        const orderDirection = pagination.order === 'asc' ? asc : desc;
        query = query.orderBy(orderDirection((payers as any)[pagination.sort]));
      } else {
        query = query.orderBy(asc(payers.name));
      }
      
      return await query.limit(pagination.limit).offset(pagination.offset!);
    } catch (error) {
      console.error('Error searching paginated payers:', error);
      throw new Error(`Failed to search paginated payers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchPayersCount(searchQuery: string): Promise<number> {
    try {
      const db = await this.getDb();
      const result = await db.select({ count: count() }).from(payers).where(
        and(
          eq(payers.isActive, true),
          ilike(payers.name, `%${searchQuery}%`)
        )
      );
      return result[0].count;
    } catch (error) {
      console.error('Error getting search payers count:', error);
      throw new Error(`Failed to get search payers count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayersByLineOfBusinessPaginated(lineOfBusiness: string, pagination: PaginationQuery): Promise<SelectPayer[]> {
    try {
      const db = await this.getDb();
      let query = db.select().from(payers).where(
        and(
          eq(payers.isActive, true),
          sql`${lineOfBusiness} = ANY(${payers.linesOfBusiness})`
        )
      );
      
      if (pagination.sort) {
        const orderDirection = pagination.order === 'asc' ? asc : desc;
        query = query.orderBy(orderDirection((payers as any)[pagination.sort]));
      } else {
        query = query.orderBy(asc(payers.name));
      }
      
      return await query.limit(pagination.limit).offset(pagination.offset!);
    } catch (error) {
      console.error('Error getting paginated payers by line of business:', error);
      throw new Error(`Failed to get paginated payers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayersByLineOfBusinessCount(lineOfBusiness: string): Promise<number> {
    try {
      const db = await this.getDb();
      const result = await db.select({ count: count() }).from(payers).where(
        and(
          eq(payers.isActive, true),
          sql`${lineOfBusiness} = ANY(${payers.linesOfBusiness})`
        )
      );
      return result[0].count;
    } catch (error) {
      console.error('Error getting payers count by line of business:', error);
      throw new Error(`Failed to get payers count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayersByStatusPaginated(isActive: boolean, pagination: PaginationQuery): Promise<SelectPayer[]> {
    try {
      const db = await this.getDb();
      let query = db.select().from(payers).where(eq(payers.isActive, isActive));
      
      if (pagination.sort) {
        const orderDirection = pagination.order === 'asc' ? asc : desc;
        query = query.orderBy(orderDirection((payers as any)[pagination.sort]));
      } else {
        query = query.orderBy(asc(payers.name));
      }
      
      return await query.limit(pagination.limit).offset(pagination.offset!);
    } catch (error) {
      console.error('Error getting paginated payers by status:', error);
      throw new Error(`Failed to get paginated payers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPayersByStatusCount(isActive: boolean): Promise<number> {
    try {
      const db = await this.getDb();
      const result = await db.select({ count: count() }).from(payers).where(eq(payers.isActive, isActive));
      return result[0].count;
    } catch (error) {
      console.error('Error getting payers count by status:', error);
      throw new Error(`Failed to get payers count: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    providerBanking: SelectProviderBanking | null;
    professionalReferences: SelectProfessionalReference[];
    payerEnrollments: SelectPayerEnrollment[];
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
        licenseDocuments,
        providerBanking,
        professionalReferences,
        payerEnrollments
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
        this.getLicenseDocumentsByPhysician(physicianId),
        this.getProviderBanking ? await this.getProviderBanking((await this.getPhysician(physicianId))?.id || '') : null,
        this.getProfessionalReferencesByPhysician(physicianId),
        this.getPayerEnrollmentsByPhysician(physicianId)
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
        licenseDocuments,
        providerBanking,
        professionalReferences,
        payerEnrollments
      };
    } catch (error) {
      console.error('Error getting physician full profile:', error);
      throw new Error(`Failed to get physician full profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export storage instance - use the factory function to create storage
export const storage: IStorage = createStorage();