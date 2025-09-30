# Backend Dockerfile optimized for Bun
FROM oven/bun:1 as base
WORKDIR /app

# Copy package files
COPY package.json bun.lockb bunfig.toml ./
COPY packages/types/package.json ./packages/types/package.json
COPY packages/config/eslint/package.json ./packages/config/eslint/package.json
COPY packages/config/typescript/package.json ./packages/config/typescript/package.json
COPY apps/backend/package.json ./apps/backend/package.json

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the backend
WORKDIR /app/apps/backend
RUN bun run build

# Production stage
FROM oven/bun:1-slim as production
WORKDIR /app

# Copy built application
COPY --from=base /app/apps/backend/dist ./dist
COPY --from=base /app/apps/backend/package.json ./
COPY --from=base /app/node_modules ./node_modules

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD bun run health-check || exit 1

EXPOSE 8080

CMD ["bun", "run", "start:prod"]