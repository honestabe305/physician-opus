import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { createStorage } from './storage';
import type { SelectUser, SelectSession } from '../shared/schema';

// Constants
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_EXPIRY_HOURS = 24;
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MINUTES = 15;

// Extend Express Request type to include user and session
declare global {
  namespace Express {
    interface Request {
      user?: SelectUser;
      session?: SelectSession;
      sessionToken?: string;
    }
  }
}

// Storage instance
const storage = createStorage();

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a JWT token
 */
export function generateJWT(userId: string, sessionToken: string): string {
  return jwt.sign(
    { userId, sessionToken },
    JWT_SECRET,
    { expiresIn: `${SESSION_EXPIRY_HOURS}h` }
  );
}

/**
 * Verify a JWT token
 */
export function verifyJWT(token: string): { userId: string; sessionToken: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; sessionToken: string };
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Calculate session expiry time
 */
export function getSessionExpiry(rememberMe: boolean = false): Date {
  const now = new Date();
  const hours = rememberMe ? SESSION_EXPIRY_HOURS * 7 : SESSION_EXPIRY_HOURS; // 7 days if remember me
  now.setHours(now.getHours() + hours);
  return now;
}

/**
 * Check if an account is locked
 */
export function isAccountLocked(user: SelectUser): boolean {
  if (!user.lockedUntil) return false;
  return new Date(user.lockedUntil) > new Date();
}

/**
 * Validate password complexity
 * Matches the requirements from useSecurityPreferences:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export function validatePasswordComplexity(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Authentication middleware
 * Verifies the session token from cookie or Authorization header
 * BYPASS: Set BYPASS_AUTH=true environment variable to disable authentication for UAT testing
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // 🚧 TEMPORARY UAT BYPASS - Remove for production
    if (process.env.BYPASS_AUTH === 'true') {
      console.log('🚧 AUTH BYPASS ENABLED - UAT Testing Mode');
      
      // Mock authenticated user for testing
      const mockUser = {
        id: 'bypass-user-id',
        email: 'uat@physiciancrm.com',
        username: 'uat-tester',
        role: 'admin',
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date().toISOString(),
        lastPasswordChangeAt: null,
        twoFactorEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const mockSession = {
        id: 'bypass-session-id',
        userId: 'bypass-user-id',
        sessionToken: 'bypass-token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        ipAddress: 'bypass',
        userAgent: 'bypass',
        createdAt: new Date().toISOString()
      };
      
      // Attach mock user and session to request
      req.user = mockUser as any;
      req.session = mockSession as any;
      req.sessionToken = 'bypass-token';
      
      return next();
    }
    // 🚧 END BYPASS CODE
    let jwtToken: string | undefined;
    
    // Check for token in cookie first (the cookie value is the JWT token)
    if (req.cookies?.sessionToken) {
      jwtToken = req.cookies.sessionToken;
    }
    // Fallback to Authorization header
    else if (req.headers.authorization?.startsWith('Bearer ')) {
      jwtToken = req.headers.authorization.substring(7);
    }
    
    if (!jwtToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Verify JWT and extract session info
    const decoded = verifyJWT(jwtToken);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Get session from storage using the sessionToken extracted from JWT
    const session = await storage.getSession(decoded.sessionToken);
    if (!session) {
      return res.status(401).json({ error: 'Session not found' });
    }
    
    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      await storage.deleteSession(decoded.sessionToken);
      return res.status(401).json({ error: 'Session expired' });
    }
    
    // Get user from storage
    const user = await storage.getUserById(session.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }
    
    // Check if account is locked
    if (isAccountLocked(user)) {
      return res.status(403).json({ error: 'Account is locked due to too many failed login attempts' });
    }
    
    // Attach user and session to request
    req.user = user;
    req.session = session;
    req.sessionToken = decoded.sessionToken;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Optional authentication middleware
 * Similar to authMiddleware but doesn't fail if no token is present
 */
export async function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;
    
    // Check for token in cookie first
    if (req.cookies?.sessionToken) {
      token = req.cookies.sessionToken;
    }
    // Fallback to Authorization header
    else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.substring(7);
    }
    
    if (!token) {
      return next(); // No token, continue without authentication
    }
    
    // Verify JWT and extract session info
    const decoded = verifyJWT(token);
    if (!decoded) {
      return next(); // Invalid token, continue without authentication
    }
    
    // Get session from storage
    const session = await storage.getSession(decoded.sessionToken);
    if (!session || new Date(session.expiresAt) < new Date()) {
      return next(); // Session not found or expired, continue without authentication
    }
    
    // Get user from storage
    const user = await storage.getUserById(session.userId);
    if (!user || !user.isActive || isAccountLocked(user)) {
      return next(); // User not found or inactive/locked, continue without authentication
    }
    
    // Attach user and session to request
    req.user = user;
    req.session = session;
    req.sessionToken = decoded.sessionToken;
    
    next();
  } catch (error) {
    // On any error, continue without authentication
    next();
  }
}

/**
 * Admin-only middleware
 * Must be used after authMiddleware
 */
export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  next();
}

/**
 * Get user's IP address from request
 */
export function getIpAddress(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
         (req.headers['x-real-ip'] as string) ||
         req.socket.remoteAddress ||
         'unknown';
}

/**
 * Get user agent from request
 */
export function getUserAgent(req: Request): string {
  return req.headers['user-agent'] || 'unknown';
}

/**
 * Create a secure cookie options object
 */
export function getCookieOptions(rememberMe: boolean = false): any {
  const isProduction = process.env.NODE_ENV === 'production';
  const maxAge = rememberMe 
    ? 1000 * 60 * 60 * 24 * 7 // 7 days
    : 1000 * 60 * 60 * SESSION_EXPIRY_HOURS; // Default session length
    
  return {
    httpOnly: true,
    secure: isProduction, // Use secure cookies in production
    sameSite: 'strict' as const,
    maxAge,
    path: '/'
  };
}

/**
 * Clear authentication cookie
 */
export function clearAuthCookie(res: Response) {
  res.clearCookie('sessionToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
}