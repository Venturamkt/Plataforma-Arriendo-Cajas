import bcrypt from "bcrypt";
import { adminUsers, driverUsers, customerAccess, boxes, customers } from "@shared/schema";
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

    // Create sample customers for the main system (disabled for production)
    const customersExist = await db.select().from(customers).limit(1);
    if (false && customersExist.length === 0) {
      await db.insert(customers).values([
        {
          name: "José Alarcón Lizama",
          email: "jalarcon@agenciaventura.cl",
          phone: "5698290995",
          address: "Av. Providencia 1208",
          rut: "12345678-9"
        },
        {
          name: "María González Silva",
          email: "mgonzalez@empresa.cl", 
          phone: "+56987654321",
          address: "Los Leones 1234, Las Condes",
          rut: "98765432-1"
        },
        {
          name: "Pedro Martínez López",
          email: "pmartinez@company.cl",
          phone: "+56912345678", 
          address: "Providencia 567, Providencia",
          rut: "11223344-5"
        }
      ]);
      console.log("✓ Sample customers created");
    }

    // Create sample boxes inventory (disabled for production)
    const boxesExist = await db.select().from(boxes).limit(1);
    if (false && boxesExist.length === 0) {
      const boxesToCreate = [];
      
      // Create boxes of different sizes
      const sizes = ['small', 'medium', 'large', 'large'] as const;
      const quantities = [15, 25, 20, 10]; // Quantity for each size
      
      for (let sizeIndex = 0; sizeIndex < sizes.length; sizeIndex++) {
        const size = sizes[sizeIndex];
        const quantity = quantities[sizeIndex];
        
        for (let i = 1; i <= quantity; i++) {
          const sizeCode = size === 'small' ? 'P' : 
                          size === 'medium' ? 'M' : 
                          size === 'large' && sizeIndex === 2 ? 'G' : 'XL';
          
          boxesToCreate.push({
            barcode: `ARR${sizeCode}${i.toString().padStart(3, '0')}`,
            size: size,
            status: 'available' as const,
            condition: 'excellent' as const,
            location: 'bodega'
          });
        }
      }
      
      await db.insert(boxes).values(boxesToCreate);
      console.log(`✓ Created ${boxesToCreate.length} sample boxes in inventory`);
    }
    
    console.log("Initial data seeding completed!");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
}