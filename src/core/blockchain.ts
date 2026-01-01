// SmartChain Blockchain Core
import { Block, Transaction, TransactionReceipt, ChainConfig, NodeInfo, SyncStatus } from '../types';
import BlockManager from './block';
import StateManager from './state';
import Mempool from './mempool';
import EVMExecutor from './evm';
import CryptoUtils from './crypto';
import EventEmitter from 'events';
import * as fs from 'fs';
import * as path from 'path';

const DB_FILE = path.join(process.cwd(), 'data', 'chain_data.json');

export class Blockchain extends EventEmitter {
    private blocks: Map<string, Block> = new Map(); // hash -> block
    private blocksByNumber: Map<number, string> = new Map(); // number -> hash
    private receipts: Map<string, TransactionReceipt> = new Map(); // tx hash -> receipt
    private txToBlock: Map<string, string> = new Map(); // tx hash -> block hash

    public state: StateManager;
    public mempool: Mempool;
    public evm: EVMExecutor;

    private config: ChainConfig;
    private latestBlockNumber: number = -1;
    private isValidating: boolean = false;
    private validatorAddress: string | null = null;
    private miningInterval: NodeJS.Timeout | null = null;
    private dbFile: string;
    private network: string;

    constructor(config: ChainConfig, network: string = 'mainnet') {
        super();
        this.config = config;
        this.network = network;
        this.dbFile = path.join(process.cwd(), 'data', `${network}_chain_data.json`);
        this.state = new StateManager();
        this.mempool = new Mempool();
        this.evm = new EVMExecutor(this.state, config.chainId, config.blockGasLimit);
    }

    /**
     * Initialize the blockchain
     */
    async initialize(): Promise<void> {
        console.log(`Initializing SmartChain (Chain ID: ${this.config.chainId})...`);

        // Try to load existing chain
        const loaded = await this.loadChain();
        if (loaded) {
            console.log(`Chain loaded with ${this.latestBlockNumber + 1} blocks.`);
            return;
        }

        // Initialize state with premine allocations
        this.state.initializeGenesis(this.config.premine);

        // Create or load genesis block
        const genesisBlock = BlockManager.createGenesisBlock(
            this.config.chainId,
            this.config.genesisBlock?.header.timestamp || Date.now()
        );

        await this.addBlock(genesisBlock);
        console.log(`Genesis block created: ${genesisBlock.hash}`);

        // Setup mempool event handlers
        this.mempool.on('pendingTransaction', (tx: Transaction) => {
            this.emit('pendingTransaction', tx);
        });

        console.log('Blockchain initialized successfully!');
    }

    /**
     * Add a block to the chain
     */
    async addBlock(block: Block): Promise<{ success: boolean; error?: string }> {
        // Get parent block (if not genesis)
        const parentBlock = block.header.number > 0
            ? this.getBlockByNumber(block.header.number - 1) || null
            : null;

        // Validate block
        const validation = BlockManager.validateBlock(block, parentBlock);
        if (!validation.valid) {
            return { success: false, error: validation.error };
        }

        // Store block
        this.blocks.set(block.hash, block);
        this.blocksByNumber.set(block.header.number, block.hash);
        this.latestBlockNumber = Math.max(this.latestBlockNumber, block.header.number);

        // Index transactions
        for (let i = 0; i < block.transactions.length; i++) {
            const tx = block.transactions[i];
            tx.blockHash = block.hash;
            tx.blockNumber = block.header.number;
            tx.transactionIndex = i;
            this.txToBlock.set(tx.hash, block.hash);
        }

        this.emit('newBlock', block);

        // Save chain asynchronously to avoid blocking
        this.saveChain().catch(err => console.error("Failed to save chain:", err));

        return { success: true };
    }

