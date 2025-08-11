import {
  users,
  customers,
  boxes,
  rentals,
  rentalBoxes,
  boxMovements,
  deliveryTasks,
  driverUsers,
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
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  updateUserPassword(id: string, password: string): Promise<boolean>;
  
  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;
  
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
  getRentalByTracking(rutDigits: string, trackingCode: string): Promise<Rental | undefined>;
  
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

  async getUsers(filters?: { role?: string }): Promise<User[]> {
    if (filters?.role) {
      return await db.select().from(users)
        .where(eq(users.role, filters.role as "admin" | "driver" | "customer"))
        .orderBy(desc(users.createdAt));
    }
    
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
    try {
      const [user] = await db
        .update(users)
        .set({ 
          role: role as "admin" | "driver" | "customer", 
          updatedAt: new Date() 
        })
        .where(eq(users.id, id))
        .returning();
      return user;
    } catch (error) {
      console.error("Error in updateUserRole:", error);
      throw error;
    }
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      // First check if user exists
      const existingUser = await this.getUser(id);
      if (!existingUser) {
        console.log(`User with id ${id} not found`);
        return false;
      }

      // Delete all delivery tasks assigned to this user first
      await db.delete(deliveryTasks).where(eq(deliveryTasks.driverId, id));

      // Delete from driver_users table if it's a driver
      if (existingUser.role === 'driver') {
        await db.delete(driverUsers).where(eq(driverUsers.id, id));
      }

      // Finally delete the user
      const result = await db
        .delete(users)
        .where(eq(users.id, id));
      
      console.log(`User deletion result:`, result);
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  async updateUserPassword(id: string, password: string): Promise<boolean> {
    try {
      // Note: Password functionality disabled for current schema
      // Just update the timestamp to indicate password was "reset"
      const [user] = await db
        .update(users)
        .set({ updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      return !!user;
    } catch (error) {
      console.error("Error updating password:", error);
      return false;
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcrypt');
    const saltRounds = 12;
    return await bcrypt.default.hash(password, saltRounds);
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

  async deleteCustomer(id: string): Promise<boolean> {
    try {
      // First, get all rentals for this customer
      const customerRentals = await db
        .select({ id: rentals.id })
        .from(rentals)
        .where(eq(rentals.customerId, id));

      for (const rental of customerRentals) {
        // Delete delivery tasks associated with this rental
        await db.delete(deliveryTasks).where(eq(deliveryTasks.rentalId, rental.id));
        
        // Delete box movements associated with this rental
        await db.delete(boxMovements).where(eq(boxMovements.rentalId, rental.id));
        
        // Free up boxes and delete rental box relationships
        await this.freeBoxesFromRental(rental.id);
      }

      // Delete all rentals for this customer
      await db.delete(rentals).where(eq(rentals.customerId, id));

      // Finally delete the customer
      const result = await db.delete(customers).where(eq(customers.id, id));
      
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting customer:", error);
      return false;
    }
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
  async getRentals(): Promise<any[]> {
    // Get rentals with driver information
    const rentalsWithDrivers = await db
      .select({
        rental: rentals,
        driver: {
          id: driverUsers.id,
          firstName: driverUsers.firstName,
          lastName: driverUsers.lastName,
          email: driverUsers.email
        }
      })
      .from(rentals)
      .leftJoin(driverUsers, eq(rentals.assignedDriver, driverUsers.id))
      .orderBy(desc(rentals.createdAt));

    // Transform the data to include driver name in the rental object
    return rentalsWithDrivers.map(item => ({
      ...item.rental,
      driverName: item.driver ? `${item.driver.firstName} ${item.driver.lastName}` : null,
      driverEmail: item.driver?.email || null
    }));
  }

  async getRental(id: string): Promise<Rental | undefined> {
    const [rental] = await db.select().from(rentals).where(eq(rentals.id, id));
    return rental;
  }

  async createRental(rental: InsertRental): Promise<Rental> {
    // Generate unique tracking code
    const trackingCode = this.generateTrackingCode();
    
    const [newRental] = await db.insert(rentals).values({
      ...rental,
      trackingCode
    }).returning();

    // Assign available boxes to this rental 
    await this.assignBoxesToRental(newRental.id, rental.totalBoxes);
    
    // Update box status only if rental is "pagada" or "entregada"
    if (rental.status === 'pagada' || rental.status === 'entregada') {
      await this.updateBoxStatusForRental(newRental.id, rental.status);
    }
    
    return newRental;
  }

  private generateTrackingCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async generateTrackingCodeForRental(rentalId: string): Promise<Rental | undefined> {
    try {
      const trackingCode = this.generateTrackingCode();
      const [updatedRental] = await db
        .update(rentals)
        .set({ trackingCode, updatedAt: new Date() })
        .where(eq(rentals.id, rentalId))
        .returning();
      return updatedRental;
    } catch (error) {
      console.error("Error generating tracking code for rental:", error);
      return undefined;
    }
  }

  async updateRental(id: string, rental: Partial<InsertRental>): Promise<Rental | undefined> {
    const [updatedRental] = await db
      .update(rentals)
      .set({ ...rental, updatedAt: new Date() })
      .where(eq(rentals.id, id))
      .returning();

    // If totalBoxes changed, reassign boxes
    if (rental.totalBoxes && updatedRental) {
      await this.reassignBoxesToRental(id, rental.totalBoxes);
    }

    // Update box status based on rental status
    if (rental.status && updatedRental) {
      await this.updateBoxStatusForRental(id, rental.status);
    }
    
    return updatedRental;
  }

  private async assignBoxesToRental(rentalId: string, totalBoxes: number): Promise<void> {
    // Get available boxes
    const availableBoxes = await db
      .select()
      .from(boxes)
      .where(eq(boxes.status, "available"))
      .limit(totalBoxes);

    // Create rental_boxes relationships (but don't change box status yet)
    for (const box of availableBoxes) {
      await db.insert(rentalBoxes).values({
        rentalId,
        boxId: box.id,
        status: "assigned"
      });
    }
  }

  private async updateBoxStatusForRental(rentalId: string, rentalStatus: string): Promise<void> {
    // Get all boxes assigned to this rental
    const assignments = await db
      .select()
      .from(rentalBoxes)
      .where(eq(rentalBoxes.rentalId, rentalId));

    for (const assignment of assignments) {
      let newBoxStatus: "available" | "rented" | "maintenance" | "damaged" = "available";
      
      // Only mark as rented if rental is "pagada" or "entregada"
      if (rentalStatus === 'pagada' || rentalStatus === 'entregada') {
        newBoxStatus = "rented";
      }
      // For "finalizado", "cancelada", "pendiente", "retirada" - boxes go back to available
      
      await db
        .update(boxes)
        .set({ status: newBoxStatus })
        .where(eq(boxes.id, assignment.boxId));
    }
  }

  private async reassignBoxesToRental(rentalId: string, newTotalBoxes: number): Promise<void> {
    // Get currently assigned boxes
    const currentAssignments = await db
      .select()
      .from(rentalBoxes)
      .where(eq(rentalBoxes.rentalId, rentalId));

    const currentCount = currentAssignments.length;

    if (newTotalBoxes > currentCount) {
      // Need more boxes - assign additional ones
      const additionalBoxes = newTotalBoxes - currentCount;
      await this.assignBoxesToRental(rentalId, additionalBoxes);
    } else if (newTotalBoxes < currentCount) {
      // Need fewer boxes - free up some
      const boxesToFree = currentAssignments.slice(newTotalBoxes);
      for (const assignment of boxesToFree) {
        await db.delete(rentalBoxes).where(eq(rentalBoxes.id, assignment.id));
        await db
          .update(boxes)
          .set({ status: "available" })
          .where(eq(boxes.id, assignment.boxId));
      }
    }
  }

  private async freeBoxesFromRental(rentalId: string): Promise<void> {
    // Get all boxes assigned to this rental
    const assignments = await db
      .select()
      .from(rentalBoxes)
      .where(eq(rentalBoxes.rentalId, rentalId));

    // Free up all boxes
    for (const assignment of assignments) {
      await db
        .update(boxes)
        .set({ status: "available" })
        .where(eq(boxes.id, assignment.boxId));
    }

    // Remove rental_boxes relationships
    await db.delete(rentalBoxes).where(eq(rentalBoxes.rentalId, rentalId));
  }

  async getRentalsByCustomer(customerId: string): Promise<Rental[]> {
    return await db.select().from(rentals).where(eq(rentals.customerId, customerId));
  }

  async getRentalsByStatus(status: string): Promise<Rental[]> {
    return await db.select().from(rentals).where(eq(rentals.status, status as any));
  }

  async getRentalByTracking(rutDigits: string, trackingCode: string): Promise<Rental | undefined> {
    const [rental] = await db
      .select()
      .from(rentals)
      .innerJoin(customers, eq(rentals.customerId, customers.id))
      .where(
        and(
          eq(rentals.trackingCode, trackingCode.toUpperCase()),
          sql`RIGHT(LEFT(${customers.rut}, LENGTH(${customers.rut}) - 1), 4) = ${rutDigits}`
        )
      );
    
    return rental?.rentals;
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

  // Dashboard metrics with optional date filtering
  async getDashboardMetrics(startDate?: Date, endDate?: Date) {
    // Set default date range if not provided (last 30 days)
    if (!startDate) {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }
    if (!endDate) {
      endDate = new Date();
    }

    // Count boxes currently in rental (rented status) - no date filter for current status
    const activeBoxesResult = await db
      .select({ count: count() })
      .from(boxes)
      .where(eq(boxes.status, "rented"));

    // Count pending deliveries - no date filter for current status
    const pendingDeliveriesResult = await db
      .select({ count: count() })
      .from(deliveryTasks)
      .where(eq(deliveryTasks.status, "assigned"));

    // Revenue for the selected period
    const revenueResult = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(CAST(${rentals.totalAmount} AS DECIMAL)), 0)` 
      })
      .from(rentals)
      .where(
        and(
          sql`${rentals.createdAt} >= ${startDate}`,
          sql`${rentals.createdAt} <= ${endDate}`,
          sql`${rentals.status} != 'cancelado'`
        )
      );

    // Active customers in the selected period
    const activeCustomersResult = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${rentals.customerId})` })
      .from(rentals)
      .where(
        and(
          sql`${rentals.createdAt} >= ${startDate}`,
          sql`${rentals.createdAt} <= ${endDate}`,
          sql`${rentals.status} != 'cancelado'`
        )
      );

    // Status counts from current rental status (not filtered by date)
    const statusCountsResult = await db
      .select({
        status: rentals.status,
        count: count()
      })
      .from(rentals)
      .where(sql`${rentals.status} IN ('pendiente', 'pagada', 'entregada', 'retirada', 'finalizado')`)
      .groupBy(rentals.status);

    const statusCounts = statusCountsResult.reduce((acc, item) => {
      if (item.status) {
        acc[item.status] = item.count;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      activeBoxes: activeBoxesResult[0]?.count || 0,
      pendingDeliveries: pendingDeliveriesResult[0]?.count || 0,
      monthlyRevenue: revenueResult[0]?.total || 0,
      activeCustomers: activeCustomersResult[0]?.count || 0,
      statusCounts,
    };
  }

  async resetTestData(): Promise<number> {
    try {
      // Delete recent test rentals (created in the last 2 days for testing purposes)
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const result = await db
        .delete(rentals)
        .where(sql`${rentals.createdAt} >= ${twoDaysAgo}`);
      
      console.log(`Reset test data: deleted ${result.rowCount || 0} recent rentals`);
      return result.rowCount || 0;
    } catch (error) {
      console.error("Error resetting test data:", error);
      return 0;
    }
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
