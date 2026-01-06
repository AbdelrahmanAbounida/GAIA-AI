import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find monorepo root
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

const monorepoRoot = findMonorepoRoot(__dirname);

async function runMigrate() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not defined in .env");
  }

  console.log("🚀 Running migrations...");
  console.log("📁 Monorepo root:", monorepoRoot);
  console.log("📁 __dirname:", __dirname);

  try {
    // Resolve DB path from monorepo root
    const dbPath = path.resolve(
      monorepoRoot,
      databaseUrl.replace(/^file:/, "")
    );

    console.log("📂 Database path:", dbPath);

    // Resolve migrations folder relative to this file
    const migrationsFolder = path.resolve(__dirname, "..", "drizzle");
    console.log("📂 Migrations folder:", migrationsFolder);

    // Check if migrations folder exists
    if (!fs.existsSync(migrationsFolder)) {
      throw new Error(`Migrations folder not found: ${migrationsFolder}`);
    }

    // Check if meta folder exists
    const metaFolder = path.join(migrationsFolder, "meta");
    if (!fs.existsSync(metaFolder)) {
      throw new Error(`Meta folder not found: ${metaFolder}`);
    }

    // Check if _journal.json exists
    const journalPath = path.join(metaFolder, "_journal.json");
    if (!fs.existsSync(journalPath)) {
      throw new Error(`Journal file not found: ${journalPath}`);
    }

    console.log("✅ Found migration files");

    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const sqlite = new Database(dbPath, { fileMustExist: false });
    const migrationDb = drizzle(sqlite);

    const start = Date.now();

    // Run migrations
    migrate(migrationDb as any, {
      migrationsFolder,
    });

    const duration = Date.now() - start;
    sqlite.close();

    console.log(`✅ Migrations completed in ${duration}ms`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed");
    console.error(err);
    process.exit(1);
  }
}

runMigrate();
