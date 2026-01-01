// SmartChain P2P Network Layer
import WebSocket, { WebSocketServer } from 'ws';
import EventEmitter from 'events';
import { Block, Transaction } from '../types';
import { Blockchain } from '../core';
import { CryptoUtils } from '../core/crypto';

interface PeerInfo {
    id: string;
    address: string;
    port: number;
    ws?: WebSocket;
    lastSeen: number;
    blockHeight: number;
    isValidator: boolean;
}

interface P2PMessage {
    type: string;
    data: any;
    timestamp: number;
    nodeId: string;
    signature?: string;
}

export class P2PNetwork extends EventEmitter {
    private nodeId: string;
    private port: number;
    private server: WebSocketServer | null = null;
    private peers: Map<string, PeerInfo> = new Map();
    private blockchain: Blockchain;
    private validatorKey: string | null = null;
    private seedNodes: string[];
    private maxPeers: number = 25;
    private reconnectInterval: NodeJS.Timeout | null = null;

    constructor(blockchain: Blockchain, port: number = 9545, seedNodes: string[] = []) {
        super();
        this.blockchain = blockchain;
        this.port = port;
        this.seedNodes = seedNodes;
        this.nodeId = CryptoUtils.generateWallet().address.slice(2, 18); // Short node ID
    }

    /**
     * Set validator private key for block signing
     */
    setValidatorKey(privateKey: string): void {
        this.validatorKey = privateKey;
        console.log(`[P2P] Validator mode enabled`);
    }

    /**
     * Start the P2P server
     */
    async start(): Promise<void> {
        return new Promise((resolve) => {
            this.server = new WebSocketServer({ port: this.port });

            this.server.on('connection', (ws, req) => {
                const peerAddress = req.socket.remoteAddress || 'unknown';
                console.log(`[P2P] Incoming connection from ${peerAddress}`);
                this.handleConnection(ws, peerAddress);
            });

            this.server.on('listening', () => {
                console.log(`[P2P] Network listening on port ${this.port}`);
                console.log(`[P2P] Node ID: ${this.nodeId}`);
                resolve();
            });

            // Connect to seed nodes
            this.connectToSeeds();

            // Periodic peer maintenance
            this.reconnectInterval = setInterval(() => {
                this.maintainPeers();
            }, 30000);

            // Listen for blockchain events
            this.blockchain.on('newBlock', (block) => {
                this.broadcastBlock(block);
            });
        });
    }

    /**
     * Connect to seed nodes
     */
    private connectToSeeds(): void {
        for (const seed of this.seedNodes) {
            this.connectToPeer(seed);
        }
    }

    /**
     * Connect to a peer
     */
    connectToPeer(address: string): void {
        // Check if we are already connected to this address
        for (const peer of this.peers.values()) {
            if (peer.address === address) return;
        }

        if (this.peers.size >= this.maxPeers) return;

        try {
            const ws = new WebSocket(address);

            ws.on('open', () => {
                console.log(`[P2P] Connected to peer: ${address}`);
                this.handleConnection(ws, address, true);
            });

            ws.on('error', (err) => {
                console.log(`[P2P] Failed to connect to ${address}: ${err.message}`);
            });
        } catch (error) {
            console.log(`[P2P] Error connecting to ${address}`);
        }
    }

    /**
     * Handle a new connection
     */
    private handleConnection(ws: WebSocket, address: string, isOutbound: boolean = false): void {
        const peerId = `${address}-${Date.now()}`;

        const peer: PeerInfo = {
            id: peerId,
            address: address,
            port: this.port,
            ws: ws,
            lastSeen: Date.now(),
            blockHeight: 0,
            isValidator: false
        };

        this.peers.set(peerId, peer);

        // Send handshake
        this.sendMessage(ws, {
            type: 'handshake',
            data: {
                nodeId: this.nodeId,
                blockHeight: this.blockchain.getLatestBlockNumber(),
                chainId: this.blockchain.getConfig().chainId,
                version: '1.0.0'
            }
        });

        ws.on('message', (data) => {
            try {
                const message: P2PMessage = JSON.parse(data.toString());
                this.handleMessage(peer, message);
            } catch (error) {
                console.log(`[P2P] Invalid message from ${peerId}`);
            }
        });

        ws.on('close', () => {
            console.log(`[P2P] Peer disconnected: ${address}`);
            this.peers.delete(peerId);
        });

        ws.on('error', () => {
            this.peers.delete(peerId);
        });
    }

