# Dockerfile
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN pnpm run build

# Debug: List what was actually created
RUN echo "=== Checking build output ===" && \
    find /app -name ".next" -type d && \
    ls -la /app/.next 2>/dev/null || echo "No .next in /app root" && \
    ls -la /app/apps/*/.next 2>/dev/null || echo "No .next in apps"

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV="production"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./public

# Copy standalone output
COPY --from=builder /app/apps/web/.next/standalone ./

# Copy static files
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

# Copy node_modules if needed
COPY --from=builder /app/apps/web/.next/standalone/node_modules ./node_modules

# Create directory for SQLite database
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:./data/database.db"

CMD ["node", "apps/web/server.js"]