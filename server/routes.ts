import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCustomerSchema, insertDriverSchema, insertRentalSchema, insertPaymentSchema } from "@shared/schema";
import { z } from "zod";

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
      const rental = await storage.createRental(validatedData);
      await storage.logActivity({
        type: "rental_created",
        description: `Arriendo creado`,
        entityId: rental.id,
        entityType: "rental"
      });
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
      const rental = await storage.updateRental(req.params.id, validatedData);
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

  const httpServer = createServer(app);
  return httpServer;
}