    /**
     * Load chain from disk
     */
    private async loadChain(): Promise<boolean> {
        try {
            if (!fs.existsSync(this.dbFile)) return false;

            console.log(`Loading chain from disk (${this.network})...`);
            const data = fs.readFileSync(this.dbFile, 'utf8');
            const snapshot = JSON.parse(data, (key, value) => {
                // Heuristic to revive BigInts
                if (typeof value === 'string' && /^\d+n$/.test(value)) {
                    return BigInt(value.slice(0, -1));
                }
                return value;
            });

            // Restore Blocks
            // We need to properly revive BigInts that didn't get caught or are strictly strings in the JSON
            // But since we use a replacer that appends 'n', the reviver should handle it.

            // Reconstruct maps
            this.blocks = new Map(snapshot.blocks);
            this.blocksByNumber = new Map(snapshot.blocksByNumber);
            this.receipts = new Map(snapshot.receipts);
            this.txToBlock = new Map(snapshot.txToBlock);
            this.latestBlockNumber = snapshot.latestBlockNumber;

            // Restore State
            this.state.restoreSnapshot(snapshot.state);

            return true;
        } catch (error) {
            console.error("Failed to load chain:", error);
            // If load fails, we return false and start fresh
            return false;
        }
    }

    /**
     * Save chain to disk
     */
    private async saveChain(): Promise<void> {
        try {
            const snapshot = {
                blocks: Array.from(this.blocks.entries()),
                blocksByNumber: Array.from(this.blocksByNumber.entries()),
                receipts: Array.from(this.receipts.entries()),
                txToBlock: Array.from(this.txToBlock.entries()),
                latestBlockNumber: this.latestBlockNumber,
                state: this.state.createSnapshot()
            };

            const data = JSON.stringify(snapshot, (key, value) => {
                if (typeof value === 'bigint') {
                    return value.toString() + 'n'; // Mark as BigInt
                }
                return value;
            });

            // Ensure data directory exists
            const dataDir = path.dirname(this.dbFile);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            fs.writeFileSync(this.dbFile, data);
        } catch (error) {
            console.error("Failed to save chain:", error);
        }
    }

    /**
     * Mine a new block
     */
    async mineBlock(validatorAddress: string): Promise<Block | null> {
        // --- ROUND-ROBIN CONSENSUS CHECK ---
        const parentBlock = this.getLatestBlock();
        if (!parentBlock) {
            console.error('No parent block found');
            return null;
        }

        const nextBlockNumber = parentBlock.header.number + 1;
        const validators = this.config.validators;
        const turnIndex = nextBlockNumber % validators.length;
        const expectedMiner = validators[turnIndex];

        // If it's not my turn, and we are enforcing strict PoA, skip.
        // For standard PoA, only the expected miner should produce the block.
        if (expectedMiner.toLowerCase() !== validatorAddress.toLowerCase()) {
            return null; // Not my turn, do nothing silently
        }
        // -----------------------------------

        // Get pending transactions
        const pendingTxs = this.mempool.getTransactionsForBlock(
            this.config.blockGasLimit,
            this.state
        );

        // Execute transactions
        const executedTxs: Transaction[] = [];
        const receiptsForBlock: TransactionReceipt[] = [];
        let totalGasUsed = BigInt(0);
        const receiptsHashes: string[] = [];

        for (let i = 0; i < pendingTxs.length; i++) {
            const tx = pendingTxs[i];

            try {
                const { receipt, gasUsed } = await this.evm.executeTransaction(
                    tx,
                    parentBlock.header.number + 1,
                    '', // Block hash will be set after block is created
                    i,
                    validatorAddress
                );

                executedTxs.push(tx);
                receiptsForBlock.push(receipt);
                // Use replacer to handle BigInt values
                const replacer = (_key: string, value: any) =>
                    typeof value === 'bigint' ? value.toString() : value;
                receiptsHashes.push(CryptoUtils.hash(JSON.stringify(receipt, replacer)));
                totalGasUsed += gasUsed;

            } catch (error) {
                console.error(`Failed to execute transaction ${tx.hash}:`, error);
            }
        }

        // Calculate receipts root
        const receiptsRoot = CryptoUtils.calculateMerkleRoot(receiptsHashes);

        // --- DYNAMIC REWARD LOGIC ---
        // 1. Base Block Reward
        const baseReward = BigInt(2) * BigInt(10 ** 18); // 2 SMC

        // 2. Dynamic Congestion Bonus
        // If block is > 50% full, add 1 SMC bonus to incentivize processing heavy blocks
        const gasUtilization = Number(totalGasUsed) / Number(this.config.blockGasLimit);
        const congestionBonus = gasUtilization > 0.5 ? BigInt(1) * BigInt(10 ** 18) : BigInt(0);

        // 3. Transaction Fees
        // Assuming a minimum gas price of 1 Gwei for now if not dynamic
        const effectiveGasPrice = this.getGasPrice();
        const txFees = totalGasUsed * effectiveGasPrice;

        const totalReward = baseReward + congestionBonus + txFees;

        // Credit the Validator/Miner
        this.state.addBalance(validatorAddress, totalReward);
        console.log(`[Miner] Rewarded ${validatorAddress} with ${Number(totalReward) / 1e18} SMC (Base: 2, Bonus: ${Number(congestionBonus) / 1e18}, Fees: ${Number(txFees) / 1e18})`);

        // -----------------------------

        // Create block
        const block = BlockManager.createBlock(
            parentBlock,
            executedTxs,
            validatorAddress,
            this.state.getStateRoot(),
            receiptsRoot,
            totalGasUsed,
            `0x${Buffer.from(`SmartChain Block ${parentBlock.header.number + 1}`).toString('hex')}`
        );

        // Update receipts with correct block hash
        for (const receipt of receiptsForBlock) {
            receipt.blockHash = block.hash;
            this.receipts.set(receipt.transactionHash, receipt);
        }

        // Add block to chain
        const result = await this.addBlock(block);
        if (!result.success) {
            console.error('Failed to add mined block:', result.error);
            return null;
        }

        // Remove mined transactions from mempool
        this.mempool.removeMinedTransactions(executedTxs.map(tx => tx.hash));

        console.log(`Block ${block.header.number} mined with ${executedTxs.length} transactions`);
        return block;
    }

