import { Router } from 'express';
import { createStorage } from './storage';
import {
  insertProfileSchema,
  insertPhysicianSchema,
  insertPhysicianLicenseSchema,
  insertPhysicianCertificationSchema,
  insertPhysicianEducationSchema,
  insertPhysicianWorkHistorySchema,
  insertPhysicianHospitalAffiliationSchema,
  insertPhysicianComplianceSchema,
  insertPhysicianDocumentSchema,
  insertUserSettingsSchema,
  insertUserSchema,
  insertDeaRegistrationSchema,
  insertCsrLicenseSchema,
  insertNotificationSchema,
  type SelectPhysician,
  type SelectPhysicianLicense,
  type SelectPhysicianCertification,
  type SelectPhysicianEducation,
  type SelectPhysicianWorkHistory,
  type SelectPhysicianHospitalAffiliation,
  type SelectPhysicianCompliance,
  type SelectPhysicianDocument,
  type SelectUserSettings,
  type SelectUser,
  type SelectDeaRegistration,
  type SelectCsrLicense,
  type SelectNotification
} from '../shared/schema';
import { z } from 'zod';
import { ObjectStorageService, ObjectNotFoundError } from './objectStorage';
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  generateJWT,
  getSessionExpiry,
  isAccountLocked,
  validatePasswordComplexity,
  authMiddleware,
  adminMiddleware,
  getIpAddress,
  getUserAgent,
  getCookieOptions,
  clearAuthCookie,
  MAX_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION_MINUTES
} from './auth';
import rateLimit from 'express-rate-limit';
import {
  validateProviderRolePermissions,
  validateLicenseCreation,
  validateProviderRequirements,
  checkSupervisionRequirements,
  validateDocumentRequirements,
  checkLicenseStatus,
  validateCompactEligibility,
  validateDEARequirements,
  validateCSRRequirements
} from './middleware/role-validation';
import {
  computeDEARenewal,
  computeCSRRenewal,
  checkLicenseExpiration,
  calculateRenewalTimeline
} from './validation/license-validation';
import { NotificationService } from './services/notification-service';
import { getScheduler } from './services/scheduler';
import { documentService, type DocumentAuditEntry } from './services/document-service';
import multer from 'multer';
import { type SelectLicenseDocument, insertLicenseDocumentSchema } from '../shared/schema';

const router = Router();
const storage = createStorage();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Rate limiter for login endpoint
const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 attempts per minute
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for registration endpoint (more restrictive)
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 registration attempts per 15 minutes
  message: 'Too many registration attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper function for error handling
const asyncHandler = (fn: Function) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ============================
// AUTHENTICATION ROUTES (No auth required except where specified)
// ============================

// POST /api/auth/register - Create new user (admin-only)
router.post('/auth/register', authMiddleware, adminMiddleware, registerLimiter, asyncHandler(async (req: any, res: any) => {
  const { email, username, password, role = 'staff' } = req.body;
  
  // Validate input
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Email, username, and password are required' });
  }
  
  // Validate password complexity
  const passwordValidation = validatePasswordComplexity(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ 
      error: 'Password does not meet complexity requirements',
      details: passwordValidation.errors 
    });
  }
  
  // Check if user already exists
  const existingEmail = await storage.getUserByEmail(email);
  if (existingEmail) {
    return res.status(409).json({ error: 'User with this email already exists' });
  }
  
  const existingUsername = await storage.getUserByUsername(username);
  if (existingUsername) {
    return res.status(409).json({ error: 'User with this username already exists' });
  }
  
  // Hash password and create user
  const passwordHash = await hashPassword(password);
  const user = await storage.createUser({
    email,
    username,
    passwordHash,
    role,
    isActive: true,
    failedLoginAttempts: 0,
    twoFactorEnabled: false
  });
  
  // Create default profile for the user
  await storage.createProfile({
    userId: user.id,
    email: user.email,
    fullName: username, // Default to username, can be updated later
    role: user.role
  });
  
  // Return user without sensitive data
  const { passwordHash: _, twoFactorSecret: __, ...safeUser } = user;
  res.status(201).json({ 
    message: 'User created successfully',
    user: safeUser 
  });
}));

// POST /api/auth/signup - Public user registration
router.post('/auth/signup', registerLimiter, asyncHandler(async (req: any, res: any) => {
  const { email, username, password, fullName } = req.body;
  
  // Validate input
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Email, username, and password are required' });
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address' });
  }
  
  // Validate password complexity
  const passwordValidation = validatePasswordComplexity(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ 
      error: 'Password does not meet complexity requirements',
      details: passwordValidation.errors 
    });
  }
  
  // Check if user already exists
  const existingEmail = await storage.getUserByEmail(email);
  if (existingEmail) {
    return res.status(409).json({ error: 'User with this email already exists' });
  }
  
  const existingUsername = await storage.getUserByUsername(username);
  if (existingUsername) {
    return res.status(409).json({ error: 'User with this username already exists' });
  }
  
  // Hash password and create user - default role is 'staff' for public signups
  const passwordHash = await hashPassword(password);
  const user = await storage.createUser({
    email,
    username,
    passwordHash,
    role: 'staff', // Public signups get staff role by default
    isActive: true,
    failedLoginAttempts: 0,
    twoFactorEnabled: false
  });
  
  // Create default profile for the user
  await storage.createProfile({
    userId: user.id,
    email: user.email,
    fullName: fullName || username, // Use provided fullName or default to username
    role: user.role
  });
  
  // Generate session and JWT for immediate login after signup
  const sessionToken = generateSessionToken();
  const expiresAt = getSessionExpiry(false); // Don't remember by default
  const jwtToken = generateJWT(user.id, sessionToken);
  
  // Create session
  const session = await storage.createSession({
    userId: user.id,
    sessionToken,
    expiresAt,
    ipAddress: getIpAddress(req),
    userAgent: getUserAgent(req)
  });
  
  // Get the created profile
  const profile = await storage.getProfile(user.id);
  
  // Set secure HTTP-only cookie
  res.cookie('sessionToken', jwtToken, getCookieOptions());
  
  // Return user without sensitive data and include profile
  const { passwordHash: _, twoFactorSecret: __, ...safeUser } = user;
  res.status(201).json({ 
    message: 'Account created successfully',
    user: safeUser,
    profile,
    sessionExpiresAt: expiresAt.toISOString()
  });
}));

