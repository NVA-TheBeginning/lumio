FROM oven/bun:1.2 AS base
WORKDIR /app

RUN apt-get update && apt-get install openssl -y --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
COPY apps/files-service/package.json ./apps/files-service/
COPY packages/ ./packages/

RUN bun install

COPY apps/files-service/prisma ./apps/files-service/prisma
RUN cd apps/files-service && bunx prisma generate && cd ../../

COPY . .

RUN bun --bun run build -F files-service

FROM oven/bun:1.2 AS production
WORKDIR /apps

RUN apt-get update && apt-get install curl -y --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=base /app/package.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/files-service ./files-service

ENV NODE_ENV=production
ENV BUN_ENV=production
ENV PORT=3004
EXPOSE $PORT

HEALTHCHECK --interval=60s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://127.0.0.1:$PORT/health || exit 1

WORKDIR /apps/files-service
CMD ["bun", "run", "start:prod"]

