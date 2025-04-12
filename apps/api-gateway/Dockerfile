FROM oven/bun:1.2 AS base
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/api-gateway/package.json ./apps/api-gateway/

RUN bun install

COPY . .

RUN bun --bun run build -F api-gateway

FROM oven/bun:1.2 AS production
WORKDIR /app

COPY --from=base /app/package.json /app/bun.lock  ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/api-gateway/dist ./apps/api-gateway/dist

ENV NODE_ENV=production
ENV BUN_ENV=production
ENV PORT=3000
EXPOSE $PORT

WORKDIR /app/apps/api-gateway
CMD ["bun", "run" , "start:prod"]
