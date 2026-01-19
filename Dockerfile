# Stage 1: Base & Pruning
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build-stage
WORKDIR /app
COPY . .

# 1. Install dependencies (frozen-lockfile is faster and safer)
RUN pnpm install --frozen-lockfile

# 2. Deploy only the 'web' app to a separate folder
# This extracts apps/web and its local dependencies (db, ai)
RUN pnpm --filter=web deploy /app/pruned

# 3. Build the application inside the pruned folder
WORKDIR /app/pruned
# Use NODE_OPTIONS to prevent OOM errors during the build
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN pnpm build

# Stage 2: Runner
FROM node:20-slim AS runner
WORKDIR /app

# Create a non-root user for security
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

# Copy the pruned and built application
COPY --from=build-stage --chown=nextjs:nodejs /app/pruned ./

# Create your required data directories
RUN mkdir -p /app/data && \
    mkdir -p /app/apps/web/data/vector_stores/faiss && \
    mkdir -p /app/apps/web/data/vector_stores/lancedb && \
    mkdir -p /app/apps/web/data/vector_stores/chroma && \
    mkdir -p /app/apps/web/data/vector_stores/flexsearch && \
    mkdir -p /app/apps/web/data/vector_stores/minisearch && \
    mkdir -p /app/apps/web/data/vector_stores/orama && \
    chown -R nextjs:nodejs /app/data /app/apps && \
    chmod -R 755 /app/data /app/apps

USER nextjs

EXPOSE 3000

CMD ["pnpm", "start"]