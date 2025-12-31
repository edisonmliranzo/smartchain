
import * as fs from 'fs';
import * as path from 'path';
import solc from 'solc';
import { Wallet } from '../src/wallet';

const CONTRACT_PATH = path.join(__dirname, '../contracts/Graffiti.sol');
const GENESIS_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

async function main() {
    console.log('🎨 Compiling Graffiti Contract...');

    const source = fs.readFileSync(CONTRACT_PATH, 'utf8');
    const input = {
        language: 'Solidity',
        sources: {
            'Graffiti.sol': {
                content: source,
            },
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['*'],
                },
            },
        },
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    if (output.errors) {
        let hasError = false;
        output.errors.forEach((err: any) => {
            if (err.severity === 'error') hasError = true;
            console.error(err.formattedMessage);
        });
        if (hasError) process.exit(1);
    }

    const contract = output.contracts['Graffiti.sol']['Graffiti'];
    const bytecode = contract.evm.bytecode.object;
    const abi = contract.abi;

    console.log('📄 Contract Compiled!');

    // Save ABI for frontend
    const abiPath = path.join(__dirname, '../explorer/src/abis/Graffiti.json');
    // Ensure dir exists
    const dir = path.dirname(abiPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
    console.log(`💾 Saved ABI to ${abiPath}`);

    // Deploy
    console.log('\n🚀 Deploying to SmartChain...');
    const wallet = new Wallet(GENESIS_PRIVATE_KEY);
    wallet.connect('http://localhost:8545');

    try {
        const result = await wallet.deployContract('0x' + bytecode, BigInt(3000000));
        console.log(`✅ Deployment TX: ${result.hash}`);
        console.log('   Waiting for confirmation...');

        await new Promise(r => setTimeout(r, 2000));

        // We really should use wait() but for this script simplistic wait is fine
        // Actually, let's just assume it mined effectively instantly on local dev

        console.log(`🎉 Contract Address: ${result.contractAddress}`);

        // Save address to a file for the frontend to read, or we can just log it
        const addressPath = path.join(__dirname, '../explorer/src/abis/GraffitiAddress.json');
        fs.writeFileSync(addressPath, JSON.stringify({ address: result.contractAddress }, null, 2));
        console.log(`💾 Saved Address to ${addressPath}`);

    } catch (error) {
        console.error('Failed to deploy:', error);
    }
}

main();
