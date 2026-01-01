// SmartChain Testnet Entry Point
import express from 'express';
import cors from 'cors';
import path from 'path';
import { Blockchain } from './core';
import { RPCServer, WSServer, ExplorerAPI, AIService, CompilerService } from './api';
import { getChainConfig, DEV_ACCOUNTS } from './config';

// Testnet configuration
const TESTNET_CONFIG = {
    rpcPort: 8546,
    wsPort: 8547,
    enableMining: true,
};

async function main() {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                                                               ║');
    console.log('║   ███████╗███╗   ███╗ █████╗ ██████╗ ████████╗               ║');
    console.log('║   ██╔════╝████╗ ████║██╔══██╗██╔══██╗╚══██╔══╝               ║');
    console.log('║   ███████╗██╔████╔██║███████║██████╔╝   ██║                  ║');
    console.log('║   ╚════██║██║╚██╔╝██║██╔══██║██╔══██╗   ██║                  ║');
    console.log('║   ███████║██║ ╚═╝ ██║██║  ██║██║  ██║   ██║                  ║');
    console.log('║   ╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝                  ║');
    console.log('║                    ████████╗███████╗███████╗████████╗        ║');
    console.log('║                    ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝        ║');
    console.log('║                       ██║   █████╗  ███████╗   ██║           ║');
    console.log('║                       ██║   ██╔══╝  ╚════██║   ██║           ║');
    console.log('║                       ██║   ███████╗███████║   ██║           ║');
    console.log('║                       ╚═╝   ╚══════╝╚══════╝   ╚═╝           ║');
    console.log('║                                                               ║');
    console.log('║           SmartChain TESTNET • v1.0.0                         ║');
    console.log('║                                                               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');

    // Get testnet chain config
    const chainConfig = getChainConfig('testnet');

    // Initialize blockchain with testnet config
    console.log('🔗 Initializing TESTNET blockchain...');
    const blockchain = new Blockchain(chainConfig, 'testnet');
    await blockchain.initialize();

    // Start JSON-RPC server
    console.log(`🌐 Starting TESTNET JSON-RPC server on port ${TESTNET_CONFIG.rpcPort}...`);
    const rpcServer = new RPCServer(blockchain, TESTNET_CONFIG.rpcPort);

    // Add Explorer API to RPC server
    const explorerAPI = new ExplorerAPI(blockchain);
    rpcServer.getApp().use('/api', explorerAPI.getRouter());

    // Add AI Service
    const aiService = new AIService();
    rpcServer.getApp().use('/api/ai', aiService.getRouter());

    // Add Compiler Service
    const compilerService = new CompilerService();
    rpcServer.getApp().use('/api/compiler', compilerService.getRouter());

    // Serve static files for explorer UI
    const explorerPath = path.join(__dirname, '..', 'explorer', 'dist');
    rpcServer.getApp().use(express.static(explorerPath));
    rpcServer.getApp().get('*', (req, res) => {
        if (req.path.startsWith('/api') || req.path === '/') {
            return res.json({ message: 'SmartChain TESTNET RPC' });
        }
        res.sendFile(path.join(explorerPath, 'index.html'));
    });

    await rpcServer.start();

    // Start WebSocket server
    console.log(`📡 Starting TESTNET WebSocket server on port ${TESTNET_CONFIG.wsPort}...`);
    const wsServer = new WSServer(blockchain, TESTNET_CONFIG.wsPort);
    await wsServer.start();

    // Start mining if enabled
    if (TESTNET_CONFIG.enableMining) {
        const validatorAddress = chainConfig.validators[0];
        if (validatorAddress) {
            console.log('⛏️  Starting TESTNET block production (PoA)...');
            blockchain.startValidating(validatorAddress);
        }
    }

    // Print summary
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('  🧪 SmartChain TESTNET is running!');
    console.log('');
    console.log(`  Chain ID:        ${chainConfig.chainId}`);
    console.log(`  Symbol:          ${chainConfig.symbol}`);
    console.log(`  Block Time:      ${chainConfig.blockTime / 1000}s`);
    console.log(`  Gas Limit:       ${chainConfig.blockGasLimit.toString()}`);
    console.log('');
    console.log('  📡 Endpoints:');
    console.log(`     RPC:          http://localhost:${TESTNET_CONFIG.rpcPort}`);
    console.log(`     WebSocket:    ws://localhost:${TESTNET_CONFIG.wsPort}`);
    console.log('');
    console.log('  💳 Development Accounts (DO NOT USE IN PRODUCTION):');
    console.log('');

    for (let i = 0; i < DEV_ACCOUNTS.length; i++) {
        const account = DEV_ACCOUNTS[i];
        if (account) {
            console.log(`  Account #${i}:`);
            console.log(`     Address:     ${account.address}`);
            console.log(`     Private Key: ${account.privateKey}`);
            console.log(`     Balance:     ${account.balance}`);
            console.log('');
        }
    }

    console.log('  📖 Connect with MetaMask:');
    console.log(`     Network Name:  SmartChain Testnet`);
    console.log(`     RPC URL:       https://testnet.smartchain.fun`);
    console.log(`     Chain ID:      ${chainConfig.chainId}`);
    console.log(`     Symbol:        ${chainConfig.symbol}`);
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    // Handle blockchain events
    blockchain.on('newBlock', (block) => {
        console.log(`📦 [TESTNET] Block #${block.header.number} | Txs: ${block.transactions.length} | Gas: ${block.header.gasUsed}`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down SmartChain TESTNET...');
        blockchain.stopValidating();
        wsServer.close();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('\n🛑 Shutting down SmartChain TESTNET...');
        blockchain.stopValidating();
        wsServer.close();
        process.exit(0);
    });
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
