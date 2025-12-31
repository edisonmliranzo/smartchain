/**
 * SmartChain Enterprise - P2P Network Manager
 * 
 * Handles peer-to-peer communication between nodes
 * using WebSocket for real-time block/transaction propagation.
 */

import WebSocket, { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import { Block, Transaction } from '../../types';
import CryptoUtils from '../../core/crypto';

// Message types for P2P protocol
export enum MessageType {
    // Handshake
    HELLO = 'HELLO',
    HELLO_ACK = 'HELLO_ACK',

    // Block propagation
    NEW_BLOCK = 'NEW_BLOCK',
    GET_BLOCKS = 'GET_BLOCKS',
    BLOCKS = 'BLOCKS',

    // Transaction propagation
    NEW_TRANSACTION = 'NEW_TRANSACTION',
    GET_TRANSACTIONS = 'GET_TRANSACTIONS',
    TRANSACTIONS = 'TRANSACTIONS',

    // State sync
    GET_STATE = 'GET_STATE',
    STATE = 'STATE',

    // Consensus
    VOTE = 'VOTE',
    PREPARE = 'PREPARE',
    COMMIT = 'COMMIT',

    // Health
    PING = 'PING',
    PONG = 'PONG',

    // Admin
    PEER_LIST = 'PEER_LIST',
    DISCONNECT = 'DISCONNECT',
}

export interface P2PMessage {
    type: MessageType;
    nodeId: string;
    timestamp: number;
    payload: any;
    signature?: string;
}

export interface PeerInfo {
    nodeId: string;
    address: string;
    port: number;
    role: 'validator' | 'full' | 'light';
    chainId: number;
    latestBlock: number;
    connectedAt: number;
    lastSeen: number;
    isActive: boolean;
}

export interface NetworkConfig {
    nodeId: string;
    role: 'validator' | 'full' | 'light';
    port: number;
    chainId: number;
    privateKey: string;
    maxPeers: number;
    bootstrapNodes: string[];
    heartbeatInterval: number;
    connectionTimeout: number;
}

export class P2PNetwork extends EventEmitter {
    private config: NetworkConfig;
    private server: WebSocketServer | null = null;
    private peers: Map<string, WebSocket> = new Map();
    private peerInfo: Map<string, PeerInfo> = new Map();
    private messageBuffer: Map<string, P2PMessage[]> = new Map();
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private latestBlockNumber: number = 0;
    private isRunning: boolean = false;

    constructor(config: NetworkConfig) {
        super();
        this.config = config;
    }

    /**
     * Start the P2P network server
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            console.log('[P2P] Network already running');
            return;
        }

        console.log(`[P2P] Starting network on port ${this.config.port}...`);

        // Start WebSocket server
        this.server = new WebSocketServer({ port: this.config.port });

        this.server.on('connection', (ws: WebSocket, req) => {
            const address = req.socket.remoteAddress || 'unknown';
            console.log(`[P2P] Incoming connection from ${address}`);
            this.handleConnection(ws, address, true);
        });

        this.server.on('error', (error) => {
            console.error('[P2P] Server error:', error);
            this.emit('error', error);
        });

        this.isRunning = true;

        // Connect to bootstrap nodes
        for (const node of this.config.bootstrapNodes) {
            await this.connectToPeer(node);
        }

        // Start heartbeat
        this.startHeartbeat();

        console.log(`[P2P] Network started. Node ID: ${this.config.nodeId}`);
        this.emit('started');
    }

    /**
     * Stop the P2P network
     */
    async stop(): Promise<void> {
        if (!this.isRunning) return;

        console.log('[P2P] Stopping network...');

        // Stop heartbeat
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        // Disconnect all peers
        for (const [nodeId, ws] of this.peers) {
            this.sendMessage(ws, {
                type: MessageType.DISCONNECT,
                nodeId: this.config.nodeId,
                timestamp: Date.now(),
                payload: { reason: 'shutdown' }
            });
            ws.close();
        }

        this.peers.clear();
        this.peerInfo.clear();

        // Close server
        if (this.server) {
            this.server.close();
            this.server = null;
        }

        this.isRunning = false;
        console.log('[P2P] Network stopped');
        this.emit('stopped');
    }

    /**
     * Connect to a peer
     */
    async connectToPeer(address: string): Promise<boolean> {
        try {
            console.log(`[P2P] Connecting to ${address}...`);

            const ws = new WebSocket(address);

            return new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    ws.close();
                    resolve(false);
                }, this.config.connectionTimeout);

                ws.on('open', () => {
                    clearTimeout(timeout);
                    this.handleConnection(ws, address, false);
                    resolve(true);
                });

                ws.on('error', (error) => {
                    clearTimeout(timeout);
                    console.error(`[P2P] Failed to connect to ${address}:`, error.message);
                    resolve(false);
                });
            });
        } catch (error) {
            console.error(`[P2P] Connection error:`, error);
            return false;
        }
    }

    /**
     * Handle new connection
     */
    private handleConnection(ws: WebSocket, address: string, isIncoming: boolean): void {
        // Send hello message
        this.sendMessage(ws, {
            type: MessageType.HELLO,
            nodeId: this.config.nodeId,
            timestamp: Date.now(),
            payload: {
                role: this.config.role,
                chainId: this.config.chainId,
                latestBlock: this.latestBlockNumber,
                port: this.config.port,
                version: '1.0.0'
            }
        });

        ws.on('message', (data: Buffer) => {
            try {
                const message: P2PMessage = JSON.parse(data.toString());
                this.handleMessage(ws, message, address);
            } catch (error) {
                console.error('[P2P] Failed to parse message:', error);
            }
        });

        ws.on('close', () => {
            // Find and remove peer
            for (const [nodeId, peerWs] of this.peers) {
                if (peerWs === ws) {
                    console.log(`[P2P] Peer disconnected: ${nodeId}`);
                    this.peers.delete(nodeId);
                    this.peerInfo.delete(nodeId);
                    this.emit('peerDisconnected', nodeId);
                    break;
                }
            }
        });

        ws.on('error', (error) => {
            console.error('[P2P] WebSocket error:', error.message);
        });
    }

    /**
     * Handle incoming message
     */
    private handleMessage(ws: WebSocket, message: P2PMessage, address: string): void {
        // Validate chain ID
        if (message.payload?.chainId && message.payload.chainId !== this.config.chainId) {
            console.log(`[P2P] Rejecting peer with different chain ID: ${message.payload.chainId}`);
            ws.close();
            return;
        }

        switch (message.type) {
            case MessageType.HELLO:
                this.handleHello(ws, message, address);
                break;

            case MessageType.HELLO_ACK:
                this.handleHelloAck(ws, message);
                break;

            case MessageType.NEW_BLOCK:
                this.handleNewBlock(message);
                break;

            case MessageType.GET_BLOCKS:
                this.handleGetBlocks(ws, message);
                break;

            case MessageType.BLOCKS:
                this.handleBlocks(message);
                break;

            case MessageType.NEW_TRANSACTION:
                this.handleNewTransaction(message);
                break;

            case MessageType.PING:
                this.sendMessage(ws, {
                    type: MessageType.PONG,
                    nodeId: this.config.nodeId,
                    timestamp: Date.now(),
                    payload: { latestBlock: this.latestBlockNumber }
                });
                break;

            case MessageType.PONG:
                this.handlePong(message);
                break;

            case MessageType.PEER_LIST:
                this.handlePeerList(message);
                break;

            case MessageType.DISCONNECT:
                ws.close();
                break;

            default:
                this.emit('message', message);
        }
    }

    /**
     * Handle HELLO message
     */
    private handleHello(ws: WebSocket, message: P2PMessage, address: string): void {
        const { role, chainId, latestBlock, port, version } = message.payload;

        // Check max peers
        if (this.peers.size >= this.config.maxPeers) {
            console.log(`[P2P] Max peers reached, rejecting ${message.nodeId}`);
            ws.close();
            return;
        }

        // Store peer
        this.peers.set(message.nodeId, ws);
        this.peerInfo.set(message.nodeId, {
            nodeId: message.nodeId,
            address: address.replace('::ffff:', ''),
            port,
            role,
            chainId,
            latestBlock,
            connectedAt: Date.now(),
            lastSeen: Date.now(),
            isActive: true
        });

        console.log(`[P2P] Peer connected: ${message.nodeId} (${role})`);

        // Send HELLO_ACK
        this.sendMessage(ws, {
            type: MessageType.HELLO_ACK,
            nodeId: this.config.nodeId,
            timestamp: Date.now(),
            payload: {
                role: this.config.role,
                chainId: this.config.chainId,
                latestBlock: this.latestBlockNumber,
                peers: Array.from(this.peerInfo.values()).map(p => ({
                    address: `ws://${p.address}:${p.port}`,
                    nodeId: p.nodeId
                }))
            }
        });

        this.emit('peerConnected', message.nodeId, this.peerInfo.get(message.nodeId));

        // Check if we need to sync
        if (latestBlock > this.latestBlockNumber) {
            this.requestBlocks(message.nodeId, this.latestBlockNumber + 1, latestBlock);
        }
    }

    /**
     * Handle HELLO_ACK message
     */
    private handleHelloAck(ws: WebSocket, message: P2PMessage): void {
        const { role, chainId, latestBlock, peers } = message.payload;

        this.peers.set(message.nodeId, ws);
        this.peerInfo.set(message.nodeId, {
            nodeId: message.nodeId,
            address: '',
            port: 0,
            role,
            chainId,
            latestBlock,
            connectedAt: Date.now(),
            lastSeen: Date.now(),
            isActive: true
        });

        console.log(`[P2P] Handshake complete with: ${message.nodeId}`);
        this.emit('peerConnected', message.nodeId, this.peerInfo.get(message.nodeId));

        // Connect to additional peers
        if (peers && Array.isArray(peers)) {
            for (const peer of peers) {
                if (peer.nodeId !== this.config.nodeId && !this.peers.has(peer.nodeId)) {
                    this.connectToPeer(peer.address);
                }
            }
        }

        // Check if we need to sync
        if (latestBlock > this.latestBlockNumber) {
            this.requestBlocks(message.nodeId, this.latestBlockNumber + 1, latestBlock);
        }
    }

    /**
     * Handle NEW_BLOCK message
     */
    private handleNewBlock(message: P2PMessage): void {
        const block: Block = message.payload.block;
        console.log(`[P2P] Received new block #${block.header.number} from ${message.nodeId}`);
        this.emit('newBlock', block, message.nodeId);
    }

    /**
     * Handle GET_BLOCKS request
     */
    private handleGetBlocks(ws: WebSocket, message: P2PMessage): void {
        const { from, to } = message.payload;
        console.log(`[P2P] Peer ${message.nodeId} requesting blocks ${from} - ${to}`);
        this.emit('getBlocks', {
            from, to, nodeId: message.nodeId, respond: (blocks: Block[]) => {
                this.sendMessage(ws, {
                    type: MessageType.BLOCKS,
                    nodeId: this.config.nodeId,
                    timestamp: Date.now(),
                    payload: { blocks }
                });
            }
        });
    }

    /**
     * Handle BLOCKS response
     */
    private handleBlocks(message: P2PMessage): void {
        const { blocks } = message.payload;
        console.log(`[P2P] Received ${blocks.length} blocks from ${message.nodeId}`);
        this.emit('blocks', blocks, message.nodeId);
    }

    /**
     * Handle NEW_TRANSACTION message
     */
    private handleNewTransaction(message: P2PMessage): void {
        const tx: Transaction = message.payload.transaction;
        this.emit('newTransaction', tx, message.nodeId);
    }

    /**
     * Handle PONG message
     */
    private handlePong(message: P2PMessage): void {
        const peer = this.peerInfo.get(message.nodeId);
        if (peer) {
            peer.lastSeen = Date.now();
            peer.latestBlock = message.payload.latestBlock;
            peer.isActive = true;
        }
    }

    /**
     * Handle PEER_LIST message
     */
    private handlePeerList(message: P2PMessage): void {
        const { peers } = message.payload;
        for (const peer of peers) {
            if (peer.nodeId !== this.config.nodeId && !this.peers.has(peer.nodeId)) {
                this.connectToPeer(peer.address);
            }
        }
    }

    /**
     * Send message to peer
     */
    private sendMessage(ws: WebSocket, message: P2PMessage): void {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }

    /**
     * Broadcast message to all peers
     */
    broadcast(type: MessageType, payload: any): void {
        const message: P2PMessage = {
            type,
            nodeId: this.config.nodeId,
            timestamp: Date.now(),
            payload
        };

        for (const ws of this.peers.values()) {
            this.sendMessage(ws, message);
        }
    }

    /**
     * Broadcast new block to all peers
     */
    broadcastBlock(block: Block): void {
        this.latestBlockNumber = block.header.number;
        this.broadcast(MessageType.NEW_BLOCK, { block });
    }

    /**
     * Broadcast new transaction to all peers
     */
    broadcastTransaction(tx: Transaction): void {
        this.broadcast(MessageType.NEW_TRANSACTION, { transaction: tx });
    }

    /**
     * Request blocks from peer
     */
    requestBlocks(nodeId: string, from: number, to: number): void {
        const ws = this.peers.get(nodeId);
        if (ws) {
            this.sendMessage(ws, {
                type: MessageType.GET_BLOCKS,
                nodeId: this.config.nodeId,
                timestamp: Date.now(),
                payload: { from, to }
            });
        }
    }

    /**
     * Start heartbeat to monitor peers
     */
    private startHeartbeat(): void {
        this.heartbeatInterval = setInterval(() => {
            const now = Date.now();

            for (const [nodeId, ws] of this.peers) {
                const peer = this.peerInfo.get(nodeId);

                // Check if peer is stale
                if (peer && now - peer.lastSeen > this.config.heartbeatInterval * 3) {
                    console.log(`[P2P] Peer ${nodeId} timed out, disconnecting`);
                    ws.close();
                    this.peers.delete(nodeId);
                    this.peerInfo.delete(nodeId);
                    this.emit('peerDisconnected', nodeId);
                    continue;
                }

                // Send ping
                this.sendMessage(ws, {
                    type: MessageType.PING,
                    nodeId: this.config.nodeId,
                    timestamp: now,
                    payload: { latestBlock: this.latestBlockNumber }
                });
            }
        }, this.config.heartbeatInterval);
    }

    /**
     * Update latest block number
     */
    setLatestBlockNumber(number: number): void {
        this.latestBlockNumber = number;
    }

    /**
     * Get peer count
     */
    getPeerCount(): number {
        return this.peers.size;
    }

    /**
     * Get peer info
     */
    getPeers(): PeerInfo[] {
        return Array.from(this.peerInfo.values());
    }

    /**
     * Get validators
     */
    getValidators(): PeerInfo[] {
        return Array.from(this.peerInfo.values()).filter(p => p.role === 'validator');
    }

    /**
     * Check if connected to specific peer
     */
    isConnectedTo(nodeId: string): boolean {
        return this.peers.has(nodeId);
    }

    /**
     * Get network stats
     */
    getStats() {
        const peers = Array.from(this.peerInfo.values());
        return {
            nodeId: this.config.nodeId,
            role: this.config.role,
            peerCount: peers.length,
            validatorCount: peers.filter(p => p.role === 'validator').length,
            latestBlock: this.latestBlockNumber,
            isRunning: this.isRunning
        };
    }
}

export default P2PNetwork;
