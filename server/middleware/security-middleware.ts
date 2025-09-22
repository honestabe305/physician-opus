import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

/**
 * Request size limits for different operation types
 */
export const REQUEST_SIZE_LIMITS = {
  STANDARD: '10mb',    // Standard operations
  FILE_UPLOAD: '50mb', // File uploads  
  BULK_OPERATIONS: '25mb' // Bulk data operations
};

/**
 * Pagination configuration
 */
export const PAGINATION_CONFIG = {
  DEFAULT_LIMIT: 25,
  MAX_LIMIT: 100,
  DEFAULT_OFFSET: 0
};

/**
 * Rate limiting configurations for different operation types
 */
export const RATE_LIMITERS = {
  // Standard API operations
  standard: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Sensitive operations (admin, banking, etc.)
  sensitive: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per 15 minutes
    message: 'Too many sensitive operation requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Search and query operations
  search: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 searches per minute
    message: 'Too many search requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // File upload operations
  upload: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 uploads per 15 minutes
    message: 'Too many upload requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Login attempts (most restrictive)
  auth: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 attempts per minute
    message: 'Too many authentication attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  }),
};

/**
 * CORS configuration for production
 */
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // In production, check against allowed origins
    if (process.env.NODE_ENV === 'production') {
      const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim());
      
      if (allowedOrigins.length === 0) {
        return callback(new Error('No allowed origins configured'), false);
      }
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'), false);
      }
    } else {
      // In development, allow localhost and development domains
      const devOrigins = [
        'http://localhost:3000',
        'http://localhost:5000',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5000',
        origin // Allow the current origin in development
      ];
      
      if (devOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'), false);
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Session-Token'
  ],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400 // 24 hours
};

/**
 * Enhanced pagination middleware
 */
export function paginationMiddleware(req: Request, res: Response, next: NextFunction) {
  // Parse pagination parameters
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(
    PAGINATION_CONFIG.MAX_LIMIT,
    Math.max(1, parseInt(req.query.limit as string) || PAGINATION_CONFIG.DEFAULT_LIMIT)
  );
  const offset = (page - 1) * limit;
  
  // Attach pagination info to request
  req.pagination = {
    page,
    limit,
    offset
  };
  
  next();
}

/**
 * Sorting middleware for consistent responses
 */
export function sortingMiddleware(defaultSort: string = 'createdAt:desc') {
  return (req: Request, res: Response, next: NextFunction) => {
    const sortParam = req.query.sort as string || defaultSort;
    const [field, direction = 'asc'] = sortParam.split(':');
    
    req.sorting = {
      field,
      direction: direction.toLowerCase() === 'desc' ? 'desc' : 'asc'
    };
    
    next();
  };
}

/**
 * Request size validation middleware
 */
export function requestSizeMiddleware(maxSize: string = REQUEST_SIZE_LIMITS.STANDARD) {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.get('content-length');
    
    if (contentLength) {
      const sizeInBytes = parseInt(contentLength);
      const maxSizeInBytes = parseSize(maxSize);
      
      if (sizeInBytes > maxSizeInBytes) {
        return res.status(413).json({
          error: `Request size too large. Maximum allowed: ${maxSize}`,
          receivedSize: `${Math.round(sizeInBytes / 1024 / 1024 * 100) / 100}MB`,
          maxSize
        });
      }
    }
    
    next();
  };
}

/**
 * Helper function to parse size strings like '10mb' to bytes
 */
function parseSize(sizeStr: string): number {
  const units: { [key: string]: number } = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };
  
  const match = sizeStr.toLowerCase().match(/^(\d+(?:\.\d+)?)(b|kb|mb|gb)$/);
  if (!match) {
    throw new Error(`Invalid size format: ${sizeStr}`);
  }
  
  const [, size, unit] = match;
  return parseFloat(size) * units[unit];
}

/**
 * Comprehensive security headers middleware
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Cache control for sensitive endpoints
  if (req.path.includes('/banking') || req.path.includes('/decrypted')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
}

/**
 * Enhanced pagination response helper
 */
export function createPaginatedResponse<T>(
  data: T[],
  totalCount: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(totalCount / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  return {
    data,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null
    }
  };
}

// Add types to Express Request
declare global {
  namespace Express {
    interface Request {
      pagination?: {
        page: number;
        limit: number;
        offset: number;
      };
      sorting?: {
        field: string;
        direction: 'asc' | 'desc';
      };
    }
  }
}