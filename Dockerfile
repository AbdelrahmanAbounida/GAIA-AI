FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY packages ./packages

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build packages/db (compile TypeScript)
RUN cd packages/db && pnpm run build

# Build the Next.js app
RUN pnpm run build

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

# Install tsx globally for running migrations
RUN pnpm add -g tsx

COPY --from=builder /app/apps/web/public ./public

COPY --from=builder /app/apps/web/.next/standalone ./

COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

COPY --from=builder /app/apps/web/.next/standalone/node_modules ./node_modules

# Copy db package source files (needed for tsx to run migrate.ts)
COPY --from=builder /app/packages/db/src ./packages/db/src
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/drizzle ./packages/db/drizzle
COPY --from=builder /app/packages/db/package.json ./packages/db/package.json
COPY --from=builder /app/packages/db/node_modules ./packages/db/node_modules

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Create directory for SQLite database
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

# Copy entrypoint script BEFORE switching user
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh && chown nextjs:nodejs /app/entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/app/data/database.db"

CMD ["/app/entrypoint.sh"]