# Build Stage
FROM rust:1.75-slim-bookworm as builder

WORKDIR /usr/src/app
COPY . .

# Install build dependencies
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

# Build release binary
RUN cargo build --release

# Runtime Stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y ca-certificates libssl3 && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 -U solana-monitor

WORKDIR /app

# Copy binary from builder
COPY --from=builder /usr/src/app/target/release/solana-price-monitor /app/solana-price-monitor
COPY --from=builder /usr/src/app/config.toml /app/config.toml

# Set ownership
RUN chown -R solana-monitor:solana-monitor /app

USER solana-monitor

# Expose metrics port
EXPOSE 9090

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:9090/health || exit 1

ENTRYPOINT ["./solana-price-monitor"]