// POST /api/auth/login - Login user
router.post('/auth/login', loginLimiter, asyncHandler(async (req: any, res: any) => {
  const { username, password, rememberMe = false } = req.body;
  
  // Validate input
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  // Find user by username or email
  let user = await storage.getUserByUsername(username);
  if (!user) {
    user = await storage.getUserByEmail(username);
  }
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Check if account is locked
  if (isAccountLocked(user)) {
    const lockoutUntil = user.lockedUntil ? new Date(user.lockedUntil) : null;
    return res.status(403).json({ 
      error: 'Account is locked due to too many failed login attempts',
      lockedUntil: lockoutUntil 
    });
  }
  
  // Check if account is active
  if (!user.isActive) {
    return res.status(403).json({ error: 'Account is deactivated' });
  }
  
  // Verify password
  const isValidPassword = await verifyPassword(password, user.passwordHash);
  if (!isValidPassword) {
    // Increment failed login attempts
    const newAttempts = user.failedLoginAttempts + 1;
    await storage.updateLoginAttempts(user.id, newAttempts);
    
    // Lock account if too many failed attempts
    if (newAttempts >= 5) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + 15);
      await storage.lockUserAccount(user.id, lockUntil);
      return res.status(403).json({ 
        error: 'Account locked due to too many failed login attempts',
        lockedUntil: lockUntil 
      });
    }
    
    return res.status(401).json({ 
      error: 'Invalid credentials',
      remainingAttempts: 5 - newAttempts 
    });
  }
  
  // Reset failed login attempts on successful login
  if (user.failedLoginAttempts > 0) {
    await storage.updateLoginAttempts(user.id, 0);
  }
  
  // Update last login time
  await storage.updateLastLoginAt(user.id);
  
  // Delete any expired sessions
  await storage.deleteExpiredSessions();
  
  // Create new session
  const sessionToken = generateSessionToken();
  const expiresAt = getSessionExpiry(rememberMe);
  const session = await storage.createSession({
    userId: user.id,
    sessionToken,
    expiresAt,
    ipAddress: getIpAddress(req),
    userAgent: getUserAgent(req)
  });
  
  // Generate JWT with session token
  const jwt = generateJWT(user.id, sessionToken);
  
  // Set cookie with JWT
  res.cookie('sessionToken', jwt, getCookieOptions(rememberMe));
  
  // Get user profile
  const profile = await storage.getProfile(user.id);
  
  // Return user info without sensitive data
  const { passwordHash: _, twoFactorSecret: __, ...safeUser } = user;
  res.json({ 
    message: 'Login successful',
    user: safeUser,
    profile,
    sessionExpiresAt: expiresAt 
  });
}));

// POST /api/auth/logout - Logout user
router.post('/auth/logout', authMiddleware, asyncHandler(async (req: any, res: any) => {
  // Delete the session
  if (req.sessionToken) {
    await storage.deleteSession(req.sessionToken);
  }
  
  // Clear the cookie
  clearAuthCookie(res);
  
  res.json({ message: 'Logout successful' });
}));

// POST /api/auth/unlock-session - Unlock a locked session
router.post('/auth/unlock-session', authMiddleware, asyncHandler(async (req: any, res: any) => {
  const { password } = req.body;
  
  // Validate input
  if (!password) {
    return res.status(400).json({ error: 'Password is required' });
  }
  
  if (!req.user) {
    return res.status(401).json({ error: 'User not found in session' });
  }
  
  // Verify the password
  const isValidPassword = await verifyPassword(password, req.user.passwordHash);
  
  if (!isValidPassword) {
    // Increment failed attempts
    const newAttempts = (req.user.failedLoginAttempts || 0) + 1;
    await storage.updateLoginAttempts(req.user.id, newAttempts);
    
    // Check if account should be locked
    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + LOCKOUT_DURATION_MINUTES);
      await storage.lockUserAccount(req.user.id, lockUntil);
      
      return res.status(403).json({ 
        error: 'Account locked due to too many failed attempts',
        lockedUntil: lockUntil.toISOString()
      });
    }
    
    return res.status(401).json({ 
      error: 'Invalid password',
      attemptsRemaining: MAX_LOGIN_ATTEMPTS - newAttempts
    });
  }
  
  // Reset failed attempts on successful unlock
  if (req.user.failedLoginAttempts > 0) {
    await storage.updateLoginAttempts(req.user.id, 0);
  }
  
  // Update session last activity
  await storage.updateLastLoginAt(req.user.id);
  
  res.json({ 
    success: true,
    message: 'Session unlocked successfully'
  });
}));

// POST /api/auth/extend-session - Extend current session
router.post('/auth/extend-session', authMiddleware, asyncHandler(async (req: any, res: any) => {
  if (!req.session || !req.sessionToken) {
    return res.status(401).json({ error: 'No active session' });
  }
  
  // Extend session by default duration
  const newExpiry = getSessionExpiry(false); // Not using remember me for extension
  const updatedSession = await storage.extendSession(req.sessionToken, newExpiry);
  
  // Update last activity
  await storage.updateLastLoginAt(req.user!.id);
  
  res.json({ 
    success: true,
    sessionExpiresAt: updatedSession.expiresAt,
    message: 'Session extended successfully'
  });
}));

// GET /api/auth/activity-log - Get user's activity log
router.get('/auth/activity-log', authMiddleware, asyncHandler(async (req: any, res: any) => {
  // In a real app, this would fetch from database
  // For now, return empty array as placeholder
  res.json({ 
    activities: [],
    message: 'Activity log endpoint not fully implemented yet'
  });
}));

