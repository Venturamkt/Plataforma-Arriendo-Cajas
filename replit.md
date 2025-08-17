# Arriendo Cajas - Box Rental Management Platform

## Overview
Arriendo Cajas is a comprehensive web platform for managing a box rental business, featuring complete customer management, rental tracking, inventory control, driver management, and financial reporting. Built specifically for Chilean business operations.

## User Preferences
- Preferred communication style: Simple, everyday language (non-technical)
- Chilean business terminology: "arrendada" not "alquilada", "carros de transporte", "cintas de amarre"
- Currency format: Chilean peso ($2.000 format)
- Horizontal navigation preferred over vertical scrolling for large inventories
- Date ranges with preset options: 7, 28, 30, 60, 90 days, 6 months, 1 year, and custom

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS (custom colors: red #C8201D, blue #2E5CA6)
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Responsiveness**: Mobile-first design

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API (basic structure)
- **Database**: PostgreSQL (completely reset)
- **ORM**: Drizzle ORM

### Database
- **Database**: PostgreSQL (Neon serverless driver)
- **Schema**: Minimal - only sessions and basic users table
- **Current State**: Completely clean, no business data

### Recent Updates (Aug 17, 2025)
- ✅ **Complete Business Platform**: Full rental management system built from scratch
- ✅ **Portal Administrador**: Admin dashboard with sidebar navigation and real-time KPIs
- ✅ **Gestión de Clientes**: Complete customer management with Chilean RUT validation
- ✅ **Gestión de Arriendos**: Full rental CRUD with inventory assignment and status tracking
- ✅ **Gestión de Inventario**: Comprehensive inventory management with horizontal tabs and pagination
- ✅ **Gestión de Repartidores**: Complete driver management with rental assignment system
- ✅ **Módulo de Pagos/Finanzas**: Financial module with flexible date ranges (7d-1y, custom) and comprehensive payment tracking
- ✅ **Sistema de Emails Gmail Workspace**: Complete email notification system with HTML templates
- ✅ **Sistema de Tracking Completo**: Public tracking with RUT-based codes and automated email notifications
- ✅ **Emails Automáticos por Estado**: Automated emails for pendiente→programada→entregada→retirada→finalizada
- ✅ **Google Maps Review Integration**: Review request system in finalizada status with guarantee return process
- ✅ **Enhanced Admin Interface**: Improved tracking button with professional WhatsApp-ready message format
- ✅ **Backend Completo**: REST APIs for all modules with PostgreSQL database
- ✅ **Data Integrity**: Proper foreign key constraints and validation throughout
- ✅ **Portal de Clientes Funcional**: Customer authentication system FULLY WORKING with RUT/email login, ultra-simple navigation showing only latest rental, session persistence, and real database integration
  - **Status**: ✅ COMPLETAMENTE FUNCIONAL - Login, sesión y datos funcionando perfectamente
  - **RUT de prueba**: 16.220.939-6 (José - 12 arriendos activos)
  - **Navegación**: Ultra simplificada mostrando solo el arriendo más reciente
  - **Technical Fix**: Eliminado queryClient problemático, implementado fetch directo con useState/useEffect
- ✅ **Sistema de Tracking Público por Email**: Páginas públicas de seguimiento accesibles vía email sin autenticación
  - **URL Pattern**: `/track/:trackingCode/:trackingToken` (ej: `/track/09394IW36/YSR3E`)
  - **API Backend**: `/api/track/:trackingCode/:trackingToken` separado del frontend
  - **Diseño**: Ultra-simplificado sin header de logout, perfecto para emails
  - **Funcionalidad**: Acceso público directo, datos completos del arriendo, diseño responsive
- ✅ **Database Schema Alignment Fix (Aug 17, 2025)**: Resolved database query errors preventing deployment
  - **Issues Fixed**: 
    - Property `paymentDate` not found (used `createdAt` instead)
    - Property `startDate` not found in rentals (used `createdAt` instead)
    - Incorrect property access on joined queries (`rental`→`rentals`, `customer`→`customers`)
    - Type errors with dynamic WHERE clause chaining in inventory queries
    - Missing type annotations for array variables
  - **Solution**: Aligned all database queries with actual schema structure from `shared/schema.ts`
  - **Status**: ✅ ALL LSP ERRORS RESOLVED - Application running successfully with zero compilation errors

### Current Features
- **Home Page**: Professional landing page with 3 access portals (Customers, Drivers, Admin)
- **Admin Dashboard**: Complete portal with sidebar navigation, real-time KPIs, and system alerts
- **Customer Management**: Full CRUD with search, filters, Chilean RUT validation, and debt tracking
- **Rental Management**: Complete rental lifecycle management with inventory assignment and status tracking
- **Inventory Management**: Comprehensive system with horizontal tabs, pagination (20 items/page), and category-specific views
- **Driver Management**: Complete repartidor system with assignment to scheduled rentals and constraint validation
- **Payments/Finance Module**: Complete financial tracking with flexible date ranges, payment methods, and comprehensive statistics
- **Email Notification System**: Gmail Workspace integration with HTML templates for rental confirmations and driver assignments
- **Customer Portal**: Complete login system with RUT/email authentication, real-time dashboard, rental history, and automatic RUT formatting
- **Backend API**: Complete REST endpoints for all modules with proper validation and logging
- **Database**: PostgreSQL with comprehensive schema and foreign key constraints
- **Sample Data**: Realistic Chilean business data for testing and demonstration

### Email System Specifications
- **Provider**: Gmail Workspace (jalarcon@arriendocajas.cl)
- **Rental Notifications**: Cliente + contacto@arriendocajas.cl
- **Driver Assignments**: asignaciones@arriendocajas.cl + conductor
- **Templates**: HTML responsivos con información completa de arriendos
- **Triggers**: Automático en cada cambio de estado de arriendo
- **Status Emails**: pendiente → programada → entregada → retirada → finalizada
- **Google Review**: Email especial en estado "finalizada" con link de reseñas
- **Configuration**: SSL/TLS con App Password authentication
- **Status**: ✅ FUNCIONANDO - Emails enviándose correctamente con tracking URLs públicos

## External Dependencies
- **UI Components**: Radix UI
- **Database**: Neon PostgreSQL
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Next Steps
Ready for new instructions and fresh implementation based on user requirements.