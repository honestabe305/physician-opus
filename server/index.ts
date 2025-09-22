import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import path from 'path';
import { router } from './routes';

// CRITICAL: Force Autoscale deployment NOW - Express server must run in production
// Updated: September 17, 2025 - PRODUCTION DEPLOYMENT REQUIRED (Build 002)
// Expected startup messages: 🚀 Server running on port, 📋 Health check, 🌍 Environment

const app = express();
// Use PORT env var (defaults to 5000 for Replit compatibility)
const PORT = parseInt(process.env.PORT || '5000', 10);

// Trust proxy configuration - MUST be before other middleware
// Always trust proxy in Replit environment (both dev and production)
app.set('trust proxy', 1); // Trust first proxy (required for Replit deployment)

// Compression middleware - enable gzip compression for responses
app.use(compression({
  // Compress all responses over 1kb
  threshold: 1024,
  // Compression level (1-9, 6 is default good balance)
  level: 6,
  // Only compress if response will be >= 1kb
  filter: (req, res) => {
    // Don't compress if client doesn't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use default compression filter
    return compression.filter(req, res);
  }
}));

// Middleware setup
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? true  // Allow all origins in production for Replit deployment
    : ['http://localhost:5000', 'http://localhost:5173', 'http://localhost:3001'],
  credentials: true
}));

// Cookie parser middleware - must come before routes
app.use(cookieParser());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the Vite build output in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(process.cwd(), 'dist')));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api', router);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server Error:', err);
  
  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors
    });
  }
  
  // Handle PostgreSQL unique constraint violations
  if (err.code === '23505') {
    return res.status(409).json({
      error: 'Duplicate entry',
      message: 'A record with this information already exists'
    });
  }
  
  // Handle PostgreSQL foreign key constraint violations
  if (err.code === '23503') {
    return res.status(400).json({
      error: 'Foreign key constraint violation',
      message: 'Referenced record does not exist'
    });
  }
  
  // Handle general database errors
  if (err.code && err.code.startsWith('23')) {
    return res.status(400).json({
      error: 'Database constraint violation',
      message: 'The operation violates a database constraint'
    });
  }
  
  // Generic server error
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err.details || undefined
    })
  });
});

// Serve frontend for all other routes in production (SPA fallback)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Skip API routes and static files
    if (req.path.startsWith('/api') || req.path.includes('.')) {
      return next();
    }
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
  });
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📋 Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`🔌 API base URL: http://0.0.0.0:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;