# syntax=docker/dockerfile:1

# ===========================
# Stage 1: Dependencies
# ===========================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Enable pnpm
RUN corepack enable pnpm

# Copy pnpm workspace configuration
COPY pnpm-workspace.yaml* .npmrc* ./
COPY package.json pnpm-lock.yaml ./

# Copy all workspace package.json files to preserve workspace structure
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/package.json* ./apps/api/
COPY packages/db/package.json* ./packages/db/
COPY packages/ai/package.json* ./packages/ai/

# Install ALL workspace dependencies
RUN pnpm install --frozen-lockfile

# ===========================
# Stage 2: Builder
# ===========================
FROM node:20-alpine AS builder
WORKDIR /app

# Enable pnpm
RUN corepack enable pnpm

# Copy installed dependencies and pnpm files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /app/pnpm-workspace.yaml* ./

# Copy all source code for the entire monorepo
COPY . .

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build from root (pnpm workspace context)
RUN pnpm --filter @gaia/ui build

# ===========================
# Stage 3: Runner
# ===========================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json

# Copy standalone build if using output: 'standalone'
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Create required directory structure with proper permissions
RUN mkdir -p /app/data && \
    mkdir -p /app/apps/web/data/vector_stores/faiss && \
    mkdir -p /app/apps/web/data/vector_stores/lancedb && \
    mkdir -p /app/apps/web/data/vector_stores/chroma && \
    mkdir -p /app/apps/web/data/vector_stores/flexsearch && \
    mkdir -p /app/apps/web/data/vector_stores/minisearch && \
    mkdir -p /app/apps/web/data/vector_stores/orama && \
    chown -R nextjs:nodejs /app/data /app/apps && \
    chmod -R 755 /app/data /app/apps

# Switch to non-root user
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "apps/web/server.js"]