// GET /api/auth/me - Get current user info
router.get('/auth/me', authMiddleware, asyncHandler(async (req: any, res: any) => {
  // Get user profile
  let profile = await storage.getProfile(req.user!.id);
  
  // 🚧 TEMPORARY UAT BYPASS - Create mock profile if none exists in bypass mode
  if (!profile && process.env.BYPASS_AUTH === 'true' && req.user!.id === 'bypass-user-id') {
    console.log('🚧 Creating mock profile for UAT bypass mode');
    profile = {
      id: 'bypass-profile-id',
      userId: 'bypass-user-id',
      email: 'uat@physiciancrm.com',
      fullName: 'UAT Test Administrator',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  // Get user settings - handle if it doesn't exist
  let settings: any = null;
  try {
    settings = await storage.getUserSettings(req.user!.id);
  } catch (error) {
    // Settings might not exist yet, that's okay
    console.debug('User settings not found for user:', req.user!.id);
  }
  
  // Return user info without sensitive data
  const { passwordHash: _, twoFactorSecret: __, ...safeUser } = req.user!;
  res.json({ 
    user: safeUser,
    profile,
    settings,
    sessionExpiresAt: req.session!.expiresAt 
  });
}));

// POST /api/auth/change-password - Change password for authenticated user
router.post('/auth/change-password', authMiddleware, asyncHandler(async (req: any, res: any) => {
  const { currentPassword, newPassword } = req.body;
  
  // Validate input
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }
  
  // Validate new password complexity
  const passwordValidation = validatePasswordComplexity(newPassword);
  if (!passwordValidation.valid) {
    return res.status(400).json({ 
      error: 'New password does not meet complexity requirements',
      details: passwordValidation.errors 
    });
  }
  
  // Verify current password
  const isValidPassword = await verifyPassword(currentPassword, req.user!.passwordHash);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  
  // Check if new password is different from current
  const isSamePassword = await verifyPassword(newPassword, req.user!.passwordHash);
  if (isSamePassword) {
    return res.status(400).json({ error: 'New password must be different from current password' });
  }
  
  // Hash new password and update
  const newPasswordHash = await hashPassword(newPassword);
  await storage.updateUser(req.user!.id, { 
    passwordHash: newPasswordHash,
    lastPasswordChangeAt: new Date()
  });
  
  // Invalidate all other sessions for security
  await storage.deleteUserSessions(req.user!.id);
  
  // Create new session for current connection
  const sessionToken = generateSessionToken();
  const expiresAt = getSessionExpiry(false);
  await storage.createSession({
    userId: req.user!.id,
    sessionToken,
    expiresAt,
    ipAddress: getIpAddress(req),
    userAgent: getUserAgent(req)
  });
  
  // Generate new JWT with new session token
  const jwt = generateJWT(req.user!.id, sessionToken);
  
  // Set new cookie
  res.cookie('sessionToken', jwt, getCookieOptions(false));
  
  res.json({ message: 'Password changed successfully' });
}));

// POST /api/auth/unlock/:userId - Admin endpoint to unlock accounts
router.post('/auth/unlock/:userId', authMiddleware, adminMiddleware, asyncHandler(async (req: any, res: any) => {
  const { userId } = req.params;
  
  // Check if user exists
  const user = await storage.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  // Unlock the account
  await storage.unlockUserAccount(userId);
  await storage.updateLoginAttempts(userId, 0);
  
  res.json({ 
    message: 'Account unlocked successfully',
    user: {
      id: user.id,
      email: user.email,
      username: user.username
    }
  });
}));

// POST /api/auth/sessions/cleanup - Admin endpoint to cleanup expired sessions
router.post('/auth/sessions/cleanup', authMiddleware, adminMiddleware, asyncHandler(async (req: any, res: any) => {
  await storage.deleteExpiredSessions();
  res.json({ message: 'Expired sessions cleaned up successfully' });
}));

// GET /api/auth/sessions/:userId - Admin endpoint to get user sessions
router.get('/auth/sessions/:userId', authMiddleware, adminMiddleware, asyncHandler(async (req: any, res: any) => {
  const { userId } = req.params;
  
  // Check if user exists
  const user = await storage.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const sessions = await storage.getUserSessions(userId);
  res.json({ sessions });
}));

// DELETE /api/auth/sessions/:userId - Admin endpoint to revoke all user sessions
router.delete('/auth/sessions/:userId', authMiddleware, adminMiddleware, asyncHandler(async (req: any, res: any) => {
  const { userId } = req.params;
  
  // Check if user exists
  const user = await storage.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  await storage.deleteUserSessions(userId);
  res.json({ message: 'All user sessions revoked successfully' });
}));

// ============================
// APPLY AUTHENTICATION MIDDLEWARE
// All routes below this point require authentication
// ============================
router.use((req: any, res: any, next: any) => {
  // Skip authentication for auth routes (already handled above)
  if (req.path.startsWith('/auth/')) {
    return next();
  }
  
  // Apply authentication middleware for all other routes
  authMiddleware(req, res, next);
});

// ============================
// PROTECTED ROUTES (Authentication required)
// ============================

// Profile routes
router.post('/profiles', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertProfileSchema.parse(req.body);
  const profile = await storage.createProfile(validatedData);
  res.status(201).json(profile);
}));

router.get('/profiles', asyncHandler(async (req: any, res: any) => {
  const profiles = await storage.getAllProfiles();
  res.json(profiles);
}));

router.get('/profiles/:id', asyncHandler(async (req: any, res: any) => {
  const profile = await storage.getProfileById(req.params.id);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  res.json(profile);
}));

router.get('/profiles/user/:userId', asyncHandler(async (req: any, res: any) => {
  const profile = await storage.getProfile(req.params.userId);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  res.json(profile);
}));

router.put('/profiles/:id', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertProfileSchema.partial().parse(req.body);
  const profile = await storage.updateProfile(req.params.id, validatedData);
  res.json(profile);
}));

router.delete('/profiles/:id', asyncHandler(async (req: any, res: any) => {
  await storage.deleteProfile(req.params.id);
  res.status(204).send();
}));

// Physician routes
router.post('/physicians', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianSchema.parse(req.body);
  const physician = await storage.createPhysician(validatedData);
  res.status(201).json(physician);
}));

router.get('/physicians', asyncHandler(async (req: any, res: any) => {
  const { search, status, limit, offset } = req.query;
  
  let physicians: SelectPhysician[];
  
  if (search) {
    physicians = await storage.searchPhysicians(search as string);
  } else if (status) {
    physicians = await storage.getPhysiciansByStatus(status as string);
  } else {
    physicians = await storage.getAllPhysicians();
  }
  
  // Apply pagination if specified
  if (limit || offset) {
    const startIndex = parseInt(offset as string) || 0;
    const endIndex = startIndex + (parseInt(limit as string) || physicians.length);
    physicians = physicians.slice(startIndex, endIndex);
  }
  
  res.json({
    physicians,
    total: physicians.length,
    pagination: {
      limit: parseInt(limit as string) || null,
      offset: parseInt(offset as string) || 0
    }
  });
}));

router.get('/physicians/:id', asyncHandler(async (req: any, res: any) => {
  const physician = await storage.getPhysician(req.params.id);
  if (!physician) {
    return res.status(404).json({ error: 'Physician not found' });
  }
  res.json(physician);
}));

router.get('/physicians/:id/full', asyncHandler(async (req: any, res: any) => {
  const fullProfile = await storage.getPhysicianFullProfile(req.params.id);
  if (!fullProfile.physician) {
    return res.status(404).json({ error: 'Physician not found' });
  }
  res.json(fullProfile);
}));

router.get('/physicians/npi/:npi', asyncHandler(async (req: any, res: any) => {
  const physician = await storage.getPhysicianByNpi(req.params.npi);
  if (!physician) {
    return res.status(404).json({ error: 'Physician not found' });
  }
  res.json(physician);
}));

