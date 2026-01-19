# Stage 1: Build
FROM node:20-slim AS builder
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Install build tools
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build environment - Increased memory for webpack
ENV DOCKER_BUILD=1
ENV NODE_OPTIONS="--max-old-space-size=12288"
ENV NEXT_TELEMETRY_DISABLED=1

# Add swap space (6GB) to handle memory spikes
RUN dd if=/dev/zero of=/swapfile bs=1M count=6144 && \
    chmod 600 /swapfile && \
    mkswap /swapfile && \
    swapon /swapfile || true

# Build with debug output to see the actual error
RUN pnpm --filter=@gaia/ui build 2>&1 | tee /tmp/build.log || \
    (cat /tmp/build.log && exit 1)

# Clean up swap
RUN swapoff /swapfile 2>/dev/null || true && rm -f /swapfile

# Stage 2: Runner
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DOCKER_BUILD=1

RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

RUN mkdir -p /app/data \
    /app/apps/web/data/vector_stores/{faiss,lancedb,chroma,flexsearch,minisearch,orama} && \
    chown -R nextjs:nodejs /app/data /app/apps && \
    chmod -R 755 /app/data /app/apps

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/web/server.js"]