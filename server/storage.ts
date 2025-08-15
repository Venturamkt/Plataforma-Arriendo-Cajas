import {
  users,
  customers,
  boxes,
  rentals,
  rentalBoxes,
  boxMovements,
  deliveryTasks,
  customerAddresses,
  customerActivities,
  customerPayments,
  boxReservations,
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
  type CustomerAddress,
  type InsertCustomerAddress,
  type CustomerActivity,
  type InsertCustomerActivity,
  type CustomerPayment,
  type InsertCustomerPayment,
  type BoxReservation,
  type InsertBoxReservation
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sql, or, like, gte, lte } from "drizzle-orm";

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
  getCustomerByRut(rut: string): Promise<Customer | undefined>;
  getCustomerByPhone(phone: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;
  getCustomersWithFilters(filters: { hasDebt?: boolean; hasActiveRentals?: boolean; search?: string }): Promise<Customer[]>;
  
  // Customer addresses
  getCustomerAddresses(customerId: string): Promise<CustomerAddress[]>;
  createCustomerAddress(address: InsertCustomerAddress): Promise<CustomerAddress>;
  updateCustomerAddress(id: string, address: Partial<InsertCustomerAddress>): Promise<CustomerAddress | undefined>;
  deleteCustomerAddress(id: string): Promise<boolean>;
  
  // Customer activities (timeline)
  getCustomerActivities(customerId: string): Promise<CustomerActivity[]>;
  createCustomerActivity(activity: InsertCustomerActivity): Promise<CustomerActivity>;
  
  // Customer payments and debt
  getCustomerPayments(customerId: string): Promise<CustomerPayment[]>;
  createCustomerPayment(payment: InsertCustomerPayment): Promise<CustomerPayment>;
  updateCustomerPayment(id: string, payment: Partial<InsertCustomerPayment>): Promise<CustomerPayment | undefined>;
  getCustomerBalance(customerId: string): Promise<number>;
  
  // Enhanced rental with inventory validation
  validateInventoryForRental(totalBoxes: number, deliveryDate: Date, returnDate?: Date): Promise<{ available: number; alternatives?: { quantity: number; date: Date }[] }>;
  getCustomerRentals(customerId: string, status?: string): Promise<Rental[]>;
  
  // Box reservations
  createBoxReservation(reservation: InsertBoxReservation): Promise<BoxReservation>;
  getBoxReservations(rentalId?: string): Promise<BoxReservation[]>;
  updateBoxReservationStatus(reservationId: string, status: string): Promise<BoxReservation | undefined>;
  
  // Box operations
  getBoxes(): Promise<Box[]>;
  getBox(id: string): Promise<Box | undefined>;
  getBoxByBarcode(barcode: string): Promise<Box | undefined>;
  createBox(box: InsertBox): Promise<Box>;
  updateBox(id: string, box: Partial<InsertBox>): Promise<Box | undefined>;
  getBoxesByStatus(status: string): Promise<Box[]>;
  cleanupOrphanBoxes(): Promise<number>;
  
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

  async getCustomerByRut(rut: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.rut, rut));
    return customer;
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.phone, phone));
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
      // First, check if customer has active rentals with tracking codes
      const activeRentalsWithTracking = await db
        .select({ 
          id: rentals.id, 
          trackingCode: rentals.trackingCode,
          status: rentals.status 
        })
        .from(rentals)
        .where(eq(rentals.customerId, id));

      // Check for rentals with tracking codes that shouldn't be deleted
      const protectedRentals = activeRentalsWithTracking.filter(rental => 
        rental.trackingCode && 
        rental.status !== 'cancelada' && 
        rental.status !== 'finalizado'
      );

      if (protectedRentals.length > 0) {
        console.error(`Cannot delete customer ${id}: has ${protectedRentals.length} active rentals with tracking codes`);
        console.error('Protected rentals:', protectedRentals.map(r => `${r.trackingCode} (${r.status})`));
        throw new Error(`No se puede eliminar: cliente tiene ${protectedRentals.length} arriendos activos con código de seguimiento enviado`);
      }

      // Get all deletable rentals for this customer (only cancelled or finalized ones)
      const deletableRentals = await db
        .select({ id: rentals.id })
        .from(rentals)
        .where(eq(rentals.customerId, id));

      for (const rental of deletableRentals) {
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
      throw error; // Re-throw to let the API return the proper error message
    }
  }

  async getCustomersWithFilters(filters: { hasDebt?: boolean; hasActiveRentals?: boolean; search?: string }): Promise<Customer[]> {
    const conditions = [];
    
    if (filters.hasDebt) {
      conditions.push(sql`${customers.currentBalance} > 0`);
    }
    
    if (filters.hasActiveRentals) {
      conditions.push(sql`${customers.activeRentals} > 0`);
    }
    
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          like(customers.name, searchTerm),
          like(customers.email, searchTerm),
          like(customers.rut, searchTerm),
          like(customers.phone, searchTerm)
        )
      );
    }
    
    if (conditions.length > 0) {
      return await db.select().from(customers).where(and(...conditions)).orderBy(desc(customers.createdAt));
    }
    
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  // Customer addresses
  async getCustomerAddresses(customerId: string): Promise<CustomerAddress[]> {
    return await db.select().from(customerAddresses)
      .where(eq(customerAddresses.customerId, customerId))
      .orderBy(desc(customerAddresses.isPrimary), desc(customerAddresses.createdAt));
  }

  async createCustomerAddress(address: InsertCustomerAddress): Promise<CustomerAddress> {
    const [newAddress] = await db.insert(customerAddresses).values(address).returning();
    return newAddress;
  }

  async updateCustomerAddress(id: string, address: Partial<InsertCustomerAddress>): Promise<CustomerAddress | undefined> {
    const [updatedAddress] = await db
      .update(customerAddresses)
      .set({ ...address, updatedAt: new Date() })
      .where(eq(customerAddresses.id, id))
      .returning();
    return updatedAddress;
  }

  async deleteCustomerAddress(id: string): Promise<boolean> {
    const result = await db.delete(customerAddresses).where(eq(customerAddresses.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Customer activities (timeline)
  async getCustomerActivities(customerId: string): Promise<CustomerActivity[]> {
    return await db.select().from(customerActivities)
      .where(eq(customerActivities.customerId, customerId))
      .orderBy(desc(customerActivities.createdAt));
  }

  async createCustomerActivity(activity: InsertCustomerActivity): Promise<CustomerActivity> {
    const [newActivity] = await db.insert(customerActivities).values(activity).returning();
    return newActivity;
  }

  // Customer payments and debt
  async getCustomerPayments(customerId: string): Promise<CustomerPayment[]> {
    return await db.select().from(customerPayments)
      .where(eq(customerPayments.customerId, customerId))
      .orderBy(desc(customerPayments.createdAt));
  }

  async createCustomerPayment(payment: InsertCustomerPayment): Promise<CustomerPayment> {
    const [newPayment] = await db.insert(customerPayments).values(payment).returning();
    
    // Update customer balance
    await this.updateCustomerBalance(payment.customerId);
    
    return newPayment;
  }

  async updateCustomerPayment(id: string, payment: Partial<InsertCustomerPayment>): Promise<CustomerPayment | undefined> {
    const [updatedPayment] = await db
      .update(customerPayments)
      .set({ ...payment, updatedAt: new Date() })
      .where(eq(customerPayments.id, id))
      .returning();
    
    if (updatedPayment) {
      await this.updateCustomerBalance(updatedPayment.customerId);
    }
    
    return updatedPayment;
  }

  async getCustomerBalance(customerId: string): Promise<number> {
    const [result] = await db
      .select({ 
        balance: sql<number>`COALESCE(SUM(
          CASE 
            WHEN ${customerPayments.type} = 'payment' THEN -${customerPayments.amount}
            WHEN ${customerPayments.type} = 'charge' THEN ${customerPayments.amount}
            ELSE ${customerPayments.amount}
          END
        ), 0)` 
      })
      .from(customerPayments)
      .where(eq(customerPayments.customerId, customerId));
      
    return result?.balance || 0;
  }

  private async updateCustomerBalance(customerId: string): Promise<void> {
    const balance = await this.getCustomerBalance(customerId);
    await db
      .update(customers)
      .set({ 
        currentBalance: balance.toString(),
        lastTransactionDate: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(customers.id, customerId));
  }

  // Enhanced rental with inventory validation
  async validateInventoryForRental(totalBoxes: number, deliveryDate: Date, returnDate?: Date): Promise<{ available: number; alternatives?: { quantity: number; date: Date }[] }> {
    const effectiveReturnDate = returnDate || new Date(deliveryDate.getTime() + (7 * 24 * 60 * 60 * 1000)); // Default 7 days
    
    // Get total available boxes
    const [totalBoxesResult] = await db
      .select({ count: count() })
      .from(boxes)
      .where(eq(boxes.status, 'available'));
    
    const totalAvailable = totalBoxesResult?.count || 0;
    
    // Get overlapping rentals for the requested period
    const overlappingRentals = await db
      .select({ totalBoxes: rentals.totalBoxes })
      .from(rentals)
      .where(
        and(
          sql`${rentals.deliveryDate} <= ${effectiveReturnDate}`,
          sql`${rentals.returnDate} >= ${deliveryDate} OR ${rentals.returnDate} IS NULL`,
          sql`${rentals.status} NOT IN ('cancelada', 'finalizado')`
        )
      );
    
    const boxesInUse = overlappingRentals.reduce((sum, rental) => sum + rental.totalBoxes, 0);
    const availableForPeriod = Math.max(0, totalAvailable - boxesInUse);
    
    const result: { available: number; alternatives?: { quantity: number; date: Date }[] } = {
      available: availableForPeriod
    };
    
    // If not enough boxes available, suggest alternatives
    if (availableForPeriod < totalBoxes) {
      const alternatives = [];
      
      // Check day before
      const dayBefore = new Date(deliveryDate.getTime() - (24 * 60 * 60 * 1000));
      const availableDayBefore = await this.validateInventoryForRental(totalBoxes, dayBefore, returnDate);
      if (availableDayBefore.available >= totalBoxes) {
        alternatives.push({ quantity: totalBoxes, date: dayBefore });
      }
      
      // Check day after
      const dayAfter = new Date(deliveryDate.getTime() + (24 * 60 * 60 * 1000));
      const availableDayAfter = await this.validateInventoryForRental(totalBoxes, dayAfter, returnDate);
      if (availableDayAfter.available >= totalBoxes) {
        alternatives.push({ quantity: totalBoxes, date: dayAfter });
      }
      
      // Suggest maximum available quantity for the requested date
      if (availableForPeriod > 0) {
        alternatives.push({ quantity: availableForPeriod, date: deliveryDate });
      }
      
      result.alternatives = alternatives;
    }
    
    return result;
  }

  async getCustomerRentals(customerId: string, status?: string): Promise<Rental[]> {
    if (status) {
      return await db.select().from(rentals)
        .where(and(eq(rentals.customerId, customerId), eq(rentals.status, status)))
        .orderBy(desc(rentals.createdAt));
    }
    
    return await db.select().from(rentals)
      .where(eq(rentals.customerId, customerId))
      .orderBy(desc(rentals.createdAt));
  }

  // Box reservations
  async createBoxReservation(reservation: InsertBoxReservation): Promise<BoxReservation> {
    const [newReservation] = await db.insert(boxReservations).values(reservation).returning();
    return newReservation;
  }

  async getBoxReservations(rentalId?: string): Promise<BoxReservation[]> {
    if (rentalId) {
      return await db.select().from(boxReservations)
        .where(eq(boxReservations.rentalId, rentalId))
        .orderBy(desc(boxReservations.createdAt));
    }
    
    return await db.select().from(boxReservations).orderBy(desc(boxReservations.createdAt));
  }

  async updateBoxReservationStatus(reservationId: string, status: 'reserved' | 'confirmed' | 'delivered' | 'returned' | 'cancelled'): Promise<BoxReservation | undefined> {
    const [updatedReservation] = await db
      .update(boxReservations)
      .set({ status, updatedAt: new Date() })
      .where(eq(boxReservations.id, reservationId))
      .returning();
    return updatedReservation;
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
    
    // Convert number values to strings for database
    const rentalData = {
      ...rental,
      dailyRate: typeof rental.dailyRate === 'number' ? rental.dailyRate.toString() : rental.dailyRate,
      guaranteeAmount: typeof rental.guaranteeAmount === 'number' ? rental.guaranteeAmount.toString() : rental.guaranteeAmount,
      totalAmount: typeof rental.totalAmount === 'number' ? rental.totalAmount.toString() : rental.totalAmount,
      subTotal: typeof rental.subTotal === 'number' ? rental.subTotal.toString() : rental.subTotal,
      deliveryFee: typeof rental.deliveryFee === 'number' ? rental.deliveryFee.toString() : rental.deliveryFee,
      trackingCode
    };
    
    const [newRental] = await db.insert(rentals).values(rentalData).returning();

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
    // Convert number values to strings for database
    const updateData = {
      ...rental,
      dailyRate: typeof rental.dailyRate === 'number' ? rental.dailyRate.toString() : rental.dailyRate,
      guaranteeAmount: typeof rental.guaranteeAmount === 'number' ? rental.guaranteeAmount.toString() : rental.guaranteeAmount,
      totalAmount: typeof rental.totalAmount === 'number' ? rental.totalAmount.toString() : rental.totalAmount,
      subTotal: typeof rental.subTotal === 'number' ? rental.subTotal.toString() : rental.subTotal,
      deliveryFee: typeof rental.deliveryFee === 'number' ? rental.deliveryFee.toString() : rental.deliveryFee,
      updatedAt: new Date()
    };
    
    const [updatedRental] = await db
      .update(rentals)
      .set(updateData)
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

  // Asignar repartidor automáticamente
  async assignDriverToRental(rentalId: string): Promise<Rental | undefined> {
    // Buscar un repartidor disponible (simplemente el primero disponible por ahora)
    const drivers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'driver'))
      .limit(1);

    if (drivers.length === 0) {
      console.log('No hay repartidores disponibles');
      return undefined;
    }

    const [updatedRental] = await db
      .update(rentals)
      .set({ 
        driverId: drivers[0].id,
        assignedDriver: `${drivers[0].firstName} ${drivers[0].lastName}`,
        updatedAt: new Date() 
      })
      .where(eq(rentals.id, rentalId))
      .returning();

    return updatedRental;
  }

  // Asignar códigos de cajas y generar código maestro
  async assignBoxCodesToRental(rentalId: string): Promise<Rental | undefined> {
    const rental = await this.getRental(rentalId);
    if (!rental) return undefined;

    // Obtener cajas disponibles
    const availableBoxes = await db
      .select()
      .from(boxes)
      .where(eq(boxes.status, 'available'))
      .limit(rental.totalBoxes);

    if (availableBoxes.length < rental.totalBoxes) {
      console.log(`No hay suficientes cajas disponibles. Necesarias: ${rental.totalBoxes}, Disponibles: ${availableBoxes.length}`);
      return undefined;
    }

    const boxCodes = availableBoxes.map(box => box.barcode);

    // Generar código maestro basado en RUT y tracking code
    const customer = await this.getCustomer(rental.customerId);
    const rutDigits = customer?.rut ? 
      customer.rut.replace(/[.-]/g, '').slice(0, -1).slice(-4).padStart(4, '0') : "0000";
    const masterCode = `${rutDigits}-${rental.trackingCode}`;

    // Actualizar el arriendo con los códigos
    const [updatedRental] = await db
      .update(rentals)
      .set({ 
        assignedBoxCodes: boxCodes,
        masterCode: masterCode,
        updatedAt: new Date() 
      })
      .where(eq(rentals.id, rentalId))
      .returning();

    // Marcar las cajas como no disponibles
    for (const box of availableBoxes) {
      await db
        .update(boxes)
        .set({ status: 'no_disponible' })
        .where(eq(boxes.id, box.id));
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
      let newBoxStatus: "available" | "no_disponible" | "maintenance" | "damaged" = "available";
      
      // Only mark as no_disponible if rental is "pagada" or "entregada"
      if (rentalStatus === 'pagada' || rentalStatus === 'entregada') {
        newBoxStatus = "no_disponible";
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
    console.log(`Looking for rental with RUT digits: ${rutDigits}, tracking code: ${trackingCode}`);
    
    const result = await db
      .select({
        rental: rentals,
        customer: customers
      })
      .from(rentals)
      .innerJoin(customers, eq(rentals.customerId, customers.id))
      .where(eq(rentals.trackingCode, trackingCode.toUpperCase()));
    
    console.log(`Found ${result.length} rentals with tracking code ${trackingCode}`);
    
    // Filter by RUT digits manually (more reliable than SQL functions)
    for (const item of result) {
      if (item.customer.rut) {
        // Extract last 4 digits before verification digit
        const extractedRutDigits = item.customer.rut.replace(/[.-]/g, '').slice(0, -1).slice(-4).padStart(4, '0');
        console.log(`Customer RUT: ${item.customer.rut}, extracted digits: ${extractedRutDigits}, looking for: ${rutDigits}`);
        
        if (extractedRutDigits === rutDigits) {
          console.log(`Match found! Returning rental ID: ${item.rental.id}`);
          return item.rental;
        }
      }
    }
    
    console.log(`No matching rental found for RUT digits: ${rutDigits}, tracking code: ${trackingCode}`);
    return undefined;
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
      .where(eq(boxes.status, "no_disponible"));

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
      // PROTECTED: Does not delete rentals with tracking codes to avoid breaking customer tracking links
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      // Get recent rentals but exclude ones with tracking codes
      const allRecentRentals = await db
        .select({ 
          id: rentals.id, 
          trackingCode: rentals.trackingCode 
        })
        .from(rentals)
        .where(sql`${rentals.createdAt} >= ${twoDaysAgo}`);
      
      // Filter out rentals with tracking codes (these should not be deleted)
      const deletableRentals = allRecentRentals.filter(r => !r.trackingCode);
      const protectedRentals = allRecentRentals.filter(r => r.trackingCode);
      
      console.log(`Found ${allRecentRentals.length} recent rentals: ${deletableRentals.length} deletable, ${protectedRentals.length} protected with tracking codes`);
      
      if (protectedRentals.length > 0) {
        console.log('Protected rentals with tracking codes:', protectedRentals.map(r => r.trackingCode));
      }
      
      if (deletableRentals.length === 0) {
        console.log('No recent test rentals found to delete');
        return 0;
      }
      
      const rentalIds = deletableRentals.map(r => r.id);
      
      // Delete dependent records first (only for deletable rentals)
      // 1. Delete delivery tasks for these rentals
      for (const rentalId of rentalIds) {
        await db
          .delete(deliveryTasks)
          .where(eq(deliveryTasks.rentalId, rentalId));
      }
      
      // 2. Delete rental boxes
      for (const rentalId of rentalIds) {
        await db
          .delete(rentalBoxes)
          .where(eq(rentalBoxes.rentalId, rentalId));
      }
      
      // 3. Reset box statuses to available for boxes that were assigned to deleted rentals
      if (rentalIds.length > 0) {
        await db
          .update(boxes)
          .set({ status: 'available' })
          .where(eq(boxes.status, 'no_disponible'));
      }
      
      // 4. Finally delete only the rentals without tracking codes
      if (rentalIds.length > 0) {
        await db
          .delete(rentals)
          .where(sql`${rentals.id} = ANY(${rentalIds})`);
      }
      
      console.log(`Reset test data: deleted ${rentalIds.length} recent rentals (protected ${protectedRentals.length} with tracking codes)`);
      return rentalIds.length;
    } catch (error) {
      console.error("Error resetting test data:", error);
      return 0;
    }
  }

  // Clean up orphan boxes that are marked as no_disponible but not in active rentals
  async cleanupOrphanBoxes(): Promise<number> {
    try {
      const result = await db
        .update(boxes)
        .set({ status: 'available', updatedAt: new Date() })
        .where(
          and(
            eq(boxes.status, 'no_disponible'),
            sql`${boxes.id} NOT IN (
              SELECT DISTINCT rb.box_id 
              FROM ${rentalBoxes} rb
              INNER JOIN ${rentals} r ON rb.rental_id = r.id
              WHERE r.status IN ('pendiente', 'pagada', 'entregada')
            )`
          )
        );
      
      console.log(`Cleaned up ${result.rowCount || 0} orphan boxes`);
      return result.rowCount || 0;
    } catch (error) {
      console.error("Error cleaning up orphan boxes:", error);
      return 0;
    }
  }

  // Initialize default admin user
  async initializeDefaultAdmin(): Promise<void> {
    const adminEmail = "contacto@arriendocajas.cl";
    const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail));
    
    if (existingAdmin.length === 0) {
      await db.insert(users).values({
        id: "admin-default",
        email: adminEmail,
        firstName: "Administrador",
        lastName: "Sistema",
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
