// SmartChain Transaction Pool (Mempool)
import { Transaction, PendingTransaction } from '../types';
import TransactionManager from './transaction';
import StateManager from './state';
import EventEmitter from 'events';

export class Mempool extends EventEmitter {
    private pending: Map<string, PendingTransaction> = new Map(); // hash -> transaction
    private queued: Map<string, PendingTransaction[]> = new Map(); // address -> transactions (nonce gaps)
    private maxSize: number;
    private maxPendingPerAccount: number;

    constructor(maxSize: number = 5000, maxPendingPerAccount: number = 64) {
        super();
        this.maxSize = maxSize;
        this.maxPendingPerAccount = maxPendingPerAccount;
    }

    /**
     * Add transaction to mempool
     */
    addTransaction(tx: Transaction, state: StateManager): { success: boolean; error?: string } {
        // Check if already exists
        if (this.pending.has(tx.hash)) {
            return { success: false, error: 'Transaction already in pool' };
        }

        // Get sender's current state
        const senderBalance = state.getBalance(tx.from);
        const senderNonce = state.getNonce(tx.from);

        // Validate transaction
        const validation = TransactionManager.validateTransaction(tx, senderBalance, senderNonce);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        // Check pool size
        if (this.pending.size >= this.maxSize) {
            // Try to evict lowest gas price transaction
            const evicted = this.evictLowestGasPrice(tx.gasPrice);
            if (!evicted) {
                return { success: false, error: 'Mempool is full' };
            }
        }

        // Check per-account limit
        const accountTxCount = this.getTransactionCountByAddress(tx.from);
        if (accountTxCount >= this.maxPendingPerAccount) {
            return { success: false, error: 'Too many pending transactions for this account' };
        }

        // Add to pending
        const pendingTx = TransactionManager.createPendingTransaction(tx);
        this.pending.set(tx.hash, pendingTx);

        this.emit('pendingTransaction', tx);
        return { success: true };
    }

    /**
     * Remove transaction from mempool
     */
    removeTransaction(hash: string): boolean {
        return this.pending.delete(hash);
    }

    /**
     * Get transaction by hash
     */
    getTransaction(hash: string): PendingTransaction | undefined {
        return this.pending.get(hash);
    }

    /**
     * Check if transaction exists
     */
    hasTransaction(hash: string): boolean {
        return this.pending.has(hash);
    }

    /**
     * Get all pending transactions
     */
    getAllTransactions(): PendingTransaction[] {
        return Array.from(this.pending.values());
    }

    /**
     * Get pending transactions sorted by gas price
     */
    getTransactionsByGasPrice(): PendingTransaction[] {
        return Array.from(this.pending.values()).sort((a, b) => {
            if (a.gasPrice > b.gasPrice) return -1;
            if (a.gasPrice < b.gasPrice) return 1;
            return a.addedAt - b.addedAt; // Older first for same gas price
        });
    }

    /**
     * Get transactions for a block (up to gas limit)
     */
    getTransactionsForBlock(gasLimit: bigint, state: StateManager): Transaction[] {
        const transactions: Transaction[] = [];
        let gasUsed = BigInt(0);

        // Group by sender and ensure nonce order
        const bySender = TransactionManager.groupBySender(
            Array.from(this.pending.values())
        );

        // Sort senders by highest gas price of their first transaction
        const sortedSenders = Array.from(bySender.entries()).sort((a, b) => {
            if (a[1][0].gasPrice > b[1][0].gasPrice) return -1;
            if (a[1][0].gasPrice < b[1][0].gasPrice) return 1;
            return 0;
        });

        // Track nonces per sender
        const currentNonces = new Map<string, number>();

        // Round-robin selection to be fair
        let added = true;
        while (added && gasUsed < gasLimit) {
            added = false;

            for (const [sender, senderTxs] of sortedSenders) {
                const expectedNonce = currentNonces.get(sender) ?? state.getNonce(sender);

                // Find next valid transaction for this sender
                for (const tx of senderTxs) {
                    if (tx.nonce !== expectedNonce) continue;

                    const txGas = TransactionManager.calculateIntrinsicGas(tx);
                    if (gasUsed + txGas > gasLimit) continue;

                    // Verify sender still has balance
                    const senderBalance = state.getBalance(sender);
                    const txCost = tx.value + tx.gasPrice * tx.gasLimit;
                    if (senderBalance < txCost) continue;

                    transactions.push(tx);
                    gasUsed += txGas;
                    currentNonces.set(sender, expectedNonce + 1);
                    added = true;
                    break;
                }
            }
        }

        return transactions;
    }

