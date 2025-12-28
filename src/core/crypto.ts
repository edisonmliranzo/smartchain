// SmartChain Cryptographic Utilities
import { ethers } from 'ethers';
import { keccak256 } from 'ethers';

export class CryptoUtils {
    /**
     * Generate Keccak-256 hash of data
     */
    static hash(data: string | Buffer): string {
        if (Buffer.isBuffer(data)) {
            return keccak256(data);
        }
        return keccak256(ethers.toUtf8Bytes(data));
    }

    /**
     * Generate hash from hex string
     */
    static hashHex(hexData: string): string {
        return keccak256(hexData);
    }

    /**
     * Generate a new random wallet
     */
    static generateWallet(): { address: string; privateKey: string; publicKey: string } {
        const wallet = ethers.Wallet.createRandom();
        return {
            address: wallet.address,
            privateKey: wallet.privateKey,
            publicKey: wallet.signingKey.publicKey,
        };
    }

    /**
     * Create wallet from private key
     */
    static walletFromPrivateKey(privateKey: string): { address: string; privateKey: string; publicKey: string } {
        const wallet = new ethers.Wallet(privateKey);
        return {
            address: wallet.address,
            privateKey: wallet.privateKey,
            publicKey: wallet.signingKey.publicKey,
        };
    }

    /**
     * Sign a message with private key
     */
    static async signMessage(message: string, privateKey: string): Promise<string> {
        const wallet = new ethers.Wallet(privateKey);
        return wallet.signMessage(message);
    }

    /**
     * Verify a signed message
     */
    static verifyMessage(message: string, signature: string): string {
        return ethers.verifyMessage(message, signature);
    }

    /**
     * Sign transaction data
     */
    static async signTransaction(tx: {
        to: string | null;
        value: bigint;
        gasPrice: bigint;
        gasLimit: bigint;
        nonce: number;
        data: string;
        chainId: number;
    }, privateKey: string): Promise<{ signedTx: string; hash: string }> {
        const wallet = new ethers.Wallet(privateKey);

        const transaction: ethers.TransactionRequest = {
            to: tx.to || undefined,
            value: tx.value,
            gasPrice: tx.gasPrice,
            gasLimit: tx.gasLimit,
            nonce: tx.nonce,
            data: tx.data || '0x',
            chainId: tx.chainId,
        };

        const signedTx = await wallet.signTransaction(transaction);
        const hash = keccak256(signedTx);

        return { signedTx, hash };
    }

    /**
     * Parse signed transaction
     */
    static parseTransaction(signedTx: string): ethers.TransactionLike {
        return ethers.Transaction.from(signedTx);
    }

    /**
     * Recover address from signed transaction
     */
    static recoverAddress(signedTx: string): string {
        const tx = ethers.Transaction.from(signedTx);
        return tx.from!;
    }

    /**
     * Generate deterministic address from deployer and nonce (CREATE opcode)
     */
    static computeContractAddress(deployerAddress: string, nonce: number): string {
        return ethers.getCreateAddress({ from: deployerAddress, nonce });
    }

    /**
     * Generate deterministic address from CREATE2 opcode
     */
    static computeCreate2Address(from: string, salt: string, initCodeHash: string): string {
        return ethers.getCreate2Address(from, salt, initCodeHash);
    }

    /**
     * Convert number to hex string
     */
    static toHex(value: number | bigint): string {
        return '0x' + value.toString(16);
    }

    /**
     * Convert hex string to number
     */
    static fromHex(hex: string): bigint {
        return BigInt(hex);
    }

    /**
     * Pad hex string to 32 bytes
     */
    static padHex(hex: string, bytes: number = 32): string {
        const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
        return '0x' + clean.padStart(bytes * 2, '0');
    }

    /**
     * Generate random bytes
     */
    static randomBytes(length: number): string {
        return ethers.hexlify(ethers.randomBytes(length));
    }

    /**
     * Check if string is valid address
     */
    static isValidAddress(address: string): boolean {
        return ethers.isAddress(address);
    }

    /**
     * Normalize address to checksum format
     */
    static checksumAddress(address: string): string {
        return ethers.getAddress(address);
    }

    /**
     * Encode function call data
     */
    static encodeFunctionCall(abi: any[], functionName: string, args: any[]): string {
        const iface = new ethers.Interface(abi);
        return iface.encodeFunctionData(functionName, args);
    }

    /**
     * Decode function call data
     */
    static decodeFunctionCall(abi: any[], data: string): { name: string; args: any[] } {
        const iface = new ethers.Interface(abi);
        const decoded = iface.parseTransaction({ data });
        return {
            name: decoded!.name,
            args: Array.from(decoded!.args),
        };
    }

    /**
     * Calculate Merkle root from list of hashes
     */
    static calculateMerkleRoot(hashes: string[]): string {
        if (hashes.length === 0) {
            return '0x' + '0'.repeat(64);
        }

        if (hashes.length === 1) {
            return hashes[0];
        }

        const pairs: string[] = [];
        for (let i = 0; i < hashes.length; i += 2) {
            const left = hashes[i];
            const right = hashes[i + 1] || left;
            pairs.push(this.hashHex(left + right.slice(2)));
        }

        return this.calculateMerkleRoot(pairs);
    }
}

export default CryptoUtils;