    /**
     * Handle incoming messages
     */
    private handleMessage(peer: PeerInfo, message: P2PMessage): void {
        peer.lastSeen = Date.now();

        switch (message.type) {
            case 'handshake':
                this.handleHandshake(peer, message.data);
                break;

            case 'block':
                this.handleNewBlock(peer, message.data);
                break;

            case 'transaction':
                this.handleNewTransaction(peer, message.data);
                break;

            case 'getBlocks':
                this.handleGetBlocks(peer, message.data);
                break;

            case 'blocks':
                this.handleBlocks(peer, message.data);
                break;

            case 'getPeers':
                this.handleGetPeers(peer);
                break;

            case 'peers':
                this.handlePeers(peer, message.data);
                break;

            case 'ping':
                // Just update lastSeen (already done at start of function)
                break;

            default:
                console.log(`[P2P] Unknown message type: ${message.type}`);
        }
    }

    /**
     * Handle handshake
     */
    private handleHandshake(peer: PeerInfo, data: any): void {
        peer.blockHeight = data.blockHeight || 0;
        console.log(`[P2P] Handshake from ${data.nodeId} at height ${peer.blockHeight}`);

        // Check if we need to sync
        const ourHeight = this.blockchain.getLatestBlockNumber();
        if (peer.blockHeight > ourHeight) {
            console.log(`[P2P] Peer has higher chain, requesting blocks ${ourHeight + 1} to ${peer.blockHeight}`);
            this.requestBlocks(peer, ourHeight + 1, peer.blockHeight);
        }

        // Request peers from this node
        if (peer.ws) {
            this.sendMessage(peer.ws, { type: 'getPeers', data: {} });
        }
    }

    /**
     * Handle new block
     */
    private async handleNewBlock(peer: PeerInfo, blockData: any): Promise<void> {
        try {
            const currentHeight = this.blockchain.getLatestBlockNumber();
            if (blockData.number && blockData.number > currentHeight + 1) {
                console.log(`[P2P] Detected gap (current: ${currentHeight}, received: ${blockData.number}). Triggering sync.`);
                this.requestBlocks(peer, currentHeight + 1, blockData.number);
                return;
            }

            // Verify block signature if present
            if (blockData.signature) {
                const isValid = this.verifyBlockSignature(blockData);
                if (!isValid) {
                    console.log(`[P2P] Invalid block signature from ${peer.id}`);
                    return;
                }
            }

            // Add block to chain
            const result = await this.blockchain.addBlock(blockData);
            if (result.success) {
                console.log(`[P2P] Added block #${blockData.header.number} from peer`);
                peer.blockHeight = blockData.header.number;
            }
        } catch (error) {
            console.log(`[P2P] Failed to add block:`, error);
        }
    }

    /**
     * Handle new transaction
     */
    private handleNewTransaction(peer: PeerInfo, txData: Transaction): void {
        try {
            this.blockchain.mempool.addTransaction(txData as any, this.blockchain.state);
            console.log(`[P2P] Added transaction ${txData.hash.slice(0, 10)}... from peer`);
        } catch (error) {
            // Transaction might already exist
        }
    }

    /**
     * Handle block request
     */
    private handleGetBlocks(peer: PeerInfo, data: any): void {
        const { from, to } = data;
        const blocks = this.blockchain.getBlocksInRange(from, to);

        if (peer.ws) {
            this.sendMessage(peer.ws, {
                type: 'blocks',
                data: blocks
            });
        }
    }

    /**
     * Handle received blocks
     */
    private async handleBlocks(peer: PeerInfo, blocks: any[]): Promise<void> {
        console.log(`[P2P] Received ${blocks.length} blocks from peer`);

        // Sort by block number
        blocks.sort((a, b) => a.header.number - b.header.number);

        for (const block of blocks) {
            const result = await this.blockchain.addBlock(block);
            if (result.success) {
                console.log(`[P2P] Synced block #${block.header.number}`);
            }
        }
    }

    /**
     * Handle peers request
     */
    private handleGetPeers(peer: PeerInfo): void {
        const peerList = Array.from(this.peers.values()).map(p => ({
            address: p.address,
            port: p.port,
            blockHeight: p.blockHeight
        }));

        if (peer.ws) {
            this.sendMessage(peer.ws, {
                type: 'peers',
                data: peerList
            });
        }
    }

