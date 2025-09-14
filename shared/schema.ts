import { boolean, date, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { z, type ZodType } from 'zod';

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
export const profiles = pgTable('profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().unique(),
  email: text('email').notNull(),
  fullName: text('full_name').notNull(),
  role: userRoleEnum('role').notNull().default('staff'),
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
  createdBy: uuid('created_by').references(() => profiles.userId),
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
  uploadedBy: uuid('uploaded_by').references(() => profiles.userId),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

// Insert Schemas and Types
export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}) as unknown as ZodType<any>;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type SelectProfile = typeof profiles.$inferSelect;

export const insertPhysicianSchema = createInsertSchema(physicians).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}) as unknown as ZodType<any>;
export type InsertPhysician = z.infer<typeof insertPhysicianSchema>;
export type SelectPhysician = typeof physicians.$inferSelect;

export const insertPhysicianLicenseSchema = createInsertSchema(physicianLicenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}) as unknown as ZodType<any>;
export type InsertPhysicianLicense = z.infer<typeof insertPhysicianLicenseSchema>;
export type SelectPhysicianLicense = typeof physicianLicenses.$inferSelect;

export const insertPhysicianCertificationSchema = createInsertSchema(physicianCertifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}) as unknown as ZodType<any>;
export type InsertPhysicianCertification = z.infer<typeof insertPhysicianCertificationSchema>;
export type SelectPhysicianCertification = typeof physicianCertifications.$inferSelect;

export const insertPhysicianEducationSchema = createInsertSchema(physicianEducation).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}) as unknown as ZodType<any>;
export type InsertPhysicianEducation = z.infer<typeof insertPhysicianEducationSchema>;
export type SelectPhysicianEducation = typeof physicianEducation.$inferSelect;

export const insertPhysicianWorkHistorySchema = createInsertSchema(physicianWorkHistory).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}) as unknown as ZodType<any>;
export type InsertPhysicianWorkHistory = z.infer<typeof insertPhysicianWorkHistorySchema>;
export type SelectPhysicianWorkHistory = typeof physicianWorkHistory.$inferSelect;

export const insertPhysicianHospitalAffiliationSchema = createInsertSchema(physicianHospitalAffiliations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}) as unknown as ZodType<any>;
export type InsertPhysicianHospitalAffiliation = z.infer<typeof insertPhysicianHospitalAffiliationSchema>;
export type SelectPhysicianHospitalAffiliation = typeof physicianHospitalAffiliations.$inferSelect;

export const insertPhysicianComplianceSchema = createInsertSchema(physicianCompliance).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}) as unknown as ZodType<any>;
export type InsertPhysicianCompliance = z.infer<typeof insertPhysicianComplianceSchema>;
export type SelectPhysicianCompliance = typeof physicianCompliance.$inferSelect;

export const insertPhysicianDocumentSchema = createInsertSchema(physicianDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}) as unknown as ZodType<any>;
export type InsertPhysicianDocument = z.infer<typeof insertPhysicianDocumentSchema>;
export type SelectPhysicianDocument = typeof physicianDocuments.$inferSelect;