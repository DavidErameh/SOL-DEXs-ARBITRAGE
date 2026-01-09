# Deployment Guide

## Solana Price Monitoring System - Production & Operations

**Version**: 1.0  
**Last Updated**: January 2026  
**Status**: Production Ready

---

## Overview

This guide covers the complete deployment lifecycle for the Solana Price Monitor:

1. **Pre-Production** - Environment preparation, security hardening
2. **Production Deployment** - AWS EC2, systemd, and alternative VPS options
3. **Post-Production** - Monitoring (CloudWatch), maintenance, disaster recovery

---

## 1. PRE-PRODUCTION PREPARATION

### 1.1 Environment Checklist

| Requirement | Minimum          | Recommended      | Notes                          |
| ----------- | ---------------- | ---------------- | ------------------------------ |
| **CPU**     | 4 vCPU           | 8 vCPU           | For concurrent WebSocket tasks |
| **RAM**     | 8 GB             | 16 GB            | Price cache + buffers          |
| **Storage** | 20 GB SSD        | 50 GB NVMe       | Logs + metrics                 |
| **Network** | 1 Gbps           | 10 Gbps          | Low-latency data ingestion     |
| **OS**      | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS | Debian-based recommended       |

### 1.2 Install System Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y \
    build-essential \
    pkg-config \
    libssl-dev \
    curl \
    git \
    htop \
    tmux

# Install AWS CLI (for AWS deployment)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf aws awscliv2.zip

# Verify AWS CLI
aws --version
```

### 1.3 Helius API Setup

1. **Create Account**: Visit [https://dev.helius.xyz/](https://dev.helius.xyz/)
2. **Generate API Key**: Dashboard → API Keys → Create New Key
3. **Select Plan**:

| Plan          | Rate Limit | WebSocket Connections | Cost       |
| ------------- | ---------- | --------------------- | ---------- |
| **Free**      | 100 req/s  | 10 concurrent         | $0/month   |
| **Developer** | 500 req/s  | 25 concurrent         | $49/month  |
| **Business**  | 2000 req/s | 100 concurrent        | $199/month |

> [!TIP]
> The **Free tier** is sufficient for monitoring up to 50 pools. Upgrade only if you need more concurrent connections or higher throughput.

### 1.4 Security Hardening

#### SSH Configuration

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Add/modify these lines:
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
Port 2222  # Change from default 22

# Restart SSH
sudo systemctl restart sshd
```

#### Firewall Setup

```bash
# Install UFW
sudo apt install -y ufw

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (use your custom port)
sudo ufw allow 2222/tcp

# Allow metrics (only if needed externally)
# sudo ufw allow 9090/tcp  # Prometheus
# sudo ufw allow 3000/tcp  # Grafana

# Enable firewall
sudo ufw enable
sudo ufw status
```

#### Create Non-Root User

```bash
# Create application user
sudo useradd -m -s /bin/bash solana-monitor
sudo usermod -aG docker solana-monitor

# Create app directory
sudo mkdir -p /opt/solana-price-monitor
sudo chown solana-monitor:solana-monitor /opt/solana-price-monitor
```

### 1.5 Production Configuration

Create `/opt/solana-price-monitor/.env`:

```bash
# ============================================
# PRODUCTION ENVIRONMENT
# ============================================

# Helius API (replace with your actual key)
HELIUS_API_KEY=your-production-api-key
HELIUS_WS_URL=wss://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}
HELIUS_HTTP_URL=https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}

# Logging (production settings)
RUST_LOG=info,solana_price_monitor=info

# Metrics
METRICS_ENABLED=true
METRICS_PORT=9090

# Performance tuning
TOKIO_WORKER_THREADS=4
```

Create `/opt/solana-price-monitor/config.toml`:

```toml
# ============================================
# PRODUCTION CONFIGURATION
# ============================================

[rpc]
websocket_url = "${HELIUS_WS_URL}"
http_url = "${HELIUS_HTTP_URL}"

[monitoring]
max_pools = 50
cache_ttl_seconds = 60
cleanup_interval_seconds = 10
stale_threshold_ms = 2000

[arbitrage]
min_profit_percent = 0.5
max_trade_size_percent = 5.0
slot_tolerance = 2

[fees]
default_dex_fee = 0.25
estimated_slippage = 0.3
gas_cost_percent = 0.01
jito_tip_percent = 0.05

# Production pool addresses
[pools.sol_usdc]
raydium = "58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2"
orca = "HJPjoWUrhoZzkNfRpHuieeFk9WcZWjwy6PBjZ81ngndJ"
meteora = "7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5"

[pools.sol_usdt]
raydium = "7XawhbbxtsRcQA8KTkHT9f9nc6d69UwqCDh6U5EEbEmX"
```

