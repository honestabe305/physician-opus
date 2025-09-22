import { Request, Response, NextFunction } from 'express';
import { getIpAddress, getUserAgent } from '../auth';

/**
 * Enhanced audit log entry structure for security-sensitive operations
 */
export interface AuditLogEntry {
  timestamp: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress: string;
  userAgent: string;
  action: string;
  resource: string;
  resourceId?: string;
  route: string;
  method: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * In-memory audit log storage (in production, this should go to a secure logging service)
 * This provides structured audit logging for compliance and security monitoring
 */
const auditLog: AuditLogEntry[] = [];

/**
 * Create a structured audit log entry for security-sensitive operations
 */
export function logSecurityAudit(req: Request, res: Response, options: {
  action: string;
  resource: string; 
  resourceId?: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}): void {
  const entry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    userId: req.user?.id,
    userEmail: req.user?.email,
    userRole: req.user?.role,
    ipAddress: getIpAddress(req),
    userAgent: getUserAgent(req),
    action: options.action,
    resource: options.resource,
    resourceId: options.resourceId,
    route: req.route?.path || req.path,
    method: req.method,
    success: options.success,
    errorMessage: options.errorMessage,
    metadata: options.metadata
  };

  // Store audit entry
  auditLog.push(entry);

  // Log for immediate visibility (in production, send to secure logging service)
  const logLevel = options.success ? 'INFO' : 'WARN';
  const status = options.success ? 'SUCCESS' : 'FAILED';
  
  if (process.env.NODE_ENV === 'production') {
    // In production, this should integrate with secure logging infrastructure
    console.log(`[SECURITY_AUDIT] ${logLevel}: ${entry.action} ${entry.resource} by ${entry.userEmail || 'system'} (${entry.userRole || 'unknown'}) from ${entry.ipAddress} - ${status}`);
  } else {
    // Detailed logging for development
    console.log(`🔐 SECURITY_AUDIT [${entry.timestamp}]: ${entry.action} ${entry.resource}${entry.resourceId ? ` (${entry.resourceId})` : ''} by ${entry.userEmail || 'system'} (${entry.userRole || 'unknown'}) from ${entry.ipAddress} - ${status}${entry.errorMessage ? ` - Error: ${entry.errorMessage}` : ''}`);
  }
}

/**
 * Banking-specific audit logging middleware
 * Automatically logs all banking data access with enhanced security context
 */
export function bankingAuditMiddleware(action: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);
    
    // Override res.json to capture success/failure
    res.json = function(data: any) {
      const success = res.statusCode < 400;
      
      logSecurityAudit(req, res, {
        action,
        resource: 'provider_banking',
        resourceId: req.params.id || req.params.physicianId,
        success,
        errorMessage: success ? undefined : data?.error || 'Unknown error',
        metadata: {
          includeDecrypted: req.query.includeDecrypted === 'true',
          statusCode: res.statusCode
        }
      });
      
      return originalJson(data);
    };
    
    next();
  };
}

/**
 * Generic audit logging middleware for sensitive operations
 */
export function auditMiddleware(action: string, resource: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);
    
    // Override res.json to capture success/failure
    res.json = function(data: any) {
      const success = res.statusCode < 400;
      
      logSecurityAudit(req, res, {
        action,
        resource,
        resourceId: req.params.id,
        success,
        errorMessage: success ? undefined : data?.error || 'Unknown error',
        metadata: {
          statusCode: res.statusCode
        }
      });
      
      return originalJson(data);
    };
    
    next();
  };
}

/**
 * Get audit log entries for review (admin only)
 */
export function getAuditLog(limit: number = 100, filter?: Partial<AuditLogEntry>): AuditLogEntry[] {
  let entries = [...auditLog].reverse(); // Most recent first
  
  if (filter) {
    entries = entries.filter(entry => {
      return Object.entries(filter).every(([key, value]) => {
        return entry[key as keyof AuditLogEntry] === value;
      });
    });
  }
  
  return entries.slice(0, limit);
}

/**
 * Enhanced banking limiter middleware that properly handles rate limiting
 * and provides better error responses
 */
export function createBankingLimiterMiddleware(rateLimiter: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    rateLimiter(req, res, (err: any) => {
      if (err) {
        // Log rate limit violation
        logSecurityAudit(req, res, {
          action: 'rate_limit_violation',
          resource: 'provider_banking',
          success: false,
          errorMessage: 'Rate limit exceeded for banking data access',
          metadata: {
            limitType: 'banking_access'
          }
        });
        
        return res.status(429).json({
          error: 'Too many banking data requests. Please try again later.',
          retryAfter: Math.ceil((rateLimiter.windowMs || 900000) / 1000) // Convert to seconds
        });
      }
      next();
    });
  };
}