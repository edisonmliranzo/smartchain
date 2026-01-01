// SmartChain JSON-RPC API Server
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import * as fs from 'fs';
import * as path from 'path';
import { Blockchain, CryptoUtils, TransactionManager } from '../core';
import { RPCRequest, RPCResponse, RPCError } from '../types';

const FAUCET_DATA_FILE = path.join(process.cwd(), 'data', 'faucet_used.json');

// Rate limiting configuration
const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 300, // 300 requests per minute per IP
    message: { error: 'Too many requests. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const faucetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour window
    max: 3, // 3 faucet requests per hour per IP
    message: { error: 'Faucet rate limit exceeded. Try again in 1 hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});

export class RPCServer {
    private app: express.Application;
    private blockchain: Blockchain;
    private port: number;
    private faucetUsedAddresses: Set<string> = new Set(); // Track addresses that have used faucet

    constructor(blockchain: Blockchain, port: number = 8545) {
        this.blockchain = blockchain;
        this.port = port;
        this.app = express();
        this.loadFaucetData(); // Load persisted faucet data
        this.setupMiddleware();
        this.setupRoutes();
    }

    private loadFaucetData(): void {
        try {
            if (fs.existsSync(FAUCET_DATA_FILE)) {
                const data = JSON.parse(fs.readFileSync(FAUCET_DATA_FILE, 'utf-8'));
                this.faucetUsedAddresses = new Set(data.usedAddresses || []);
                console.log(`[Faucet] Loaded ${this.faucetUsedAddresses.size} used addresses from disk`);
            }
        } catch (error) {
            console.error('[Faucet] Failed to load faucet data:', error);
        }
    }

    private saveFaucetData(): void {
        try {
            const dataDir = path.dirname(FAUCET_DATA_FILE);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            fs.writeFileSync(FAUCET_DATA_FILE, JSON.stringify({
                usedAddresses: Array.from(this.faucetUsedAddresses),
                lastUpdated: new Date().toISOString()
            }, null, 2));
        } catch (error) {
            console.error('[Faucet] Failed to save faucet data:', error);
        }
    }

    private setupMiddleware(): void {
        // CORS - Allow specific origins in production
        this.app.use(cors({
            origin: process.env.CORS_ORIGINS
                ? process.env.CORS_ORIGINS.split(',')
                : '*', // Allow all if not configured
            methods: ['GET', 'POST', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
        }));

        // Rate limiting - applied globally
        this.app.use(generalLimiter);

        this.app.use(express.json({ limit: '10mb' }));

        // Request logging (with rate limit indicator)
        this.app.use((req: Request, res: Response, next: NextFunction) => {
            const ip = req.ip || req.socket.remoteAddress || 'unknown';
            console.log(`[RPC] ${req.method} ${req.path} from ${ip}`);
            next();
        });
    }

    private setupRoutes(): void {
        // JSON-RPC endpoint (supports single and batch)
        this.app.post('/', async (req: Request, res: Response) => {
            const body = req.body;

            if (Array.isArray(body)) {
                // Handle batch request
                const results = await Promise.all(body.map(r => this.handleRPCRequest(r)));
                res.json(results);
            } else {
                // Handle single request
                const result = await this.handleRPCRequest(body);
                res.json(result);
            }
        });

        // Batch RPC requests
        this.app.post('/batch', async (req: Request, res: Response) => {
            const requests: RPCRequest[] = req.body;
            const results = await Promise.all(requests.map(r => this.handleRPCRequest(r)));
            res.json(results);
        });

        // Health check
        this.app.get('/health', (req: Request, res: Response) => {
            res.json({ status: 'ok', blockNumber: this.blockchain.getLatestBlockNumber() });
        });

        // Node info
        this.app.get('/info', (req: Request, res: Response) => {
            res.json(this.blockchain.getNodeInfo());
        });
    }

    private async handleRPCRequest(request: RPCRequest): Promise<RPCResponse> {
        const { jsonrpc, method, params, id } = request;

        try {
            const result = await this.executeMethod(method, params || []);
            return { jsonrpc: '2.0', result, id };
        } catch (error: any) {
            const rpcError: RPCError = {
                code: error.code || -32603,
                message: error.message || 'Internal error',
                data: error.data,
            };
            return { jsonrpc: '2.0', error: rpcError, id };
        }
    }

    private async executeMethod(method: string, params: any[]): Promise<any> {
        switch (method) {
            // Network methods
            case 'net_version':
                return this.blockchain.getChainId().toString();

            case 'net_listening':
                return true;

            case 'net_peerCount':
                return '0x0'; // TODO: P2P

            // Chain methods
            case 'eth_chainId':
                return CryptoUtils.toHex(this.blockchain.getChainId());

            case 'eth_blockNumber':
                return CryptoUtils.toHex(this.blockchain.getLatestBlockNumber());

            case 'eth_gasPrice':
                return CryptoUtils.toHex(this.blockchain.getGasPrice());

            case 'eth_syncing':
                return this.blockchain.getSyncStatus();

            // Account methods
            case 'eth_getBalance':
                return this.getBalance(params[0], params[1]);

            case 'eth_getTransactionCount':
                return this.getTransactionCount(params[0], params[1]);

            case 'eth_getCode':
                return this.getCode(params[0], params[1]);

            case 'eth_getStorageAt':
                return this.getStorageAt(params[0], params[1], params[2]);

            // Block methods
            case 'eth_getBlockByNumber':
                return this.getBlockByNumber(params[0], params[1]);

            case 'eth_getBlockByHash':
                return this.getBlockByHash(params[0], params[1]);

            case 'eth_getBlockTransactionCountByHash':
                return this.getBlockTransactionCountByHash(params[0]);

            case 'eth_getBlockTransactionCountByNumber':
                return this.getBlockTransactionCountByNumber(params[0]);

            // Transaction methods
            case 'eth_getTransactionByHash':
                return this.getTransactionByHash(params[0]);

            case 'eth_getTransactionByBlockHashAndIndex':
                return this.getTransactionByBlockHashAndIndex(params[0], params[1]);

            case 'eth_getTransactionByBlockNumberAndIndex':
                return this.getTransactionByBlockNumberAndIndex(params[0], params[1]);

            case 'eth_getTransactionReceipt':
                return this.getTransactionReceipt(params[0]);

            case 'eth_sendRawTransaction':
                return this.sendRawTransaction(params[0]);

            case 'eth_sendTransaction':
                return this.sendTransaction(params[0]);

            case 'eth_call':
                return this.call(params[0], params[1]);

            case 'eth_estimateGas':
                return this.estimateGas(params[0], params[1]);

            // Filter methods (simplified)
            case 'eth_newFilter':
                return '0x1'; // TODO: implement filters

            case 'eth_newBlockFilter':
                return '0x2';

            case 'eth_newPendingTransactionFilter':
                return '0x3';

            case 'eth_uninstallFilter':
                return true;

            case 'eth_getFilterChanges':
                return [];

            case 'eth_getFilterLogs':
                return [];

            case 'eth_getLogs':
                return this.getLogs(params[0]);

            // Mining methods
            case 'eth_mining':
                return this.blockchain.getNodeInfo().isMining;

            case 'eth_hashrate':
                return '0x0';

            case 'eth_coinbase':
                return this.blockchain.getNodeInfo().isValidator
                    ? '0x0000000000000000000000000000000000000000'
                    : null;

            // Accounts
            case 'eth_accounts':
                return [];

            // Client info
            case 'web3_clientVersion':
                return 'SmartChain/1.0.0';

            case 'web3_sha3':
                return CryptoUtils.hashHex(params[0]);

            // Personal namespace (for dev)
            case 'personal_newAccount':
                return this.personalNewAccount(params[0]);

            case 'personal_unlockAccount':
                return true;

            case 'personal_listAccounts':
                return [];

            // Debug methods
            case 'debug_traceTransaction':
                return null;

            case 'debug_traceBlock':
                return null;

            // SmartChain specific
            case 'smc_getValidators':
                return this.blockchain.getConfig().validators;

            case 'smc_getNodeInfo':
                return this.blockchain.getNodeInfo();

            case 'smc_getMempoolStats':
                return this.getMempoolStats();

            case 'smc_getRecentBlocks':
                return this.getRecentBlocks(params[0] || 10);

            case 'smc_faucet':
                return this.faucet(params[0], params[1]);

            default:
                throw { code: -32601, message: `Method ${method} not found` };
        }
    }

    // Method implementations
    private getBalance(address: string, blockTag: string = 'latest'): string {
        const balance = this.blockchain.getBalance(address);
        return CryptoUtils.toHex(balance);
    }

    private getTransactionCount(address: string, blockTag: string = 'latest'): string {
        const nonce = this.blockchain.getNonce(address);
        return CryptoUtils.toHex(nonce);
    }

    private getCode(address: string, blockTag: string = 'latest'): string {
        return this.blockchain.getCode(address);
    }

    private getStorageAt(address: string, position: string, blockTag: string = 'latest'): string {
        return this.blockchain.getStorageAt(address, position);
    }

    private getBlockByNumber(blockNumber: string, includeTransactions: boolean = false): any {
        const num = blockNumber === 'latest' ? 'latest'
            : blockNumber === 'earliest' ? 'earliest'
                : blockNumber === 'pending' ? 'pending'
                    : parseInt(blockNumber, 16);

        const block = this.blockchain.getBlockByNumber(num as any);
        return block ? this.formatBlock(block, includeTransactions) : null;
    }

    private getBlockByHash(blockHash: string, includeTransactions: boolean = false): any {
        const block = this.blockchain.getBlockByHash(blockHash);
        return block ? this.formatBlock(block, includeTransactions) : null;
    }

    private getBlockTransactionCountByHash(blockHash: string): string | null {
        const block = this.blockchain.getBlockByHash(blockHash);
        return block ? CryptoUtils.toHex(block.transactions.length) : null;
    }

    private getBlockTransactionCountByNumber(blockNumber: string): string | null {
        const num = blockNumber === 'latest' ? 'latest' : parseInt(blockNumber, 16);
        const block = this.blockchain.getBlockByNumber(num as any);
        return block ? CryptoUtils.toHex(block.transactions.length) : null;
    }

    private getTransactionByHash(txHash: string): any {
        const tx = this.blockchain.getTransaction(txHash);
        return tx ? this.formatTransaction(tx) : null;
    }

    private getTransactionByBlockHashAndIndex(blockHash: string, index: string): any {
        const block = this.blockchain.getBlockByHash(blockHash);
        if (!block) return null;
        const idx = parseInt(index, 16);
        const tx = block.transactions[idx];
        return tx ? this.formatTransaction(tx) : null;
    }

    private getTransactionByBlockNumberAndIndex(blockNumber: string, index: string): any {
        const num = blockNumber === 'latest' ? 'latest' : parseInt(blockNumber, 16);
        const block = this.blockchain.getBlockByNumber(num as any);
        if (!block) return null;
        const idx = parseInt(index, 16);
        const tx = block.transactions[idx];
        return tx ? this.formatTransaction(tx) : null;
    }

    private getTransactionReceipt(txHash: string): any {
        const receipt = this.blockchain.getTransactionReceipt(txHash);
        return receipt ? this.formatReceipt(receipt) : null;
    }

    private async sendRawTransaction(signedTx: string): Promise<string> {
        const result = await this.blockchain.sendTransaction(signedTx);
        if (result.error) {
            throw { code: -32000, message: result.error };
        }
        return result.hash!;
    }

    private async sendTransaction(txParams: any): Promise<string> {
        // This would require account management for signing
        throw { code: -32601, message: 'eth_sendTransaction requires unlocked account' };
    }

    private async call(txParams: any, blockTag: string = 'latest'): Promise<string> {
        return this.blockchain.call({
            from: txParams.from,
            to: txParams.to,
            data: txParams.data || '0x',
            value: txParams.value ? BigInt(txParams.value) : undefined,
            gasLimit: txParams.gas ? BigInt(txParams.gas) : undefined,
        });
    }

    private async estimateGas(txParams: any, blockTag: string = 'latest'): Promise<string> {
        const gas = await this.blockchain.estimateGas({
            from: txParams.from,
            to: txParams.to,
            value: txParams.value ? BigInt(txParams.value) : BigInt(0),
            data: txParams.data || '0x',
            gasLimit: txParams.gas ? BigInt(txParams.gas) : BigInt(21000),
        });
        return CryptoUtils.toHex(gas);
    }

    private getLogs(filter: any): any[] {
        const fromBlock = this.resolveBlockNumber(filter.fromBlock || 'latest');
        const toBlock = this.resolveBlockNumber(filter.toBlock || 'latest');
        const address = filter.address ? (Array.isArray(filter.address) ? filter.address : [filter.address]).map((a: string) => a.toLowerCase()) : null;
        const topics = filter.topics || [];

        const logs: any[] = [];

        // Limit range to last 100 blocks if not specified to avoid massive loops in dev
        const start = fromBlock === -1 ? Math.max(0, this.blockchain.getLatestBlockNumber() - 100) : fromBlock;
        const end = toBlock === -1 ? this.blockchain.getLatestBlockNumber() : toBlock;

        for (let i = start; i <= end; i++) {
            const block = this.blockchain.getBlockByNumber(i);
            if (!block) continue;

            for (const tx of block.transactions) {
                const receipt = this.blockchain.getTransactionReceipt(tx.hash);
                if (!receipt) continue;

                for (const log of receipt.logs) {
                    // Filter by address
                    if (address && !address.includes(log.address.toLowerCase())) continue;

                    // Filter by topics (simplified exact match for first topic)
                    if (topics.length > 0 && topics[0]) {
                        if (log.topics[0] !== topics[0]) continue;
                    }

                    logs.push({
                        ...log,
                        logIndex: CryptoUtils.toHex(log.logIndex),
                        blockNumber: CryptoUtils.toHex(log.blockNumber),
                        transactionIndex: CryptoUtils.toHex(log.transactionIndex),
                        blockHash: log.blockHash,
                        transactionHash: log.transactionHash,
                    });
                }
            }
        }
        return logs;
    }

    private resolveBlockNumber(blockTag: string): number {
        if (blockTag === 'latest') return this.blockchain.getLatestBlockNumber();
        if (blockTag === 'earliest') return 0;
        if (blockTag === 'pending') return this.blockchain.getLatestBlockNumber();
        if (blockTag.startsWith('0x')) return parseInt(blockTag, 16);
        return parseInt(blockTag);
    }

    private personalNewAccount(password: string): string {
        const wallet = CryptoUtils.generateWallet();
        return wallet.address;
    }

    private getMempoolStats(): any {
        const stats = this.blockchain.mempool.getStats();
        return {
            pending: stats.pending,
            queued: stats.queued,
            totalGas: CryptoUtils.toHex(stats.totalGas),
            avgGasPrice: CryptoUtils.toHex(stats.avgGasPrice),
            minGasPrice: CryptoUtils.toHex(stats.minGasPrice),
            maxGasPrice: CryptoUtils.toHex(stats.maxGasPrice),
        };
    }

    private getRecentBlocks(count: number): any[] {
        const blocks = this.blockchain.getRecentBlocks(count);
        return blocks.map(b => this.formatBlock(b, false));
    }

    private async faucet(address: string, amount: string = '10000000000000000000'): Promise<string> {
        // Normalize address to lowercase for consistent comparison
        const normalizedAddress = address.toLowerCase();

        // Check if address has already used the faucet
        if (this.faucetUsedAddresses.has(normalizedAddress)) {
            throw { code: -32000, message: 'Faucet already used for this address. Each address can only use the faucet once.' };
        }

        // Add funds to address (10 SMC = 10 * 10^18 wei)
        const amountBigInt = BigInt(amount);
        this.blockchain.state.addBalance(address, amountBigInt);

        // Mark address as having used the faucet
        this.faucetUsedAddresses.add(normalizedAddress);

        // Persist to disk
        this.saveFaucetData();

        console.log(`[Faucet] Sent ${TransactionManager.formatValue(amountBigInt)} SMC to ${address} (Total faucet users: ${this.faucetUsedAddresses.size})`);

        return `Sent ${TransactionManager.formatValue(amountBigInt)} SMC to ${address}. This was your one-time faucet allocation.`;
    }

    // Formatters
    private formatBlock(block: any, includeTransactions: boolean): any {
        return {
            number: CryptoUtils.toHex(block.header.number),
            hash: block.hash,
            parentHash: block.header.parentHash,
            nonce: block.header.nonce,
            sha3Uncles: '0x' + '0'.repeat(64),
            logsBloom: '0x' + '0'.repeat(512),
            transactionsRoot: block.header.transactionsRoot,
            stateRoot: block.header.stateRoot,
            receiptsRoot: block.header.receiptsRoot,
            miner: block.header.miner,
            difficulty: CryptoUtils.toHex(block.header.difficulty),
            totalDifficulty: CryptoUtils.toHex(block.header.difficulty),
            extraData: block.header.extraData,
            size: CryptoUtils.toHex(block.size),
            gasLimit: CryptoUtils.toHex(block.header.gasLimit),
            gasUsed: CryptoUtils.toHex(block.header.gasUsed),
            timestamp: CryptoUtils.toHex(Math.floor(block.header.timestamp / 1000)),
            transactions: includeTransactions
                ? block.transactions.map((tx: any) => this.formatTransaction(tx))
                : block.transactions.map((tx: any) => tx.hash),
            uncles: [],
            mixHash: block.header.mixHash,
        };
    }

    private formatTransaction(tx: any): any {
        return {
            hash: tx.hash,
            nonce: CryptoUtils.toHex(tx.nonce),
            blockHash: tx.blockHash || null,
            blockNumber: tx.blockNumber !== undefined ? CryptoUtils.toHex(tx.blockNumber) : null,
            transactionIndex: tx.transactionIndex !== undefined ? CryptoUtils.toHex(tx.transactionIndex) : null,
            from: tx.from,
            to: tx.to,
            value: CryptoUtils.toHex(tx.value),
            gasPrice: CryptoUtils.toHex(tx.gasPrice),
            gas: CryptoUtils.toHex(tx.gasLimit),
            input: tx.data,
            v: CryptoUtils.toHex(tx.v),
            r: tx.r,
            s: tx.s,
        };
    }

    private formatReceipt(receipt: any): any {
        return {
            transactionHash: receipt.transactionHash,
            transactionIndex: CryptoUtils.toHex(receipt.transactionIndex),
            blockHash: receipt.blockHash,
            blockNumber: CryptoUtils.toHex(receipt.blockNumber),
            from: receipt.from,
            to: receipt.to,
            cumulativeGasUsed: CryptoUtils.toHex(receipt.cumulativeGasUsed),
            gasUsed: CryptoUtils.toHex(receipt.gasUsed),
            contractAddress: receipt.contractAddress,
            logs: receipt.logs.map((log: any, index: number) => ({
                ...log,
                logIndex: CryptoUtils.toHex(index),
                blockNumber: CryptoUtils.toHex(log.blockNumber),
                transactionIndex: CryptoUtils.toHex(log.transactionIndex),
            })),
            logsBloom: receipt.logsBloom,
            status: CryptoUtils.toHex(receipt.status),
        };
    }

    /**
     * Start the RPC server
     */
    start(): Promise<void> {
        return new Promise((resolve) => {
            this.app.listen(this.port, () => {
                console.log(`JSON-RPC server running on http://localhost:${this.port}`);
                resolve();
            });
        });
    }

    /**
     * Get Express app (for integration)
     */
    getApp(): express.Application {
        return this.app;
    }
}

export default RPCServer;
