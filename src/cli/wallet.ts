// SmartChain CLI Wallet Utility
import { Wallet } from '../wallet';
import { DEV_ACCOUNTS, SERVER_CONFIG } from '../config';
import { TransactionManager, CryptoUtils } from '../core';
import { ethers } from 'ethers';

function generateNewWallet() {
    console.log('\n🔐 Generating New SmartChain Wallet...\n');
    console.log('════════════════════════════════════════════════════════════════════');

    // Generate wallet with mnemonic
    const mnemonic = ethers.Mnemonic.entropyToPhrase(ethers.randomBytes(16));
    const hdWallet = ethers.HDNodeWallet.fromPhrase(mnemonic);

    console.log('\n📋 WALLET DETAILS (SAVE THIS INFORMATION!):\n');
    console.log('────────────────────────────────────────────────────────────────────');
    console.log(`  Address:      ${hdWallet.address}`);
    console.log('────────────────────────────────────────────────────────────────────');
    console.log(`  Private Key:  ${hdWallet.privateKey}`);
    console.log('────────────────────────────────────────────────────────────────────');
    console.log(`  Mnemonic:     ${mnemonic}`);
    console.log('────────────────────────────────────────────────────────────────────');

    console.log('\n⚠️  IMPORTANT SECURITY WARNINGS:\n');
    console.log('  1. NEVER share your private key or mnemonic with anyone!');
    console.log('  2. Store this information in a secure, offline location');
    console.log('  3. Anyone with access to these can control your funds');
    console.log('  4. There is NO way to recover a lost private key\n');

    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('\n📝 To use this wallet as a validator, add to your .env file:\n');
    console.log(`VALIDATOR_PRIVATE_KEY=${hdWallet.privateKey}\n`);
    console.log('════════════════════════════════════════════════════════════════════\n');
}

async function showWalletInfo() {
    console.log('\n💳 SmartChain Development Wallets:');
    console.log('════════════════════════════════════════════════');

    const rpcUrl = `http://127.0.0.1:${SERVER_CONFIG.rpcPort}`;
    console.log(`Connected to: ${rpcUrl}\n`);

    for (let i = 0; i < DEV_ACCOUNTS.length; i++) {
        const accInfo = DEV_ACCOUNTS[i];

        // Skip if private key is redacted
        if (accInfo.privateKey.includes('REDACTED')) {
            console.log(`Account #${i}: [Private key not configured - set in .env]`);
            console.log('────────────────────────────────────────────────');
            continue;
        }

        const wallet = new Wallet(accInfo.privateKey);
        wallet.connect(rpcUrl);

        try {
            const balance = await wallet.getBalance();
            console.log(`Account #${i}:`);
            console.log(`  Address:     ${accInfo.address}`);
            console.log(`  Balance:     ${TransactionManager.formatValue(balance)} SMC`);
            console.log('────────────────────────────────────────────────');
        } catch (error) {
            console.log(`Account #${i}: [Offline - Node not running?]`);
        }
    }
}

async function sendTransaction(fromIdx: number, toAddress: string, amountSMC: string) {
    const rpcUrl = `http://127.0.0.1:${SERVER_CONFIG.rpcPort}`;
    const accInfo = DEV_ACCOUNTS[fromIdx];

    if (!accInfo) {
        console.error('Invalid source account index');
        return;
    }

    if (accInfo.privateKey.includes('REDACTED')) {
        console.error('Private key not configured. Set DEV_KEY in .env file.');
        return;
    }

    const wallet = new Wallet(accInfo.privateKey);
    wallet.connect(rpcUrl);

    const amount = BigInt(parseFloat(amountSMC) * 10 ** 18);

    console.log(`\n📤 Sending ${amountSMC} SMC from Account #${fromIdx} to ${toAddress}...`);

    try {
        const tx = await wallet.sendTransaction({
            to: toAddress,
            value: amount
        });

        console.log(`✅ Transaction Sent!`);
        console.log(`🔗 Hash: ${tx.hash}`);
        console.log(`⏳ Waiting for confirmation...`);

        await tx.wait();
        console.log(`✨ Transaction confirmed in block!`);
    } catch (error: any) {
        console.error(`❌ Error sending transaction: ${error.message}`);
    }
}

function showHelp() {
    console.log('\n📖 SmartChain Wallet CLI\n');
    console.log('Commands:');
    console.log('  npm run wallet generate     - Generate a new wallet');
    console.log('  npm run wallet list         - Show development wallets');
    console.log('  npm run wallet send <from> <to> <amount> - Send SMC');
    console.log('\nExamples:');
    console.log('  npm run wallet generate');
    console.log('  npm run wallet send 0 0x70997970... 100\n');
}

async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        showHelp();
    } else if (args[0] === 'generate' || args[0] === 'new') {
        generateNewWallet();
    } else if (args[0] === 'list') {
        await showWalletInfo();
    } else if (args[0] === 'send') {
        if (args.length < 4) {
            console.log('Usage: npm run wallet send <from_index> <to_address> <amount>');
            console.log('Example: npm run wallet send 0 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 100');
            return;
        }
        await sendTransaction(parseInt(args[1]), args[2], args[3]);
    } else if (args[0] === 'help' || args[0] === '-h' || args[0] === '--help') {
        showHelp();
    } else {
        console.log(`Unknown command: ${args[0]}`);
        showHelp();
    }
}

main().catch(console.error);

