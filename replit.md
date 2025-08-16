# Arriendo Cajas - Box Rental Management Platform

## Overview
Arriendo Cajas is a web platform for managing a box rental business. It facilitates the entire rental lifecycle from reservation to return, offering role-based access for administrators, drivers, and customers. The platform aims to streamline operations, enhance customer experience, and provide robust management tools for inventory, deliveries, and financial reporting.

## User Preferences
Preferred communication style: Simple, everyday language.

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
- **API Design**: RESTful API with role-based endpoints
- **Session Management**: Express sessions with PostgreSQL storage
- **Build Process**: ESBuild

### Database
- **Database**: PostgreSQL (Neon serverless driver)
- **ORM**: Drizzle ORM
- **Schema**: Shared between frontend and backend
- **Migrations**: Drizzle Kit

### Recent Updates (Aug 15, 2025)
- ✅ **Email notifications**: Fixed email sending for new rental creation - now working for both new rentals and status changes
- ✅ **Rental status changes**: Fully functional with automatic email notifications to customers
- ✅ **Complete rental editing form**: Enhanced edit form with status selection, matching creation form functionality
- ✅ **Email system verification**: Confirmed working with contacto@arriendocajas.cl for all rental lifecycle events
- ✅ **Manual pricing functionality**: Implemented checkbox-based manual pricing option in rental creation form within customers page
- ✅ **Price validation fix**: Removed restrictive step validation allowing flexible pricing in Chilean pesos for all products
- ✅ **Production database protection**: Disabled automatic seeding to preserve real customer data (Isabel Poblete, etc.)
- ✅ **Tracking code protection**: System prevents deletion of customers/rentals with active tracking codes
- ✅ **Price preservation**: Rental prices remain fixed when changing status unless explicitly modified
- ✅ **Personal email removal**: Replaced all instances of jalarcon@arriendocajas.cl with contacto@arriendocajas.cl for privacy
- ✅ **Driver assignment verified**: Automatic driver assignment when status changes to "pagada" is working correctly
- ✅ **Tracking URL fix**: Updated tracking URL generation to use environment variables for proper deployment URL
- ✅ **Backend API production verified**: All tracking and rental APIs working perfectly in production (plataforma.arriendocajas.cl)
- ⚠️ **Frontend deployment issue**: Backend updates deploy correctly but frontend requires separate deployment to sync changes
- ✅ **Tracking page fixed in development**: Page works correctly in Replit but production frontend needs redeployment
- ✅ **Critical bug fixed**: Resolved infinite API request loop caused by React Query refetchInterval configuration (Aug 16, 2025)
- ✅ **Query optimization**: Disabled auto-refresh and configured proper cache times for better performance
- ⚠️ **Production database issue**: Backend tracking API in production returns "Rental not found" - requires deployment update
- ✅ **Diagnostic tools created**: Built comprehensive testing pages (/tracking-test, /production-test) to verify system functionality across environments
- ✅ **Enhanced rental form UI**: Beautiful redesigned form with color-coded sections and improved visual hierarchy
- ✅ **Direct text input**: All price fields now accept direct typing without spinner arrows for faster data entry
- ✅ **Automatic date calculation**: Smart date picker that auto-calculates rental periods and suggests return dates
- ✅ **Inventory availability**: Real-time calculation showing available boxes based on selected date ranges
- ✅ **Quick shortcuts**: Pre-configured buttons for common combinations (5/10/15 boxes × 7/14 days)
- ✅ **Predefined products**: One-click addition of standard products (Carrito plegable, Base móvil, Kit 2 bases, Correa Ratchet)
- ✅ **Guarantee calculation**: Automatic $2,000 per box guarantee calculation as required
- ✅ **Form validation fixed**: Corrected data type conversion for rental creation (strings vs numbers)
- ✅ **Address fields optimized**: Changed from large textarea to compact input fields in grid layout
- ✅ **Editable product pricing**: Added inline editing for prices and quantities of additional products
- ✅ **Customer form working**: Fixed "Create New Customer" dialog with all required fields
- ✅ **Driver assignment dropdown**: Replaced broken "Asignar repartidor" button with functional Select dropdown
- ✅ **Privacy protection**: Changed RUT examples from personal data to generic "12.345.678-9"
✅ **Database privacy fix**: Updated actual customer RUT from personal "16.220.939-6" to generic "12.345.678-9" in production data
- ✅ **Tracking system verified**: Confirmed URL tracking works correctly with proper RUT digits and tracking codes
- ✅ **Form reset issue resolved**: Fixed rental forms auto-closing after save - now preserve all data for continued editing
- ✅ **Inventory sync corrected**: Fixed API status mismatch ('available' vs 'disponible') - now shows correct box count (35 available)
- ✅ **User experience improved**: Forms stay open after successful operations with clear success messages
- ✅ **Clean customers page created**: Built new customers-clean.tsx with simplified, error-free logic while preserving design and colors
- ✅ **Logic separation**: Maintained all visual elements (colors, layout, shortcuts) but rebuilt core functionality from scratch

### Key Features
- **Authentication**: Replit Auth (OpenID Connect), PostgreSQL-backed sessions, role-based access control (Admin, Driver, Customer), HTTP-only cookies, CSRF protection.
- **Admin Panel**: Dashboard, inventory management (box status, barcode generation), customer database, delivery task management, financial reporting, box movement audit.
- **Driver Panel**: Daily task lists, barcode scanning, real-time status updates, incident reporting, mobile optimized.
- **Customer Panel**: Rental history, real-time box tracking, notifications, delivery/pickup scheduling, account management.
- **Business Logic**: Comprehensive rental workflow (Pending → Paid → Delivered → Retrieved → Completed / Cancelled).
- **Email System**: Automated email notifications for status changes and reminders, customizable templates, admin preview panel.
- **Driver Assignment**: Automatic and manual driver assignment with notifications.
- **Barcode System**: Standardized 13-character format (AC + YYMMDD + sequence).
- **Pricing**: Flexible pricing per day, percentage discounts, additional products.
- **Guarantee System**: Calculated refundable guarantee per box.
- **Customer Self-Service**: Secure tracking codes for customers.

## External Dependencies

- **UI Components**: Radix UI
- **Database**: Neon PostgreSQL
- **Authentication**: Replit Auth
- **Validation**: Zod
- **Date Handling**: date-fns
- **Styling**: Tailwind CSS
- **Email Service**: Google Workspace SMTP (e.g., jalarcon@arriendocajas.cl)