### 1.6 Build Release Binary

```bash
# Clone repository
cd /opt/solana-price-monitor
git clone https://github.com/your-org/solana-price-monitor.git .

# Build optimized release
cargo build --release

# Binary location
ls -la target/release/solana-price-monitor
```

**Expected output:**

```
-rwxr-xr-x 1 user user 15M Jan  9 12:00 target/release/solana-price-monitor
```

---

### 2.1 Option A: Docker & AWS ECS Fargate (Recommended)

This approach uses containerization for consistent environments and AWS Fargate for serverless management.

#### Step 1: Docker Configuration

**Dockerfile** (Multi-stage build for small image size):

```dockerfile
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
```

**docker-compose.yml** (For local testing):

```yaml
version: "3.8"

services:
  price-monitor:
    build: .
    image: solana-price-monitor:latest
    container_name: price-monitor
    restart: unless-stopped
    ports:
      - "9090:9090"
    environment:
      - RUST_LOG=info
      - HELIUS_API_KEY=${HELIUS_API_KEY}
      - METRICS_ENABLED=true
    volumes:
      - ./logs:/app/logs
```

#### Step 2: AWS Infrastructure (ECR & ECS)

**1. Create ECR Repository:**

```bash
aws ecr create-repository \
    --repository-name solana-price-monitor \
    --image-scanning-configuration scanOnPush=true \
    --encryption-configuration encryptionType=AES256
```

**2. Push Image to ECR:**

```bash
# Login
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build & Tag
docker build -t solana-price-monitor .
docker tag solana-price-monitor:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/solana-price-monitor:latest

# Push
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/solana-price-monitor:latest
```

**3. Create ECS Task Definition:**

Save as `task-definition.json`:

```json
{
  "family": "solana-price-monitor",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT_ID:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "price-monitor",
      "image": "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/solana-price-monitor:latest",
      "essential": true,
      "environment": [
        { "name": "RUST_LOG", "value": "info" },
        { "name": "METRICS_ENABLED", "value": "true" }
      ],
      "secrets": [
        {
          "name": "HELIUS_API_KEY",
          "valueFrom": "arn:aws:ssm:us-east-1:ACCOUNT_ID:parameter/solana/helius_api_key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/solana-price-monitor",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "portMappings": [
        {
          "containerPort": 9090,
          "hostPort": 9090,
          "protocol": "tcp"
        }
      ]
    }
  ]
}
```

Register task:

```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

**4. Create ECS Service:**

```bash
aws ecs create-service \
    --cluster solana-monitor-cluster \
    --service-name price-monitor-service \
    --task-definition solana-price-monitor \
    --launch-type FARGATE \
    --desired-count 1 \
    --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxx],securityGroups=[sg-xxxx],assignPublicIp=ENABLED}"
```

#### Step 3: CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to ECS

on:
  push:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: solana-price-monitor
  ECS_SERVICE: price-monitor-service
  ECS_CLUSTER: solana-monitor-cluster
  CONTAINER_NAME: price-monitor

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build, tag, and push image to Amazon ECR
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

      - name: Fill in the new image ID in the Amazon ECS task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: task-definition.json
          container-name: ${{ env.CONTAINER_NAME }}
          image: ${{ steps.build-image.outputs.image }}

      - name: Deploy Amazon ECS task definition
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true
```

---

### 2.2 Option B: AWS EC2 Deployment (Bare Metal)

AWS EC2 provides production-grade infrastructure with low latency to Solana validators. The **us-east-1** (N. Virginia) region offers optimal proximity to the majority of Solana stake.

#### Step 1: Launch EC2 Instance

**Recommended Instance Types:**

