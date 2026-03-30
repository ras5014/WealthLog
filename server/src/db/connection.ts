import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.ts";
import { env, isProd } from "../config/env.ts";
import { remember } from "@epic-web/remember";

/**
 * Connection pooling is a performance optimization technique that maintains a cache of database connections. Instead of establishing a new connection for every request, an application can borrow a pre-existing connection from this "pool," use it, and then return it once finished, making it available for other requests.
 */
const createPool = () => {
  return new Pool({
    connectionString: env.DATABASE_URL,
  });
};

let client;

if (isProd()) {
  client = createPool();
} else {
  // In development, we want to reuse the same connection pool across hot reloads to avoid exhausting the database with too many connections.
  // Or else for each hot reload a new connection pool will be created, and the old one will not be closed, which can lead to too many open connections and eventually exhaust the database.
  client = remember("dbPool", () => createPool());
}

export const db = drizzle(client, { schema });
export default db;
