FROM rust:1.88-slim AS base
WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends pkg-config libssl-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY . .

RUN cargo build --release --bin plagiarism-service

FROM rust:1.88-slim AS production
WORKDIR /app

COPY --from=base /app/Cargo.toml ./
COPY --from=base /app/Cargo.lock ./
COPY --from=base /app/target/release/plagiarism-service ./plagiarism-service
COPY --from=base /app/target/release/deps ./deps

ENV PORT=3008
EXPOSE $PORT

CMD ["./plagiarism-service"]
