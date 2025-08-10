# Arriendo Cajas - Box Rental Management Platform

## Overview

This is a comprehensive web platform for managing a box rental business called "Arriendo Cajas". The system provides role-based access for administrators, drivers, and customers to handle the complete rental lifecycle from reservation to return. The platform uses a modern tech stack with React frontend, Express backend, PostgreSQL database, and implements a robust authentication system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom brand colors (red #C8201D, blue #2E5CA6)
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Mobile Support**: Responsive design with mobile-first approach

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with role-based endpoints
- **Session Management**: Express sessions with PostgreSQL storage
- **Build Process**: ESBuild for production bundling

### Database Architecture
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Shared schema between frontend and backend
- **Migrations**: Drizzle Kit for database migrations

## Key Components

### Authentication System
- **Provider**: Replit Auth with OpenID Connect
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **User Roles**: Admin, Driver, Customer with role-based access control
- **Security**: HTTP-only cookies, CSRF protection, secure session management

### Role-Based Modules

#### Admin Panel (Backoffice)
- Dashboard with key metrics and status charts
- Complete inventory management with box status tracking
- Customer database with rental history
- Delivery task management and assignment
- Financial reporting and revenue tracking
- Box movement history and audit trails

#### Driver Panel
- Daily task lists for deliveries and pickups
- Barcode scanning functionality using device camera
- Real-time status updates (delivered, not delivered, retrieved)
- Incident reporting with comments
- Mobile-optimized interface

#### Customer Panel
- Personal rental history and active rentals
- Real-time status tracking of rented boxes
- Days remaining notifications
- Delivery and pickup scheduling
- Account management

### Business Logic
The system implements a comprehensive rental workflow:
1. **Reservation** → Pendiente (Pending)
2. **Payment** → Pagada (Paid)
3. **Delivery** → Entregada (Delivered)
4. **Usage Period** → Entregada (Active)
5. **Pickup** → Retirada (Retrieved)
6. **Processing** → Finalizado (Completed)
7. **Cancellation** → Cancelada (Cancelled - at any point before delivery)

## Data Flow

### Database Schema
- **Users**: Authentication and role management
- **Customers**: Extended customer information and contact details
- **Boxes**: Inventory with barcode tracking and status
- **Rentals**: Rental agreements and pricing
- **Rental Boxes**: Many-to-many relationship between rentals and boxes
- **Box Movements**: Complete audit trail of box history
- **Delivery Tasks**: Driver assignments and task tracking
- **Sessions**: Secure session storage for authentication

### API Structure
- **Authentication Routes**: `/api/auth/*` for user management
- **Dashboard Routes**: `/api/dashboard/*` for metrics and analytics
- **Customer Routes**: `/api/customers/*` for customer management
- **Box Routes**: `/api/boxes/*` for inventory management
- **Rental Routes**: `/api/rentals/*` for rental operations
- **Task Routes**: `/api/tasks/*` for delivery management

## External Dependencies

### Core Dependencies
- **UI Components**: Radix UI primitives for accessible components
- **Database**: Neon PostgreSQL serverless with connection pooling
- **Authentication**: Replit Auth for secure user management
- **Validation**: Zod for runtime type validation and schema validation
- **Date Handling**: date-fns for date manipulation and formatting

### Development Dependencies
- **TypeScript**: Full type safety across the stack
- **Vite**: Fast development server and build tool
- **Tailwind CSS**: Utility-first styling with custom design system
- **ESBuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Development Environment
- **Hot Module Replacement**: Vite provides fast refresh during development
- **Type Checking**: Continuous TypeScript checking across client and server
- **Database**: Local PostgreSQL or Neon development database
- **Authentication**: Replit Auth integration for seamless development

### Production Build
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Database**: Production PostgreSQL database with migrations
- **Environment**: Node.js production server with environment variables

### Deployment Requirements
- **Environment Variables**: 
  - `DATABASE_URL` for PostgreSQL connection
  - `SESSION_SECRET` for session security
  - `REPL_ID` and `ISSUER_URL` for Replit Auth
- **Database Setup**: Automated migrations using Drizzle Kit
- **Static Assets**: Served by Express in production
- **Session Storage**: PostgreSQL-backed sessions for scalability

The architecture emphasizes type safety, scalability, and maintainability while providing a seamless user experience across different roles and devices.

## Recent Changes

### January 29, 2025
- ✓ Fixed authentication system to properly return user data from database
- ✓ Resolved database duplicate key constraint errors in user upsert operation
- ✓ Added proper TypeScript types across all frontend components
- ✓ Implemented user role management system with admin controls
- ✓ Added custom logo integration throughout the application
- ✓ Created comprehensive user management panel for administrators
- ✓ Fixed role-based routing to display appropriate dashboards for each user type
- ✓ **Dashboard now displays real data**: Removed all mock percentages and fake activity
- ✓ **Estado de Arriendos has proper sidebar navigation**: Fixed missing layout components
- ✓ **Nuevo Arriendo form includes customer creation**: Can create customers directly when needed
- ✓ **Database completely clean**: Disabled automatic test data generation for production use
- ✓ **Nueva Caja functionality**: Implemented complete box creation with barcode generation
- ✓ **Barcode system**: Standardized format AC + YYMMDD + sequence (13 characters total)
- ✓ **Pricing flexibility**: Custom prices per day, percentage discounts, and additional products
- ✓ **Customer self-service tracking**: Secure 8-character codes accessible via RUT digits + code
- ✓ **Guarantee system**: $2,000 per box calculation with clear refundable indication
- ✓ **Additional products system**: Predefined products (Carro plegable, Base Móvil, Kit 2 Bases móviles, Correa Ratchet) with manual pricing
- ✓ **Smart action buttons**: Dynamic interface shows "Nuevo Arriendo" for customers without active rentals, "Modificar Arriendo" for those with active rentals
- ✓ **Rental editing functionality**: Complete edit capability for existing rentals with pre-populated forms and proper update handling
- ✓ Application fully functional with comprehensive rental management and customer tracking

### January 30, 2025
- ✓ **Rental creation bug resolved**: Fixed critical backend validation issues preventing rental submissions
- ✓ **Rental editing implemented**: Full edit functionality with dynamic button text and pre-populated forms
- ✓ **Interface logic optimized**: Smart buttons based on customer rental status - creates new rentals only when needed, otherwise allows modification of existing rentals
- ✓ **Email notification system implemented**: Complete automated email system for all status changes (pagada, entregada, retirada, finalizado, cancelada)
- ✓ **Email templates created**: Professional, friendly templates with tracking links, customer data, and business branding
- ✓ **Admin email preview panel**: New admin section to preview all email templates and send test emails
- ✓ **Automatic email triggers**: Status changes in customer management automatically send appropriate emails
- ✓ **Email configuration support**: SMTP configuration for Gmail with environment variables (EMAIL_USER, EMAIL_PASS)
- ✓ **Customer deletion functionality**: Enhanced testing capabilities with complete customer and rental removal
- ✓ **Reminder system implemented**: Complete automated reminder system that sends emails 2 days before rental expiration
- ✓ **Reminder email template**: Professional reminder email with cleaning instructions and guarantee information
- ✓ **Admin reminder panel**: New admin section to view upcoming reminders and manually trigger reminder checks
- ✓ **Smart date calculation**: Automatic calculation of return dates based on delivery date + rental period (7/14/30 days)
- ✓ **Reminder tracking**: Dashboard shows upcoming reminders with days remaining and automatic email scheduling

### January 30, 2025 (Continued)
- ✓ **Email system fully configured**: Google Workspace integration with jalarcon@arriendocajas.cl
- ✓ **Email templates completed**: All status templates including missing "pendiente" template
- ✓ **Sidebar layout fixed**: Email preview and reminders pages now include proper admin navigation
- ✓ **Email styling corrected**: Links display correctly in both preview and actual emails
- ✓ **Email sending functional**: Test emails successfully sent through Google Workspace SMTP
- ✓ **System ready for production**: Automated emails for status changes and reminders operational