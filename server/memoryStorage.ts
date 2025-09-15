import type { IStorage } from './storage';
import {
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

// Simple in-memory storage implementation
export class MemoryStorage implements IStorage {
  private profiles: SelectProfile[] = [];
  private physicians: SelectPhysician[] = [];
  private licenses: SelectPhysicianLicense[] = [];
  private certifications: SelectPhysicianCertification[] = [];
  private education: SelectPhysicianEducation[] = [];
  private workHistory: SelectPhysicianWorkHistory[] = [];
  private hospitalAffiliations: SelectPhysicianHospitalAffiliation[] = [];
  private compliance: SelectPhysicianCompliance[] = [];
  private documents: SelectPhysicianDocument[] = [];
  private userSettings: SelectUserSettings[] = [];

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
      homeAddress: physician.homeAddress ?? null,
      mailingAddress: physician.mailingAddress ?? null,
      phoneNumbers: physician.phoneNumbers ?? null,
      emailAddress: physician.emailAddress ?? null,
      emergencyContact: physician.emergencyContact ?? null,
      practiceName: physician.practiceName ?? null,
      primaryPracticeAddress: physician.primaryPracticeAddress ?? null,
      secondaryPracticeAddresses: physician.secondaryPracticeAddresses ?? null,
      officePhone: physician.officePhone ?? null,
      officeFax: physician.officeFax ?? null,
      officeContactPerson: physician.officeContactPerson ?? null,
      groupNpi: physician.groupNpi ?? null,
      groupTaxId: physician.groupTaxId ?? null,
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
      p.practiceName?.toLowerCase().includes(lowerQuery) ||
      p.emailAddress?.toLowerCase().includes(lowerQuery)
    );
  }

  async getPhysiciansByStatus(status: string): Promise<SelectPhysician[]> {
    return this.physicians.filter(p => p.status === status);
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
    };
  }
}