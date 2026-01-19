#!/bin/sh
set -e

echo "🚀 Starting application entrypoint..."

# Ensure data directories exist
mkdir -p /app/data
mkdir -p /app/apps/web/data

# Run database migrations if needed
if [ -f "/app/packages/db/drizzle/migrate.ts" ]; then
    echo "📦 Running database migrations..."
    cd /app/packages/db
    tsx drizzle/migrate.ts
    cd /app
fi

# Optional: Run any initialization scripts
if [ -n "$INIT_SCRIPT" ] && [ -f "$INIT_SCRIPT" ]; then
    echo "🔧 Running initialization script..."
    sh "$INIT_SCRIPT"
fi

echo "✅ Entrypoint setup complete"
echo "🌐 Starting Next.js server on port ${PORT:-3000}..."

# Execute the main command (passed as arguments or default CMD)
exec "$@"
