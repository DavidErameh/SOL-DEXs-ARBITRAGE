#!/bin/bash
set -e

echo ">>> [1/3] Pulling latest code..."
git pull origin main

echo ">>> [2/3] Building Release Binary (Native Arch)..."
# Uses native architecture (Ampere A1 = ARM64 automatically)
cargo build --release

echo ">>> [3/3] Restarting Service..."
sudo systemctl restart solana-price-monitor
sudo systemctl status solana-price-monitor --no-pager

echo ">>> Deployment Successful!"
