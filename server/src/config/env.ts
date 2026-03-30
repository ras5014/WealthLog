import { env as loadEnv } from "custom-env";
import { z } from "zod";

// Determine application stage
process.env.APP_STAGE = process.env.APP_STAGE || "dev";

const isProduction = process.env.APP_STAGE === "production";
const isDevelopment = process.env.APP_STAGE === "dev";
const isTest = process.env.APP_STAGE === "test";

// Load .env files based on environment
if (isDevelopment) {
  loadEnv("local", false); // Loads .env.local without overriding existing variables
  loadEnv(); // Loads .env
} else if (isTest) {
  loadEnv("test"); // Loads .env.test
}

// Production environment variables should be set in the hosting environment and not in .env files

// Define validation schema with zod
const envSchema = z.object({
  // Node environments
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Custom application stage to load environment-specific variables
  APP_STAGE: z.enum(["dev", "production", "test"]).default("dev"),

  // Server configuration
  PORT: z.coerce.number().positive().default(3000),
  HOST: z.string().default("localhost"),

  // Database configuration
  DATABASE_URL: z.string().startsWith("postgresql://"),

  // JWT & Authentication
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters long"),

  JWT_EXPIRES_IN: z.string().default("7d"),

  // Security
  BCRYPT_SALT_ROUNDS: z.coerce.number().min(10).max(20).default(12),
});

// Type inference from schema
export type Env = z.infer<typeof envSchema>;

// Parse and validate environment variables
let env: Env;

try {
  env = envSchema.parse(process.env);
  console.table(env); // Log the validated environment variables for debugging
} catch (error) {
  if (error instanceof z.ZodError) {
    const errorMessages = error.issues.map(
      (err) => `${err.path.join(".")}: ${err.message}`,
    );
    console.error("Environment validation errors:", errorMessages);
    process.exit(1); // Server exits with failure code if validation fails
  }

  throw error; // Re-throw unexpected errors
}

// Helper functions for environment checks
export const isProd = () => env.NODE_ENV === "production";
export const isDev = () => env.NODE_ENV === "development";
export const isTestEnv = () => env.NODE_ENV === "test";

// Export the validated environment
export { env };
export default env;
