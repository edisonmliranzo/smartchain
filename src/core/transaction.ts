// SmartChain Transaction Management
import { Transaction, SignedTransaction, PendingTransaction } from '../types';
import CryptoUtils from './crypto';
import { ethers } from 'ethers';

export class TransactionManager {
    /**
     * Create a new transaction
     */
    static createTransaction(params: {
        from: string;
        to: string | null;
        value: bigint;
        gasPrice: bigint;
        gasLimit: bigint;
        nonce: number;
        data?: string;
    }): Omit<Transaction, 'hash' | 'v' | 'r' | 's'> {
        return {
            nonce: params.nonce,
            from: CryptoUtils.checksumAddress(params.from),
            to: params.to ? CryptoUtils.checksumAddress(params.to) : null,
            value: params.value,
            gasPrice: params.gasPrice,
            gasLimit: params.gasLimit,
            data: params.data || '0x',
        };
    }

    /**
     * Sign a transaction
     */
    static async signTransaction(
        tx: Omit<Transaction, 'hash' | 'v' | 'r' | 's'>,
        privateKey: string,
        chainId: number
    ): Promise<SignedTransaction> {
        const wallet = new ethers.Wallet(privateKey);

        const transaction: ethers.TransactionRequest = {
            to: tx.to || undefined,
            value: tx.value,
            gasPrice: tx.gasPrice,
            gasLimit: tx.gasLimit,
            nonce: tx.nonce,
            data: tx.data || '0x',
            chainId,
        };

        const signedTx = await wallet.signTransaction(transaction);
        const hash = ethers.keccak256(signedTx);

        return {
            rawTransaction: signedTx,
            hash,
            from: tx.from,
            to: tx.to,
            value: tx.value,
            gasPrice: tx.gasPrice,
            gasLimit: tx.gasLimit,
            nonce: tx.nonce,
            data: tx.data || '0x',
        };
    }

    /**
     * Parse a signed transaction
     */
    static parseSignedTransaction(rawTransaction: string): Transaction {
        const parsed = ethers.Transaction.from(rawTransaction);

        return {
            hash: parsed.hash!,
            nonce: parsed.nonce,
            from: parsed.from!,
            to: parsed.to,
            value: parsed.value,
            gasPrice: parsed.gasPrice!,
            gasLimit: parsed.gasLimit,
            data: parsed.data,
            v: Number(parsed.signature?.v || 0),
            r: parsed.signature?.r || '0x',
            s: parsed.signature?.s || '0x',
        };
    }

    /**
     * Validate transaction
     */
    static validateTransaction(tx: Transaction, senderBalance: bigint, senderNonce: number): { valid: boolean; error?: string } {
        // Check sender address
        if (!CryptoUtils.isValidAddress(tx.from)) {
            return { valid: false, error: 'Invalid sender address' };
        }

        // Check recipient address (if not contract creation)
        if (tx.to && !CryptoUtils.isValidAddress(tx.to)) {
            return { valid: false, error: 'Invalid recipient address' };
        }

        // Check nonce
        if (tx.nonce < senderNonce) {
            return { valid: false, error: 'Nonce too low' };
        }

        if (tx.nonce > senderNonce) {
            return { valid: false, error: 'Nonce too high' };
        }

        // Check gas price
        if (tx.gasPrice <= BigInt(0)) {
            return { valid: false, error: 'Gas price must be positive' };
        }

        // Check gas limit
        if (tx.gasLimit < BigInt(21000)) {
            return { valid: false, error: 'Gas limit too low (minimum 21000)' };
        }

        // Check balance can cover gas + value
        const maxCost = tx.value + tx.gasPrice * tx.gasLimit;
        if (senderBalance < maxCost) {
            return { valid: false, error: 'Insufficient balance for gas * price + value' };
        }

        // Check value is non-negative
        if (tx.value < BigInt(0)) {
            return { valid: false, error: 'Value cannot be negative' };
        }

        return { valid: true };
    }

