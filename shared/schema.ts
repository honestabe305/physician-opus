import { boolean, date, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar, check, unique, index } from 'drizzle-orm/pg-core';
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

// New enums for telemed licensing platform
export const licenseStatusEnum = pgEnum('license_status', ['active', 'expired', 'pending_renewal']);
export const renewalCycleEnum = pgEnum('renewal_cycle', ['annual', 'biennial']);
export const providerRoleEnum = pgEnum('provider_role', ['physician', 'pa', 'np']);

// Comprehensive clinician type enum for broader healthcare professional categories
export const clinicianTypeEnum = pgEnum('clinician_type', [
  // Physicians
  'md', 'do',
  // Physician Assistants
  'pa',
  // Nurse Practitioners and Advanced Practice
  'np', 'cnm', 'crna', 'cns',
  // Registered Nurses
  'rn',
  // Licensed Practical/Vocational Nurses  
  'lpn', 'lvn',
  // Nursing Assistants
  'cna', 'na',
  // Medical Assistants
  'ma',
  // Administrative Staff
  'admin_staff', 'receptionist', 'billing_specialist',
  // Clinical Support Staff
  'medical_technician', 'lab_technician', 'radiology_tech',
  // Licensed Healthcare Professionals
  'pharmacist', 'dentist', 'optometrist', 'podiatrist', 'chiropractor',
  // Therapy Professionals
  'physical_therapist', 'occupational_therapist', 'speech_language_pathologist', 'respiratory_therapist',
  // Emergency Medical Services
  'paramedic', 'emt',
  // Specialized Technicians
  'radiation_therapist', 'sonographer',
  // Other Healthcare Professionals
  'dietitian', 'social_worker', 'case_manager',
  // Other/Unspecified
  'other'
]);
export const licenseDocumentTypeEnum = pgEnum('license_document_type', [
  'license', 'dea_cert', 'csr_cert', 'supervision_agreement', 
  'collaboration_agreement', 'cme_cert', 'mate_cert'
]);

// Notification enums
export const notificationTypeEnum = pgEnum('notification_type', ['license', 'dea', 'csr']);
export const notificationStatusEnum = pgEnum('notification_status', ['pending', 'sent', 'failed', 'read']);
export const notificationSeverityEnum = pgEnum('notification_severity', ['info', 'warning', 'critical']);

// Renewal Workflow enums
export const renewalStatusEnum = pgEnum('renewal_status', [
  'not_started', 'in_progress', 'filed', 'under_review', 'approved', 'rejected', 'expired'
]);
export const renewalEntityTypeEnum = pgEnum('renewal_entity_type', ['license', 'dea', 'csr']);

// Payer Enrollment enums
export const enrollmentStatusEnum = pgEnum('enrollment_status', [
  'discovery', 'data_complete', 'submitted', 'payer_processing', 'approved', 'active', 'stopped', 'denied'
]);
export const lineOfBusinessEnum = pgEnum('line_of_business', [
  'hmo', 'ppo', 'epo', 'pos', 'medicare_advantage', 'medicaid', 'commercial', 'workers_comp', 'tricare'
]);
export const parStatusEnum = pgEnum('par_status', ['participating', 'non_participating', 'pending', 'unknown']);
export const placeTypeEnum = pgEnum('place_type', ['clinic', 'hospital', 'telemed_hub', 'urgent_care', 'specialty_center']);

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

