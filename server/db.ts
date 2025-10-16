import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

// Verifica que la variable esté configurada
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Check your Render environment variables.");
}

// Crea el pool con SSL habilitado
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // necesario en Render
  },
});

// Conecta Drizzle con el pool
export const db = drizzle(pool, { schema });

// Log de verificación
pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL on Render'))
  .catch((err) => console.error('❌ Database connection error:', err));
