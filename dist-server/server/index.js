"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const routes_1 = require("./routes");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? true // Allow all origins in production for Replit deployment
        : ['http://localhost:5000', 'http://localhost:8080'],
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Serve static files from the Vite build output in production
if (process.env.NODE_ENV === 'production') {
    app.use(express_1.default.static(path_1.default.join(process.cwd(), 'dist')));
}
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API routes
app.use('/api', routes_1.router);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    // Validation errors
    if (err.name === 'ZodError') {
        return res.status(400).json({
            error: 'Validation failed',
            details: err.errors
        });
    }
    // Database errors
    if (err.code === '23505') {
        return res.status(409).json({
            error: 'Duplicate entry',
            message: 'A record with this information already exists'
        });
    }
    // Generic error
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});
// Serve frontend for all other routes in production (client-side routing fallback)
if (process.env.NODE_ENV === 'production') {
    app.use((req, res) => {
        res.sendFile(path_1.default.join(process.cwd(), 'dist', 'index.html'));
    });
}
// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API base URL: http://localhost:${PORT}/api`);
});
exports.default = app;
