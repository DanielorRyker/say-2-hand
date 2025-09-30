# Frontend Dockerfile optimized for Bun
FROM oven/bun:1 as base
WORKDIR /app

# Copy package files
COPY package.json bun.lockb bunfig.toml ./
COPY packages/types/package.json ./packages/types/package.json
COPY packages/config/eslint/package.json ./packages/config/eslint/package.json
COPY packages/config/typescript/package.json ./packages/config/typescript/package.json
COPY apps/web/package.json ./apps/web/package.json

# Install dependencies
RUN bun install --frozen-lockfile

# Copy packages
COPY packages/ ./packages/

# Copy web app source
COPY apps/web/ ./apps/web/

# Build the frontend
WORKDIR /app/apps/web
RUN bun run build

# Production stage
FROM node:20-alpine as production
WORKDIR /app

# Copy built application
COPY --from=base /app/apps/web/.next/standalone ./
COPY --from=base /app/apps/web/.next/static ./.next/static
COPY --from=base /app/apps/web/public ./public

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]