import { Router } from 'express';
import { createStorage } from './storage';
import {
  insertProfileSchema,
  insertPracticeSchema,
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
  insertPayerSchema,
  insertPracticeLocationSchema,
  insertProfessionalReferenceSchema,
  insertPayerEnrollmentSchema,
  type SelectPractice,
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
  type SelectNotification,
  type SelectPayer,
  type SelectPracticeLocation,
  type SelectProfessionalReference,
  type SelectPayerEnrollment
} from '../shared/schema';
import { 
  paginationMiddleware, 
  createPaginatedResponse, 
  cursorPaginationMiddleware,
  createCursorPaginatedResponse,
  advancedFilterMiddleware,
  type PaginationQuery 
} from './middleware/pagination-middleware';
import { DashboardService } from './services/dashboard-service';
import { z } from 'zod';
import {
  renewalStatusSchema,
  enrollmentStatusSchema,
  notificationTypeSchema,
  providerRoleSchema,
  genericStatusSchema,
  documentTypeSchema,
  lineOfBusinessSchema,
  parStatusSchema,
  placeTypeSchema,
  validateRenewalStatus,
  validateEnrollmentStatus,
  validateNotificationType,
  validateProviderRole,
  validateGenericStatus,
  validateDocumentType,
  validateLineOfBusiness,
  validateParStatus,
  validatePlaceType,
} from '../shared/enum-validation';
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
import { analyticsService } from './services/analytics-service';
import { 
  logSecurityAudit, 
  auditMiddleware 
} from './middleware/audit-logging';
import {
  enrollmentTransitionValidationMiddleware,
  enrollmentProgressValidationMiddleware,
  validateEnrollmentStatusTransition,
  validateEnrollmentProgress,
  validateEnrollmentBusinessRules
} from './middleware/enrollment-validation';
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

// Helper function to sanitize sensitive error responses
const sanitizeError = (error: any, isSensitive: boolean = false) => {
  if (isSensitive) {
    // For sensitive resources, return generic error message
    return {
      error: 'Operation failed. Please contact system administrator if this persists.',
      timestamp: new Date().toISOString()
    };
  }
  // For non-sensitive resources, can include more details
  return {
    error: error instanceof Error ? error.message : 'Unknown error',
    timestamp: new Date().toISOString()
  };
};

// ============================
// ANALYTICS ROUTES (Authentication required)
// ============================

// GET /api/analytics/compliance - Overall compliance rates
router.get('/analytics/compliance', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const complianceData = await analyticsService.getComplianceRates();
    res.json(complianceData);
  } catch (error) {
    console.error('Error fetching compliance rates:', error);
    res.status(500).json({ error: 'Failed to fetch compliance rates' });
  }
}));

// GET /api/analytics/renewal-trends - Renewal trend data
router.get('/analytics/renewal-trends', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const trends = await analyticsService.getRenewalTrends();
    res.json(trends);
  } catch (error) {
    console.error('Error fetching renewal trends:', error);
    res.status(500).json({ error: 'Failed to fetch renewal trends' });
  }
}));

// GET /api/analytics/expiration-forecast - Upcoming expiration predictions
router.get('/analytics/expiration-forecast', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const forecast = await analyticsService.getExpirationForecast();
    res.json(forecast);
  } catch (error) {
    console.error('Error fetching expiration forecast:', error);
    res.status(500).json({ error: 'Failed to fetch expiration forecast' });
  }
}));

// GET /api/analytics/license-distribution - License distribution stats
router.get('/analytics/license-distribution', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const distribution = await analyticsService.getLicenseDistribution();
    res.json(distribution);
  } catch (error) {
    console.error('Error fetching license distribution:', error);
    res.status(500).json({ error: 'Failed to fetch license distribution' });
  }
}));

// GET /api/analytics/provider-metrics - Provider role metrics
router.get('/analytics/provider-metrics', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const metrics = await analyticsService.getProviderMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching provider metrics:', error);
    res.status(500).json({ error: 'Failed to fetch provider metrics' });
  }
}));

// GET /api/analytics/dea-metrics - DEA specific analytics
router.get('/analytics/dea-metrics', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const metrics = await analyticsService.getDEAMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching DEA metrics:', error);
    res.status(500).json({ error: 'Failed to fetch DEA metrics' });
  }
}));

// GET /api/analytics/csr-metrics - CSR specific analytics  
router.get('/analytics/csr-metrics', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const metrics = await analyticsService.getCSRMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching CSR metrics:', error);
    res.status(500).json({ error: 'Failed to fetch CSR metrics' });
  }
}));

// GET /api/analytics/document-completeness - Document upload compliance
router.get('/analytics/document-completeness', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const completeness = await analyticsService.getDocumentCompleteness();
    res.json(completeness);
  } catch (error) {
    console.error('Error fetching document completeness:', error);
    res.status(500).json({ error: 'Failed to fetch document completeness' });
  }
}));

// ============================
// OPTIMIZED DASHBOARD ROUTES (Server-side aggregations)
// ============================

// GET /api/dashboard/data - Get comprehensive dashboard data with server-side aggregations
router.get('/dashboard/data', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const dashboardData = await DashboardService.getDashboardData();
    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
}));

// GET /api/dashboard/enrollment-stats - Get enrollment statistics
router.get('/dashboard/enrollment-stats', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const { startDate, endDate } = req.query;
    
    let stats;
    if (startDate && endDate) {
      stats = await DashboardService.getEnrollmentStatsByDateRange(
        new Date(startDate as string),
        new Date(endDate as string)
      );
    } else {
      stats = await DashboardService.getEnrollmentStats();
    }
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching enrollment stats:', error);
    res.status(500).json({ error: 'Failed to fetch enrollment stats' });
  }
}));

// GET /api/dashboard/recent-enrollments - Get recent enrollments with joins
router.get('/dashboard/recent-enrollments', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const { limit = 10 } = req.query;
    const recentEnrollments = await DashboardService.getRecentEnrollments(parseInt(limit as string));
    res.json(recentEnrollments);
  } catch (error) {
    console.error('Error fetching recent enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch recent enrollments' });
  }
}));

// GET /api/dashboard/upcoming-deadlines - Get upcoming deadlines
router.get('/dashboard/upcoming-deadlines', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const { limit = 5 } = req.query;
    const deadlines = await DashboardService.getUpcomingDeadlines(parseInt(limit as string));
    res.json(deadlines);
  } catch (error) {
    console.error('Error fetching upcoming deadlines:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming deadlines' });
  }
}));

// GET /api/dashboard/payer-summary - Get payer summary with enrollment counts
router.get('/dashboard/payer-summary', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const payerSummary = await DashboardService.getPayerSummary();
    res.json(payerSummary);
  } catch (error) {
    console.error('Error fetching payer summary:', error);
    res.status(500).json({ error: 'Failed to fetch payer summary' });
  }
}));

// GET /api/dashboard/enrollment-trends - Get enrollment trends for analytics
router.get('/dashboard/enrollment-trends', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const { days = 30 } = req.query;
    const trends = await DashboardService.getEnrollmentTrends(parseInt(days as string));
    res.json(trends);
  } catch (error) {
    console.error('Error fetching enrollment trends:', error);
    res.status(500).json({ error: 'Failed to fetch enrollment trends' });
  }
}));

