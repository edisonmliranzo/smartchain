// SmartChain EVM Executor
import { Transaction, TransactionReceipt, Log, EVMResult } from '../types';
import StateManager from './state';
import CryptoUtils from './crypto';

/**
 * Simplified EVM Executor
 * Handles basic transaction execution and contract interactions
 * For full EVM compatibility, integrate with @ethereumjs/vm
 */
export class EVMExecutor {
    private state: StateManager;
    private chainId: number;
    private blockGasLimit: bigint;

    constructor(state: StateManager, chainId: number, blockGasLimit: bigint = BigInt(30000000)) {
        this.state = state;
        this.chainId = chainId;
        this.blockGasLimit = blockGasLimit;
    }

    /**
     * Execute a transaction
     */
    async executeTransaction(
        tx: Transaction,
        blockNumber: number,
        blockHash: string,
        transactionIndex: number,
        coinbase: string
    ): Promise<{ receipt: TransactionReceipt; gasUsed: bigint }> {
        const logs: Log[] = [];
        let gasUsed = BigInt(21000); // Base gas
        let status = 1; // Success
        let contractAddress: string | null = null;

        try {
            // Deduct gas upfront
            const maxGasCost = tx.gasPrice * tx.gasLimit;
            if (!this.state.subtractBalance(tx.from, maxGasCost)) {
                throw new Error('Insufficient balance for gas');
            }

            // Contract creation
            if (!tx.to || tx.to === '0x') {
                const result = await this.executeContractCreation(tx, blockNumber, blockHash, transactionIndex);
                contractAddress = result.contractAddress;
                gasUsed += result.gasUsed;
                logs.push(...result.logs);

                if (!result.success) {
                    status = 0;
                }
            }
            // Regular transfer or contract call
            else {
                // Transfer value
                if (tx.value > BigInt(0)) {
                    if (!this.state.transfer(tx.from, tx.to, tx.value)) {
                        throw new Error('Insufficient balance for transfer');
                    }
                }

                // Contract call
                if (this.state.hasCode(tx.to) && tx.data !== '0x') {
                    const result = await this.executeContractCall(tx, blockNumber, blockHash, transactionIndex);
                    gasUsed += result.gasUsed;
                    logs.push(...result.logs);

                    if (!result.success) {
                        status = 0;
                    }
                }
            }

            // Increment nonce
            this.state.incrementNonce(tx.from);

            // Refund unused gas
            const unusedGas = tx.gasLimit - gasUsed;
            const refund = unusedGas * tx.gasPrice;
            this.state.addBalance(tx.from, refund);

            // Pay miner
            const minerReward = gasUsed * tx.gasPrice;
            this.state.addBalance(coinbase, minerReward);

        } catch (error: any) {
            status = 0;
            // On failure, still consume gas but revert state changes
            // In a real implementation, we'd use state snapshots
            console.error('Transaction execution failed:', error.message);
        }

        const receipt: TransactionReceipt = {
            transactionHash: tx.hash,
            transactionIndex,
            blockHash,
            blockNumber,
            from: tx.from,
            to: tx.to,
            contractAddress,
            cumulativeGasUsed: gasUsed,
            gasUsed,
            logs,
            logsBloom: this.createLogsBloom(logs),
            status,
        };

        return { receipt, gasUsed };
    }

    /**
     * Execute contract creation
     */
    private async executeContractCreation(
        tx: Transaction,
        blockNumber: number,
        blockHash: string,
        transactionIndex: number
    ): Promise<EVMResult & { contractAddress: string }> {
        const nonce = this.state.getNonce(tx.from);
        const contractAddress = CryptoUtils.computeContractAddress(tx.from, nonce - 1);

        // Create contract account
        this.state.setAccount(contractAddress, {
            address: contractAddress,
            balance: tx.value,
            nonce: 0,
            codeHash: '0x' + '0'.repeat(64),
            storageRoot: '0x' + '0'.repeat(64),
        });

        // Transfer value to contract
        if (tx.value > BigInt(0)) {
            this.state.subtractBalance(tx.from, tx.value);
            this.state.addBalance(contractAddress, tx.value);
        }

        // Store contract code (in real EVM, we'd execute init code and store returned bytecode)
        if (tx.data && tx.data !== '0x') {
            this.state.setCode(contractAddress, tx.data);
        }

        // Calculate gas for contract creation
        const dataGas = this.calculateDataGas(tx.data);
        const creationGas = BigInt(32000); // Base creation cost

        const logs: Log[] = [{
            address: contractAddress,
            topics: [CryptoUtils.hash('ContractCreated(address)')],
            data: CryptoUtils.padHex(contractAddress.slice(2)),
            blockNumber,
            transactionHash: tx.hash,
            transactionIndex,
            blockHash,
            logIndex: 0,
            removed: false,
        }];

        return {
            success: true,
            gasUsed: dataGas + creationGas,
            returnValue: Buffer.from(contractAddress.slice(2), 'hex'),
            logs,
            contractAddress,
        };
    }

