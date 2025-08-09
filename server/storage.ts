import {
  users,
  customers,
  boxes,
  rentals,
  rentalBoxes,
  boxMovements,
  deliveryTasks,
  type User,
  type UpsertUser,
  type Customer,
  type InsertCustomer,
  type Box,
  type InsertBox,
  type Rental,
  type InsertRental,
  type RentalBox,
  type InsertRentalBox,
  type BoxMovement,
  type InsertBoxMovement,
  type DeliveryTask,
  type InsertDeliveryTask,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sql, or, like } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  
  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  
  // Box operations
  getBoxes(): Promise<Box[]>;
  getBox(id: string): Promise<Box | undefined>;
  getBoxByBarcode(barcode: string): Promise<Box | undefined>;
  createBox(box: InsertBox): Promise<Box>;
  updateBox(id: string, box: Partial<InsertBox>): Promise<Box | undefined>;
  getBoxesByStatus(status: string): Promise<Box[]>;
  
  // Rental operations
  getRentals(): Promise<Rental[]>;
  getRental(id: string): Promise<Rental | undefined>;
  createRental(rental: InsertRental): Promise<Rental>;
  updateRental(id: string, rental: Partial<InsertRental>): Promise<Rental | undefined>;
  getRentalsByCustomer(customerId: string): Promise<Rental[]>;
  getRentalsByStatus(status: string): Promise<Rental[]>;
  
  // Rental box operations
  getRentalBoxes(rentalId: string): Promise<RentalBox[]>;
  createRentalBox(rentalBox: InsertRentalBox): Promise<RentalBox>;
  updateRentalBox(id: string, rentalBox: Partial<InsertRentalBox>): Promise<RentalBox | undefined>;
  
  // Box movement operations
  getBoxMovements(boxId?: string): Promise<BoxMovement[]>;
  createBoxMovement(movement: InsertBoxMovement): Promise<BoxMovement>;
  
  // Delivery task operations
  getDeliveryTasks(driverId?: string): Promise<DeliveryTask[]>;
  createDeliveryTask(task: InsertDeliveryTask): Promise<DeliveryTask>;
  updateDeliveryTask(id: string, task: Partial<InsertDeliveryTask>): Promise<DeliveryTask | undefined>;
  
  // Dashboard metrics
  getDashboardMetrics(): Promise<{
    activeBoxes: number;
    pendingDeliveries: number;
    monthlyRevenue: number;
    activeCustomers: number;
    statusCounts: Record<string, number>;
  }>;
  
  // Initialize default admin user
  initializeDefaultAdmin(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ role: role as any, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Customer operations
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.email, email));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [updatedCustomer] = await db
      .update(customers)
      .set({ ...customer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  // Box operations
  async getBoxes(): Promise<Box[]> {
    return await db.select().from(boxes).orderBy(desc(boxes.createdAt));
  }

  async getBox(id: string): Promise<Box | undefined> {
    const [box] = await db.select().from(boxes).where(eq(boxes.id, id));
    return box;
  }

  async getBoxByBarcode(barcode: string): Promise<Box | undefined> {
    const [box] = await db.select().from(boxes).where(eq(boxes.barcode, barcode));
    return box;
  }

  async createBox(box: InsertBox): Promise<Box> {
    const [newBox] = await db.insert(boxes).values(box).returning();
    return newBox;
  }

  async updateBox(id: string, box: Partial<InsertBox>): Promise<Box | undefined> {
    const [updatedBox] = await db
      .update(boxes)
      .set({ ...box, updatedAt: new Date() })
      .where(eq(boxes.id, id))
      .returning();
    return updatedBox;
  }

  async getBoxesByStatus(status: string): Promise<Box[]> {
    return await db.select().from(boxes).where(eq(boxes.status, status as any));
  }

  // Rental operations
  async getRentals(): Promise<Rental[]> {
    return await db.select().from(rentals).orderBy(desc(rentals.createdAt));
  }

  async getRental(id: string): Promise<Rental | undefined> {
    const [rental] = await db.select().from(rentals).where(eq(rentals.id, id));
    return rental;
  }

  async createRental(rental: InsertRental): Promise<Rental> {
    const [newRental] = await db.insert(rentals).values(rental).returning();
    return newRental;
  }

  async updateRental(id: string, rental: Partial<InsertRental>): Promise<Rental | undefined> {
    const [updatedRental] = await db
      .update(rentals)
      .set({ ...rental, updatedAt: new Date() })
      .where(eq(rentals.id, id))
      .returning();
    return updatedRental;
  }

  async getRentalsByCustomer(customerId: string): Promise<Rental[]> {
    return await db.select().from(rentals).where(eq(rentals.customerId, customerId));
  }

  async getRentalsByStatus(status: string): Promise<Rental[]> {
    return await db.select().from(rentals).where(eq(rentals.status, status as any));
  }

  // Rental box operations
  async getRentalBoxes(rentalId: string): Promise<RentalBox[]> {
    return await db.select().from(rentalBoxes).where(eq(rentalBoxes.rentalId, rentalId));
  }

  async createRentalBox(rentalBox: InsertRentalBox): Promise<RentalBox> {
    const [newRentalBox] = await db.insert(rentalBoxes).values(rentalBox).returning();
    return newRentalBox;
  }

  async updateRentalBox(id: string, rentalBox: Partial<InsertRentalBox>): Promise<RentalBox | undefined> {
    const [updatedRentalBox] = await db
      .update(rentalBoxes)
      .set(rentalBox)
      .where(eq(rentalBoxes.id, id))
      .returning();
    return updatedRentalBox;
  }

  // Box movement operations
  async getBoxMovements(boxId?: string): Promise<BoxMovement[]> {
    const query = db.select().from(boxMovements);
    if (boxId) {
      return await query.where(eq(boxMovements.boxId, boxId)).orderBy(desc(boxMovements.createdAt));
    }
    return await query.orderBy(desc(boxMovements.createdAt));
  }

  async createBoxMovement(movement: InsertBoxMovement): Promise<BoxMovement> {
    const [newMovement] = await db.insert(boxMovements).values(movement).returning();
    return newMovement;
  }

  // Delivery task operations
  async getDeliveryTasks(driverId?: string): Promise<DeliveryTask[]> {
    const query = db.select().from(deliveryTasks);
    if (driverId) {
      return await query.where(eq(deliveryTasks.driverId, driverId)).orderBy(desc(deliveryTasks.createdAt));
    }
    return await query.orderBy(desc(deliveryTasks.createdAt));
  }

  async createDeliveryTask(task: InsertDeliveryTask): Promise<DeliveryTask> {
    const [newTask] = await db.insert(deliveryTasks).values(task).returning();
    return newTask;
  }

  async updateDeliveryTask(id: string, task: Partial<InsertDeliveryTask>): Promise<DeliveryTask | undefined> {
    const [updatedTask] = await db
      .update(deliveryTasks)
      .set(task)
      .where(eq(deliveryTasks.id, id))
      .returning();
    return updatedTask;
  }

  // Dashboard metrics
  async getDashboardMetrics() {
    const activeBoxesResult = await db
      .select({ count: count() })
      .from(boxes)
      .where(eq(boxes.status, "available"));

    const pendingDeliveriesResult = await db
      .select({ count: count() })
      .from(deliveryTasks)
      .where(eq(deliveryTasks.status, "assigned"));

    const monthlyRevenueResult = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(CAST(${rentals.totalAmount} AS DECIMAL)), 0)` 
      })
      .from(rentals)
      .where(
        and(
          sql`EXTRACT(MONTH FROM ${rentals.createdAt}) = EXTRACT(MONTH FROM CURRENT_DATE)`,
          sql`EXTRACT(YEAR FROM ${rentals.createdAt}) = EXTRACT(YEAR FROM CURRENT_DATE)`
        )
      );

    const activeCustomersResult = await db
      .select({ count: count() })
      .from(rentals)
      .where(or(
        eq(rentals.status, "entregada"),
        eq(rentals.status, "pagada")
      ));

    // Status counts
    const statusCountsResult = await db
      .select({
        status: boxes.status,
        count: count()
      })
      .from(boxes)
      .groupBy(boxes.status);

    const statusCounts = statusCountsResult.reduce((acc, item) => {
      if (item.status) {
        acc[item.status] = item.count;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      activeBoxes: activeBoxesResult[0]?.count || 0,
      pendingDeliveries: pendingDeliveriesResult[0]?.count || 0,
      monthlyRevenue: monthlyRevenueResult[0]?.total || 0,
      activeCustomers: activeCustomersResult[0]?.count || 0,
      statusCounts,
    };
  }

  // Initialize default admin user
  async initializeDefaultAdmin(): Promise<void> {
    const adminEmail = "jalarcon@arriendocajas.cl";
    const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail));
    
    if (existingAdmin.length === 0) {
      await db.insert(users).values({
        id: "admin-default",
        email: adminEmail,
        firstName: "José",
        lastName: "Alarcón",
        role: "admin",
      });
    } else {
      // Update existing user to ensure they have admin role
      await db.update(users)
        .set({ role: "admin" })
        .where(eq(users.email, adminEmail));
    }
  }
}

export const storage = new DatabaseStorage();
