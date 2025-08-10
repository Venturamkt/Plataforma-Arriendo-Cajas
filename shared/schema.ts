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
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Legacy user table (keep for sessions)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["admin", "driver", "customer"] }).default("customer"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Separate authentication tables for SaaS model
export const adminUsers = pgTable("admin_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const driverUsers = pgTable("driver_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  phone: varchar("phone"),
  licenseNumber: varchar("license_number"),
  isActive: boolean("is_active").default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customerAccess = pgTable("customer_access", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email"),
  rut: varchar("rut").unique(),
  phone: varchar("phone"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  lastAccess: timestamp("last_access"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customers table for extended customer information
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  address: text("address"),
  rut: varchar("rut"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Boxes table
export const boxes = pgTable("boxes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  barcode: varchar("barcode").unique().notNull(),
  status: varchar("status", { 
    enum: ["available", "rented", "maintenance", "damaged"] 
  }).default("available"),
  size: varchar("size", { enum: ["small", "medium", "large"] }).notNull(),
  condition: varchar("condition", { enum: ["excellent", "good", "fair", "needs_repair"] }).default("excellent"),
  location: varchar("location"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Rentals table
export const rentals = pgTable("rentals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  status: varchar("status", { 
    enum: ["pendiente", "pagada", "entregada", "retirada", "finalizado", "cancelada"] 
  }).default("pendiente"),
  totalBoxes: integer("total_boxes").notNull(),
  dailyRate: decimal("daily_rate", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  guaranteeAmount: decimal("guarantee_amount", { precision: 10, scale: 2 }).notNull(),
  additionalProducts: text("additional_products"), // JSON string for flexible products
  additionalProductsTotal: decimal("additional_products_total", { precision: 10, scale: 2 }).default("0"),
  deliveryDate: timestamp("delivery_date").notNull(),
  returnDate: timestamp("return_date"),
  deliveryAddress: text("delivery_address"),
  pickupAddress: text("pickup_address"),
  notes: text("notes"),
  trackingCode: varchar("tracking_code").unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Rental boxes relationship
export const rentalBoxes = pgTable("rental_boxes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rentalId: varchar("rental_id").references(() => rentals.id).notNull(),
  boxId: varchar("box_id").references(() => boxes.id).notNull(),
  status: varchar("status", { 
    enum: ["assigned", "delivered", "returned", "damaged"] 
  }).default("assigned"),
  deliveredAt: timestamp("delivered_at"),
  returnedAt: timestamp("returned_at"),
  condition: text("condition"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Box movements/history
export const boxMovements = pgTable("box_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  boxId: varchar("box_id").references(() => boxes.id).notNull(),
  rentalId: varchar("rental_id").references(() => rentals.id),
  action: varchar("action", { 
    enum: ["created", "reserved", "paid", "delivered", "returned", "cleaned", "damaged", "repaired"] 
  }).notNull(),
  performedBy: varchar("performed_by").references(() => users.id),
  notes: text("notes"),
  location: varchar("location"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Delivery tasks
export const deliveryTasks = pgTable("delivery_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").references(() => users.id).notNull(),
  rentalId: varchar("rental_id").references(() => rentals.id).notNull(),
  type: varchar("type", { enum: ["delivery", "pickup"] }).notNull(),
  status: varchar("status", { 
    enum: ["assigned", "in_progress", "completed", "failed"] 
  }).default("assigned"),
  scheduledDate: timestamp("scheduled_date").notNull(),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  deliveryTasks: many(deliveryTasks),
  boxMovements: many(boxMovements),
  customer: many(customers),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, { fields: [customers.userId], references: [users.id] }),
  rentals: many(rentals),
}));

export const boxesRelations = relations(boxes, ({ many }) => ({
  rentalBoxes: many(rentalBoxes),
  movements: many(boxMovements),
}));

export const rentalsRelations = relations(rentals, ({ one, many }) => ({
  customer: one(customers, { fields: [rentals.customerId], references: [customers.id] }),
  rentalBoxes: many(rentalBoxes),
  deliveryTasks: many(deliveryTasks),
  movements: many(boxMovements),
}));

export const rentalBoxesRelations = relations(rentalBoxes, ({ one }) => ({
  rental: one(rentals, { fields: [rentalBoxes.rentalId], references: [rentals.id] }),
  box: one(boxes, { fields: [rentalBoxes.boxId], references: [boxes.id] }),
}));

export const boxMovementsRelations = relations(boxMovements, ({ one }) => ({
  box: one(boxes, { fields: [boxMovements.boxId], references: [boxes.id] }),
  rental: one(rentals, { fields: [boxMovements.rentalId], references: [rentals.id] }),
  performedBy: one(users, { fields: [boxMovements.performedBy], references: [users.id] }),
}));

export const deliveryTasksRelations = relations(deliveryTasks, ({ one }) => ({
  driver: one(users, { fields: [deliveryTasks.driverId], references: [users.id] }),
  rental: one(rentals, { fields: [deliveryTasks.rentalId], references: [rentals.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBoxSchema = createInsertSchema(boxes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRentalSchema = createInsertSchema(rentals).omit({
  id: true,
  trackingCode: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  deliveryDate: z.coerce.date(),
  returnDate: z.coerce.date().optional(),
});

export const insertRentalBoxSchema = createInsertSchema(rentalBoxes).omit({
  id: true,
  createdAt: true,
});

export const insertBoxMovementSchema = createInsertSchema(boxMovements).omit({
  id: true,
  createdAt: true,
});

export const insertDeliveryTaskSchema = createInsertSchema(deliveryTasks).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertBox = z.infer<typeof insertBoxSchema>;
export type Box = typeof boxes.$inferSelect;
export type InsertRental = z.infer<typeof insertRentalSchema>;
export type Rental = typeof rentals.$inferSelect;
export type InsertRentalBox = z.infer<typeof insertRentalBoxSchema>;
export type RentalBox = typeof rentalBoxes.$inferSelect;
export type InsertBoxMovement = z.infer<typeof insertBoxMovementSchema>;
export type BoxMovement = typeof boxMovements.$inferSelect;
export type InsertDeliveryTask = z.infer<typeof insertDeliveryTaskSchema>;
export type DeliveryTask = typeof deliveryTasks.$inferSelect;