| Instance Type   | vCPU | RAM   | Network         | Cost/Month | Use Case                       |
| --------------- | ---- | ----- | --------------- | ---------- | ------------------------------ |
| **t3.xlarge**   | 4    | 16 GB | Up to 5 Gbps    | ~$120      | Development/Testing            |
| **c6i.xlarge**  | 4    | 8 GB  | Up to 12.5 Gbps | ~$130      | Production (compute-optimized) |
| **c6i.2xlarge** | 8    | 16 GB | Up to 12.5 Gbps | ~$260      | High-frequency monitoring      |

**Launch via AWS Console:**

1. Go to **EC2 Dashboard** → **Launch Instance**
2. **Name**: `solana-price-monitor`
3. **AMI**: Ubuntu Server 24.04 LTS (HVM), SSD Volume Type
4. **Instance type**: `c6i.xlarge` (recommended)
5. **Key pair**: Create or select existing SSH key
6. **Network settings**: See Security Group below
7. **Storage**: 50 GB gp3 SSD

**Or via AWS CLI:**

```bash
# Create key pair (if needed)
aws ec2 create-key-pair \
    --key-name solana-monitor-key \
    --query 'KeyMaterial' \
    --output text > solana-monitor-key.pem
chmod 400 solana-monitor-key.pem

# Launch instance
aws ec2 run-instances \
    --image-id ami-0c7217cdde317cfec \
    --instance-type c6i.xlarge \
    --key-name solana-monitor-key \
    --security-group-ids sg-xxxxxxxx \
    --subnet-id subnet-xxxxxxxx \
    --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":50,"VolumeType":"gp3"}}]' \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=solana-price-monitor}]' \
    --region us-east-1
```

#### Step 2: Configure Security Group

Create a security group with minimal required ports:

```bash
# Create security group
aws ec2 create-security-group \
    --group-name solana-monitor-sg \
    --description "Solana Price Monitor Security Group" \
    --vpc-id vpc-xxxxxxxx

# Allow SSH (restrict to your IP)
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxxxx \
    --protocol tcp \
    --port 22 \
    --cidr YOUR_IP/32

# Allow metrics port (optional, for external Prometheus)
aws ec2 authorize-security-group-ingress \
    --group-id sg-xxxxxxxx \
    --protocol tcp \
    --port 9090 \
    --cidr 10.0.0.0/8  # Internal VPC only
```

**Security Group Rules:**

| Type         | Port | Source     | Purpose            |
| ------------ | ---- | ---------- | ------------------ |
| SSH          | 22   | Your IP/32 | Administration     |
| Custom TCP   | 9090 | VPC CIDR   | Metrics (internal) |
| All outbound | All  | 0.0.0.0/0  | WebSocket, HTTPS   |

#### Step 3: Connect and Setup

```bash
# Connect to instance
ssh -i solana-monitor-key.pem ubuntu@<INSTANCE_PUBLIC_IP>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source $HOME/.cargo/env

# Install dependencies
sudo apt install -y build-essential pkg-config libssl-dev git htop

# Create application directory
sudo mkdir -p /opt/solana-price-monitor
sudo chown ubuntu:ubuntu /opt/solana-price-monitor
cd /opt/solana-price-monitor

# Clone and build
git clone https://github.com/your-org/solana-price-monitor.git .
cargo build --release
```

#### Step 4: Configure Environment

```bash
# Create .env file
cat > /opt/solana-price-monitor/.env << 'EOF'
# AWS Production Environment
HELIUS_API_KEY=your-production-api-key
HELIUS_WS_URL=wss://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}
HELIUS_HTTP_URL=https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}

# Logging
RUST_LOG=info,solana_price_monitor=info

# Metrics
METRICS_ENABLED=true
METRICS_PORT=9090

# AWS-specific
AWS_REGION=us-east-1
EOF

# Secure the file
chmod 600 /opt/solana-price-monitor/.env
```

#### Step 5: Setup Systemd Service

```bash
# Create service file
sudo tee /etc/systemd/system/solana-price-monitor.service << 'EOF'
[Unit]
Description=Solana Price Monitor
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=/opt/solana-price-monitor
EnvironmentFile=/opt/solana-price-monitor/.env
ExecStart=/opt/solana-price-monitor/target/release/solana-price-monitor
Restart=always
RestartSec=10
LimitNOFILE=65536

# Security
ProtectSystem=strict
PrivateTmp=true
NoNewPrivileges=true
ReadWritePaths=/opt/solana-price-monitor/logs

[Install]
WantedBy=multi-user.target
EOF

# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable solana-price-monitor
sudo systemctl start solana-price-monitor

# Verify
sudo systemctl status solana-price-monitor
```

