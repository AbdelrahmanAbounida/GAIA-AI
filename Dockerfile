# Stage 1: Base & Pruning
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build-stage
WORKDIR /app

# Set build-time memory limits and optimizations
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_TELEMETRY_DISABLED=1

# Copy all files
COPY . .

# Install dependencies with frozen lockfile
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Deploy only the 'web' app to a separate folder
RUN pnpm --filter=web deploy /app/pruned

# Build the application inside the pruned folder
WORKDIR /app/pruned

# Additional build optimizations
ENV NEXT_BUILD_MODE=standalone
ENV NEXT_PRIVATE_STANDALONE=true

# Clean any existing build artifacts and run fresh build
RUN set -ex && \
    rm -rf .next && \
    rm -rf node_modules/.cache && \
    pnpm build && \
    echo "Build completed successfully" && \
    ls -la && \
    ls -la .next || (echo "Build failed - .next directory not created" && exit 1)

# Stage 2: Runner
FROM node:20-slim AS runner
WORKDIR /app

# Install only production dependencies if needed
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 nextjs

# Copy the necessary files from build stage
# First copy package files
COPY --from=build-stage --chown=nextjs:nodejs /app/pruned/package.json ./

# Copy node_modules
COPY --from=build-stage --chown=nextjs:nodejs /app/pruned/node_modules ./node_modules/

# Copy the built Next.js application
COPY --from=build-stage --chown=nextjs:nodejs /app/pruned/.next ./.next/

# Copy public folder if it exists
COPY --from=build-stage --chown=nextjs:nodejs /app/pruned/public ./public/

# Copy next.config file if it exists
COPY --from=build-stage --chown=nextjs:nodejs /app/pruned/next.config.* ./

# Create required data directories
RUN mkdir -p /app/data && \
    mkdir -p /app/data/vector_stores/{faiss,lancedb,chroma,flexsearch,minisearch,orama} && \
    chown -R nextjs:nodejs /app && \
    chmod -R 755 /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["pnpm", "start"]