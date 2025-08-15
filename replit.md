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
- ✅ **Email system verification**: Confirmed working with jalarcon@arriendocajas.cl for all rental lifecycle events

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