router.put('/physicians/:id', 
  validateProviderRolePermissions,
  validateProviderRequirements,
  asyncHandler(async (req: any, res: any) => {
    const validatedData = insertPhysicianSchema.partial().parse(req.body);
    const physician = await storage.updatePhysician(req.params.id, validatedData);
    
    // Include any validation warnings in the response
    const response: any = { ...physician };
    if (req.validationErrors && req.validationErrors.length > 0) {
      response.warnings = req.validationErrors;
    }
    
    res.json(response);
  })
);

router.delete('/physicians/:id', asyncHandler(async (req: any, res: any) => {
  await storage.deletePhysician(req.params.id);
  res.status(204).send();
}));

// Physician License routes
router.post('/physicians/:physicianId/licenses', 
  validateLicenseCreation,
  checkSupervisionRequirements,
  validateCompactEligibility,
  asyncHandler(async (req: any, res: any) => {
    const validatedData = insertPhysicianLicenseSchema.parse({
      ...req.body,
      physicianId: req.params.physicianId
    });
    const license = await storage.createPhysicianLicense(validatedData);
    
    // Calculate and store renewal reminders if this is a new license
    if (license.expirationDate) {
      const expirationStatus = checkLicenseExpiration(license.expirationDate);
      const renewalTimeline = calculateRenewalTimeline(
        new Date(), // Use current date as licenses don't have issueDate
        2 // Default 2-year cycle for licenses
      );
      
      // Return enhanced license info with expiration status
      res.status(201).json({
        ...license,
        expirationStatus,
        renewalTimeline: renewalTimeline.filter(item => item.daysFromNow > 0)
      });
    } else {
      res.status(201).json(license);
    }
  })
);

router.get('/physicians/:physicianId/licenses', asyncHandler(async (req: any, res: any) => {
  const licenses = await storage.getPhysicianLicenses(req.params.physicianId);
  res.json(licenses);
}));

router.get('/licenses/:id', asyncHandler(async (req: any, res: any) => {
  const license = await storage.getPhysicianLicense(req.params.id);
  if (!license) {
    return res.status(404).json({ error: 'License not found' });
  }
  res.json(license);
}));

router.get('/licenses/expiring/:days', asyncHandler(async (req: any, res: any) => {
  const days = parseInt(req.params.days);
  if (isNaN(days) || days < 0) {
    return res.status(400).json({ error: 'Days must be a non-negative number' });
  }
  const licenses = await storage.getExpiringLicenses(days);
  res.json(licenses);
}));

router.put('/licenses/:id', 
  checkLicenseStatus,
  asyncHandler(async (req: any, res: any) => {
    const validatedData = insertPhysicianLicenseSchema.partial().parse(req.body);
    const license = await storage.updatePhysicianLicense(req.params.id, validatedData);
    
    // Include expiration status in response
    const expirationStatus = req.body.expirationStatus || checkLicenseExpiration(license.expirationDate);
    
    res.json({
      ...license,
      expirationStatus
    });
  })
);

router.delete('/licenses/:id', asyncHandler(async (req: any, res: any) => {
  await storage.deletePhysicianLicense(req.params.id);
  res.status(204).send();
}));

// Physician Certification routes
router.post('/physicians/:physicianId/certifications', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianCertificationSchema.parse({
    ...req.body,
    physicianId: req.params.physicianId
  });
  const certification = await storage.createPhysicianCertification(validatedData);
  res.status(201).json(certification);
}));

router.get('/physicians/:physicianId/certifications', asyncHandler(async (req: any, res: any) => {
  const certifications = await storage.getPhysicianCertifications(req.params.physicianId);
  res.json(certifications);
}));

router.get('/certifications/:id', asyncHandler(async (req: any, res: any) => {
  const certification = await storage.getPhysicianCertification(req.params.id);
  if (!certification) {
    return res.status(404).json({ error: 'Certification not found' });
  }
  res.json(certification);
}));

router.get('/certifications/expiring/:days', asyncHandler(async (req: any, res: any) => {
  const days = parseInt(req.params.days);
  if (isNaN(days) || days < 0) {
    return res.status(400).json({ error: 'Days must be a non-negative number' });
  }
  const certifications = await storage.getExpiringCertifications(days);
  res.json(certifications);
}));

router.put('/certifications/:id', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianCertificationSchema.partial().parse(req.body);
  const certification = await storage.updatePhysicianCertification(req.params.id, validatedData);
  res.json(certification);
}));

router.delete('/certifications/:id', asyncHandler(async (req: any, res: any) => {
  await storage.deletePhysicianCertification(req.params.id);
  res.status(204).send();
}));

// Physician Education routes
router.post('/physicians/:physicianId/education', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianEducationSchema.parse({
    ...req.body,
    physicianId: req.params.physicianId
  });
  const education = await storage.createPhysicianEducation(validatedData);
  res.status(201).json(education);
}));

router.get('/physicians/:physicianId/education', asyncHandler(async (req: any, res: any) => {
  const education = await storage.getPhysicianEducations(req.params.physicianId);
  res.json(education);
}));

router.get('/education/:id', asyncHandler(async (req: any, res: any) => {
  const education = await storage.getPhysicianEducation(req.params.id);
  if (!education) {
    return res.status(404).json({ error: 'Education record not found' });
  }
  res.json(education);
}));

router.put('/education/:id', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianEducationSchema.partial().parse(req.body);
  const education = await storage.updatePhysicianEducation(req.params.id, validatedData);
  res.json(education);
}));

router.delete('/education/:id', asyncHandler(async (req: any, res: any) => {
  await storage.deletePhysicianEducation(req.params.id);
  res.status(204).send();
}));

// Physician Work History routes
router.post('/physicians/:physicianId/work-history', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianWorkHistorySchema.parse({
    ...req.body,
    physicianId: req.params.physicianId
  });
  const workHistory = await storage.createPhysicianWorkHistory(validatedData);
  res.status(201).json(workHistory);
}));

router.get('/physicians/:physicianId/work-history', asyncHandler(async (req: any, res: any) => {
  const workHistory = await storage.getPhysicianWorkHistories(req.params.physicianId);
  res.json(workHistory);
}));

router.get('/work-history/:id', asyncHandler(async (req: any, res: any) => {
  const workHistory = await storage.getPhysicianWorkHistory(req.params.id);
  if (!workHistory) {
    return res.status(404).json({ error: 'Work history not found' });
  }
  res.json(workHistory);
}));

router.put('/work-history/:id', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianWorkHistorySchema.partial().parse(req.body);
  const workHistory = await storage.updatePhysicianWorkHistory(req.params.id, validatedData);
  res.json(workHistory);
}));

router.delete('/work-history/:id', asyncHandler(async (req: any, res: any) => {
  await storage.deletePhysicianWorkHistory(req.params.id);
  res.status(204).send();
}));

