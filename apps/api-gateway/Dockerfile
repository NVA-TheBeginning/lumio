FROM oven/bun:1.2 AS base
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/api-gateway/package.json ./apps/api-gateway/

RUN bun install

COPY . .

RUN bun --bun run build -F api-gateway

FROM oven/bun:1.2 AS production
WORKDIR /apps

RUN apt-get update && apt-get install curl -y --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=base /app/package.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/api-gateway ./api-gateway

ENV NODE_ENV=production
ENV BUN_ENV=production
ENV PORT=3000
EXPOSE $PORT

HEALTHCHECK --interval=60s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://127.0.0.1:$PORT/health || exit 1

WORKDIR /apps/api-gateway
CMD ["bun", "run", "start:prod"]
