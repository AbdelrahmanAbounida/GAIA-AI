import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV;
if (!isVercel) {
  dotenv.config({ path: "../../.env" });
}

const hasTursoConfig = !!(
  process.env.TURSO_CONNECTION_URL && process.env.TURSO_AUTH_TOKEN
);

const config = hasTursoConfig
  ? {
      // Turso configuration
      verbose: true,
      schema: "./src/schema/index.ts",
      dialect: "sqlite" as const,
      driver: "turso" as const,
      dbCredentials: {
        url: process.env.TURSO_CONNECTION_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN!,
      },
      out: "./drizzle",
    }
  : {
      // Local SQLite configuration
      verbose: true,
      schema: "./src/schema/index.ts",
      dialect: "sqlite" as const,
      dbCredentials: {
        url: process.env.DATABASE_URL || "file:../../database.db",
      },
      out: "./drizzle",
    };

export default defineConfig(config);