    /**
     * Start validating/mining blocks
     */
    startValidating(validatorAddress: string): void {
        if (this.isValidating) {
            console.log('Already validating');
            return;
        }

        this.validatorAddress = validatorAddress;
        this.isValidating = true;

        console.log(`Starting block production as ${validatorAddress}`);

        this.miningInterval = setInterval(async () => {
            if (this.mempool.getSize() > 0 || true) { // Always produce blocks for PoA
                await this.mineBlock(validatorAddress);
            }
        }, this.config.blockTime);
    }

    /**
     * Stop validating/mining blocks
     */
    stopValidating(): void {
        if (this.miningInterval) {
            clearInterval(this.miningInterval);
            this.miningInterval = null;
        }
        this.isValidating = false;
        this.validatorAddress = null;
        console.log('Stopped block production');
    }

    /**
     * Send a signed transaction
     */
    async sendTransaction(signedTx: string): Promise<{ hash?: string; error?: string }> {
        try {
            const tx = CryptoUtils.parseTransaction(signedTx);

            // In ethers v6, transaction properties are accessed differently
            const parsedTx = tx as any;

            const transaction: Transaction = {
                hash: parsedTx.hash || '',
                nonce: parsedTx.nonce || 0,
                from: parsedTx.from || '',
                to: parsedTx.to || null,
                value: parsedTx.value || BigInt(0),
                gasPrice: parsedTx.gasPrice || BigInt(0),
                gasLimit: parsedTx.gasLimit || BigInt(21000),
                data: parsedTx.data || '0x',
                v: parsedTx.signature?.v ? Number(parsedTx.signature.v) : 0,
                r: parsedTx.signature?.r || '0x',
                s: parsedTx.signature?.s || '0x',
            };

            const result = this.mempool.addTransaction(transaction, this.state);

            if (result.success) {
                return { hash: transaction.hash };
            } else {
                return { error: result.error };
            }
        } catch (error: any) {
            return { error: error.message };
        }
    }

    /**
     * Get block by hash
     */
    getBlockByHash(hash: string): Block | undefined {
        return this.blocks.get(hash);
    }

    /**
     * Get block by number
     */
    getBlockByNumber(number: number | 'latest' | 'pending' | 'earliest'): Block | undefined {
        let blockNumber: number;

        if (number === 'latest') {
            blockNumber = this.latestBlockNumber;
        } else if (number === 'earliest') {
            blockNumber = 0;
        } else if (number === 'pending') {
            // Return latest for now
            blockNumber = this.latestBlockNumber;
        } else {
            blockNumber = number;
        }

        const hash = this.blocksByNumber.get(blockNumber);
        return hash ? this.blocks.get(hash) : undefined;
    }

    /**
     * Get latest block
     */
    getLatestBlock(): Block | undefined {
        return this.getBlockByNumber('latest');
    }

    /**
     * Get latest block number
     */
    getLatestBlockNumber(): number {
        return this.latestBlockNumber;
    }

