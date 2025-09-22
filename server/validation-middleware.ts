import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  renewalStatusSchema,
  enrollmentStatusSchema,
  notificationTypeSchema,
  providerRoleSchema,
  genericStatusSchema,
  documentTypeSchema,
  lineOfBusinessSchema,
  userRoleSchema,
  licenseStatusSchema,
  complianceStatusSchema,
  validateRenewalStatus,
  validateEnrollmentStatus,
  validateNotificationType,
  validateProviderRole,
  validateGenericStatus,
  validateDocumentType,
  validateLineOfBusiness,
  validateUserRole,
  validateLicenseStatus,
  validateComplianceStatus,
  EnumValidationError,
} from '../shared/enum-validation';

/**
 * Generic enum validation middleware factory
 * Creates middleware that validates a specific field using a given enum schema
 */
export function createEnumValidationMiddleware(
  fieldName: string,
  enumSchema: z.ZodEnum<any>,
  location: 'body' | 'params' | 'query' = 'body'
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const value = location === 'body' ? req.body[fieldName] : 
                   location === 'params' ? req.params[fieldName] : 
                   req.query[fieldName];

      if (value !== undefined) {
        enumSchema.parse(value);
      }
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: `Invalid ${fieldName}: ${error.errors[0]?.message || 'Invalid enum value'}`,
          field: fieldName,
          receivedValue: location === 'body' ? req.body[fieldName] : 
                        location === 'params' ? req.params[fieldName] : 
                        req.query[fieldName]
        });
      }
      return res.status(400).json({
        error: `Invalid ${fieldName}: ${(error as Error).message}`,
        field: fieldName
      });
    }
  };
}

/**
 * Validates renewal status in request body
 */
export const validateRenewalStatusMiddleware = createEnumValidationMiddleware(
  'status',
  renewalStatusSchema,
  'body'
);

/**
 * Validates renewal status in URL parameters
 */
export const validateRenewalStatusParamsMiddleware = createEnumValidationMiddleware(
  'status',
  renewalStatusSchema,
  'params'
);

/**
 * Validates enrollment status in request body
 */
export const validateEnrollmentStatusMiddleware = createEnumValidationMiddleware(
  'enrollmentStatus',
  enrollmentStatusSchema,
  'body'
);

/**
 * Validates enrollment status in URL parameters
 */
export const validateEnrollmentStatusParamsMiddleware = createEnumValidationMiddleware(
  'status',
  enrollmentStatusSchema,
  'params'
);

/**
 * Validates notification type in request body
 */
export const validateNotificationTypeMiddleware = createEnumValidationMiddleware(
  'type',
  notificationTypeSchema,
  'body'
);

/**
 * Validates notification type in URL parameters
 */
export const validateNotificationTypeParamsMiddleware = createEnumValidationMiddleware(
  'type',
  notificationTypeSchema,
  'params'
);

/**
 * Validates provider role in request body
 */
export const validateProviderRoleMiddleware = createEnumValidationMiddleware(
  'role',
  providerRoleSchema,
  'body'
);

/**
 * Validates provider role in URL parameters
 */
export const validateProviderRoleParamsMiddleware = createEnumValidationMiddleware(
  'role',
  providerRoleSchema,
  'params'
);

/**
 * Validates generic status in query parameters
 */
export const validateStatusQueryMiddleware = createEnumValidationMiddleware(
  'status',
  genericStatusSchema,
  'query'
);

/**
 * Validates document type in request body
 */
export const validateDocumentTypeMiddleware = createEnumValidationMiddleware(
  'documentType',
  documentTypeSchema,
  'body'
);

/**
 * Validates document type in URL parameters
 */
export const validateDocumentTypeParamsMiddleware = createEnumValidationMiddleware(
  'documentType',
  documentTypeSchema,
  'params'
);

/**
 * Validates line of business in request body
 */
export const validateLineOfBusinessMiddleware = createEnumValidationMiddleware(
  'lineOfBusiness',
  lineOfBusinessSchema,
  'body'
);

/**
 * Validates user role in request body
 */
export const validateUserRoleMiddleware = createEnumValidationMiddleware(
  'role',
  userRoleSchema,
  'body'
);

/**
 * Validates license status in request body
 */
export const validateLicenseStatusMiddleware = createEnumValidationMiddleware(
  'licenseStatus',
  licenseStatusSchema,
  'body'
);

/**
 * Validates compliance status in request body
 */
export const validateComplianceStatusMiddleware = createEnumValidationMiddleware(
  'complianceStatus',
  complianceStatusSchema,
  'body'
);

/**
 * Multi-field enum validation middleware
 * Validates multiple enum fields in a single middleware
 */
export function createMultiEnumValidationMiddleware(
  validations: Array<{
    field: string;
    schema: z.ZodEnum<any>;
    location?: 'body' | 'params' | 'query';
    required?: boolean;
  }>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: Array<{field: string; error: string; receivedValue?: any}> = [];

    for (const validation of validations) {
      const { field, schema, location = 'body', required = false } = validation;
      
      const value = location === 'body' ? req.body[field] : 
                   location === 'params' ? req.params[field] : 
                   req.query[field];

      if (value === undefined) {
        if (required) {
          errors.push({
            field,
            error: `${field} is required`,
            receivedValue: value
          });
        }
        continue;
      }

      try {
        schema.parse(value);
      } catch (error) {
        if (error instanceof z.ZodError) {
          errors.push({
            field,
            error: error.errors[0]?.message || 'Invalid enum value',
            receivedValue: value
          });
        } else {
          errors.push({
            field,
            error: (error as Error).message,
            receivedValue: value
          });
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        validationErrors: errors
      });
    }

    next();
  };
}

/**
 * Comprehensive validation middleware for all common enum fields
 */
export const validateAllEnumsMiddleware = createMultiEnumValidationMiddleware([
  { field: 'renewalStatus', schema: renewalStatusSchema },
  { field: 'enrollmentStatus', schema: enrollmentStatusSchema },
  { field: 'notificationType', schema: notificationTypeSchema },
  { field: 'providerRole', schema: providerRoleSchema },
  { field: 'documentType', schema: documentTypeSchema },
  { field: 'lineOfBusiness', schema: lineOfBusinessSchema },
  { field: 'userRole', schema: userRoleSchema },
  { field: 'licenseStatus', schema: licenseStatusSchema },
  { field: 'complianceStatus', schema: complianceStatusSchema },
]);

/**
 * Express error handler for enum validation errors
 */
export function enumValidationErrorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (error instanceof EnumValidationError) {
    return res.status(400).json({
      error: error.message,
      enumType: error.enumType,
      receivedValue: error.receivedValue,
      allowedValues: error.allowedValues
    });
  }
  
  next(error);
}