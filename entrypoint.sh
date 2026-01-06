#!/bin/sh
set -e

echo "🚀 Starting application..."

# Check if database exists
if [ ! -f /app/data/database.db ]; then
    echo "📦 Database not found, running migrations..."
    
    # Run migrations using tsx (installed globally)
    cd /app/packages/db
    tsx -r dotenv/config drizzle/migrate.ts
    
    echo "✅ Migrations complete"
else
    echo "✅ Database already exists"
fi

echo "🌐 Starting Next.js server..."
cd /app

# Start the Next.js standalone server
node apps/web/server.js