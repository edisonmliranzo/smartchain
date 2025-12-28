// SmartChain Block Management
import { Block, BlockHeader, Transaction } from '../types';
import CryptoUtils from './crypto';

export class BlockManager {
    /**
     * Create the genesis block
     */
    static createGenesisBlock(chainId: number, timestamp: number = Date.now()): Block {
        const header: BlockHeader = {
            number: 0,
            timestamp,
            parentHash: '0x' + '0'.repeat(64),
            stateRoot: '0x' + '0'.repeat(64),
            transactionsRoot: '0x' + '0'.repeat(64),
            receiptsRoot: '0x' + '0'.repeat(64),
            miner: '0x0000000000000000000000000000000000000000',
            difficulty: BigInt(1),
            gasLimit: BigInt(30000000),
            gasUsed: BigInt(0),
            extraData: `0x${Buffer.from('SmartChain Genesis Block').toString('hex')}`,
            nonce: '0x0000000000000000',
            mixHash: '0x' + '0'.repeat(64),
        };

        const hash = this.calculateBlockHash(header);

        return {
            header,
            transactions: [],
            hash,
            size: this.calculateBlockSize(header, []),
        };
    }

    /**
     * Create a new block
     */
    static createBlock(
        parentBlock: Block,
        transactions: Transaction[],
        miner: string,
        stateRoot: string,
        receiptsRoot: string,
        gasUsed: bigint,
        extraData: string = '0x'
    ): Block {
        const transactionsRoot = this.calculateTransactionsRoot(transactions);

        const header: BlockHeader = {
            number: parentBlock.header.number + 1,
            timestamp: Date.now(),
            parentHash: parentBlock.hash,
            stateRoot,
            transactionsRoot,
            receiptsRoot,
            miner,
            difficulty: this.calculateDifficulty(parentBlock),
            gasLimit: parentBlock.header.gasLimit,
            gasUsed,
            extraData,
            nonce: '0x0000000000000000',
            mixHash: '0x' + '0'.repeat(64),
        };

        const hash = this.calculateBlockHash(header);

        return {
            header,
            transactions,
            hash,
            size: this.calculateBlockSize(header, transactions),
        };
    }

    /**
     * Calculate block hash from header
     */
    static calculateBlockHash(header: BlockHeader): string {
        const headerData = JSON.stringify({
            number: header.number.toString(),
            timestamp: header.timestamp.toString(),
            parentHash: header.parentHash,
            stateRoot: header.stateRoot,
            transactionsRoot: header.transactionsRoot,
            receiptsRoot: header.receiptsRoot,
            miner: header.miner,
            difficulty: header.difficulty.toString(),
            gasLimit: header.gasLimit.toString(),
            gasUsed: header.gasUsed.toString(),
            extraData: header.extraData,
            nonce: header.nonce,
            mixHash: header.mixHash,
        });

        return CryptoUtils.hash(headerData);
    }

    /**
     * Calculate transactions root (Merkle root)
     */
    static calculateTransactionsRoot(transactions: Transaction[]): string {
        if (transactions.length === 0) {
            return '0x' + '0'.repeat(64);
        }

        const txHashes = transactions.map(tx => tx.hash);
        return CryptoUtils.calculateMerkleRoot(txHashes);
    }

    /**
     * Calculate difficulty (simple algorithm for PoA)
     */
    static calculateDifficulty(parentBlock: Block): bigint {
        // For PoA, we keep difficulty constant at 1
        // In PoW, this would adjust based on block times
        return BigInt(1);
    }

    /**
     * Calculate block size in bytes
     */
    static calculateBlockSize(header: BlockHeader, transactions: Transaction[]): number {
        // Use a replacer function to handle BigInt values
        const replacer = (_key: string, value: any) =>
            typeof value === 'bigint' ? value.toString() : value;

        const headerSize = JSON.stringify(header, replacer).length;
        const txSize = transactions.reduce((acc, tx) => acc + JSON.stringify(tx, replacer).length, 0);
        return headerSize + txSize;
    }

    /**
     * Validate block structure
     */
    static validateBlock(block: Block, parentBlock: Block | null): { valid: boolean; error?: string } {
        // Genesis block validation
        if (block.header.number === 0) {
            if (block.header.parentHash !== '0x' + '0'.repeat(64)) {
                return { valid: false, error: 'Genesis block must have zero parent hash' };
            }
            return { valid: true };
        }

        if (!parentBlock) {
            return { valid: false, error: 'Parent block required for non-genesis blocks' };
        }

        // Validate parent hash
        if (block.header.parentHash !== parentBlock.hash) {
            return { valid: false, error: 'Invalid parent hash' };
        }

        // Validate block number
        if (block.header.number !== parentBlock.header.number + 1) {
            return { valid: false, error: 'Invalid block number' };
        }

        // Validate timestamp
        if (block.header.timestamp <= parentBlock.header.timestamp) {
            return { valid: false, error: 'Block timestamp must be greater than parent' };
        }

        // Validate block hash
        const calculatedHash = this.calculateBlockHash(block.header);
        if (block.hash !== calculatedHash) {
            return { valid: false, error: 'Invalid block hash' };
        }

        // Validate transactions root
        const calculatedTxRoot = this.calculateTransactionsRoot(block.transactions);
        if (block.header.transactionsRoot !== calculatedTxRoot) {
            return { valid: false, error: 'Invalid transactions root' };
        }

        // Validate gas used doesn't exceed gas limit
        if (block.header.gasUsed > block.header.gasLimit) {
            return { valid: false, error: 'Gas used exceeds gas limit' };
        }

        return { valid: true };
    }

    /**
     * Serialize block for storage/transmission
     */
    static serializeBlock(block: Block): string {
        return JSON.stringify({
            ...block,
            header: {
                ...block.header,
                difficulty: block.header.difficulty.toString(),
                gasLimit: block.header.gasLimit.toString(),
                gasUsed: block.header.gasUsed.toString(),
            },
            transactions: block.transactions.map(tx => ({
                ...tx,
                value: tx.value.toString(),
                gasPrice: tx.gasPrice.toString(),
                gasLimit: tx.gasLimit.toString(),
            })),
        });
    }

    /**
     * Deserialize block from storage/transmission
     */
    static deserializeBlock(data: string): Block {
        const parsed = JSON.parse(data);
        return {
            ...parsed,
            header: {
                ...parsed.header,
                difficulty: BigInt(parsed.header.difficulty),
                gasLimit: BigInt(parsed.header.gasLimit),
                gasUsed: BigInt(parsed.header.gasUsed),
            },
            transactions: parsed.transactions.map((tx: any) => ({
                ...tx,
                value: BigInt(tx.value),
                gasPrice: BigInt(tx.gasPrice),
                gasLimit: BigInt(tx.gasLimit),
            })),
        };
    }

    /**
     * Get block reward (for PoW chains)
     */
    static getBlockReward(blockNumber: number): bigint {
        // SmartChain uses PoA, so no mining rewards
        // But we'll include this for future PoW support
        const initialReward = BigInt(2) * BigInt(10 ** 18); // 2 SMC
        const halvingInterval = 210000;
        const halvings = Math.floor(blockNumber / halvingInterval);
        return initialReward / BigInt(2 ** Math.min(halvings, 64));
    }
}

export default BlockManager;
