import { 
  users, 
  customers, 
  drivers, 
  rentals, 
  payments, 
  boxes, 
  activities,
  notificationTemplates,
  inventory,
  rentalItems,
  calendarEvents
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
  deleteDriver(id: string): Promise<void>;
  getDriverStats(id: string): Promise<any>;
  
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
  
  // Payments
  getPayments(filters?: any): Promise<any[]>;
  getPaymentById(id: string): Promise<any>;
  createPayment(paymentData: any): Promise<any>;
  updatePayment(id: string, paymentData: any): Promise<any>;
  deletePayment(id: string): Promise<void>;
  getPaymentStats(filters?: any): Promise<any>;
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
    const result = await db.insert(drivers).values({
      ...driverData,
      updatedAt: new Date()
    }).returning();
    
    await this.logActivity({
      type: "driver_created",
      description: `Repartidor ${driverData.name} creado`,
      entityId: result[0].id,
      entityType: "driver"
    });
    
    return result[0];
  }

  async updateDriver(id: string, driverData: any) {
    const result = await db.update(drivers)
      .set({ ...driverData, updatedAt: new Date() })
      .where(eq(drivers.id, id))
      .returning();
    
    await this.logActivity({
      type: "driver_updated",
      description: `Repartidor ${driverData.name || 'sin nombre'} actualizado`,
      entityId: id,
      entityType: "driver"
    });
    
    return result[0];
  }

  async deleteDriver(id: string) {
    const driver = await this.getDriverById(id);
    
    // Verificar si el repartidor tiene arriendos asignados
    const assignedRentals = await db
      .select({ count: sql<number>`count(*)` })
      .from(rentals)
      .where(eq(rentals.driverId, id));
    
    if (assignedRentals[0]?.count > 0) {
      throw new Error(`No se puede eliminar el repartidor ${driver?.name} porque tiene arriendos asignados. Primero reasigna o cancela los arriendos.`);
    }
    
    await db.delete(drivers).where(eq(drivers.id, id));
    
    await this.logActivity({
      type: "driver_deleted",
      description: `Repartidor ${driver?.name || 'sin nombre'} eliminado`,
      entityId: id,
      entityType: "driver"
    });
  }

  async getDriverStats(id: string) {
    const totalRentals = await db
      .select({ count: sql<number>`count(*)` })
      .from(rentals)
      .where(eq(rentals.driverId, id));

    const activeRentals = await db
      .select({ count: sql<number>`count(*)` })
      .from(rentals)
      .where(and(
        eq(rentals.driverId, id),
        sql`status IN ('programada', 'en_ruta', 'entregada', 'retiro_programado')`
      ));

    const completedRentals = await db
      .select({ count: sql<number>`count(*)` })
      .from(rentals)
      .where(and(
        eq(rentals.driverId, id),
        eq(rentals.status, 'finalizada')
      ));

    return {
      totalRentals: totalRentals[0]?.count || 0,
      activeRentals: activeRentals[0]?.count || 0,
      completedRentals: completedRentals[0]?.count || 0
    };
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

  // Inventory methods
  async getInventory(): Promise<any[]> {
    const result = await db.select().from(inventory).orderBy(inventory.type, inventory.code);
    return result;
  }

  async getAvailableInventory(type?: string, quantity?: number): Promise<any[]> {
    let query = db.select().from(inventory).where(eq(inventory.status, "disponible"));
    
    if (type && type !== 'todos') {
      query = query.where(eq(inventory.type, type as any));
    }
    
    const result = await query.orderBy(inventory.code).limit(quantity || 1000);
    return result;
  }

  async updateInventoryStatus(id: string, status: string): Promise<any> {
    const result = await db.update(inventory)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(inventory.id, id))
      .returning();
    return result[0];
  }

  async assignItemsToRental(rentalId: string, itemIds: string[]): Promise<any> {
    // Crear las asignaciones en rental_items
    const insertPromises = itemIds.map(itemId => 
      db.insert(rentalItems).values({
        rentalId,
        inventoryId: itemId
      }).returning()
    );

    // Actualizar estado de los items a 'alquilada'
    const updatePromises = itemIds.map(itemId => 
      db.update(inventory)
        .set({ status: 'alquilada', updatedAt: new Date() })
        .where(eq(inventory.id, itemId))
    );

    // Actualizar el arriendo con los items asignados
    const updateRental = db.update(rentals)
      .set({ assignedItems: itemIds, updatedAt: new Date() })
      .where(eq(rentals.id, rentalId))
      .returning();

    await Promise.all([...insertPromises, ...updatePromises]);
    const rentalResult = await updateRental;
    
    return rentalResult[0];
  }

  // Payments
  async getPayments(filters: any = {}) {
    try {
      const result = await db
        .select({
          id: payments.id,
          rentalId: payments.rentalId,
          customerId: payments.customerId,
          amount: payments.amount,
          method: payments.method,
          notes: payments.notes,
          createdAt: payments.createdAt
        })
        .from(payments)
        .orderBy(desc(payments.createdAt));

      return result;
    } catch (error) {
      console.error("Error fetching payments:", error);
      return [];
    }
  }

  async getPaymentById(id: string) {
    const result = await db.select().from(payments).where(eq(payments.id, id));
    return result[0] || null;
  }

  async createPayment(paymentData: any) {
    // Obtener información del arriendo para obtener el customerId
    const rental = await db.select().from(rentals).where(eq(rentals.id, paymentData.rentalId)).limit(1);
    if (!rental.length) {
      throw new Error("Arriendo no encontrado");
    }

    const paymentToInsert = {
      rentalId: paymentData.rentalId,
      customerId: rental[0].customerId,
      amount: paymentData.amount,
      method: paymentData.method || paymentData.paymentMethod,
      notes: paymentData.notes
    };

    const result = await db.insert(payments).values(paymentToInsert).returning();
    
    await this.logActivity({
      type: "payment_created",
      description: `Pago de $${paymentData.amount} registrado`,
      entityId: result[0].id,
      entityType: "payment"
    });
    
    return result[0];
  }

  async updatePayment(id: string, paymentData: any) {
    const updateData = {
      amount: paymentData.amount,
      method: paymentData.method || paymentData.paymentMethod,
      notes: paymentData.notes
    };

    const result = await db.update(payments)
      .set(updateData)
      .where(eq(payments.id, id))
      .returning();

    await this.logActivity({
      type: "payment_updated",
      description: `Pago actualizado`,
      entityId: id,
      entityType: "payment"
    });

    return result[0];
  }

  async deletePayment(id: string) {
    await db.delete(payments).where(eq(payments.id, id));
    
    await this.logActivity({
      type: "payment_deleted",
      description: `Pago eliminado`,
      entityId: id,
      entityType: "payment"
    });
  }

  async getPaymentStats(filters: any = {}) {
    // Ingresos totales
    const totalRevenue = await db
      .select({ total: sql<string>`COALESCE(SUM(CAST(${payments.amount} AS DECIMAL)), 0)` })
      .from(payments);

    // Pagos pendientes (saldo de arriendos)
    const pendingPayments = await db
      .select({ 
        total: sql<string>`COALESCE(SUM(CAST(${rentals.totalAmount} AS DECIMAL) - CAST(${rentals.paidAmount} AS DECIMAL)), 0)` 
      })
      .from(rentals)
      .where(sql`CAST(${rentals.paidAmount} AS DECIMAL) < CAST(${rentals.totalAmount} AS DECIMAL)`);

    // Contar pagos totales
    const totalPayments = await db
      .select({ count: sql<number>`count(*)` })
      .from(payments);

    // Pago promedio
    const averagePayment = await db
      .select({ avg: sql<string>`COALESCE(AVG(CAST(${payments.amount} AS DECIMAL)), 0)` })
      .from(payments);

    return {
      totalRevenue: totalRevenue[0]?.total || "0",
      pendingPayments: pendingPayments[0]?.total || "0",
      completedPayments: totalPayments[0]?.count || 0,
      averagePayment: averagePayment[0]?.avg || "0",
      revenueChange: 0,
      paymentsThisPeriod: totalPayments[0]?.count || 0
    };
  }

  async logActivity(activityData: any) {
    const result = await db.insert(activities).values(activityData).returning();
    return result[0];
  }

  async getFinancialReport(startDate: string, endDate: string): Promise<any> {
    const paymentsData = await db.select()
      .from(payments)
      .where(
        sql`${payments.paymentDate} >= ${startDate} AND ${payments.paymentDate} <= ${endDate}`
      );

    const totalRevenue = paymentsData.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    const paymentsCount = paymentsData.length;
    const averagePayment = paymentsCount > 0 ? totalRevenue / paymentsCount : 0;

    // Agrupar por día
    const dailyRevenue = paymentsData.reduce((acc: any[], payment) => {
      const date = payment.paymentDate;
      const existing = acc.find(d => d.date === date);
      if (existing) {
        existing.revenue += parseFloat(payment.amount);
        existing.payments += 1;
      } else {
        acc.push({
          date,
          revenue: parseFloat(payment.amount),
          payments: 1
        });
      }
      return acc;
    }, []);

    return {
      totalRevenue,
      paymentsCount,
      averagePayment,
      dailyRevenue: dailyRevenue.sort((a, b) => a.date.localeCompare(b.date))
    };
  }

  async getCustomersReport(startDate: string, endDate: string): Promise<any> {
    const rentalsData = await db.select()
      .from(rentals)
      .innerJoin(customers, eq(rentals.customerId, customers.id))
      .where(
        sql`${rentals.startDate} >= ${startDate} AND ${rentals.startDate} <= ${endDate}`
      );

    const activeCustomers = new Set(rentalsData.map(r => r.rental.customerId)).size;
    const totalRentals = rentalsData.length;

    // Clientes por ingresos
    const customerRevenue = rentalsData.reduce((acc: any[], rental) => {
      const customerId = rental.rental.customerId;
      const existing = acc.find(c => c.customerId === customerId);
      const paidAmount = parseFloat(rental.rental.paidAmount || "0");
      
      if (existing) {
        existing.totalPaid += paidAmount;
        existing.rentals += 1;
      } else {
        acc.push({
          customerId,
          name: rental.customer.name,
          rut: rental.customer.rut,
          totalPaid: paidAmount,
          rentals: 1
        });
      }
      return acc;
    }, []);

    const topCustomers = customerRevenue
      .sort((a, b) => b.totalPaid - a.totalPaid)
      .slice(0, 10);

    return {
      activeCustomers,
      newCustomers: 0, // Sería necesario comparar con período anterior
      totalRentals,
      topCustomers
    };
  }

  async getInventoryReport(startDate: string, endDate: string): Promise<any> {
    return {
      message: "Reporte de inventario en desarrollo"
    };
  }

  async getOperationsReport(startDate: string, endDate: string): Promise<any> {
    return {
      message: "Reporte operacional en desarrollo"
    };
  }

  async getCalendarEvents(year?: string, month?: string): Promise<any[]> {
    let query = db.select().from(calendarEvents);
    
    if (year && month) {
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
      const startDate = `${year}-${month.padStart(2, '0')}-01`;
      const endDate = `${year}-${month.padStart(2, '0')}-${daysInMonth.toString().padStart(2, '0')}`;
      
      query = query.where(
        and(
          gte(calendarEvents.date, startDate),
          lte(calendarEvents.date, endDate)
        )
      );
    }
    
    const events = await query.orderBy(calendarEvents.date, calendarEvents.time);
    return events;
  }

  async createCalendarEvent(eventData: any): Promise<any> {
    const [event] = await db.insert(calendarEvents).values(eventData).returning();
    return event;
  }

  async updateCalendarEvent(id: string, eventData: any): Promise<any> {
    const [event] = await db
      .update(calendarEvents)
      .set({ ...eventData, updatedAt: new Date() })
      .where(eq(calendarEvents.id, id))
      .returning();
    return event;
  }

  async deleteCalendarEvent(id: string): Promise<void> {
    await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
  }

  generateCSV(data: any, type: string): string {
    switch (type) {
      case "financial":
        let csv = "Fecha,Ingresos,Cantidad de Pagos\n";
        if (data.dailyRevenue) {
          data.dailyRevenue.forEach((day: any) => {
            csv += `${day.date},${day.revenue},${day.payments}\n`;
          });
        }
        return csv;
      
      case "customers":
        let customersCsv = "Cliente,RUT,Arriendos,Total Pagado\n";
        if (data.topCustomers) {
          data.topCustomers.forEach((customer: any) => {
            customersCsv += `${customer.name},${customer.rut},${customer.rentals},${customer.totalPaid}\n`;
          });
        }
        return customersCsv;
      
      default:
        return "Tipo de reporte no soportado";
    }
  }
}

export const storage = new PostgresStorage();