    /**
     * Handle received peers
     */
    private handlePeers(peer: PeerInfo, peerList: any[]): void {
        for (const p of peerList) {
            if (!p.address || p.address.includes(this.nodeId)) continue;

            // Build peer URL - avoid double ws:// prefix
            let peerUrl = p.address;
            if (!peerUrl.startsWith('ws://') && !peerUrl.startsWith('wss://')) {
                peerUrl = `ws://${peerUrl}`;
            }
            // Avoid double port
            if (!peerUrl.includes(':9545') && !peerUrl.includes(':8546')) {
                peerUrl = `${peerUrl}:${p.port || 9545}`;
            }

            this.connectToPeer(peerUrl);
        }
    }

    /**
     * Request blocks from peer
     */
    private requestBlocks(peer: PeerInfo, from: number, to: number): void {
        if (peer.ws) {
            this.sendMessage(peer.ws, {
                type: 'getBlocks',
                data: { from, to }
            });
        }
    }

    /**
     * Broadcast a new block to all peers
     */
    broadcastBlock(block: Block): void {
        // Sign block if we're a validator
        const blockData = this.validatorKey ? this.signBlock(block) : block;

        this.broadcast({
            type: 'block',
            data: blockData
        });
    }

    /**
     * Broadcast a new transaction to all peers
     */
    broadcastTransaction(tx: Transaction): void {
        this.broadcast({
            type: 'transaction',
            data: tx
        });
    }

    /**
     * Sign a block (simplified - just attach validator address for now)
     */
    private signBlock(block: Block): any {
        if (!this.validatorKey) return block;

        // For now, just attach the validator address as a simple signature
        // In production, this would use proper cryptographic signing
        const wallet = CryptoUtils.walletFromPrivateKey(this.validatorKey);

        return {
            ...block,
            validatorAddress: wallet.address,
            signedAt: Date.now()
        };
    }

    /**
     * Verify block signature (simplified)
     */
    private verifyBlockSignature(block: any): boolean {
        if (!block.validatorAddress) return true; // Allow unsigned blocks for now

        try {
            // Check if signer is a validator
            const validators = this.blockchain.getConfig().validators;
            return validators.some(v => v.toLowerCase() === block.validatorAddress.toLowerCase());
        } catch (error) {
            return false;
        }
    }

    /**
     * Broadcast message to all peers
     */
    private broadcast(message: Partial<P2PMessage>): void {
        const fullMessage: P2PMessage = {
            type: message.type || '',
            data: message.data,
            timestamp: Date.now(),
            nodeId: this.nodeId
        };

        // Handle BigInt serialization
        const data = JSON.stringify(fullMessage, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        );

        for (const peer of this.peers.values()) {
            if (peer.ws && peer.ws.readyState === WebSocket.OPEN) {
                peer.ws.send(data);
            }
        }
    }

    /**
     * Send message to specific peer
     */
    private sendMessage(ws: WebSocket, message: Partial<P2PMessage>): void {
        const fullMessage: P2PMessage = {
            type: message.type || '',
            data: message.data,
            timestamp: Date.now(),
            nodeId: this.nodeId
        };

        // Handle BigInt serialization
        ws.send(JSON.stringify(fullMessage, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
    }

    /**
     * Maintain peer connections
     */
    private maintainPeers(): void {
        const now = Date.now();
        const timeout = 300000; // 5 minutes timeout

        // Ping all peers to keep connection alive
        const pingMsg = JSON.stringify({
            type: 'ping',
            timestamp: now,
            nodeId: this.nodeId
        });

        for (const [id, peer] of this.peers.entries()) {
            // Send ping
            if (peer.ws && peer.ws.readyState === WebSocket.OPEN) {
                peer.ws.send(pingMsg);
            }

            // Remove stale peers
            if (now - peer.lastSeen > timeout) {
                console.log(`[P2P] Removing stale peer: ${peer.address} (Last seen: ${Math.round((now - peer.lastSeen) / 1000)}s ago)`);
                peer.ws?.close();
                this.peers.delete(id);
            }
        }

        // Reconnect to seeds if needed
        if (this.peers.size < 3) {
            this.connectToSeeds();
        }
    }

    /**
     * Get peer count
     */
    getPeerCount(): number {
        return this.peers.size;
    }

    /**
     * Get peer list
     */
    getPeers(): PeerInfo[] {
        return Array.from(this.peers.values());
    }

    /**
     * Stop the P2P network
     */
    stop(): void {
        if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
        }

        for (const peer of this.peers.values()) {
            peer.ws?.close();
        }
        this.peers.clear();

        this.server?.close();
        console.log('[P2P] Network stopped');
    }
}

export default P2PNetwork;
