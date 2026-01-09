# Testing Guide: Solana Price Monitor

This guide provides detailed instructions on how to test the Solana Price Monitor at various levels: unit testing, local integration testing, and containerized testing.

---

## 1. Prerequisites

Before running tests, ensure you have the following installed:

- **Rust & Cargo**: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **Docker** (for container tests): [Install Docker](https://docs.docker.com/get-docker/)
- **Helius API Key**: Required for integration tests. Get one at [dev.helius.xyz](https://dev.helius.xyz/).

---

## 2. Unit Testing

Unit tests verify the core logic of the application, including AMM math, decoders, and spatial arbitrage calculations. These tests do **not** require an internet connection or API key.

### Running Unit Tests

Execute the standard Cargo test command:

```bash
cargo test
```

### Expected Output

You should see output indicating that all tests passed:

```text
running 5 tests
test calculator::amm::tests::test_calculate_amm_price ... ok
test decoder::raydium::tests::test_decode ... ok
test detector::spatial::tests::test_profit_calculation ... ok
...
test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

### What is Tested?

1.  **AMM Calculator**: Verifies that `calculate_amm_price` correctly computes price from reserves and decimals.
2.  **Decoders**: Ensures that raw byte data (simulated) is correctly parsed into `RaydiumAmmInfo` or `WhirlpoolState` structs.
3.  **Spatial Detector**: Verifies that `detect_spatial_arbitrage` correctly identifies profitable spreads and accounts for fees.

---

## 3. Local Integration Testing

Integration testing involves running the actual application connected to the Solana network (via Helius RPC). This verifies the full pipeline: WebSocket connection -> Decoding -> Caching -> Detection.

### Setup

1.  Create a `.env` file in the project root:
    ```bash
    HELIUS_API_KEY=your_actual_api_key_here
    RUST_LOG=info
    METRICS_ENABLED=true
    ```

### Running the Application

Run the application in debug mode to see detailed logs:

```bash
cargo run
```

### Verification Steps

1.  **Connection**: Look for "WebSocket connected successfully".
2.  **Subscription**: Look for "Subscribed to X accounts".
3.  **Price Updates**: You should see logs indicating price updates, e.g.:
    ```text
    INFO solana_price_monitor::websocket: Price update: SOL/USDC (Raydium) = 145.23
    ```
4.  **Metrics**: Open a separate terminal and query the metrics endpoint:
    ```bash
    curl http://localhost:9090/metrics
    ```
    _Success_: You should receive a list of Prometheus metrics (e.g., `price_updates_total`).

---

## 4. Docker Container Testing

Testing with Docker ensures that the application runs correctly in a containerized environment, mimicking production.

### Build the Image

```bash
docker build -t solana-price-monitor .
```

_Note: This may take a few minutes as it compiles the Rust project in release mode._

### Run with Docker Compose

Use the provided `docker-compose.yml` for easy setup:

1.  Ensure your `.env` file is present (Docker Compose reads it).
2.  Run the container:
    ```bash
    docker-compose up
    ```

### Verification

1.  **Logs**: Check the container logs for the same success messages as the local run.
    ```bash
    docker-compose logs -f
    ```
2.  **Health Check**: The Dockerfile includes a HEALTHCHECK instruction. Verify the container status:
    ```bash
    docker ps
    ```
    _Status should be `Up (healthy)`._

---

## 5. Performance Testing (Optional)

To test the performance of the release build (recommended for production):

1.  **Build Release Binary**:
    ```bash
    cargo build --release
    ```
2.  **Run Release Binary**:
    ```bash
    ./target/release/solana-price-monitor
    ```

**Note**: The release build is significantly faster and handles higher throughput than the debug build.

---

## 6. Troubleshooting Common Issues

| Issue | Cause | Solution |
| paper | ----- | -------- |
| **Connection Refused** | Invalid API Key or Network | Check `HELIUS_API_KEY` and internet connection. |
| **Serialization Error** | On-chain data layout changed | Update `src/decoder/*.rs` to match new Borsh layout. |
| **"No opportunities"** | Market is efficient | This is normal. Adjust `min_profit_percent` in `config.toml` to a lower value (e.g., 0.1) to see smaller spreads. |
| **Docker Build Fails** | Missing memory/CPU | Ensure Docker Desktop has allocated at least 4GB RAM. |
