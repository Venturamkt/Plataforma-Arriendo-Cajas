# Arriendo Cajas - Box Rental Management Platform

## Overview
Arriendo Cajas is a web platform for managing a box rental business. The project has been completely reset to start fresh with a clean architecture and simple home page with three access portals.

## User Preferences
- Preferred communication style: Simple, everyday language.
- Complete reset requested: Remove all complex functionality and start from basics
- Keep only the home page with 3 access options: Customers, Drivers, Admin

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

### Recent Updates (Aug 16, 2025)
- 🔄 **Complete Project Reset**: Removed all complex functionality at user's request
- ✅ **Database Cleaned**: Dropped all tables and recreated clean schema
- ✅ **Home Page Created**: Beautiful landing page with 3 access portals matching user's design
- ✅ **Portal Administrador**: Complete admin dashboard with sidebar navigation and KPIs
- ✅ **Gestión de Clientes**: Full customer management with search, filters, CRUD operations (simplified forms)
- ✅ **Gestión de Arriendos**: Complete rental management with box quantities, dates, addresses, payments, and status tracking
- ✅ **Professional UI**: Clean, responsive design following Chilean business standards
- ✅ **Backend API**: Complete REST API with validation and activity logging
- ✅ **Sample Data**: Automatic seeding with realistic Chilean customer data

### Current Features
- **Home Page**: Landing page with 3 access portals (Customers, Drivers, Admin)
- **Admin Dashboard**: Complete portal with sidebar navigation, KPIs, and alerts
- **Customer Management**: Full CRUD with search, filters, contact info, and debt tracking (simplified)
- **Rental Management**: Complete CRUD for rental operations with box quantities, dates, addresses, and status tracking
- **Backend API**: Complete REST endpoints for customers, rentals, payments, and inventory
- **Database**: PostgreSQL with comprehensive schema for business operations
- **Sample Data**: Realistic Chilean customer and rental data for testing and demo

## External Dependencies
- **UI Components**: Radix UI
- **Database**: Neon PostgreSQL
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Next Steps
Ready for new instructions and fresh implementation based on user requirements.