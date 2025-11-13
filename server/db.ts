import dotenv from "dotenv";
dotenv.config();

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '@shared/schema';
import ws from 'ws';

// Configure WebSocket for Neon serverless
if (!global.WebSocket) {
  global.WebSocket = ws as any;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

// Create Neon serverless pool
const pool = new Pool({ connectionString });

// Create Drizzle instance
export const db = drizzle(pool, { schema });
