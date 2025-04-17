FROM oven/bun:1.2 AS base
WORKDIR /app

RUN apt update && apt install openssl -y --no-install-recommends \
    && apt clean \
    && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
COPY apps/files-service/package.json ./apps/files-service/

RUN bun install

COPY apps/files-service/prisma ./apps/files-service/prisma
RUN cd apps/files-service && bunx prisma generate && cd ../../

COPY . .

RUN bun --bun run build -F files-service

FROM oven/bun:1.2 AS production
WORKDIR /app

RUN apt update && apt install curl -y --no-install-recommends \
    && apt clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=base /app/package.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/files-service ./apps/files-service

ENV NODE_ENV=production
ENV BUN_ENV=production
ENV PORT=3004
EXPOSE $PORT

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://127.0.0.1:$PORT/health || exit 1

CMD ["bun", "apps/files-service/dist/main.js"]