    /**
     * Calculate transaction hash
     */
    static calculateTransactionHash(tx: Transaction): string {
        const txData = JSON.stringify({
            nonce: tx.nonce.toString(),
            from: tx.from.toLowerCase(),
            to: tx.to?.toLowerCase() || null,
            value: tx.value.toString(),
            gasPrice: tx.gasPrice.toString(),
            gasLimit: tx.gasLimit.toString(),
            data: tx.data,
            v: tx.v,
            r: tx.r,
            s: tx.s,
        });

        return CryptoUtils.hash(txData);
    }

    /**
     * Calculate intrinsic gas for transaction
     */
    static calculateIntrinsicGas(tx: Transaction): bigint {
        let gas = BigInt(21000); // Base cost

        // Contract creation
        if (!tx.to) {
            gas += BigInt(32000);
        }

        // Data costs
        const data = tx.data.startsWith('0x') ? tx.data.slice(2) : tx.data;
        for (let i = 0; i < data.length; i += 2) {
            const byte = parseInt(data.slice(i, i + 2), 16);
            if (byte === 0) {
                gas += BigInt(4); // Zero byte
            } else {
                gas += BigInt(16); // Non-zero byte
            }
        }

        return gas;
    }

    /**
     * Estimate gas for transaction
     */
    static estimateGas(tx: Partial<Transaction>): bigint {
        let gas = BigInt(21000); // Base cost

        if (!tx.to) {
            gas += BigInt(32000); // Contract creation
        }

        if (tx.data && tx.data !== '0x') {
            const data = tx.data.startsWith('0x') ? tx.data.slice(2) : tx.data;
            const dataLength = data.length / 2;
            gas += BigInt(dataLength * 16); // Approximate data cost
        }

        // Add 20% buffer for safety
        return gas + gas / BigInt(5);
    }

    /**
     * Check if transaction is contract creation
     */
    static isContractCreation(tx: Transaction): boolean {
        return tx.to === null || tx.to === '' || tx.to === '0x';
    }

    /**
     * Serialize transaction for storage
     */
    static serializeTransaction(tx: Transaction): string {
        return JSON.stringify({
            ...tx,
            value: tx.value.toString(),
            gasPrice: tx.gasPrice.toString(),
            gasLimit: tx.gasLimit.toString(),
        });
    }

    /**
     * Deserialize transaction from storage
     */
    static deserializeTransaction(data: string): Transaction {
        const parsed = JSON.parse(data);
        return {
            ...parsed,
            value: BigInt(parsed.value),
            gasPrice: BigInt(parsed.gasPrice),
            gasLimit: BigInt(parsed.gasLimit),
        };
    }

    /**
     * Create pending transaction
     */
    static createPendingTransaction(tx: Transaction): PendingTransaction {
        return {
            ...tx,
            addedAt: Date.now(),
        };
    }

    /**
     * Sort transactions by gas price (for mempool priority)
     */
    static sortByGasPrice(transactions: Transaction[]): Transaction[] {
        return [...transactions].sort((a, b) => {
            if (a.gasPrice > b.gasPrice) return -1;
            if (a.gasPrice < b.gasPrice) return 1;
            return 0;
        });
    }

    /**
     * Group transactions by sender
     */
    static groupBySender(transactions: Transaction[]): Map<string, Transaction[]> {
        const groups = new Map<string, Transaction[]>();

        for (const tx of transactions) {
            const sender = tx.from.toLowerCase();
            const existing = groups.get(sender) || [];
            existing.push(tx);
            groups.set(sender, existing);
        }

        // Sort each group by nonce
        for (const [sender, txs] of groups) {
            groups.set(sender, txs.sort((a, b) => a.nonce - b.nonce));
        }

        return groups;
    }

    /**
     * Format value for display
     */
    static formatValue(value: bigint, decimals: number = 18): string {
        const divisor = BigInt(10 ** decimals);
        const integerPart = value / divisor;
        const fractionalPart = value % divisor;
        const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
        return `${integerPart}.${fractionalStr.slice(0, 6)}`;
    }
}

export default TransactionManager;