    /**
     * Remove transactions that are now in a block
     */
    removeMinedTransactions(txHashes: string[]): void {
        for (const hash of txHashes) {
            this.pending.delete(hash);
        }
    }

    /**
     * Get transaction count for address
     */
    getTransactionCountByAddress(address: string): number {
        const normalized = address.toLowerCase();
        let count = 0;
        for (const tx of this.pending.values()) {
            if (tx.from.toLowerCase() === normalized) {
                count++;
            }
        }
        return count;
    }

    /**
     * Get transactions for address
     */
    getTransactionsByAddress(address: string): PendingTransaction[] {
        const normalized = address.toLowerCase();
        const transactions: PendingTransaction[] = [];
        for (const tx of this.pending.values()) {
            if (tx.from.toLowerCase() === normalized || tx.to?.toLowerCase() === normalized) {
                transactions.push(tx);
            }
        }
        return transactions.sort((a, b) => a.nonce - b.nonce);
    }

    /**
     * Evict lowest gas price transaction
     */
    private evictLowestGasPrice(minGasPrice: bigint): boolean {
        let lowestTx: PendingTransaction | null = null;
        let lowestGasPrice = minGasPrice;

        for (const tx of this.pending.values()) {
            if (tx.gasPrice < lowestGasPrice) {
                lowestGasPrice = tx.gasPrice;
                lowestTx = tx;
            }
        }

        if (lowestTx) {
            this.pending.delete(lowestTx.hash);
            return true;
        }

        return false;
    }

    /**
     * Remove stale transactions
     */
    removeStaleTransactions(maxAge: number = 3600000): number { // 1 hour default
        const now = Date.now();
        let removed = 0;

        for (const [hash, tx] of this.pending) {
            if (now - tx.addedAt > maxAge) {
                this.pending.delete(hash);
                removed++;
            }
        }

        return removed;
    }

    /**
     * Get mempool size
     */
    getSize(): number {
        return this.pending.size;
    }

    /**
     * Get mempool stats
     */
    getStats(): {
        pending: number;
        queued: number;
        totalGas: bigint;
        avgGasPrice: bigint;
        minGasPrice: bigint;
        maxGasPrice: bigint;
    } {
        let totalGas = BigInt(0);
        let minGasPrice = BigInt(0);
        let maxGasPrice = BigInt(0);

        for (const tx of this.pending.values()) {
            totalGas += tx.gasLimit;
            if (minGasPrice === BigInt(0) || tx.gasPrice < minGasPrice) {
                minGasPrice = tx.gasPrice;
            }
            if (tx.gasPrice > maxGasPrice) {
                maxGasPrice = tx.gasPrice;
            }
        }

        const avgGasPrice = this.pending.size > 0
            ? totalGas / BigInt(this.pending.size)
            : BigInt(0);

        let queuedCount = 0;
        for (const txs of this.queued.values()) {
            queuedCount += txs.length;
        }

        return {
            pending: this.pending.size,
            queued: queuedCount,
            totalGas,
            avgGasPrice,
            minGasPrice,
            maxGasPrice,
        };
    }

    /**
     * Clear all transactions
     */
    clear(): void {
        this.pending.clear();
        this.queued.clear();
    }

    /**
     * Serialize mempool for persistence
     */
    serialize(): string {
        const transactions = Array.from(this.pending.values()).map(tx => ({
            ...tx,
            value: tx.value.toString(),
            gasPrice: tx.gasPrice.toString(),
            gasLimit: tx.gasLimit.toString(),
        }));
        return JSON.stringify(transactions);
    }

    /**
     * Deserialize mempool from persistence
     */
    deserialize(data: string, state: StateManager): void {
        const transactions = JSON.parse(data);
        for (const tx of transactions) {
            const parsed: Transaction = {
                ...tx,
                value: BigInt(tx.value),
                gasPrice: BigInt(tx.gasPrice),
                gasLimit: BigInt(tx.gasLimit),
            };
            this.addTransaction(parsed, state);
        }
    }
}

export default Mempool;