// Practices table for normalized practice management
export const practices = pgTable('practices', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  primaryAddress: text('primary_address'),
  secondaryAddresses: text('secondary_addresses').array(),
  phone: text('phone'),
  fax: text('fax'),
  contactPerson: text('contact_person'),
  email: text('email'),
  website: text('website'),
  
  // Business identifiers
  npi: text('npi').unique(),
  taxId: text('tax_id'), // encrypted sensitive data
  
  // Organization details
  practiceType: text('practice_type'), // 'solo', 'group', 'hospital', 'clinic', etc.
  specialty: text('specialty'),
  
  // Status and metadata
  isActive: boolean('is_active').notNull().default(true),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  // CHECK constraints for data integrity
  phoneFormat: check('phone_format', sql`phone IS NULL OR phone ~ '^[\+]?[1-9][\d]{1,14}$'`),
  faxFormat: check('fax_format', sql`fax IS NULL OR fax ~ '^[\+]?[1-9][\d]{1,14}$'`),
  emailFormat: check('email_format', sql`email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'`),
  websiteFormat: check('website_format', sql`website IS NULL OR website ~ '^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$'`),
  npiFormat: check('npi_format', sql`npi IS NULL OR (length(npi) = 10 AND npi ~ '^[0-9]{10}$')`)
}));

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
  
  // Provider Role Information (NEW)
  providerRole: providerRoleEnum('provider_role'),
  clinicianType: clinicianTypeEnum('clinician_type'), // New comprehensive clinician type field
  supervisingPhysicianId: uuid('supervising_physician_id').references(() => physicians.id),
  collaborationPhysicianId: uuid('collaboration_physician_id').references(() => physicians.id),
  
  // Contact Information
  homeAddress: text('home_address'), // encrypted sensitive data
  mailingAddress: text('mailing_address'),
  phoneNumbers: text('phone_numbers').array(),
  emailAddress: text('email_address'),
  emergencyContact: jsonb('emergency_contact'), // {name, phone, relationship}
  
  // Practice Information - normalized relationship
  practiceId: uuid('practice_id').references(() => practices.id),
  
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
}, (table) => ({
  // Performance indexes for common query patterns
  practiceIdIdx: index('idx_physicians_practice_id').on(table.practiceId),
  statusIdx: index('idx_physicians_status').on(table.status),
  providerRoleIdx: index('idx_physicians_provider_role').on(table.providerRole),
  clinicianTypeIdx: index('idx_physicians_clinician_type').on(table.clinicianType),
  createdAtIdx: index('idx_physicians_created_at').on(table.createdAt),
  fullLegalNameIdx: index('idx_physicians_full_legal_name').on(table.fullLegalName),
  practiceStatusIdx: index('idx_physicians_practice_status').on(table.practiceId, table.status)
}));

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

