FROM oven/bun:1.2 AS base
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/frontend/package.json ./apps/frontend/

RUN bun install

COPY . .

RUN bun --bun run build -F frontend

FROM oven/bun:1.2 AS production
WORKDIR /app

COPY --from=base /app/apps/frontend/package.json ./apps/frontend/package.json
COPY --from=base /app/apps/frontend/.next/standalone ./
COPY --from=base /app/apps/frontend/.next/static ./apps/frontend/.next/static
COPY --from=base /app/apps/frontend/public ./apps/frontend/public

ENV NODE_ENV=production
ENV BUN_ENV=production
ENV PORT=3000
EXPOSE $PORT

ENV HOSTNAME=0.0.0.0
CMD ["bun", "apps/frontend/server.js"]
