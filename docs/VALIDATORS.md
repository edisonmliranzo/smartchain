# SmartChain Validator Guide

This guide explains how to become a validator on the SmartChain network.

## What is a Validator?

In SmartChain's Proof of Authority (PoA) consensus, validators are trusted nodes that:

- Produce new blocks in round-robin order
- Validate transactions
- Secure the network

## Current Validators

| # | Address | Status |
|---|---------|--------|
| 1 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | ✅ Active (Genesis) |
| 2 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | 🔄 Available |
| 3 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | 🔄 Available |
| 4 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | 🔄 Available |
| 5 | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | 🔄 Available |

## How to Become a Validator

### Step 1: Generate Your Validator Address

```bash
# Using the SmartChain CLI
npm run wallet generate
```

This will output:

- **Address**: Your validator address (share this publicly)
- **Private Key**: Your validator key (KEEP SECRET!)

### Step 2: Request Validator Status

Contact the network administrator with:

1. Your validator address
2. Your VPS IP address
3. Your organization/identity

The admin will add your address to `src/config.ts` in the VALIDATORS array.

### Step 3: Set Up Your Validator Node

#### Prerequisites

- VPS with 1 vCPU, 1GB RAM, 20GB SSD
- Ubuntu 22.04
- Domain name (optional, for SSL)

#### Installation

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs git

# Install PM2
npm install -g pm2

# Clone SmartChain
git clone https://github.com/edisonmliranzo/smartchain.git /opt/smartchain
cd /opt/smartchain

# Install dependencies
npm install

# Create .env file with your validator key
cat > .env << 'EOF'
VALIDATOR_PRIVATE_KEY=your_private_key_here
EOF

# Start the node
pm2 start npm --name "smartchain-validator" -- start
pm2 save
pm2 startup
```

### Step 4: Configure Firewall

```bash
ufw allow 8545   # RPC
ufw allow 8546   # WebSocket
ufw allow 9545   # P2P (if implemented)
ufw allow 22     # SSH
ufw enable
```

### Step 5: Verify Your Node

```bash
# Check if node is running
pm2 status

# Check logs
pm2 logs smartchain-validator

# Test RPC
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## Validator Responsibilities

1. **Uptime**: Keep your node running 24/7
2. **Updates**: Pull latest code when updates are announced
3. **Security**: Protect your validator private key
4. **Monitoring**: Watch for issues and report bugs

## Updating Your Node

```bash
cd /opt/smartchain
git pull
npm install
pm2 restart smartchain-validator
```

## Network Information

| Setting | Value |
|---------|-------|
| **Mainnet Chain ID** | 1337 |
| **Testnet Chain ID** | 13370 |
| **Block Time** | ~1 second |
| **RPC Port** | 8545 |
| **WebSocket Port** | 8546 |

## Validator Private Keys (Development Only)

⚠️ **WARNING**: These keys are PUBLIC and for development only!

| Validator | Private Key |
|-----------|-------------|
| #1 | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| #2 | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| #3 | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| #4 | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |
| #5 | `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a` |

For production, always generate new keys and keep them secret!

## Contact

- **GitHub**: <https://github.com/edisonmliranzo/smartchain>
- **Explorer**: <https://smartchain.fun>
- **RPC**: <https://node.smartchain.fun>
