# Arriendo Cajas - Box Rental Management Platform

## Overview
Arriendo Cajas is a comprehensive web platform for managing a box rental business, featuring complete customer management, rental tracking, inventory control, driver management, and financial reporting. Built specifically for Chilean business operations.

## User Preferences
- **Preferred language**: Spanish (always respond in Spanish)
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
- ✅ **Emails Automáticos por Estado**: Automated emails for pendiente→pagado→entregada→retirada→finalizada
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
- ✅ **Sistema de Eliminación Completo (Aug 23, 2025)**: Funcionalidad de eliminación implementada y funcionando
  - **Arriendos**: Botón de eliminación con confirmación, validación de datos, actualización automática
  - **Clientes**: Sistema existente corregido, validación de arriendos activos/deudas antes de eliminar
  - **Backend**: Rutas DELETE implementadas con logging de actividades y manejo de errores
  - **Frontend**: Corrección de parsing JSON en respuestas 204 (No Content)
  - **Status**: ✅ COMPLETAMENTE FUNCIONAL - Eliminación segura con confirmaciones y validaciones
- ✅ **Actualización Final de Contacto (Aug 23, 2025)**: Números de teléfono corregidos en páginas de seguimiento
  - **CustomerTrackingPage**: Número actualizado de +56 9 1234 5678 a +56 9 8729 0995
  - **TrackingPage**: Números de teléfono y WhatsApp actualizados con el número correcto
  - **Status**: ✅ INFORMACIÓN DE CONTACTO COMPLETAMENTE ACTUALIZADA
- ✅ **Sistema de Estados Simplificado (Aug 23, 2025)**: Eliminación completa de "Retiro Programado"
  - **Estado eliminado**: "retiro_programado" removido del flujo de arriendos
  - **Flujo simplificado**: Pendiente → Pagado → En Ruta → Entregada → Retirada → Finalizada
  - **Frontend actualizado**: Todos los dropdowns de estado corregidos en RentalsSection.tsx
  - **Backend actualizado**: Consultas SQL y storage.ts actualizados sin referencias al estado eliminado
  - **Status**: ✅ FLUJO SIMPLIFICADO Y FUNCIONAL
- ✅ **Nuevos Emails Automáticos Mejorados (Aug 23, 2025)**: Sistema de notificaciones expandido
  - **Email 2 días antes del retiro**: Consejos de limpieza y preparación de cajas (pickupReminder2Days)
  - **Email estado "Retirada"**: Solicitud de datos bancarios para devolución de garantía (returnConfirmation)
  - **Email estado "Finalizada"**: Agradecimiento y link de Google Maps para reseñas (completionWithReview)
  - **Email estado "En Ruta"**: Notificación que el repartidor va en camino con datos del conductor y tiempo estimado
  - **Formato de contacto estandarizado**: Todos los emails usan el formato correcto:
    - "Si tienes alguna consulta, no dudes en contactarnos:"
    - "✉️ Email: contacto@arriendocajas.cl"
    - "💬 WhatsApp: +56 9 8729 0995 (con link https://wa.me/56987290995)"
  - **Status**: ✅ SISTEMA DE EMAILS COMPLETO CON FLUJO DE COMUNICACIÓN TOTAL
- ✅ **Corrección Final Bug Cálculo de Precios (Aug 23, 2025)**: Error en la celda naranja DEFINITIVAMENTE resuelto
  - **Problema**: Al agregar productos adicionales, se duplicaba el cálculo exponencialmente (173.990 → 204.590 → 809.990)
  - **Causa raíz final**: Función `updateTotalAmount` usaba `formData.totalAmount` como fallback en lugar de solo `baseRentalPrice`
  - **Solución DEFINITIVA**: 
    - Campo `baseRentalPrice` es la ÚNICA fuente de verdad para el precio base de las cajas
    - Función `updateTotalAmount` corregida para NUNCA usar `totalAmount` como base
    - Input de precio total establece `baseRentalPrice` inmutable y recalcula total inmediatamente
    - Lógica simplificada: `Total = baseRentalPrice (fijo) + productos adicionales + garantía`
  - **Funcionalidades finales**:
    - Input "Precio Total del Arriendo" establece `baseRentalPrice` inmutable
    - Todas las funciones de productos adicionales usan SOLO `baseRentalPrice` como base
    - `totalAmount` es SOLO resultado del cálculo, nunca fuente
    - Eliminada lógica compleja de `preserveManualTotal` y `recalculateFormData` para productos
  - **Status**: ✅ CÁLCULO DE PRECIOS COMPLETAMENTE FUNCIONAL - baseRentalPrice inmutable garantiza cálculo correcto

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
- **Status Emails**: pendiente → pagado → entregada → retirada → finalizada
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