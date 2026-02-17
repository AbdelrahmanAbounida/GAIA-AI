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

# Build environment - keep memory within Docker limits
ENV DOCKER_BUILD=1
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_TELEMETRY_DISABLED=1

# Vector store profile: "basic" (lancedb+pinecone), "all", or comma-separated list
ARG GAIA_VECTORSTORE_PROVIDERS=basic
ENV GAIA_VECTORSTORE_PROVIDERS=${GAIA_VECTORSTORE_PROVIDERS}

# Prebuild workspace packages so Next.js doesn't transpile them from source
RUN pnpm --filter=@gaia/db build
RUN pnpm --filter=@gaia/ai build
RUN pnpm --filter=@gaia/api build

# Build the app
RUN pnpm --filter=@gaia/ui build

# Verify build artifacts exist
RUN echo "=== Checking build output ===" && \
    ls -la /app/apps/web/.next/ && \
    echo "=== Standalone contents ===" && \
    ls -la /app/apps/web/.next/standalone/ 2>/dev/null || echo "No standalone folder" && \
    echo "=== Static folder ===" && \
    ls -la /app/apps/web/.next/static/ 2>/dev/null || echo "No static folder"

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
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/package.json ./apps/web/package.json

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "apps/web/server.js"]


# # Basic (lancedb + pinecone) — default for Docker
# docker-compose up --build

# # Specific providers
# GAIA_VECTORSTORE_PROVIDERS=lancedb,pinecone,qdrant docker-compose up --build

# # All providers
# GAIA_VECTORSTORE_PROVIDERS=all docker-compose up --build