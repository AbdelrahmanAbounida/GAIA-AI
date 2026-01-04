import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

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

const monorepoRoot = findMonorepoRoot(process.cwd());

// Load .env from monorepo root
dotenv.config({
  path: path.resolve(monorepoRoot, ".env"),
});

async function runMigrate() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not defined in .env");
  }

  console.log("🚀 Running migrations...");
  console.log("📁 Monorepo root:", monorepoRoot);

  try {
    // Resolve DB path from monorepo root
    const dbPath = path.resolve(
      monorepoRoot,
      databaseUrl.replace(/^file:/, "")
    );

    console.log("📂 Database path:", dbPath);

    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const sqlite = new Database(dbPath, { fileMustExist: false });
    const migrationDb = drizzle(sqlite);

    const start = Date.now();

    // Run migrations from the "drizzle" folder
    migrate(migrationDb as any, {
      migrationsFolder: path.resolve(process.cwd(), "drizzle"),
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
