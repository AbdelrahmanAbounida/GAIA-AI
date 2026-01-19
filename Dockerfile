FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Enable pnpm
RUN corepack enable pnpm

# Copy workspace configuration files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/ai/package.json ./packages/ai/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY apps/api/package.json ./apps/api/package.json

# Install dependencies - use shamefully-hoist to reduce duplication
RUN pnpm install --frozen-lockfile --shamefully-hoist

# Rebuild the source code only when needed
FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Enable pnpm
RUN corepack enable pnpm

# Copy installed dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/ai/node_modules ./packages/ai/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY turbo.json ./

# Copy all source code
COPY apps ./apps
COPY packages ./packages

ENV NEXT_TELEMETRY_DISABLED=1
ENV DOCKER_BUILD=1
# Allocate 10GB to Node.js (adjust if needed, but leave 5GB for system)
ENV NODE_OPTIONS="--max-old-space-size=10240"

# Build packages first with limited concurrency
RUN pnpm run build --filter=@gaia/db --filter=@gaia/ai --concurrency=1

# Build Next.js app with aggressive memory limits
RUN cd apps/web && NODE_OPTIONS="--max-old-space-size=10240" pnpm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN mkdir -p /app/data && \
    mkdir -p /app/apps/web/data/vector_stores/faiss && \
    mkdir -p /app/apps/web/data/vector_stores/lancedb && \
    mkdir -p /app/apps/web/data/vector_stores/chroma && \
    mkdir -p /app/apps/web/data/vector_stores/flexsearch && \
    mkdir -p /app/apps/web/data/vector_stores/minisearch && \
    mkdir -p /app/apps/web/data/vector_stores/orama && \
    chown -R nextjs:nodejs /app/data /app/apps && \
    chmod -R 755 /app/data /app/apps

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/web/server.js"]