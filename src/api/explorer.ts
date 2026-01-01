// SmartChain REST API for Explorer
import express, { Request, Response, Router } from 'express';
import { Blockchain, CryptoUtils, TransactionManager } from '../core';

export class ExplorerAPI {
    private router: Router;
    private blockchain: Blockchain;

    constructor(blockchain: Blockchain) {
        this.blockchain = blockchain;
        this.router = express.Router();
        this.setupRoutes();
    }

    private setupRoutes(): void {
        // Blocks
        this.router.get('/blocks', this.getBlocks.bind(this));
        this.router.get('/blocks/latest', this.getLatestBlock.bind(this));
        this.router.get('/blocks/:identifier', this.getBlock.bind(this));

        // Transactions
        this.router.get('/transactions', this.getTransactions.bind(this));
        this.router.get('/transactions/pending', this.getPendingTransactions.bind(this));
        this.router.get('/transactions/:hash', this.getTransaction.bind(this));
        this.router.get('/transactions/:hash/receipt', this.getReceipt.bind(this));

        // Accounts
        this.router.get('/accounts/:address', this.getAccount.bind(this));
        this.router.get('/accounts/:address/transactions', this.getAccountTransactions.bind(this));
        this.router.get('/accounts/:address/balance', this.getAccountBalance.bind(this));

        // Chain info
        this.router.get('/chain/info', this.getChainInfo.bind(this));
        this.router.get('/chain/stats', this.getChainStats.bind(this));
        this.router.get('/chain/validators', this.getValidators.bind(this));

        // Mempool
        this.router.get('/mempool/stats', this.getMempoolStats.bind(this));

        // Faucet
        this.router.post('/faucet', this.faucet.bind(this));

        // Search
        this.router.get('/search/:query', this.search.bind(this));

        // Rich List
        this.router.get('/rich-list', this.getRichList.bind(this));
    }

    // Block endpoints
    private getBlocks(req: Request, res: Response): void {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
        const latestBlock = this.blockchain.getLatestBlockNumber();

        const startBlock = Math.max(0, latestBlock - (page - 1) * limit - limit + 1);
        const endBlock = Math.max(0, latestBlock - (page - 1) * limit);

        const blocks = this.blockchain.getBlocksInRange(startBlock, endBlock)
            .reverse()
            .map(b => this.formatBlockSummary(b));

        res.json({
            blocks,
            pagination: {
                page,
                limit,
                total: latestBlock + 1,
                totalPages: Math.ceil((latestBlock + 1) / limit),
            },
        });
    }

    private getLatestBlock(req: Request, res: Response): void {
        const block = this.blockchain.getLatestBlock();
        if (block) {
            res.json(this.formatBlockFull(block));
        } else {
            res.status(404).json({ error: 'No blocks found' });
        }
    }

    private getBlock(req: Request, res: Response): void {
        const { identifier } = req.params;

        let block;
        if (identifier.startsWith('0x')) {
            block = this.blockchain.getBlockByHash(identifier);
        } else {
            block = this.blockchain.getBlockByNumber(parseInt(identifier));
        }

        if (block) {
            res.json(this.formatBlockFull(block));
        } else {
            res.status(404).json({ error: 'Block not found' });
        }
    }

    // Transaction endpoints
    private getTransactions(req: Request, res: Response): void {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

        // Get recent transactions from recent blocks
        const recentBlocks = this.blockchain.getRecentBlocks(50);
        const allTxs: any[] = [];

        for (const block of recentBlocks) {
            for (const tx of block.transactions) {
                allTxs.push(this.formatTransactionSummary(tx, block));
            }
        }

        const start = (page - 1) * limit;
        const paginatedTxs = allTxs.slice(start, start + limit);

        res.json({
            transactions: paginatedTxs,
            pagination: {
                page,
                limit,
                total: allTxs.length,
                totalPages: Math.ceil(allTxs.length / limit),
            },
        });
    }

