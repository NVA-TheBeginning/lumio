FROM oven/bun:1.2 AS base
WORKDIR /app

RUN apt-get update && apt-get install openssl -y --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
COPY apps/report-service/package.json ./apps/report-service/
COPY packages/ ./packages/

RUN bun install

COPY apps/report-service/prisma ./apps/report-service/prisma
RUN cd apps/report-service && bunx prisma generate && cd ../../

COPY . .

RUN bun --bun run build -F report-service

FROM oven/bun:1.2 AS production
WORKDIR /apps

RUN apt-get update && apt-get install curl -y --no-install-recommends \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=base /app/package.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/report-service ./report-service

ENV NODE_ENV=production
ENV BUN_ENV=production
ENV PORT=3005
EXPOSE $PORT

HEALTHCHECK --interval=60s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://127.0.0.1:$PORT/health || exit 1

WORKDIR /apps/report-service
CMD ["bun", "run", "start:prod"]