// Physician Hospital Affiliation routes
router.post('/physicians/:physicianId/hospital-affiliations', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianHospitalAffiliationSchema.parse({
    ...req.body,
    physicianId: req.params.physicianId
  });
  const affiliation = await storage.createPhysicianHospitalAffiliation(validatedData);
  res.status(201).json(affiliation);
}));

router.get('/physicians/:physicianId/hospital-affiliations', asyncHandler(async (req: any, res: any) => {
  const affiliations = await storage.getPhysicianHospitalAffiliations(req.params.physicianId);
  res.json(affiliations);
}));

router.get('/hospital-affiliations/:id', asyncHandler(async (req: any, res: any) => {
  const affiliation = await storage.getPhysicianHospitalAffiliation(req.params.id);
  if (!affiliation) {
    return res.status(404).json({ error: 'Hospital affiliation not found' });
  }
  res.json(affiliation);
}));

router.put('/hospital-affiliations/:id', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianHospitalAffiliationSchema.partial().parse(req.body);
  const affiliation = await storage.updatePhysicianHospitalAffiliation(req.params.id, validatedData);
  res.json(affiliation);
}));

router.delete('/hospital-affiliations/:id', asyncHandler(async (req: any, res: any) => {
  await storage.deletePhysicianHospitalAffiliation(req.params.id);
  res.status(204).send();
}));

// Physician Compliance routes
router.post('/physicians/:physicianId/compliance', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianComplianceSchema.parse({
    ...req.body,
    physicianId: req.params.physicianId
  });
  const compliance = await storage.createPhysicianCompliance(validatedData);
  res.status(201).json(compliance);
}));

router.get('/physicians/:physicianId/compliance', asyncHandler(async (req: any, res: any) => {
  const compliance = await storage.getPhysicianComplianceByPhysicianId(req.params.physicianId);
  if (!compliance) {
    return res.status(404).json({ error: 'Compliance record not found' });
  }
  res.json(compliance);
}));

router.get('/compliance/:id', asyncHandler(async (req: any, res: any) => {
  const compliance = await storage.getPhysicianCompliance(req.params.id);
  if (!compliance) {
    return res.status(404).json({ error: 'Compliance record not found' });
  }
  res.json(compliance);
}));

router.put('/compliance/:id', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianComplianceSchema.partial().parse(req.body);
  const compliance = await storage.updatePhysicianCompliance(req.params.id, validatedData);
  res.json(compliance);
}));

router.delete('/compliance/:id', asyncHandler(async (req: any, res: any) => {
  await storage.deletePhysicianCompliance(req.params.id);
  res.status(204).send();
}));

// Physician Document routes
router.post('/physicians/:physicianId/documents', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianDocumentSchema.parse({
    ...req.body,
    physicianId: req.params.physicianId
  });
  const document = await storage.createPhysicianDocument(validatedData);
  res.status(201).json(document);
}));

router.get('/physicians/:physicianId/documents', asyncHandler(async (req: any, res: any) => {
  const { type } = req.query;
  let documents: SelectPhysicianDocument[];
  
  if (type) {
    documents = await storage.getPhysicianDocumentsByType(req.params.physicianId, type as string);
  } else {
    documents = await storage.getPhysicianDocuments(req.params.physicianId);
  }
  
  res.json(documents);
}));

router.get('/documents/:id', asyncHandler(async (req: any, res: any) => {
  const document = await storage.getPhysicianDocument(req.params.id);
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }
  res.json(document);
}));

router.put('/documents/:id', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianDocumentSchema.partial().parse(req.body);
  const document = await storage.updatePhysicianDocument(req.params.id, validatedData);
  res.json(document);
}));

router.delete('/documents/:id', asyncHandler(async (req: any, res: any) => {
  await storage.deletePhysicianDocument(req.params.id);
  res.status(204).send();
}));

