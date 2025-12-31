
import { ethers } from 'ethers';

const TARGET_ADDRESS = '0x5d48b6e11ba673a13f63f8141e204f0aFaE6C863';

async function main() {
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const balance = await provider.getBalance(TARGET_ADDRESS);
    console.log(`Balance: ${balance.toString()} wei`);
    console.log(`Balance: ${ethers.formatEther(balance)} SMC`);
}

main();