    private getPendingTransactions(req: Request, res: Response): void {
        const pendingTxs = this.blockchain.mempool.getAllTransactions();
        res.json({
            transactions: pendingTxs.map(tx => this.formatTransactionSummary(tx)),
            count: pendingTxs.length,
        });
    }

    private getTransaction(req: Request, res: Response): void {
        const { hash } = req.params;
        const tx = this.blockchain.getTransaction(hash);

        if (tx) {
            const receipt = this.blockchain.getTransactionReceipt(hash);
            res.json(this.formatTransactionFull(tx, receipt));
        } else {
            res.status(404).json({ error: 'Transaction not found' });
        }
    }

    private getReceipt(req: Request, res: Response): void {
        const { hash } = req.params;
        const receipt = this.blockchain.getTransactionReceipt(hash);

        if (receipt) {
            res.json(this.formatReceipt(receipt));
        } else {
            res.status(404).json({ error: 'Receipt not found' });
        }
    }

    // Account endpoints
    private getAccount(req: Request, res: Response): void {
        const { address } = req.params;

        if (!CryptoUtils.isValidAddress(address)) {
            res.status(400).json({ error: 'Invalid address' });
            return;
        }

        const account = this.blockchain.state.getAccount(address);
        const code = this.blockchain.getCode(address);
        const isContract = code !== '0x' && code !== '';

        res.json({
            address: CryptoUtils.checksumAddress(address),
            balance: account.balance.toString(),
            balanceFormatted: TransactionManager.formatValue(account.balance) + ' SMC',
            nonce: account.nonce,
            isContract,
            codeHash: account.codeHash,
        });
    }

    private getAccountTransactions(req: Request, res: Response): void {
        const { address } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

        const transactions = this.blockchain.getTransactionsByAddress(address);
        const start = (page - 1) * limit;
        const paginatedTxs = transactions.slice(start, start + limit);

        res.json({
            transactions: paginatedTxs.map(tx => this.formatTransactionSummary(tx)),
            pagination: {
                page,
                limit,
                total: transactions.length,
                totalPages: Math.ceil(transactions.length / limit),
            },
        });
    }

    private getAccountBalance(req: Request, res: Response): void {
        const { address } = req.params;
        const balance = this.blockchain.getBalance(address);

        res.json({
            address: CryptoUtils.checksumAddress(address),
            balance: balance.toString(),
            balanceFormatted: TransactionManager.formatValue(balance) + ' SMC',
            balanceEth: TransactionManager.formatValue(balance),
        });
    }

    // Chain info endpoints
    private getChainInfo(req: Request, res: Response): void {
        const config = this.blockchain.getConfig();
        const nodeInfo = this.blockchain.getNodeInfo();

        res.json({
            chainId: config.chainId,
            chainName: config.chainName,
            symbol: config.symbol,
            blockTime: config.blockTime,
            blockGasLimit: config.blockGasLimit.toString(),
            latestBlockNumber: this.blockchain.getLatestBlockNumber(),
            version: nodeInfo.version,
            peers: nodeInfo.peers,
            currentBlock: nodeInfo.currentBlock,
            pendingTransactions: nodeInfo.pendingTransactions,
            isValidator: nodeInfo.isValidator,
            isMining: nodeInfo.isMining,
        });
    }

