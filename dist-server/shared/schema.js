"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertPhysicianDocumentSchema = exports.insertPhysicianComplianceSchema = exports.insertPhysicianHospitalAffiliationSchema = exports.insertPhysicianWorkHistorySchema = exports.insertPhysicianEducationSchema = exports.insertPhysicianCertificationSchema = exports.insertPhysicianLicenseSchema = exports.insertPhysicianSchema = exports.insertProfileSchema = exports.physicianDocuments = exports.physicianCompliance = exports.physicianHospitalAffiliations = exports.physicianWorkHistory = exports.physicianEducation = exports.physicianCertifications = exports.physicianLicenses = exports.physicians = exports.profiles = exports.documentTypeEnum = exports.userRoleEnum = exports.genderTypeEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_zod_1 = require("drizzle-zod");
// Enums
exports.genderTypeEnum = (0, pg_core_1.pgEnum)('gender_type', ['male', 'female', 'other', 'prefer_not_to_say']);
exports.userRoleEnum = (0, pg_core_1.pgEnum)('user_role', ['admin', 'staff', 'viewer']);
exports.documentTypeEnum = (0, pg_core_1.pgEnum)('document_type', [
    'drivers_license', 'social_security_card', 'dea_certificate', 'npi_confirmation',
    'w9_form', 'liability_insurance', 'medical_license', 'board_certification',
    'controlled_substance_registration', 'medical_diploma', 'residency_certificate',
    'fellowship_certificate', 'hospital_privilege_letter', 'employment_verification',
    'malpractice_insurance', 'npdb_report', 'cv', 'immunization_records', 'citizenship_proof'
]);
// Tables
exports.profiles = (0, pg_core_1.pgTable)('profiles', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    userId: (0, pg_core_1.uuid)('user_id').notNull().unique(),
    email: (0, pg_core_1.text)('email').notNull(),
    fullName: (0, pg_core_1.text)('full_name').notNull(),
    role: (0, exports.userRoleEnum)('role').notNull().default('staff'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow()
});
exports.physicians = (0, pg_core_1.pgTable)('physicians', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    fullLegalName: (0, pg_core_1.text)('full_legal_name').notNull(),
    dateOfBirth: (0, pg_core_1.date)('date_of_birth'),
    gender: (0, exports.genderTypeEnum)('gender'),
    ssn: (0, pg_core_1.text)('ssn'), // encrypted sensitive data
    npi: (0, pg_core_1.text)('npi').unique(),
    tin: (0, pg_core_1.text)('tin'), // encrypted sensitive data
    deaNumber: (0, pg_core_1.text)('dea_number'),
    caqhId: (0, pg_core_1.text)('caqh_id'),
    // Contact Information
    homeAddress: (0, pg_core_1.text)('home_address'), // encrypted sensitive data
    mailingAddress: (0, pg_core_1.text)('mailing_address'),
    phoneNumbers: (0, pg_core_1.text)('phone_numbers').array(),
    emailAddress: (0, pg_core_1.text)('email_address'),
    emergencyContact: (0, pg_core_1.jsonb)('emergency_contact'), // {name, phone, relationship}
    // Practice Information
    practiceName: (0, pg_core_1.text)('practice_name'),
    primaryPracticeAddress: (0, pg_core_1.text)('primary_practice_address'),
    secondaryPracticeAddresses: (0, pg_core_1.text)('secondary_practice_addresses').array(),
    officePhone: (0, pg_core_1.text)('office_phone'),
    officeFax: (0, pg_core_1.text)('office_fax'),
    officeContactPerson: (0, pg_core_1.text)('office_contact_person'),
    groupNpi: (0, pg_core_1.text)('group_npi'),
    groupTaxId: (0, pg_core_1.text)('group_tax_id'), // encrypted sensitive data
    // Insurance & Liability
    malpracticeCarrier: (0, pg_core_1.text)('malpractice_carrier'),
    malpracticePolicyNumber: (0, pg_core_1.text)('malpractice_policy_number'),
    coverageLimits: (0, pg_core_1.text)('coverage_limits'),
    malpracticeExpirationDate: (0, pg_core_1.date)('malpractice_expiration_date'),
    // Status and metadata
    status: (0, pg_core_1.text)('status').default('active'),
    createdBy: (0, pg_core_1.uuid)('created_by').references(() => exports.profiles.userId),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow()
});
exports.physicianLicenses = (0, pg_core_1.pgTable)('physician_licenses', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    physicianId: (0, pg_core_1.uuid)('physician_id').notNull().references(() => exports.physicians.id, { onDelete: 'cascade' }),
    state: (0, pg_core_1.text)('state').notNull(),
    licenseNumber: (0, pg_core_1.text)('license_number').notNull(),
    expirationDate: (0, pg_core_1.date)('expiration_date').notNull(),
    licenseType: (0, pg_core_1.text)('license_type').default('medical'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow()
});
exports.physicianCertifications = (0, pg_core_1.pgTable)('physician_certifications', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    physicianId: (0, pg_core_1.uuid)('physician_id').notNull().references(() => exports.physicians.id, { onDelete: 'cascade' }),
    specialty: (0, pg_core_1.text)('specialty').notNull(),
    subspecialty: (0, pg_core_1.text)('subspecialty'),
    boardName: (0, pg_core_1.text)('board_name').notNull(),
    certificationDate: (0, pg_core_1.date)('certification_date'),
    expirationDate: (0, pg_core_1.date)('expiration_date'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow()
});
exports.physicianEducation = (0, pg_core_1.pgTable)('physician_education', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    physicianId: (0, pg_core_1.uuid)('physician_id').notNull().references(() => exports.physicians.id, { onDelete: 'cascade' }),
    educationType: (0, pg_core_1.text)('education_type').notNull(), // 'medical_school', 'residency', 'fellowship'
    institutionName: (0, pg_core_1.text)('institution_name').notNull(),
    specialty: (0, pg_core_1.text)('specialty'),
    location: (0, pg_core_1.text)('location'),
    startDate: (0, pg_core_1.date)('start_date'),
    completionDate: (0, pg_core_1.date)('completion_date'),
    graduationYear: (0, pg_core_1.integer)('graduation_year'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow()
});
exports.physicianWorkHistory = (0, pg_core_1.pgTable)('physician_work_history', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    physicianId: (0, pg_core_1.uuid)('physician_id').notNull().references(() => exports.physicians.id, { onDelete: 'cascade' }),
    employerName: (0, pg_core_1.text)('employer_name').notNull(),
    position: (0, pg_core_1.text)('position'),
    startDate: (0, pg_core_1.date)('start_date').notNull(),
    endDate: (0, pg_core_1.date)('end_date'),
    address: (0, pg_core_1.text)('address'),
    supervisorName: (0, pg_core_1.text)('supervisor_name'),
    reasonForLeaving: (0, pg_core_1.text)('reason_for_leaving'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow()
});
exports.physicianHospitalAffiliations = (0, pg_core_1.pgTable)('physician_hospital_affiliations', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    physicianId: (0, pg_core_1.uuid)('physician_id').notNull().references(() => exports.physicians.id, { onDelete: 'cascade' }),
    hospitalName: (0, pg_core_1.text)('hospital_name').notNull(),
    privileges: (0, pg_core_1.text)('privileges').array(),
    startDate: (0, pg_core_1.date)('start_date'),
    endDate: (0, pg_core_1.date)('end_date'),
    status: (0, pg_core_1.text)('status').default('active'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow()
});
exports.physicianCompliance = (0, pg_core_1.pgTable)('physician_compliance', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    physicianId: (0, pg_core_1.uuid)('physician_id').notNull().references(() => exports.physicians.id, { onDelete: 'cascade' }),
    licenseRevocations: (0, pg_core_1.boolean)('license_revocations').default(false),
    licenseRevocationsExplanation: (0, pg_core_1.text)('license_revocations_explanation'),
    pendingInvestigations: (0, pg_core_1.boolean)('pending_investigations').default(false),
    pendingInvestigationsExplanation: (0, pg_core_1.text)('pending_investigations_explanation'),
    malpracticeClaims: (0, pg_core_1.boolean)('malpractice_claims').default(false),
    malpracticeClaimsExplanation: (0, pg_core_1.text)('malpractice_claims_explanation'),
    medicareSanctions: (0, pg_core_1.boolean)('medicare_sanctions').default(false),
    medicareSanctionsExplanation: (0, pg_core_1.text)('medicare_sanctions_explanation'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow()
});
exports.physicianDocuments = (0, pg_core_1.pgTable)('physician_documents', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    physicianId: (0, pg_core_1.uuid)('physician_id').notNull().references(() => exports.physicians.id, { onDelete: 'cascade' }),
    documentType: (0, exports.documentTypeEnum)('document_type').notNull(),
    fileName: (0, pg_core_1.text)('file_name').notNull(),
    filePath: (0, pg_core_1.text)('file_path').notNull(),
    fileSize: (0, pg_core_1.integer)('file_size'),
    mimeType: (0, pg_core_1.text)('mime_type'),
    isSensitive: (0, pg_core_1.boolean)('is_sensitive').default(true),
    uploadedBy: (0, pg_core_1.uuid)('uploaded_by').references(() => exports.profiles.userId),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow()
});
// Insert Schemas and Types
exports.insertProfileSchema = (0, drizzle_zod_1.createInsertSchema)(exports.profiles).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.insertPhysicianSchema = (0, drizzle_zod_1.createInsertSchema)(exports.physicians).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.insertPhysicianLicenseSchema = (0, drizzle_zod_1.createInsertSchema)(exports.physicianLicenses).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.insertPhysicianCertificationSchema = (0, drizzle_zod_1.createInsertSchema)(exports.physicianCertifications).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.insertPhysicianEducationSchema = (0, drizzle_zod_1.createInsertSchema)(exports.physicianEducation).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.insertPhysicianWorkHistorySchema = (0, drizzle_zod_1.createInsertSchema)(exports.physicianWorkHistory).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.insertPhysicianHospitalAffiliationSchema = (0, drizzle_zod_1.createInsertSchema)(exports.physicianHospitalAffiliations).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.insertPhysicianComplianceSchema = (0, drizzle_zod_1.createInsertSchema)(exports.physicianCompliance).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.insertPhysicianDocumentSchema = (0, drizzle_zod_1.createInsertSchema)(exports.physicianDocuments).omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
