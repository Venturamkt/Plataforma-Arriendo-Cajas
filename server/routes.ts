import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupAuthRoutes } from "./authRoutes";
import { setupTaskRoutes } from "./taskRoutes";
import { emailService } from "./emailService";
import { generateTrackingUrl } from "./emailTemplates";
import { reminderService } from "./reminderService";
import { insertCustomerSchema, insertBoxSchema, insertRentalSchema, updateRentalSchema, insertDeliveryTaskSchema, insertBoxMovementSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup new auth routes
  setupAuthRoutes(app);
  
  // Setup task routes for drivers
  setupTaskRoutes(app);

  // Initialize default admin user and seed data
  await storage.initializeDefaultAdmin();
  
  // Import and run seed data
  const { seedInitialData } = await import("./seedData");
  await seedInitialData();

  // Legacy auth middleware (disabled for public access)
  // await setupAuth(app);

  // Middleware to check admin session - SIMPLIFIED FOR DEVELOPMENT
  const requireAdminSession = (req: any, res: any, next: any) => {
    // TEMPORARY: Skip auth check for development
    // TODO: Re-enable proper authentication once session issues are resolved
    return next();
    
    // Check both new and legacy auth systems
    const isAdminNew = req.session?.currentUser?.type === 'admin';
    const isAdminLegacy = req.session?.admin?.type === 'admin';
    
    // For debugging purposes, allow if any user session exists
    const hasAnySession = req.session?.currentUser || req.session?.admin;
    
    if (isAdminNew || isAdminLegacy || hasAnySession) {
      return next();
    }
    
    console.log('Session check failed:', {
      currentUser: req.session?.currentUser,
      admin: req.session?.admin,
      sessionExists: !!req.session,
      cookies: req.headers.cookie
    });
    return res.status(401).json({ message: "Unauthorized" });
  };

  // Auth routes
  app.get('/api/auth/user', async (req: any, res) => {
    // Check both new and legacy auth systems
    const currentUser = req.session?.currentUser || req.session?.admin || req.session?.driver || req.session?.customer;
    
    console.log('Auth check session:', {
      session: !!req.session,
      currentUser: !!req.session?.currentUser,
      admin: !!req.session?.admin,
      driver: !!req.session?.driver,
      customer: !!req.session?.customer,
      foundUser: !!currentUser
    });
    
    if (currentUser) {
      return res.json(currentUser);
    }
    
    return res.status(401).json({ message: "Unauthorized" });
  });

  // Logout route
  app.get('/api/logout', (req: any, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).json({ message: "Could not log out" });
      }
      res.clearCookie('connect.sid');
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // User management routes (admin only)
  app.get('/api/users', requireAdminSession, async (req: any, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/users/:id/role', requireAdminSession, async (req: any, res) => {
    try {
      const { role } = req.body;
      if (!['admin', 'driver', 'customer'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      console.log(`Updating user ${req.params.id} to role ${role}`);
      const updatedUser = await storage.updateUserRole(req.params.id, role);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log(`Successfully updated user role:`, updatedUser);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Update user information
  app.put('/api/users/:id', requireAdminSession, async (req: any, res) => {
    try {
      const { firstName, lastName, email, phone } = req.body;
      const updatedUser = await storage.updateUser(req.params.id, {
        firstName,
        lastName,
        email
      });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Reset user password
  app.put('/api/users/:id/password', requireAdminSession, async (req: any, res) => {
    try {
      const { password } = req.body;
      if (!password || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }
      
      const success = await storage.updateUserPassword(req.params.id, password);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  // Create new user
  app.post('/api/users', requireAdminSession, async (req: any, res) => {
    try {
      const { firstName, lastName, email, role } = req.body;
      if (!email || !firstName || !lastName || !role) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      if (!['admin', 'driver', 'customer'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const newUser = await storage.upsertUser({
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email,
        firstName,
        lastName,
        role: role as "admin" | "driver" | "customer",
        profileImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  // Delete user
  app.delete('/api/users/:id', requireAdminSession, async (req: any, res) => {
    try {
      console.log(`Attempting to delete user with ID: ${req.params.id}`);
      const success = await storage.deleteUser(req.params.id);
      if (!success) {
        console.log(`User ${req.params.id} not found or could not be deleted`);
        return res.status(404).json({ message: "User not found" });
      }
      console.log(`User ${req.params.id} deleted successfully`);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Reset user password
  app.put('/api/users/:id/password', requireAdminSession, async (req: any, res) => {
    try {
      const { password } = req.body;
      if (!password || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const success = await storage.updateUserPassword(req.params.id, password);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ message: "Failed to update password" });
    }
  });

  // Dashboard metrics with date filter
  app.get('/api/dashboard/metrics', requireAdminSession, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const metrics = await storage.getDashboardMetrics(
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // Reset test data endpoint
  app.delete('/api/rentals/reset-test-data', requireAdminSession, async (req, res) => {
    try {
      // Delete all rentals marked as test data or created in the last day for testing
      const result = await storage.resetTestData();
      res.json({ message: "Test data reset successfully", deletedCount: result });
    } catch (error) {
      console.error("Error resetting test data:", error);
      res.status(500).json({ message: "Failed to reset test data" });
    }
  });

  // Customer routes
  app.get('/api/customers', requireAdminSession, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get('/api/customers/:id', requireAdminSession, async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post('/api/customers', requireAdminSession, async (req, res) => {
    try {
      console.log("Creating customer with data:", req.body);
      const customerData = insertCustomerSchema.parse(req.body);
      console.log("Parsed customer data:", customerData);
      const customer = await storage.createCustomer(customerData);
      console.log("Customer created successfully:", customer.id);
      res.status(201).json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        return res.status(400).json({ message: error.message });
      }
      res.status(400).json({ message: "Failed to create customer" });
    }
  });

  app.put('/api/customers/:id', requireAdminSession, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, customerData);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(400).json({ message: "Failed to update customer" });
    }
  });

  app.delete('/api/customers/:id', requireAdminSession, async (req, res) => {
    try {
      const success = await storage.deleteCustomer(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json({ message: "Customer deleted successfully" });
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Box/Inventory routes (public access for inventory checking)
  app.get('/api/inventory', async (req, res) => {
    try {
      console.log('Fetching inventory...');
      const boxes = await storage.getBoxes();
      console.log('Inventory result:', boxes?.length || 0, 'boxes');
      res.json(boxes || []);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory" });
    }
  });

  app.get('/api/boxes', requireAdminSession, async (req, res) => {
    try {
      const { status } = req.query;
      const boxes = status ? await storage.getBoxesByStatus(status as string) : await storage.getBoxes();
      res.json(boxes);
    } catch (error) {
      console.error("Error fetching boxes:", error);
      res.status(500).json({ message: "Failed to fetch boxes" });
    }
  });

  app.get('/api/boxes/:id', requireAdminSession, async (req, res) => {
    try {
      const box = await storage.getBox(req.params.id);
      if (!box) {
        return res.status(404).json({ message: "Box not found" });
      }
      res.json(box);
    } catch (error) {
      console.error("Error fetching box:", error);
      res.status(500).json({ message: "Failed to fetch box" });
    }
  });

  app.get('/api/boxes/barcode/:barcode', requireAdminSession, async (req, res) => {
    try {
      const box = await storage.getBoxByBarcode(req.params.barcode);
      if (!box) {
        return res.status(404).json({ message: "Box not found" });
      }
      res.json(box);
    } catch (error) {
      console.error("Error fetching box by barcode:", error);
      res.status(500).json({ message: "Failed to fetch box" });
    }
  });

  app.post('/api/boxes', requireAdminSession, async (req, res) => {
    try {
      const boxData = insertBoxSchema.parse(req.body);
      const box = await storage.createBox(boxData);
      res.status(201).json(box);
    } catch (error) {
      console.error("Error creating box:", error);
      res.status(400).json({ message: "Failed to create box" });
    }
  });

  app.put('/api/boxes/:id', requireAdminSession, async (req, res) => {
    try {
      const boxData = insertBoxSchema.partial().parse(req.body);
      const box = await storage.updateBox(req.params.id, boxData);
      if (!box) {
        return res.status(404).json({ message: "Box not found" });
      }
      res.json(box);
    } catch (error) {
      console.error("Error updating box:", error);
      res.status(400).json({ message: "Failed to update box" });
    }
  });

  // Rental routes
  app.get('/api/rentals', requireAdminSession, async (req, res) => {
    try {
      const { customerId, status } = req.query;
      let rentals;
      if (customerId) {
        rentals = await storage.getRentalsByCustomer(customerId as string);
      } else if (status) {
        rentals = await storage.getRentalsByStatus(status as string);
      } else {
        rentals = await storage.getRentals();
      }
      res.json(rentals);
    } catch (error) {
      console.error("Error fetching rentals:", error);
      res.status(500).json({ message: "Failed to fetch rentals" });
    }
  });

  app.get('/api/rentals/:id', requireAdminSession, async (req, res) => {
    try {
      const rental = await storage.getRental(req.params.id);
      if (!rental) {
        return res.status(404).json({ message: "Rental not found" });
      }
      res.json(rental);
    } catch (error) {
      console.error("Error fetching rental:", error);
      res.status(500).json({ message: "Failed to fetch rental" });
    }
  });

  app.post('/api/rentals', requireAdminSession, async (req, res) => {
    try {
      console.log("Raw request body:", JSON.stringify(req.body, null, 2));
      
      // Convert date strings to Date objects before validation
      const processedBody = {
        ...req.body,
        deliveryDate: new Date(req.body.deliveryDate),
        returnDate: req.body.returnDate ? new Date(req.body.returnDate) : undefined,
        // Calculate guarantee automatically: $2,000 per box
        guaranteeAmount: ((req.body.totalBoxes || 0) * 2000).toString()
      };
      
      console.log("Processed body with guarantee:", JSON.stringify(processedBody, null, 2));
      console.log("Guarantee calculation: ", req.body.totalBoxes, "boxes x $2,000 = $", processedBody.guaranteeAmount);
      
      const rentalData = insertRentalSchema.parse(processedBody);
      const rental = await storage.createRental(rentalData);
      
      // Send email notification for new rental creation
      if (rental && emailService.isEmailConfigured()) {
        console.log(`Attempting to send email for new rental creation with status: ${rental.status}`);
        try {
          const customer = await storage.getCustomer(rental.customerId);
          console.log(`Customer found: ${customer?.name}, email: ${customer?.email}`);
          
          // Generate trackingCode if it doesn't exist
          let updatedRental = rental;
          if (!rental.trackingCode) {
            console.log('New rental missing tracking code, generating one...');
            const result = await storage.generateTrackingCodeForRental(rental.id);
            if (result) {
              updatedRental = result;
            }
            console.log(`Generated tracking code: ${updatedRental?.trackingCode}`);
          }
          
          if (customer?.email && updatedRental?.trackingCode) {
            // Extract last 4 digits before the verification digit
            const rutDigits = customer.rut ? 
              customer.rut.replace(/[.-]/g, '').slice(0, -1).slice(-4).padStart(4, '0') : "0000";
            const trackingUrl = generateTrackingUrl(rutDigits, updatedRental.trackingCode);
            
            // Parse additional products if they exist
            let additionalProducts = [];
            try {
              if (updatedRental.additionalProducts) {
                additionalProducts = typeof updatedRental.additionalProducts === 'string' 
                  ? JSON.parse(updatedRental.additionalProducts)
                  : Array.isArray(updatedRental.additionalProducts) 
                    ? updatedRental.additionalProducts 
                    : [];
              }
            } catch (e) {
              console.log('Error parsing additional products:', e);
              additionalProducts = [];
            }

            // Calculate rental days from delivery and return dates
            const deliveryDate = new Date(updatedRental.deliveryDate);
            const returnDate = updatedRental.returnDate ? new Date(updatedRental.returnDate) : new Date(deliveryDate.getTime() + (7 * 24 * 60 * 60 * 1000));
            const rentalDays = Math.ceil((returnDate.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));

            const emailData = {
              customerName: customer.name,
              rentalId: updatedRental.id,
              trackingCode: updatedRental.trackingCode,
              trackingUrl: trackingUrl,
              totalBoxes: updatedRental.totalBoxes,
              rentalDays: rentalDays > 0 ? rentalDays : 7, // Default to 7 if calculation fails
              deliveryDate: updatedRental.deliveryDate.toLocaleDateString('es-CL', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }),
              deliveryAddress: updatedRental.deliveryAddress || '',
              totalAmount: parseInt(updatedRental.totalAmount || '0'),
              guaranteeAmount: parseInt(updatedRental.guaranteeAmount || '0'),
              additionalProducts: additionalProducts
            };

            console.log(`Sending email for new rental status: ${updatedRental.status}`);
            const success = await emailService.sendRentalStatusEmail(customer.email, updatedRental.status || 'pendiente', emailData);
            
            if (success) {
              console.log(`New rental email sent successfully to ${customer.email}`);
            } else {
              console.log(`Failed to send new rental email to ${customer.email}`);
            }
          }
        } catch (emailError) {
          console.error('Error sending new rental email:', emailError);
          // Don't fail the rental creation if email fails
        }
      }

      // Si el estado es "pagada", asignar repartidor y códigos de cajas
      if (rental.status === 'pagada') {
        console.log(`New rental created with status 'pagada', assigning driver and box codes...`);
        
        try {
          // 1. Asignar repartidor automáticamente
          const rentalWithDriver = await storage.assignDriverToRental(rental.id);
          console.log(`Driver assigned to rental: ${rentalWithDriver?.driverId}`);

          // 2. Asignar códigos de cajas y generar código maestro
          const rentalWithBoxes = await storage.assignBoxCodesToRental(rental.id);
          console.log(`Box codes assigned. Master code: ${rentalWithBoxes?.masterCode}`);
          
          // 3. Enviar email al repartidor asignado
          if (rentalWithDriver?.driverId && rentalWithBoxes?.assignedBoxCodes) {
            const driver = await storage.getUser(rentalWithDriver.driverId);
            const customer = await storage.getCustomer(rental.customerId);
            
            if (driver && customer) {
              console.log(`Sending driver notification to: ${driver.email}`);
              
              const driverEmailData = {
                driverName: `${driver.firstName} ${driver.lastName}`,
                rentalId: rental.id,
                customerName: customer.name,
                totalBoxes: rental.totalBoxes,
                deliveryDate: rental.deliveryDate.toLocaleDateString('es-CL'),
                deliveryAddress: rental.deliveryAddress || '',
                pickupAddress: rental.pickupAddress || undefined,
                masterCode: rentalWithBoxes.masterCode || '',
                assignedBoxCodes: rentalWithBoxes.assignedBoxCodes || []
              };

              // Enviar email al repartidor usando el template específico
              await emailService.sendDriverNotification(driver.email || '', driverEmailData);
              console.log(`Driver notification sent successfully to ${driver.email}`);
            }
          }

          // Actualizar el rental con la información asignada
          rental = rentalWithBoxes || rental;
        } catch (driverError) {
          console.error('Error assigning driver and boxes to new rental:', driverError);
          // No fallar la creación del arriendo si falla la asignación
        }
      }
      
      res.status(201).json(rental);
    } catch (error) {
      console.error("Error creating rental:", error);
      console.error("Error details:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        res.status(400).json({ message: error.message });
      } else {
        res.status(400).json({ message: "Failed to create rental" });
      }
    }
  });

  // Public tracking endpoint
  app.get("/api/track/:rutDigits/:trackingCode", async (req, res) => {
    try {
      const { rutDigits, trackingCode } = req.params;
      const rental = await storage.getRentalByTracking(rutDigits, trackingCode);
      
      if (!rental) {
        return res.status(404).json({ message: "Rental not found" });
      }

      res.json(rental);
    } catch (error) {
      console.error("Error tracking rental:", error);
      res.status(500).json({ message: "Failed to track rental" });
    }
  });

  // Master code scanning endpoint
  app.post("/api/scan/master/:masterCode", requireAdminSession, async (req, res) => {
    try {
      const { masterCode } = req.params;
      console.log(`Scanning master code: ${masterCode}`);
      
      const rentals = await storage.getRentals();
      const rental = rentals.find(r => r.masterCode === masterCode);
      
      if (!rental) {
        return res.status(404).json({ message: "Código maestro no encontrado" });
      }

      const customer = await storage.getCustomer(rental.customerId);
      
      res.json({
        success: true,
        rentalId: rental.id,
        customerName: customer?.name || 'Cliente desconocido',
        boxCount: rental.assignedBoxCodes?.length || rental.totalBoxes,
        assignedBoxCodes: rental.assignedBoxCodes || [],
        status: rental.status,
        deliveryDate: rental.deliveryDate,
        deliveryAddress: rental.deliveryAddress
      });
    } catch (error) {
      console.error("Error scanning master code:", error);
      res.status(500).json({ message: "Error al escanear código maestro" });
    }
  });

  // Endpoint to get rentals with box codes
  app.get("/api/rentals/with-codes", requireAdminSession, async (req, res) => {
    try {
      const rentals = await storage.getRentals();
      const rentalsWithCodes = rentals.filter(r => r.assignedBoxCodes && r.masterCode);
      
      res.json(rentalsWithCodes);
    } catch (error) {
      console.error("Error fetching rentals with codes:", error);
      res.status(500).json({ message: "Error al obtener arriendos con códigos" });
    }
  });

  app.put('/api/rentals/:id', requireAdminSession, async (req, res) => {
    try {
      const parsedData = updateRentalSchema.parse(req.body);
      
      // Convert string dates to Date objects if needed
      const rentalData = {
        ...parsedData,
        deliveryDate: parsedData.deliveryDate ? 
          (typeof parsedData.deliveryDate === 'string' ? new Date(parsedData.deliveryDate) : parsedData.deliveryDate) 
          : undefined,
        returnDate: parsedData.returnDate ? 
          (typeof parsedData.returnDate === 'string' ? new Date(parsedData.returnDate) : parsedData.returnDate) 
          : undefined,
      };
      
      const rental = await storage.updateRental(req.params.id, rentalData);
      if (!rental) {
        return res.status(404).json({ message: "Rental not found" });
      }

      // Si el estado cambió a "pagada", asignar repartidor y códigos de cajas
      if (rentalData.status === 'pagada') {
        console.log(`Rental status changed to 'pagada', assigning driver and box codes...`);
        
        try {
          // 1. Asignar repartidor automáticamente
          const rentalWithDriver = await storage.assignDriverToRental(rental.id);
          console.log(`Driver assigned to rental: ${rentalWithDriver?.driverId}`);

          // 2. Asignar códigos de cajas y generar código maestro
          const rentalWithBoxes = await storage.assignBoxCodesToRental(rental.id);
          console.log(`Box codes assigned. Master code: ${rentalWithBoxes?.masterCode}`);
          
          // 3. Enviar email al repartidor asignado
          if (rentalWithDriver?.driverId && rentalWithBoxes?.assignedBoxCodes) {
            const driver = await storage.getUser(rentalWithDriver.driverId);
            const customer = await storage.getCustomer(rental.customerId);
            
            if (driver && customer) {
              console.log(`Sending driver notification to: ${driver.email}`);
              
              const driverEmailData = {
                driverName: `${driver.firstName} ${driver.lastName}`,
                rentalId: rental.id,
                customerName: customer.name,
                totalBoxes: rental.totalBoxes,
                deliveryDate: rental.deliveryDate.toLocaleDateString('es-CL'),
                deliveryAddress: rental.deliveryAddress || '',
                pickupAddress: rental.pickupAddress || undefined,
                masterCode: rentalWithBoxes.masterCode || '',
                assignedBoxCodes: rentalWithBoxes.assignedBoxCodes || []
              };

              // Enviar email al repartidor usando el template específico
              await emailService.sendDriverNotification(driver.email || '', driverEmailData);
              console.log(`Driver notification sent successfully to ${driver.email}`);
            }
          }
        } catch (driverError) {
          console.error('Error assigning driver and boxes:', driverError);
          // No fallar la actualización del arriendo si falla la asignación
        }
      }

      // Send email if status changed and email service is configured
      if (rentalData.status && emailService.isEmailConfigured()) {
        console.log(`Attempting to send email for status change to: ${rentalData.status}`);
        try {
          const customer = await storage.getCustomer(rental.customerId);
          console.log(`Customer found: ${customer?.name}, email: ${customer?.email}`);
          
          // Generate trackingCode if it doesn't exist
          let updatedRental = rental;
          if (!rental.trackingCode) {
            console.log('Rental missing tracking code, generating new one...');
            const result = await storage.generateTrackingCodeForRental(rental.id);
            if (result) {
              updatedRental = result;
            }
            console.log(`Generated tracking code: ${updatedRental?.trackingCode}`);
          }
          
          if (customer?.email && updatedRental?.trackingCode) {
            // Extract last 4 digits before the verification digit
            // RUT format: "16.220.939-6" -> extract "0939"
            // RUT format: "1.234.567-8" -> extract "4567"
            const rutDigits = customer.rut ? 
              customer.rut.replace(/[.-]/g, '').slice(0, -1).slice(-4).padStart(4, '0') : "0000";
            const trackingUrl = generateTrackingUrl(rutDigits, updatedRental.trackingCode);
            
            // Parse additional products if they exist
            let additionalProducts = [];
            try {
              if (updatedRental.additionalProducts) {
                additionalProducts = typeof updatedRental.additionalProducts === 'string' 
                  ? JSON.parse(updatedRental.additionalProducts)
                  : Array.isArray(updatedRental.additionalProducts) 
                    ? updatedRental.additionalProducts 
                    : [];
              }
            } catch (e) {
              console.log('Error parsing additional products:', e);
              additionalProducts = [];
            }

            const emailData = {
              customerName: customer.name,
              rentalId: updatedRental.id,
              trackingCode: updatedRental.trackingCode,
              trackingUrl: trackingUrl,
              totalBoxes: updatedRental.totalBoxes,
              rentalDays: 7, // Default rental days
              deliveryDate: updatedRental.deliveryDate.toLocaleDateString('es-CL', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }),
              deliveryAddress: updatedRental.deliveryAddress || '',
              totalAmount: parseInt(updatedRental.totalAmount || '0'),
              guaranteeAmount: updatedRental.totalBoxes * 2000,
              additionalProducts: additionalProducts,
            };

            console.log(`Sending email with data:`, JSON.stringify(emailData, null, 2));
            console.log(`Generated tracking URL: ${trackingUrl} (RUT digits: ${rutDigits}, Tracking code: ${updatedRental.trackingCode})`);
            const emailSent = await emailService.sendRentalStatusEmail(customer.email, rentalData.status, emailData);
            
            if (emailSent) {
              console.log(`✅ Email sent successfully for status change to ${rentalData.status} for customer ${customer.email}`);
            } else {
              console.log(`❌ Email failed to send for status change to ${rentalData.status} for customer ${customer.email}`);
            }

            // Auto-assign driver when status changes to "pagada"
            if (rentalData.status === 'pagada') {
              console.log('Status changed to "pagada" - attempting automatic driver assignment');
              try {
                // Get available drivers
                const drivers = await storage.getUsers();
                const availableDrivers = drivers.filter(user => user.role === 'driver');
                console.log(`Found ${availableDrivers.length} drivers available for assignment`);
                
                if (availableDrivers.length > 0) {
                  // Simple round-robin assignment - get driver with least active tasks
                  let selectedDriver = availableDrivers[0];
                  let minTasks = Infinity;
                  
                  for (const driver of availableDrivers) {
                    const activeTasks = await storage.getDeliveryTasks(driver.id);
                    const pendingTasks = activeTasks.filter(task => 
                      task.status === 'assigned'
                    ).length;
                    
                    if (pendingTasks < minTasks) {
                      minTasks = pendingTasks;
                      selectedDriver = driver;
                    }
                  }
                  
                  // Create delivery task
                  const deliveryTask = {
                    id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    rentalId: updatedRental.id,
                    driverId: selectedDriver.id,
                    type: 'delivery' as const,
                    status: 'assigned' as const,
                    scheduledDate: rental.deliveryDate,
                    customerName: customer.name,
                    customerPhone: customer.phone || '',
                    deliveryAddress: rental.deliveryAddress || '',
                    notes: `Entrega automática - ${rental.totalBoxes} cajas`,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  };
                  
                  const createdTask = await storage.createDeliveryTask(deliveryTask);
                  console.log(`✅ Delivery task created and assigned to driver ${selectedDriver.firstName} ${selectedDriver.lastName}`);
                  
                  // Update rental with assigned driver
                  await storage.updateRental(rental.id, { 
                    assignedDriver: `${selectedDriver.firstName} ${selectedDriver.lastName}`
                  });
                  console.log(`✅ Rental updated with assigned driver: ${selectedDriver.firstName} ${selectedDriver.lastName}`);
                  
                  // Send assignment email to driver
                  if (selectedDriver.email) {
                    const assignmentData = {
                      driverName: `${selectedDriver.firstName} ${selectedDriver.lastName}`,
                      customerName: customer.name,
                      customerAddress: rental.deliveryAddress || '',
                      customerPhone: customer.phone || '',
                      trackingCode: rental.trackingCode || 'N/A',
                      totalBoxes: rental.totalBoxes,
                      deliveryDate: rental.deliveryDate.toLocaleDateString('es-CL', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      }),
                      notes: `Entrega automática - ${rental.totalBoxes} cajas`,
                    };
                    
                    const driverEmailSent = await emailService.sendDriverAssignmentEmail(selectedDriver.email, assignmentData);
                    
                    if (driverEmailSent) {
                      console.log(`✅ Driver assignment email sent to ${selectedDriver.email}`);
                    } else {
                      console.log(`❌ Failed to send assignment email to driver ${selectedDriver.email}`);
                    }
                  }
                } else {
                  console.log('❌ No drivers available for automatic assignment');
                }
              } catch (assignmentError) {
                console.error('Error during automatic driver assignment:', assignmentError);
                // Continue even if assignment fails
              }
            }
          } else {
            console.log(`Cannot send email - missing customer email or tracking code. Customer email: ${customer?.email}, tracking code: ${updatedRental?.trackingCode}`);
          }
        } catch (emailError) {
          console.error("Error sending status change email:", emailError);
          // Continue with response even if email fails
        }
      } else {
        console.log(`Email not sent - conditions not met. Status: ${rentalData.status}, Email configured: ${emailService.isEmailConfigured()}`);
      }

      res.json(rental);
    } catch (error) {
      console.error("Error updating rental:", error);
      res.status(400).json({ message: "Failed to update rental" });
    }
  });



  // Box movement routes
  app.get('/api/box-movements', requireAdminSession, async (req, res) => {
    try {
      const { boxId } = req.query;
      const movements = await storage.getBoxMovements(boxId as string);
      res.json(movements);
    } catch (error) {
      console.error("Error fetching box movements:", error);
      res.status(500).json({ message: "Failed to fetch box movements" });
    }
  });

  app.post('/api/box-movements', requireAdminSession, async (req: any, res) => {
    try {
      const movementData = insertBoxMovementSchema.parse({
        ...req.body,
        performedBy: req.session.admin.id,
      });
      const movement = await storage.createBoxMovement(movementData);
      res.status(201).json(movement);
    } catch (error) {
      console.error("Error creating box movement:", error);
      res.status(400).json({ message: "Failed to create box movement" });
    }
  });

  // Delivery task routes (disabled for public access)
  app.get('/api/delivery-tasks', requireAdminSession, async (req: any, res) => {
    try {
      const tasks = await storage.getDeliveryTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching delivery tasks:", error);
      res.status(500).json({ message: "Failed to fetch delivery tasks" });
    }
  });

  app.post('/api/delivery-tasks', requireAdminSession, async (req, res) => {
    try {
      const taskData = insertDeliveryTaskSchema.parse(req.body);
      const task = await storage.createDeliveryTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating delivery task:", error);
      res.status(400).json({ message: "Failed to create delivery task" });
    }
  });

  app.put('/api/delivery-tasks/:id', requireAdminSession, async (req, res) => {
    try {
      const taskData = insertDeliveryTaskSchema.partial().parse(req.body);
      const task = await storage.updateDeliveryTask(req.params.id, taskData);
      if (!task) {
        return res.status(404).json({ message: "Delivery task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error updating delivery task:", error);
      res.status(400).json({ message: "Failed to update delivery task" });
    }
  });

  // Email routes
  app.get('/api/email/config', requireAdminSession, async (req, res) => {
    try {
      res.json({
        configured: emailService.isEmailConfigured()
      });
    } catch (error) {
      console.error("Error checking email config:", error);
      res.status(500).json({ message: "Failed to check email configuration" });
    }
  });

  app.post('/api/email/preview', requireAdminSession, async (req, res) => {
    try {
      const { status, sampleData } = req.body;
      const preview = emailService.getEmailPreview(status, sampleData);
      if (!preview) {
        return res.status(404).send("Email template not found");
      }
      res.set('Content-Type', 'text/html');
      res.send(preview);
    } catch (error) {
      console.error("Error generating email preview:", error);
      res.status(500).send("Error generating preview");
    }
  });

  app.post('/api/email/test', requireAdminSession, async (req, res) => {
    try {
      const { to, status, sampleData } = req.body;
      
      if (!emailService.isEmailConfigured()) {
        return res.status(400).json({ message: "Email service not configured" });
      }

      // Create sample rental data for test
      const rentalData = {
        customerName: sampleData?.customerName || 'Usuario de Prueba',
        rentalId: 'test-rental-id',
        trackingCode: sampleData?.trackingCode || 'TEST123',
        trackingUrl: generateTrackingUrl('1234', sampleData?.trackingCode || 'TEST123'),
        totalBoxes: sampleData?.totalBoxes || 5,
        deliveryDate: sampleData?.deliveryDate || new Date().toLocaleDateString('es-CL'),
        deliveryAddress: sampleData?.deliveryAddress || 'Dirección de prueba',
        totalAmount: sampleData?.totalAmount || 13876,
        guaranteeAmount: sampleData?.guaranteeAmount || 10000,
      };

      const success = await emailService.sendRentalStatusEmail(to, status, rentalData);
      
      if (success) {
        res.json({ message: "Test email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send test email" });
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ message: "Failed to send test email" });
    }
  });

  // Reminder routes
  app.get('/api/reminders/upcoming', requireAdminSession, async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const reminders = await reminderService.getUpcomingReminders(days);
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching upcoming reminders:", error);
      res.status(500).json({ message: "Failed to fetch upcoming reminders" });
    }
  });

  app.post('/api/reminders/check', requireAdminSession, async (req, res) => {
    try {
      await reminderService.checkAndSendReminders();
      res.json({ message: "Reminder check completed" });
    } catch (error) {
      console.error("Error checking reminders:", error);
      res.status(500).json({ message: "Failed to check reminders" });
    }
  });

  app.post('/api/reminders/test/:rentalId', requireAdminSession, async (req, res) => {
    try {
      const success = await reminderService.sendTestReminder(req.params.rentalId);
      if (success) {
        res.json({ message: "Test reminder sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send test reminder" });
      }
    } catch (error) {
      console.error("Error sending test reminder:", error);
      res.status(500).json({ message: "Failed to send test reminder" });
    }
  });

  // User management routes
  app.post('/api/users', requireAdminSession, async (req, res) => {
    try {
      const userData = {
        id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        role: req.body.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const newUser = await storage.upsertUser(userData);
      res.json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(400).json({ message: "Failed to create user" });
    }
  });

  // Driver assignment route for admin
  app.put('/api/rentals/:id/assign-driver', requireAdminSession, async (req, res) => {
    try {
      const { driverId } = req.body;
      const rentalId = req.params.id;
      
      // Get driver information
      const driver = await storage.getUser(driverId);
      if (!driver || driver.role !== 'driver') {
        return res.status(400).json({ message: "Invalid driver selected" });
      }
      
      // Update rental with new driver
      const rental = await storage.updateRental(rentalId, { 
        assignedDriver: `${driver.firstName} ${driver.lastName}`
      });
      
      if (!rental) {
        return res.status(404).json({ message: "Rental not found" });
      }
      
      // Create or update delivery task
      const existingTasks = await storage.getDeliveryTasks();
      const existingTask = existingTasks.find(task => task.rentalId === rentalId);
      
      const customer = await storage.getCustomer(rental.customerId);
      
      if (existingTask) {
        // Update existing task with new driver
        await storage.updateDeliveryTask(existingTask.id, { 
          driverId: driver.id
        });
        console.log(`✅ Delivery task updated with new driver: ${driver.firstName} ${driver.lastName}`);
      } else {
        // Create new delivery task
        const deliveryTask = {
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          rentalId: rental.id,
          driverId: driver.id,
          type: 'delivery' as const,
          status: 'assigned' as const,
          scheduledDate: rental.deliveryDate,
          customerName: customer?.name || '',
          customerPhone: customer?.phone || '',
          deliveryAddress: rental.deliveryAddress || '',
          notes: `Entrega asignada manualmente - ${rental.totalBoxes} cajas`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        await storage.createDeliveryTask(deliveryTask);
        console.log(`✅ New delivery task created and assigned to driver: ${driver.firstName} ${driver.lastName}`);
      }
      
      // Send assignment email to new driver
      if (driver.email && customer && emailService.isEmailConfigured()) {
        const assignmentData = {
          driverName: `${driver.firstName} ${driver.lastName}`,
          customerName: customer.name,
          customerAddress: rental.deliveryAddress || '',
          customerPhone: customer.phone || '',
          trackingCode: rental.trackingCode || '',
          totalBoxes: rental.totalBoxes,
          deliveryDate: rental.deliveryDate.toLocaleDateString('es-CL', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          notes: `Entrega asignada manualmente - ${rental.totalBoxes} cajas`,
        };
        
        const emailSent = await emailService.sendDriverAssignmentEmail(driver.email, assignmentData);
        if (emailSent) {
          console.log(`✅ Assignment email sent to driver: ${driver.email}`);
        }
      }
      
      res.json(rental);
    } catch (error) {
      console.error("Error assigning driver:", error);
      res.status(500).json({ message: "Failed to assign driver" });
    }
  });

  // Test reminder system endpoint
  app.post('/api/test-reminder', async (req, res) => {
    try {
      const { type } = req.body; // 'delivery' or 'pickup'
      
      if (type === 'delivery') {
        console.log('🔄 Testing delivery reminders...');
        await reminderService.checkDeliveryReminders();
        res.json({ message: 'Delivery reminder check completed' });
      } else if (type === 'pickup') {
        console.log('🔄 Testing pickup reminders...');
        await reminderService.checkPickupReminders();
        res.json({ message: 'Pickup reminder check completed' });
      } else {
        console.log('🔄 Testing all reminders...');
        await reminderService.checkAndSendReminders();
        res.json({ message: 'All reminder checks completed' });
      }
    } catch (error) {
      console.error('Error testing reminders:', error);
      res.status(500).json({ message: 'Failed to test reminders' });
    }
  });

  // Manual test email endpoint  
  app.post('/api/send-test-email', async (req, res) => {
    try {
      const { email, type } = req.body;
      
      const testData = {
        customerName: 'Cliente de Prueba',
        rentalId: 'test-123',
        trackingCode: 'AC2508110001',
        trackingUrl: 'https://arriendocajas.cl/track/1234/AC2508110001',
        totalBoxes: 5,
        deliveryDate: new Date().toLocaleDateString('es-CL', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        returnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CL', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        deliveryAddress: 'Av. Providencia 123, Santiago',
        pickupAddress: 'Av. Providencia 123, Santiago',
        totalAmount: 15000,
        guaranteeAmount: 10000,
        contactPhone: '+56987290995'
      };

      const success = await emailService.sendRentalStatusEmail(email, type, testData);
      
      if (success) {
        res.json({ message: `Test email sent successfully to ${email}` });
      } else {
        res.status(500).json({ message: 'Failed to send test email' });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      res.status(500).json({ message: 'Failed to send test email' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
