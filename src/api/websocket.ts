// SmartChain WebSocket Server
import { WebSocket, WebSocketServer } from 'ws';
import { Blockchain } from '../core';
import { Block, Transaction, BlockchainEvent, EventType } from '../types';

interface Subscription {
    id: string;
    type: 'newHeads' | 'newPendingTransactions' | 'logs' | 'syncing';
    filter?: any;
}

interface Client {
    ws: WebSocket;
    subscriptions: Map<string, Subscription>;
}

export class WSServer {
    private wss: WebSocketServer | null = null;
    private blockchain: Blockchain;
    private clients: Map<WebSocket, Client> = new Map();
    private port: number;
    private subscriptionCounter: number = 0;

    constructor(blockchain: Blockchain, port: number = 8546) {
        this.blockchain = blockchain;
        this.port = port;
    }

    /**
     * Start WebSocket server
     */
    start(): Promise<void> {
        return new Promise((resolve) => {
            this.wss = new WebSocketServer({ port: this.port });

            this.wss.on('connection', (ws: WebSocket) => {
                console.log('[WS] Client connected');

                const client: Client = {
                    ws,
                    subscriptions: new Map(),
                };
                this.clients.set(ws, client);

                ws.on('message', (data: string) => {
                    this.handleMessage(client, data.toString());
                });

                ws.on('close', () => {
                    console.log('[WS] Client disconnected');
                    this.clients.delete(ws);
                });

                ws.on('error', (error) => {
                    console.error('[WS] Error:', error);
                });
            });

            // Subscribe to blockchain events
            this.blockchain.on('newBlock', (block: Block) => {
                this.broadcastNewBlock(block);
            });

            this.blockchain.on('pendingTransaction', (tx: Transaction) => {
                this.broadcastPendingTransaction(tx);
            });

            console.log(`WebSocket server running on ws://localhost:${this.port}`);
            resolve();
        });
    }

    /**
     * Handle incoming WebSocket message
     */
    private handleMessage(client: Client, data: string): void {
        try {
            const message = JSON.parse(data);
            this.handleRPCRequest(client, message);
        } catch (error) {
            this.sendError(client.ws, null, -32700, 'Parse error');
        }
    }

    /**
     * Handle JSON-RPC request over WebSocket
     */
    private handleRPCRequest(client: Client, request: any): void {
        const { jsonrpc, method, params, id } = request;

        try {
            switch (method) {
                case 'eth_subscribe':
                    this.handleSubscribe(client, params, id);
                    break;

                case 'eth_unsubscribe':
                    this.handleUnsubscribe(client, params, id);
                    break;

                default:
                    // Forward to RPC server (not implemented in WS directly)
                    this.sendError(client.ws, id, -32601, `Method ${method} not supported over WebSocket`);
            }
        } catch (error: any) {
            this.sendError(client.ws, id, -32000, error.message);
        }
    }

    /**
     * Handle subscription request
     */
    private handleSubscribe(client: Client, params: any[], id: any): void {
        const subscriptionType = params[0];
        const filter = params[1];

        const subscriptionId = this.generateSubscriptionId();

        const subscription: Subscription = {
            id: subscriptionId,
            type: subscriptionType,
            filter,
        };

        client.subscriptions.set(subscriptionId, subscription);

        this.sendResult(client.ws, id, subscriptionId);
        console.log(`[WS] New subscription: ${subscriptionType} (${subscriptionId})`);
    }

    /**
     * Handle unsubscribe request
     */
    private handleUnsubscribe(client: Client, params: any[], id: any): void {
        const subscriptionId = params[0];
        const deleted = client.subscriptions.delete(subscriptionId);
        this.sendResult(client.ws, id, deleted);
    }

    /**
     * Broadcast new block to subscribers
     */
    private broadcastNewBlock(block: Block): void {
        const notification = {
            number: '0x' + block.header.number.toString(16),
            hash: block.hash,
            parentHash: block.header.parentHash,
            timestamp: '0x' + Math.floor(block.header.timestamp / 1000).toString(16),
            miner: block.header.miner,
            gasLimit: '0x' + block.header.gasLimit.toString(16),
            gasUsed: '0x' + block.header.gasUsed.toString(16),
            transactionsRoot: block.header.transactionsRoot,
            stateRoot: block.header.stateRoot,
            receiptsRoot: block.header.receiptsRoot,
        };

        for (const [ws, client] of this.clients) {
            for (const [subId, subscription] of client.subscriptions) {
                if (subscription.type === 'newHeads') {
                    this.sendSubscriptionNotification(ws, subId, notification);
                }
            }
        }
    }