    private getChainStats(req: Request, res: Response): void {
        const recentBlocks = this.blockchain.getRecentBlocks(100);

        let totalTxs = 0;
        let totalGasUsed = BigInt(0);

        for (const block of recentBlocks) {
            totalTxs += block.transactions.length;
            totalGasUsed += block.header.gasUsed;
        }

        let avgBlockTime = 0;
        const firstBlock = recentBlocks[0];
        const lastBlock = recentBlocks[recentBlocks.length - 1];
        if (recentBlocks.length > 1 && firstBlock && lastBlock) {
            avgBlockTime = (firstBlock.header.timestamp - lastBlock.header.timestamp) / (recentBlocks.length - 1);
        }

        res.json({
            latestBlockNumber: this.blockchain.getLatestBlockNumber(),
            totalBlocks: this.blockchain.getLatestBlockNumber() + 1,
            totalAccounts: this.blockchain.state.getAccountCount(),
            totalSupply: this.blockchain.state.getTotalSupply().toString(),
            totalSupplyFormatted: TransactionManager.formatValue(this.blockchain.state.getTotalSupply()) + ' SMC',
            recentTransactions: totalTxs,
            recentGasUsed: totalGasUsed.toString(),
            averageBlockTime: Math.round(avgBlockTime),
            pendingTransactions: this.blockchain.mempool.getSize(),
            gasPrice: this.blockchain.getGasPrice().toString(),
        });
    }

    private getValidators(req: Request, res: Response): void {
        const config = this.blockchain.getConfig();
        const recentBlocks = this.blockchain.getRecentBlocks(100);

        // Count blocks per validator
        const blockCounts: { [address: string]: number } = {};
        for (const block of recentBlocks) {
            const miner = block.header.miner.toLowerCase();
            blockCounts[miner] = (blockCounts[miner] || 0) + 1;
        }

        const validatorStats = config.validators.map((address, index) => {
            const normalizedAddr = address.toLowerCase();
            const blocksSigned = blockCounts[normalizedAddr] || 0;
            const names = ['Atlas Node', 'Zeus Prime', 'Hermes Oracle', 'Apollo Forge', 'Athena Core'];

            // Determine status based on activity
            let status = 'registered';
            if (blocksSigned > 0) {
                status = 'active';
            }

            return {
                address: address,
                name: names[index] || `Validator ${index + 1}`,
                blocksSigned,
                uptime: recentBlocks.length > 0 ? (blocksSigned / recentBlocks.length * 100).toFixed(2) : '0.00',
                status,
                isActive: blocksSigned > 0,
                commission: '0.00%'
            };
        });

        // Sort: active validators first, then by blocks signed
        validatorStats.sort((a, b) => {
            if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
            return b.blocksSigned - a.blocksSigned;
        });

        res.json({
            validators: validatorStats,
            count: validatorStats.length,
            activeCount: validatorStats.filter(v => v.isActive).length,
            totalRecentBlocks: recentBlocks.length
        });
    }

    // Mempool endpoints
    private getMempoolStats(req: Request, res: Response): void {
        const stats = this.blockchain.mempool.getStats();
        res.json({
            pending: stats.pending,
            queued: stats.queued,
            totalGas: stats.totalGas.toString(),
            avgGasPrice: stats.avgGasPrice.toString(),
            minGasPrice: stats.minGasPrice.toString(),
            maxGasPrice: stats.maxGasPrice.toString(),
        });
    }

    // Faucet endpoint
    private faucet(req: Request, res: Response): void {
        const { address } = req.body;

        if (!address || !CryptoUtils.isValidAddress(address)) {
            res.status(400).json({ error: 'Invalid address' });
            return;
        }

        const amount = BigInt(10) * BigInt(10 ** 18); // 10 SMC
        this.blockchain.state.addBalance(address, amount);

        res.json({
            success: true,
            address: CryptoUtils.checksumAddress(address),
            amount: amount.toString(),
            amountFormatted: '10 SMC',
            newBalance: this.blockchain.getBalance(address).toString(),
        });
    }

    private getRichList(req: Request, res: Response): void {
        const limit = parseInt(req.query.limit as string) || 10;
        const accounts = this.blockchain.state.getAllAccounts();

        const richList = accounts
            .sort((a, b) => {
                if (b.balance > a.balance) return 1;
                if (b.balance < a.balance) return -1;
                return 0;
            })
            .slice(0, limit)
            .map(acc => ({
                address: acc.address,
                balance: acc.balance.toString(),
                balanceFormatted: TransactionManager.formatValue(acc.balance) + ' SMC',
            }));

        res.json({
            accounts: richList,
            totalAccounts: accounts.length,
        });
    }