    /**
     * Get transaction by hash
     */
    getTransaction(hash: string): Transaction | undefined {
        // Check mempool first
        const pendingTx = this.mempool.getTransaction(hash);
        if (pendingTx) {
            return pendingTx;
        }

        // Check confirmed transactions
        const blockHash = this.txToBlock.get(hash);
        if (!blockHash) return undefined;

        const block = this.blocks.get(blockHash);
        if (!block) return undefined;

        return block.transactions.find(tx => tx.hash === hash);
    }

    /**
     * Get transaction receipt
     */
    getTransactionReceipt(hash: string): TransactionReceipt | undefined {
        return this.receipts.get(hash);
    }

    /**
     * Get account balance
     */
    getBalance(address: string): bigint {
        return this.state.getBalance(address);
    }

    /**
     * Get account nonce
     */
    getNonce(address: string): number {
        return this.state.getNonce(address);
    }

    /**
     * Get contract code
     */
    getCode(address: string): string {
        return this.state.getCode(address);
    }

    /**
     * Get storage at position
     */
    getStorageAt(address: string, position: string): string {
        return this.state.getStorage(address, position);
    }

    /**
     * Estimate gas
     */
    async estimateGas(tx: Partial<Transaction>): Promise<bigint> {
        return this.evm.estimateGas(tx);
    }

    /**
     * Call contract (read-only)
     */
    async call(tx: {
        from?: string;
        to: string;
        data: string;
        value?: bigint;
        gasLimit?: bigint;
    }): Promise<string> {
        return this.evm.call(tx);
    }

    /**
     * Get gas price
     */
    getGasPrice(): bigint {
        // Return minimum gas price (0.1 gwei) - Cheap and Fair
        return BigInt(100000000);
    }

    /**
     * Get chain ID
     */
    getChainId(): number {
        return this.config.chainId;
    }

    /**
     * Get chain config
     */
    getConfig(): ChainConfig {
        return this.config;
    }

    /**
     * Get node info
     */
    getNodeInfo(): NodeInfo {
        return {
            id: CryptoUtils.randomBytes(32),
            name: `SmartChain/${this.config.chainName}`,
            version: '1.0.0',
            chainId: this.config.chainId,
            networkId: this.config.chainId,
            peers: 0, // TODO: implement P2P
            currentBlock: this.latestBlockNumber,
            pendingTransactions: this.mempool.getSize(),
            isValidator: this.isValidating,
            isMining: this.isValidating,
        };
    }

    /**
     * Get sync status
     */
    getSyncStatus(): SyncStatus | false {
        // For now, we're always synced (single node)
        return false;
    }

    /**
     * Get all blocks (for explorer)
     */
    getAllBlocks(): Block[] {
        const blocks: Block[] = [];
        for (let i = 0; i <= this.latestBlockNumber; i++) {
            const block = this.getBlockByNumber(i);
            if (block) blocks.push(block);
        }
        return blocks;
    }

    /**
     * Get recent blocks
     */
    getRecentBlocks(count: number = 10): Block[] {
        const blocks: Block[] = [];
        const start = Math.max(0, this.latestBlockNumber - count + 1);

        for (let i = this.latestBlockNumber; i >= start; i--) {
            const block = this.getBlockByNumber(i);
            if (block) blocks.push(block);
        }

        return blocks;
    }

    /**
     * Get blocks in range
     */
    getBlocksInRange(start: number, end: number): Block[] {
        const blocks: Block[] = [];
        for (let i = start; i <= Math.min(end, this.latestBlockNumber); i++) {
            const block = this.getBlockByNumber(i);
            if (block) blocks.push(block);
        }
        return blocks;
    }

    /**
     * Search transactions by address
     */
    getTransactionsByAddress(address: string): Transaction[] {
        const normalized = address.toLowerCase();
        const transactions: Transaction[] = [];

        for (const block of this.blocks.values()) {
            for (const tx of block.transactions) {
                if (tx.from.toLowerCase() === normalized || tx.to?.toLowerCase() === normalized) {
                    transactions.push(tx);
                }
            }
        }

        // Also check pending
        const pending = this.mempool.getTransactionsByAddress(address);
        transactions.push(...pending);

        return transactions.sort((a, b) => (b.blockNumber || 0) - (a.blockNumber || 0));
    }
}

export default Blockchain;
