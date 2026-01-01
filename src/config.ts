// SmartChain Configuration
import { ChainConfig } from './types';
import { BlockManager } from './core/block';
import { CryptoUtils } from './core/crypto';

// Validator accounts for PoA consensus
// Each validator takes turns producing blocks (round-robin)
// To become a validator, contact the network admin with your address
export const VALIDATORS = [
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Validator 1 (Genesis Validator - Edison)
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', // Validator 2 
    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', // Validator 3
    '0x90F79bf6EB2c4f870365E785982E1f101E93b906', // Validator 4
    '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', // Validator 5
];

// Pre-mined accounts (for testing)
export const PREMINE: { [address: string]: bigint } = {
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266': BigInt(1000000000) * BigInt(10 ** 18), // 1 Billion SMC
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8': BigInt(500000000) * BigInt(10 ** 18),  // 500 Million SMC
    '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC': BigInt(1000000) * BigInt(10 ** 18),    // 1M SMC
};

// Development accounts (with private keys for testing)
export const DEV_ACCOUNTS = [
    {
        address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        balance: '1,000,000,000 SMC',
    },
    {
        address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
        balance: '500,000,000 SMC',
    },
    {
        address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
        balance: '1,000,000 SMC',
    },
];

// Chain configuration
export const CHAIN_CONFIG: ChainConfig = {
    chainId: 1337, // Local development chain
    chainName: 'SmartChain',
    symbol: 'SMC',
    blockTime: 1000, // 1 second (Turbo Mode)
    blockGasLimit: BigInt(100000000), // 100M gas
    genesisBlock: {
        header: {
            number: 0,
            timestamp: Date.now(),
            parentHash: '0x' + '0'.repeat(64),
            stateRoot: '0x' + '0'.repeat(64),
            transactionsRoot: '0x' + '0'.repeat(64),
            receiptsRoot: '0x' + '0'.repeat(64),
            miner: '0x0000000000000000000000000000000000000000',
            difficulty: BigInt(1),
            gasLimit: BigInt(100000000), // Match block gas limit (Cheap & Fair: High Capacity)
            gasUsed: BigInt(0),
            extraData: '0x',
            nonce: '0x0000000000000000',
            mixHash: '0x' + '0'.repeat(64),
        },
        transactions: [],
        hash: '',
        size: 0,
    },
    validators: VALIDATORS,
    premine: PREMINE,
};

// Server configuration
export const SERVER_CONFIG = {
    rpcPort: parseInt(process.env.RPC_PORT || '8545'),
    wsPort: parseInt(process.env.WS_PORT || '8546'),
    explorerPort: parseInt(process.env.EXPLORER_PORT || '3001'),
    enableMining: process.env.ENABLE_MINING !== 'false',
    logLevel: process.env.LOG_LEVEL || 'info',
};

// Network presets
export const NETWORK_PRESETS = {
    local: {
        chainId: 1337,
        chainName: 'SmartChain Local',
        blockTime: 3000,
    },
    testnet: {
        chainId: 13370,
        chainName: 'SmartChain Testnet',
        blockTime: 5000,
    },
    mainnet: {
        chainId: 1338,
        chainName: 'SmartChain Mainnet',
        blockTime: 12000,
    },
};

/**
 * Get chain config for a network
 */
export function getChainConfig(network: 'local' | 'testnet' | 'mainnet' = 'local'): ChainConfig {
    const preset = NETWORK_PRESETS[network];
    return {
        ...CHAIN_CONFIG,
        chainId: preset.chainId,
        chainName: preset.chainName,
        blockTime: preset.blockTime,
    };
}

/**
 * Generate new validator key
 */
export function generateValidatorKey(): { address: string; privateKey: string } {
    return CryptoUtils.generateWallet();
}

export default CHAIN_CONFIG;
