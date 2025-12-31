/**
 * SmartChain Enterprise - Startup Script
 * 
 * Starts a SmartChain node with enterprise features enabled.
 * 
 * Usage:
 *   npm run enterprise:start -- --node 1 --port 8545
 *   npm run enterprise:start -- --node 2 --port 8546 --peers ws://localhost:8545
 */

import { Blockchain } from './core/blockchain';
import { ChainConfig, Block } from './types';
import EnterpriseNode, { EnterpriseConfig } from './enterprise';
import RPCServer from './api/rpc';
import ExplorerAPI from './api/explorer';
import CryptoUtils from './core/crypto';
import BlockManager from './core/block';
import path from 'path';

// Parse command line arguments
function parseArgs(): {
    nodeNumber: number;
    port: number;
    peers: string[];
    dataDir: string;
} {
    const args = process.argv.slice(2);
    const result = {
        nodeNumber: 1,
        port: 8545,
        peers: [] as string[],
        dataDir: './data'
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--node':
            case '-n':
                result.nodeNumber = parseInt(args[++i]) || 1;
                break;
            case '--port':
            case '-p':
                result.port = parseInt(args[++i]) || 8545;
                break;
            case '--peers':
                result.peers = (args[++i] || '').split(',').filter(p => p);
                break;
            case '--data':
            case '-d':
                result.dataDir = args[++i] || './data';
                break;
        }
    }

    return result;
}

// Default validators for the enterprise network
const DEFAULT_VALIDATORS = [
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Node 1
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Node 2
    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Node 3
];

// Default admin addresses
const DEFAULT_ADMINS = [
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
];

async function main() {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║        SmartChain Enterprise Edition - Private Blockchain      ║');
    console.log('╠═══════════════════════════════════════════════════════════════╣');
    console.log('║  Features:                                                     ║');
    console.log('║  ✓ Multi-Node P2P Networking                                   ║');
    console.log('║  ✓ Role-Based Access Control (RBAC)                            ║');
    console.log('║  ✓ Compliance & Audit Logging                                  ║');
    console.log('║  ✓ Transaction Limits & KYC                                    ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');

    const args = parseArgs();
    const nodeId = CryptoUtils.randomBytes(8);

    console.log(`Starting Node #${args.nodeNumber}...`);
    console.log(`  - Node ID: ${nodeId}`);
    console.log(`  - RPC Port: ${args.port}`);
    console.log(`  - P2P Port: ${args.port + 1000}`);
    console.log(`  - Bootstrap Peers: ${args.peers.length > 0 ? args.peers.join(', ') : 'None (Genesis)'}`);
    console.log('');

    // Create genesis block
    const genesisBlock: Block = BlockManager.createGenesisBlock(1337, Date.now());

    // Chain configuration
    const chainConfig: ChainConfig = {
        chainId: 1337,
        chainName: 'SmartChain Enterprise',
        symbol: 'SMC',
        blockTime: 5000,
        blockGasLimit: BigInt(30000000),
        genesisBlock,
        validators: DEFAULT_VALIDATORS,
        premine: {
            '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266': BigInt('10000000000000000000000000'), // 10M SMC
            '0x70997970C51812dc3A010C7d01b50e0d17dc79C8': BigInt('1000000000000000000000000'),  // 1M SMC
            '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC': BigInt('1000000000000000000000000'),  // 1M SMC
        }
    };

    // Enterprise configuration
    const enterpriseConfig: EnterpriseConfig = {
        network: {
            nodeId,
            role: 'validator',
            port: args.port + 1000, // P2P port
            chainId: chainConfig.chainId,
            privateKey: '', // Would be loaded from keystore in production
            maxPeers: 25,
            bootstrapNodes: args.peers,
            heartbeatInterval: 10000,
            connectionTimeout: 5000
        },
        rbac: {
            requireKYC: false, // Set to true for strict compliance
            defaultRole: 'USER' as any,
            whitelistMode: false, // Set to true for permissioned network
            kycExpiryDays: 365,
            adminAddresses: DEFAULT_ADMINS
        },
        audit: {
            chainId: chainConfig.chainId,
            storagePath: path.join(args.dataDir, `node${args.nodeNumber}`, 'audit'),
            maxEventsInMemory: 1000,
            flushIntervalMs: 5000,
            retentionDays: 365,
            enableConsoleLog: true,
            enableFileLog: true,
            enableCompression: false
        },
        features: {
            enableP2P: true,
            enableRBAC: true,
            enableAudit: true,
            enableKYC: false,
            enableTransactionLimits: true,
            enablePrivateTransactions: false
        }
    };

    // Initialize blockchain
    const blockchain = new Blockchain(chainConfig);
    await blockchain.initialize();

    // Initialize enterprise node
    const enterprise = new EnterpriseNode(blockchain, enterpriseConfig);
    await enterprise.initialize();

    // Start RPC server
    const rpcServer = new RPCServer(blockchain, args.port);
    const explorerApi = new ExplorerAPI(blockchain);

    // Start the combined server
    const app = rpcServer.getApp();
    app.use('/api', explorerApi.getRouter());

    app.listen(args.port, () => {
        console.log(`\n🚀 SmartChain Enterprise Node #${args.nodeNumber} is running!`);
        console.log(`   RPC: http://localhost:${args.port}`);
        console.log(`   P2P: ws://localhost:${args.port + 1000}`);
        console.log(`   Explorer API: http://localhost:${args.port}/api`);
        console.log('');
    });

    // Start block production if this node is a validator
    const validatorIndex = args.nodeNumber - 1;
    if (validatorIndex < DEFAULT_VALIDATORS.length) {
        const validatorAddress = DEFAULT_VALIDATORS[validatorIndex];
        blockchain.startValidating(validatorAddress);
        console.log(`⛏️  Block production started as ${validatorAddress}`);
    }

    // Print stats periodically
    setInterval(() => {
        const stats = enterprise.getStats();
        console.log(`\n📊 Network Stats:`);
        console.log(`   Peers: ${stats.network.peerCount} | Validators: ${stats.network.validatorCount}`);
        console.log(`   Blocks: ${blockchain.getLatestBlockNumber()} | Pending TX: ${blockchain.mempool.getSize()}`);
        console.log(`   Audit Events: ${stats.audit.totalEvents}`);
    }, 30000);

    // Handle shutdown
    process.on('SIGINT', async () => {
        console.log('\nShutting down...');
        await enterprise.shutdown();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('\nShutting down...');
        await enterprise.shutdown();
        process.exit(0);
    });
}

main().catch(console.error);
