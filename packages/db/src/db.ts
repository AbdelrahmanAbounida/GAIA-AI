import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import dotenv from "dotenv";

function findMonorepoRoot(startDir: string): string {
  let currentDir = startDir;

  while (currentDir !== path.parse(currentDir).root) {
    // Check for monorepo indicators
    if (
      fs.existsSync(path.join(currentDir, "pnpm-workspace.yaml")) ||
      fs.existsSync(path.join(currentDir, "pnpm-lock.yaml")) ||
      fs.existsSync(path.join(currentDir, ".git"))
    ) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  // Fallback to current directory
  return startDir;
}

// Get monorepo root
const monorepoRoot = findMonorepoRoot(process.cwd());
console.log("Monorepo root:", monorepoRoot);

dotenv.config({
  path: path.resolve(monorepoRoot, ".env"),
});

// Get database URL from env or fallback
const DATABASE_URL = process.env.DATABASE_URL || "file:./database.db";
console.log("DATABASE_URL:", DATABASE_URL);

// Resolve absolute path to database file (always relative to monorepo root)
const dbPath = path.resolve(monorepoRoot, DATABASE_URL.replace(/^file:/, ""));
console.log("Resolved database path:", dbPath);

// Ensure the directory exists
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Open the SQLite database
let sqlite: Database.Database;
try {
  sqlite = new Database(dbPath, { fileMustExist: false });
  console.log("✅ Database opened successfully");
} catch (err) {
  console.error("❌ Failed to open database:", err);
  process.exit(1);
}

// Initialize Drizzle ORM
export const db = drizzle(sqlite, { schema });
export type DB = typeof db;
