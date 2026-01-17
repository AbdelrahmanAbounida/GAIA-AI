import { config } from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { createClient } from "@libsql/client";

config({ path: "../../.env" });

const runMigrate = async () => {
  if (!process.env.TURSO_CONNECTION_URL) {
    throw new Error("TURSO_CONNECTION_URL is not defined");
  }

  try {
    // Create Turso client
    const client = createClient({
      url: process.env.TURSO_CONNECTION_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    // Create drizzle instance
    const db = drizzle(client);

    const start = Date.now();
    await migrate(db, { migrationsFolder: "drizzle" });
    const end = Date.now();

    process.exit(0);
  } catch (err: any) {
    console.error("❌ Migration failed:");
    console.error(err);

    // Handle specific Turso/SQLite errors
    if (
      err?.message?.includes("table") &&
      err?.message?.includes("already exists")
    ) {
      process.exit(1);
    }

    if (err?.message?.includes("UNIQUE constraint failed")) {
      console.log("⚠️  Migration already applied (unique constraint).");
      process.exit(0);
    }

    process.exit(1);
  }
};

runMigrate().catch((err) => {
  console.error("❌ Unexpected error during migration:");
  console.error(err);
  process.exit(1);
});
// pnpm tsx src/migrate-turso.ts
