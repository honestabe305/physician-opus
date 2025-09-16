import { boolean, date, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Enums
export const genderTypeEnum = pgEnum('gender_type', ['male', 'female', 'other', 'prefer_not_to_say']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'staff', 'viewer']);
export const documentTypeEnum = pgEnum('document_type', [
  'drivers_license', 'social_security_card', 'dea_certificate', 'npi_confirmation',
  'w9_form', 'liability_insurance', 'medical_license', 'board_certification',
  'controlled_substance_registration', 'medical_diploma', 'residency_certificate',
  'fellowship_certificate', 'hospital_privilege_letter', 'employment_verification',
  'malpractice_insurance', 'npdb_report', 'cv', 'immunization_records', 'citizenship_proof'
]);

// Tables

// Users table for authentication
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull().default('staff'),
  isActive: boolean('is_active').notNull().default(true),
  failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until', { withTimezone: true }),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  lastPasswordChangeAt: timestamp('last_password_change_at', { withTimezone: true }),
  twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
  twoFactorSecret: text('two_factor_secret'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

// Sessions table for managing user sessions
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionToken: text('session_token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  fullName: text('full_name').notNull(),
  role: userRoleEnum('role').notNull().default('staff'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const userSettings = pgTable('user_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  
  // Application Preferences
  theme: text('theme').default('system'), // 'light', 'dark', 'system'
  language: text('language').default('en'),
  timezone: text('timezone').default('America/New_York'),
  dateFormat: text('date_format').default('MM/dd/yyyy'),
  timeFormat: text('time_format').default('12'), // '12' or '24'
  
  // Notification Settings
  emailNotifications: boolean('email_notifications').default(true),
  desktopNotifications: boolean('desktop_notifications').default(true),
  smsNotifications: boolean('sms_notifications').default(false),
  
  // Data Management Preferences
  defaultPageSize: integer('default_page_size').default(25),
  autoSaveInterval: integer('auto_save_interval').default(300), // seconds
  showArchived: boolean('show_archived').default(false),
  
  // Security Settings
  sessionTimeout: integer('session_timeout').default(3600), // seconds
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  
  // Advanced Settings
  debugMode: boolean('debug_mode').default(false),
  dataRetentionDays: integer('data_retention_days').default(2555), // 7 years
  
  // Custom preferences as JSON
  customPreferences: jsonb('custom_preferences'), // flexible settings storage
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const physicians = pgTable('physicians', {
  id: uuid('id').defaultRandom().primaryKey(),
  fullLegalName: text('full_legal_name').notNull(),
  dateOfBirth: date('date_of_birth'),
  gender: genderTypeEnum('gender'),
  ssn: text('ssn'), // encrypted sensitive data
  npi: text('npi').unique(),
  tin: text('tin'), // encrypted sensitive data
  deaNumber: text('dea_number'),
  caqhId: text('caqh_id'),
  
  // Contact Information
  homeAddress: text('home_address'), // encrypted sensitive data
  mailingAddress: text('mailing_address'),
  phoneNumbers: text('phone_numbers').array(),
  emailAddress: text('email_address'),
  emergencyContact: jsonb('emergency_contact'), // {name, phone, relationship}
  
  // Practice Information
  practiceName: text('practice_name'),
  primaryPracticeAddress: text('primary_practice_address'),
  secondaryPracticeAddresses: text('secondary_practice_addresses').array(),
  officePhone: text('office_phone'),
  officeFax: text('office_fax'),
  officeContactPerson: text('office_contact_person'),
  groupNpi: text('group_npi'),
  groupTaxId: text('group_tax_id'), // encrypted sensitive data
  
  // Insurance & Liability
  malpracticeCarrier: text('malpractice_carrier'),
  malpracticePolicyNumber: text('malpractice_policy_number'),
  coverageLimits: text('coverage_limits'),
  malpracticeExpirationDate: date('malpractice_expiration_date'),
  
  // Status and metadata
  status: text('status').default('active'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const physicianLicenses = pgTable('physician_licenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  physicianId: uuid('physician_id').notNull().references(() => physicians.id, { onDelete: 'cascade' }),
  state: text('state').notNull(),
  licenseNumber: text('license_number').notNull(),
  expirationDate: date('expiration_date').notNull(),
  licenseType: text('license_type').default('medical'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const physicianCertifications = pgTable('physician_certifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  physicianId: uuid('physician_id').notNull().references(() => physicians.id, { onDelete: 'cascade' }),
  specialty: text('specialty').notNull(),
  subspecialty: text('subspecialty'),
  boardName: text('board_name').notNull(),
  certificationDate: date('certification_date'),
  expirationDate: date('expiration_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const physicianEducation = pgTable('physician_education', {
  id: uuid('id').defaultRandom().primaryKey(),
  physicianId: uuid('physician_id').notNull().references(() => physicians.id, { onDelete: 'cascade' }),
  educationType: text('education_type').notNull(), // 'medical_school', 'residency', 'fellowship'
  institutionName: text('institution_name').notNull(),
  specialty: text('specialty'),
  location: text('location'),
  startDate: date('start_date'),
  completionDate: date('completion_date'),
  graduationYear: integer('graduation_year'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const physicianWorkHistory = pgTable('physician_work_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  physicianId: uuid('physician_id').notNull().references(() => physicians.id, { onDelete: 'cascade' }),
  employerName: text('employer_name').notNull(),
  position: text('position'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  address: text('address'),
  supervisorName: text('supervisor_name'),
  reasonForLeaving: text('reason_for_leaving'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const physicianHospitalAffiliations = pgTable('physician_hospital_affiliations', {
  id: uuid('id').defaultRandom().primaryKey(),
  physicianId: uuid('physician_id').notNull().references(() => physicians.id, { onDelete: 'cascade' }),
  hospitalName: text('hospital_name').notNull(),
  privileges: text('privileges').array(),
  startDate: date('start_date'),
  endDate: date('end_date'),
  status: text('status').default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const physicianCompliance = pgTable('physician_compliance', {
  id: uuid('id').defaultRandom().primaryKey(),
  physicianId: uuid('physician_id').notNull().references(() => physicians.id, { onDelete: 'cascade' }),
  licenseRevocations: boolean('license_revocations').default(false),
  licenseRevocationsExplanation: text('license_revocations_explanation'),
  pendingInvestigations: boolean('pending_investigations').default(false),
  pendingInvestigationsExplanation: text('pending_investigations_explanation'),
  malpracticeClaims: boolean('malpractice_claims').default(false),
  malpracticeClaimsExplanation: text('malpractice_claims_explanation'),
  medicareSanctions: boolean('medicare_sanctions').default(false),
  medicareSanctionsExplanation: text('medicare_sanctions_explanation'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const physicianDocuments = pgTable('physician_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  physicianId: uuid('physician_id').notNull().references(() => physicians.id, { onDelete: 'cascade' }),
  documentType: documentTypeEnum('document_type').notNull(),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  isSensitive: boolean('is_sensitive').default(true),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

// Insert Schemas and Types

// User schemas and types
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

// Session schemas and types
export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true
});
export type InsertSession = typeof sessions.$inferInsert;
export type SelectSession = typeof sessions.$inferSelect;

// Profile schemas and types
export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertProfile = typeof profiles.$inferInsert;
export type SelectProfile = typeof profiles.$inferSelect;

export const insertPhysicianSchema = createInsertSchema(physicians).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertPhysician = typeof physicians.$inferInsert;
export type SelectPhysician = typeof physicians.$inferSelect;

export const insertPhysicianLicenseSchema = createInsertSchema(physicianLicenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertPhysicianLicense = typeof physicianLicenses.$inferInsert;
export type SelectPhysicianLicense = typeof physicianLicenses.$inferSelect;

export const insertPhysicianCertificationSchema = createInsertSchema(physicianCertifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertPhysicianCertification = typeof physicianCertifications.$inferInsert;
export type SelectPhysicianCertification = typeof physicianCertifications.$inferSelect;

export const insertPhysicianEducationSchema = createInsertSchema(physicianEducation).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertPhysicianEducation = typeof physicianEducation.$inferInsert;
export type SelectPhysicianEducation = typeof physicianEducation.$inferSelect;

export const insertPhysicianWorkHistorySchema = createInsertSchema(physicianWorkHistory).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertPhysicianWorkHistory = typeof physicianWorkHistory.$inferInsert;
export type SelectPhysicianWorkHistory = typeof physicianWorkHistory.$inferSelect;

export const insertPhysicianHospitalAffiliationSchema = createInsertSchema(physicianHospitalAffiliations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertPhysicianHospitalAffiliation = typeof physicianHospitalAffiliations.$inferInsert;
export type SelectPhysicianHospitalAffiliation = typeof physicianHospitalAffiliations.$inferSelect;

export const insertPhysicianComplianceSchema = createInsertSchema(physicianCompliance).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertPhysicianCompliance = typeof physicianCompliance.$inferInsert;
export type SelectPhysicianCompliance = typeof physicianCompliance.$inferSelect;

export const insertPhysicianDocumentSchema = createInsertSchema(physicianDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertPhysicianDocument = typeof physicianDocuments.$inferInsert;
export type SelectPhysicianDocument = typeof physicianDocuments.$inferSelect;

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertUserSettings = typeof userSettings.$inferInsert;
export type SelectUserSettings = typeof userSettings.$inferSelect;