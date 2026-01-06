#!/bin/sh
set -e

echo "🚀 Starting development environment..."

# Verify workspace structure
echo "📦 Checking workspace configuration..."
if [ ! -f "/app/pnpm-workspace.yaml" ]; then
  echo "❌ ERROR: pnpm-workspace.yaml not found!"
  exit 1
fi

if [ ! -f "/app/apps/web/package.json" ]; then
  echo "❌ ERROR: apps/web/package.json not found!"
  exit 1
fi

echo "✅ Workspace configuration found"

# List projects to debug
echo "📋 Available projects:"
cd /app && pnpm list --depth 0 --json 2>/dev/null || echo "Could not list projects"

# Run migrations
echo "🔄 Running database migrations..."
if [ -f "/app/packages/db/dist/migrate.js" ]; then
  tsx /app/packages/db/dist/migrate.js
  echo "✅ Migrations completed"
else
  echo "⚠️  Migration file not found, skipping..."
fi

# Start the dev server with correct package name
echo "🌐 Starting Next.js development server..."
cd /app && exec pnpm --filter=@gaia/ui dev