#### Step 6: Setup CloudWatch Monitoring (AWS-native)

**Install CloudWatch Agent:**

```bash
# Download agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb

# Create config
sudo tee /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
    "agent": {
        "metrics_collection_interval": 60,
        "run_as_user": "root"
    },
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/opt/solana-price-monitor/logs/*.log",
                        "log_group_name": "solana-price-monitor",
                        "log_stream_name": "{instance_id}",
                        "timezone": "UTC"
                    }
                ]
            }
        }
    },
    "metrics": {
        "namespace": "SolanaPriceMonitor",
        "metrics_collected": {
            "cpu": {
                "measurement": ["cpu_usage_active"],
                "metrics_collection_interval": 60
            },
            "mem": {
                "measurement": ["mem_used_percent"],
                "metrics_collection_interval": 60
            },
            "disk": {
                "measurement": ["disk_used_percent"],
                "metrics_collection_interval": 60
            }
        }
    }
}
EOF

# Start agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
    -s
```

**Create CloudWatch Alarms:**

```bash
# CPU alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "solana-monitor-high-cpu" \
    --metric-name CPUUtilization \
    --namespace AWS/EC2 \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --dimensions Name=InstanceId,Value=i-xxxxxxxx \
    --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:alerts

# Memory alarm (requires CloudWatch agent)
aws cloudwatch put-metric-alarm \
    --alarm-name "solana-monitor-high-memory" \
    --metric-name mem_used_percent \
    --namespace SolanaPriceMonitor \
    --statistic Average \
    --period 300 \
    --threshold 85 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:alerts
```

#### Step 7: IAM Role (for CloudWatch)

**Create IAM Role for EC2:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData",
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams"
      ],
      "Resource": "*"
    }
  ]
}
```

Attach this role to your EC2 instance for CloudWatch agent to work.

#### AWS Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS us-east-1 Region                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                      VPC                             │    │
│  │  ┌───────────────────────────────────────────────┐  │    │
│  │  │              Public Subnet                     │  │    │
│  │  │                                               │  │    │
│  │  │   ┌─────────────────────────────────────┐    │  │    │
│  │  │   │        EC2 Instance                  │    │  │    │
│  │  │   │        c6i.xlarge                   │    │  │    │
│  │  │   │                                     │    │  │    │
│  │  │   │   ┌─────────────────────────────┐  │    │  │    │
│  │  │   │   │   solana-price-monitor      │  │    │  │    │
│  │  │   │   │   (Rust Binary)             │  │    │  │    │
│  │  │   │   └─────────────────────────────┘  │    │  │    │
│  │  │   │                                     │    │  │    │
│  │  │   │   ┌─────────────────────────────┐  │    │  │    │
│  │  │   │   │   CloudWatch Agent          │  │    │  │    │
│  │  │   │   └─────────────────────────────┘  │    │  │    │
│  │  │   └─────────────────────────────────────┘    │  │    │
│  │  │                                               │  │    │
│  │  └───────────────────────────────────────────────┘  │    │
│  │                                                      │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  CloudWatch                           │   │
│  │   • Metrics    • Logs    • Alarms    • Dashboards    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ WebSocket (WSS)
                          ▼
              ┌─────────────────────────┐
              │    Helius Geyser        │
              │    (us-east nodes)      │
              └─────────────────────────┘
```

---

### 2.3 Option C: Systemd Service (Bare Metal Alternative)

#### Create Service File

Create `/etc/systemd/system/solana-price-monitor.service`:

```ini
[Unit]
Description=Solana Price Monitor
Documentation=https://github.com/your-org/solana-price-monitor
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=solana-monitor
Group=solana-monitor
WorkingDirectory=/opt/solana-price-monitor

# Environment
EnvironmentFile=/opt/solana-price-monitor/.env

# Binary execution
ExecStart=/opt/solana-price-monitor/target/release/solana-price-monitor

# Restart policy
Restart=always
RestartSec=10
StartLimitIntervalSec=60
StartLimitBurst=5

# Resource limits
LimitNOFILE=65536
MemoryMax=8G
CPUQuota=400%

# Security hardening
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
NoNewPrivileges=true
ReadWritePaths=/opt/solana-price-monitor/logs

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=solana-price-monitor

[Install]
WantedBy=multi-user.target
```