    /**
     * Broadcast pending transaction to subscribers
     */
    private broadcastPendingTransaction(tx: Transaction): void {
        for (const [ws, client] of this.clients) {
            for (const [subId, subscription] of client.subscriptions) {
                if (subscription.type === 'newPendingTransactions') {
                    this.sendSubscriptionNotification(ws, subId, tx.hash);
                }
            }
        }
    }

    /**
     * Generate subscription ID
     */
    private generateSubscriptionId(): string {
        this.subscriptionCounter++;
        return '0x' + this.subscriptionCounter.toString(16).padStart(32, '0');
    }

    /**
     * Send subscription notification
     */
    private sendSubscriptionNotification(ws: WebSocket, subscriptionId: string, result: any): void {
        const message = {
            jsonrpc: '2.0',
            method: 'eth_subscription',
            params: {
                subscription: subscriptionId,
                result,
            },
        };

        ws.send(JSON.stringify(message));
    }

    /**
     * Send RPC result
     */
    private sendResult(ws: WebSocket, id: any, result: any): void {
        const message = {
            jsonrpc: '2.0',
            id,
            result,
        };

        ws.send(JSON.stringify(message));
    }

    /**
     * Send RPC error
     */
    private sendError(ws: WebSocket, id: any, code: number, message: string): void {
        const response = {
            jsonrpc: '2.0',
            id,
            error: { code, message },
        };

        ws.send(JSON.stringify(response));
    }

    /**
     * Broadcast event to all connected clients
     */
    broadcast(event: BlockchainEvent): void {
        const message = JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_subscription',
            params: {
                subscription: 'broadcast',
                result: event,
            },
        });

        for (const [ws] of this.clients) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        }
    }

    /**
     * Get connected client count
     */
    getClientCount(): number {
        return this.clients.size;
    }

    /**
     * Connect to a peer node
     */
    connectToPeer(peerUrl: string, isHandshake = true): void {
        console.log(`[P2P] Connecting to peer: ${peerUrl}`);
        const ws = new WebSocket(peerUrl);

        ws.on('open', () => {
            console.log(`[P2P] Connected to peer: ${peerUrl}`);
            const client: Client = { ws, subscriptions: new Map() };
            this.clients.set(ws, client);

            if (isHandshake) {
                // Send handshake / status
                this.sendResult(ws, 'handshake', {
                    chainId: this.blockchain.getConfig().chainId,
                    height: this.blockchain.getLatestBlockNumber()
                });
            }
        });

        ws.on('message', (data: string) => {
            // Treat peer messages same as client messages for now, 
            // but we might want special handling for blocks
            this.handlePeerMessage(ws, data.toString());
        });

        ws.on('error', (err) => console.error(`[P2P] Error with peer ${peerUrl}:`, err.message));
        ws.on('close', () => console.log(`[P2P] Disconnected from peer ${peerUrl}`));
    }

    private handlePeerMessage(ws: WebSocket, data: string) {
        try {
            const message = JSON.parse(data);

            // Handle Subscription Broadcasts (New Blocks/Txs from Peers)
            if (message.method === 'eth_subscription' && message.params) {
                const { result } = message.params;

                // If it looks like a block (has 'number' and 'hash')
                if (result.number && result.hash && result.miner) {
                    console.log(`[P2P] Received block ${parseInt(result.number, 16)} from peer`);
                    // TODO: In a real implementation, we would download the full block content here
                    // For now, we assume we get full block or fetch it. 
                    // This is a simplified "Light Client" view.
                }
            }
        } catch (e) {
            // Ignore malformed
        }
    }

    /**
     * Close server
     */
    close(): void {
        if (this.wss) {
            this.wss.close();
        }
        // Close all peer connections
        for (const [ws] of this.clients) {
            ws.close();
        }
    }
}

export default WSServer;
