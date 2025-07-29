import bcrypt from "bcrypt";
import { adminUsers, driverUsers, customerAccess } from "@shared/schema";
import { db } from "./db";

export async function seedInitialData() {
  console.log("Seeding initial data...");
  
  try {
    // Create default admin user
    const adminExists = await db.select().from(adminUsers).limit(1);
    if (adminExists.length === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await db.insert(adminUsers).values({
        email: "jalarcon@arriendocajas.cl",
        password: hashedPassword,
        firstName: "José",
        lastName: "Alarcón",
        isActive: true,
      });
      console.log("✓ Admin user created: jalarcon@arriendocajas.cl / admin123");
    }
    
    // Create default driver user
    const driverExists = await db.select().from(driverUsers).limit(1);
    if (driverExists.length === 0) {
      const hashedPassword = await bcrypt.hash("driver123", 10);
      await db.insert(driverUsers).values({
        email: "repartidor@arriendocajas.cl",
        password: hashedPassword,
        firstName: "Carlos",
        lastName: "Conductor",
        phone: "+56912345678",
        licenseNumber: "A1234567",
        isActive: true,
      });
      console.log("✓ Driver user created: repartidor@arriendocajas.cl / driver123");
    }
    
    // Create sample customer access records
    const customerExists = await db.select().from(customerAccess).limit(1);
    if (customerExists.length === 0) {
      await db.insert(customerAccess).values([
        {
          email: "cliente1@empresa.cl",
          rut: "12345678-9",
          firstName: "María",
          lastName: "González",
          phone: "+56987654321",
        },
        {
          email: "cliente2@empresa.cl", 
          rut: "98765432-1",
          firstName: "Pedro",
          lastName: "Martínez",
          phone: "+56912345678",
        }
      ]);
      console.log("✓ Sample customer access records created");
    }
    
    console.log("Initial data seeding completed!");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
}