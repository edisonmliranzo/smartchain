// SmartChain Wallet Utility
import { CryptoUtils, TransactionManager } from './core';
import { ethers } from 'ethers';

export class Wallet {
    private privateKey: string;
    private publicKey: string;
    public address: string;
    private provider: ethers.JsonRpcProvider | null = null;
    private chainId: number;

    constructor(privateKey?: string, chainId: number = 1337) {
        if (privateKey) {
            const wallet = CryptoUtils.walletFromPrivateKey(privateKey);
            this.privateKey = wallet.privateKey;
            this.publicKey = wallet.publicKey;
            this.address = wallet.address;
        } else {
            const wallet = CryptoUtils.generateWallet();
            this.privateKey = wallet.privateKey;
            this.publicKey = wallet.publicKey;
            this.address = wallet.address;
        }
        this.chainId = chainId;
    }

    /**
     * Create wallet from mnemonic
     */
    static fromMnemonic(mnemonic: string, path: string = "m/44'/60'/0'/0/0"): Wallet {
        const hdWallet = ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, path);
        return new Wallet(hdWallet.privateKey);
    }

    /**
     * Generate new mnemonic
     */
    static generateMnemonic(): string {
        const wallet = ethers.Wallet.createRandom();
        return wallet.mnemonic!.phrase;
    }

    /**
     * Connect to RPC provider
     */
    connect(rpcUrl: string): void {
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
    }

    /**
     * Get balance
     */
    async getBalance(): Promise<bigint> {
        if (!this.provider) {
            throw new Error('No provider connected');
        }
        return this.provider.getBalance(this.address);
    }

    /**
     * Get nonce
     */
    async getNonce(): Promise<number> {
        if (!this.provider) {
            throw new Error('No provider connected');
        }
        return this.provider.getTransactionCount(this.address);
    }

    /**
     * Sign a message
     */
    async signMessage(message: string): Promise<string> {
        return CryptoUtils.signMessage(message, this.privateKey);
    }

    /**
     * Sign and send transaction
     */
    async sendTransaction(tx: {
        to: string;
        value?: bigint;
        data?: string;
        gasLimit?: bigint;
        gasPrice?: bigint;
        nonce?: number;
    }): Promise<{ hash: string; wait: () => Promise<any> }> {
        if (!this.provider) {
            throw new Error('No provider connected');
        }

        const nonce = tx.nonce ?? await this.getNonce();
        const gasPrice = tx.gasPrice ?? BigInt(1000000000); // 1 gwei default
        const gasLimit = tx.gasLimit ?? BigInt(21000);

        const signedTx = await CryptoUtils.signTransaction({
            to: tx.to,
            value: tx.value ?? BigInt(0),
            data: tx.data ?? '0x',
            gasPrice,
            gasLimit,
            nonce,
            chainId: this.chainId,
        }, this.privateKey);

        // Send via provider
        const response = await this.provider.broadcastTransaction(signedTx.signedTx);

        return {
            hash: response.hash,
            wait: async () => {
                return await response.wait();
            },
        };
    }

    /**
     * Send native tokens
     */
    async sendTokens(to: string, amount: bigint, gasPrice?: bigint): Promise<string> {
        const result = await this.sendTransaction({
            to,
            value: amount,
            gasPrice,
        });
        return result.hash;
    }

    /**
     * Deploy contract
     */
    async deployContract(bytecode: string, gasLimit?: bigint): Promise<{ hash: string; contractAddress: string }> {
        if (!this.provider) {
            throw new Error('No provider connected');
        }

        const nonce = await this.getNonce();
        const contractAddress = CryptoUtils.computeContractAddress(this.address, nonce);

        const result = await this.sendTransaction({
            to: '', // Contract creation
            data: bytecode,
            gasLimit: gasLimit ?? BigInt(3000000),
        });

        return {
            hash: result.hash,
            contractAddress,
        };
    }

    /**
     * Call contract method
     */
    async callContract(
        contractAddress: string,
        abi: any[],
        methodName: string,
        args: any[] = [],
        options?: {
            value?: bigint;
            gasLimit?: bigint;
        }
    ): Promise<string> {
        const data = CryptoUtils.encodeFunctionCall(abi, methodName, args);

        const result = await this.sendTransaction({
            to: contractAddress,
            data,
            value: options?.value,
            gasLimit: options?.gasLimit ?? BigInt(100000),
        });

        return result.hash;
    }

    /**
     * Read contract (view function)
     */
    async readContract(
        contractAddress: string,
        abi: any[],
        methodName: string,
        args: any[] = []
    ): Promise<any> {
        if (!this.provider) {
            throw new Error('No provider connected');
        }

        const contract = new ethers.Contract(contractAddress, abi, this.provider);
        return contract[methodName](...args);
    }

    /**
     * Export private key
     */
    exportPrivateKey(): string {
        return this.privateKey;
    }

    /**
     * Export keystore JSON
     */
    async exportKeystore(password: string): Promise<string> {
        const wallet = new ethers.Wallet(this.privateKey);
        return wallet.encrypt(password);
    }

    /**
     * Import from keystore
     */
    static async fromKeystore(keystore: string, password: string): Promise<Wallet> {
        const wallet = await ethers.Wallet.fromEncryptedJson(keystore, password);
        return new Wallet(wallet.privateKey);
    }

    /**
     * Get wallet info
     */
    getInfo(): { address: string; publicKey: string } {
        return {
            address: this.address,
            publicKey: this.publicKey,
        };
    }
}

export default Wallet;
