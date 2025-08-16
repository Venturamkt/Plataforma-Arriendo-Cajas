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

  const httpServer = createServer(app);
  return httpServer;
}