    // Search endpoint
    private search(req: Request, res: Response): void {
        const { query } = req.params;

        // Check if it's a block number
        if (/^\d+$/.test(query)) {
            const block = this.blockchain.getBlockByNumber(parseInt(query));
            if (block) {
                res.json({ type: 'block', data: this.formatBlockSummary(block) });
                return;
            }
        }

        // Check if it's a hash (block or transaction)
        if (query.startsWith('0x') && query.length === 66) {
            const block = this.blockchain.getBlockByHash(query);
            if (block) {
                res.json({ type: 'block', data: this.formatBlockSummary(block) });
                return;
            }

            const tx = this.blockchain.getTransaction(query);
            if (tx) {
                res.json({ type: 'transaction', data: this.formatTransactionSummary(tx) });
                return;
            }
        }

        // Check if it's an address
        if (CryptoUtils.isValidAddress(query)) {
            const account = this.blockchain.state.getAccount(query);
            res.json({
                type: 'address',
                data: {
                    address: CryptoUtils.checksumAddress(query),
                    balance: account.balance.toString(),
                    balanceFormatted: TransactionManager.formatValue(account.balance) + ' SMC',
                    nonce: account.nonce,
                },
            });
            return;
        }

        res.status(404).json({ error: 'Not found' });
    }

    // Formatters
    private formatBlockSummary(block: any): any {
        return {
            number: block.header.number,
            hash: block.hash,
            parentHash: block.header.parentHash,
            timestamp: block.header.timestamp,
            miner: block.header.miner,
            transactionCount: block.transactions.length,
            gasUsed: block.header.gasUsed.toString(),
            gasLimit: block.header.gasLimit.toString(),
            size: block.size,
        };
    }

    private formatBlockFull(block: any): any {
        return {
            ...this.formatBlockSummary(block),
            stateRoot: block.header.stateRoot,
            transactionsRoot: block.header.transactionsRoot,
            receiptsRoot: block.header.receiptsRoot,
            difficulty: block.header.difficulty.toString(),
            extraData: block.header.extraData,
            nonce: block.header.nonce,
            transactions: block.transactions.map((tx: any) => this.formatTransactionSummary(tx, block)),
        };
    }

    private formatTransactionSummary(tx: any, block?: any): any {
        return {
            hash: tx.hash,
            blockNumber: tx.blockNumber ?? block?.header.number,
            blockHash: tx.blockHash ?? block?.hash,
            from: tx.from,
            to: tx.to,
            value: tx.value.toString(),
            valueFormatted: TransactionManager.formatValue(tx.value) + ' SMC',
            gasPrice: tx.gasPrice.toString(),
            gasLimit: tx.gasLimit.toString(),
            nonce: tx.nonce,
            timestamp: block?.header.timestamp,
        };
    }

    private formatTransactionFull(tx: any, receipt?: any): any {
        return {
            ...this.formatTransactionSummary(tx),
            data: tx.data,
            v: tx.v,
            r: tx.r,
            s: tx.s,
            receipt: receipt ? this.formatReceipt(receipt) : null,
        };
    }

    private formatReceipt(receipt: any): any {
        return {
            transactionHash: receipt.transactionHash,
            transactionIndex: receipt.transactionIndex,
            blockHash: receipt.blockHash,
            blockNumber: receipt.blockNumber,
            from: receipt.from,
            to: receipt.to,
            contractAddress: receipt.contractAddress,
            cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
            gasUsed: receipt.gasUsed.toString(),
            status: receipt.status === 1 ? 'success' : 'failed',
            logs: receipt.logs,
        };
    }

    /**
     * Get router
     */
    getRouter(): Router {
        return this.router;
    }
}

export default ExplorerAPI;
