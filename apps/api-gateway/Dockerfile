FROM oven/bun:1.2 AS base
WORKDIR /app

FROM base AS builder

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile --production

COPY . .

RUN bun run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV BUN_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

USER bun
EXPOSE 3000/tcp
ENV HOSTNAME=0.0.0.0
CMD ["bun", "run", "start:prod"]
