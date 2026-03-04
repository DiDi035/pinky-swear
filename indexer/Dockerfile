FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY indexer/package.json indexer/package-lock.json* ./
RUN npm ci

FROM base AS runner
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY indexer/ ./

WORKDIR /
COPY contracts/deployments/ ./contracts/deployments/

WORKDIR /app
RUN npx prisma generate

COPY indexer/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 indexer
USER indexer

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health/check || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
