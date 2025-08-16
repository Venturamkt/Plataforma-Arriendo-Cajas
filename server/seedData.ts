import { db } from "./db";
import { customers, drivers, rentals, boxes, payments } from "@shared/schema";

export async function seedInitialData() {
  try {
    // Verificar si ya hay datos
    const existingCustomers = await db.select().from(customers).limit(1);
    if (existingCustomers.length > 0) {
      console.log("Data already exists, skipping seed");
      return;
    }

    console.log("Seeding initial data...");

    // Crear algunos clientes de ejemplo
    const sampleCustomers = await db.insert(customers).values([
      {
        name: "María González",
        rut: "12.345.678-9",
        email: "maria@example.com",
        phone: "+56912345678",
        mainAddress: "Av. Providencia 123, Santiago",
        currentDebt: "0",
        totalRentals: 3,
        activeRentals: 1
      },
      {
        name: "Empresa ABC Ltda.",
        rut: "87.654.321-K",
        email: "contacto@abc.cl",
        phone: "+56987654321",
        mainAddress: "Las Condes 456, Santiago",
        currentDebt: "25000",
        totalRentals: 8,
        activeRentals: 2
      },
      {
        name: "Juan Pérez",
        rut: "11.222.333-4",
        email: "juan@email.com",
        phone: "+56911223344",
        mainAddress: "Ñuñoa 789, Santiago",
        currentDebt: "0",
        totalRentals: 1,
        activeRentals: 0
      }
    ]).returning();

    // Crear repartidores
    const sampleDrivers = await db.insert(drivers).values([
      {
        name: "Carlos Rodríguez",
        email: "carlos@arriendocajas.cl",
        phone: "+56922334455",
        isActive: true
      },
      {
        name: "Ana López",
        email: "ana@arriendocajas.cl", 
        phone: "+56933445566",
        isActive: true
      },
      {
        name: "Roberto Silva",
        email: "roberto@arriendocajas.cl",
        phone: "+56944556677",
        isActive: true
      },
      {
        name: "Patricia Rojas",
        email: "patricia@arriendocajas.cl",
        phone: "+56955667788",
        isActive: true
      },
      {
        name: "Miguel Fernández",
        email: "miguel@arriendocajas.cl",
        phone: "+56966778899",
        isActive: true
      },
      {
        name: "Carmen Valdés",
        email: "carmen@arriendocajas.cl",
        phone: "+56977889900",
        isActive: false
      }
    ]).returning();

    // Crear inventario de cajas
    const boxCodes = [];
    for (let i = 1; i <= 200; i++) {
      boxCodes.push({
        code: `AC-${i.toString().padStart(4, '0')}`,
        type: "standard",
        status: i <= 150 ? "disponible" as const : 
               i <= 170 ? "reservada" as const :
               i <= 190 ? "en_terreno" as const : "en_revision" as const
      });
    }
    
    await db.insert(boxes).values(boxCodes);

    // Crear algunos arriendos
    await db.insert(rentals).values([
      {
        customerId: sampleCustomers[0].id,
        driverId: sampleDrivers[0].id,
        status: "entregada",
        boxQuantity: 15,
        totalAmount: "75000",
        paidAmount: "75000",
        deliveryDate: new Date(),
        deliveryAddress: "Av. Providencia 123, Santiago",
        pickupAddress: "Av. Providencia 123, Santiago"
      },
      {
        customerId: sampleCustomers[1].id,
        driverId: sampleDrivers[1].id,
        status: "programada",
        boxQuantity: 25,
        totalAmount: "125000",
        paidAmount: "0",
        deliveryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // mañana
        deliveryAddress: "Las Condes 456, Santiago",
        pickupAddress: "Las Condes 456, Santiago"
      },
      {
        customerId: sampleCustomers[1].id,
        status: "pendiente",
        boxQuantity: 10,
        totalAmount: "50000",
        paidAmount: "25000",
        deliveryAddress: "Las Condes 456, Santiago",
        pickupAddress: "Las Condes 456, Santiago"
      }
    ]);

    console.log("Initial data seeded successfully");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
}