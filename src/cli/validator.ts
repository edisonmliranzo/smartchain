
import { program } from 'commander';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const RPC_URL = process.env.RPC_URL || 'http://localhost:8545';

program
    .name('smartchain-validator')
    .description('Full-featured CLI for SmartChain Validators')
    .version('1.0.0');

// Command: status
program
    .command('status')
    .description('Check the status of your validator node')
    .action(async () => {
        try {
            console.log('📡 Connecting to local node...');
            const provider = new ethers.JsonRpcProvider(RPC_URL);

            // Get data
            const blockNumber = await provider.getBlockNumber();
            const chainId = (await provider.getNetwork()).chainId;
            const peers = await provider.send('net_peerCount', []); // Mock if needed
            const isSyncing = await provider.send('eth_syncing', []);

            // Check if we are a validator
            const validatorKey = process.env.VALIDATOR_PRIVATE_KEY;
            let validatorStatus = 'NOT CONFIGURED';
            let validatorAddr = 'N/A';
            let balance = '0';

            if (validatorKey) {
                const wallet = new ethers.Wallet(validatorKey, provider);
                validatorAddr = wallet.address;
                const balWei = await provider.getBalance(validatorAddr);
                balance = ethers.formatEther(balWei);

                // Check if active (simulated logic)
                validatorStatus = 'CONFIGURED (Ready)';
            }

            console.log('\n╔════════════════════════════════════════╗');
            console.log('║       VALIDATOR NODE STATUS            ║');
            console.log('╠════════════════════════════════════════╣');
            console.log(`║ 🌍 Network:      SmartChain (ID: ${chainId}) `);
            console.log(`║ 📦 Block Height: ${blockNumber}              `);
            console.log(`║ 👥 Peers:        ${parseInt(peers, 16)} connected           `);
            console.log(`║ 🔄 Sync Status:  ${isSyncing ? 'Syncing...' : 'Synced'}          `);
            console.log('╠════════════════════════════════════════╣');
            console.log('║           VALIDATOR IDENTITY           ║');
            console.log('╠════════════════════════════════════════╣');
            console.log(`║ 🔑 Status:       ${validatorStatus} `);
            console.log(`║ 👤 Address:      ${validatorAddr.slice(0, 10)}...${validatorAddr.slice(-6)} `);
            console.log(`║ 💰 Balance:      ${parseFloat(balance).toFixed(4)} SMC       `);
            console.log('╚════════════════════════════════════════╝\n');

        } catch (error: any) {
            console.error('❌ Error connecting to node:', error.message);
            console.log('   Ensure your node is running with `npm start`');
        }
    });

// Command: health
program
    .command('health')
    .description('Run a health check on the node')
    .action(async () => {
        try {
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const t1 = Date.now();
            await provider.getBlockNumber();
            const latency = Date.now() - t1;

            console.log(`✅ RPC Latency: ${latency}ms`);
            if (latency > 1000) console.warn('⚠️  High Latency!');

            // Verify P2P port
            // (Simple check if process is running logic could go here)
            console.log('✅ Node is responsive');

        } catch (error) {
            console.error('❌ Node Unresponsive!');
        }
    });

program.parse(process.argv);