    /**
     * Execute contract call
     */
    private async executeContractCall(
        tx: Transaction,
        blockNumber: number,
        blockHash: string,
        transactionIndex: number
    ): Promise<EVMResult> {
        // In a full implementation, this would run the EVM
        // For now, we handle some basic patterns

        const code = this.state.getCode(tx.to!);
        const dataGas = this.calculateDataGas(tx.data);

        const logs: Log[] = [];

        // Simulate simple contract execution
        // In production, use @ethereumjs/vm for full EVM support

        // Check for common function selectors
        const selector = tx.data.slice(0, 10);

        // transfer(address,uint256) - 0xa9059cbb
        if (selector === '0xa9059cbb') {
            const recipient = '0x' + tx.data.slice(34, 74);
            const amount = BigInt('0x' + tx.data.slice(74, 138));

            // ERC20 transfer logic would go here
            logs.push({
                address: tx.to!,
                topics: [
                    CryptoUtils.hash('Transfer(address,address,uint256)'),
                    CryptoUtils.padHex(tx.from.slice(2)),
                    CryptoUtils.padHex(recipient.slice(2)),
                ],
                data: CryptoUtils.padHex(amount.toString(16)),
                blockNumber,
                transactionHash: tx.hash,
                transactionIndex,
                blockHash,
                logIndex: 0,
                removed: false,
            });
        }

        return {
            success: true,
            gasUsed: dataGas + BigInt(5000), // Simplified gas calculation
            returnValue: Buffer.alloc(0),
            logs,
        };
    }

    /**
     * Calculate gas for transaction data
     */
    private calculateDataGas(data: string): bigint {
        if (!data || data === '0x') {
            return BigInt(0);
        }

        const hexData = data.startsWith('0x') ? data.slice(2) : data;
        let gas = BigInt(0);

        for (let i = 0; i < hexData.length; i += 2) {
            const byte = parseInt(hexData.slice(i, i + 2), 16);
            if (byte === 0) {
                gas += BigInt(4); // Zero byte
            } else {
                gas += BigInt(16); // Non-zero byte
            }
        }

        return gas;
    }

    /**
     * Create logs bloom filter
     */
    private createLogsBloom(logs: Log[]): string {
        // Simplified bloom filter implementation
        const bloom = new Uint8Array(256);

        for (const log of logs) {
            // Add address to bloom
            const addressHash = CryptoUtils.hash(log.address.toLowerCase());
            this.addToBloom(bloom, addressHash);

            // Add topics to bloom
            for (const topic of log.topics) {
                this.addToBloom(bloom, topic);
            }
        }

        return '0x' + Buffer.from(bloom).toString('hex');
    }

    /**
     * Add hash to bloom filter
     */
    private addToBloom(bloom: Uint8Array, hash: string): void {
        const hashBytes = Buffer.from(hash.slice(2), 'hex');

        for (let i = 0; i < 3; i++) {
            const bit = (hashBytes[i * 2] << 8 | hashBytes[i * 2 + 1]) & 0x7ff;
            const byteIndex = 255 - Math.floor(bit / 8);
            const bitIndex = bit % 8;
            bloom[byteIndex] |= 1 << bitIndex;
        }
    }

    /**
     * Estimate gas for a transaction
     */
    async estimateGas(tx: Partial<Transaction>): Promise<bigint> {
        let gas = BigInt(21000); // Base cost

        // Contract creation
        if (!tx.to) {
            gas += BigInt(32000);
        }

        // Data cost
        if (tx.data && tx.data !== '0x') {
            gas += this.calculateDataGas(tx.data);
        }

        // Contract call overhead
        if (tx.to && this.state.hasCode(tx.to)) {
            gas += BigInt(10000); // Estimated call overhead
        }

        // Add 20% buffer
        return gas + gas / BigInt(5);
    }

    /**
     * Call a contract (read-only)
     */
    async call(tx: {
        from?: string;
        to: string;
        data: string;
        value?: bigint;
        gasLimit?: bigint;
    }): Promise<string> {
        // In a full implementation, this would run the EVM without state changes
        // For now, return empty result
        return '0x';
    }

    /**
     * Get chain ID
     */
    getChainId(): number {
        return this.chainId;
    }

    /**
     * Get block gas limit
     */
    getBlockGasLimit(): bigint {
        return this.blockGasLimit;
    }
}

export default EVMExecutor;
