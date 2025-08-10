import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupAuthRoutes } from "./authRoutes";
import { setupTaskRoutes } from "./taskRoutes";
import { emailService } from "./emailService";
import { generateTrackingUrl } from "./emailTemplates";
import { reminderService } from "./reminderService";
import { insertCustomerSchema, insertBoxSchema, insertRentalSchema, insertDeliveryTaskSchema, insertBoxMovementSchema } from "@shared/schema";
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

  // Middleware to check admin session
  const requireAdminSession = (req: any, res: any, next: any) => {
    if (req.session?.admin?.type === 'admin') {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };

  // Auth routes (disabled for public access)
  app.get('/api/auth/user', async (req: any, res) => {
    res.status(401).json({ message: "Unauthorized" });
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
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }
      const { role } = req.body;
      if (!['admin', 'driver', 'customer'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      const updatedUser = await storage.updateUserRole(req.params.id, role);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Dashboard metrics
  app.get('/api/dashboard/metrics', requireAdminSession, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
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
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
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

  // Box routes
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
        returnDate: req.body.returnDate ? new Date(req.body.returnDate) : undefined
      };
      
      console.log("Processed body:", JSON.stringify(processedBody, null, 2));
      console.log("DeliveryDate type:", typeof processedBody.deliveryDate);
      console.log("ReturnDate type:", typeof processedBody.returnDate);
      
      const rentalData = insertRentalSchema.parse(processedBody);
      const rental = await storage.createRental(rentalData);
      res.status(201).json(rental);
    } catch (error) {
      console.error("Error creating rental:", error);
      console.error("Error details:", error);
      res.status(400).json({ message: "Failed to create rental" });
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

  app.put('/api/rentals/:id', requireAdminSession, async (req, res) => {
    try {
      const rentalData = insertRentalSchema.partial().parse(req.body);
      const rental = await storage.updateRental(req.params.id, rentalData);
      if (!rental) {
        return res.status(404).json({ message: "Rental not found" });
      }

      // Send email if status changed and email service is configured
      if (rentalData.status && emailService.isEmailConfigured()) {
        console.log(`Attempting to send email for status change to: ${rentalData.status}`);
        try {
          const customer = await storage.getCustomer(rental.customerId);
          console.log(`Customer found: ${customer?.name}, email: ${customer?.email}`);
          
          if (customer?.email && rental.trackingCode) {
            const rutDigits = customer.rut ? customer.rut.slice(0, -1).slice(-4).padStart(4, '0') : "0000";
            const trackingUrl = generateTrackingUrl(rutDigits, rental.trackingCode);
            
            const emailData = {
              customerName: customer.name,
              rentalId: rental.id,
              trackingCode: rental.trackingCode,
              trackingUrl: trackingUrl,
              totalBoxes: rental.totalBoxes,
              deliveryDate: rental.deliveryDate.toLocaleDateString('es-CL', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }),
              deliveryAddress: rental.deliveryAddress || '',
              totalAmount: parseInt(rental.totalAmount || '0'),
              guaranteeAmount: rental.totalBoxes * 2000,
            };

            console.log(`Sending email with data:`, JSON.stringify(emailData, null, 2));
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
                    rentalId: rental.id,
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
                      trackingCode: rental.trackingCode,
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
            console.log(`Cannot send email - missing customer email or tracking code. Customer email: ${customer?.email}, tracking code: ${rental.trackingCode}`);
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

  const httpServer = createServer(app);
  return httpServer;
}
