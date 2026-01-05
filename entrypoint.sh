#!/bin/sh
set -e

echo "🔍 Starting database setup..."
echo "DATABASE_URL: $DATABASE_URL"

# Resolve the actual database path
DB_PATH=$(echo "$DATABASE_URL" | sed 's|file:||')
echo "Resolved database path: $DB_PATH"

# Ensure the directory exists
mkdir -p "$(dirname "$DB_PATH")"

echo "📂 Database directory contents:"
ls -la "$(dirname "$DB_PATH")" || true

echo "📦 Checking migration files..."
if [ -d "/app/packages/db/drizzle" ]; then
    echo "✅ Found migrations:"
    ls -la /app/packages/db/drizzle/*.sql 2>/dev/null || echo "No .sql files yet"
else
    echo "❌ No drizzle folder found!"
    exit 1
fi

echo "🔧 Running migrations from packages/db..."
cd /app/packages/db

# Run the migration
if pnpm run migrate:docker; then
    echo "✅ Migrations completed successfully!"
else
    echo "❌ Migration failed!"
    exit 1
fi

# Verify database was created
if [ -f "$DB_PATH" ]; then
    echo "✅ Database file created at: $DB_PATH"
    ls -lh "$DB_PATH"
else
    echo "❌ Database file not found after migration!"
    exit 1
fi

echo "🚀 Starting Next.js application..."
cd /app
exec node apps/web/server.js