// GET /api/dashboard/performance-metrics - Get performance metrics
router.get('/dashboard/performance-metrics', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const metrics = await DashboardService.getPerformanceMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ error: 'Failed to fetch performance metrics' });
  }
}));

// GET /api/analytics/department/:dept/compliance - Department-specific compliance
router.get('/analytics/department/:dept/compliance', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const { dept } = req.params;
    const compliance = await analyticsService.getDepartmentCompliance(dept);
    res.json(compliance);
  } catch (error) {
    console.error('Error fetching department compliance:', error);
    res.status(500).json({ error: 'Failed to fetch department compliance' });
  }
}));

// GET /api/analytics/report - Generate comprehensive compliance report
router.get('/analytics/report', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const report = await analyticsService.generateComplianceReport();
    res.json(report);
  } catch (error) {
    console.error('Error generating compliance report:', error);
    res.status(500).json({ error: 'Failed to generate compliance report' });
  }
}));

// GET /api/analytics/export - Export analytics data
router.get('/analytics/export', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const format = req.query.format as 'csv' | 'json' || 'json';
    const data = await analyticsService.exportAnalyticsData(format);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics-report.csv');
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics-report.json');
    }
    
    res.send(data);
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    res.status(500).json({ error: 'Failed to export analytics data' });
  }
}));

// ============================
// AUTHENTICATION ROUTES (No auth required except where specified)
// ==============================

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

router.get('/profiles', paginationMiddleware, asyncHandler(async (req: any, res: any) => {
  const pagination = req.pagination;
  const profiles = await storage.getAllProfilesPaginated(pagination);
  const total = await storage.getAllProfilesCount();
  res.json(createPaginatedResponse(profiles, total, pagination));
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

// Practice routes
router.post('/practices', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPracticeSchema.parse(req.body);
  const practice = await storage.createPractice(validatedData);
  res.status(201).json(practice);
}));

router.get('/practices', paginationMiddleware, advancedFilterMiddleware, asyncHandler(async (req: any, res: any) => {
  const pagination = req.pagination;
  const filters = req.filters || [];
  const { search } = req.query;
  
  let practices: SelectPractice[];
  let total: number;
  
  if (search) {
    practices = await storage.searchPracticesPaginated(search as string, pagination);
    total = await storage.searchPracticesCount(search as string);
  } else {
    practices = await storage.getAllPracticesPaginated(pagination, filters);
    total = await storage.getAllPracticesCount(filters);
  }
  
  res.json(createPaginatedResponse(practices, total, pagination));
}));

router.get('/practices/:id', asyncHandler(async (req: any, res: any) => {
  const practice = await storage.getPractice(req.params.id);
  if (!practice) {
    return res.status(404).json({ error: 'Practice not found' });
  }
  res.json(practice);
}));

router.get('/practices/:id/clinicians', paginationMiddleware, asyncHandler(async (req: any, res: any) => {
  const pagination = req.pagination;
  const clinicians = await storage.getPhysiciansByPracticePaginated(req.params.id, pagination);
  const total = await storage.getPhysiciansByPracticeCount(req.params.id);
  res.json(createPaginatedResponse(clinicians, total, pagination));
}));

router.get('/practices/name/:name', asyncHandler(async (req: any, res: any) => {
  const practice = await storage.getPracticeByName(req.params.name);
  if (!practice) {
    return res.status(404).json({ error: 'Practice not found' });
  }
  res.json(practice);
}));

router.get('/practices/npi/:npi', asyncHandler(async (req: any, res: any) => {
  const practice = await storage.getPracticeByNpi(req.params.npi);
  if (!practice) {
    return res.status(404).json({ error: 'Practice not found' });
  }
  res.json(practice);
}));

router.put('/practices/:id', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPracticeSchema.partial().parse(req.body);
  const practice = await storage.updatePractice(req.params.id, validatedData);
  res.json(practice);
}));

router.delete('/practices/:id', asyncHandler(async (req: any, res: any) => {
  await storage.deletePractice(req.params.id);
  res.status(204).send();
}));

// Validation schema for physician assignment operations
const physicianAssignmentSchema = z.object({
  physicianIds: z.array(z.string().uuid('Invalid physician ID format'))
});

