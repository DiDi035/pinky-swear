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

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 indexer
USER indexer

EXPOSE 8080

CMD ["npx", "tsx", "src/index.ts"]
