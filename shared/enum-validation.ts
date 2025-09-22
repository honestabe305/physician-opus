import { z } from 'zod';

// ============================
// ENUM CONST ARRAYS FOR RUNTIME VALIDATION
// ============================

// Gender Type
export const genderTypes = ['male', 'female', 'other', 'prefer_not_to_say'] as const;
export type GenderType = typeof genderTypes[number];

// User Role
export const userRoles = ['admin', 'staff', 'viewer'] as const;
export type UserRole = typeof userRoles[number];

// Document Type
export const documentTypes = [
  'drivers_license', 'social_security_card', 'dea_certificate', 'npi_confirmation',
  'w9_form', 'liability_insurance', 'medical_license', 'board_certification',
  'controlled_substance_registration', 'medical_diploma', 'residency_certificate',
  'fellowship_certificate', 'hospital_privilege_letter', 'employment_verification',
  'malpractice_insurance', 'npdb_report', 'cv', 'immunization_records', 'citizenship_proof'
] as const;
export type DocumentType = typeof documentTypes[number];

// License Status
export const licenseStatuses = ['active', 'expired', 'pending_renewal'] as const;
export type LicenseStatus = typeof licenseStatuses[number];

// Renewal Cycle
export const renewalCycles = ['annual', 'biennial'] as const;
export type RenewalCycle = typeof renewalCycles[number];

// Provider Role
export const providerRoles = ['physician', 'pa', 'np'] as const;
export type ProviderRole = typeof providerRoles[number];

// Clinician Type
export const clinicianTypes = [
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
] as const;
export type ClinicianType = typeof clinicianTypes[number];

// License Document Type
export const licenseDocumentTypes = [
  'license', 'dea_cert', 'csr_cert', 'supervision_agreement', 
  'collaboration_agreement', 'cme_cert', 'mate_cert'
] as const;
export type LicenseDocumentType = typeof licenseDocumentTypes[number];

// Notification Type
export const notificationTypes = ['license', 'dea', 'csr'] as const;
export type NotificationType = typeof notificationTypes[number];

// Notification Status (FOCUS AREA)
export const notificationStatuses = ['pending', 'sent', 'failed', 'read'] as const;
export type NotificationStatus = typeof notificationStatuses[number];

// Notification Severity
export const notificationSeverities = ['info', 'warning', 'critical'] as const;
export type NotificationSeverity = typeof notificationSeverities[number];

// Renewal Status (FOCUS AREA)
export const renewalStatuses = [
  'not_started', 'in_progress', 'filed', 'under_review', 'approved', 'rejected', 'expired'
] as const;
export type RenewalStatus = typeof renewalStatuses[number];

// Renewal Entity Type
export const renewalEntityTypes = ['license', 'dea', 'csr'] as const;
export type RenewalEntityType = typeof renewalEntityTypes[number];

// Enrollment Status (FOCUS AREA)
export const enrollmentStatuses = [
  'discovery', 'data_complete', 'submitted', 'payer_processing', 'approved', 'active', 'stopped', 'denied'
] as const;
export type EnrollmentStatus = typeof enrollmentStatuses[number];

// Line of Business (FOCUS AREA)
export const linesOfBusiness = [
  'hmo', 'ppo', 'epo', 'pos', 'medicare_advantage', 'medicaid', 'commercial', 'workers_comp', 'tricare'
] as const;
export type LineOfBusiness = typeof linesOfBusiness[number];

// PAR Status
export const parStatuses = ['participating', 'non_participating', 'pending', 'unknown'] as const;
export type ParStatus = typeof parStatuses[number];

// Place Type
export const placeTypes = ['clinic', 'hospital', 'telemed_hub', 'urgent_care', 'specialty_center'] as const;
export type PlaceType = typeof placeTypes[number];

// Compliance Status
export const complianceStatuses = ['compliant', 'non_compliant', 'pending_review', 'exempt'] as const;
export type ComplianceStatus = typeof complianceStatuses[number];

// Generic Status (for physicians, hospital affiliations, and other entities)
export const genericStatuses = ['active', 'inactive', 'pending', 'suspended', 'terminated'] as const;
export type GenericStatus = typeof genericStatuses[number];

// ============================
// TYPE GUARD FUNCTIONS
// ============================

// Generic type guard for enum validation
function isValidEnumValue<T extends readonly string[]>(
  value: any, 
  enumArray: T
): value is T[number] {
  return typeof value === 'string' && enumArray.includes(value as T[number]);
}