// Bulk physician assignment to practice
router.put('/practices/:id/assign-physicians', authMiddleware, adminMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    // Validate request body
    const { physicianIds } = physicianAssignmentSchema.parse(req.body);
    
    const practiceId = req.params.id;
    
    // Verify practice exists
    const practice = await storage.getPractice(practiceId);
    if (!practice) {
      return res.status(404).json({ error: 'Practice not found' });
    }
    
    const results = [];
    
    // Process each physician assignment
    for (const physicianId of physicianIds) {
      try {
        // Verify physician exists
        const existingPhysician = await storage.getPhysician(physicianId);
        if (!existingPhysician) {
          results.push({
            physicianId,
            success: false,
            error: 'Physician not found'
          });
          continue;
        }
        
        // Update physician's practice assignment
        const physician = await storage.updatePhysician(physicianId, { practiceId });
        results.push({
          physicianId,
          success: true,
          physician
        });
      } catch (error) {
        console.error(`Failed to assign physician ${physicianId} to practice ${practiceId}:`, error);
        results.push({
          physicianId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    res.json({ 
      message: `Successfully assigned ${successCount} physicians to practice. ${failureCount} failed.`,
      results,
      summary: {
        total: physicianIds.length,
        successful: successCount,
        failed: failureCount
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors 
      });
    }
    console.error('Error in assign-physicians:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// Bulk physician removal from practice
router.put('/practices/:id/unassign-physicians', authMiddleware, adminMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    // Validate request body
    const { physicianIds } = physicianAssignmentSchema.parse(req.body);
    
    const results = [];
    
    // Process each physician unassignment
    for (const physicianId of physicianIds) {
      try {
        // Verify physician exists
        const existingPhysician = await storage.getPhysician(physicianId);
        if (!existingPhysician) {
          results.push({
            physicianId,
            success: false,
            error: 'Physician not found'
          });
          continue;
        }
        
        // Remove practice assignment from physician
        const physician = await storage.updatePhysician(physicianId, { practiceId: null });
        results.push({
          physicianId,
          success: true,
          physician
        });
      } catch (error) {
        console.error(`Failed to unassign physician ${physicianId} from practice:`, error);
        results.push({
          physicianId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    res.json({ 
      message: `Successfully unassigned ${successCount} physicians from practice. ${failureCount} failed.`,
      results,
      summary: {
        total: physicianIds.length,
        successful: successCount,
        failed: failureCount
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.errors 
      });
    }
    console.error('Error in unassign-physicians:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// Get available physicians for assignment (not assigned to any practice or with location filter)
router.get('/practices/:id/available-physicians', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const { location, search } = req.query;
    const practiceId = req.params.id;
    
    // Verify practice exists
    const practice = await storage.getPractice(practiceId);
    if (!practice) {
      return res.status(404).json({ error: 'Practice not found' });
    }
    
    let physicians: SelectPhysician[];
    
    if (search) {
      physicians = await storage.searchPhysicians(search as string);
    } else {
      physicians = await storage.getAllPhysicians();
    }
    
    // Filter out physicians already assigned to THIS practice
    physicians = physicians.filter(physician => physician.practiceId !== practiceId);
    
    // Filter by location if specified (assuming homeAddress contains location info)
    if (location) {
      physicians = physicians.filter(physician => 
        physician.homeAddress && 
        physician.homeAddress.toLowerCase().includes((location as string).toLowerCase())
      );
    }
    
    res.json({
      physicians,
      total: physicians.length,
      practiceId,
      filters: {
        location: location || null,
        search: search || null
      }
    });
  } catch (error) {
    console.error('Error in available-physicians:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// Physician routes
router.post('/physicians', asyncHandler(async (req: any, res: any) => {
  const validatedData = insertPhysicianSchema.parse(req.body);
  const physician = await storage.createPhysician(validatedData);
  res.status(201).json(physician);
}));

router.get('/physicians', paginationMiddleware, advancedFilterMiddleware, asyncHandler(async (req: any, res: any) => {
  const pagination = req.pagination;
  const filters = req.filters || [];
  const { search, status } = req.query;
  
  let physicians: SelectPhysician[];
  let total: number;
  
  if (search) {
    physicians = await storage.searchPhysiciansPaginated(search as string, pagination);
    total = await storage.searchPhysiciansCount(search as string);
  } else if (status) {
    // Validate status using enum validation
    const validatedStatus = validateGenericStatus(status);
    physicians = await storage.getPhysiciansByStatusPaginated(validatedStatus, pagination);
    total = await storage.getPhysiciansByStatusCount(validatedStatus);
  } else {
    physicians = await storage.getAllPhysiciansPaginated(pagination, filters);
    total = await storage.getAllPhysiciansCount(filters);
  }
  
  res.json(createPaginatedResponse(physicians, total, pagination));
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

router.get('/physicians/:physicianId/licenses', paginationMiddleware, asyncHandler(async (req: any, res: any) => {
  const pagination = req.pagination;
  const licenses = await storage.getPhysicianLicensesPaginated(req.params.physicianId, pagination);
  const total = await storage.getPhysicianLicensesCount(req.params.physicianId);
  res.json(createPaginatedResponse(licenses, total, pagination));
}));

router.get('/licenses/:id', asyncHandler(async (req: any, res: any) => {
  const license = await storage.getPhysicianLicense(req.params.id);
  if (!license) {
    return res.status(404).json({ error: 'License not found' });
  }
  res.json(license);
}));

router.get('/licenses/expiring/:days', paginationMiddleware, asyncHandler(async (req: any, res: any) => {
  const days = parseInt(req.params.days);
  if (isNaN(days) || days < 0) {
    return res.status(400).json({ error: 'Days must be a non-negative number' });
  }
  const pagination = req.pagination;
  const licenses = await storage.getExpiringLicensesPaginated(days, pagination);
  const total = await storage.getExpiringLicensesCount(days);
  res.json(createPaginatedResponse(licenses, total, pagination));
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

router.get('/physicians/:physicianId/certifications', paginationMiddleware, asyncHandler(async (req: any, res: any) => {
  const pagination = req.pagination;
  const certifications = await storage.getPhysicianCertificationsPaginated(req.params.physicianId, pagination);
  const total = await storage.getPhysicianCertificationsCount(req.params.physicianId);
  res.json(createPaginatedResponse(certifications, total, pagination));
}));

router.get('/certifications/:id', asyncHandler(async (req: any, res: any) => {
  const certification = await storage.getPhysicianCertification(req.params.id);
  if (!certification) {
    return res.status(404).json({ error: 'Certification not found' });
  }
  res.json(certification);
}));

router.get('/certifications/expiring/:days', paginationMiddleware, asyncHandler(async (req: any, res: any) => {
  const days = parseInt(req.params.days);
  if (isNaN(days) || days < 0) {
    return res.status(400).json({ error: 'Days must be a non-negative number' });
  }
  const pagination = req.pagination;
  const certifications = await storage.getExpiringCertificationsPaginated(days, pagination);
  const total = await storage.getExpiringCertificationsCount(days);
  res.json(createPaginatedResponse(certifications, total, pagination));
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

router.get('/physicians/:physicianId/education', paginationMiddleware, asyncHandler(async (req: any, res: any) => {
  const pagination = req.pagination;
  const education = await storage.getPhysicianEducationsPaginated(req.params.physicianId, pagination);
  const total = await storage.getPhysicianEducationsCount(req.params.physicianId);
  res.json(createPaginatedResponse(education, total, pagination));
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

router.get('/physicians/:physicianId/work-history', paginationMiddleware, asyncHandler(async (req: any, res: any) => {
  const pagination = req.pagination;
  const workHistory = await storage.getPhysicianWorkHistoriesPaginated(req.params.physicianId, pagination);
  const total = await storage.getPhysicianWorkHistoriesCount(req.params.physicianId);
  res.json(createPaginatedResponse(workHistory, total, pagination));
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

router.get('/physicians/:physicianId/hospital-affiliations', paginationMiddleware, asyncHandler(async (req: any, res: any) => {
  const pagination = req.pagination;
  const affiliations = await storage.getPhysicianHospitalAffiliationsPaginated(req.params.physicianId, pagination);
  const total = await storage.getPhysicianHospitalAffiliationsCount(req.params.physicianId);
  res.json(createPaginatedResponse(affiliations, total, pagination));
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

// GET /api/notifications/upcoming - Get all upcoming notifications (public for dashboard)
router.get('/notifications/upcoming', asyncHandler(async (req: any, res: any) => {
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
    validateDocumentType(documentType);
  } catch (error) {
    return res.status(400).json({ error: `Invalid documentType: ${(error as Error).message}` });
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
  
  try {
    validateDocumentType(documentType);
  } catch (error) {
    return res.status(400).json({ error: `Invalid documentType: ${(error as Error).message}` });
  }
  
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

// GET /api/documents/download/local/:physicianId/:folder/:documentId - Download local file (fallback storage)
router.get('/documents/download/local/:physicianId/:folder/:documentId', authMiddleware, asyncHandler(async (req: any, res: any) => {
  const { physicianId, folder, documentId } = req.params;
  const filePath = `${physicianId}/${folder}/${documentId}`;
  
  try {
    const objectStorageService = new ObjectStorageService();
    const localFilePath = `local://${filePath}`;
    const file = await objectStorageService.getDocumentFile(localFilePath);
    await objectStorageService.downloadDocument(file, res);
  } catch (error: any) {
    console.error('Error downloading local file:', error);
    res.status(404).json({ error: 'File not found' });
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
  
  try {
    validateNotificationType(entityType);
  } catch (error) {
    return res.status(400).json({ error: `Invalid entityType: ${(error as Error).message}` });
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
  
  try {
    validateRenewalStatus(status);
  } catch (error) {
    return res.status(400).json({ error: `Invalid renewal status: ${(error as Error).message}` });
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

// ============================
// ANALYTICS ROUTES
// ============================

// GET /api/analytics/physicians/status-summary - Get physician status summary (no auth for dashboard)
router.get('/analytics/physicians/status-summary', asyncHandler(async (req: any, res: any) => {
  try {
    const statusSummary = await analyticsService.getPhysicianStatusSummary();
    res.json(statusSummary);
  } catch (error: any) {
    console.error('Error fetching physician status summary:', error);
    res.status(500).json({ error: error.message });
  }
}));

// GET /api/analytics/licenses/expiration-report - Get license expiration report (no auth for dashboard)
router.get('/analytics/licenses/expiration-report', asyncHandler(async (req: any, res: any) => {
  const days = parseInt(req.query.days as string) || 30;
  
  try {
    const report = await analyticsService.getLicenseExpirationReport(days);
    res.json(report);
  } catch (error: any) {
    console.error('Error fetching license expiration report:', error);
    res.status(500).json({ error: error.message });
  }
}));

// GET /api/analytics/certifications/expiration-report - Get certification expiration report (no auth for dashboard)
router.get('/analytics/certifications/expiration-report', asyncHandler(async (req: any, res: any) => {
  const days = parseInt(req.query.days as string) || 30;
  
  try {
    const report = await analyticsService.getCertificationExpirationReport(days);
    res.json(report);
  } catch (error: any) {
    console.error('Error fetching certification expiration report:', error);
    res.status(500).json({ error: error.message });
  }
}));

// GET /api/analytics/compliance - Get compliance rates
router.get('/api/analytics/compliance', asyncHandler(async (req: any, res: any) => {
  try {
    const complianceData = await analyticsService.getComplianceRates();
    res.json(complianceData.byDepartment);
  } catch (error: any) {
    console.error('Error fetching compliance data:', error);
    res.status(500).json({ error: error.message });
  }
}));

// GET /api/analytics/renewal-trends - Get renewal trends
router.get('/api/analytics/renewal-trends', asyncHandler(async (req: any, res: any) => {
  try {
    const renewalTrends = await analyticsService.getRenewalTrends();
    res.json(renewalTrends);
  } catch (error: any) {
    console.error('Error fetching renewal trends:', error);
    res.status(500).json({ error: error.message });
  }
}));

// GET /api/analytics/expiration-forecast - Get expiration forecast
router.get('/api/analytics/expiration-forecast', asyncHandler(async (req: any, res: any) => {
  try {
    const forecast = await analyticsService.getExpirationForecast();
    res.json(forecast);
  } catch (error: any) {
    console.error('Error fetching expiration forecast:', error);
    res.status(500).json({ error: error.message });
  }
}));

// GET /api/analytics/provider-metrics - Get provider metrics
router.get('/api/analytics/provider-metrics', asyncHandler(async (req: any, res: any) => {
  try {
    const metrics = await analyticsService.getProviderMetrics();
    res.json(metrics);
  } catch (error: any) {
    console.error('Error fetching provider metrics:', error);
    res.status(500).json({ error: error.message });
  }
}));

// GET /api/analytics/license-distribution - Get license distribution
router.get('/api/analytics/license-distribution', asyncHandler(async (req: any, res: any) => {
  try {
    const distribution = await analyticsService.getLicenseDistribution();
    res.json(distribution);
  } catch (error: any) {
    console.error('Error fetching license distribution:', error);
    res.status(500).json({ error: error.message });
  }
}));

// GET /api/analytics/dea-metrics - Get DEA metrics
router.get('/api/analytics/dea-metrics', asyncHandler(async (req: any, res: any) => {
  try {
    const metrics = await analyticsService.getDEAMetrics();
    res.json(metrics);
  } catch (error: any) {
    console.error('Error fetching DEA metrics:', error);
    res.status(500).json({ error: error.message });
  }
}));

// GET /api/analytics/csr-metrics - Get CSR metrics
router.get('/api/analytics/csr-metrics', asyncHandler(async (req: any, res: any) => {
  try {
    const metrics = await analyticsService.getCSRMetrics();
    res.json(metrics);
  } catch (error: any) {
    console.error('Error fetching CSR metrics:', error);
    res.status(500).json({ error: error.message });
  }
}));

// GET /api/analytics/compliance-report - Get comprehensive compliance report
router.get('/api/analytics/compliance-report', asyncHandler(async (req: any, res: any) => {
  try {
    const report = await analyticsService.generateComplianceReport();
    res.json(report);
  } catch (error: any) {
    console.error('Error generating compliance report:', error);
    res.status(500).json({ error: error.message });
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

// Test endpoint for automated workflow creation (development only)
router.get('/test/auto-workflows', asyncHandler(async (req: any, res: any) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
  
  try {
    console.log('🧪 Manual test of automated workflow creation triggered...');
    const { renewalService } = await import('./services/renewal-service');
    const results = await renewalService.createAutomaticRenewalWorkflows(90);
    
    console.log(`✅ Test completed: ${results.created} created, ${results.skipped} skipped, ${results.errors.length} errors`);
    
    res.json({
      message: 'Automated workflow creation test completed',
      results: {
        created: results.created,
        skipped: results.skipped,
        errors: results.errors
      }
    });
  } catch (error) {
    console.error('❌ Test failed:', error);
    res.status(500).json({ 
      error: 'Test failed', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// ============================
// PAYER ENROLLMENT MANAGEMENT ROUTES (CAQH-ALIGNED)
// ============================

// ============================
// PAYERS MANAGEMENT ROUTES
// ============================

// GET /api/payers - Get all payers with optional filtering and pagination
router.get('/api/payers', authMiddleware, paginationMiddleware, advancedFilterMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const { search, lineOfBusiness, isActive } = req.query;
    const pagination: PaginationQuery = req.pagination;
    const filters = req.filters || [];
    
    let result;
    let total = 0;
    
    if (search) {
      result = await storage.searchPayersPaginated(search, pagination);
      total = await storage.searchPayersCount(search);
    } else if (lineOfBusiness) {
      // Validate line of business enum
      const validatedLineOfBusiness = validateLineOfBusiness(lineOfBusiness);
      if (!validatedLineOfBusiness.success) {
        return res.status(400).json({ 
          error: 'Invalid line of business', 
          details: validatedLineOfBusiness.error.errors 
        });
      }
      result = await storage.getPayersByLineOfBusinessPaginated(validatedLineOfBusiness.data, pagination);
      total = await storage.getPayersByLineOfBusinessCount(validatedLineOfBusiness.data);
    } else if (isActive !== undefined) {
      const activeStatus = isActive === 'true';
      result = await storage.getPayersByStatusPaginated(activeStatus, pagination);
      total = await storage.getPayersByStatusCount(activeStatus);
    } else {
      result = await storage.getAllPayersPaginated(pagination, filters);
      total = await storage.getAllPayersCount(filters);
    }
    
    const paginatedResponse = createPaginatedResponse(result, total, pagination);
    
    // Add caching header for 10 minutes for payer data (changes less frequently)
    res.set('Cache-Control', 'public, max-age=600');
    res.json(paginatedResponse);
  } catch (error) {
    console.error('Error fetching payers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payers', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}));

// GET /api/payers/:id - Get specific payer
router.get('/api/payers/:id', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const payer = await storage.getPayer(req.params.id);
    if (!payer) {
      return res.status(404).json({ error: 'Payer not found' });
    }
    res.json(payer);
  } catch (error) {
    console.error('Error fetching payer:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payer', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}));

// POST /api/payers - Create new payer
router.post('/api/payers', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    // Validate request body with strict parsing
    const validatedData = insertPayerSchema.parse(req.body);

    // Additional validation for enums
    if (req.body.linesOfBusiness) {
      for (const lob of req.body.linesOfBusiness) {
        const lobValidation = validateLineOfBusiness(lob);
        if (!lobValidation.success) {
          return res.status(400).json({ 
            error: `Invalid line of business: ${lob}`, 
            details: lobValidation.error.errors 
          });
        }
      }
    }

    // Check for duplicate payer name
    const existingPayer = await storage.getPayerByName(req.body.name);
    if (existingPayer) {
      return res.status(409).json({ error: 'Payer with this name already exists' });
    }

    const payer = await storage.createPayer(validatedData);
    res.status(201).json(payer);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Invalid payer data', 
        details: (error as any).errors 
      });
    }
    console.error('Error creating payer:', error);
    res.status(500).json(sanitizeError(error, false));
  }
}));

// PUT /api/payers/:id - Update payer
router.put('/api/payers/:id', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    // Check if payer exists
    const existingPayer = await storage.getPayer(req.params.id);
    if (!existingPayer) {
      return res.status(404).json({ error: 'Payer not found' });
    }

    // Validate request body with strict parsing
    const validatedData = insertPayerSchema.partial().parse(req.body);

    // Additional validation for enums
    if (req.body.linesOfBusiness) {
      for (const lob of req.body.linesOfBusiness) {
        const lobValidation = validateLineOfBusiness(lob);
        if (!lobValidation.success) {
          return res.status(400).json({ 
            error: `Invalid line of business: ${lob}`, 
            details: lobValidation.error.errors 
          });
        }
      }
    }

    // Check for duplicate name if name is being updated
    if (req.body.name && req.body.name !== existingPayer.name) {
      const duplicatePayer = await storage.getPayerByName(req.body.name);
      if (duplicatePayer) {
        return res.status(409).json({ error: 'Payer with this name already exists' });
      }
    }

    const payer = await storage.updatePayer(req.params.id, validatedData);
    res.json(payer);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Invalid payer data', 
        details: (error as any).errors 
      });
    }
    console.error('Error updating payer:', error);
    res.status(500).json(sanitizeError(error, false));
  }
}));

// DELETE /api/payers/:id - Delete payer
router.delete('/api/payers/:id', authMiddleware, adminMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const payer = await storage.getPayer(req.params.id);
    if (!payer) {
      return res.status(404).json({ error: 'Payer not found' });
    }

    // Check for existing enrollments
    const enrollments = await storage.getPayerEnrollmentsByPayer(req.params.id);
    if (enrollments.length > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete payer with existing enrollments', 
        enrollmentCount: enrollments.length 
      });
    }

    await storage.deletePayer(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting payer:', error);
    res.status(500).json({ 
      error: 'Failed to delete payer', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}));

// GET /api/payers/:id/enrollments - Get enrollments for a specific payer
router.get('/api/payers/:id/enrollments', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const payer = await storage.getPayer(req.params.id);
    if (!payer) {
      return res.status(404).json({ error: 'Payer not found' });
    }

    const enrollments = await storage.getPayerEnrollmentsByPayer(req.params.id);
    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching payer enrollments:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payer enrollments', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}));

// ============================
// PRACTICE LOCATIONS ROUTES
// ============================

// GET /api/practice-locations - Get all practice locations with pagination
router.get('/api/practice-locations', authMiddleware, paginationMiddleware, advancedFilterMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const pagination = req.pagination;
    const filters = req.filters || [];
    const { practiceId, placeType, isActive } = req.query;
    
    let result: any;
    let total: number;
    
    if (practiceId) {
      result = await storage.getPracticeLocationsByPracticePaginated ? 
        await storage.getPracticeLocationsByPracticePaginated(practiceId, pagination) :
        await storage.getPracticeLocationsByPractice(practiceId);
      total = await storage.getPracticeLocationsByPracticeCount ? 
        await storage.getPracticeLocationsByPracticeCount(practiceId) :
        result.length;
    } else if (placeType) {
      const validatedPlaceType = validatePlaceType(placeType);
      if (!validatedPlaceType.success) {
        return res.status(400).json({ 
          error: 'Invalid place type', 
          details: validatedPlaceType.error.errors 
        });
      }
      result = await storage.getPracticeLocationsByTypePaginated ? 
        await storage.getPracticeLocationsByTypePaginated(validatedPlaceType.data, pagination) :
        await storage.getPracticeLocationsByType(validatedPlaceType.data);
      total = await storage.getPracticeLocationsByTypeCount ? 
        await storage.getPracticeLocationsByTypeCount(validatedPlaceType.data) :
        result.length;
    } else if (isActive !== undefined) {
      const activeStatus = isActive === 'true';
      result = await storage.getPracticeLocationsByStatusPaginated ? 
        await storage.getPracticeLocationsByStatusPaginated(activeStatus, pagination) :
        await storage.getPracticeLocationsByStatus(activeStatus);
      total = await storage.getPracticeLocationsByStatusCount ? 
        await storage.getPracticeLocationsByStatusCount(activeStatus) :
        result.length;
    } else {
      result = await storage.getAllPracticeLocationsPaginated ? 
        await storage.getAllPracticeLocationsPaginated(pagination, filters) :
        await storage.getAllPracticeLocations();
      total = await storage.getAllPracticeLocationsCount ? 
        await storage.getAllPracticeLocationsCount(filters) :
        result.length;
    }
    
    const paginatedResponse = createPaginatedResponse(result, total, pagination);
    
    // Add caching header for practice location data
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    res.json(paginatedResponse);
  } catch (error) {
    console.error('Error fetching practice locations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch practice locations', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}));

// GET /api/practice-locations/:id - Get specific practice location
router.get('/api/practice-locations/:id', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const location = await storage.getPracticeLocation(req.params.id);
    if (!location) {
      return res.status(404).json({ error: 'Practice location not found' });
    }
    res.json(location);
  } catch (error) {
    console.error('Error fetching practice location:', error);
    res.status(500).json({ 
      error: 'Failed to fetch practice location', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}));

// POST /api/practice-locations - Create new practice location
router.post('/api/practice-locations', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    // Validate request body
    const validationResult = insertPracticeLocationSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid practice location data', 
        details: validationResult.error.errors 
      });
    }

    // Validate place type enum
    if (req.body.placeType) {
      const placeTypeValidation = validatePlaceType(req.body.placeType);
      if (!placeTypeValidation.success) {
        return res.status(400).json({ 
          error: 'Invalid place type', 
          details: placeTypeValidation.error.errors 
        });
      }
    }

    // Validate that practice exists
    if (req.body.practiceId) {
      const practice = await storage.getPractice(req.body.practiceId);
      if (!practice) {
        return res.status(400).json({ error: 'Practice not found' });
      }
    }

    const location = await storage.createPracticeLocation(validationResult.data);
    res.status(201).json(location);
  } catch (error) {
    console.error('Error creating practice location:', error);
    res.status(500).json({ 
      error: 'Failed to create practice location', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}));

// PUT /api/practice-locations/:id - Update practice location
router.put('/api/practice-locations/:id', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    // Check if location exists
    const existingLocation = await storage.getPracticeLocation(req.params.id);
    if (!existingLocation) {
      return res.status(404).json({ error: 'Practice location not found' });
    }

    // Validate request body
    const validationResult = insertPracticeLocationSchema.partial().safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid practice location data', 
        details: validationResult.error.errors 
      });
    }

    // Validate place type enum
    if (req.body.placeType) {
      const placeTypeValidation = validatePlaceType(req.body.placeType);
      if (!placeTypeValidation.success) {
        return res.status(400).json({ 
          error: 'Invalid place type', 
          details: placeTypeValidation.error.errors 
        });
      }
    }

    // Validate that practice exists if being updated
    if (req.body.practiceId) {
      const practice = await storage.getPractice(req.body.practiceId);
      if (!practice) {
        return res.status(400).json({ error: 'Practice not found' });
      }
    }

    const location = await storage.updatePracticeLocation(req.params.id, validationResult.data);
    res.json(location);
  } catch (error) {
    console.error('Error updating practice location:', error);
    res.status(500).json({ 
      error: 'Failed to update practice location', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}));

// DELETE /api/practice-locations/:id - Delete practice location
router.delete('/api/practice-locations/:id', authMiddleware, adminMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const location = await storage.getPracticeLocation(req.params.id);
    if (!location) {
      return res.status(404).json({ error: 'Practice location not found' });
    }

    // Check for existing enrollments
    const enrollments = await storage.getPayerEnrollmentsByLocation(req.params.id);
    if (enrollments.length > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete practice location with existing enrollments', 
        enrollmentCount: enrollments.length 
      });
    }

    await storage.deletePracticeLocation(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting practice location:', error);
    res.status(500).json({ 
      error: 'Failed to delete practice location', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}));

// ============================
// PRACTICE DOCUMENTS ROUTES (GROUP-LEVEL BANKING DOCUMENTS)
// ============================

// GET /api/practices/:practiceId/documents - Get practice documents with pagination
router.get('/api/practices/:practiceId/documents', authMiddleware, paginationMiddleware, advancedFilterMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const { documentType } = req.query;
    const pagination = req.pagination;
    const filters = req.filters || [];
    
    // Add practice ID filter
    filters.push({ field: 'practiceId', value: req.params.practiceId });
    
    // Add document type filter if specified
    if (documentType) {
      filters.push({ field: 'documentType', value: documentType });
    }
    
    let result: any;
    let total: number;
    
    result = await storage.getAllPracticeDocumentsPaginated ? 
      await storage.getAllPracticeDocumentsPaginated(pagination, filters) :
      await storage.getPracticeDocumentsByPractice(req.params.practiceId);
    total = await storage.getAllPracticeDocumentsCount ? 
      await storage.getAllPracticeDocumentsCount(filters) :
      result.length;
      
    const paginatedResponse = createPaginatedResponse(result, total, pagination);
    
    // Add caching header for practice documents data  
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    res.json(paginatedResponse);
  } catch (error) {
    console.error('Error fetching practice documents:', error);
    res.status(500).json({ 
      error: 'Failed to fetch practice documents', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}));

// GET /api/practices/:practiceId/documents/:id - Get specific practice document
router.get('/api/practices/:practiceId/documents/:id', authMiddleware, auditMiddleware('view_practice_document'), asyncHandler(async (req: any, res: any) => {
  try {
    const document = await storage.getPracticeDocument(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Practice document not found' });
    }
    
    // Verify document belongs to the specified practice
    if (document.practiceId !== req.params.practiceId) {
      return res.status(404).json({ error: 'Practice document not found' });
    }
    
    res.json(document);
  } catch (error) {
    console.error('Error fetching practice document:', error);
    res.status(500).json({ 
      error: 'Failed to fetch practice document', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}));

// POST /api/practices/:practiceId/documents - Create new practice document
router.post('/api/practices/:practiceId/documents', 
  authMiddleware, 
  upload.single('file'),
  auditMiddleware('create_practice_document'),
  asyncHandler(async (req: any, res: any) => {
    try {
      const { documentType, documentName, notes } = req.body;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: 'File is required' });
      }
      
      if (!documentType || !documentName) {
        return res.status(400).json({ error: 'Document type and name are required' });
      }
      
      // Store file using document service
      const storedFile = await documentService.storeDocument(file, {
        practiceId: req.params.practiceId,
        documentType,
        documentName
      });
      
      // Create document record
      const documentData = {
        practiceId: req.params.practiceId,
        documentType,
        documentName,
        fileName: file.originalname,
        filePath: storedFile.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy: (req as any).user?.userId,
        notes
      };
      
      const document = await storage.createPracticeDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      console.error('Error creating practice document:', error);
      res.status(500).json({ 
        error: 'Failed to create practice document', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  })
);

// PATCH /api/practices/:practiceId/documents/:id - Update practice document metadata
router.patch('/api/practices/:practiceId/documents/:id', 
  authMiddleware, 
  auditMiddleware('update_practice_document'),
  asyncHandler(async (req: any, res: any) => {
    try {
      // Check if document exists and belongs to practice
      const existingDocument = await storage.getPracticeDocument(req.params.id);
      if (!existingDocument || existingDocument.practiceId !== req.params.practiceId) {
        return res.status(404).json({ error: 'Practice document not found' });
      }

      // Allow updating metadata only (not file content)
      const { documentType, documentName, notes, expirationDate } = req.body;
      const updates: any = {};
      
      if (documentType !== undefined) updates.documentType = documentType;
      if (documentName !== undefined) updates.documentName = documentName;
      if (notes !== undefined) updates.notes = notes;
      if (expirationDate !== undefined) updates.expirationDate = expirationDate;

      const updatedDocument = await storage.updatePracticeDocument(req.params.id, updates);
      res.json(updatedDocument);
    } catch (error) {
      console.error('Error updating practice document:', error);
      res.status(500).json({ 
        error: 'Failed to update practice document', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  })
);

// DELETE /api/practices/:practiceId/documents/:id - Delete practice document
router.delete('/api/practices/:practiceId/documents/:id', 
  authMiddleware, 
  adminMiddleware,
  auditMiddleware('delete_practice_document'),
  asyncHandler(async (req: any, res: any) => {
    try {
      // Check if document exists and belongs to practice
      const document = await storage.getPracticeDocument(req.params.id);
      if (!document || document.practiceId !== req.params.practiceId) {
        return res.status(404).json({ error: 'Practice document not found' });
      }

      // Delete the file from storage if it exists
      if (document.filePath) {
        try {
          await documentService.deleteDocument(document.filePath);
        } catch (fileError) {
          console.warn('Failed to delete file from storage:', fileError);
          // Continue with database deletion even if file deletion fails
        }
      }

      await storage.deletePracticeDocument(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting practice document:', error);
      res.status(500).json({ 
        error: 'Failed to delete practice document', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  })
);


// ============================
// PROFESSIONAL REFERENCES ROUTES
// ============================

// GET /api/professional-references - Get all professional references with pagination
router.get('/api/professional-references', authMiddleware, paginationMiddleware, advancedFilterMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const pagination = req.pagination;
    const filters = req.filters || [];
    const { physicianId } = req.query;
    
    let result: any;
    let total: number;
    
    if (physicianId) {
      result = await storage.getProfessionalReferencesByPhysicianPaginated ? 
        await storage.getProfessionalReferencesByPhysicianPaginated(physicianId, pagination) :
        await storage.getProfessionalReferencesByPhysician(physicianId);
      total = await storage.getProfessionalReferencesByPhysicianCount ? 
        await storage.getProfessionalReferencesByPhysicianCount(physicianId) :
        result.length;
    } else {
      result = await storage.getAllProfessionalReferencesPaginated ? 
        await storage.getAllProfessionalReferencesPaginated(pagination, filters) :
        await storage.getAllProfessionalReferences();
      total = await storage.getAllProfessionalReferencesCount ? 
        await storage.getAllProfessionalReferencesCount(filters) :
        result.length;
    }
    
    const paginatedResponse = createPaginatedResponse(result, total, pagination);
    
    // Add caching header for professional references data  
    res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
    res.json(paginatedResponse);
  } catch (error) {
    console.error('Error fetching professional references:', error);
    res.status(500).json({ 
      error: 'Failed to fetch professional references', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}));

// GET /api/professional-references/:id - Get specific professional reference
router.get('/api/professional-references/:id', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const reference = await storage.getProfessionalReference(req.params.id);
    if (!reference) {
      return res.status(404).json({ error: 'Professional reference not found' });
    }
    res.json(reference);
  } catch (error) {
    console.error('Error fetching professional reference:', error);
    res.status(500).json({ 
      error: 'Failed to fetch professional reference', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}));

// POST /api/professional-references - Create new professional reference
router.post('/api/professional-references', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    // Validate request body with strict parsing
    const validatedData = insertProfessionalReferenceSchema.parse(req.body);

    // Validate that physician exists
    if (req.body.physicianId) {
      const physician = await storage.getPhysician(req.body.physicianId);
      if (!physician) {
        return res.status(400).json({ error: 'Physician not found' });
      }
    }

    const reference = await storage.createProfessionalReference(validatedData);
    res.status(201).json(reference);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Invalid professional reference data', 
        details: (error as any).errors 
      });
    }
    console.error('Error creating professional reference:', error);
    res.status(500).json(sanitizeError(error, false));
  }
}));

// PUT /api/professional-references/:id - Update professional reference
router.put('/api/professional-references/:id', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    // Check if reference exists
    const existingReference = await storage.getProfessionalReference(req.params.id);
    if (!existingReference) {
      return res.status(404).json({ error: 'Professional reference not found' });
    }

    // Validate request body with strict parsing
    const validatedData = insertProfessionalReferenceSchema.partial().parse(req.body);

    // Validate that physician exists if being updated
    if (req.body.physicianId) {
      const physician = await storage.getPhysician(req.body.physicianId);
      if (!physician) {
        return res.status(400).json({ error: 'Physician not found' });
      }
    }

    const reference = await storage.updateProfessionalReference(req.params.id, validatedData);
    res.json(reference);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ 
        error: 'Invalid professional reference data', 
        details: (error as any).errors 
      });
    }
    console.error('Error updating professional reference:', error);
    res.status(500).json(sanitizeError(error, false));
  }
}));

// DELETE /api/professional-references/:id - Delete professional reference
router.delete('/api/professional-references/:id', authMiddleware, adminMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const reference = await storage.getProfessionalReference(req.params.id);
    if (!reference) {
      return res.status(404).json({ error: 'Professional reference not found' });
    }

    await storage.deleteProfessionalReference(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting professional reference:', error);
    res.status(500).json({ 
      error: 'Failed to delete professional reference', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}));

// ============================
// PAYER ENROLLMENTS ROUTES
// ============================

// GET /api/payer-enrollments - Get all payer enrollments with filtering and pagination
router.get('/api/payer-enrollments', authMiddleware, paginationMiddleware, advancedFilterMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const { physicianId, payerId, locationId, status, expiringDays } = req.query;
    const pagination: PaginationQuery = req.pagination;
    const filters = req.filters || [];
    
    let result;
    let total = 0;
    
    if (physicianId) {
      result = await storage.getPayerEnrollmentsByPhysicianPaginated(physicianId, pagination);
      total = await storage.getPayerEnrollmentsByPhysicianCount(physicianId);
    } else if (payerId) {
      result = await storage.getPayerEnrollmentsByPayerPaginated(payerId, pagination);
      total = await storage.getPayerEnrollmentsByPayerCount(payerId);
    } else if (locationId) {
      result = await storage.getPayerEnrollmentsByLocationPaginated(locationId, pagination);
      total = await storage.getPayerEnrollmentsByLocationCount(locationId);
    } else if (status) {
      const validatedStatus = validateEnrollmentStatus(status);
      if (!validatedStatus.success) {
        return res.status(400).json({ 
          error: 'Invalid enrollment status', 
          details: validatedStatus.error.errors 
        });
      }
      result = await storage.getPayerEnrollmentsByStatusPaginated(validatedStatus.data, pagination);
      total = await storage.getPayerEnrollmentsByStatusCount(validatedStatus.data);
    } else if (expiringDays) {
      const days = parseInt(expiringDays);
      if (isNaN(days) || days < 0) {
        return res.status(400).json({ error: 'Invalid expiring days parameter' });
      }
      result = await storage.getExpiringEnrollmentsPaginated(days, pagination);
      total = await storage.getExpiringEnrollmentsCount(days);
    } else {
      result = await storage.getAllPayerEnrollmentsPaginated(pagination, filters);
      total = await storage.getAllPayerEnrollmentsCount(filters);
    }
    
    const paginatedResponse = createPaginatedResponse(result, total, pagination);
    
    // Add caching header for 5 minutes for list data
    res.set('Cache-Control', 'public, max-age=300');
    res.json(paginatedResponse);
  } catch (error) {
    console.error('Error fetching payer enrollments:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payer enrollments', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}));

// GET /api/payer-enrollments/:id - Get specific payer enrollment
router.get('/api/payer-enrollments/:id', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const enrollment = await storage.getPayerEnrollment(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ error: 'Payer enrollment not found' });
    }
    res.json(enrollment);
  } catch (error) {
    console.error('Error fetching payer enrollment:', error);
    res.status(500).json({ 
      error: 'Failed to fetch payer enrollment', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}));

// POST /api/payer-enrollments - Create new payer enrollment
router.post('/api/payer-enrollments', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    // Validate request body
    const validationResult = insertPayerEnrollmentSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid payer enrollment data', 
        details: validationResult.error.errors 
      });
    }

    // Validate enrollment status enum
    if (req.body.status) {
      const statusValidation = validateEnrollmentStatus(req.body.status);
      if (!statusValidation.success) {
        return res.status(400).json({ 
          error: 'Invalid enrollment status', 
          details: statusValidation.error.errors 
        });
      }
    }

    // Validate par status enum
    if (req.body.parStatus) {
      const parStatusValidation = validateParStatus(req.body.parStatus);
      if (!parStatusValidation.success) {
        return res.status(400).json({ 
          error: 'Invalid PAR status', 
          details: parStatusValidation.error.errors 
        });
      }
    }

    // Validate foreign key relationships
    if (req.body.physicianId) {
      const physician = await storage.getPhysician(req.body.physicianId);
      if (!physician) {
        return res.status(400).json({ error: 'Physician not found' });
      }
    }

    if (req.body.payerId) {
      const payer = await storage.getPayer(req.body.payerId);
      if (!payer) {
        return res.status(400).json({ error: 'Payer not found' });
      }
    }

    if (req.body.locationId) {
      const location = await storage.getPracticeLocation(req.body.locationId);
      if (!location) {
        return res.status(400).json({ error: 'Practice location not found' });
      }
    }

    // Check for duplicate enrollment
    const existingEnrollments = await storage.getPayerEnrollmentsByPhysician(req.body.physicianId);
    const duplicateEnrollment = existingEnrollments.find(e => 
      e.payerId === req.body.payerId && e.locationId === req.body.locationId
    );
    if (duplicateEnrollment) {
      return res.status(409).json({ error: 'Enrollment already exists for this physician, payer, and location combination' });
    }

    const enrollment = await storage.createPayerEnrollment(validationResult.data);
    res.status(201).json(enrollment);
  } catch (error) {
    console.error('Error creating payer enrollment:', error);
    res.status(500).json({ 
      error: 'Failed to create payer enrollment', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}));

// PUT /api/payer-enrollments/:id - Update payer enrollment
router.put('/api/payer-enrollments/:id', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    // Check if enrollment exists
    const existingEnrollment = await storage.getPayerEnrollment(req.params.id);
    if (!existingEnrollment) {
      return res.status(404).json({ error: 'Payer enrollment not found' });
    }

    // Validate request body
    const validationResult = insertPayerEnrollmentSchema.partial().safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid payer enrollment data', 
        details: validationResult.error.errors 
      });
    }

    // Validate enrollment status enum
    if (req.body.status) {
      const statusValidation = validateEnrollmentStatus(req.body.status);
      if (!statusValidation.success) {
        return res.status(400).json({ 
          error: 'Invalid enrollment status', 
          details: statusValidation.error.errors 
        });
      }
    }

    // Validate par status enum
    if (req.body.parStatus) {
      const parStatusValidation = validateParStatus(req.body.parStatus);
      if (!parStatusValidation.success) {
        return res.status(400).json({ 
          error: 'Invalid PAR status', 
          details: parStatusValidation.error.errors 
        });
      }
    }

    // Validate foreign key relationships if being updated
    if (req.body.physicianId) {
      const physician = await storage.getPhysician(req.body.physicianId);
      if (!physician) {
        return res.status(400).json({ error: 'Physician not found' });
      }
    }

    if (req.body.payerId) {
      const payer = await storage.getPayer(req.body.payerId);
      if (!payer) {
        return res.status(400).json({ error: 'Payer not found' });
      }
    }

    if (req.body.locationId) {
      const location = await storage.getPracticeLocation(req.body.locationId);
      if (!location) {
        return res.status(400).json({ error: 'Practice location not found' });
      }
    }

    const enrollment = await storage.updatePayerEnrollment(req.params.id, validationResult.data);
    res.json(enrollment);
  } catch (error) {
    console.error('Error updating payer enrollment:', error);
    res.status(500).json({ 
      error: 'Failed to update payer enrollment', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}));

// DELETE /api/payer-enrollments/:id - Delete payer enrollment
router.delete('/api/payer-enrollments/:id', authMiddleware, adminMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const enrollment = await storage.getPayerEnrollment(req.params.id);
    if (!enrollment) {
      return res.status(404).json({ error: 'Payer enrollment not found' });
    }

    await storage.deletePayerEnrollment(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting payer enrollment:', error);
    res.status(500).json({ 
      error: 'Failed to delete payer enrollment', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}));

// PATCH /api/payer-enrollments/:id/status - Update enrollment status (with transition validation)
router.patch('/api/payer-enrollments/:id/status', 
  authMiddleware,
  enrollmentTransitionValidationMiddleware,
  auditMiddleware('update_enrollment_status', 'payer_enrollment'),
  asyncHandler(async (req: any, res: any) => {
    try {
      const { status, ...statusData } = req.body;
      
      if (!status) {
        return res.status(400).json({ error: 'Status is required' });
      }

      // Validate enrollment status enum
      const statusValidation = validateEnrollmentStatus(status);
      if (!statusValidation.success) {
        return res.status(400).json({ 
          error: 'Invalid enrollment status', 
          details: statusValidation.error.errors 
        });
      }

      // Check if enrollment exists
      const existingEnrollment = await storage.getPayerEnrollment(req.params.id);
      if (!existingEnrollment) {
        return res.status(404).json({ error: 'Payer enrollment not found' });
      }

      // Validate status transition
      const transitionValidation = validateEnrollmentStatusTransition(
        existingEnrollment.enrollmentStatus as any,
        status
      );
      if (!transitionValidation.valid) {
        return res.status(400).json({ 
          error: transitionValidation.error,
          currentStatus: existingEnrollment.enrollmentStatus,
          requestedStatus: status
        });
      }

      // Validate business rules
      const businessRuleValidation = validateEnrollmentBusinessRules(status, {
        ...statusData,
        stoppedReason: req.body.stoppedReason,
        providerId: req.body.providerId
      });
      if (!businessRuleValidation.valid) {
        return res.status(400).json({ error: businessRuleValidation.error });
      }

      const enrollment = await storage.updateEnrollmentStatus(req.params.id, status);
      res.json(enrollment);
    } catch (error) {
      console.error('Error updating enrollment status:', error);
      res.status(500).json(sanitizeError(error, false));
    }
  })
);

// PATCH /api/payer-enrollments/:id/progress - Update enrollment progress (with bounds validation)
router.patch('/api/payer-enrollments/:id/progress', 
  authMiddleware,
  enrollmentProgressValidationMiddleware,
  auditMiddleware('update_enrollment_progress', 'payer_enrollment'),
  asyncHandler(async (req: any, res: any) => {
    try {
      const { progress } = req.body;
      
      if (progress === undefined || progress === null) {
        return res.status(400).json({ error: 'Progress is required' });
      }

      // Enhanced progress validation
      const progressValidation = validateEnrollmentProgress(progress);
      if (!progressValidation.valid) {
        return res.status(400).json({ error: progressValidation.error });
      }

      // Check if enrollment exists
      const existingEnrollment = await storage.getPayerEnrollment(req.params.id);
      if (!existingEnrollment) {
        return res.status(404).json({ error: 'Payer enrollment not found' });
      }

      const enrollment = await storage.updateEnrollmentProgress(req.params.id, progress);
      res.json(enrollment);
    } catch (error) {
      console.error('Error updating enrollment progress:', error);
      res.status(500).json(sanitizeError(error, false));
    }
  })
);

// GET /api/physicians/:id/enrollments - Get enrollments for a specific physician
router.get('/api/physicians/:id/enrollments', authMiddleware, asyncHandler(async (req: any, res: any) => {
  try {
    const physician = await storage.getPhysician(req.params.id);
    if (!physician) {
      return res.status(404).json({ error: 'Physician not found' });
    }

    const enrollments = await storage.getPayerEnrollmentsByPhysician(req.params.id);
    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching physician enrollments:', error);
    res.status(500).json({ 
      error: 'Failed to fetch physician enrollments', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}));

export { router };