#!/bin/bash
set -e

echo ">>> [1/3] Updating System & Installing Dependencies..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential pkg-config libssl-dev git unzip ufw htop tmux

echo ">>> [2/3] Configuring Internal Firewall (UFW)..."
# Critical for Oracle Cloud: Open ports internally
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 9090/tcp # Prometheus Metrics
echo "y" | sudo ufw enable
sudo ufw status verbose

echo ">>> [3/3] Installing Rust (Stable)..."
if ! command -v cargo &> /dev/null; then
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
else
    echo "Rust is already installed."
fi

# Check for .env
if [ ! -f "../.env" ]; then
    echo ">>> Creating .env from valid example..."
    cp ../.env.example ../.env
    echo "PLEASE EDIT .env WITH YOUR API KEYS!"
fi

echo ">>> Setup Complete! Please edit .env file before deploying."