// DEA Registrations table
export const deaRegistrations = pgTable('dea_registrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  physicianId: uuid('physician_id').notNull().references(() => physicians.id, { onDelete: 'cascade' }),
  state: text('state').notNull(),
  deaNumber: text('dea_number').notNull(),
  issueDate: date('issue_date').notNull(),
  expireDate: date('expire_date').notNull(),
  mateAttested: boolean('mate_attested').notNull().default(false),
  status: licenseStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

// CSR Licenses table
export const csrLicenses = pgTable('csr_licenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  physicianId: uuid('physician_id').notNull().references(() => physicians.id, { onDelete: 'cascade' }),
  state: text('state').notNull(),
  csrNumber: text('csr_number').notNull(),
  issueDate: date('issue_date').notNull(),
  expireDate: date('expire_date').notNull(),
  renewalCycle: renewalCycleEnum('renewal_cycle').notNull(),
  status: licenseStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

// Role Policies table
export const rolePolicies = pgTable('role_policies', {
  id: uuid('id').defaultRandom().primaryKey(),
  role: providerRoleEnum('role').notNull(),
  state: text('state').notNull(),
  requiresSupervision: boolean('requires_supervision').notNull().default(false),
  requiresCollaboration: boolean('requires_collaboration').notNull().default(false),
  boardType: text('board_type').notNull(),
  compactEligible: boolean('compact_eligible').notNull().default(false),
  compactType: text('compact_type'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

// License Documents table for enhanced document management
export const licenseDocuments = pgTable('license_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  physicianId: uuid('physician_id').notNull().references(() => physicians.id, { onDelete: 'cascade' }),
  licenseId: uuid('license_id').references(() => physicianLicenses.id, { onDelete: 'cascade' }),
  deaRegistrationId: uuid('dea_registration_id').references(() => deaRegistrations.id, { onDelete: 'cascade' }),
  csrLicenseId: uuid('csr_license_id').references(() => csrLicenses.id, { onDelete: 'cascade' }),
  documentType: licenseDocumentTypeEnum('document_type').notNull(),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileSize: integer('file_size'),
  version: integer('version').notNull().default(1),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  uploadDate: timestamp('upload_date', { withTimezone: true }).notNull().defaultNow(),
  isCurrent: boolean('is_current').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

// Renewal Workflows table for tracking renewal processes
export const renewalWorkflows = pgTable('renewal_workflows', {
  id: uuid('id').defaultRandom().primaryKey(),
  physicianId: uuid('physician_id').notNull().references(() => physicians.id, { onDelete: 'cascade' }),
  entityType: renewalEntityTypeEnum('entity_type').notNull(), // license/dea/csr
  entityId: uuid('entity_id').notNull(), // Reference to the specific license/dea/csr ID
  renewalStatus: renewalStatusEnum('renewal_status').notNull().default('not_started'),
  
  // Important dates
  applicationDate: timestamp('application_date', { withTimezone: true }),
  filedDate: timestamp('filed_date', { withTimezone: true }),
  approvalDate: timestamp('approval_date', { withTimezone: true }),
  rejectionDate: timestamp('rejection_date', { withTimezone: true }),
  
  // Additional fields
  rejectionReason: text('rejection_reason'),
  notes: text('notes'),
  nextActionRequired: text('next_action_required'),
  nextActionDueDate: date('next_action_due_date'),
  progressPercentage: integer('progress_percentage').notNull().default(0),
  checklist: jsonb('checklist'), // JSON object storing task list and completion status
  
  // Audit fields
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

// Notifications table for expiration tracking
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  physicianId: uuid('physician_id').notNull().references(() => physicians.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  entityId: uuid('entity_id').notNull(), // Reference to license/dea/csr ID
  notificationDate: date('notification_date').notNull(),
  daysBeforeExpiry: integer('days_before_expiry').notNull(), // 90/60/30/7/1
  severity: notificationSeverityEnum('severity').notNull().default('info'),
  sentStatus: notificationStatusEnum('sent_status').notNull().default('pending'),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  errorMessage: text('error_message'),
  providerName: text('provider_name').notNull(),
  licenseType: text('license_type').notNull(),
  state: text('state').notNull(),
  expirationDate: date('expiration_date').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

// Payers table for insurance companies
export const payers = pgTable('payers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  linesOfBusiness: lineOfBusinessEnum('lines_of_business').array().notNull(),
  reCredentialingCadence: integer('re_credentialing_cadence').notNull().default(36), // months
  requiredFields: jsonb('required_fields'), // Specific fields required by this payer
  contactInfo: jsonb('contact_info'), // Phone, email, website
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  // CHECK constraints for data integrity
  nameNotEmpty: check('name_not_empty', sql`length(trim(name)) > 0`),
  reCredentialingCadenceValid: check('re_credentialing_cadence_valid', sql`re_credentialing_cadence > 0 AND re_credentialing_cadence <= 120`),
  linesOfBusinessNotEmpty: check('lines_of_business_not_empty', sql`array_length(lines_of_business, 1) > 0`),
  // Note: Business logic should enforce unique active payer names
  // This would require application-level validation due to Drizzle limitations
  
  // Performance indexes for common query patterns
  isActiveIdx: index('idx_payers_is_active').on(table.isActive),
  nameIdx: index('idx_payers_name').on(table.name),
  createdAtIdx: index('idx_payers_created_at').on(table.createdAt),
  activeNameIdx: index('idx_payers_active_name').on(table.isActive, table.name)
}));

// Practice Locations table for enrollment per location
export const practiceLocations = pgTable('practice_locations', {
  id: uuid('id').defaultRandom().primaryKey(),
  practiceId: uuid('practice_id').notNull().references(() => practices.id, { onDelete: 'cascade' }),
  locationName: text('location_name').notNull(),
  
  // Address fields with ZIP+4 and county
  streetAddress1: text('street_address_1').notNull(),
  streetAddress2: text('street_address_2'),
  city: text('city').notNull(),
  state: text('state', { length: 2 }).notNull(),
  zipCode: text('zip_code', { length: 5 }).notNull(),
  zip4: text('zip_4', { length: 4 }), // ZIP+4 extension
  county: text('county'),
  
  // Contact information
  phone: text('phone'),
  fax: text('fax'),
  email: text('email'),
  
  // Operational details
  hoursOfOperation: jsonb('hours_of_operation'), // {monday: "9-5", tuesday: "9-5", etc}
  placeType: placeTypeEnum('place_type').notNull(),
  notes: text('notes'),
  
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  // CHECK constraints for data integrity
  phoneFormat: check('phone_format', sql`phone IS NULL OR phone ~ '^[\+]?[1-9][\d]{1,14}$'`),
  faxFormat: check('fax_format', sql`fax IS NULL OR fax ~ '^[\+]?[1-9][\d]{1,14}$'`),
  emailFormat: check('email_format', sql`email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'`),
  stateFormat: check('state_format', sql`length(state) = 2 AND state ~ '^[A-Z]{2}$'`),
  zipCodeFormat: check('zip_code_format', sql`length(zip_code) = 5 AND zip_code ~ '^[0-9]{5}$'`),
  zip4Format: check('zip4_format', sql`zip_4 IS NULL OR (length(zip_4) = 4 AND zip_4 ~ '^[0-9]{4}$')`),
  locationNameNotEmpty: check('location_name_not_empty', sql`length(trim(location_name)) > 0`),
  cityNotEmpty: check('city_not_empty', sql`length(trim(city)) > 0`),
  streetAddress1NotEmpty: check('street_address_1_not_empty', sql`length(trim(street_address_1)) > 0`),
  
  // Performance indexes for common query patterns
  practiceIdIdx: index('idx_practice_locations_practice_id').on(table.practiceId),
  stateIdx: index('idx_practice_locations_state').on(table.state),
  zipCodeIdx: index('idx_practice_locations_zip_code').on(table.zipCode),
  placeTypeIdx: index('idx_practice_locations_place_type').on(table.placeType),
  isActiveIdx: index('idx_practice_locations_is_active').on(table.isActive),
  locationNameIdx: index('idx_practice_locations_location_name').on(table.locationName),
  createdAtIdx: index('idx_practice_locations_created_at').on(table.createdAt),
  practiceActiveIdx: index('idx_practice_locations_practice_active').on(table.practiceId, table.isActive),
  stateActiveIdx: index('idx_practice_locations_state_active').on(table.state, table.isActive)
}));

// Banking/EFT information for providers
export const providerBanking = pgTable('provider_banking', {
  id: uuid('id').defaultRandom().primaryKey(),
  physicianId: uuid('physician_id').notNull().references(() => physicians.id, { onDelete: 'cascade' }),
  
  // Banking details (encrypted sensitive data)
  bankName: text('bank_name').notNull(),
  routingNumber: text('routing_number', { length: 9 }).notNull(), // encrypted
  accountNumber: text('account_number').notNull(), // encrypted
  accountType: text('account_type').notNull().default('checking'), // checking/savings
  
  // EFT/ERA preferences
  eftEnabled: boolean('eft_enabled').notNull().default(false),
  eraEnabled: boolean('era_enabled').notNull().default(false),
  
  // Supporting documents
  voidCheckUrl: text('void_check_url'),
  bankLetterUrl: text('bank_letter_url'),
  
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  // CHECK constraints for data integrity
  bankNameNotEmpty: check('bank_name_not_empty', sql`length(trim(bank_name)) > 0`),
  accountTypeValid: check('account_type_valid', sql`account_type IN ('checking', 'savings', 'business_checking', 'business_savings')`),
  urlFormat: check('void_check_url_format', sql`void_check_url IS NULL OR void_check_url ~ '^https?:\/\/'`),
  bankLetterUrlFormat: check('bank_letter_url_format', sql`bank_letter_url IS NULL OR bank_letter_url ~ '^https?:\/\/'`),
  // Note: Business logic should enforce one active banking record per physician
  // This would require application-level validation due to Drizzle limitations
}));

// Professional References table
export const professionalReferences = pgTable('professional_references', {
  id: uuid('id').defaultRandom().primaryKey(),
  physicianId: uuid('physician_id').notNull().references(() => physicians.id, { onDelete: 'cascade' }),
  
  referenceName: text('reference_name').notNull(),
  title: text('title'),
  organization: text('organization'),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  relationship: text('relationship'), // colleague, supervisor, etc.
  yearsKnown: integer('years_known'),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  // CHECK constraints for data integrity
  referenceNameNotEmpty: check('reference_name_not_empty', sql`length(trim(reference_name)) > 0`),
  phoneFormat: check('phone_format', sql`phone ~ '^[\+]?[1-9][\d]{1,14}$'`),
  emailFormat: check('email_format', sql`email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'`),
  yearsKnownPositive: check('years_known_positive', sql`years_known IS NULL OR years_known >= 0`),
  yearsKnownRealistic: check('years_known_realistic', sql`years_known IS NULL OR years_known <= 70`),
  relationshipValid: check('relationship_valid', sql`relationship IS NULL OR relationship IN ('colleague', 'supervisor', 'mentor', 'coworker', 'other')`)
}));

// Payer Enrollments table - core enrollment tracking
export const payerEnrollments = pgTable('payer_enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  physicianId: uuid('physician_id').notNull().references(() => physicians.id, { onDelete: 'cascade' }),
  payerId: uuid('payer_id').notNull().references(() => payers.id, { onDelete: 'cascade' }),
  practiceLocationId: uuid('practice_location_id').notNull().references(() => practiceLocations.id, { onDelete: 'cascade' }),
  
  // Enrollment details
  linesOfBusiness: lineOfBusinessEnum('lines_of_business').array().notNull(),
  networkName: text('network_name'),
  tinUsed: text('tin_used'), // Tax ID used for this enrollment
  npiUsed: text('npi_used'), // NPI used for this enrollment
  
  // Status and identification
  enrollmentStatus: enrollmentStatusEnum('enrollment_status').notNull().default('discovery'),
  providerId: text('provider_id'), // Payer-assigned provider ID
  parStatus: parStatusEnum('par_status').notNull().default('pending'),
  
  // Important dates
  effectiveDate: date('effective_date'),
  revalidationDate: date('revalidation_date'),
  reCredentialingDate: date('re_credentialing_date'),
  submittedDate: date('submitted_date'),
  approvedDate: date('approved_date'),
  stoppedDate: date('stopped_date'),
  stoppedReason: text('stopped_reason'),
  
  // Workflow tracking
  nextActionRequired: text('next_action_required'),
  nextActionDueDate: date('next_action_due_date'),
  progressPercentage: integer('progress_percentage').notNull().default(0),
  
  // Documents and evidence
  approvalLetterUrl: text('approval_letter_url'),
  welcomeLetterUrl: text('welcome_letter_url'),
  screenshotUrls: text('screenshot_urls').array(),
  confirmationNumbers: text('confirmation_numbers').array(),
  
  // Communication tracking
  contacts: jsonb('contacts'), // Array of contact persons and info
  notes: text('notes'),
  timeline: jsonb('timeline'), // Status change history with timestamps
  
  // Audit fields
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
  // CHECK constraints for data integrity
  linesOfBusinessNotEmpty: check('lines_of_business_not_empty', sql`array_length(lines_of_business, 1) > 0`),
  progressPercentageValid: check('progress_percentage_valid', sql`progress_percentage >= 0 AND progress_percentage <= 100`),
  npiUsedFormat: check('npi_used_format', sql`npi_used IS NULL OR (length(npi_used) = 10 AND npi_used ~ '^[0-9]{10}$')`),
  
  // Date validation constraints
  effectiveBeforeRevalidation: check('effective_before_revalidation', sql`revalidation_date IS NULL OR effective_date IS NULL OR effective_date <= revalidation_date`),
  effectiveBeforeReCredentialing: check('effective_before_re_credentialing', sql`re_credentialing_date IS NULL OR effective_date IS NULL OR effective_date <= re_credentialing_date`),
  submittedBeforeApproved: check('submitted_before_approved', sql`approved_date IS NULL OR submitted_date IS NULL OR submitted_date <= approved_date`),
  approvedBeforeStopped: check('approved_before_stopped', sql`stopped_date IS NULL OR approved_date IS NULL OR approved_date <= stopped_date`),
  
  // Business rule constraints
  stoppedReasonWhenStopped: check('stopped_reason_when_stopped', sql`(enrollment_status != 'stopped') OR (stopped_reason IS NOT NULL AND length(trim(stopped_reason)) > 0)`),
  providerIdWhenActive: check('provider_id_when_active', sql`(enrollment_status NOT IN ('active', 'approved')) OR (provider_id IS NOT NULL AND length(trim(provider_id)) > 0)`),
  
  // URL format validation
  approvalLetterUrlFormat: check('approval_letter_url_format', sql`approval_letter_url IS NULL OR approval_letter_url ~ '^https?:\/\/'`),
  welcomeLetterUrlFormat: check('welcome_letter_url_format', sql`welcome_letter_url IS NULL OR welcome_letter_url ~ '^https?:\/\/'`),
  
  // Unique constraint: one active enrollment per physician-payer-location combination
  uniqueActiveEnrollment: unique('unique_active_enrollment').on(table.physicianId, table.payerId, table.practiceLocationId),
  
  // Performance indexes for common query patterns
  enrollmentStatusIdx: index('idx_payer_enrollments_status').on(table.enrollmentStatus),
  physicianIdIdx: index('idx_payer_enrollments_physician_id').on(table.physicianId),
  payerIdIdx: index('idx_payer_enrollments_payer_id').on(table.payerId),
  practiceLocationIdIdx: index('idx_payer_enrollments_location_id').on(table.practiceLocationId),
  createdAtIdx: index('idx_payer_enrollments_created_at').on(table.createdAt),
  nextActionDueDateIdx: index('idx_payer_enrollments_next_action_due').on(table.nextActionDueDate),
  
  // Composite indexes for common query combinations
  statusCreatedAtIdx: index('idx_payer_enrollments_status_created_at').on(table.enrollmentStatus, table.createdAt),
  physicianStatusIdx: index('idx_payer_enrollments_physician_status').on(table.physicianId, table.enrollmentStatus),
  payerStatusIdx: index('idx_payer_enrollments_payer_status').on(table.payerId, table.enrollmentStatus),
  locationStatusIdx: index('idx_payer_enrollments_location_status').on(table.practiceLocationId, table.enrollmentStatus),
  
  // Date-range indexes for date fields (critical for production performance)
  submittedDateIdx: index('idx_payer_enrollments_submitted_date').on(table.submittedDate),
  approvedDateIdx: index('idx_payer_enrollments_approved_date').on(table.approvedDate),
  effectiveDateIdx: index('idx_payer_enrollments_effective_date').on(table.effectiveDate),
  revalidationDateIdx: index('idx_payer_enrollments_revalidation_date').on(table.revalidationDate),
  reCredentialingDateIdx: index('idx_payer_enrollments_re_credentialing_date').on(table.reCredentialingDate),
  stoppedDateIdx: index('idx_payer_enrollments_stopped_date').on(table.stoppedDate),
  
  // Additional composite indexes for frequent query patterns
  statusPhysicianIdx: index('idx_payer_enrollments_status_physician').on(table.enrollmentStatus, table.physicianId),
  statusPayerIdx: index('idx_payer_enrollments_status_payer').on(table.enrollmentStatus, table.payerId), 
  statusLocationIdx: index('idx_payer_enrollments_status_location').on(table.enrollmentStatus, table.practiceLocationId),
  statusNextActionIdx: index('idx_payer_enrollments_status_next_action').on(table.enrollmentStatus, table.nextActionDueDate),
  
  // Covering indexes for ORDER BY/LIMIT patterns (production critical)
  statusCreatedAtCoveringIdx: index('idx_payer_enrollments_status_created_covering').on(table.enrollmentStatus, table.createdAt, table.id, table.physicianId, table.payerId),
  physicianCreatedAtCoveringIdx: index('idx_payer_enrollments_physician_created_covering').on(table.physicianId, table.createdAt, table.id, table.enrollmentStatus),
  payerCreatedAtCoveringIdx: index('idx_payer_enrollments_payer_created_covering').on(table.payerId, table.createdAt, table.id, table.enrollmentStatus),
  
  // Dashboard aggregation indexes
  statusGroupingIdx: index('idx_payer_enrollments_status_grouping').on(table.enrollmentStatus, table.createdAt, table.updatedAt),
  payerEnrollmentCountIdx: index('idx_payer_enrollments_payer_count').on(table.payerId, table.enrollmentStatus, table.createdAt)
}));

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

// Practice schemas and types
export const insertPracticeSchema = createInsertSchema(practices).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertPractice = typeof practices.$inferInsert;
export type SelectPractice = typeof practices.$inferSelect;

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

// DEA Registrations schemas and types
export const insertDeaRegistrationSchema = createInsertSchema(deaRegistrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertDeaRegistration = typeof deaRegistrations.$inferInsert;
export type SelectDeaRegistration = typeof deaRegistrations.$inferSelect;

// CSR Licenses schemas and types
export const insertCsrLicenseSchema = createInsertSchema(csrLicenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertCsrLicense = typeof csrLicenses.$inferInsert;
export type SelectCsrLicense = typeof csrLicenses.$inferSelect;

// Role Policies schemas and types
export const insertRolePolicySchema = createInsertSchema(rolePolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertRolePolicy = typeof rolePolicies.$inferInsert;
export type SelectRolePolicy = typeof rolePolicies.$inferSelect;

// License Documents schemas and types
export const insertLicenseDocumentSchema = createInsertSchema(licenseDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertLicenseDocument = typeof licenseDocuments.$inferInsert;
export type SelectLicenseDocument = typeof licenseDocuments.$inferSelect;

// Notifications schemas and types
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertNotification = typeof notifications.$inferInsert;
export type SelectNotification = typeof notifications.$inferSelect;

// Renewal Workflows schemas and types
export const insertRenewalWorkflowSchema = createInsertSchema(renewalWorkflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertRenewalWorkflow = typeof renewalWorkflows.$inferInsert;
export type SelectRenewalWorkflow = typeof renewalWorkflows.$inferSelect;

// Payer schemas and types
export const insertPayerSchema = createInsertSchema(payers).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertPayer = typeof payers.$inferInsert;
export type SelectPayer = typeof payers.$inferSelect;

// Practice Location schemas and types
export const insertPracticeLocationSchema = createInsertSchema(practiceLocations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertPracticeLocation = typeof practiceLocations.$inferInsert;
export type SelectPracticeLocation = typeof practiceLocations.$inferSelect;

// Provider Banking schemas and types
export const insertProviderBankingSchema = createInsertSchema(providerBanking).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertProviderBanking = typeof providerBanking.$inferInsert;
export type SelectProviderBanking = typeof providerBanking.$inferSelect;

// Professional References schemas and types
export const insertProfessionalReferenceSchema = createInsertSchema(professionalReferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertProfessionalReference = typeof professionalReferences.$inferInsert;
export type SelectProfessionalReference = typeof professionalReferences.$inferSelect;

// Payer Enrollment schemas and types
export const insertPayerEnrollmentSchema = createInsertSchema(payerEnrollments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type InsertPayerEnrollment = typeof payerEnrollments.$inferInsert;
export type SelectPayerEnrollment = typeof payerEnrollments.$inferSelect;