
import * as fs from 'fs';
import * as path from 'path';
import solc from 'solc';
import { ethers } from 'ethers';

const CONTRACT_PATH = path.join(__dirname, '../contracts/Graffiti.sol');
const GENESIS_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

async function main() {
    console.log('🎨 Compiling Graffiti Contract...');

    // 1. Compile
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

    // Check for errors
    if (output.errors) {
        const errors = output.errors.filter((e: any) => e.severity === 'error');
        if (errors.length > 0) {
            console.error('Compilation errors:', errors);
            process.exit(1);
        }
    }

    const compiledContract = output.contracts['Graffiti.sol']['Graffiti'];
    const bytecode = compiledContract.evm.bytecode.object;
    const abi = compiledContract.abi;

    console.log('📄 Contract Compiled!');

    // 2. Save ABI
    const abiPath = path.join(__dirname, '../explorer/src/abis/Graffiti.json');
    const dir = path.dirname(abiPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));

    // 3. Deploy
    console.log('\n🚀 Deploying to SmartChain...');

    // Explicitly define network to avoid auto-detection issues
    const provider = new ethers.JsonRpcProvider('http://localhost:8545', {
        chainId: 1337,
        name: 'smartchain'
    });

    const wallet = new ethers.Wallet(GENESIS_PRIVATE_KEY, provider);
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);

    try {
        const contract = await factory.deploy();
        console.log(`✅ Deployment started! Tx Hash: ${contract.deploymentTransaction()?.hash}`);

        await contract.waitForDeployment();

        const address = await contract.getAddress();
        console.log(`🎉 Contract Address: ${address}`);

        // 4. Save Address
        const addressPath = path.join(__dirname, '../explorer/src/abis/GraffitiAddress.json');
        fs.writeFileSync(addressPath, JSON.stringify({ address }, null, 2));
        console.log(`💾 Saved Address to ${addressPath}`);

    } catch (error) {
        console.error('Deployment failed:', error);
    }
}

main();
