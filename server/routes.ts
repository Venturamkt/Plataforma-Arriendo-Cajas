import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCustomerSchema, insertDriverSchema, insertRentalSchema, insertPaymentSchema } from "@shared/schema";
import { z } from "zod";
import { sendEmail, emailTemplates, sendDriverAssignmentEmail } from "./emailService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed initial data for demo
  const { seedInitialData } = await import("./seedData");
  await seedInitialData();

  // Basic health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running" });
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      res.status(500).json({ error: "Error al obtener estadísticas" });
    }
  });

  // Customer routes
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error("Error getting customers:", error);
      res.status(500).json({ error: "Error al obtener clientes" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const customer = await storage.getCustomerById(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Cliente no encontrado" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error getting customer:", error);
      res.status(500).json({ error: "Error al obtener cliente" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedData);
      await storage.logActivity({
        type: "customer_created",
        description: `Cliente creado: ${customer.name}`,
        entityId: customer.id,
        entityType: "customer"
      });
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      
      // Manejo específico de errores de duplicado
      if (error instanceof Error && error.message.includes("duplicate key")) {
        if (error.message.includes("customers_phone_unique")) {
          return res.status(400).json({ error: "Ya existe un cliente con este número de teléfono" });
        }
        if (error.message.includes("customers_rut_unique")) {
          return res.status(400).json({ error: "Ya existe un cliente con este RUT" });
        }
        if (error.message.includes("customers_email_unique")) {
          return res.status(400).json({ error: "Ya existe un cliente con este email" });
        }
        return res.status(400).json({ error: "Ya existe un cliente con estos datos" });
      }
      
      console.error("Error creating customer:", error);
      res.status(500).json({ error: "Error al crear cliente" });
    }
  });

  app.put("/api/customers/:id", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, validatedData);
      await storage.logActivity({
        type: "customer_updated",
        description: `Cliente actualizado: ${customer.name}`,
        entityId: customer.id,
        entityType: "customer"
      });
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating customer:", error);
      res.status(500).json({ error: "Error al actualizar cliente" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      await storage.deleteCustomer(req.params.id);
      await storage.logActivity({
        type: "customer_deleted",
        description: `Cliente eliminado`,
        entityId: req.params.id,
        entityType: "customer"
      });
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting customer:", error);
      res.status(500).json({ error: "Error al eliminar cliente" });
    }
  });

  // Driver routes
  app.get("/api/drivers", async (req, res) => {
    try {
      const drivers = await storage.getDrivers();
      res.json(drivers);
    } catch (error) {
      console.error("Error getting drivers:", error);
      res.status(500).json({ error: "Error al obtener repartidores" });
    }
  });

  app.get("/api/drivers/:id", async (req, res) => {
    try {
      const driver = await storage.getDriverById(req.params.id);
      if (!driver) {
        return res.status(404).json({ error: "Repartidor no encontrado" });
      }
      res.json(driver);
    } catch (error) {
      console.error("Error getting driver:", error);
      res.status(500).json({ error: "Error al obtener repartidor" });
    }
  });

  app.post("/api/drivers", async (req, res) => {
    try {
      const validatedData = insertDriverSchema.parse(req.body);
      const driver = await storage.createDriver(validatedData);
      res.status(201).json(driver);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating driver:", error);
      if (error.code === '23505') {
        return res.status(400).json({ error: "Email o teléfono ya registrado" });
      }
      res.status(500).json({ error: "Error al crear repartidor" });
    }
  });

  app.put("/api/drivers/:id", async (req, res) => {
    try {
      const validatedData = insertDriverSchema.partial().parse(req.body);
      const driver = await storage.updateDriver(req.params.id, validatedData);
      if (!driver) {
        return res.status(404).json({ error: "Repartidor no encontrado" });
      }
      res.json(driver);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating driver:", error);
      if (error.code === '23505') {
        return res.status(400).json({ error: "Email o teléfono ya registrado" });
      }
      res.status(500).json({ error: "Error al actualizar repartidor" });
    }
  });

  app.delete("/api/drivers/:id", async (req, res) => {
    try {
      await storage.deleteDriver(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting driver:", error);
      res.status(500).json({ error: "Error al eliminar repartidor" });
    }
  });

  app.get("/api/drivers/:id/stats", async (req, res) => {
    try {
      const stats = await storage.getDriverStats(req.params.id);
      res.json(stats);
    } catch (error) {
      console.error("Error getting driver stats:", error);
      res.status(500).json({ error: "Error al obtener estadísticas del repartidor" });
    }
  });

  app.get("/api/drivers/:id/stats", async (req, res) => {
    try {
      const stats = await storage.getDriverStats(req.params.id);
      res.json(stats);
    } catch (error) {
      console.error("Error getting driver stats:", error);
      res.status(500).json({ error: "Error al obtener estadísticas del repartidor" });
    }
  });

  // Driver routes
  app.get("/api/drivers", async (req, res) => {
    try {
      const drivers = await storage.getDrivers();
      res.json(drivers);
    } catch (error) {
      console.error("Error getting drivers:", error);
      res.status(500).json({ error: "Error al obtener repartidores" });
    }
  });

  app.post("/api/drivers", async (req, res) => {
    try {
      const validatedData = insertDriverSchema.parse(req.body);
      const driver = await storage.createDriver(validatedData);
      await storage.logActivity({
        type: "driver_created",
        description: `Repartidor creado: ${driver.name}`,
        entityId: driver.id,
        entityType: "driver"
      });
      res.status(201).json(driver);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating driver:", error);
      res.status(500).json({ error: "Error al crear repartidor" });
    }
  });

  // Rental routes
  app.get("/api/rentals", async (req, res) => {
    try {
      const rentals = await storage.getRentals();
      res.json(rentals);
    } catch (error) {
      console.error("Error getting rentals:", error);
      res.status(500).json({ error: "Error al obtener arriendos" });
    }
  });

  app.post("/api/rentals", async (req, res) => {
    try {
      const validatedData = insertRentalSchema.parse(req.body);
      
      // Convertir strings de fecha a objetos Date y manejar driverId
      const processedData = {
        ...validatedData,
        deliveryDate: validatedData.deliveryDate ? new Date(validatedData.deliveryDate) : null,
        pickupDate: validatedData.pickupDate ? new Date(validatedData.pickupDate) : null,
        actualDeliveryDate: validatedData.actualDeliveryDate ? new Date(validatedData.actualDeliveryDate) : null,
        actualPickupDate: validatedData.actualPickupDate ? new Date(validatedData.actualPickupDate) : null,
        driverId: validatedData.driverId || null, // Convertir string vacío a null
      };
      
      const rental = await storage.createRental(processedData);
      await storage.logActivity({
        type: "rental_created",
        description: `Arriendo creado`,
        entityId: rental.id,
        entityType: "rental"
      });
      
      // Enviar email de confirmación
      try {
        const customer = await storage.getCustomer(rental.customerId);
        if (customer && customer.email) {
          const emailTemplate = emailTemplates.rentalConfirmation(customer.name, rental);
          await sendEmail({
            to: customer.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text
          });
          console.log(`Email de confirmación enviado a: ${customer.email}`);
        }
      } catch (emailError) {
        console.error('Error enviando email de confirmación:', emailError);
        // No fallar la operación por problemas de email
      }
      
      res.status(201).json(rental);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating rental:", error);
      res.status(500).json({ error: "Error al crear arriendo" });
    }
  });

  app.put("/api/rentals/:id", async (req, res) => {
    try {
      const validatedData = insertRentalSchema.partial().parse(req.body);
      
      // Convertir strings de fecha a objetos Date y manejar driverId (igual que en POST)
      const processedData = {
        ...validatedData,
        deliveryDate: validatedData.deliveryDate ? new Date(validatedData.deliveryDate) : undefined,
        pickupDate: validatedData.pickupDate ? new Date(validatedData.pickupDate) : undefined,
        actualDeliveryDate: validatedData.actualDeliveryDate ? new Date(validatedData.actualDeliveryDate) : undefined,
        actualPickupDate: validatedData.actualPickupDate ? new Date(validatedData.actualPickupDate) : undefined,
        driverId: validatedData.driverId || null, // Convertir string vacío a null
      };
      
      const rental = await storage.updateRental(req.params.id, processedData);
      await storage.logActivity({
        type: "rental_updated",
        description: `Arriendo actualizado - Estado: ${rental.status}`,
        entityId: rental.id,
        entityType: "rental"
      });
      res.json(rental);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error updating rental:", error);
      res.status(500).json({ error: "Error al actualizar arriendo" });
    }
  });

  // Payment routes
  app.get("/api/payments", async (req, res) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error getting payments:", error);
      res.status(500).json({ error: "Error al obtener pagos" });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(validatedData);
      await storage.logActivity({
        type: "payment_created",
        description: `Pago registrado: $${payment.amount}`,
        entityId: payment.id,
        entityType: "payment"
      });
      
      // Enviar email de confirmación de pago
      try {
        if (payment.rentalId) {
          const rental = await storage.getRental(payment.rentalId);
          if (rental) {
            const customer = await storage.getCustomer(rental.customerId);
            if (customer && customer.email) {
              const emailTemplate = emailTemplates.paymentConfirmation(customer.name, payment);
              await sendEmail({
                to: customer.email,
                subject: emailTemplate.subject,
                html: emailTemplate.html,
                text: emailTemplate.text
              });
              console.log(`Email de confirmación de pago enviado a: ${customer.email}`);
            }
          }
        }
      } catch (emailError) {
        console.error('Error enviando email de confirmación de pago:', emailError);
        // No fallar la operación por problemas de email
      }
      
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      console.error("Error creating payment:", error);
      res.status(500).json({ error: "Error al crear pago" });
    }
  });

  // Inventory routes
  app.get("/api/boxes", async (req, res) => {
    try {
      const boxes = await storage.getBoxes();
      res.json(boxes);
    } catch (error) {
      console.error("Error getting boxes:", error);
      res.status(500).json({ error: "Error al obtener inventario" });
    }
  });

  app.put("/api/boxes/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const box = await storage.updateBoxStatus(req.params.id, status);
      await storage.logActivity({
        type: "box_status_updated",
        description: `Estado de caja actualizado: ${status}`,
        entityId: box.id,
        entityType: "box"
      });
      res.json(box);
    } catch (error) {
      console.error("Error updating box status:", error);
      res.status(500).json({ error: "Error al actualizar estado de caja" });
    }
  });

  // Update customer status (for rental status changes)
  app.put("/api/customers/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      
      // En una app real, esto buscaría el arriendo activo del cliente y actualizaría su estado
      // Por ahora respondemos con éxito para la demo
      await storage.logActivity({
        type: "customer_status_updated",
        description: `Estado de arriendo actualizado: ${status}`,
        entityId: req.params.id,
        entityType: "customer"
      });
      
      res.json({ success: true, status });
    } catch (error) {
      console.error("Error updating customer status:", error);
      res.status(500).json({ error: "Error al actualizar estado" });
    }
  });

  // Update rental status
  app.put("/api/rentals/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      let updateData: any = { status };
      
      // Auto-asignar repartidor cuando se marca como "programada"
      if (status === "programada") {
        const availableDrivers = await storage.getDrivers();
        const activeDrivers = availableDrivers.filter(d => d.isActive);
        
        if (activeDrivers.length > 0) {
          // Asignar repartidor con menos arriendos activos (distribución equitativa)
          const driverWithLeastRentals = activeDrivers.reduce((min, driver) => {
            // En una implementación real, contaríamos arriendos activos por repartidor
            return driver; // Por ahora asignamos el primero disponible
          });
          
          updateData.driverId = driverWithLeastRentals.id;
          
          await storage.logActivity({
            type: "driver_assigned",
            description: `Repartidor ${driverWithLeastRentals.name} asignado automáticamente`,
            entityId: req.params.id,
            entityType: "rental"
          });

          // Enviar email de asignación al conductor
          try {
            const customer = await storage.getCustomer(rental.customerId);
            if (customer) {
              const emailTemplate = emailTemplates.driverAssignment(driverWithLeastRentals.name, rental, customer);
              await sendDriverAssignmentEmail({
                to: driverWithLeastRentals.email || '',
                subject: emailTemplate.subject,
                html: emailTemplate.html,
                text: emailTemplate.text
              }, driverWithLeastRentals.email);
              console.log(`Email de asignación enviado a: ${driverWithLeastRentals.email} y asignaciones@arriendocajas.cl`);
            }
          } catch (emailError) {
            console.error('Error enviando email de asignación automática:', emailError);
          }
        }
      }
      
      const rental = await storage.updateRental(req.params.id, updateData);
      
      await storage.logActivity({
        type: "rental_status_updated",
        description: `Estado de arriendo actualizado: ${status}`,
        entityId: req.params.id,
        entityType: "rental"
      });
      
      res.json(rental);
    } catch (error) {
      console.error("Error updating rental status:", error);
      res.status(500).json({ error: "Error al actualizar estado del arriendo" });
    }
  });

  // Inventory routes
  app.get("/api/inventory", async (req, res) => {
    try {
      const inventory = await storage.getInventory();
      res.json(inventory);
    } catch (error) {
      console.error("Error getting inventory:", error);
      res.status(500).json({ error: "Error al obtener inventario" });
    }
  });

  app.get("/api/inventory/available", async (req, res) => {
    try {
      const { type, quantity } = req.query;
      const availableItems = await storage.getAvailableInventory(type as string, parseInt(quantity as string));
      res.json(availableItems);
    } catch (error) {
      console.error("Error getting available inventory:", error);
      res.status(500).json({ error: "Error al obtener inventario disponible" });
    }
  });

  app.put("/api/inventory/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const item = await storage.updateInventoryStatus(req.params.id, status);
      res.json(item);
    } catch (error) {
      console.error("Error updating inventory status:", error);
      res.status(500).json({ error: "Error al actualizar estado del inventario" });
    }
  });

  app.post("/api/rentals/:id/assign-items", async (req, res) => {
    try {
      const { itemIds } = req.body;
      const assignment = await storage.assignItemsToRental(req.params.id, itemIds);
      res.json(assignment);
    } catch (error) {
      console.error("Error assigning items to rental:", error);
      res.status(500).json({ error: "Error al asignar items al arriendo" });
    }
  });

  // Reports endpoints
  app.get("/api/reports", async (req, res) => {
    try {
      const { startDate, endDate, type } = req.query;
      
      if (!startDate || !endDate || !type) {
        return res.status(400).json({ error: "Faltan parámetros requeridos" });
      }

      let reportData;
      
      switch (type) {
        case "financial":
          reportData = await storage.getFinancialReport(startDate as string, endDate as string);
          break;
        case "customers":
          reportData = await storage.getCustomersReport(startDate as string, endDate as string);
          break;
        case "inventory":
          reportData = await storage.getInventoryReport(startDate as string, endDate as string);
          break;
        case "operations":
          reportData = await storage.getOperationsReport(startDate as string, endDate as string);
          break;
        default:
          return res.status(400).json({ error: "Tipo de reporte no válido" });
      }

      res.json(reportData);
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ error: "Error al generar reporte" });
    }
  });

  app.get("/api/reports/export", async (req, res) => {
    try {
      const { startDate, endDate, type, format } = req.query;
      
      if (!startDate || !endDate || !type) {
        return res.status(400).json({ error: "Faltan parámetros requeridos" });
      }

      // Obtener datos del reporte
      let reportData;
      switch (type) {
        case "financial":
          reportData = await storage.getFinancialReport(startDate as string, endDate as string);
          break;
        case "customers":
          reportData = await storage.getCustomersReport(startDate as string, endDate as string);
          break;
        default:
          return res.status(400).json({ error: "Tipo de reporte no válido para exportación" });
      }

      if (format === "excel") {
        // Generar archivo Excel simple (CSV)
        const csvData = storage.generateCSV(reportData, type as string);
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=reporte_${type}_${startDate}_${endDate}.csv`);
        res.send(csvData);
      } else {
        res.json(reportData);
      }
    } catch (error) {
      console.error("Error exporting report:", error);
      res.status(500).json({ error: "Error al exportar reporte" });
    }
  });

  // Calendar endpoints
  app.get("/api/calendar/events", async (req, res) => {
    try {
      const { year, month } = req.query;
      const events = await storage.getCalendarEvents(year as string, month as string);
      res.json(events);
    } catch (error) {
      console.error("Error loading calendar events:", error);
      res.status(500).json({ error: "Error al cargar eventos del calendario" });
    }
  });

  app.post("/api/calendar/events", async (req, res) => {
    try {
      const event = await storage.createCalendarEvent(req.body);
      res.json(event);
    } catch (error) {
      console.error("Error creating calendar event:", error);
      res.status(500).json({ error: "Error al crear evento" });
    }
  });

  app.put("/api/calendar/events/:id", async (req, res) => {
    try {
      const event = await storage.updateCalendarEvent(req.params.id, req.body);
      res.json(event);
    } catch (error) {
      console.error("Error updating calendar event:", error);
      res.status(500).json({ error: "Error al actualizar evento" });
    }
  });

  app.delete("/api/calendar/events/:id", async (req, res) => {
    try {
      await storage.deleteCalendarEvent(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting calendar event:", error);
      res.status(500).json({ error: "Error al eliminar evento" });
    }
  });

  // Configuration routes
  app.get("/api/configuration", async (req, res) => {
    try {
      const settings = await storage.getCompanySettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching configuration:", error);
      res.status(500).json({ error: "Error fetching configuration" });
    }
  });

  app.post("/api/configuration", async (req, res) => {
    try {
      const settings = await storage.saveCompanySettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error saving configuration:", error);
      res.status(500).json({ error: "Error saving configuration" });
    }
  });

  app.post("/api/configuration/logo", async (req, res) => {
    try {
      // Simular upload de logo - en producción esto sería con multer y cloud storage
      const logoUrl = "/api/uploads/logo.png"; // URL simulada
      
      const settings = await storage.getCompanySettings();
      const updatedSettings = await storage.saveCompanySettings({
        ...settings,
        logoUrl: logoUrl
      });
      
      res.json({ logoUrl: logoUrl, settings: updatedSettings });
    } catch (error) {
      console.error("Error uploading logo:", error);
      res.status(500).json({ error: "Error uploading logo" });
    }
  });

  // Email endpoints
  app.post("/api/emails/test", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email requerido" });
      }

      const success = await sendEmail({
        to: email,
        subject: "Prueba de Email - Arriendo Cajas",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #C8201D;">¡Email de Prueba!</h2>
            <p>Este es un email de prueba del sistema de Arriendo Cajas.</p>
            <p>Si recibiste este mensaje, el sistema de emails está funcionando correctamente.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 14px;">
                Arriendo Cajas<br>
                Sistema de notificaciones automáticas
              </p>
            </div>
          </div>
        `,
        text: "Email de prueba del sistema de Arriendo Cajas. Si recibiste este mensaje, el sistema está funcionando correctamente."
      });

      if (success) {
        res.json({ message: "Email de prueba enviado exitosamente" });
      } else {
        res.status(500).json({ error: "No se pudo enviar el email de prueba. Configura las credenciales SMTP primero." });
      }
    } catch (error) {
      console.error("Error enviando email de prueba:", error);
      res.status(500).json({ error: "Error enviando email de prueba" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}