// Analytics and reporting routes
router.get('/analytics/physicians/status-summary', asyncHandler(async (req: any, res: any) => {
  const physicians = await storage.getAllPhysicians();
  const statusCounts = physicians.reduce((acc, physician) => {
    const status = physician.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  res.json({
    total: physicians.length,
    statusBreakdown: statusCounts
  });
}));

router.get('/analytics/licenses/expiration-report', asyncHandler(async (req: any, res: any) => {
  const { days = 30 } = req.query;
  const daysNum = parseInt(days as string);
  
  if (isNaN(daysNum) || daysNum < 0) {
    return res.status(400).json({ error: 'Days must be a non-negative number' });
  }
  
  const expiringLicenses = await storage.getExpiringLicenses(daysNum);
  const expiredLicenses = await storage.getExpiringLicenses(0);
  
  res.json({
    expiringWithinDays: expiringLicenses.length,
    alreadyExpired: expiredLicenses.length,
    licenses: expiringLicenses,
    reportGeneratedAt: new Date().toISOString()
  });
}));

router.get('/analytics/certifications/expiration-report', asyncHandler(async (req: any, res: any) => {
  const { days = 30 } = req.query;
  const daysNum = parseInt(days as string);
  
  if (isNaN(daysNum) || daysNum < 0) {
    return res.status(400).json({ error: 'Days must be a non-negative number' });
  }
  
  const expiringCertifications = await storage.getExpiringCertifications(daysNum);
  const expiredCertifications = await storage.getExpiringCertifications(0);
  
  res.json({
    expiringWithinDays: expiringCertifications.length,
    alreadyExpired: expiredCertifications.length,
    certifications: expiringCertifications,
    reportGeneratedAt: new Date().toISOString()
  });
}));

// Bulk operations
router.post('/physicians/bulk', asyncHandler(async (req: any, res: any) => {
  const { physicians } = req.body;
  
  if (!Array.isArray(physicians)) {
    return res.status(400).json({ error: 'Physicians must be an array' });
  }
  
  const results: Array<{index: number, success: true, data: SelectPhysician}> = [];
  const errors: Array<{index: number, success: false, error: string}> = [];
  
  for (let i = 0; i < physicians.length; i++) {
    try {
      const validatedData = insertPhysicianSchema.parse(physicians[i]);
      const physician = await storage.createPhysician(validatedData);
      results.push({ index: i, success: true, data: physician });
    } catch (error) {
      errors.push({ 
        index: i, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
  
  res.json({
    totalProcessed: physicians.length,
    successful: results.length,
    failed: errors.length,
    results,
    errors
  });
}));

// Document Upload routes
router.post('/documents/upload-url/:physicianId', asyncHandler(async (req: any, res: any) => {
  const { physicianId } = req.params;
  
  // Verify physician exists
  const physician = await storage.getPhysician(physicianId);
  if (!physician) {
    return res.status(404).json({ error: 'Physician not found' });
  }
  
  try {
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getDocumentUploadURL(physicianId);
    res.json({ uploadURL });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
}));

router.post('/documents', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianDocumentSchema.parse(req.body);
  const document = await storage.createPhysicianDocument(validatedData);
  res.status(201).json(document);
}));

router.get('/documents/:id/download', asyncHandler(async (req: any, res: any) => {
  try {
    const document = await storage.getPhysicianDocument(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const objectStorageService = new ObjectStorageService();
    const file = await objectStorageService.getDocumentFile(document.filePath);
    await objectStorageService.downloadDocument(file, res);
  } catch (error) {
    console.error('Error downloading document:', error);
    if (error instanceof ObjectNotFoundError) {
      return res.status(404).json({ error: 'Document file not found' });
    }
    return res.status(500).json({ error: 'Failed to download document' });
  }
}));

// DEA Registration routes
router.post('/physicians/:physicianId/dea', 
  validateDEARequirements,
  asyncHandler(async (req: any, res: any) => {
    const validatedData = insertDeaRegistrationSchema.parse({
      ...req.body,
      physicianId: req.params.physicianId
    });
    const deaRegistration = await storage.createDeaRegistration(validatedData);
    
    // Calculate renewal reminders
    const renewalInfo = computeDEARenewal(deaRegistration);
    
    res.status(201).json({
      ...deaRegistration,
      renewalInfo
    });
  })
);

router.get('/physicians/:physicianId/dea', asyncHandler(async (req: any, res: any) => {
  const deaRegistrations = await storage.getDeaRegistrationsByPhysician(req.params.physicianId);
  
  // Add renewal info to each registration
  const registrationsWithRenewal = deaRegistrations.map(dea => ({
    ...dea,
    renewalInfo: computeDEARenewal(dea),
    expirationStatus: checkLicenseExpiration(dea.expireDate)
  }));
  
  res.json(registrationsWithRenewal);
}));

router.get('/physicians/:physicianId/dea/:state', asyncHandler(async (req: any, res: any) => {
  const deaRegistration = await storage.getDeaRegistrationByState(
    req.params.physicianId,
    req.params.state
  );
  
  if (!deaRegistration) {
    return res.status(404).json({ error: 'DEA registration not found for this state' });
  }
  
  res.json({
    ...deaRegistration,
    renewalInfo: computeDEARenewal(deaRegistration),
    expirationStatus: checkLicenseExpiration(deaRegistration.expireDate)
  });
}));

router.get('/dea/:id', asyncHandler(async (req: any, res: any) => {
  const deaRegistration = await storage.getDeaRegistration(req.params.id);
  if (!deaRegistration) {
    return res.status(404).json({ error: 'DEA registration not found' });
  }
  
  res.json({
    ...deaRegistration,
    renewalInfo: computeDEARenewal(deaRegistration),
    expirationStatus: checkLicenseExpiration(deaRegistration.expireDate)
  });
}));

router.get('/dea/expiring/:days', asyncHandler(async (req: any, res: any) => {
  const days = parseInt(req.params.days);
  if (isNaN(days) || days < 0) {
    return res.status(400).json({ error: 'Days must be a non-negative number' });
  }
  
  const expiringDEAs = await storage.getExpiringDeaRegistrations(days);
  
  const deasWithRenewal = expiringDEAs.map(dea => ({
    ...dea,
    renewalInfo: computeDEARenewal(dea),
    expirationStatus: checkLicenseExpiration(dea.expireDate)
  }));
  
  res.json(deasWithRenewal);
}));

router.put('/dea/:id', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertDeaRegistrationSchema.partial().parse(req.body);
  const deaRegistration = await storage.updateDeaRegistration(req.params.id, validatedData);
  
  res.json({
    ...deaRegistration,
    renewalInfo: computeDEARenewal(deaRegistration),
    expirationStatus: checkLicenseExpiration(deaRegistration.expireDate)
  });
}));

router.delete('/dea/:id', asyncHandler(async (req: any, res: any) => {
  await storage.deleteDeaRegistration(req.params.id);
  res.status(204).send();
}));

// CSR License routes
router.post('/physicians/:physicianId/csr', 
  validateCSRRequirements,
  asyncHandler(async (req: any, res: any) => {
    const validatedData = insertCsrLicenseSchema.parse({
      ...req.body,
      physicianId: req.params.physicianId
    });
    const csrLicense = await storage.createCsrLicense(validatedData);
    
    // Calculate renewal reminders based on state
    const renewalInfo = computeCSRRenewal(csrLicense, req.body.state);
    
    res.status(201).json({
      ...csrLicense,
      renewalInfo
    });
  })
);

router.get('/physicians/:physicianId/csr', asyncHandler(async (req: any, res: any) => {
  const csrLicenses = await storage.getCsrLicensesByPhysician(req.params.physicianId);
  
  // Add renewal info to each license
  const licensesWithRenewal = csrLicenses.map(csr => ({
    ...csr,
    renewalInfo: computeCSRRenewal(csr, csr.state),
    expirationStatus: checkLicenseExpiration(csr.expireDate)
  }));
  
  res.json(licensesWithRenewal);
}));

router.get('/physicians/:physicianId/csr/:state', asyncHandler(async (req: any, res: any) => {
  const csrLicense = await storage.getCsrLicenseByState(
    req.params.physicianId,
    req.params.state
  );
  
  if (!csrLicense) {
    return res.status(404).json({ error: 'CSR license not found for this state' });
  }
  
  res.json({
    ...csrLicense,
    renewalInfo: computeCSRRenewal(csrLicense, csrLicense.state),
    expirationStatus: checkLicenseExpiration(csrLicense.expireDate)
  });
}));

router.get('/csr/:id', asyncHandler(async (req: any, res: any) => {
  const csrLicense = await storage.getCsrLicense(req.params.id);
  if (!csrLicense) {
    return res.status(404).json({ error: 'CSR license not found' });
  }
  
  res.json({
    ...csrLicense,
    renewalInfo: computeCSRRenewal(csrLicense, csrLicense.state),
    expirationStatus: checkLicenseExpiration(csrLicense.expireDate)
  });
}));

router.get('/csr/expiring/:days', asyncHandler(async (req: any, res: any) => {
  const days = parseInt(req.params.days);
  if (isNaN(days) || days < 0) {
    return res.status(400).json({ error: 'Days must be a non-negative number' });
  }
  
  const expiringCSRs = await storage.getExpiringCsrLicenses(days);
  
  const csrsWithRenewal = expiringCSRs.map(csr => ({
    ...csr,
    renewalInfo: computeCSRRenewal(csr, csr.state),
    expirationStatus: checkLicenseExpiration(csr.expireDate)
  }));
  
  res.json(csrsWithRenewal);
}));

router.put('/csr/:id', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertCsrLicenseSchema.partial().parse(req.body);
  const csrLicense = await storage.updateCsrLicense(req.params.id, validatedData);
  
  res.json({
    ...csrLicense,
    renewalInfo: computeCSRRenewal(csrLicense, csrLicense.state),
    expirationStatus: checkLicenseExpiration(csrLicense.expireDate)
  });
}));

router.delete('/csr/:id', asyncHandler(async (req: any, res: any) => {
  await storage.deleteCsrLicense(req.params.id);
  res.status(204).send();
}));

// Provider Role Validation endpoint
router.post('/validate/provider-role', asyncHandler(async (req: any, res: any) => {
  const { physicianId, state } = req.body;
  
  if (!physicianId || !state) {
    return res.status(400).json({ error: 'Physician ID and state are required' });
  }
  
  const physician = await storage.getPhysician(physicianId);
  if (!physician) {
    return res.status(404).json({ error: 'Physician not found' });
  }
  
  // Get role policy and validate (only if provider role is defined)
  const rolePolicy = physician.providerRole 
    ? await storage.getRolePolicyByRoleAndState(physician.providerRole, state)
    : null;
  
  const { validateProviderRole, stateRequiresNPCollaboration, stateRequiresPASupervision, isCompactEligible, getStateBoardType } = require('./validation/license-validation');
  
  const validation = physician.providerRole ? validateProviderRole(physician, state, rolePolicy) : { valid: false, errors: ['Provider role is not defined'] };
  
  res.json({
    valid: validation.valid,
    errors: validation.errors,
    requirements: {
      requiresSupervision: physician.providerRole === 'pa' && stateRequiresPASupervision(state),
      requiresCollaboration: physician.providerRole === 'np' && stateRequiresNPCollaboration(state),
      compactEligible: physician.providerRole ? isCompactEligible(physician.providerRole, state) : false,
      boardType: physician.providerRole ? getStateBoardType(physician.providerRole, state) : 'Unknown'
    },
    rolePolicy
  });
}));

// User Settings routes
router.post('/user-settings', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertUserSettingsSchema.parse(req.body);
  const settings = await storage.createUserSettings(validatedData);
  res.status(201).json(settings);
}));

