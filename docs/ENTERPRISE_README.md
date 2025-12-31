# SmartChain Enterprise Edition 🏢

Enterprise-grade private blockchain with multi-node support, role-based access control, and compliance features.

## Features

### ✅ Multi-Node P2P Networking

- WebSocket-based peer-to-peer communication
- Automatic node discovery and synchronization
- Block and transaction propagation
- Heartbeat monitoring for network health

### ✅ Role-Based Access Control (RBAC)

- **Admin** - Full network control
- **Validator** - Can produce blocks
- **Operator** - Can deploy contracts
- **User** - Can send transactions
- **Auditor** - Read-only access to all data

### ✅ Compliance & Audit Logging

- Immutable audit trail with hash chain
- All state changes logged
- Query by time, address, or action
- Export compliance reports (JSON/CSV)

### ✅ Access Control

- Whitelist/blacklist addresses
- Transaction limits (daily, monthly, per-tx)
- KYC status tracking
- Contract deployment permissions

---

## Quick Start

### Start a 3-Node Network

Open 3 separate terminals:

**Terminal 1 - Node 1 (Primary Validator):**

```bash
npm run enterprise:node1
```

**Terminal 2 - Node 2:**

```bash
npm run enterprise:node2
```

**Terminal 3 - Node 3:**

```bash
npm run enterprise:node3
```

### Custom Configuration

```bash
npm run enterprise:start -- --node 1 --port 8545 --peers ws://othernode:9545
```

#### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--node`, `-n` | Node number (1, 2, 3...) | 1 |
| `--port`, `-p` | RPC port | 8545 |
| `--peers` | Comma-separated peer addresses | (none) |
| `--data`, `-d` | Data directory | ./data |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SmartChain Enterprise                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │   Node 1    │  │   Node 2    │  │   Node 3    │                │
│  │ (Validator) │  │ (Validator) │  │ (Validator) │                │
│  │  Port 8545  │  │  Port 8546  │  │  Port 8547  │                │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                │
│         │                │                │                        │
│         └────────────────┼────────────────┘                        │
│                          │                                          │
│                   P2P Network Layer                                 │
│         (WebSocket ports 9545, 9546, 9547)                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Default Configuration

### Validators

| Node | Address | Role |
|------|---------|------|
| 1 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | Validator (Admin) |
| 2 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | Validator |
| 3 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | Validator |

### Pre-mined Balances

- Node 1: 10,000,000 SMC
- Node 2: 1,000,000 SMC
- Node 3: 1,000,000 SMC

---

## API Endpoints

### Standard Ethereum JSON-RPC

All standard `eth_*` methods are supported:

- `eth_blockNumber`
- `eth_getBalance`
- `eth_sendRawTransaction`
- `eth_call`
- etc.

### Enterprise Endpoints

#### Get Network Stats

```bash
curl http://localhost:8545/api/enterprise/stats
```

#### Get Audit Logs

```bash
curl http://localhost:8545/api/enterprise/audit?actor=0x...&type=TRANSACTION_EXECUTED
```

#### Get Peer List

```bash
curl http://localhost:8545/api/enterprise/peers
```

---

## File Structure

```
smartchain/
├── src/
│   ├── enterprise/
│   │   ├── p2p/
│   │   │   └── network.ts      # P2P networking
│   │   ├── rbac/
│   │   │   └── roles.ts        # Role-based access
│   │   ├── compliance/
│   │   │   └── audit.ts        # Audit logging
│   │   └── index.ts            # Enterprise module
│   └── enterprise-node.ts      # Startup script
├── data/
│   ├── node1/
│   │   ├── chain_data.json
│   │   └── audit/              # Audit logs
│   ├── node2/
│   └── node3/
```

---

## Security Considerations

### Production Deployment

1. **Use HTTPS/WSS** for all connections
2. **Configure firewall** to restrict P2P ports
3. **Enable KYC** for strict compliance:

   ```typescript
   rbac: {
     requireKYC: true,
     whitelistMode: true,
   }
   ```

4. **Set transaction limits**:

   ```typescript
   rbac.setTransactionLimits(adminAddress, userAddress, {
     dailyLimit: BigInt('100000000000000000000'), // 100 SMC
     maxTransactionValue: BigInt('10000000000000000000'), // 10 SMC
   });
   ```

5. **Backup validator keys** securely
6. **Monitor audit logs** for suspicious activity

---

## Use Cases

### 1. Corporate Internal Ledger

- Track internal transactions
- Audit trail for compliance
- Role-based departmental access

### 2. Supply Chain

- Permissioned participants only
- Immutable tracking records
- Multi-stakeholder validation

### 3. Private DeFi

- Internal token swaps
- Controlled liquidity pools
- Auditable transactions

### 4. Enterprise Asset Management

- Digital asset issuance
- Transfer restrictions
- Compliance reporting

---

## Troubleshooting

### Nodes not connecting

1. Check firewall allows P2P ports (9545-9547)
2. Ensure peer addresses are correct
3. Check console for connection errors

### Blocks not being produced

1. Verify node is in validator list
2. Check if it's the node's turn (round-robin)
3. Review chain_data.json for state issues

### Audit logs not appearing

1. Check data directory permissions
2. Verify `enableFileLog: true`
3. Call `audit.flush()` to force write

---

## License

MIT License - See LICENSE file for details.
