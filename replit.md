# PhysicianCRM - Medical Credentialing Management System

## Overview

PhysicianCRM is a comprehensive medical credentialing management system designed to streamline physician data management, licensing, certification tracking, and document handling for healthcare organizations. The application provides a modern CRM interface for managing physician demographics, credentials, practice information, and compliance requirements with secure document storage capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses a modern React-based frontend built with:
- **Vite** as the build tool for fast development and optimized production builds
- **React 18** with TypeScript for type-safe component development
- **React Router** for client-side routing and navigation
- **TanStack Query** for server state management, caching, and data synchronization
- **Shadcn/ui + Radix UI** component library providing accessible, customizable UI components
- **Tailwind CSS** for utility-first styling with custom medical-themed design tokens
- **React Hook Form + Zod** for form management and validation

The frontend follows a component-based architecture with:
- Reusable UI components in `/src/components/ui/`
- Page-level components in `/src/pages/`
- Custom hooks for shared logic
- Centralized routing configuration
- Responsive design with mobile-first approach

### Backend Architecture
The backend is built with Node.js and Express.js featuring:
- **RESTful API** design with structured route handlers
- **Modular architecture** with separate routing, storage, and database layers
- **Storage abstraction layer** (PostgreSQL implementation) for database operations
- **Comprehensive error handling** with validation and database error management
- **CORS configuration** for cross-origin requests
- **Request/response middleware** for JSON parsing and error handling

### Database Architecture
The system uses **PostgreSQL** with **Drizzle ORM** for type-safe database operations:
- **Neon Database** as the serverless PostgreSQL provider (fixed to use PostgreSQL instead of fallback memory storage)
- **Drizzle Kit** for schema migrations and database management
- **Comprehensive schema** covering all physician credentialing aspects:
  - Profiles and user management
  - Physician demographics and contact information
  - Licensing and certifications
  - Education and work history
  - Hospital affiliations and compliance records
  - Document management with categorization
- **Enum types** for standardized data (gender, document types, user roles)
- **UUID primary keys** for scalability and security
- **Encrypted sensitive data** handling (SSN, addresses)
- **JSONB fields** for flexible data structures

### Authentication and Authorization
The system implements role-based access control:
- **User roles**: admin, staff, viewer with different permission levels
- **Profile-based authentication** with secure user management
- **Session-based authentication** ready for implementation

### Data Validation and Type Safety
- **Zod schemas** for runtime validation on both client and server
- **TypeScript interfaces** generated from database schema
- **Form validation** with real-time feedback
- **API request/response validation** ensuring data integrity

### Document Management
The system is designed to handle various medical documents:
- **Document categorization** with predefined types (licenses, certifications, insurance, etc.)
- **File upload handling** with size limits and type validation
- **Document metadata tracking** with timestamps and categorization
- **Secure document storage** architecture ready for cloud integration

### Search and Analytics
- **Full-text search** capabilities for physician data
- **Advanced filtering** by status, specialties, and other criteria
- **Analytics endpoints** for status summaries and expiration reporting
- **Dashboard metrics** for system overview and compliance tracking

### Performance and Scalability
- **Connection pooling** with Neon serverless database
- **Query optimization** with Drizzle ORM
- **Client-side caching** with TanStack Query
- **Responsive design** for mobile and desktop users
- **Modular component architecture** for maintainability

## External Dependencies

### Database Services
- **Neon Database** - Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM** - Type-safe database toolkit with PostgreSQL adapter

### Frontend Libraries
- **Vite** - Modern build tool and development server
- **React Router** - Declarative routing for React applications
- **TanStack Query** - Powerful data synchronization for React
- **Shadcn/ui** - High-quality accessible component library built on Radix UI
- **Tailwind CSS** - Utility-first CSS framework
- **React Hook Form** - Performant forms with easy validation
- **Zod** - TypeScript-first schema validation

### Backend Dependencies
- **Express.js** - Web framework for Node.js
- **CORS** - Cross-origin resource sharing middleware
- **Node.js WebSocket** (ws) - For real-time capabilities (configured but not actively used)

### Development Tools
- **TypeScript** - Static type checking for JavaScript
- **ESLint** - Code linting and formatting
- **Lovable Tagger** - Development-time component tagging for hot reloading

### Build and Deployment
- **Vite build system** with optimized production builds
- **Environment-based configuration** for development and production
- **Health check endpoints** for monitoring and deployment verification