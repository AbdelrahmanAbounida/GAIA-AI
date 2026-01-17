import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleTurso } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import * as schema from "./schema";
import dotenv from "dotenv";

export type DB = BaseSQLiteDatabase<"async", any, typeof schema>;

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

const monorepoRoot = findMonorepoRoot(process.cwd());
const isVercel = !!(process.env.VERCEL || process.env.VERCEL_ENV);

if (!isVercel) {
  dotenv.config({ path: path.resolve(monorepoRoot, ".env") });
}

const hasTursoConfig = !!(
  process.env.TURSO_CONNECTION_URL && process.env.TURSO_AUTH_TOKEN
);
const useTurso = isVercel || hasTursoConfig;

// Initialize db variable with the unified type
let db: DB;

if (useTurso) {
  const client = createClient({
    url: process.env.TURSO_CONNECTION_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  // Cast to DB to resolve type conflicts
  db = drizzleTurso(client, { schema }) as unknown as DB;
} else {
  const DATABASE_URL = process.env.DATABASE_URL || "file:./database.db";
  const dbPath = path.resolve(monorepoRoot, DATABASE_URL.replace(/^file:/, ""));

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const sqlite = new Database(dbPath);
  // Cast to DB to resolve type conflicts
  db = drizzleSqlite(sqlite, { schema }) as unknown as DB;
}

export { db };
