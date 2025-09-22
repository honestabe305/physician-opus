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
  - **CAQH-aligned payer enrollment system** with complete enrollment lifecycle management
- **Enum types** for standardized data (gender, document types, user roles, enrollment statuses)
- **UUID primary keys** for scalability and security
- **Encrypted sensitive data** handling (SSN, addresses, banking information)
- **JSONB fields** for flexible data structures
- **Performance optimization** with strategic database indexing for production-scale queries

### Authentication and Authorization
The system implements comprehensive authentication and role-based access control:
- **Traditional username/password authentication** with secure bcrypt password hashing
- **User roles**: admin, staff, viewer with different permission levels  
- **Session-based authentication** with JWT tokens stored in secure HTTP-only cookies
- **Protected routes** that redirect unauthenticated users to login page
- **Session management** with configurable timeout and auto-lock features
- **Activity logging** tracks all authentication events (login, logout, failed attempts)
- **Security features**:
  - Rate limiting (5 login attempts per minute)
  - Account lockout after 5 failed attempts (15 minute lockout)
  - Password complexity validation (min 8 chars, uppercase, lowercase, number, special char)
  - Session extension and remember me functionality (24h default, 7 days with remember me)
  - Lock screen for temporary session protection without logout
- **Admin account**: Created during initial setup via secure deployment process

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

### Automated Renewal Workflow System
PhysicianCRM includes an intelligent automated renewal workflow system that proactively manages license and certification renewals:

#### How It Works
- **Automatic Detection**: The system continuously monitors all physician licenses, DEA registrations, and CSR licenses for upcoming expirations
- **Smart Workflow Creation**: Every 6 hours, the system automatically creates renewal workflows for any credentials expiring within 90 days
- **Duplicate Prevention**: The system prevents duplicate workflows by checking for existing active renewal processes before creating new ones
- **Multi-Credential Support**: Handles physician licenses, DEA registrations, and CSR licenses with credential-specific renewal requirements

#### Background Processing
- **Scheduled Jobs**: Runs automatically every 6 hours without user intervention
- **Comprehensive Scanning**: Processes all 220+ physicians and their 770+ credentials during each scan
- **Error Handling**: Robust error handling ensures individual failures don't stop the entire process
- **Audit Trail**: Complete logging of all automatic workflow creation activities

#### Workflow Lifecycle
1. **Automatic Creation**: System identifies expiring credentials and creates renewal workflows
2. **Notification Generation**: Generates alerts at 90, 60, 30, 7, and 1 days before expiration
3. **Progress Tracking**: Tracks renewal progress through statuses: not_started → in_progress → filed → under_review → approved/rejected
4. **Checklist Management**: Provides credential-specific checklists (CME requirements, fees, documentation, etc.)
5. **Auto-Expiration**: Automatically marks workflows as expired if renewal isn't completed by the expiration date

#### User Benefits
- **Proactive Management**: No manual monitoring needed - the system automatically identifies renewal needs
- **Early Warning System**: Receive notifications well in advance of expiration deadlines
- **Streamlined Process**: Pre-configured checklists and timelines for each renewal type
- **Compliance Assurance**: Ensures no credentials expire unnoticed, maintaining provider compliance
- **Dashboard Integration**: Real-time renewal statistics and upcoming renewal counts displayed on the main dashboard

#### Technical Implementation
- **Background Scheduler**: Uses NodeJS intervals to run automated jobs every 6 hours
- **Database Integration**: Directly integrates with physician licenses, DEA registrations, and CSR licenses tables
- **Service Architecture**: Modular renewal service with comprehensive error handling and logging
- **Scalable Design**: Efficiently processes large datasets without performance impact

#### Renewal Statistics Available
- Total active renewal workflows
- Workflows in progress, pending review, completed, and expired
- Upcoming renewals in 30, 60, and 90-day timeframes
- Success rates and completion metrics

The automated renewal workflow system transforms manual credential tracking into a proactive, automated process that ensures no renewals are missed while providing comprehensive visibility into the renewal pipeline.

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