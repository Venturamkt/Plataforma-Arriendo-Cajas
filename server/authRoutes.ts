import type { Express } from "express";
import bcrypt from "bcrypt";
import { adminUsers, driverUsers, customerAccess, customers } from "@shared/schema";
import { db } from "./db";
import { eq, or } from "drizzle-orm";

export function setupAuthRoutes(app: Express) {
  
  // Customer access (no password required)
  app.post('/api/auth/customer', async (req, res) => {
    try {
      const { type, value } = req.body;
      
      // Search in customers table and customer_access table
      let customer: any[] = [];
      let accessRecord: any[] = [];
      
      if (type === 'rut') {
        // Search by RUT in customer_access
        accessRecord = await db.select()
          .from(customerAccess)
          .where(eq(customerAccess.rut, value))
          .limit(1);
          
        if (accessRecord.length > 0) {
          customer = await db.select()
            .from(customers)
            .where(or(
              eq(customers.email, accessRecord[0].email || ''),
              eq(customers.phone, accessRecord[0].phone || '')
            ))
            .limit(1);
        }
      } else if (type === 'email') {
        // Search by email in customers and customer_access
        customer = await db.select()
          .from(customers)
          .where(eq(customers.email, value))
          .limit(1);
          
        if (customer.length === 0) {
          accessRecord = await db.select()
            .from(customerAccess)
            .where(eq(customerAccess.email, value))
            .limit(1);
        }
      }
      
      if (customer?.length === 0 && accessRecord?.length === 0) {
        return res.status(404).json({ message: "No se encontraron arriendos para este cliente" });
      }
      
      // Update or create access record
      if (accessRecord?.length === 0) {
        await db.insert(customerAccess).values({
          email: type === 'email' ? value : customer?.[0]?.email,
          rut: type === 'rut' ? value : null,
          firstName: customer?.[0]?.name?.split(' ')[0],
          lastName: customer?.[0]?.name?.split(' ').slice(1).join(' '),
          lastAccess: new Date(),
        });
      } else {
        await db.update(customerAccess)
          .set({ lastAccess: new Date() })
          .where(eq(customerAccess.id, accessRecord[0].id));
      }
      
      // Set customer session
      if (!req.session) {
        req.session = {} as any;
      }
      (req.session as any).customer = {
        id: customer?.[0]?.id || accessRecord?.[0]?.id,
        email: customer?.[0]?.email || accessRecord?.[0]?.email,
        name: customer?.[0]?.name || `${accessRecord?.[0]?.firstName} ${accessRecord?.[0]?.lastName}`,
        type: 'customer'
      };
      
      res.json({ success: true, redirect: '/customer/dashboard' });
    } catch (error) {
      console.error("Customer access error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Admin login
  app.post('/api/auth/admin', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const admin = await db.select()
        .from(adminUsers)
        .where(eq(adminUsers.email, email))
        .limit(1);
        
      if (admin.length === 0) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
      }
      
      const isValidPassword = await bcrypt.compare(password, admin[0].password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
      }
      
      if (!admin[0].isActive) {
        return res.status(401).json({ message: "Cuenta desactivada" });
      }
      
      // Update last login
      await db.update(adminUsers)
        .set({ lastLogin: new Date() })
        .where(eq(adminUsers.id, admin[0].id));
      
      // Set admin session
      if (!req.session) {
        req.session = {} as any;
      }
      (req.session as any).admin = {
        id: admin[0].id,
        email: admin[0].email,
        firstName: admin[0].firstName,
        lastName: admin[0].lastName,
        type: 'admin'
      };
      
      res.json({ success: true, redirect: '/admin/dashboard' });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Driver login
  app.post('/api/auth/driver', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const driver = await db.select()
        .from(driverUsers)
        .where(eq(driverUsers.email, email))
        .limit(1);
        
      if (driver.length === 0) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
      }
      
      const isValidPassword = await bcrypt.compare(password, driver[0].password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
      }
      
      if (!driver[0].isActive) {
        return res.status(401).json({ message: "Cuenta desactivada" });
      }
      
      // Update last login
      await db.update(driverUsers)
        .set({ lastLogin: new Date() })
        .where(eq(driverUsers.id, driver[0].id));
      
      // Set driver session
      if (!req.session) {
        req.session = {} as any;
      }
      (req.session as any).driver = {
        id: driver[0].id,
        email: driver[0].email,
        firstName: driver[0].firstName,
        lastName: driver[0].lastName,
        phone: driver[0].phone,
        type: 'driver'
      };
      
      res.json({ success: true, redirect: '/driver/dashboard' });
    } catch (error) {
      console.error("Driver login error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get current session user
  app.get('/api/auth/current', (req, res) => {
    const session = req.session as any;
    
    if (session.admin) {
      return res.json({ user: session.admin, type: 'admin' });
    } else if (session.driver) {
      return res.json({ user: session.driver, type: 'driver' });
    } else if (session.customer) {
      return res.json({ user: session.customer, type: 'customer' });
    } else {
      return res.status(401).json({ message: "No authenticated" });
    }
  });

  // Logout
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error al cerrar sesión" });
      }
      res.json({ success: true, redirect: '/' });
    });
  });
}