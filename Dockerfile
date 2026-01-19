# Stage 1: Dependencies and Native Build Tools
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Install system dependencies for native modules (faiss, sqlite, etc.)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

FROM base AS builder
WORKDIR /app
COPY . .

# 1. Install all dependencies
RUN pnpm install --frozen-lockfile

# 2. Build the app with memory protections
# DOCKER_BUILD triggers your next.config.ts optimizations
ENV DOCKER_BUILD=1
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Build specifically for the web app
RUN pnpm --filter=@gaia/ui build

# Stage 2: Runner (Clean & Slim)
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV DOCKER_BUILD=1

# Create non-root user
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

# Create your requested data directories
RUN mkdir -p /app/data && \
    mkdir -p /app/apps/web/data/vector_stores/faiss && \
    mkdir -p /app/apps/web/data/vector_stores/lancedb && \
    mkdir -p /app/apps/web/data/vector_stores/chroma && \
    mkdir -p /app/apps/web/data/vector_stores/flexsearch && \
    mkdir -p /app/apps/web/data/vector_stores/minisearch && \
    mkdir -p /app/apps/web/data/vector_stores/orama && \
    chown -R nextjs:nodejs /app/data /app/apps && \
    chmod -R 755 /app/data /app/apps

# Copy the standalone build output
# Next.js standalone output moves everything needed into this folder
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Note: Standalone output has a specific entry point
CMD ["node", "apps/web/server.js"]