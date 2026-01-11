#!/bin/bash
set -e

SERVICE_NAME="solana-price-monitor.service"
SERVICE_PATH="/etc/systemd/system/$SERVICE_NAME"
SOURCE_PATH="./scripts/solana-price-monitor.service"

echo ">>> Installing Systemd Service..."

if [ ! -f "$SOURCE_PATH" ]; then
    # Handle running from scripts dir vs root
    SOURCE_PATH="./solana-price-monitor.service"
fi

if [ ! -f "$SOURCE_PATH" ]; then
    echo "Error: Service file not found at $SOURCE_PATH"
    exit 1
fi

sudo cp "$SOURCE_PATH" "$SERVICE_PATH"
sudo systemctl daemon-reload
sudo systemctl enable $SERVICE_NAME

echo ">>> Service installed and enabled!"
echo "Run './scripts/deploy_update.sh' to build and start the service."
