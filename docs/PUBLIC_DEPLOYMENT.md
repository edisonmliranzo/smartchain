# SmartChain Public Blockchain - Deployment Guide

Deploy your own public SmartChain network with staking, validators, and rewards.

## 🌐 Network Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SmartChain Public Network                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│    ┌───────────────────────────────────────────────────────────┐   │
│    │                    21 Active Validators                    │   │
│    │   (Elected by stake - Top 21 by SMC staked)               │   │
│    └───────────────────────────────────────────────────────────┘   │
│                              ↑                                      │
│                         Staking                                     │
│                              ↑                                      │
│    ┌───────────────────────────────────────────────────────────┐   │
│    │                   Token Holders                            │   │
│    │   • Stake SMC to validators                               │   │
│    │   • Earn staking rewards                                  │   │
│    │   • Participate in governance                             │   │
│    └───────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Prerequisites

### VPS Requirements (Per Node)

- **OS:** Ubuntu 22.04 LTS
- **CPU:** 4+ cores
- **RAM:** 8+ GB
- **Storage:** 100+ GB SSD
- **Network:** 100+ Mbps, static IP

### Recommended VPS Providers

- **Contabo** - Best value ($5-10/month)
- **Hetzner** - Great performance ($5-20/month)
- **DigitalOcean** - Easy setup ($24/month)
- **AWS/GCP** - Enterprise grade

---

## 🚀 Quick Start

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git
sudo apt install -y git

# Clone SmartChain
git clone https://github.com/edisonmliranzo/smartchain.git
cd smartchain

# Install dependencies
npm install

# Build
npm run build
```

### 2. Configure Node

Create `.env` file:

```bash
# Node Configuration
NODE_NUMBER=1
RPC_PORT=8545
P2P_PORT=9545

# Validator Configuration
VALIDATOR_ADDRESS=0xYourValidatorAddress
VALIDATOR_PRIVATE_KEY=0xYourPrivateKey

# Network
CHAIN_ID=1337
NETWORK_NAME=SmartChain Mainnet
SYMBOL=SMC

# Bootstrap Nodes (add after first node is running)
BOOTSTRAP_NODES=ws://node1-ip:9545,ws://node2-ip:9545

# Database
DATA_DIR=./data

# Staking
MIN_STAKE=100000000000000000000000
REWARDS_PER_BLOCK=2000000000000000000
```

### 3. Run Validator Node

```bash
# Start node
npm run enterprise:start -- --node 1 --port 8545

# Or use PM2 for production
npm install -g pm2
pm2 start "npm run enterprise:start -- --node 1 --port 8545" --name smartchain-node1
pm2 save
pm2 startup
```

---

## 🔧 Network Configuration

### Genesis Configuration

Create `genesis.json`:

```json
{
  "chainId": 1337,
  "chainName": "SmartChain",
  "symbol": "SMC",
  "totalSupply": "1000000000000000000000000000",
  "blockTime": 5000,
  "blockGasLimit": "30000000",
  "initialValidators": [
    "0xValidator1Address",
    "0xValidator2Address",
    "0xValidator3Address"
  ],
  "premine": {
    "0xFoundationAddress": "500000000000000000000000000",
    "0xTeamAddress": "100000000000000000000000000",
    "0xStakingRewards": "300000000000000000000000000",
    "0xEcosystemFund": "100000000000000000000000000"
  },
  "staking": {
    "minStake": "100000000000000000000000",
    "maxValidators": 21,
    "epochBlocks": 200,
    "unbondingPeriod": 604800,
    "rewardsPerBlock": "2000000000000000000"
  }
}
```

### Multi-Node Setup

| Node | IP | RPC Port | P2P Port | Role |
|------|------|----------|----------|------|
| Node 1 | 1.2.3.4 | 8545 | 9545 | Validator |
| Node 2 | 5.6.7.8 | 8545 | 9545 | Validator |
| Node 3 | 9.10.11.12 | 8545 | 9545 | Validator |

---

## 📊 Staking Economics

### Token Distribution

| Allocation | Amount | Percentage |
|------------|--------|------------|
| Staking Rewards | 300M SMC | 30% |
| Foundation | 500M SMC | 50% |
| Team (4yr vesting) | 100M SMC | 10% |
| Ecosystem | 100M SMC | 10% |
| **Total** | **1B SMC** | **100%** |

### Validator Requirements

| Requirement | Value |
|-------------|-------|
| Minimum Stake | 100,000 SMC |
| Max Commission | 20% |
| Unbonding Period | 7 days |
| Active Validators | 21 |
| Epoch Duration | 200 blocks |

### Rewards

- **Block Reward:** 2 SMC per block
- **Annual Inflation:** ~12.6M SMC (decreasing)
- **Validator APY:** ~8-15% (depends on stake)
- **Delegator APY:** ~6-12% (after commission)

### Slashing

| Offense | Penalty | Jail Time |
|---------|---------|-----------|
| Downtime (10+ blocks) | 1% stake | 1 day |
| Double Signing | 5% stake | 7 days |

---

## 🔐 Security

### Firewall Configuration

```bash
# Allow SSH
sudo ufw allow 22