#### Enable and Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable on boot
sudo systemctl enable solana-price-monitor

# Start service
sudo systemctl start solana-price-monitor

# Check status
sudo systemctl status solana-price-monitor

# View logs
sudo journalctl -u solana-price-monitor -f
```

**Expected output:**

```
● solana-price-monitor.service - Solana Price Monitor
     Loaded: loaded (/etc/systemd/system/solana-price-monitor.service; enabled)
     Active: active (running) since Thu 2026-01-09 12:00:00 UTC; 1min ago
   Main PID: 12345 (solana-price-m)
     Memory: 256M
        CPU: 2.5s
     CGroup: /system.slice/solana-price-monitor.service
             └─12345 /opt/solana-price-monitor/target/release/solana-price-monitor
```

---

### 2.3 VPS Provider Setup

#### Recommended Providers (US East Coast)

| Provider         | Region     | Spec            | Setup Command                                  |
| ---------------- | ---------- | --------------- | ---------------------------------------------- |
| **Hetzner**      | Ashburn    | CPX41           | [cloud.hetzner.com](https://cloud.hetzner.com) |
| **Vultr**        | New Jersey | High Frequency  | [vultr.com](https://vultr.com)                 |
| **DigitalOcean** | NYC1       | Premium Droplet | [digitalocean.com](https://digitalocean.com)   |

#### Geographic Optimization

```
┌─────────────────────────────────────────────────────┐
│              LATENCY OPTIMIZATION                    │
├─────────────────────────────────────────────────────┤
│                                                      │
│   Your VPS (NYC/Virginia)                           │
│         │                                            │
│         ├──── <10ms ──── Solana Validators          │
│         │                (50%+ stake in US-East)    │
│         │                                            │
│         └──── <20ms ──── Helius Infrastructure      │
│                          (US-East nodes)             │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 3. MONITORING & OBSERVABILITY

### 3.1 Application Metrics

Add to your Rust application (`src/metrics.rs`):

```rust
use prometheus::{IntCounter, IntGauge, Histogram, Registry, Encoder, TextEncoder};

lazy_static::lazy_static! {
    pub static ref REGISTRY: Registry = Registry::new();

    pub static ref PRICE_UPDATES: IntCounter = IntCounter::new(
        "price_updates_total",
        "Total number of price updates received"
    ).unwrap();

    pub static ref CACHE_SIZE: IntGauge = IntGauge::new(
        "cache_entries_count",
        "Current number of entries in price cache"
    ).unwrap();

    pub static ref OPPORTUNITIES_DETECTED: IntCounter = IntCounter::new(
        "opportunities_detected_total",
        "Total arbitrage opportunities detected"
    ).unwrap();

    pub static ref WEBSOCKET_LATENCY: Histogram = Histogram::new(
        "websocket_latency_ms",
        "WebSocket message latency in milliseconds"
    ).unwrap();

    pub static ref DETECTION_LATENCY: Histogram = Histogram::new(
        "detection_latency_ms",
        "Opportunity detection latency in milliseconds"
    ).unwrap();
}

pub fn init_metrics() {
    REGISTRY.register(Box::new(PRICE_UPDATES.clone())).unwrap();
    REGISTRY.register(Box::new(CACHE_SIZE.clone())).unwrap();
    REGISTRY.register(Box::new(OPPORTUNITIES_DETECTED.clone())).unwrap();
    REGISTRY.register(Box::new(WEBSOCKET_LATENCY.clone())).unwrap();
    REGISTRY.register(Box::new(DETECTION_LATENCY.clone())).unwrap();
}

pub fn metrics_handler() -> String {
    let encoder = TextEncoder::new();
    let metric_families = REGISTRY.gather();
    let mut buffer = Vec::new();
    encoder.encode(&metric_families, &mut buffer).unwrap();
    String::from_utf8(buffer).unwrap()
}
```

### 3.2 Prometheus Configuration

Create `monitoring/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: []

rule_files: []

scrape_configs:
  # Solana Price Monitor metrics
  - job_name: "solana-price-monitor"
    static_configs:
      - targets: ["price-monitor:9090"]
    metrics_path: /metrics
    scrape_interval: 10s

  # Node metrics (optional)
  - job_name: "node"
    static_configs:
      - targets: ["node-exporter:9100"]
```

