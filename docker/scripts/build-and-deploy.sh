#!/bin/bash
set -e

echo "🚀 Starting optimized Docker build..."

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

echo "✅ Docker is running"

# Use BuildKit with inline cache
echo "🔨 Building with BuildKit and cache..."
DOCKER_BUILDKIT=1 COMPOSE_DOCKER_CLI_BUILD=1 \
  docker compose build \
  --build-arg BUILDKIT_INLINE_CACHE=1

echo -e "${GREEN}✅ Build complete!${NC}"

#  start services
read -p "Start services now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker compose up -d
    echo -e "${GREEN}✅ Services started on http://localhost:5679${NC}"
fi