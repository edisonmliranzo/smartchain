
import { Wallet } from '../src/wallet';
import { CHAIN_CONFIG } from '../src/config';
import { config } from 'dotenv';

config(); // Load .env

// Get key from environment variable
const SENDER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.VALIDATOR_PRIVATE_KEY;

if (!SENDER_PRIVATE_KEY) {
    console.error('❌ Error: DEPLOYER_PRIVATE_KEY or VALIDATOR_PRIVATE_KEY not set in .env');
    process.exit(1);
}

// Parse command line arguments or use default
const TARGET_ADDRESS = process.argv[2] || '0x5d48b6e11ba673a13f63f8141e204f0aFaE6C863';
const AMOUNT = BigInt(process.argv[3] || '10000') * BigInt(10 ** 18); // Default 10,000 SMC

async function main() {
    console.log('💰 Funding wallet...');

    const wallet = new Wallet(SENDER_PRIVATE_KEY!);
    wallet.connect('http://localhost:8545');

    console.log(`   From: ${wallet.address}`);
    console.log(`   To:   ${TARGET_ADDRESS}`);
    console.log(`   Amount: ${Number(AMOUNT) / 1e18} SMC`);

    try {
        const hash = await wallet.sendTokens(TARGET_ADDRESS, AMOUNT);
        console.log(`\n✅ Transaction sent! Hash: ${hash}`);
        console.log('   Waiting for confirmation...');

        // Wait for a few seconds for next block
        await new Promise(r => setTimeout(r, 2000));

        const { ethers } = require('ethers');
        const provider = new ethers.JsonRpcProvider('http://localhost:8545');
        const balance = await provider.getBalance(TARGET_ADDRESS);
        console.log(`\n🎉 New Balance: ${(Number(balance) / 1e18).toFixed(2)} SMC`);

    } catch (error) {
        console.error('Failed to send funds:', error);
    }
}

main();