router.get('/user-settings/:userId', asyncHandler(async (req: any, res: any) => {
  const settings = await storage.getUserSettings(req.params.userId);
  if (!settings) {
    return res.status(404).json({ error: 'User settings not found' });
  }
  res.json(settings);
}));

router.put('/user-settings/:userId', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertUserSettingsSchema.partial().parse(req.body);
  try {
    const settings = await storage.updateUserSettings(req.params.userId, validatedData);
    res.json(settings);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ error: 'User settings not found' });
    }
    throw error;
  }
}));

router.delete('/user-settings/:userId', asyncHandler(async (req: any, res: any) => {
  await storage.deleteUserSettings(req.params.userId);
  res.status(204).send();
}));

// ============================
// NOTIFICATION ROUTES
// ============================

// Initialize notification service and scheduler
const notificationService = new NotificationService(storage);
const scheduler = getScheduler(storage);

// GET /api/notifications/upcoming - Get all upcoming notifications
router.get('/notifications/upcoming', authMiddleware, asyncHandler(async (req: any, res: any) => {
  const days = parseInt(req.query.days as string) || 90;
  const notifications = await notificationService.getUpcomingNotifications(days);
  res.json(notifications);
}));

// GET /api/notifications/physician/:id - Get notifications for specific physician
router.get('/notifications/physician/:id', authMiddleware, asyncHandler(async (req: any, res: any) => {
  const physicianId = req.params.id;
  const notifications = await notificationService.getPhysicianNotifications(physicianId);
  res.json(notifications);
}));