### 3.3 CloudWatch Dashboard (AWS Native)

Create a dashboard using this JSON configuration:

```json
{
  "widgets": [
    {
      "type": "metric",
      "x": 0,
      "y": 0,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [
            "AWS/ECS",
            "CPUUtilization",
            "ServiceName",
            "price-monitor-service",
            "ClusterName",
            "solana-monitor-cluster"
          ],
          [".", "MemoryUtilization", ".", ".", ".", "."]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "us-east-1",
        "title": "Container CPU & Memory"
      }
    },
    {
      "type": "log",
      "x": 0,
      "y": 6,
      "width": 24,
      "height": 6,
      "properties": {
        "query": "SOURCE '/ecs/solana-price-monitor' | filter @message like /ERROR/ | stats count(*) as errorCount by bin(5m)",
        "region": "us-east-1",
        "title": "Error Logs",
        "view": "table"
      }
    }
  ]
}
```

---

## 4. COST OPTIMIZATION STRATEGY

To maintain the budget (~$50/month) while ensuring high availability:

### 4.1 Compute (Fargate Spot)

Use Fargate Spot instances for the majority of tasks to save up to 70%.

**Capacity Provider Strategy:**

- **Base**: 1 (Fargate On-Demand) - Ensures at least one stable instance.
- **Weight**: 1 (Fargate Spot) - Scales with cheaper spot instances.

```bash
aws ecs update-service --cluster solana-monitor-cluster --service price-monitor-service \
    --capacity-provider-strategy capacityProvider=FARGATE,weight=1,base=1 \
    --capacity-provider-strategy capacityProvider=FARGATE_SPOT,weight=1
```

### 4.2 Network Traffic

- **VPC Endpoints**: Use VPC Endpoints for ECR and CloudWatch to keep traffic within the AWS network (cheaper than NAT Gateway data processing).
- **Region Locality**: Ensure ECS cluster and Helius RPC nodes are in the same region (us-east-1) to minimize latency and data transfer costs.

### 4.3 Log Retention

Set CloudWatch Log Group retention to 7 days to avoid excessive storage costs.

````bash
aws logs put-retention-policy --log-group-name /ecs/solana-price-monitor --retention-in-days 7
```      ]
    },
    {
      "datasource": "Prometheus",
      "fieldConfig": {
        "defaults": {
          "color": { "mode": "palette-classic" }
        }
      },
      "gridPos": { "h": 8, "w": 6, "x": 12, "y": 0 },
      "id": 3,
      "title": "Opportunities Detected",
      "type": "stat",
      "targets": [
        {
          "expr": "opportunities_detected_total",
          "refId": "A"
        }
      ]
    },
    {
      "datasource": "Prometheus",
      "gridPos": { "h": 8, "w": 12, "x": 0, "y": 8 },
      "id": 4,
      "title": "Price Update Rate",
      "type": "timeseries",
      "targets": [
        {
          "expr": "rate(price_updates_total[5m])",
          "legendFormat": "Updates/sec",
          "refId": "A"
        }
      ]
    },
    {
      "datasource": "Prometheus",
      "gridPos": { "h": 8, "w": 12, "x": 12, "y": 8 },
      "id": 5,
      "title": "Detection Latency (p95)",
      "type": "timeseries",
      "targets": [
        {
          "expr": "histogram_quantile(0.95, rate(detection_latency_ms_bucket[5m]))",
          "legendFormat": "p95 Latency",
          "refId": "A"
        }
      ]
    }
  ],
  "refresh": "10s",
  "schemaVersion": 38,
  "tags": ["solana", "arbitrage"],
  "templating": { "list": [] },
  "time": { "from": "now-1h", "to": "now" },
  "timepicker": {},
  "timezone": "browser",
  "title": "Solana Price Monitor",
  "uid": "solana-price-monitor",
  "version": 1
}
````

### 3.4 Alert Rules

Create `monitoring/alerting/alerts.yml`:

```yaml
groups:
  - name: solana-price-monitor
    rules:
      # No price updates for 1 minute
      - alert: NoPriceUpdates
        expr: increase(price_updates_total[1m]) == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "No price updates received"
          description: "The price monitor has not received any updates for 1 minute."

      # WebSocket disconnected
      - alert: WebSocketDisconnected
        expr: websocket_connected == 0
        for: 30s
        labels:
          severity: critical
        annotations:
          summary: "WebSocket disconnected"
          description: "The WebSocket connection to Helius is down."

      # High detection latency
      - alert: HighDetectionLatency
        expr: histogram_quantile(0.95, rate(detection_latency_ms_bucket[5m])) > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High detection latency"
          description: "95th percentile detection latency exceeds 100ms."

      # Low opportunity detection
      - alert: NoOpportunities
        expr: increase(opportunities_detected_total[1h]) == 0
        for: 2h
        labels:
          severity: warning
        annotations:
          summary: "No opportunities detected"
          description: "No arbitrage opportunities detected in the last 2 hours."