// Specific type guards for each enum
export const isValidGenderType = (value: any): value is GenderType => 
  isValidEnumValue(value, genderTypes);

export const isValidUserRole = (value: any): value is UserRole => 
  isValidEnumValue(value, userRoles);

export const isValidDocumentType = (value: any): value is DocumentType => 
  isValidEnumValue(value, documentTypes);

export const isValidLicenseStatus = (value: any): value is LicenseStatus => 
  isValidEnumValue(value, licenseStatuses);

export const isValidRenewalCycle = (value: any): value is RenewalCycle => 
  isValidEnumValue(value, renewalCycles);

export const isValidProviderRole = (value: any): value is ProviderRole => 
  isValidEnumValue(value, providerRoles);

export const isValidClinicianType = (value: any): value is ClinicianType => 
  isValidEnumValue(value, clinicianTypes);

export const isValidLicenseDocumentType = (value: any): value is LicenseDocumentType => 
  isValidEnumValue(value, licenseDocumentTypes);

export const isValidNotificationType = (value: any): value is NotificationType => 
  isValidEnumValue(value, notificationTypes);

export const isValidNotificationStatus = (value: any): value is NotificationStatus => 
  isValidEnumValue(value, notificationStatuses);

export const isValidNotificationSeverity = (value: any): value is NotificationSeverity => 
  isValidEnumValue(value, notificationSeverities);

export const isValidRenewalStatus = (value: any): value is RenewalStatus => 
  isValidEnumValue(value, renewalStatuses);

export const isValidRenewalEntityType = (value: any): value is RenewalEntityType => 
  isValidEnumValue(value, renewalEntityTypes);

export const isValidEnrollmentStatus = (value: any): value is EnrollmentStatus => 
  isValidEnumValue(value, enrollmentStatuses);

export const isValidLineOfBusiness = (value: any): value is LineOfBusiness => 
  isValidEnumValue(value, linesOfBusiness);

export const isValidParStatus = (value: any): value is ParStatus => 
  isValidEnumValue(value, parStatuses);

export const isValidPlaceType = (value: any): value is PlaceType => 
  isValidEnumValue(value, placeTypes);

export const isValidComplianceStatus = (value: any): value is ComplianceStatus => 
  isValidEnumValue(value, complianceStatuses);

export const isValidGenericStatus = (value: any): value is GenericStatus => 
  isValidEnumValue(value, genericStatuses);

// ============================
// VALIDATION FUNCTIONS WITH ERROR MESSAGES
// ============================

// Generic validation function with comprehensive error messages
function validateEnumValue<T extends readonly string[]>(
  value: any,
  enumArray: T,
  enumName: string
): T[number] {
  if (value === null || value === undefined) {
    throw new Error(`${enumName} is required and cannot be null or undefined`);
  }
  
  if (typeof value !== 'string') {
    throw new Error(`${enumName} must be a string, received: ${typeof value}`);
  }
  
  if (!enumArray.includes(value as T[number])) {
    throw new Error(
      `Invalid ${enumName}: "${value}". Valid values are: ${enumArray.join(', ')}`
    );
  }
  
  return value as T[number];
}

// Specific validation functions for each enum
export const validateGenderType = (value: any): GenderType =>
  validateEnumValue(value, genderTypes, 'gender type');

export const validateUserRole = (value: any): UserRole =>
  validateEnumValue(value, userRoles, 'user role');

export const validateDocumentType = (value: any): DocumentType =>
  validateEnumValue(value, documentTypes, 'document type');

export const validateLicenseStatus = (value: any): LicenseStatus =>
  validateEnumValue(value, licenseStatuses, 'license status');

export const validateRenewalCycle = (value: any): RenewalCycle =>
  validateEnumValue(value, renewalCycles, 'renewal cycle');

export const validateProviderRole = (value: any): ProviderRole =>
  validateEnumValue(value, providerRoles, 'provider role');

export const validateClinicianType = (value: any): ClinicianType =>
  validateEnumValue(value, clinicianTypes, 'clinician type');

export const validateLicenseDocumentType = (value: any): LicenseDocumentType =>
  validateEnumValue(value, licenseDocumentTypes, 'license document type');

export const validateNotificationType = (value: any): NotificationType =>
  validateEnumValue(value, notificationTypes, 'notification type');

export const validateNotificationStatus = (value: any): NotificationStatus =>
  validateEnumValue(value, notificationStatuses, 'notification status');

