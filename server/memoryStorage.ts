import type { IStorage } from './storage';
import { encrypt, decrypt, redactBankingData, validatePrivilegedAccess, decryptBankingData, migrateBankingDataEncryption } from './utils/encryption';
import {
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
  type SelectPracticeDocument,
  type InsertPracticeDocument,
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

// Simple in-memory storage implementation
export class MemoryStorage implements IStorage {
  private users: SelectUser[] = [];
  private sessions: SelectSession[] = [];
  private profiles: SelectProfile[] = [];
  private practices: SelectPractice[] = [];
  private physicians: SelectPhysician[] = [];
  private licenses: SelectPhysicianLicense[] = [];
  private certifications: SelectPhysicianCertification[] = [];
  private education: SelectPhysicianEducation[] = [];
  private workHistory: SelectPhysicianWorkHistory[] = [];
  private hospitalAffiliations: SelectPhysicianHospitalAffiliation[] = [];
  private compliance: SelectPhysicianCompliance[] = [];
  private documents: SelectPhysicianDocument[] = [];
  private userSettings: SelectUserSettings[] = [];
  private deaRegistrations: SelectDeaRegistration[] = [];
  private csrLicenses: SelectCsrLicense[] = [];
  private rolePolicies: SelectRolePolicy[] = [];
  private licenseDocuments: SelectLicenseDocument[] = [];
  private notifications: SelectNotification[] = [];
  private renewalWorkflows: SelectRenewalWorkflow[] = [];
  private payers: SelectPayer[] = [];
  private practiceLocations: SelectPracticeLocation[] = [];
  private practiceDocuments: SelectPracticeDocument[] = [];
  private professionalReferences: SelectProfessionalReference[] = [];
  private payerEnrollments: SelectPayerEnrollment[] = [];

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Profile operations
  async createProfile(profile: InsertProfile): Promise<SelectProfile> {
    const newProfile: SelectProfile = {
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...profile,
      role: profile.role ?? 'staff'
    };
    this.profiles.push(newProfile);
    return newProfile;
  }

  async getProfile(userId: string): Promise<SelectProfile | null> {
    return this.profiles.find(p => p.userId === userId) || null;
  }

  async getProfileById(id: string): Promise<SelectProfile | null> {
    return this.profiles.find(p => p.id === id) || null;
  }

  async updateProfile(id: string, updates: Partial<InsertProfile>): Promise<SelectProfile> {
    const index = this.profiles.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Profile not found');
    
    this.profiles[index] = {
      ...this.profiles[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.profiles[index];
  }

  async deleteProfile(id: string): Promise<void> {
    this.profiles = this.profiles.filter(p => p.id !== id);
  }

  async getAllProfiles(): Promise<SelectProfile[]> {
    return [...this.profiles];
  }

  // Physician operations  
  async createPhysician(physician: InsertPhysician): Promise<SelectPhysician> {
    const newPhysician: SelectPhysician = {
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      fullLegalName: physician.fullLegalName,
      dateOfBirth: physician.dateOfBirth ?? null,
      gender: physician.gender ?? null,
      ssn: physician.ssn ?? null,
      npi: physician.npi ?? null,
      tin: physician.tin ?? null,
      deaNumber: physician.deaNumber ?? null,
      caqhId: physician.caqhId ?? null,
      providerRole: physician.providerRole ?? null,
      clinicianType: physician.clinicianType ?? null,
      supervisingPhysicianId: physician.supervisingPhysicianId ?? null,
      collaborationPhysicianId: physician.collaborationPhysicianId ?? null,
      homeAddress: physician.homeAddress ?? null,
      mailingAddress: physician.mailingAddress ?? null,
      phoneNumbers: physician.phoneNumbers ?? null,
      emailAddress: physician.emailAddress ?? null,
      emergencyContact: physician.emergencyContact ?? null,
      practiceId: physician.practiceId ?? null,
      malpracticeCarrier: physician.malpracticeCarrier ?? null,
      malpracticePolicyNumber: physician.malpracticePolicyNumber ?? null,
      coverageLimits: physician.coverageLimits ?? null,
      malpracticeExpirationDate: physician.malpracticeExpirationDate ?? null,
      status: physician.status ?? 'active',
      createdBy: physician.createdBy ?? null
    };
    this.physicians.push(newPhysician);
    return newPhysician;
  }

  async getPhysician(id: string): Promise<SelectPhysician | null> {
    return this.physicians.find(p => p.id === id) || null;
  }

  async getPhysicianByNpi(npi: string): Promise<SelectPhysician | null> {
    return this.physicians.find(p => p.npi === npi) || null;
  }

  async updatePhysician(id: string, updates: Partial<InsertPhysician>): Promise<SelectPhysician> {
    const index = this.physicians.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Physician not found');
    
    this.physicians[index] = {
      ...this.physicians[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.physicians[index];
  }

  async deletePhysician(id: string): Promise<void> {
    this.physicians = this.physicians.filter(p => p.id !== id);
  }

  async getAllPhysicians(): Promise<SelectPhysician[]> {
    return [...this.physicians];
  }

  async searchPhysicians(query: string): Promise<SelectPhysician[]> {
    const lowerQuery = query.toLowerCase();
    return this.physicians.filter(p => 
      p.fullLegalName?.toLowerCase().includes(lowerQuery) ||
      p.npi?.includes(query) ||
      p.emailAddress?.toLowerCase().includes(lowerQuery)
    );
  }

  async getPhysiciansByStatus(status: GenericStatus): Promise<SelectPhysician[]> {
    // Validate enum value
    const validatedStatus = validateGenericStatus(status);
    return this.physicians.filter(p => p.status === validatedStatus);
  }

  // License operations
  async createPhysicianLicense(license: InsertPhysicianLicense): Promise<SelectPhysicianLicense> {
    const newLicense: SelectPhysicianLicense = {
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...license,
      licenseType: license.licenseType ?? null
    };
    this.licenses.push(newLicense);
    return newLicense;
  }

  async getPhysicianLicense(id: string): Promise<SelectPhysicianLicense | null> {
    return this.licenses.find(l => l.id === id) || null;
  }

  async getPhysicianLicenses(physicianId: string): Promise<SelectPhysicianLicense[]> {
    return this.licenses.filter(l => l.physicianId === physicianId);
  }

  async updatePhysicianLicense(id: string, updates: Partial<InsertPhysicianLicense>): Promise<SelectPhysicianLicense> {
    const index = this.licenses.findIndex(l => l.id === id);
    if (index === -1) throw new Error('License not found');
    
    this.licenses[index] = {
      ...this.licenses[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.licenses[index];
  }

  async deletePhysicianLicense(id: string): Promise<void> {
    this.licenses = this.licenses.filter(l => l.id !== id);
  }

  async getExpiringLicenses(days: number): Promise<SelectPhysicianLicense[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const today = new Date();
    
    return this.licenses.filter(l => 
      l.expirationDate && 
      new Date(l.expirationDate) <= futureDate && 
      new Date(l.expirationDate) >= today
    );
  }

  // Certification operations
  async createPhysicianCertification(certification: InsertPhysicianCertification): Promise<SelectPhysicianCertification> {
    const newCert: SelectPhysicianCertification = {
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...certification,
      expirationDate: certification.expirationDate ?? null,
      subspecialty: certification.subspecialty ?? null,
      certificationDate: certification.certificationDate ?? null
    };
    this.certifications.push(newCert);
    return newCert;
  }

  async getPhysicianCertification(id: string): Promise<SelectPhysicianCertification | null> {
    return this.certifications.find(c => c.id === id) || null;
  }

  async getPhysicianCertifications(physicianId: string): Promise<SelectPhysicianCertification[]> {
    return this.certifications.filter(c => c.physicianId === physicianId);
  }

  async updatePhysicianCertification(id: string, updates: Partial<InsertPhysicianCertification>): Promise<SelectPhysicianCertification> {
    const index = this.certifications.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Certification not found');
    
    this.certifications[index] = {
      ...this.certifications[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.certifications[index];
  }

  async deletePhysicianCertification(id: string): Promise<void> {
    this.certifications = this.certifications.filter(c => c.id !== id);
  }

  async getExpiringCertifications(days: number): Promise<SelectPhysicianCertification[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const today = new Date();
    
    return this.certifications.filter(c => 
      c.expirationDate && 
      new Date(c.expirationDate) <= futureDate && 
      new Date(c.expirationDate) >= today
    );
  }

  // Stub implementations for other operations (return empty results)
  async createPhysicianEducation(education: InsertPhysicianEducation): Promise<SelectPhysicianEducation> {
    const newEd: SelectPhysicianEducation = {
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      physicianId: education.physicianId,
      educationType: education.educationType,
      institutionName: education.institutionName,
      specialty: education.specialty ?? null,
      location: education.location ?? null,
      startDate: education.startDate ?? null,
      completionDate: education.completionDate ?? null,
      graduationYear: education.graduationYear ?? null
    };
    this.education.push(newEd);
    return newEd;
  }

  async getPhysicianEducation(id: string): Promise<SelectPhysicianEducation | null> {
    return this.education.find(e => e.id === id) || null;
  }

  async getPhysicianEducations(physicianId: string): Promise<SelectPhysicianEducation[]> {
    return this.education.filter(e => e.physicianId === physicianId);
  }

  async updatePhysicianEducation(id: string, updates: Partial<InsertPhysicianEducation>): Promise<SelectPhysicianEducation> {
    const index = this.education.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Education not found');
    this.education[index] = { ...this.education[index], ...updates, updatedAt: new Date() };
    return this.education[index];
  }

  async deletePhysicianEducation(id: string): Promise<void> {
    this.education = this.education.filter(e => e.id !== id);
  }

  async createPhysicianWorkHistory(workHistory: InsertPhysicianWorkHistory): Promise<SelectPhysicianWorkHistory> {
    const newWork: SelectPhysicianWorkHistory = {
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      physicianId: workHistory.physicianId,
      employerName: workHistory.employerName,
      position: workHistory.position ?? null,
      startDate: workHistory.startDate,
      endDate: workHistory.endDate ?? null,
      address: workHistory.address ?? null,
      supervisorName: workHistory.supervisorName ?? null,
      reasonForLeaving: workHistory.reasonForLeaving ?? null
    };
    this.workHistory.push(newWork);
    return newWork;
  }

  async getPhysicianWorkHistory(id: string): Promise<SelectPhysicianWorkHistory | null> {
    return this.workHistory.find(w => w.id === id) || null;
  }

  async getPhysicianWorkHistories(physicianId: string): Promise<SelectPhysicianWorkHistory[]> {
    return this.workHistory.filter(w => w.physicianId === physicianId);
  }

  async updatePhysicianWorkHistory(id: string, updates: Partial<InsertPhysicianWorkHistory>): Promise<SelectPhysicianWorkHistory> {
    const index = this.workHistory.findIndex(w => w.id === id);
    if (index === -1) throw new Error('Work history not found');
    this.workHistory[index] = { ...this.workHistory[index], ...updates, updatedAt: new Date() };
    return this.workHistory[index];
  }

  async deletePhysicianWorkHistory(id: string): Promise<void> {
    this.workHistory = this.workHistory.filter(w => w.id !== id);
  }

  async createPhysicianHospitalAffiliation(affiliation: InsertPhysicianHospitalAffiliation): Promise<SelectPhysicianHospitalAffiliation> {
    const newAff: SelectPhysicianHospitalAffiliation = {
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      physicianId: affiliation.physicianId,
      hospitalName: affiliation.hospitalName,
      privileges: affiliation.privileges ?? null,
      startDate: affiliation.startDate ?? null,
      endDate: affiliation.endDate ?? null,
      status: affiliation.status ?? 'active'
    };
    this.hospitalAffiliations.push(newAff);
    return newAff;
  }

  async getPhysicianHospitalAffiliation(id: string): Promise<SelectPhysicianHospitalAffiliation | null> {
    return this.hospitalAffiliations.find(a => a.id === id) || null;
  }

  async getPhysicianHospitalAffiliations(physicianId: string): Promise<SelectPhysicianHospitalAffiliation[]> {
    return this.hospitalAffiliations.filter(a => a.physicianId === physicianId);
  }

  async updatePhysicianHospitalAffiliation(id: string, updates: Partial<InsertPhysicianHospitalAffiliation>): Promise<SelectPhysicianHospitalAffiliation> {
    const index = this.hospitalAffiliations.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Affiliation not found');
    this.hospitalAffiliations[index] = { ...this.hospitalAffiliations[index], ...updates, updatedAt: new Date() };
    return this.hospitalAffiliations[index];
  }

  async deletePhysicianHospitalAffiliation(id: string): Promise<void> {
    this.hospitalAffiliations = this.hospitalAffiliations.filter(a => a.id !== id);
  }

  async createPhysicianCompliance(compliance: InsertPhysicianCompliance): Promise<SelectPhysicianCompliance> {
    const newComp: SelectPhysicianCompliance = {
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      physicianId: compliance.physicianId,
      licenseRevocations: compliance.licenseRevocations ?? false,
      licenseRevocationsExplanation: compliance.licenseRevocationsExplanation ?? null,
      pendingInvestigations: compliance.pendingInvestigations ?? false,
      pendingInvestigationsExplanation: compliance.pendingInvestigationsExplanation ?? null,
      malpracticeClaims: compliance.malpracticeClaims ?? false,
      malpracticeClaimsExplanation: compliance.malpracticeClaimsExplanation ?? null,
      medicareSanctions: compliance.medicareSanctions ?? false,
      medicareSanctionsExplanation: compliance.medicareSanctionsExplanation ?? null
    };
    this.compliance.push(newComp);
    return newComp;
  }

  async getPhysicianCompliance(id: string): Promise<SelectPhysicianCompliance | null> {
    return this.compliance.find(c => c.id === id) || null;
  }

  async getPhysicianComplianceByPhysicianId(physicianId: string): Promise<SelectPhysicianCompliance | null> {
    return this.compliance.find(c => c.physicianId === physicianId) || null;
  }

  async updatePhysicianCompliance(id: string, updates: Partial<InsertPhysicianCompliance>): Promise<SelectPhysicianCompliance> {
    const index = this.compliance.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Compliance not found');
    this.compliance[index] = { ...this.compliance[index], ...updates, updatedAt: new Date() };
    return this.compliance[index];
  }

  async deletePhysicianCompliance(id: string): Promise<void> {
    this.compliance = this.compliance.filter(c => c.id !== id);
  }

  async createPhysicianDocument(document: InsertPhysicianDocument): Promise<SelectPhysicianDocument> {
    const newDoc: SelectPhysicianDocument = {
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      physicianId: document.physicianId,
      documentType: document.documentType,
      fileName: document.fileName,
      filePath: document.filePath,
      fileSize: document.fileSize ?? null,
      mimeType: document.mimeType ?? null,
      isSensitive: document.isSensitive ?? true,
      uploadedBy: document.uploadedBy ?? null
    };
    this.documents.push(newDoc);
    return newDoc;
  }

  async getPhysicianDocument(id: string): Promise<SelectPhysicianDocument | null> {
    return this.documents.find(d => d.id === id) || null;
  }

  async getPhysicianDocuments(physicianId: string): Promise<SelectPhysicianDocument[]> {
    return this.documents.filter(d => d.physicianId === physicianId);
  }

  async getPhysicianDocumentsByType(physicianId: string, documentType: string): Promise<SelectPhysicianDocument[]> {
    return this.documents.filter(d => d.physicianId === physicianId && d.documentType === documentType);
  }

  async updatePhysicianDocument(id: string, updates: Partial<InsertPhysicianDocument>): Promise<SelectPhysicianDocument> {
    const index = this.documents.findIndex(d => d.id === id);
    if (index === -1) throw new Error('Document not found');
    this.documents[index] = { ...this.documents[index], ...updates, updatedAt: new Date() };
    return this.documents[index];
  }

  async deletePhysicianDocument(id: string): Promise<void> {
    this.documents = this.documents.filter(d => d.id !== id);
  }

  async createUserSettings(settings: InsertUserSettings): Promise<SelectUserSettings> {
    const newSettings: SelectUserSettings = {
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: settings.userId,
      theme: settings.theme ?? 'system',
      language: settings.language ?? 'en',
      timezone: settings.timezone ?? 'America/New_York',
      dateFormat: settings.dateFormat ?? 'MM/dd/yyyy',
      timeFormat: settings.timeFormat ?? '12',
      emailNotifications: settings.emailNotifications ?? true,
      desktopNotifications: settings.desktopNotifications ?? true,
      smsNotifications: settings.smsNotifications ?? false,
      defaultPageSize: settings.defaultPageSize ?? 25,
      autoSaveInterval: settings.autoSaveInterval ?? 300,
      showArchived: settings.showArchived ?? false,
      sessionTimeout: settings.sessionTimeout ?? 3600,
      twoFactorEnabled: settings.twoFactorEnabled ?? false,
      debugMode: settings.debugMode ?? false,
      dataRetentionDays: settings.dataRetentionDays ?? 2555,
      customPreferences: settings.customPreferences ?? null
    };
    this.userSettings.push(newSettings);
    return newSettings;
  }

  async getUserSettings(userId: string): Promise<SelectUserSettings | null> {
    return this.userSettings.find(s => s.userId === userId) || null;
  }

  async getUserSettingsById(id: string): Promise<SelectUserSettings | null> {
    return this.userSettings.find(s => s.id === id) || null;
  }

  async updateUserSettings(userId: string, updates: Partial<InsertUserSettings>): Promise<SelectUserSettings> {
    const index = this.userSettings.findIndex(s => s.userId === userId);
    if (index === -1) throw new Error('Settings not found');
    this.userSettings[index] = { ...this.userSettings[index], ...updates, updatedAt: new Date() };
    return this.userSettings[index];
  }

  async deleteUserSettings(userId: string): Promise<void> {
    this.userSettings = this.userSettings.filter(s => s.userId !== userId);
  }

  // User authentication operations
  async createUser(user: InsertUser): Promise<SelectUser> {
    const newUser: SelectUser = {
      id: this.generateId(),
      email: user.email,
      username: user.username,
      passwordHash: user.passwordHash,
      role: user.role ?? 'staff',
      isActive: user.isActive ?? true,
      failedLoginAttempts: user.failedLoginAttempts ?? 0,
      lockedUntil: user.lockedUntil ?? null,
      lastLoginAt: user.lastLoginAt ?? null,
      lastPasswordChangeAt: user.lastPasswordChangeAt ?? null,
      twoFactorEnabled: user.twoFactorEnabled ?? false,
      twoFactorSecret: user.twoFactorSecret ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }

  async getUserById(id: string): Promise<SelectUser | null> {
    return this.users.find(u => u.id === id) || null;
  }

  async getUserByEmail(email: string): Promise<SelectUser | null> {
    return this.users.find(u => u.email === email) || null;
  }

  async getUserByUsername(username: string): Promise<SelectUser | null> {
    return this.users.find(u => u.username === username) || null;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<SelectUser> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    
    this.users[index] = {
      ...this.users[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.users[index];
  }

  async deleteUser(id: string): Promise<void> {
    this.users = this.users.filter(u => u.id !== id);
  }

  async getAllUsers(): Promise<SelectUser[]> {
    return [...this.users];
  }

  async updateLoginAttempts(userId: string, attempts: number): Promise<void> {
    const index = this.users.findIndex(u => u.id === userId);
    if (index !== -1) {
      this.users[index].failedLoginAttempts = attempts;
      this.users[index].updatedAt = new Date();
    }
  }

  async lockUserAccount(userId: string, until: Date): Promise<void> {
    const index = this.users.findIndex(u => u.id === userId);
    if (index !== -1) {
      this.users[index].lockedUntil = until;
      this.users[index].updatedAt = new Date();
    }
  }

  async unlockUserAccount(userId: string): Promise<void> {
    const index = this.users.findIndex(u => u.id === userId);
    if (index !== -1) {
      this.users[index].lockedUntil = null;
      this.users[index].failedLoginAttempts = 0;
      this.users[index].updatedAt = new Date();
    }
  }

  async updateLastLoginAt(userId: string): Promise<void> {
    const index = this.users.findIndex(u => u.id === userId);
    if (index !== -1) {
      this.users[index].lastLoginAt = new Date();
      this.users[index].updatedAt = new Date();
    }
  }

  // Session management operations
  async createSession(session: InsertSession): Promise<SelectSession> {
    const newSession: SelectSession = {
      id: this.generateId(),
      userId: session.userId,
      sessionToken: session.sessionToken,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress ?? null,
      userAgent: session.userAgent ?? null,
      createdAt: new Date()
    };
    this.sessions.push(newSession);
    return newSession;
  }

  async getSession(sessionToken: string): Promise<SelectSession | null> {
    return this.sessions.find(s => s.sessionToken === sessionToken) || null;
  }

  async getSessionById(id: string): Promise<SelectSession | null> {
    return this.sessions.find(s => s.id === id) || null;
  }

  async getUserSessions(userId: string): Promise<SelectSession[]> {
    return this.sessions.filter(s => s.userId === userId);
  }

  async deleteSession(sessionToken: string): Promise<void> {
    this.sessions = this.sessions.filter(s => s.sessionToken !== sessionToken);
  }

  async deleteSessionById(id: string): Promise<void> {
    this.sessions = this.sessions.filter(s => s.id !== id);
  }

  async deleteUserSessions(userId: string): Promise<void> {
    this.sessions = this.sessions.filter(s => s.userId !== userId);
  }

  async deleteExpiredSessions(): Promise<void> {
    const now = new Date();
    this.sessions = this.sessions.filter(s => s.expiresAt > now);
  }

  async extendSession(sessionToken: string, newExpiresAt: Date): Promise<SelectSession> {
    const index = this.sessions.findIndex(s => s.sessionToken === sessionToken);
    if (index === -1) throw new Error('Session not found');
    
    this.sessions[index].expiresAt = newExpiresAt;
    return this.sessions[index];
  }

  // DEA Registration operations
  async createDeaRegistration(registration: InsertDeaRegistration): Promise<SelectDeaRegistration> {
    const newRegistration: SelectDeaRegistration = {
      id: this.generateId(),
      physicianId: registration.physicianId,
      state: registration.state,
      deaNumber: registration.deaNumber,
      issueDate: registration.issueDate,
      expireDate: registration.expireDate,
      mateAttested: registration.mateAttested ?? false,
      status: registration.status ?? 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.deaRegistrations.push(newRegistration);
    return newRegistration;
  }

  async getDeaRegistration(id: string): Promise<SelectDeaRegistration | null> {
    return this.deaRegistrations.find(d => d.id === id) || null;
  }

  async getDeaRegistrationsByPhysician(physicianId: string): Promise<SelectDeaRegistration[]> {
    return this.deaRegistrations.filter(d => d.physicianId === physicianId);
  }

  async getDeaRegistrationByState(physicianId: string, state: string): Promise<SelectDeaRegistration | null> {
    return this.deaRegistrations.find(d => d.physicianId === physicianId && d.state === state) || null;
  }

  async updateDeaRegistration(id: string, updates: Partial<InsertDeaRegistration>): Promise<SelectDeaRegistration> {
    const index = this.deaRegistrations.findIndex(d => d.id === id);
    if (index === -1) throw new Error('DEA registration not found');
    
    this.deaRegistrations[index] = {
      ...this.deaRegistrations[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.deaRegistrations[index];
  }

  async deleteDeaRegistration(id: string): Promise<void> {
    this.deaRegistrations = this.deaRegistrations.filter(d => d.id !== id);
  }

  async getExpiringDeaRegistrations(days: number): Promise<SelectDeaRegistration[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const today = new Date();
    
    return this.deaRegistrations.filter(d => {
      const expireDate = new Date(d.expireDate);
      return expireDate <= futureDate && expireDate >= today;
    });
  }

  // CSR License operations
  async createCsrLicense(license: InsertCsrLicense): Promise<SelectCsrLicense> {
    const newLicense: SelectCsrLicense = {
      id: this.generateId(),
      physicianId: license.physicianId,
      state: license.state,
      csrNumber: license.csrNumber,
      issueDate: license.issueDate,
      expireDate: license.expireDate,
      renewalCycle: license.renewalCycle,
      status: license.status ?? 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.csrLicenses.push(newLicense);
    return newLicense;
  }

  async getCsrLicense(id: string): Promise<SelectCsrLicense | null> {
    return this.csrLicenses.find(c => c.id === id) || null;
  }

  async getCsrLicensesByPhysician(physicianId: string): Promise<SelectCsrLicense[]> {
    return this.csrLicenses.filter(c => c.physicianId === physicianId);
  }

  async getCsrLicenseByState(physicianId: string, state: string): Promise<SelectCsrLicense | null> {
    return this.csrLicenses.find(c => c.physicianId === physicianId && c.state === state) || null;
  }

  async updateCsrLicense(id: string, updates: Partial<InsertCsrLicense>): Promise<SelectCsrLicense> {
    const index = this.csrLicenses.findIndex(c => c.id === id);
    if (index === -1) throw new Error('CSR license not found');
    
    this.csrLicenses[index] = {
      ...this.csrLicenses[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.csrLicenses[index];
  }

  async deleteCsrLicense(id: string): Promise<void> {
    this.csrLicenses = this.csrLicenses.filter(c => c.id !== id);
  }

  async getExpiringCsrLicenses(days: number): Promise<SelectCsrLicense[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const today = new Date();
    
    return this.csrLicenses.filter(c => {
      const expireDate = new Date(c.expireDate);
      return expireDate <= futureDate && expireDate >= today;
    });
  }

  // Role Policy operations
  async createRolePolicy(policy: InsertRolePolicy): Promise<SelectRolePolicy> {
    const newPolicy: SelectRolePolicy = {
      id: this.generateId(),
      role: policy.role,
      state: policy.state,
      requiresSupervision: policy.requiresSupervision ?? false,
      requiresCollaboration: policy.requiresCollaboration ?? false,
      boardType: policy.boardType,
      compactEligible: policy.compactEligible ?? false,
      compactType: policy.compactType ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.rolePolicies.push(newPolicy);
    return newPolicy;
  }

  async getRolePolicy(id: string): Promise<SelectRolePolicy | null> {
    return this.rolePolicies.find(r => r.id === id) || null;
  }

  async getRolePolicyByRoleAndState(role: ProviderRole, state: string): Promise<SelectRolePolicy | null> {
    // Validate enum value
    const validatedRole = validateProviderRole(role);
    return this.rolePolicies.find(r => r.role === validatedRole && r.state === state) || null;
  }

  async getAllRolePolicies(): Promise<SelectRolePolicy[]> {
    return [...this.rolePolicies];
  }

  async updateRolePolicy(id: string, updates: Partial<InsertRolePolicy>): Promise<SelectRolePolicy> {
    const index = this.rolePolicies.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Role policy not found');
    
    this.rolePolicies[index] = {
      ...this.rolePolicies[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.rolePolicies[index];
  }

  async deleteRolePolicy(id: string): Promise<void> {
    this.rolePolicies = this.rolePolicies.filter(r => r.id !== id);
  }

  // License Document operations
  async createLicenseDocument(document: InsertLicenseDocument): Promise<SelectLicenseDocument> {
    // If this is marked as current, update all other documents of the same type for this physician
    if (document.isCurrent) {
      this.licenseDocuments.forEach(doc => {
        if (doc.physicianId === document.physicianId && doc.documentType === document.documentType) {
          doc.isCurrent = false;
          doc.updatedAt = new Date();
        }
      });
    }
    
    // Calculate version number
    const existingDocs = this.licenseDocuments.filter(
      doc => doc.physicianId === document.physicianId && doc.documentType === document.documentType
    );
    const maxVersion = existingDocs.reduce((max, doc) => Math.max(max, doc.version || 0), 0);
    
    const newDocument: SelectLicenseDocument = {
      id: this.generateId(),
      physicianId: document.physicianId,
      licenseId: document.licenseId ?? null,
      deaRegistrationId: document.deaRegistrationId ?? null,
      csrLicenseId: document.csrLicenseId ?? null,
      documentType: document.documentType,
      fileName: document.fileName,
      fileUrl: document.fileUrl,
      fileSize: document.fileSize ?? null,
      version: maxVersion + 1,
      uploadedBy: document.uploadedBy ?? null,
      uploadDate: new Date(),
      isCurrent: document.isCurrent ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.licenseDocuments.push(newDocument);
    return newDocument;
  }

  async getLicenseDocument(id: string): Promise<SelectLicenseDocument | null> {
    return this.licenseDocuments.find(d => d.id === id) || null;
  }

  async getLicenseDocumentsByPhysician(physicianId: string): Promise<SelectLicenseDocument[]> {
    return this.licenseDocuments.filter(d => d.physicianId === physicianId);
  }

  async getLicenseDocumentsByType(physicianId: string, documentType: string): Promise<SelectLicenseDocument[]> {
    return this.licenseDocuments.filter(
      d => d.physicianId === physicianId && d.documentType === documentType
    );
  }

  async getCurrentLicenseDocuments(physicianId: string): Promise<SelectLicenseDocument[]> {
    return this.licenseDocuments.filter(
      d => d.physicianId === physicianId && d.isCurrent === true
    );
  }

  async updateLicenseDocument(id: string, updates: Partial<InsertLicenseDocument>): Promise<SelectLicenseDocument> {
    const index = this.licenseDocuments.findIndex(d => d.id === id);
    if (index === -1) throw new Error('License document not found');
    
    // If updating to current, set all other documents of same type to not current
    if (updates.isCurrent) {
      const existingDoc = this.licenseDocuments[index];
      this.licenseDocuments.forEach((doc, i) => {
        if (doc.physicianId === existingDoc.physicianId && 
            doc.documentType === existingDoc.documentType && 
            i !== index) {
          doc.isCurrent = false;
          doc.updatedAt = new Date();
        }
      });
    }
    
    this.licenseDocuments[index] = {
      ...this.licenseDocuments[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.licenseDocuments[index];
  }

  async deleteLicenseDocument(id: string): Promise<void> {
    this.licenseDocuments = this.licenseDocuments.filter(d => d.id !== id);
  }

  async archiveLicenseDocument(id: string): Promise<void> {
    const index = this.licenseDocuments.findIndex(d => d.id === id);
    if (index !== -1) {
      this.licenseDocuments[index].isCurrent = false;
      this.licenseDocuments[index].updatedAt = new Date();
    }
  }

  // Practice operations
  async createPractice(practice: InsertPractice): Promise<SelectPractice> {
    const newPractice: SelectPractice = {
      id: this.generateId(),
      name: practice.name,
      primaryAddress: practice.primaryAddress ?? null,
      secondaryAddresses: practice.secondaryAddresses ?? null,
      phone: practice.phone ?? null,
      fax: practice.fax ?? null,
      contactPerson: practice.contactPerson ?? null,
      email: practice.email ?? null,
      website: practice.website ?? null,
      npi: practice.npi ?? null,
      taxId: practice.taxId ?? null,
      practiceType: practice.practiceType ?? null,
      specialty: practice.specialty ?? null,
      isActive: practice.isActive ?? true,
      createdBy: practice.createdBy ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.practices.push(newPractice);
    return newPractice;
  }

  async getPractice(id: string): Promise<SelectPractice | null> {
    return this.practices.find(p => p.id === id) || null;
  }

  async getPracticeByName(name: string): Promise<SelectPractice | null> {
    return this.practices.find(p => p.name === name) || null;
  }

  async getPracticeByNpi(npi: string): Promise<SelectPractice | null> {
    return this.practices.find(p => p.npi === npi) || null;
  }

  async updatePractice(id: string, updates: Partial<InsertPractice>): Promise<SelectPractice> {
    const index = this.practices.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Practice not found');
    
    this.practices[index] = {
      ...this.practices[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.practices[index];
  }

  async deletePractice(id: string): Promise<void> {
    this.practices = this.practices.filter(p => p.id !== id);
  }

  async getAllPractices(): Promise<SelectPractice[]> {
    return [...this.practices];
  }

  async searchPractices(query: string): Promise<SelectPractice[]> {
    const lowerQuery = query.toLowerCase();
    return this.practices.filter(p => 
      p.name?.toLowerCase().includes(lowerQuery) ||
      p.npi?.includes(query) ||
      p.email?.toLowerCase().includes(lowerQuery)
    );
  }

  async getPhysiciansByPractice(practiceId: string): Promise<SelectPhysician[]> {
    return this.physicians.filter(p => p.practiceId === practiceId);
  }

  // Payer operations
  async createPayer(payer: InsertPayer): Promise<SelectPayer> {
    const newPayer: SelectPayer = {
      id: this.generateId(),
      name: payer.name,
      linesOfBusiness: payer.linesOfBusiness,
      reCredentialingCadence: payer.reCredentialingCadence ?? 36,
      requiredFields: payer.requiredFields ?? null,
      contactInfo: payer.contactInfo ?? null,
      notes: payer.notes ?? null,
      isActive: payer.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.payers.push(newPayer);
    return newPayer;
  }

  async getPayer(id: string): Promise<SelectPayer | null> {
    return this.payers.find(p => p.id === id) || null;
  }

  async getPayerByName(name: string): Promise<SelectPayer | null> {
    return this.payers.find(p => p.name === name) || null;
  }

  async updatePayer(id: string, updates: Partial<InsertPayer>): Promise<SelectPayer> {
    const index = this.payers.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Payer not found');
    
    this.payers[index] = {
      ...this.payers[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.payers[index];
  }

  async deletePayer(id: string): Promise<void> {
    this.payers = this.payers.filter(p => p.id !== id);
  }

  async getAllPayers(): Promise<SelectPayer[]> {
    return [...this.payers];
  }

  async searchPayers(query: string): Promise<SelectPayer[]> {
    const lowerQuery = query.toLowerCase();
    return this.payers.filter(p => 
      p.name?.toLowerCase().includes(lowerQuery) ||
      p.notes?.toLowerCase().includes(lowerQuery)
    );
  }

  // Practice Location operations
  async createPracticeLocation(location: InsertPracticeLocation): Promise<SelectPracticeLocation> {
    const newLocation: SelectPracticeLocation = {
      id: this.generateId(),
      practiceId: location.practiceId,
      locationName: location.locationName,
      streetAddress1: location.streetAddress1,
      streetAddress2: location.streetAddress2 ?? null,
      city: location.city,
      state: location.state,
      zipCode: location.zipCode,
      zip4: location.zip4 ?? null,
      county: location.county ?? null,
      phone: location.phone ?? null,
      fax: location.fax ?? null,
      email: location.email ?? null,
      hoursOfOperation: location.hoursOfOperation ?? null,
      placeType: location.placeType,
      notes: location.notes ?? null,
      isActive: location.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.practiceLocations.push(newLocation);
    return newLocation;
  }

  async getPracticeLocation(id: string): Promise<SelectPracticeLocation | null> {
    return this.practiceLocations.find(l => l.id === id) || null;
  }

  async getPracticeLocationsByPractice(practiceId: string): Promise<SelectPracticeLocation[]> {
    return this.practiceLocations.filter(l => l.practiceId === practiceId);
  }

  async updatePracticeLocation(id: string, updates: Partial<InsertPracticeLocation>): Promise<SelectPracticeLocation> {
    const index = this.practiceLocations.findIndex(l => l.id === id);
    if (index === -1) throw new Error('Practice location not found');
    
    this.practiceLocations[index] = {
      ...this.practiceLocations[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.practiceLocations[index];
  }

  async deletePracticeLocation(id: string): Promise<void> {
    this.practiceLocations = this.practiceLocations.filter(l => l.id !== id);
  }

  async getAllPracticeLocations(): Promise<SelectPracticeLocation[]> {
    return [...this.practiceLocations];
  }

  // Practice Documents operations (for group-level banking documents)
  async createPracticeDocument(document: InsertPracticeDocument): Promise<SelectPracticeDocument> {
    const newDocument: SelectPracticeDocument = {
      id: this.generateId(),
      practiceId: document.practiceId,
      documentType: document.documentType,
      documentName: document.documentName,
      fileName: document.fileName,
      filePath: document.filePath,
      fileSize: document.fileSize ?? null,
      mimeType: document.mimeType ?? null,
      uploadedBy: document.uploadedBy ?? null,
      version: document.version ?? 1,
      isActive: document.isActive ?? true,
      expirationDate: document.expirationDate ?? null,
      notes: document.notes ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.practiceDocuments.push(newDocument);
    return newDocument;
  }

  async getPracticeDocument(id: string): Promise<SelectPracticeDocument | null> {
    return this.practiceDocuments.find(d => d.id === id) || null;
  }

  async getPracticeDocumentsByPractice(practiceId: string): Promise<SelectPracticeDocument[]> {
    return this.practiceDocuments.filter(d => d.practiceId === practiceId && d.isActive);
  }

  async getPracticeDocumentsByType(practiceId: string, documentType: string): Promise<SelectPracticeDocument[]> {
    return this.practiceDocuments.filter(d => 
      d.practiceId === practiceId && 
      d.documentType === documentType && 
      d.isActive
    );
  }

  async getAllPracticeDocuments(): Promise<SelectPracticeDocument[]> {
    return this.practiceDocuments.filter(d => d.isActive);
  }

  async getAllPracticeDocumentsPaginated(pagination: any, filters?: any[]): Promise<SelectPracticeDocument[]> {
    let filtered = this.practiceDocuments.filter(d => d.isActive);
    
    // Apply filters
    if (filters && filters.length > 0) {
      for (const filter of filters) {
        if (filter.field === 'documentName' && filter.value) {
          filtered = filtered.filter(d => d.documentName.toLowerCase().includes(filter.value.toLowerCase()));
        } else if (filter.field === 'documentType' && filter.value) {
          filtered = filtered.filter(d => d.documentType === filter.value);
        } else if (filter.field === 'practiceId' && filter.value) {
          filtered = filtered.filter(d => d.practiceId === filter.value);
        }
      }
    }
    
    // Apply pagination
    const start = pagination.offset || 0;
    const limit = pagination.limit || 25;
    return filtered.slice(start, start + limit);
  }

  async getAllPracticeDocumentsCount(filters?: any[]): Promise<number> {
    let filtered = this.practiceDocuments.filter(d => d.isActive);
    
    // Apply filters
    if (filters && filters.length > 0) {
      for (const filter of filters) {
        if (filter.field === 'documentName' && filter.value) {
          filtered = filtered.filter(d => d.documentName.toLowerCase().includes(filter.value.toLowerCase()));
        } else if (filter.field === 'documentType' && filter.value) {
          filtered = filtered.filter(d => d.documentType === filter.value);
        } else if (filter.field === 'practiceId' && filter.value) {
          filtered = filtered.filter(d => d.practiceId === filter.value);
        }
      }
    }
    
    return filtered.length;
  }

  async updatePracticeDocument(id: string, updates: Partial<InsertPracticeDocument>): Promise<SelectPracticeDocument> {
    const index = this.practiceDocuments.findIndex(d => d.id === id);
    if (index === -1) throw new Error('Practice document not found');
    
    this.practiceDocuments[index] = {
      ...this.practiceDocuments[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.practiceDocuments[index];
  }

  async deletePracticeDocument(id: string): Promise<void> {
    this.practiceDocuments = this.practiceDocuments.filter(d => d.id !== id);
  }

  // Professional Reference operations
  async createProfessionalReference(reference: InsertProfessionalReference): Promise<SelectProfessionalReference> {
    const newReference: SelectProfessionalReference = {
      id: this.generateId(),
      physicianId: reference.physicianId,
      referenceName: reference.referenceName,
      title: reference.title ?? null,
      organization: reference.organization ?? null,
      relationship: reference.relationship ?? null,
      phone: reference.phone,
      email: reference.email,
      yearsKnown: reference.yearsKnown ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.professionalReferences.push(newReference);
    return newReference;
  }

  async getProfessionalReference(id: string): Promise<SelectProfessionalReference | null> {
    return this.professionalReferences.find(r => r.id === id) || null;
  }

  async getProfessionalReferencesByPhysician(physicianId: string): Promise<SelectProfessionalReference[]> {
    return this.professionalReferences.filter(r => r.physicianId === physicianId);
  }

  async updateProfessionalReference(id: string, updates: Partial<InsertProfessionalReference>): Promise<SelectProfessionalReference> {
    const index = this.professionalReferences.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Professional reference not found');
    
    this.professionalReferences[index] = {
      ...this.professionalReferences[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.professionalReferences[index];
  }

  async deleteProfessionalReference(id: string): Promise<void> {
    this.professionalReferences = this.professionalReferences.filter(r => r.id !== id);
  }

  async getAllProfessionalReferences(): Promise<SelectProfessionalReference[]> {
    return [...this.professionalReferences];
  }

  async getAllProfessionalReferencesPaginated(pagination: PaginationQuery, filters?: SearchFilter[]): Promise<SelectProfessionalReference[]> {
    let result = [...this.professionalReferences];
    
    // Simple filtering implementation for memory storage
    if (filters && filters.length > 0) {
      result = result.filter(ref => {
        return filters.every(filter => {
          const value = (ref as any)[filter.field];
          if (value === null || value === undefined) return false;
          const stringValue = String(value).toLowerCase();
          const filterValue = String(filter.value).toLowerCase();
          return stringValue.includes(filterValue);
        });
      });
    }
    
    return result.slice(pagination.offset, pagination.offset + pagination.limit);
  }

  async getAllProfessionalReferencesCount(filters?: SearchFilter[]): Promise<number> {
    if (!filters || filters.length === 0) {
      return this.professionalReferences.length;
    }
    
    // Apply same filtering logic as paginated method
    const filtered = this.professionalReferences.filter(ref => {
      return filters.every(filter => {
        const value = (ref as any)[filter.field];
        if (value === null || value === undefined) return false;
        const stringValue = String(value).toLowerCase();
        const filterValue = String(filter.value).toLowerCase();
        return stringValue.includes(filterValue);
      });
    });
    
    return filtered.length;
  }

  // Payer Enrollment operations
  async createPayerEnrollment(enrollment: InsertPayerEnrollment): Promise<SelectPayerEnrollment> {
    const newEnrollment: SelectPayerEnrollment = {
      id: this.generateId(),
      physicianId: enrollment.physicianId,
      payerId: enrollment.payerId,
      practiceLocationId: enrollment.practiceLocationId,
      linesOfBusiness: enrollment.linesOfBusiness,
      networkName: enrollment.networkName ?? null,
      tinUsed: enrollment.tinUsed ?? null,
      npiUsed: enrollment.npiUsed ?? null,
      enrollmentStatus: enrollment.enrollmentStatus ?? 'discovery',
      providerId: enrollment.providerId ?? null,
      parStatus: enrollment.parStatus ?? 'pending',
      effectiveDate: enrollment.effectiveDate ?? null,
      revalidationDate: enrollment.revalidationDate ?? null,
      reCredentialingDate: enrollment.reCredentialingDate ?? null,
      submittedDate: enrollment.submittedDate ?? null,
      approvedDate: enrollment.approvedDate ?? null,
      stoppedDate: enrollment.stoppedDate ?? null,
      stoppedReason: enrollment.stoppedReason ?? null,
      nextActionRequired: enrollment.nextActionRequired ?? null,
      nextActionDueDate: enrollment.nextActionDueDate ?? null,
      progressPercentage: enrollment.progressPercentage ?? 0,
      approvalLetterUrl: enrollment.approvalLetterUrl ?? null,
      welcomeLetterUrl: enrollment.welcomeLetterUrl ?? null,
      screenshotUrls: enrollment.screenshotUrls ?? null,
      confirmationNumbers: enrollment.confirmationNumbers ?? null,
      contacts: enrollment.contacts ?? null,
      notes: enrollment.notes ?? null,
      timeline: enrollment.timeline ?? null,
      createdBy: enrollment.createdBy ?? null,
      updatedBy: enrollment.updatedBy ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.payerEnrollments.push(newEnrollment);
    return newEnrollment;
  }

  async getPayerEnrollment(id: string): Promise<SelectPayerEnrollment | null> {
    return this.payerEnrollments.find(e => e.id === id) || null;
  }

  async getPayerEnrollmentsByPhysician(physicianId: string): Promise<SelectPayerEnrollment[]> {
    return this.payerEnrollments.filter(e => e.physicianId === physicianId);
  }

  async getPayerEnrollmentsByPayer(payerId: string): Promise<SelectPayerEnrollment[]> {
    return this.payerEnrollments.filter(e => e.payerId === payerId);
  }

  async getPayerEnrollmentsByLocation(locationId: string): Promise<SelectPayerEnrollment[]> {
    return this.payerEnrollments.filter(e => e.practiceLocationId === locationId);
  }

  async getPayerEnrollmentsByStatus(status: EnrollmentStatus): Promise<SelectPayerEnrollment[]> {
    // Validate enum value
    const validatedStatus = validateEnrollmentStatus(status);
    return this.payerEnrollments.filter(e => e.enrollmentStatus === validatedStatus);
  }

  async getExpiringEnrollments(days: number): Promise<SelectPayerEnrollment[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const today = new Date();
    
    return this.payerEnrollments.filter(e => 
      e.reCredentialingDate && 
      new Date(e.reCredentialingDate) <= futureDate && 
      new Date(e.reCredentialingDate) >= today
    );
  }

  async updatePayerEnrollment(id: string, updates: Partial<InsertPayerEnrollment>): Promise<SelectPayerEnrollment> {
    const index = this.payerEnrollments.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Payer enrollment not found');
    
    this.payerEnrollments[index] = {
      ...this.payerEnrollments[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.payerEnrollments[index];
  }

  async updateEnrollmentStatus(id: string, status: EnrollmentStatus): Promise<SelectPayerEnrollment> {
    // Validate enum value
    const validatedStatus = validateEnrollmentStatus(status);
    return this.updatePayerEnrollment(id, { enrollmentStatus: validatedStatus });
  }

  async updateEnrollmentProgress(id: string, progress: number): Promise<SelectPayerEnrollment> {
    return this.updatePayerEnrollment(id, { progressPercentage: progress });
  }

  async deletePayerEnrollment(id: string): Promise<void> {
    this.payerEnrollments = this.payerEnrollments.filter(e => e.id !== id);
  }

  // Notification operations
  async createNotification(notification: InsertNotification): Promise<SelectNotification> {
    const newNotification: SelectNotification = {
      id: this.generateId(),
      physicianId: notification.physicianId,
      type: notification.type,
      entityId: notification.entityId,
      notificationDate: notification.notificationDate,
      daysBeforeExpiry: notification.daysBeforeExpiry,
      severity: notification.severity ?? 'info',
      sentStatus: notification.sentStatus ?? 'pending',
      sentAt: notification.sentAt ?? null,
      errorMessage: notification.errorMessage ?? null,
      providerName: notification.providerName,
      licenseType: notification.licenseType,
      state: notification.state,
      expirationDate: notification.expirationDate,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.notifications.push(newNotification);
    return newNotification;
  }

  async getNotification(id: string): Promise<SelectNotification | null> {
    return this.notifications.find(n => n.id === id) || null;
  }

  async getNotificationsByPhysician(physicianId: string): Promise<SelectNotification[]> {
    return this.notifications.filter(n => n.physicianId === physicianId);
  }

  async getUpcomingNotifications(days: number = 30): Promise<SelectNotification[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const today = new Date();
    
    return this.notifications.filter(n => 
      n.notificationDate && 
      new Date(n.notificationDate) <= futureDate && 
      new Date(n.notificationDate) >= today &&
      n.sentStatus === 'pending'
    );
  }

  async getPendingNotifications(): Promise<SelectNotification[]> {
    return this.notifications.filter(n => n.sentStatus === 'pending');
  }

  async getFailedNotifications(): Promise<SelectNotification[]> {
    return this.notifications.filter(n => n.sentStatus === 'failed');
  }

  async updateNotification(id: string, updates: Partial<InsertNotification>): Promise<SelectNotification> {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index === -1) throw new Error('Notification not found');
    
    this.notifications[index] = {
      ...this.notifications[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.notifications[index];
  }

  async markNotificationSent(id: string, sentAt: Date): Promise<SelectNotification> {
    return this.updateNotification(id, { sentStatus: 'sent', sentAt });
  }

  async markNotificationFailed(id: string, errorMessage: string): Promise<SelectNotification> {
    return this.updateNotification(id, { sentStatus: 'failed', errorMessage });
  }

  async markNotificationRead(id: string): Promise<SelectNotification> {
    return this.updateNotification(id, { sentStatus: 'read' });
  }

  async deleteNotification(id: string): Promise<void> {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  async deleteOldNotifications(olderThan: Date): Promise<void> {
    this.notifications = this.notifications.filter(n => 
      n.createdAt > olderThan
    );
  }

  async getNotificationsByType(type: NotificationType): Promise<SelectNotification[]> {
    // Validate enum value
    const validatedType = validateNotificationType(type);
    return this.notifications.filter(n => n.type === validatedType);
  }

  // Renewal Workflow operations
  async createRenewalWorkflow(workflow: InsertRenewalWorkflow): Promise<SelectRenewalWorkflow> {
    const newWorkflow: SelectRenewalWorkflow = {
      id: this.generateId(),
      physicianId: workflow.physicianId,
      entityType: workflow.entityType,
      entityId: workflow.entityId,
      renewalStatus: workflow.renewalStatus ?? 'not_started',
      applicationDate: workflow.applicationDate ?? null,
      filedDate: workflow.filedDate ?? null,
      approvalDate: workflow.approvalDate ?? null,
      rejectionDate: workflow.rejectionDate ?? null,
      rejectionReason: workflow.rejectionReason ?? null,
      notes: workflow.notes ?? null,
      nextActionRequired: workflow.nextActionRequired ?? null,
      nextActionDueDate: workflow.nextActionDueDate ?? null,
      progressPercentage: workflow.progressPercentage ?? 0,
      checklist: workflow.checklist ?? null,
      createdBy: workflow.createdBy ?? null,
      updatedBy: workflow.updatedBy ?? null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.renewalWorkflows.push(newWorkflow);
    return newWorkflow;
  }

  async getRenewalWorkflow(id: string): Promise<SelectRenewalWorkflow | null> {
    return this.renewalWorkflows.find(w => w.id === id) || null;
  }

  async getRenewalWorkflowsByPhysician(physicianId: string): Promise<SelectRenewalWorkflow[]> {
    return this.renewalWorkflows.filter(w => w.physicianId === physicianId);
  }

  async getRenewalWorkflowsByEntity(entityType: string, entityId: string): Promise<SelectRenewalWorkflow[]> {
    return this.renewalWorkflows.filter(w => 
      w.entityType === entityType && w.entityId === entityId
    );
  }

  async getActiveRenewalWorkflows(): Promise<SelectRenewalWorkflow[]> {
    return this.renewalWorkflows.filter(w => 
      w.renewalStatus !== 'approved' && 
      w.renewalStatus !== 'rejected' && 
      w.renewalStatus !== 'expired'
    );
  }

  async getUpcomingRenewals(days: number): Promise<SelectRenewalWorkflow[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const today = new Date();
    
    return this.renewalWorkflows.filter(w => 
      w.nextActionDueDate && 
      new Date(w.nextActionDueDate) <= futureDate && 
      new Date(w.nextActionDueDate) >= today
    );
  }

  async updateRenewalWorkflow(id: string, updates: Partial<InsertRenewalWorkflow>): Promise<SelectRenewalWorkflow> {
    const index = this.renewalWorkflows.findIndex(w => w.id === id);
    if (index === -1) throw new Error('Renewal workflow not found');
    
    this.renewalWorkflows[index] = {
      ...this.renewalWorkflows[index],
      ...updates,
      updatedAt: new Date()
    };
    return this.renewalWorkflows[index];
  }

  async updateRenewalStatus(id: string, status: RenewalStatus): Promise<SelectRenewalWorkflow> {
    // Validate enum value
    const validatedStatus = validateRenewalStatus(status);
    
    const updates: any = { renewalStatus: validatedStatus };
    
    if (validatedStatus === 'approved') {
      updates.approvalDate = new Date();
      updates.progressPercentage = 100;
    }
    
    return this.updateRenewalWorkflow(id, updates);
  }

  async updateRenewalProgress(id: string, progress: number, checklist?: any): Promise<SelectRenewalWorkflow> {
    const updates: any = { progressPercentage: progress };
    if (checklist !== undefined) {
      updates.checklist = checklist;
    }
    return this.updateRenewalWorkflow(id, updates);
  }

  async deleteRenewalWorkflow(id: string): Promise<void> {
    this.renewalWorkflows = this.renewalWorkflows.filter(w => w.id !== id);
  }

  async getPhysicianFullProfile(physicianId: string) {
    return {
      physician: await this.getPhysician(physicianId),
      licenses: await this.getPhysicianLicenses(physicianId),
      certifications: await this.getPhysicianCertifications(physicianId),
      education: await this.getPhysicianEducations(physicianId),
      workHistory: await this.getPhysicianWorkHistories(physicianId),
      hospitalAffiliations: await this.getPhysicianHospitalAffiliations(physicianId),
      compliance: await this.getPhysicianComplianceByPhysicianId(physicianId),
      documents: await this.getPhysicianDocuments(physicianId),
      deaRegistrations: await this.getDeaRegistrationsByPhysician(physicianId),
      csrLicenses: await this.getCsrLicensesByPhysician(physicianId),
      licenseDocuments: await this.getLicenseDocumentsByPhysician(physicianId),
      professionalReferences: await this.getProfessionalReferencesByPhysician(physicianId),
      payerEnrollments: await this.getPayerEnrollmentsByPhysician(physicianId)
    };
  }
}