```

---

## 4. POST-PRODUCTION OPERATIONS

### 4.1 Log Management

#### Structured Logging Configuration

```rust
// In main.rs
use tracing_subscriber::{
    fmt::{self, format::FmtSpan},
    layer::SubscriberExt,
    util::SubscriberInitExt,
    EnvFilter,
};

fn init_production_logging() {
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info"));

    let fmt_layer = fmt::layer()
        .json()  // JSON format for production
        .with_span_events(FmtSpan::CLOSE)
        .with_target(true)
        .with_thread_ids(true);

    tracing_subscriber::registry()
        .with(filter)
        .with(fmt_layer)
        .init();
}
```

#### Log Rotation (Docker)

Already configured in `docker-compose.yml`:

```yaml
logging:
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"
```

#### Log Rotation (Systemd)

```bash
# Configure journald retention
sudo nano /etc/systemd/journald.conf

# Add:
[Journal]
SystemMaxUse=1G
MaxFileSec=7d
```

### 4.2 Update Procedure

#### Zero-Downtime Update (Docker)

```bash
# Pull latest code
cd /opt/solana-price-monitor
git pull origin main

# Build new image
docker compose build price-monitor

# Rolling update
docker compose up -d --no-deps price-monitor

# Verify
docker compose ps
docker compose logs -f price-monitor --tail=50
```

#### Systemd Update

```bash
# Stop service
sudo systemctl stop solana-price-monitor

# Pull and build
cd /opt/solana-price-monitor
git pull origin main
cargo build --release

# Start service
sudo systemctl start solana-price-monitor

# Verify
sudo systemctl status solana-price-monitor
```

### 4.3 Backup Strategy

#### Configuration Backup

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/opt/backups/solana-price-monitor"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup configuration
cp /opt/solana-price-monitor/config.toml "$BACKUP_DIR/config_$DATE.toml"
cp /opt/solana-price-monitor/.env "$BACKUP_DIR/env_$DATE"

# Backup Docker volumes (if using Docker)
docker run --rm \
  -v prometheus_data:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/prometheus_$DATE.tar.gz /data

# Cleanup old backups (keep 7 days)
find $BACKUP_DIR -mtime +7 -delete

echo "Backup completed: $DATE"
```

Add to crontab:

```bash
# Daily backup at 2 AM
0 2 * * * /opt/solana-price-monitor/scripts/backup.sh
```

### 4.4 Disaster Recovery

#### Recovery Procedure

1. **Provision new VPS** (same region for low latency)
2. **Install dependencies** (see Section 1.2)
3. **Restore configuration**:
   ```bash
   cp /opt/backups/latest/config.toml /opt/solana-price-monitor/
   cp /opt/backups/latest/env /opt/solana-price-monitor/.env
   ```
4. **Deploy application** (Docker or systemd)
5. **Verify metrics and logs**
6. **Update DNS/routing** if applicable

#### Rollback Procedure

```bash
# Docker rollback
docker compose down
docker image tag solana-price-monitor:latest solana-price-monitor:failed
docker image tag solana-price-monitor:previous solana-price-monitor:latest
docker compose up -d

# Systemd rollback
sudo systemctl stop solana-price-monitor
cp /opt/solana-price-monitor/target/release/solana-price-monitor.backup \
   /opt/solana-price-monitor/target/release/solana-price-monitor
sudo systemctl start solana-price-monitor
```

### 4.5 Scaling

#### Horizontal Scaling

For monitoring more pools, run multiple instances with different pool assignments:

```yaml
# docker-compose.scale.yml
services:
  price-monitor-1:
    extends:
      file: docker-compose.yml
      service: price-monitor
    environment:
      - POOL_GROUP=tier1

  price-monitor-2:
    extends:
      file: docker-compose.yml
      service: price-monitor
    environment:
      - POOL_GROUP=tier2
```

#### Vertical Scaling

| Pools  | CPU     | RAM   | Network |
| ------ | ------- | ----- | ------- |
| 1-25   | 4 vCPU  | 8 GB  | 1 Gbps  |
| 25-50  | 8 vCPU  | 16 GB | 1 Gbps  |
| 50-100 | 16 vCPU | 32 GB | 10 Gbps |

---

## 5. RUNBOOK

### 5.1 Common Issues

| Issue                | Symptom                      | Resolution                                              |
| -------------------- | ---------------------------- | ------------------------------------------------------- |
| **No price updates** | `price_updates_total` flat   | Check WebSocket connection, Helius API status           |
| **High memory**      | RAM > 80%                    | Reduce `max_pools`, increase `cleanup_interval_seconds` |
| **Stale prices**     | Many `is_stale` warnings     | Check network latency, Helius rate limits               |
| **Connection drops** | Frequent reconnections       | Upgrade Helius plan, check firewall                     |
| **Slow detection**   | `detection_latency_ms` > 100 | Profile code, reduce pool count                         |

### 5.2 Health Check Commands

```bash
# Check application status
curl -s http://localhost:9090/health | jq .

# Check metrics
curl -s http://localhost:9090/metrics | grep -E "^(price_updates|cache_entries|opportunities)"

# Check Docker containers
docker compose ps
docker stats --no-stream

# Check systemd service
sudo systemctl status solana-price-monitor
sudo journalctl -u solana-price-monitor --since "1 hour ago"

# Check system resources
htop
df -h
free -h
```

### 5.3 Emergency Contacts

| Resource           | URL / Contact                                  |
| ------------------ | ---------------------------------------------- |
| **Helius Status**  | [status.helius.dev](https://status.helius.dev) |
| **Solana Status**  | [status.solana.com](https://status.solana.com) |
| **Helius Discord** | [discord.gg/helius](https://discord.gg/helius) |

---

## 6. SECURITY CHECKLIST

### Pre-Deployment

- [ ] API keys stored in `.env` (not committed to git)
- [ ] `.env` permissions set to `600`
- [ ] SSH key authentication enabled
- [ ] Root login disabled
- [ ] Firewall configured (UFW)
- [ ] Non-root user for application

### Post-Deployment

- [ ] All connections use TLS/WSS
- [ ] Logs don't contain sensitive data
- [ ] Dependencies audited (`cargo audit`)
- [ ] Regular security updates scheduled
- [ ] Backup encryption enabled

### Periodic Review

- [ ] Monthly: Review access logs
- [ ] Monthly: Update dependencies
- [ ] Quarterly: Rotate API keys
- [ ] Quarterly: Security audit

---

## 7. APPENDIX

### A. Quick Reference Commands

```bash
# Docker
docker compose up -d          # Start all services
docker compose down           # Stop all services
docker compose logs -f        # View logs
docker compose restart        # Restart services

# Systemd
sudo systemctl start solana-price-monitor
sudo systemctl stop solana-price-monitor
sudo systemctl restart solana-price-monitor
sudo systemctl status solana-price-monitor
sudo journalctl -u solana-price-monitor -f

# Monitoring
curl localhost:9090/health    # Health check
curl localhost:9090/metrics   # Prometheus metrics
```

### B. Environment Variables Reference

| Variable               | Required | Default   | Description          |
| ---------------------- | -------- | --------- | -------------------- |
| `HELIUS_API_KEY`       | Yes      | -         | Helius API key       |
| `HELIUS_WS_URL`        | Yes      | -         | WebSocket endpoint   |
| `HELIUS_HTTP_URL`      | Yes      | -         | HTTP RPC endpoint    |
| `RUST_LOG`             | No       | `info`    | Log level            |
| `METRICS_PORT`         | No       | `9090`    | Prometheus port      |
| `TOKIO_WORKER_THREADS` | No       | CPU count | Async worker threads |

---

**Document Version**: 1.0  
**Created**: January 2026  
**Status**: Production Ready
