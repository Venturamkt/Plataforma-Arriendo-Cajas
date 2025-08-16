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

// Usuarios
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role", { enum: ["admin", "driver", "customer"] }).default("customer"),
  isActive: boolean("is_active").default(true),
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

// Inventario de cajas
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
    enum: ["pendiente", "programada", "en_ruta", "entregada", "retiro_programado", "retirada", "finalizada", "cancelada"] 
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

// Relaciones
export const customersRelations = relations(customers, ({ many }) => ({
  rentals: many(rentals),
  payments: many(payments),
}));

export const driversRelations = relations(drivers, ({ many }) => ({
  rentals: many(rentals),
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
export const insertCustomerSchema = createInsertSchema(customers);
export const insertDriverSchema = createInsertSchema(drivers);
export const insertRentalSchema = createInsertSchema(rentals);
export const insertPaymentSchema = createInsertSchema(payments);
export const insertBoxSchema = createInsertSchema(boxes);

// Tipos
export type Customer = typeof customers.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type Rental = typeof rentals.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Box = typeof boxes.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;