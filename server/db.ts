import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '@shared/schema';
import ws from 'ws';

// Configure WebSocket for Neon serverless
if (!global.WebSocket) {
  global.WebSocket = ws as any;
}

const connectionString = 'postgresql://neondb_owner:npg_0rzRvgOQwjY1@ep-lingering-breeze-a1m6jm3h-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

// Create Neon serverless pool
const pool = new Pool({ connectionString });

// Create Drizzle instance
export const db = drizzle(pool, { schema });
