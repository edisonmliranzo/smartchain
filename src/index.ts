// SmartChain Main Entry Point
import express from 'express';
import cors from 'cors';
import path from 'path';
import { Blockchain } from './core';
import { RPCServer, WSServer, ExplorerAPI, AIService, CompilerService } from './api';
import { P2PNetwork } from './network';
import { CHAIN_CONFIG, SERVER_CONFIG, DEV_ACCOUNTS } from './config';

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
    console.log('║                    ██████╗██╗  ██╗ █████╗ ██╗███╗   ██╗      ║');
    console.log('║                   ██╔════╝██║  ██║██╔══██╗██║████╗  ██║      ║');
    console.log('║                   ██║     ███████║███████║██║██╔██╗ ██║      ║');
    console.log('║                   ██║     ██╔══██║██╔══██║██║██║╚██╗██║      ║');
    console.log('║                   ╚██████╗██║  ██║██║  ██║██║██║ ╚████║      ║');
    console.log('║                    ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝      ║');
    console.log('║                                                               ║');
    console.log('║           EVM-Compatible Blockchain • v1.0.0                  ║');
    console.log('║                                                               ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('');

    // Initialize blockchain
    console.log('🔗 Initializing blockchain...');
    const blockchain = new Blockchain(CHAIN_CONFIG);
    await blockchain.initialize();

    // Start JSON-RPC server
    console.log(`🌐 Starting JSON-RPC server on port ${SERVER_CONFIG.rpcPort}...`);
    const rpcServer = new RPCServer(blockchain, SERVER_CONFIG.rpcPort);

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
        // Skip API routes
        if (req.path.startsWith('/api') || req.path === '/') {
            return res.json({ message: 'SmartChain RPC' });
        }
        res.sendFile(path.join(explorerPath, 'index.html'));
    });

    await rpcServer.start();

    // Start WebSocket server
    console.log(`📡 Starting WebSocket server on port ${SERVER_CONFIG.wsPort}...`);
    const wsServer = new WSServer(blockchain, SERVER_CONFIG.wsPort);
    await wsServer.start();

    // Start P2P Network
    const p2pPort = parseInt(process.env.P2P_PORT || '9545');
    const seedNodes = process.env.P2P_SEEDS ? process.env.P2P_SEEDS.split(',') : [];
    console.log(`🔗 Starting P2P network on port ${p2pPort}...`);
    const p2pNetwork = new P2PNetwork(blockchain, p2pPort, seedNodes);

    // Set validator key if available (for block signing)
    const validatorKey = process.env.VALIDATOR_PRIVATE_KEY;
    if (validatorKey) {
        p2pNetwork.setValidatorKey(validatorKey);
    }

    await p2pNetwork.start();
    console.log(`🌐 P2P network started with ${seedNodes.length} seed nodes`);

    // Start mining if enabled
    if (SERVER_CONFIG.enableMining) {
        const validatorAddress = CHAIN_CONFIG.validators[0];
        if (validatorAddress) {
            console.log('⛏️  Starting block production (PoA)...');
            blockchain.startValidating(validatorAddress);
        }
    }

    // Print summary
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('  🚀 SmartChain is running!');
    console.log('');
    console.log(`  Chain ID:        ${CHAIN_CONFIG.chainId}`);
    console.log(`  Symbol:          ${CHAIN_CONFIG.symbol}`);
    console.log(`  Block Time:      ${CHAIN_CONFIG.blockTime / 1000}s`);
    console.log(`  Gas Limit:       ${CHAIN_CONFIG.blockGasLimit.toString()}`);
    console.log('');
    console.log('  📡 Endpoints:');
    console.log(`     RPC:          http://localhost:${SERVER_CONFIG.rpcPort}`);
    console.log(`     WebSocket:    ws://localhost:${SERVER_CONFIG.wsPort}`);
    console.log(`     P2P:          ws://localhost:${p2pPort}`);
    console.log(`     Explorer API: http://localhost:${SERVER_CONFIG.rpcPort}/api`);
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
    console.log(`     Network Name:  ${CHAIN_CONFIG.chainName}`);
    console.log(`     RPC URL:       http://localhost:${SERVER_CONFIG.rpcPort}`);
    console.log(`     Chain ID:      ${CHAIN_CONFIG.chainId}`);
    console.log(`     Symbol:        ${CHAIN_CONFIG.symbol}`);
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    // Handle blockchain events
    blockchain.on('newBlock', (block) => {
        console.log(`📦 Block #${block.header.number} mined | Txs: ${block.transactions.length} | Gas: ${block.header.gasUsed}`);
    });

    blockchain.on('pendingTransaction', (tx) => {
        console.log(`📝 New pending tx: ${tx.hash.slice(0, 18)}... | From: ${tx.from.slice(0, 10)}... | Value: ${tx.value}`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down SmartChain...');
        blockchain.stopValidating();
        wsServer.close();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('\n🛑 Shutting down SmartChain...');
        blockchain.stopValidating();
        wsServer.close();
        process.exit(0);
    });
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
