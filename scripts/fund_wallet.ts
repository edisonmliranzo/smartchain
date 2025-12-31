
import { Wallet } from '../src/wallet';
import { CHAIN_CONFIG } from '../src/config';

// Genesis Account (Account #0 from config)
const GENESIS_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const TARGET_ADDRESS = '0x5d48b6e11ba673a13f63f8141e204f0aFaE6C863';
const AMOUNT = BigInt(10000) * BigInt(10 ** 18); // 10,000 SMC

async function main() {
    console.log('💰 Funding wallet...');

    const wallet = new Wallet(GENESIS_PRIVATE_KEY);
    wallet.connect('http://localhost:8545');

    console.log(`   From: ${wallet.address}`);
    console.log(`   To:   ${TARGET_ADDRESS}`);
    console.log(`   Amount: 10,000 SMC`);

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
