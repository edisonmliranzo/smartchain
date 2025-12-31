
import { Wallet } from './wallet';
import * as fs from 'fs';
import * as path from 'path';

// Generate a brand new wallet with mnemonic
const mnemonic = Wallet.generateMnemonic();
console.log('🔐 GENERATED SECURE MNEMONIC:');
console.log('----------------------------------------------------');
console.log(mnemonic);
console.log('----------------------------------------------------');
console.log('⚠️  KEEP THIS SECRET! ANYONE WITH THIS PHRASE CAN ACCESS YOUR FUNDS.');

// Create wallet from this mnemonic
const wallet = Wallet.fromMnemonic(mnemonic);

console.log('\n👛 Wallet Info:');
console.log(`   Address:     ${wallet.address}`);
console.log(`   Private Key: ${wallet.exportPrivateKey()}`);

// Save to a secure file
const secureFile = path.join(process.cwd(), 'secure_wallet.json');
const walletData = {
    address: wallet.address,
    mnemonic: mnemonic,
    privateKey: wallet.exportPrivateKey(),
    createdAt: new Date().toISOString()
};

fs.writeFileSync(secureFile, JSON.stringify(walletData, null, 2));
console.log(`\n💾 Saved wallet details to ${secureFile}`);
console.log('   (Delete this file after backing up safely!)');
