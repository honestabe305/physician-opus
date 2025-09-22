import { Request, Response, NextFunction } from 'express';
import { EnrollmentStatus, enrollmentStatuses } from '../shared/enum-validation';

/**
 * Valid enrollment status transitions
 * Defines which status changes are allowed to prevent invalid workflows
 */
const VALID_ENROLLMENT_TRANSITIONS: Record<EnrollmentStatus, EnrollmentStatus[]> = {
  'discovery': ['data_complete', 'stopped'],
  'data_complete': ['submitted', 'discovery', 'stopped'],
  'submitted': ['payer_processing', 'data_complete', 'stopped'],
  'payer_processing': ['approved', 'denied', 'submitted', 'stopped'],
  'approved': ['active', 'stopped'],
  'active': ['stopped'],
  'stopped': ['discovery'], // Can only restart from beginning
  'denied': ['discovery'] // Must resubmit from beginning, cannot go directly to active
};

/**
 * Validate enrollment status transition
 * Prevents invalid status changes like denied→active without resubmission
 */
export function validateEnrollmentStatusTransition(
  currentStatus: EnrollmentStatus,
  newStatus: EnrollmentStatus
): { valid: boolean; error?: string } {
  // Allow setting initial status
  if (!currentStatus || currentStatus === newStatus) {
    return { valid: true };
  }

  const allowedTransitions = VALID_ENROLLMENT_TRANSITIONS[currentStatus];
  
  if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed transitions: ${allowedTransitions?.join(', ') || 'none'}`
    };
  }

  return { valid: true };
}

/**
 * Middleware to validate enrollment status transitions
 */
export function enrollmentTransitionValidationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Only validate for status updates
  if (req.method === 'PATCH' && req.path.includes('/status')) {
    const { status: newStatus } = req.body;
    
    if (!newStatus) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Get current enrollment to check transition validity
    // This will be set by a previous middleware or we'll fetch it
    const enrollmentId = req.params.id;
    
    // Store validation function on request for use in route handler
    req.validateStatusTransition = async (currentStatus: EnrollmentStatus) => {
      return validateEnrollmentStatusTransition(currentStatus, newStatus);
    };
  }
  
  next();
}

/**
 * Validate enrollment progress bounds (0-100)
 */
export function validateEnrollmentProgress(progress: number): { valid: boolean; error?: string } {
  if (typeof progress !== 'number') {
    return { 
      valid: false, 
      error: 'Progress must be a number' 
    };
  }

  if (progress < 0 || progress > 100) {
    return { 
      valid: false, 
      error: 'Progress must be between 0 and 100' 
    };
  }

  if (!Number.isInteger(progress)) {
    return { 
      valid: false, 
      error: 'Progress must be a whole number' 
    };
  }

  return { valid: true };
}

/**
 * Middleware to validate enrollment progress bounds
 */
export function enrollmentProgressValidationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.method === 'PATCH' && req.path.includes('/progress')) {
    const { progress } = req.body;
    
    if (progress === undefined || progress === null) {
      return res.status(400).json({ error: 'Progress is required' });
    }

    const validation = validateEnrollmentProgress(progress);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
  }
  
  next();
}

/**
 * Business rule validation for enrollment status
 */
export function validateEnrollmentBusinessRules(
  status: EnrollmentStatus,
  data: any
): { valid: boolean; error?: string } {
  switch (status) {
    case 'stopped':
      if (!data.stoppedReason || data.stoppedReason.trim().length === 0) {
        return {
          valid: false,
          error: 'Stopped reason is required when status is set to stopped'
        };
      }
      break;
      
    case 'active':
    case 'approved':
      if (!data.providerId || data.providerId.trim().length === 0) {
        return {
          valid: false,
          error: 'Provider ID is required when status is set to active or approved'
        };
      }
      break;
  }
  
  return { valid: true };
}

// Add types to Express Request
declare global {
  namespace Express {
    interface Request {
      validateStatusTransition?: (currentStatus: EnrollmentStatus) => Promise<{ valid: boolean; error?: string }>;
    }
  }
}