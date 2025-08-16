import { users } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Basic user operations for future use
  getUserById(id: string): Promise<any>;
  createUser(userData: any): Promise<any>;
}

class PostgresStorage implements IStorage {
  async getUserById(id: string) {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0] || null;
  }

  async createUser(userData: any) {
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  }
}

export const storage = new PostgresStorage();