export const validateNotificationSeverity = (value: any): NotificationSeverity =>
  validateEnumValue(value, notificationSeverities, 'notification severity');

export const validateRenewalStatus = (value: any): RenewalStatus =>
  validateEnumValue(value, renewalStatuses, 'renewal status');

export const validateRenewalEntityType = (value: any): RenewalEntityType =>
  validateEnumValue(value, renewalEntityTypes, 'renewal entity type');

export const validateEnrollmentStatus = (value: any): EnrollmentStatus =>
  validateEnumValue(value, enrollmentStatuses, 'enrollment status');

export const validateLineOfBusiness = (value: any): LineOfBusiness =>
  validateEnumValue(value, linesOfBusiness, 'line of business');

export const validateParStatus = (value: any): ParStatus =>
  validateEnumValue(value, parStatuses, 'PAR status');

export const validatePlaceType = (value: any): PlaceType =>
  validateEnumValue(value, placeTypes, 'place type');

export const validateComplianceStatus = (value: any): ComplianceStatus =>
  validateEnumValue(value, complianceStatuses, 'compliance status');

export const validateGenericStatus = (value: any): GenericStatus =>
  validateEnumValue(value, genericStatuses, 'status');

// ============================
// ZOD VALIDATION SCHEMAS
// ============================

// Zod schemas for each enum type
export const genderTypeSchema = z.enum(genderTypes, {
  errorMap: () => ({ message: `Gender type must be one of: ${genderTypes.join(', ')}` })
});

export const userRoleSchema = z.enum(userRoles, {
  errorMap: () => ({ message: `User role must be one of: ${userRoles.join(', ')}` })
});

export const documentTypeSchema = z.enum(documentTypes, {
  errorMap: () => ({ message: `Document type must be one of: ${documentTypes.join(', ')}` })
});

export const licenseStatusSchema = z.enum(licenseStatuses, {
  errorMap: () => ({ message: `License status must be one of: ${licenseStatuses.join(', ')}` })
});

export const renewalCycleSchema = z.enum(renewalCycles, {
  errorMap: () => ({ message: `Renewal cycle must be one of: ${renewalCycles.join(', ')}` })
});

export const providerRoleSchema = z.enum(providerRoles, {
  errorMap: () => ({ message: `Provider role must be one of: ${providerRoles.join(', ')}` })
});

export const clinicianTypeSchema = z.enum(clinicianTypes, {
  errorMap: () => ({ message: `Clinician type must be one of: ${clinicianTypes.join(', ')}` })
});

export const licenseDocumentTypeSchema = z.enum(licenseDocumentTypes, {
  errorMap: () => ({ message: `License document type must be one of: ${licenseDocumentTypes.join(', ')}` })
});

export const notificationTypeSchema = z.enum(notificationTypes, {
  errorMap: () => ({ message: `Notification type must be one of: ${notificationTypes.join(', ')}` })
});

export const notificationStatusSchema = z.enum(notificationStatuses, {
  errorMap: () => ({ message: `Notification status must be one of: ${notificationStatuses.join(', ')}` })
});

export const notificationSeveritySchema = z.enum(notificationSeverities, {
  errorMap: () => ({ message: `Notification severity must be one of: ${notificationSeverities.join(', ')}` })
});

export const renewalStatusSchema = z.enum(renewalStatuses, {
  errorMap: () => ({ message: `Renewal status must be one of: ${renewalStatuses.join(', ')}` })
});

export const renewalEntityTypeSchema = z.enum(renewalEntityTypes, {
  errorMap: () => ({ message: `Renewal entity type must be one of: ${renewalEntityTypes.join(', ')}` })
});

export const enrollmentStatusSchema = z.enum(enrollmentStatuses, {
  errorMap: () => ({ message: `Enrollment status must be one of: ${enrollmentStatuses.join(', ')}` })
});

export const lineOfBusinessSchema = z.enum(linesOfBusiness, {
  errorMap: () => ({ message: `Line of business must be one of: ${linesOfBusiness.join(', ')}` })
});

export const parStatusSchema = z.enum(parStatuses, {
  errorMap: () => ({ message: `PAR status must be one of: ${parStatuses.join(', ')}` })
});

export const placeTypeSchema = z.enum(placeTypes, {
  errorMap: () => ({ message: `Place type must be one of: ${placeTypes.join(', ')}` })
});

