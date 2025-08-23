import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Usuarios Admin
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(), // Hash bcrypt
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role", { enum: ["admin", "driver", "customer"] }).default("admin"),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clientes
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  rut: varchar("rut").unique().notNull(),
  email: varchar("email").unique().notNull(),
  phone: varchar("phone").unique().notNull(),
  mainAddress: text("main_address"),
  secondaryAddress: text("secondary_address"),
  notes: text("notes"),
  currentDebt: decimal("current_debt", { precision: 10, scale: 2 }).default("0"),
  totalRentals: integer("total_rentals").default(0),
  activeRentals: integer("active_rentals").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Repartidores
export const drivers = pgTable("drivers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email").unique().notNull(),
  phone: varchar("phone").unique().notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sistema de Inventario Completo
export const inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").unique().notNull(), // CAJ001, BA001, CP001, CO001
  type: varchar("type", { 
    enum: ["caja", "base_movil", "carro_plegable", "correa_amarre"] 
  }).notNull(),
  status: varchar("status", { 
    enum: ["disponible", "alquilada", "mantenimiento", "dañada"] 
  }).default("disponible"),
  notes: text("notes"), // Notas sobre daños o estado
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relación entre arriendos e items del inventario
export const rentalItems = pgTable("rental_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rentalId: varchar("rental_id").references(() => rentals.id).notNull(),
  inventoryId: varchar("inventory_id").references(() => inventory.id).notNull(),
  assignedAt: timestamp("assigned_at").defaultNow(),
  returnedAt: timestamp("returned_at"),
  condition: varchar("condition", { 
    enum: ["bueno", "dañado", "perdido"] 
  }), // Estado al devolver
  damageNotes: text("damage_notes"), // Descripción de daños si los hay
});

// Mantener compatibilidad con boxes (deprecado gradualmente)
export const boxes = pgTable("boxes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").unique().notNull(),
  type: varchar("type").notNull().default("standard"),
  status: varchar("status", { 
    enum: ["disponible", "reservada", "en_terreno", "en_revision"] 
  }).default("disponible"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Arriendos
export const rentals = pgTable("rentals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  driverId: varchar("driver_id").references(() => drivers.id),
  status: varchar("status", { 
    enum: ["pendiente", "pagado", "en_ruta", "entregada", "retiro_programado", "retirada", "finalizada", "cancelada"] 
  }).default("pendiente"),
  boxQuantity: integer("box_quantity").notNull(),
  rentalDays: integer("rental_days"),
  pricePerDay: decimal("price_per_day", { precision: 10, scale: 2 }),
  guaranteeAmount: decimal("guarantee_amount", { precision: 10, scale: 2 }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }).default("0"),
  deliveryDate: timestamp("delivery_date"),
  pickupDate: timestamp("pickup_date"),
  actualDeliveryDate: timestamp("actual_delivery_date"),
  actualPickupDate: timestamp("actual_pickup_date"),
  deliveryAddress: text("delivery_address"),
  pickupAddress: text("pickup_address"),
  notes: text("notes"),
  additionalProducts: jsonb("additional_products").default([]),
  assignedItems: jsonb("assigned_items").default([]).$type<string[]>(), // IDs de items del inventario asignados
  trackingCode: varchar("tracking_code"), // Últimos 4 dígitos del ID sin el guión
  trackingToken: varchar("tracking_token"), // Token aleatorio de 5 caracteres para URL pública
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pagos
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rentalId: varchar("rental_id").references(() => rentals.id).notNull(),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: varchar("method", { enum: ["efectivo", "transferencia", "tarjeta"] }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Log de actividades
export const calendarEvents = pgTable("calendar_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  date: date("date").notNull(),
  time: text("time").notNull(),
  type: text("type").notNull().default("other"), // delivery, pickup, meeting, other
  status: text("status").notNull().default("scheduled"), // scheduled, in_progress, completed, cancelled
  description: text("description"),
  customerName: text("customer_name"),
  driverId: text("driver_id").references(() => drivers.id),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type").notNull(),
  description: text("description").notNull(),
  entityId: varchar("entity_id"),
  entityType: varchar("entity_type"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Configuración de notificaciones
export const notificationTemplates = pgTable("notification_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  event: varchar("event").unique().notNull(),
  subject: varchar("subject").notNull(),
  body: text("body").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const companySettings = pgTable("companySettings", {
  id: varchar("id", { length: 255 }).primaryKey().default(sql`gen_random_uuid()`),
  companyName: varchar("companyName", { length: 255 }).notNull().default("Arriendo Cajas"),
  logoUrl: text("logoUrl"),
  primaryColor: varchar("primaryColor", { length: 7 }).default("#C8201D"),
  secondaryColor: varchar("secondaryColor", { length: 7 }).default("#2E5CA6"),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow()
});

// Relaciones
export const customersRelations = relations(customers, ({ many }) => ({
  rentals: many(rentals),
  payments: many(payments),
}));

export const driversRelations = relations(drivers, ({ many }) => ({
  rentals: many(rentals),
}));

export const inventoryRelations = relations(inventory, ({ many }) => ({
  rentalItems: many(rentalItems),
}));

export const rentalItemsRelations = relations(rentalItems, ({ one }) => ({
  rental: one(rentals, {
    fields: [rentalItems.rentalId],
    references: [rentals.id],
  }),
  inventory: one(inventory, {
    fields: [rentalItems.inventoryId],
    references: [inventory.id],
  }),
}));

export const rentalsRelations = relations(rentals, ({ one, many }) => ({
  customer: one(customers, {
    fields: [rentals.customerId],
    references: [customers.id],
  }),
  driver: one(drivers, {
    fields: [rentals.driverId],
    references: [drivers.id],
  }),
  payments: many(payments),
  rentalItems: many(rentalItems),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  rental: one(rentals, {
    fields: [payments.rentalId],
    references: [rentals.id],
  }),
  customer: one(customers, {
    fields: [payments.customerId],
    references: [customers.id],
  }),
}));

// Schemas de validación
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const insertCustomerSchema = createInsertSchema(customers);
export const insertDriverSchema = createInsertSchema(drivers);
export const insertRentalSchema = createInsertSchema(rentals).extend({
  // Permitir fechas como strings que se convertirán automáticamente
  deliveryDate: z.string().nullable().optional(),
  pickupDate: z.string().nullable().optional(),
  actualDeliveryDate: z.string().nullable().optional(),
  actualPickupDate: z.string().nullable().optional(),
});
export const insertPaymentSchema = createInsertSchema(payments);
export const insertBoxSchema = createInsertSchema(boxes);
export const insertInventorySchema = createInsertSchema(inventory);
export const insertRentalItemSchema = createInsertSchema(rentalItems);

// Tipos
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;
export type Customer = typeof customers.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type Rental = typeof rentals.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Box = typeof boxes.$inferSelect;
export type Inventory = typeof inventory.$inferSelect;
export type RentalItem = typeof rentalItems.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type CompanySettings = typeof companySettings.$inferSelect;