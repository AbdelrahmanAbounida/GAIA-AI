import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleTurso } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import dotenv from "dotenv";

function findMonorepoRoot(startDir: string): string {
  let currentDir = startDir;

  while (currentDir !== path.parse(currentDir).root) {
    if (
      fs.existsSync(path.join(currentDir, "pnpm-workspace.yaml")) ||
      fs.existsSync(path.join(currentDir, "pnpm-lock.yaml")) ||
      fs.existsSync(path.join(currentDir, ".git"))
    ) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  return startDir;
}

// Get monorepo root
const monorepoRoot = findMonorepoRoot(process.cwd());
console.log("Monorepo root:", monorepoRoot);

// Check if running on Vercel or if Turso credentials are provided
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL_ENV;

if (!isVercel) {
  dotenv.config({
    path: path.resolve(monorepoRoot, ".env"),
  });
}
const hasTursoConfig = !!(
  process.env.TURSO_CONNECTION_URL && process.env.TURSO_AUTH_TOKEN
);

const useTurso = isVercel || hasTursoConfig;

console.log("Environment:", {
  isVercel,
  hasTursoConfig,
  useTurso,
});

let db: ReturnType<typeof drizzleSqlite> | ReturnType<typeof drizzleTurso>;

if (useTurso) {
  // Use Turso for Vercel or when Turso credentials are available
  console.log("🌐 Using Turso database");

  if (!process.env.TURSO_CONNECTION_URL) {
    throw new Error(
      "TURSO_CONNECTION_URL is required for Turso/Vercel deployment"
    );
  }

  const client = createClient({
    url: process.env.TURSO_CONNECTION_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  db = drizzleTurso(client, { schema });
  console.log("✅ Turso database connected");
} else {
  // Use local SQLite for development
  console.log("💾 Using local SQLite database");
  const DATABASE_URL = process.env.DATABASE_URL || "file:./database.db";

  // Resolve absolute path to database file
  const dbPath = path.resolve(monorepoRoot, DATABASE_URL.replace(/^file:/, ""));

  // Ensure the directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Open the SQLite database
  let sqlite: Database.Database;
  try {
    sqlite = new Database(dbPath, { fileMustExist: false });
    console.log("✅ Local SQLite database opened successfully");
  } catch (err) {
    console.error("❌ Failed to open database:", err);
    process.exit(1);
  }

  db = drizzleSqlite(sqlite, { schema });
}

export { db };
export type DB = typeof db;
