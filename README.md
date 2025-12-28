# 🔗 SmartChain

> **A fully functional EVM-compatible blockchain built from scratch**

SmartChain is a complete blockchain implementation featuring Proof of Authority (PoA) consensus, an EVM-compatible execution environment, JSON-RPC API, WebSocket subscriptions, and a beautiful web-based block explorer.

![SmartChain Banner](https://img.shields.io/badge/SmartChain-v1.0.0-7c3aed?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-06b6d4?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge)

## ✨ Features

### Core Blockchain
- **Block Management** - Full block creation, validation, and storage
- **Transaction Processing** - Sign, validate, and execute transactions
- **State Management** - Account balances, nonces, contract storage
- **Merkle Trees** - State root and transaction root computation

### EVM Compatibility
- **Smart Contracts** - Deploy and interact with Solidity contracts
- **Contract Execution** - Basic EVM execution for common operations
- **Gas Metering** - Accurate gas calculation and limits

### Consensus
- **Proof of Authority (PoA)** - Fast block finality with trusted validators
- **Block Production** - Automatic block mining at configurable intervals
- **Validator Management** - Configure authorized block producers

### API & Networking
- **JSON-RPC API** - Full Ethereum-compatible RPC interface
- **WebSocket** - Real-time block and transaction subscriptions
- **REST API** - Explorer-friendly endpoints for querying data

### Block Explorer
- **Dashboard** - Chain stats, latest blocks, and transactions
- **Block Details** - View complete block information
- **Transaction Details** - Track transaction status and receipts
- **Address Lookup** - Check balances and transaction history
- **Faucet** - Get test tokens for development

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/edisonmliranzo/smartchain.git
cd smartchain

# Install dependencies
npm install

# Start the blockchain node
npm start
```

### Output

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ███████╗███╗   ███╗ █████╗ ██████╗ ████████╗               ║
║   ██╔════╝████╗ ████║██╔══██╗██╔══██╗╚══██╔══╝               ║
║   ███████╗██╔████╔██║███████║██████╔╝   ██║                  ║
║   ╚════██║██║╚██╔╝██║██╔══██║██╔══██╗   ██║                  ║
║   ███████║██║ ╚═╝ ██║██║  ██║██║  ██║   ██║                  ║
║   ╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝                  ║
║                    ██████╗██╗  ██╗ █████╗ ██╗███╗   ██╗      ║
║                   ██╔════╝██║  ██║██╔══██╗██║████╗  ██║      ║
║                   ██║     ███████║███████║██║██╔██╗ ██║      ║
║                   ██║     ██╔══██║██╔══██║██║██║╚██╗██║      ║
║                   ╚██████╗██║  ██║██║  ██║██║██║ ╚████║      ║
║                    ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝      ║
║                                                               ║
║           EVM-Compatible Blockchain • v1.0.0                  ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

  🚀 SmartChain is running!

  Chain ID:        1337
  Symbol:          SMC
  Block Time:      3s
  Gas Limit:       30000000

  📡 Endpoints:
     RPC:          http://localhost:8545
     WebSocket:    ws://localhost:8546
     Explorer API: http://localhost:8545/api
```

### Running the Block Explorer

```bash
# In a new terminal
cd explorer
npm install
npm run dev
```

Open http://localhost:5173 to view the explorer.

## 📖 Usage

### Connect with MetaMask

1. Open MetaMask
2. Click "Add Network"
3. Enter the following:
   - **Network Name:** SmartChain
   - **RPC URL:** http://localhost:8545
   - **Chain ID:** 1337
   - **Currency Symbol:** SMC

### Development Accounts

⚠️ **DO NOT USE IN PRODUCTION** - These are for testing only!

| Account | Address | Private Key |
|---------|---------|-------------|
| #0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| #1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| #2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |

Each account is pre-funded with **1,000,000 SMC**.

### Using the JSON-RPC API

```javascript
// Using ethers.js
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('http://localhost:8545');

// Get block number
const blockNumber = await provider.getBlockNumber();
console.log('Current block:', blockNumber);

// Get balance
const balance = await provider.getBalance('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
console.log('Balance:', ethers.formatEther(balance), 'SMC');

// Send transaction
const wallet = new ethers.Wallet(
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  provider
);

const tx = await wallet.sendTransaction({
  to: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
  value: ethers.parseEther('10'),
});

await tx.wait();
console.log('Transaction confirmed:', tx.hash);
```

### Deploy a Smart Contract

```javascript
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('http://localhost:8545');
const wallet = new ethers.Wallet(
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  provider
);

// Simple ERC20 bytecode (example)
const bytecode = '0x...'; // Your compiled contract bytecode
const abi = [...]; // Your contract ABI

const factory = new ethers.ContractFactory(abi, bytecode, wallet);
const contract = await factory.deploy();
await contract.waitForDeployment();

console.log('Contract deployed at:', await contract.getAddress());
```

## 🔌 API Reference

### JSON-RPC Methods

SmartChain supports all standard Ethereum JSON-RPC methods:

| Method | Description |
|--------|-------------|
| `eth_blockNumber` | Get current block number |
| `eth_getBlockByNumber` | Get block by number |
| `eth_getBlockByHash` | Get block by hash |
| `eth_getTransactionByHash` | Get transaction details |
| `eth_getTransactionReceipt` | Get transaction receipt |
| `eth_getBalance` | Get account balance |
| `eth_getTransactionCount` | Get account nonce |
| `eth_sendRawTransaction` | Send signed transaction |
| `eth_call` | Call contract method |
| `eth_estimateGas` | Estimate gas for transaction |
| `eth_gasPrice` | Get current gas price |
| `eth_chainId` | Get chain ID |

### SmartChain-Specific Methods

| Method | Description |
|--------|-------------|
| `smc_getValidators` | Get list of validators |
| `smc_getNodeInfo` | Get node information |
| `smc_getMempoolStats` | Get mempool statistics |
| `smc_getRecentBlocks` | Get recent blocks |
| `smc_faucet` | Request test tokens |

### REST API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chain/info` | GET | Chain configuration |
| `/api/chain/stats` | GET | Chain statistics |
| `/api/blocks` | GET | List blocks |
| `/api/blocks/:id` | GET | Block details |
| `/api/transactions` | GET | List transactions |
| `/api/transactions/:hash` | GET | Transaction details |
| `/api/accounts/:address` | GET | Account details |
| `/api/faucet` | POST | Request test tokens |

## 🏗️ Architecture

```
smartchain/
├── src/
│   ├── core/               # Blockchain core
│   │   ├── block.ts        # Block management
│   │   ├── blockchain.ts   # Main blockchain class
│   │   ├── crypto.ts       # Cryptographic utilities
│   │   ├── evm.ts          # EVM executor
│   │   ├── mempool.ts      # Transaction pool
│   │   ├── state.ts        # State management
│   │   └── transaction.ts  # Transaction handling
│   ├── api/                # API servers
│   │   ├── rpc.ts          # JSON-RPC server
│   │   ├── websocket.ts    # WebSocket server
│   │   └── explorer.ts     # REST API
│   ├── types/              # TypeScript types
│   ├── config.ts           # Configuration
│   ├── wallet.ts           # Wallet utilities
│   └── index.ts            # Entry point
└── explorer/               # Block explorer UI
    └── src/
        ├── components/     # React components
        ├── pages/          # Page components
        └── api.ts          # API client
```

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `RPC_PORT` | 8545 | JSON-RPC server port |
| `WS_PORT` | 8546 | WebSocket server port |
| `ENABLE_MINING` | true | Enable block production |
| `LOG_LEVEL` | info | Logging level |

### Chain Configuration

Edit `src/config.ts` to customize:

```typescript
export const CHAIN_CONFIG: ChainConfig = {
  chainId: 1337,           // Chain ID
  chainName: 'SmartChain', // Network name
  symbol: 'SMC',           // Currency symbol
  blockTime: 3000,         // Block time in ms
  blockGasLimit: BigInt(30000000),
  validators: [...],       // Validator addresses
  premine: {...},          // Initial allocations
};
```

## 🛠️ Development

### Scripts

```bash
npm start           # Run the blockchain node
npm run dev         # Run with auto-reload
npm run build       # Build for production
npm run explorer:dev # Run explorer in dev mode
```

### Testing with curl

```bash
# Get block number
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# Get balance
curl -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","latest"],"id":1}'
```

## 📚 Documentation

- [JSON-RPC API](./docs/rpc.md)
- [Architecture](./docs/architecture.md)
- [Smart Contracts](./docs/contracts.md)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Ethereum](https://ethereum.org) - For the EVM specification
- [ethers.js](https://ethers.org) - For cryptographic utilities
- [ethereumjs](https://github.com/ethereumjs) - For reference implementations

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/edisonmliranzo">Edison Liranzo</a>
</p>
