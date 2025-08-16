import { db } from "./db";
import { inventory } from "@shared/schema";
import { eq } from "drizzle-orm";

// Función para generar códigos aleatorios únicos
function generateRandomCode(prefix: string, length: number = 3): string {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = prefix;
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Función para asegurar códigos únicos
async function generateUniqueCode(prefix: string): Promise<string> {
  let code: string;
  let exists = true;
  
  while (exists) {
    code = generateRandomCode(prefix);
    const existing = await db.select().from(inventory).where(eq(inventory.code, code)).limit(1);
    exists = existing.length > 0;
  }
  
  return code!;
}

export async function seedInventory() {
  console.log("🏗️  Generando inventario inicial...");
  
  try {
    // Verificar si ya existe inventario
    const existingInventory = await db.select().from(inventory).limit(1);
    if (existingInventory.length > 0) {
      console.log("✅ Inventario ya existe, omitiendo seed");
      return;
    }

    const inventoryItems: any[] = [];

    // Generar 50 cajas con códigos CAJ
    console.log("📦 Generando 50 cajas...");
    for (let i = 0; i < 50; i++) {
      const code = await generateUniqueCode("CAJ");
      inventoryItems.push({
        code,
        type: "caja",
        status: "disponible",
        notes: null
      });
    }

    // Generar 4 bases móviles con códigos BA
    console.log("🔧 Generando 4 bases móviles...");
    for (let i = 0; i < 4; i++) {
      const code = await generateUniqueCode("BA");
      inventoryItems.push({
        code,
        type: "base_movil",
        status: "disponible",
        notes: null
      });
    }

    // Generar 1 carro plegable con código CP
    console.log("🛒 Generando 1 carro plegable...");
    const carroCode = await generateUniqueCode("CP");
    inventoryItems.push({
      code: carroCode,
      type: "carro_plegable",
      status: "disponible",
      notes: null
    });

    // Generar 2 correas de amarre con códigos CO
    console.log("🔗 Generando 2 correas de amarre...");
    for (let i = 0; i < 2; i++) {
      const code = await generateUniqueCode("CO");
      inventoryItems.push({
        code,
        type: "correa_amarre",
        status: "disponible",
        notes: null
      });
    }

    // Insertar todos los items en la base de datos
    console.log("💾 Insertando items en la base de datos...");
    await db.insert(inventory).values(inventoryItems);

    console.log(`✅ Inventario creado exitosamente!`);
    console.log(`📦 Total de items: ${inventoryItems.length}`);
    console.log(`   - Cajas: 50 (códigos CAJ)`);
    console.log(`   - Bases móviles: 4 (códigos BA)`);
    console.log(`   - Carro plegable: 1 (código CP)`);
    console.log(`   - Correas de amarre: 2 (códigos CO)`);

  } catch (error) {
    console.error("❌ Error al generar inventario:", error);
    throw error;
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  seedInventory()
    .then(() => {
      console.log("🎉 Seed de inventario completado");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Error en seed de inventario:", error);
      process.exit(1);
    });
}