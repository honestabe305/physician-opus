import { Request, Response, NextFunction } from 'express';
import {
  validateNewLicense,
  validateProviderRole,
  validateRequiredDocuments,
  checkLicenseExpiration,
  stateRequiresNPCollaboration,
  stateRequiresPASupervision,
  getStateBoardType,
  isCompactEligible
} from '../validation/license-validation';
import { createStorage } from '../storage';

const storage = createStorage();

// Extend Express Request type for TypeScript
declare global {
  namespace Express {
    interface Request {
      physician?: any;
      rolePolicy?: any;
      validationErrors?: string[];
    }
  }
}

/**
 * Middleware to validate provider role permissions
 */
export const validateProviderRolePermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const physicianId = req.params.physicianId || req.body.physicianId;
    
    if (!physicianId) {
      return res.status(400).json({ error: 'Physician ID is required' });
    }

    // Get physician details
    const physician = await storage.getPhysician(physicianId);
    
    if (!physician) {
      return res.status(404).json({ error: 'Physician not found' });
    }

    // Attach physician to request for use in route handlers
    req.physician = physician;

    // Check if user has permission to modify this physician's data
    if (req.user && req.user.role !== 'admin') {
      // Staff can only edit their own assigned physicians
      const profile = await storage.getProfile(req.user.id);
      if (!profile || profile.id !== physicianId) {
        return res.status(403).json({ error: 'Insufficient permissions to modify this physician' });
      }
    }

    next();
  } catch (error) {
    console.error('Error in validateProviderRolePermissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to validate license creation based on role and state
 */
export const validateLicenseCreation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { physicianId, state } = req.body;

    if (!physicianId || !state) {
      return res.status(400).json({ error: 'Physician ID and state are required' });
    }

    // Get physician and role policy
    const physician = await storage.getPhysician(physicianId);
    if (!physician) {
      return res.status(404).json({ error: 'Physician not found' });
    }

    if (!physician.providerRole) {
      return res.status(400).json({ error: 'Provider role is not defined' });
    }

    const rolePolicy = await storage.getRolePolicyByRoleAndState(
      physician.providerRole,
      state
    );

    // Validate the license
    const validation = validateNewLicense(req.body, physician, rolePolicy);
    
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'License validation failed',
        details: validation.errors 
      });
    }

    // Attach to request for use in route handler
    req.physician = physician;
    req.rolePolicy = rolePolicy;

    next();
  } catch (error) {
    console.error('Error in validateLicenseCreation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to validate provider requirements based on role
 */
export const validateProviderRequirements = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const physicianId = req.params.physicianId || req.body.physicianId;
    const state = req.body.state || req.query.state;

    if (!physicianId) {
      return res.status(400).json({ error: 'Physician ID is required' });
    }

    // Get physician details
    const physician = await storage.getPhysician(physicianId);
    if (!physician) {
      return res.status(404).json({ error: 'Physician not found' });
    }

    if (!physician.providerRole || !state) {
      return res.status(400).json({ error: 'Provider role and state are required' });
    }

    // Get role policy for the state
    const rolePolicy = await storage.getRolePolicyByRoleAndState(
      physician.providerRole,
      state as string
    );

    // Validate provider role requirements
    const validation = validateProviderRole(physician, state as string, rolePolicy);
    
    if (!validation.valid) {
      req.validationErrors = validation.errors;
      // Don't block the request, just add warnings
      // The route handler can decide what to do with these warnings
    }

    req.physician = physician;
    req.rolePolicy = rolePolicy;

    next();
  } catch (error) {
    console.error('Error in validateProviderRequirements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to check supervision/collaboration requirements
 */
export const checkSupervisionRequirements = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const physicianId = req.params.physicianId || req.body.physicianId;
    const state = req.body.state || req.query.state;

    if (!physicianId || !state) {
      return res.status(400).json({ error: 'Physician ID and state are required' });
    }

    const physician = await storage.getPhysician(physicianId);
    if (!physician) {
      return res.status(404).json({ error: 'Physician not found' });
    }

    const errors: string[] = [];

    // Check PA supervision requirements
    if (physician.providerRole === 'pa') {
      if (stateRequiresPASupervision(state as string)) {
        if (!physician.supervisingPhysicianId) {
          errors.push(`PA requires supervising physician in ${state}`);
        } else {
          // Verify supervising physician exists and is active
          const supervisor = await storage.getPhysician(physician.supervisingPhysicianId);
          if (!supervisor) {
            errors.push('Supervising physician not found');
          } else if (supervisor.status !== 'active') {
            errors.push('Supervising physician is not active');
          }
        }

        // Supervision agreement would be tracked via documents
        // Check would be performed on document upload dates
      }
    }

    // Check NP collaboration requirements
    if (physician.providerRole === 'np') {
      if (stateRequiresNPCollaboration(state as string)) {
        if (!physician.collaborationPhysicianId) {
          errors.push(`NP requires collaboration agreement in ${state}`);
        } else {
          // Verify collaborating physician exists and is active
          const collaborator = await storage.getPhysician(physician.collaborationPhysicianId);
          if (!collaborator) {
            errors.push('Collaborating physician not found');
          } else if (collaborator.status !== 'active') {
            errors.push('Collaborating physician is not active');
          }
        }

        // Collaboration agreement would be tracked via documents
        // Check would be performed on document upload dates
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Supervision/collaboration requirements not met',
        details: errors 
      });
    }

    req.physician = physician;
    next();
  } catch (error) {
    console.error('Error in checkSupervisionRequirements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to validate document requirements
 */
export const validateDocumentRequirements = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const physicianId = req.params.physicianId || req.body.physicianId;
    const state = req.body.state || req.query.state;

    if (!physicianId || !state) {
      return res.status(400).json({ error: 'Physician ID and state are required' });
    }

    const physician = await storage.getPhysician(physicianId);
    if (!physician) {
      return res.status(404).json({ error: 'Physician not found' });
    }

    // Get all documents for the physician
    const documents = await storage.getPhysicianDocuments(physicianId);
    const documentTypes = documents.map(doc => doc.documentType);

    // Validate required documents
    const validation = validateRequiredDocuments(
      physician,
      state as string,
      documentTypes
    );

    if (!validation.valid) {
      // For document validation, we might want to warn but not block
      req.validationErrors = validation.errors;
    }

    req.physician = physician;
    next();
  } catch (error) {
    console.error('Error in validateDocumentRequirements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to check license expiration status
 */
export const checkLicenseStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const licenseId = req.params.licenseId;
    
    if (!licenseId) {
      return res.status(400).json({ error: 'License ID is required' });
    }

    const license = await storage.getPhysicianLicense(licenseId);
    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }

    const expirationStatus = checkLicenseExpiration(license.expirationDate);

    // Add expiration status to request
    req.body.expirationStatus = expirationStatus;

    // If license is expired, we might want to restrict certain operations
    if (expirationStatus.status === 'expired' && req.method !== 'GET') {
      return res.status(400).json({ 
        error: 'Cannot modify expired license',
        expirationDate: expirationStatus.expirationDate,
        daysSinceExpiration: Math.abs(expirationStatus.daysUntilExpiration || 0)
      });
    }

    next();
  } catch (error) {
    console.error('Error in checkLicenseStatus:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to validate compact license eligibility
 */
export const validateCompactEligibility = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { physicianId, state, isCompactLicense } = req.body;

    // Only validate if this is a compact license request
    if (!isCompactLicense) {
      return next();
    }

    if (!physicianId || !state) {
      return res.status(400).json({ error: 'Physician ID and state are required for compact license' });
    }

    const physician = await storage.getPhysician(physicianId);
    if (!physician) {
      return res.status(404).json({ error: 'Physician not found' });
    }

    if (!physician.providerRole) {
      return res.status(400).json({ error: 'Provider role is required for compact license' });
    }

    // Check if provider is eligible for compact in this state
    const eligible = isCompactEligible(physician.providerRole, state);
    
    if (!eligible) {
      return res.status(400).json({ 
        error: 'Not eligible for compact license',
        details: `${physician.providerRole} is not eligible for compact license in ${state}`,
        boardType: getStateBoardType(physician.providerRole, state)
      });
    }

    // Additional compact requirements
    // Board certifications are tracked in physicianCertifications table

    req.physician = physician;
    next();
  } catch (error) {
    console.error('Error in validateCompactEligibility:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to validate DEA registration requirements
 */
export const validateDEARequirements = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { physicianId, state } = req.body;

    if (!physicianId) {
      return res.status(400).json({ error: 'Physician ID is required' });
    }

    const physician = await storage.getPhysician(physicianId);
    if (!physician) {
      return res.status(404).json({ error: 'Physician not found' });
    }

    // All providers need valid state license before DEA
    const licenses = await storage.getPhysicianLicenses(physicianId);
    const stateLicense = licenses.find(l => l.state === state);
    
    if (!stateLicense) {
      return res.status(400).json({ 
        error: `Active state license required in ${state} before DEA registration` 
      });
    }

    // Check if DEA already exists for this state
    const existingDEA = await storage.getDeaRegistrationByState(physicianId, state);
    if (existingDEA && req.method === 'POST') {
      return res.status(409).json({ 
        error: `DEA registration already exists for ${state}` 
      });
    }

    req.physician = physician;
    next();
  } catch (error) {
    console.error('Error in validateDEARequirements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to validate CSR requirements
 */
export const validateCSRRequirements = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { physicianId, state } = req.body;

    if (!physicianId || !state) {
      return res.status(400).json({ error: 'Physician ID and state are required' });
    }

    const physician = await storage.getPhysician(physicianId);
    if (!physician) {
      return res.status(404).json({ error: 'Physician not found' });
    }

    // CSR requires active DEA in the same state
    const deaRegistration = await storage.getDeaRegistrationByState(physicianId, state);
    if (!deaRegistration) {
      return res.status(400).json({ 
        error: `DEA registration required in ${state} before CSR license` 
      });
    }

    // Check DEA expiration
    const deaStatus = checkLicenseExpiration(deaRegistration.expireDate);
    if (deaStatus.status === 'expired') {
      return res.status(400).json({ 
        error: 'DEA registration is expired and must be renewed before CSR' 
      });
    }

    // Check if CSR already exists for this state
    const existingCSR = await storage.getCsrLicenseByState(physicianId, state);
    if (existingCSR && req.method === 'POST') {
      return res.status(409).json({ 
        error: `CSR license already exists for ${state}` 
      });
    }

    req.physician = physician;
    next();
  } catch (error) {
    console.error('Error in validateCSRRequirements:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};