// POST /api/notifications/test/:physicianId - Test notification for a physician
router.post('/notifications/test/:physicianId', authMiddleware, adminMiddleware, asyncHandler(async (req: any, res: any) => {
  const physicianId = req.params.physicianId;
  
  try {
    await scheduler.testPhysicianNotification(physicianId);
    res.json({ message: 'Test notification sent successfully' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to send test notification',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// PUT /api/notifications/:id/mark-read - Mark notification as read
router.put('/notifications/:id/mark-read', authMiddleware, asyncHandler(async (req: any, res: any) => {
  const notificationId = req.params.id;
  await notificationService.markNotificationRead(notificationId);
  res.json({ message: 'Notification marked as read' });
}));

// POST /api/notifications/check-expirations - Manually trigger expiration check (admin only)
router.post('/notifications/check-expirations', authMiddleware, adminMiddleware, asyncHandler(async (req: any, res: any) => {
  await scheduler.runExpirationCheckNow();
  res.json({ message: 'Expiration check completed' });
}));

// POST /api/notifications/process-queue - Manually process notification queue (admin only)
router.post('/notifications/process-queue', authMiddleware, adminMiddleware, asyncHandler(async (req: any, res: any) => {
  await scheduler.processQueueNow();
  res.json({ message: 'Notification queue processed' });
}));

// GET /api/notifications/scheduler/status - Get scheduler status (admin only)
router.get('/notifications/scheduler/status', authMiddleware, adminMiddleware, asyncHandler(async (req: any, res: any) => {
  const status = scheduler.getStatus();
  res.json(status);
}));

// POST /api/notifications/scheduler/start - Start the notification scheduler (admin only)
router.post('/notifications/scheduler/start', authMiddleware, adminMiddleware, asyncHandler(async (req: any, res: any) => {
  await scheduler.start();
  res.json({ message: 'Notification scheduler started' });
}));

// POST /api/notifications/scheduler/stop - Stop the notification scheduler (admin only)
router.post('/notifications/scheduler/stop', authMiddleware, adminMiddleware, asyncHandler(async (req: any, res: any) => {
  scheduler.stop();
  res.json({ message: 'Notification scheduler stopped' });
}));

// ============================
// DOCUMENT MANAGEMENT ROUTES
// ============================

// POST /api/documents/upload - Upload new document or version
router.post('/documents/upload', authMiddleware, upload.single('document'), asyncHandler(async (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { physicianId, documentType, licenseId, deaRegistrationId, csrLicenseId } = req.body;

  if (!physicianId || !documentType) {
    return res.status(400).json({ error: 'physicianId and documentType are required' });
  }

  try {
    const document = await documentService.uploadDocument(
      physicianId,
      documentType,
      {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        buffer: req.file.buffer
      },
      req.user.id,
      {
        licenseId,
        deaRegistrationId,
        csrLicenseId
      }
    );

    res.status(201).json(document);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

// GET /api/documents/physician/:id - Get all documents for physician
router.get('/documents/physician/:id', authMiddleware, asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  const { current } = req.query;

  let documents: SelectLicenseDocument[];
  if (current === 'true') {
    documents = await documentService.getCurrentDocuments(id);
  } else {
    documents = await documentService.getPhysicianDocuments(id);
  }

  res.json(documents);
}));

// GET /api/documents/:id/history - Get version history
router.get('/documents/:physicianId/history/:documentType', authMiddleware, asyncHandler(async (req: any, res: any) => {
  const { physicianId, documentType } = req.params;
  
  const history = await documentService.getDocumentHistory(physicianId, documentType);
  res.json(history);
}));

// PUT /api/documents/:id/current - Set current version
router.put('/documents/:id/current', authMiddleware, asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  
  try {
    const document = await documentService.setCurrentVersion(id, req.user.id);
    res.json(document);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

// DELETE /api/documents/:id - Soft delete/archive document
router.delete('/documents/:id', authMiddleware, asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  
  try {
    await documentService.deleteDocument(id, req.user.id);
    res.json({ message: 'Document archived successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

// GET /api/documents/:id/download - Download specific document
router.get('/documents/:id/download', authMiddleware, asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  
  try {
    const downloadUrl = await documentService.getDocumentDownloadUrl(id);
    res.json({ downloadUrl });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
}));

// GET /api/documents/audit-trail - Get audit trail
router.get('/documents/audit-trail', authMiddleware, asyncHandler(async (req: any, res: any) => {
  const { documentId, physicianId, startDate, endDate } = req.query;
  
  const options: any = {};
  if (documentId) options.documentId = documentId as string;
  if (physicianId) options.physicianId = physicianId as string;
  if (startDate) options.startDate = new Date(startDate as string);
  if (endDate) options.endDate = new Date(endDate as string);
  
  const auditTrail = await documentService.getAuditTrail(options);
  res.json(auditTrail);
}));

// GET /api/documents/:physicianId/stats - Get document statistics
router.get('/documents/:physicianId/stats', authMiddleware, asyncHandler(async (req: any, res: any) => {
  const { physicianId } = req.params;
  
  const stats = await documentService.getDocumentStats(physicianId);
  res.json(stats);
}));

// ============================
// RENEWAL WORKFLOW ROUTES  
// ============================

// POST /api/renewal/initiate - Start renewal workflow
router.post('/renewal/initiate', authMiddleware, asyncHandler(async (req: any, res: any) => {
  const { physicianId, entityType, entityId } = req.body;
  
  if (!physicianId || !entityType || !entityId) {
    return res.status(400).json({ error: 'physicianId, entityType, and entityId are required' });
  }
  
  if (!['license', 'dea', 'csr'].includes(entityType)) {
    return res.status(400).json({ error: 'entityType must be license, dea, or csr' });
  }
  
  try {
    const { renewalService } = await import('./services/renewal-service');
    const workflow = await renewalService.initiateRenewal(physicianId, entityType, entityId, req.user?.id);
    res.status(201).json(workflow);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

// GET /api/renewal/upcoming - Get upcoming renewals
router.get('/renewal/upcoming', authMiddleware, asyncHandler(async (req: any, res: any) => {
  const days = parseInt(req.query.days as string) || 90;
  
  try {
    const { renewalService } = await import('./services/renewal-service');
    const renewals = await renewalService.getUpcomingRenewals(days);
    res.json(renewals);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

// GET /api/renewal/physician/:id - Get all renewals for physician
router.get('/renewal/physician/:id', authMiddleware, asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  
  try {
    const { renewalService } = await import('./services/renewal-service');
    const renewals = await renewalService.getPhysicianRenewals(id);
    res.json(renewals);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

// PUT /api/renewal/:id/status - Update renewal status
router.put('/renewal/:id/status', authMiddleware, asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;
  
  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }
  
  const validStatuses = ['not_started', 'in_progress', 'filed', 'under_review', 'approved', 'rejected', 'expired'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
  }
  
  try {
    const { renewalService } = await import('./services/renewal-service');
    const workflow = await renewalService.updateRenewalStatus(id, status, rejectionReason, req.user?.id);
    res.json(workflow);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

// GET /api/renewal/:id/timeline - Get renewal timeline
router.get('/renewal/:id/timeline', authMiddleware, asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  
  try {
    const { renewalService } = await import('./services/renewal-service');
    const timeline = await renewalService.getRenewalTimeline(id);
    res.json(timeline);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
}));

// GET /api/renewal/:id/checklist - Get renewal checklist
router.get('/renewal/:id/checklist', authMiddleware, asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  
  try {
    const workflow = await storage.getRenewalWorkflow(id);
    if (!workflow) {
      return res.status(404).json({ error: 'Renewal workflow not found' });
    }
    
    const checklist = workflow.checklist || { items: [], totalItems: 0, completedItems: 0, progressPercentage: 0 };
    res.json(checklist);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

// POST /api/renewal/:id/complete-task - Mark checklist item complete
router.post('/renewal/:id/complete-task', authMiddleware, asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  const { taskId, completed } = req.body;
  
  if (!taskId || completed === undefined) {
    return res.status(400).json({ error: 'taskId and completed are required' });
  }
  
  try {
    const { renewalService } = await import('./services/renewal-service');
    const workflow = await renewalService.trackRenewalProgress(id, taskId, completed);
    res.json(workflow);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

// GET /api/renewal/:id/next-actions - Get next required actions
router.get('/renewal/:id/next-actions', authMiddleware, asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  
  try {
    const { renewalService } = await import('./services/renewal-service');
    const actions = await renewalService.calculateNextActions(id);
    res.json(actions);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
}));

// GET /api/renewal/statistics - Get renewal statistics
router.get('/renewal/statistics', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const { renewalService } = await import('./services/renewal-service');
    const stats = await renewalService.getRenewalStatistics();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}));

// DELETE /api/renewal/:id - Delete renewal workflow
router.delete('/renewal/:id', authMiddleware, adminMiddleware, asyncHandler(async (req: any, res: any) => {
  const { id } = req.params;
  
  try {
    await storage.deleteRenewalWorkflow(id);
    res.json({ message: 'Renewal workflow deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}));

// System Information route
router.get('/system/info', asyncHandler(async (req: any, res: any) => {
  const physicians = await storage.getAllPhysicians();
  const profiles = await storage.getAllProfiles();
  
  res.json({
    version: '1.0.0',
    buildDate: new Date().toISOString(),
    databaseStatus: 'connected',
    totalPhysicians: physicians.length,
    totalProfiles: profiles.length,
    systemHealth: 'healthy',
    uptime: process.uptime(),
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch
  });
}));

export { router };