export const complianceStatusSchema = z.enum(complianceStatuses, {
  errorMap: () => ({ message: `Compliance status must be one of: ${complianceStatuses.join(', ')}` })
});

export const genericStatusSchema = z.enum(genericStatuses, {
  errorMap: () => ({ message: `Status must be one of: ${genericStatuses.join(', ')}` })
});

// ============================
// COMPOSITE VALIDATION SCHEMAS
// ============================

// Optional versions for update operations
export const optionalGenderTypeSchema = genderTypeSchema.optional();
export const optionalUserRoleSchema = userRoleSchema.optional();
export const optionalDocumentTypeSchema = documentTypeSchema.optional();
export const optionalLicenseStatusSchema = licenseStatusSchema.optional();
export const optionalRenewalCycleSchema = renewalCycleSchema.optional();
export const optionalProviderRoleSchema = providerRoleSchema.optional();
export const optionalClinicianTypeSchema = clinicianTypeSchema.optional();
export const optionalLicenseDocumentTypeSchema = licenseDocumentTypeSchema.optional();
export const optionalNotificationTypeSchema = notificationTypeSchema.optional();
export const optionalNotificationStatusSchema = notificationStatusSchema.optional();
export const optionalNotificationSeveritySchema = notificationSeveritySchema.optional();
export const optionalRenewalStatusSchema = renewalStatusSchema.optional();
export const optionalRenewalEntityTypeSchema = renewalEntityTypeSchema.optional();
export const optionalEnrollmentStatusSchema = enrollmentStatusSchema.optional();
export const optionalLineOfBusinessSchema = lineOfBusinessSchema.optional();
export const optionalParStatusSchema = parStatusSchema.optional();
export const optionalPlaceTypeSchema = placeTypeSchema.optional();
export const optionalComplianceStatusSchema = complianceStatusSchema.optional();
export const optionalGenericStatusSchema = genericStatusSchema.optional();

// ============================
// UTILITY FUNCTIONS
// ============================

// Get all valid values for an enum type
export const getValidGenderTypes = () => [...genderTypes];
export const getValidUserRoles = () => [...userRoles];
export const getValidDocumentTypes = () => [...documentTypes];
export const getValidLicenseStatuses = () => [...licenseStatuses];
export const getValidRenewalCycles = () => [...renewalCycles];
export const getValidProviderRoles = () => [...providerRoles];
export const getValidClinicianTypes = () => [...clinicianTypes];
export const getValidLicenseDocumentTypes = () => [...licenseDocumentTypes];
export const getValidNotificationTypes = () => [...notificationTypes];
export const getValidNotificationStatuses = () => [...notificationStatuses];
export const getValidNotificationSeverities = () => [...notificationSeverities];
export const getValidRenewalStatuses = () => [...renewalStatuses];
export const getValidRenewalEntityTypes = () => [...renewalEntityTypes];
export const getValidEnrollmentStatuses = () => [...enrollmentStatuses];
export const getValidLinesOfBusiness = () => [...linesOfBusiness];
export const getValidParStatuses = () => [...parStatuses];
export const getValidPlaceTypes = () => [...placeTypes];
export const getValidComplianceStatuses = () => [...complianceStatuses];
export const getValidGenericStatuses = () => [...genericStatuses];

// Validation error classes for better error handling
export class EnumValidationError extends Error {
  constructor(
    public enumType: string,
    public receivedValue: unknown,
    public allowedValues: readonly string[],
    message?: string
  ) {
    super(message || `Invalid ${enumType}: "${receivedValue}". Valid values are: ${allowedValues.join(', ')}`);
    this.name = 'EnumValidationError';
  }

  // Legacy properties for backward compatibility
  get field(): string { return this.enumType; }
  get value(): unknown { return this.receivedValue; }
  get validValues(): readonly string[] { return this.allowedValues; }
}

// Enhanced validation function that throws EnumValidationError
export function validateEnumValueEnhanced<T extends readonly string[]>(
  value: any,
  enumArray: T,
  fieldName: string
): T[number] {
  if (value === null || value === undefined) {
    throw new EnumValidationError(fieldName, value, enumArray, `${fieldName} is required and cannot be null or undefined`);
  }
  
  if (typeof value !== 'string') {
    throw new EnumValidationError(fieldName, value, enumArray, `${fieldName} must be a string, received: ${typeof value}`);
  }
  
  if (!enumArray.includes(value as T[number])) {
    throw new EnumValidationError(fieldName, value, enumArray);
  }
  
  return value as T[number];
}