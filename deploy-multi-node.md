---
description: Guide to deploying SmartChain nodes to servers and setting up a multi-validator network.
---

# Deploying SmartChain Multi-Node Validators

This guide explains how to take your local SmartChain, deploy it to a remote Linux server (VPS), and configure it to run as part of a multi-validator network.

## Prerequisites

1. **VPS Server:** A Linux server (Ubuntu 22.04 LTS recommended) with at least 4GB RAM and 2 vCPUs. (Providers: DigitalOcean, AWS, Vultr, Hetzner).
2. **Domain (Optional):** A domain name pointing to your server's IP (e.g., `node1.smartchain.network`).
3. **SSH Access:** You must have root/sudo access to the server.

---

## Part 1: Server Preparation

Run these commands on your remote server to prepare the environment.

### 1. Update System

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential
```

### 2. Install Node.js (v18+)

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2 typescript ts-node
```

### 3. Open Firewall Ports

Allow traffic for P2P peering and API access.

```bash
sudo ufw allow 22/tcp       # SSH
sudo ufw allow 8545/tcp     # RPC API
sudo ufw allow 8546/tcp     # WebSocket / P2P
sudo ufw allow 3001/tcp     # Explorer (if hosting explorer)
sudo ufw enable
```

---

## Part 2: Deploying the Node

### 1. Clone Repository (On Server)

```bash
git clone https://github.com/edisonmliranzo/smartchain.git
cd smartchain
npm install
```

### 2. Configure Environment

Create a `.env` file on the server.

```bash
nano .env
```

Paste your configuration (different for each node):

```env
# Node 1 (.env)
RPC_PORT=8545
WS_PORT=8546
ENABLE_MINING=true
# Private Key for Validator 1
VALIDATOR_KEY=0x...
OPENAI_API_KEY=sk-... (If using AI features)
```

### 3. Build and Run

```bash
npm run build
pm2 start dist/index.js --name "smartchain-node"
pm2 save
pm2 logs
```

---

## Part 3: Establishing the Multi-Validator Network

To move from a single local node to a network of nodes, we need to update the codebase to support **Peering** and **Round-Robin Consensus**.

### 1. Update `config.ts`

You must hardcode the addresses of **ALL** authorized validators in the code before deployment. This list must be identical on all nodes.

```typescript
// src/config.ts
export const VALIDATORS = [
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Node 1 (Local/Dev)
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Node 2 (VPS 1)
    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Node 3 (VPS 2)
];
```

### 2. Implement Round-Robin Mining (Code Change Required)

Update `src/core/blockchain.ts` to ensure nodes take turns.

```typescript
// Pseudo-code for mineBlock check
const currentValidatorIndex = blockNumber % VALIDATORS.length;
const expectedMiner = VALIDATORS[currentValidatorIndex];

if (myAddress !== expectedMiner) {
    console.log(`Not my turn! Waiting for ${expectedMiner}`);
    return;
}
```

### 3. Implement P2P Peering (Code Change Required)

Update `src/api/websocket.ts` to connect to other nodes.

```typescript
// Add to WSServer
connectToPeer(peerUrl: string) {
    const ws = new WebSocket(peerUrl);
    ws.on('open', () => {
        console.log(`Connected to peer: ${peerUrl}`);
        // Perform handshake and sync chain...
    });
}
```

### 4. Genesis Block Sync

**Crucial:** All nodes must start with the **EXACT SAME** `data/chain_data.json` (or at least the same Genesis Block hash).

- **Option A:** Copy your local `chain_data.json` to the VPS before starting.
- **Option B:** Implement a "Sync from Peer" feature where a new node downloads the chain from an existing node.

---

## Part 4: Managing the Network

### Adding a New Validator

1. Generate a new wallet (address + private key).
2. Update `config.ts` on **ALL** existing nodes to include the new address.
3. Rebuild and restart all nodes. (This requires a hard fork or a governance contract in a mature chain, but for now, a manual restart works).

### Monitor Network

Check logs to see nodes taking turns:

```
[Node 1] Mined Block 100
[Node 2] Received Block 100 from Peer
[Node 2] Mined Block 101
[Node 1] Received Block 101 from Peer
```
