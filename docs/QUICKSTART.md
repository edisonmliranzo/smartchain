# 🚀 SmartChain Validator - Quick Start

Run a SmartChain validator node in 5 minutes!

---

## One-Command Install (Ubuntu 22.04)

SSH into your VPS as root and run:

```bash
curl -sSL https://raw.githubusercontent.com/edisonmliranzo/smartchain/main/scripts/install.sh | bash
```

---

## After Installation

### Step 1: Generate Your Wallet

```bash
cd /opt/smartchain
npm run wallet generate
```

**Save the output!** You'll get:

- Address (your validator address)
- Private Key (KEEP SECRET!)
- Mnemonic (backup phrase)

### Step 2: Configure Your Node

```bash
nano /opt/smartchain/.env
```

Add your private key:

```
VALIDATOR_PRIVATE_KEY=0x...your_key_here...
```

Save and exit (Ctrl+X, Y, Enter)

### Step 3: Start the Node

```bash
cd /opt/smartchain
pm2 start npm --name "smartchain" -- start
pm2 save
pm2 startup
```

### Step 4: Verify It's Running

```bash
pm2 status
pm2 logs smartchain
```

---

## Quick Check

Test your node:

```bash
curl http://localhost:8545
```

Should return: `{"message":"SmartChain RPC"}`

---

## Network Info

| Setting | Value |
|---------|-------|
| **Chain ID** | 1337 |
| **Symbol** | SMC |
| **RPC** | <https://node.smartchain.fun> |
| **P2P** | ws://161.97.150.119:9545 |

---

## Connect to MetaMask

1. Open MetaMask
2. Add Network → Add Manually
3. Enter:
   - Network: `SmartChain`
   - RPC: `http://YOUR_VPS_IP:8545`
   - Chain ID: `1337`
   - Symbol: `SMC`

---

## Troubleshooting

### Node won't start?

```bash
pm2 logs smartchain --lines 50
```

### Port in use?

```bash
lsof -i :8545
```

### Need help?

- GitHub: <https://github.com/edisonmliranzo/smartchain>
- Explorer: <https://smartchain.fun>

---

## Updates

Pull latest code:

```bash
cd /opt/smartchain
git pull
npm install
pm2 restart smartchain
```

---

## Monitoring & Maintenance

We provide a built-in CLI tool to monitor your validator's health:

```bash
# Check status (Block height, Peers, Sync)
npm run validator status

# Check health (Latency)
npm run validator health
```

### Fault Tolerance

The network now supports **Auto-Skip**. If a validator goes offline and misses their turn (block time > 2s), the network will automatically skip to the next available validator to ensure the chain keeps moving.

---

**Happy validating! 🎉**
