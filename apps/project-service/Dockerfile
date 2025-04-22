FROM oven/bun:1.2 AS base
WORKDIR /app

RUN apt update && apt install openssl -y --no-install-recommends \
    && apt clean \
    && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
COPY apps/project-service/package.json ./apps/project-service/

RUN bun install

COPY apps/project-service/prisma ./apps/project-service/prisma
RUN cd apps/project-service && bunx prisma generate && cd ../../

COPY . .

RUN bun --bun run build -F project-service

FROM oven/bun:1.2 AS production
WORKDIR /apps

RUN apt update && apt install curl -y --no-install-recommends \
    && apt clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=base /app/package.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/project-service ./project-service

ENV NODE_ENV=production
ENV BUN_ENV=production
ENV PORT=3003
EXPOSE $PORT

HEALTHCHECK --interval=60s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://127.0.0.1:$PORT/health || exit 1

WORKDIR /apps/project-service
CMD ["bun", "run", "start:prod"]

