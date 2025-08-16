import { 
  users, 
  customers, 
  drivers, 
  rentals, 
  payments, 
  boxes, 
  activities,
  notificationTemplates 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, like, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUserById(id: string): Promise<any>;
  createUser(userData: any): Promise<any>;
  
  // Customers
  getCustomers(): Promise<any[]>;
  getCustomerById(id: string): Promise<any>;
  createCustomer(customerData: any): Promise<any>;
  updateCustomer(id: string, customerData: any): Promise<any>;
  deleteCustomer(id: string): Promise<void>;
  
  // Drivers
  getDrivers(): Promise<any[]>;
  getDriverById(id: string): Promise<any>;
  createDriver(driverData: any): Promise<any>;
  updateDriver(id: string, driverData: any): Promise<any>;
  
  // Rentals
  getRentals(): Promise<any[]>;
  getRentalById(id: string): Promise<any>;
  createRental(rentalData: any): Promise<any>;
  updateRental(id: string, rentalData: any): Promise<any>;
  
  // Payments
  getPayments(): Promise<any[]>;
  createPayment(paymentData: any): Promise<any>;
  
  // Boxes
  getBoxes(): Promise<any[]>;
  updateBoxStatus(id: string, status: "disponible" | "reservada" | "en_terreno" | "en_revision"): Promise<any>;
  
  // Dashboard
  getDashboardStats(): Promise<any>;
  
  // Activities
  logActivity(activityData: any): Promise<any>;
}

class PostgresStorage implements IStorage {
  // Users
  async getUserById(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0] || null;
  }

  async createUser(userData: any) {
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  }

  // Customers
  async getCustomers() {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomerById(id: string) {
    const result = await db.select().from(customers).where(eq(customers.id, id));
    return result[0] || null;
  }

  async createCustomer(customerData: any) {
    const result = await db.insert(customers).values(customerData).returning();
    return result[0];
  }

  async updateCustomer(id: string, customerData: any) {
    const result = await db.update(customers)
      .set({ ...customerData, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return result[0];
  }

  async deleteCustomer(id: string) {
    await db.delete(customers).where(eq(customers.id, id));
  }

  // Drivers
  async getDrivers() {
    return await db.select().from(drivers).orderBy(desc(drivers.createdAt));
  }

  async getDriverById(id: string) {
    const result = await db.select().from(drivers).where(eq(drivers.id, id));
    return result[0] || null;
  }

  async createDriver(driverData: any) {
    const result = await db.insert(drivers).values(driverData).returning();
    return result[0];
  }

  async updateDriver(id: string, driverData: any) {
    const result = await db.update(drivers)
      .set({ ...driverData, updatedAt: new Date() })
      .where(eq(drivers.id, id))
      .returning();
    return result[0];
  }

  // Rentals
  async getRentals() {
    return await db.select({
      id: rentals.id,
      status: rentals.status,
      boxQuantity: rentals.boxQuantity,
      totalAmount: rentals.totalAmount,
      paidAmount: rentals.paidAmount,
      deliveryDate: rentals.deliveryDate,
      pickupDate: rentals.pickupDate,
      createdAt: rentals.createdAt,
      customer: {
        id: customers.id,
        name: customers.name,
        rut: customers.rut,
        email: customers.email,
        phone: customers.phone
      },
      driver: {
        id: drivers.id,
        name: drivers.name
      }
    })
    .from(rentals)
    .leftJoin(customers, eq(rentals.customerId, customers.id))
    .leftJoin(drivers, eq(rentals.driverId, drivers.id))
    .orderBy(desc(rentals.createdAt));
  }

  async getRentalById(id: string) {
    const result = await db.select().from(rentals).where(eq(rentals.id, id));
    return result[0] || null;
  }

  async createRental(rentalData: any) {
    const result = await db.insert(rentals).values(rentalData).returning();
    return result[0];
  }

  async updateRental(id: string, rentalData: any) {
    const result = await db.update(rentals)
      .set({ ...rentalData, updatedAt: new Date() })
      .where(eq(rentals.id, id))
      .returning();
    return result[0];
  }

  // Payments
  async getPayments() {
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async createPayment(paymentData: any) {
    const result = await db.insert(payments).values(paymentData).returning();
    return result[0];
  }

  // Boxes
  async getBoxes() {
    return await db.select().from(boxes).orderBy(boxes.code);
  }

  async updateBoxStatus(id: string, status: "disponible" | "reservada" | "en_terreno" | "en_revision") {
    const result = await db.update(boxes)
      .set({ status, updatedAt: new Date() })
      .where(eq(boxes.id, id))
      .returning();
    return result[0];
  }

  // Dashboard
  async getDashboardStats() {
    // Obtener estadísticas del dashboard
    const totalCustomers = await db.select({ count: sql<number>`count(*)` }).from(customers);
    const totalDrivers = await db.select({ count: sql<number>`count(*)` }).from(drivers);
    const totalBoxes = await db.select({ count: sql<number>`count(*)` }).from(boxes);
    
    const rentalStats = await db.select({
      status: rentals.status,
      count: sql<number>`count(*)`
    })
    .from(rentals)
    .groupBy(rentals.status);

    const boxStats = await db.select({
      status: boxes.status,
      count: sql<number>`count(*)`
    })
    .from(boxes)
    .groupBy(boxes.status);

    return {
      customers: totalCustomers[0]?.count || 0,
      drivers: totalDrivers[0]?.count || 0,
      boxes: totalBoxes[0]?.count || 0,
      rentals: rentalStats,
      inventory: boxStats
    };
  }

  // Activities
  async logActivity(activityData: any) {
    const result = await db.insert(activities).values(activityData).returning();
    return result[0];
  }
}

export const storage = new PostgresStorage();