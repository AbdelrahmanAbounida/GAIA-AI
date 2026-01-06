FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048"
ENV NEXT_PUBLIC_DOCKER_ENV="true"
ENV DOCKER_ENV="true"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install tsx globally for migrations
RUN pnpm add -g tsx dotenv

# Copy pre-built Next.js standalone output (built locally)
COPY apps/web/.next/standalone ./
COPY apps/web/.next/static ./apps/web/.next/static
COPY apps/web/public ./apps/web/public

# Copy database package for migrations (built locally)
COPY packages/db/src ./packages/db/src
COPY packages/db/dist ./packages/db/dist
COPY packages/db/drizzle ./packages/db/drizzle
COPY packages/db/package.json ./packages/db/package.json

# Copy workspace files
COPY package.json ./package.json
COPY pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY pnpm-lock.yaml ./pnpm-lock.yaml

# Install only production dependencies needed for migrations
RUN pnpm install --prod --frozen-lockfile

RUN mkdir -p /app/data && \
    mkdir -p /app/apps/web/data && \
    chown -R nextjs:nodejs /app && \
    chmod -R 755 /app/data /app/apps

# Copy and setup entrypoint
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh && chown nextjs:nodejs /app/entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["/app/entrypoint.sh"]