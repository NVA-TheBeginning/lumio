FROM oven/bun:1.2 AS base
WORKDIR /app

ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID

COPY package.json bun.lock ./
COPY apps/frontend/package.json ./apps/frontend/

RUN bun install

COPY . .

RUN bun --bun run build -F frontend

FROM oven/bun:1.2 AS production
WORKDIR /app

RUN apt update && apt install curl -y --no-install-recommends \
    && apt clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=base /app/apps/frontend/package.json ./apps/frontend/package.json
COPY --from=base /app/apps/frontend/.next/standalone ./
COPY --from=base /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=base /app/apps/frontend/public ./apps/frontend/public

ENV NODE_ENV=production
ENV BUN_ENV=production
ENV PORT=3000
EXPOSE $PORT

HEALTHCHECK --interval=60s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://127.0.0.1:$PORT/api/health || exit 1

ENV HOSTNAME=0.0.0.0
CMD ["bun", "apps/frontend/server.js"]