# Allow RPC (only if public)
sudo ufw allow 8545

# Allow P2P
sudo ufw allow 9545

# Enable firewall
sudo ufw enable
```

### Nginx Reverse Proxy (Optional)

```nginx
server {
    listen 443 ssl;
    server_name rpc.smartchain.io;

    ssl_certificate /etc/letsencrypt/live/rpc.smartchain.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/rpc.smartchain.io/privkey.pem;

    location / {
        proxy_pass http://localhost:8545;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Key Management

```bash
# Generate new validator key
npm run wallet -- create

# Export key (for backup)
npm run wallet -- export --address 0xYourAddress

# Import key on new server
npm run wallet -- import --private-key 0xYourPrivateKey
```

---

## 📈 Monitoring

### PM2 Monitoring

```bash
# View logs
pm2 logs smartchain-node1

# View status
pm2 status

# Restart node
pm2 restart smartchain-node1
```

### Health Check Script

Create `health-check.sh`:

```bash
#!/bin/bash

# Check if node is synced
BLOCK=$(curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  | jq -r '.result')

# Check peer count
PEERS=$(curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"net_peerCount","params":[],"id":1}' \
  | jq -r '.result')

echo "Block: $BLOCK"
echo "Peers: $PEERS"

# Alert if no peers
if [ "$PEERS" = "0x0" ]; then
    echo "WARNING: No peers connected!"
fi
```

### Prometheus Metrics (Coming Soon)

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'smartchain'
    static_configs:
      - targets: ['localhost:9100']
```

---

## 🌐 Public Endpoints

After deployment, provide these endpoints:

| Service | URL | Description |
|---------|-----|-------------|
| RPC | <https://rpc.smartchain.io> | JSON-RPC API |
| WSS | wss://ws.smartchain.io | WebSocket API |
| Explorer | <https://explorer.smartchain.io> | Block Explorer |
| Faucet | <https://faucet.smartchain.io> | Testnet Faucet |

### MetaMask Configuration

```
Network Name: SmartChain
RPC URL: https://rpc.smartchain.io
Chain ID: 1337
Currency Symbol: SMC
Block Explorer: https://explorer.smartchain.io
```

---

## 🔄 Upgrade Process

### Rolling Upgrade

```bash
# Node 1
cd ~/smartchain
git pull
npm install
npm run build
pm2 restart smartchain-node1

# Wait for sync, then Node 2, etc.
```

### Breaking Changes

For major upgrades with breaking changes:

1. Announce upgrade block number
2. All validators update before that block
3. New consensus rules activate at upgrade block

---

## 📝 Become a Validator

### Step 1: Acquire SMC

- Buy SMC from exchanges
- Or earn through faucet/testnet

### Step 2: Register as Validator

```bash
# Using CLI
npm run staking -- register \
  --stake 100000 \
  --name "My Validator" \
  --website "https://myvalidator.com" \
  --commission 500

# Commission is in basis points (500 = 5%)
```

### Step 3: Run Your Node

Follow the setup instructions above, then:

```bash
npm run enterprise:start -- \
  --node 1 \
  --port 8545 \
  --peers ws://bootstrap1.smartchain.io:9545,ws://bootstrap2.smartchain.io:9545
```

### Step 4: Monitor Performance

- Keep uptime >99%
- Monitor missed blocks
- Update software promptly
- Engage with community

---

## ❓ Troubleshooting

### Node not syncing

1. Check firewall allows P2P port
2. Verify bootstrap node addresses
3. Check logs: `pm2 logs smartchain-node1`

### Missed blocks

1. Check server performance (CPU, RAM)
2. Verify network latency
3. Ensure time is synced: `timedatectl status`

### Rewards not accumulating

1. Verify you're in active validator set
2. Check stake meets minimum
3. Ensure not jailed

---

## 📞 Support

- **Discord:** discord.gg/smartchain
- **Telegram:** t.me/smartchain
- **GitHub Issues:** github.com/edisonmliranzo/smartchain/issues
- **Email:** <support@smartchain.io>

---

## 📜 License

MIT License - See LICENSE file for details.
