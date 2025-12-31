/**
 * SmartChain Enterprise - Main Module
 * 
 * Integrates all enterprise features:
 * - P2P Multi-node networking
 * - Role-Based Access Control (RBAC)
 * - Compliance & Audit Logging
 */

import { EventEmitter } from 'events';
import { Blockchain } from '../core/blockchain';
import { Block, Transaction, ChainConfig } from '../types';
import P2PNetwork, { NetworkConfig, PeerInfo, MessageType } from './p2p/network';
import RBACManager, { RBACConfig, Role, Permission, Identity } from './rbac/roles';
import AuditLogger, { AuditConfig, AuditEventType, AuditEvent } from './compliance/audit';
import CryptoUtils from '../core/crypto';

export interface EnterpriseConfig {
    // Network configuration
    network: NetworkConfig;

    // RBAC configuration
    rbac: RBACConfig;

    // Audit configuration
    audit: AuditConfig;

    // Enterprise features
    features: {
        enableP2P: boolean;
        enableRBAC: boolean;
        enableAudit: boolean;
        enableKYC: boolean;
        enableTransactionLimits: boolean;
        enablePrivateTransactions: boolean;
    };
}

export interface EnterpriseStats {
    network: {
        nodeId: string;
        peerCount: number;
        validatorCount: number;
        isRunning: boolean;
    };
    rbac: {
        totalIdentities: number;
        whitelistedCount: number;
        blacklistedCount: number;
        validatorCount: number;
    };
    audit: {
        totalEvents: number;
        eventsInMemory: number;
        storageSize: number;
    };
}

export class EnterpriseNode extends EventEmitter {
    private blockchain: Blockchain;
    private config: EnterpriseConfig;

    // Enterprise modules
    public network: P2PNetwork | null = null;
    public rbac: RBACManager | null = null;
    public audit: AuditLogger | null = null;

    constructor(blockchain: Blockchain, config: EnterpriseConfig) {
        super();
        this.blockchain = blockchain;
        this.config = config;
    }

    /**
     * Initialize enterprise features
     */
    async initialize(): Promise<void> {
        console.log('[Enterprise] Initializing SmartChain Enterprise Edition...');

        // Initialize RBAC
        if (this.config.features.enableRBAC) {
            this.rbac = new RBACManager(this.config.rbac);
            this.setupRBACHandlers();
            console.log('[Enterprise] RBAC system initialized');
        }

        // Initialize Audit Logger
        if (this.config.features.enableAudit) {
            this.audit = new AuditLogger(this.config.audit);
            this.setupAuditHandlers();
            console.log('[Enterprise] Audit logging initialized');
        }

        // Initialize P2P Network
        if (this.config.features.enableP2P) {
            this.network = new P2PNetwork(this.config.network);
            this.setupNetworkHandlers();
            await this.network.start();
            console.log('[Enterprise] P2P network started');
        }

        // Hook into blockchain events
        this.setupBlockchainHooks();

        console.log('[Enterprise] SmartChain Enterprise Edition ready!');
        this.logAudit(AuditEventType.CONFIG_CHANGED, 'SYSTEM', {
            action: 'enterprise_initialized',
            features: this.config.features
        });
    }

    /**
     * Setup RBAC event handlers
     */
    private setupRBACHandlers(): void {
        if (!this.rbac) return;

        this.rbac.on('roleChanged', (address: string, role: Role, admin: string) => {
            this.logAudit(AuditEventType.ROLE_ASSIGNED, admin, {
                targetAddress: address,
                role
            }, { target: address });
        });

        this.rbac.on('whitelisted', (address: string, admin: string) => {
            this.logAudit(AuditEventType.ADDRESS_WHITELISTED, admin, {
                targetAddress: address
            }, { target: address });
        });

        this.rbac.on('blacklisted', (address: string, admin: string, reason?: string) => {
            this.logAudit(AuditEventType.ADDRESS_BLACKLISTED, admin, {
                targetAddress: address,
                reason
            }, { target: address });
        });

        this.rbac.on('kycUpdated', (address: string, status: string, admin: string) => {
            this.logAudit(AuditEventType.KYC_UPDATED, admin, {
                targetAddress: address,
                status
            }, { target: address });
        });
    }

    /**
     * Setup Audit event handlers
     */
    private setupAuditHandlers(): void {
        if (!this.audit) return;

        this.audit.on('auditEvent', (event: AuditEvent) => {
            this.emit('auditEvent', event);
        });
    }

    /**
     * Setup P2P network event handlers
     */
    private setupNetworkHandlers(): void {
        if (!this.network) return;

        // Handle new block from network
        this.network.on('newBlock', async (block: Block, fromNodeId: string) => {
            // Validate block
            const validation = await this.validateBlock(block);
            if (!validation.valid) {
                console.log(`[Enterprise] Rejected block from ${fromNodeId}: ${validation.error}`);
                this.logAudit(AuditEventType.BLOCK_REJECTED, fromNodeId, {
                    blockNumber: block.header.number,
                    error: validation.error
                }, { blockNumber: block.header.number });
                return;
            }

            // Add to chain
            const result = await this.blockchain.addBlock(block);
            if (result.success) {
                this.logAudit(AuditEventType.BLOCK_VALIDATED, fromNodeId, {
                    blockNumber: block.header.number,
                    hash: block.hash,
                    txCount: block.transactions.length
                }, { blockNumber: block.header.number });
            }
        });

        // Handle new transaction from network
        this.network.on('newTransaction', async (tx: Transaction, fromNodeId: string) => {
            // Check RBAC permissions
            if (this.rbac) {
                const check = this.rbac.canSendTransaction(tx.from, tx.to, tx.value);
                if (!check.allowed) {
                    this.logAudit(AuditEventType.UNAUTHORIZED_ACCESS, tx.from, {
                        action: 'send_transaction',
                        reason: check.reason
                    });
                    return;
                }
            }

            // Add to mempool
            this.blockchain.mempool.addTransaction(tx, this.blockchain.state);
        });

        // Handle block request
        this.network.on('getBlocks', ({ from, to, nodeId, respond }: any) => {
            const blocks = this.blockchain.getBlocksInRange(from, to);
            respond(blocks);
        });

        // Handle peer events
        this.network.on('peerConnected', (nodeId: string, info: PeerInfo) => {
            this.logAudit(AuditEventType.NODE_CONNECTED, nodeId, {
                role: info.role,
                address: info.address
            });
            this.emit('peerConnected', nodeId, info);
        });

        this.network.on('peerDisconnected', (nodeId: string) => {
            this.logAudit(AuditEventType.NODE_DISCONNECTED, nodeId, {});
            this.emit('peerDisconnected', nodeId);
        });
    }

    /**
     * Setup blockchain hooks
     */
    private setupBlockchainHooks(): void {
        // Hook new blocks
        this.blockchain.on('newBlock', (block: Block) => {
            // Broadcast to network
            if (this.network) {
                this.network.broadcastBlock(block);
                this.network.setLatestBlockNumber(block.header.number);
            }

            // Log to audit
            this.logAudit(AuditEventType.BLOCK_MINED, block.header.miner, {
                blockNumber: block.header.number,
                hash: block.hash,
                txCount: block.transactions.length,
                gasUsed: block.header.gasUsed.toString()
            }, { blockNumber: block.header.number });

            // Log each transaction
            for (const tx of block.transactions) {
                this.logAudit(AuditEventType.TRANSACTION_EXECUTED, tx.from, {
                    hash: tx.hash,
                    to: tx.to,
                    value: tx.value.toString(),
                    gasLimit: tx.gasLimit.toString()
                }, {
                    target: tx.to || undefined,
                    blockNumber: block.header.number,
                    transactionHash: tx.hash
                });
            }
        });

        // Hook pending transactions
        this.blockchain.on('pendingTransaction', (tx: Transaction) => {
            // Check RBAC before broadcasting
            if (this.rbac) {
                const check = this.rbac.canSendTransaction(tx.from, tx.to, tx.value);
                if (!check.allowed) {
                    this.logAudit(AuditEventType.UNAUTHORIZED_ACCESS, tx.from, {
                        action: 'submit_transaction',
                        reason: check.reason
                    });
                    return;
                }
            }

            // Broadcast to network
            if (this.network) {
                this.network.broadcastTransaction(tx);
            }

            // Log to audit
            this.logAudit(AuditEventType.TRANSACTION_SUBMITTED, tx.from, {
                hash: tx.hash,
                to: tx.to,
                value: tx.value.toString()
            }, { target: tx.to || undefined });
        });
    }

    /**
     * Validate block with RBAC
     */
    private async validateBlock(block: Block): Promise<{ valid: boolean; error?: string }> {
        // Check if miner is authorized
        if (this.rbac && !this.rbac.hasPermission(block.header.miner, Permission.PRODUCE_BLOCKS)) {
            return { valid: false, error: 'Miner not authorized to produce blocks' };
        }

        // Additional validation can be added here
        return { valid: true };
    }

    /**
     * Log audit event
     */
    private logAudit(
        type: AuditEventType,
        actor: string,
        data: Record<string, any>,
        options: {
            target?: string;
            blockNumber?: number;
            transactionHash?: string;
        } = {}
    ): void {
        if (this.audit) {
            this.audit.log(type, actor, data, {
                ...options,
                nodeId: this.config.network.nodeId
            });
        }
    }

    /**
     * Check transaction permission
     */
    checkTransactionPermission(from: string, to: string | null, value: bigint): { allowed: boolean; reason?: string } {
        if (!this.rbac) {
            return { allowed: true };
        }
        return this.rbac.canSendTransaction(from, to, value);
    }

    /**
     * Get enterprise statistics
     */
    getStats(): EnterpriseStats {
        return {
            network: this.network?.getStats() || {
                nodeId: 'N/A',
                peerCount: 0,
                validatorCount: 0,
                isRunning: false
            },
            rbac: {
                totalIdentities: this.rbac?.getAllIdentities().length || 0,
                whitelistedCount: this.rbac?.getWhitelist().length || 0,
                blacklistedCount: this.rbac?.getBlacklist().length || 0,
                validatorCount: this.rbac?.getValidators().length || 0
            },
            audit: this.audit?.getStats() || {
                totalEvents: 0,
                eventsInMemory: 0,
                storageSize: 0
            }
        };
    }

    /**
     * Add validator
     */
    addValidator(adminAddress: string, validatorAddress: string): { success: boolean; error?: string } {
        if (!this.rbac) return { success: false, error: 'RBAC not enabled' };

        const result = this.rbac.setRole(adminAddress, validatorAddress, Role.VALIDATOR);
        if (result.success) {
            this.logAudit(AuditEventType.VALIDATOR_ADDED, adminAddress, {
                validatorAddress
            }, { target: validatorAddress });
        }
        return result;
    }

    /**
     * Remove validator
     */
    removeValidator(adminAddress: string, validatorAddress: string): { success: boolean; error?: string } {
        if (!this.rbac) return { success: false, error: 'RBAC not enabled' };

        const result = this.rbac.setRole(adminAddress, validatorAddress, Role.USER);
        if (result.success) {
            this.logAudit(AuditEventType.VALIDATOR_REMOVED, adminAddress, {
                validatorAddress
            }, { target: validatorAddress });
        }
        return result;
    }

    /**
     * Emergency stop
     */
    async emergencyStop(adminAddress: string, reason: string): Promise<void> {
        if (!this.rbac?.hasPermission(adminAddress, Permission.MANAGE_CONFIG)) {
            throw new Error('No permission for emergency stop');
        }

        this.logAudit(AuditEventType.EMERGENCY_STOP, adminAddress, { reason });

        // Stop block production
        this.blockchain.stopValidating();

        // Disconnect from network
        if (this.network) {
            await this.network.stop();
        }

        this.emit('emergencyStop', { admin: adminAddress, reason });
    }

    /**
     * Shutdown enterprise node
     */
    async shutdown(): Promise<void> {
        console.log('[Enterprise] Shutting down...');

        if (this.network) {
            await this.network.stop();
        }

        if (this.audit) {
            this.audit.close();
        }

        this.blockchain.stopValidating();

        console.log('[Enterprise] Shutdown complete');
    }
}

// Export all enterprise modules
export { P2PNetwork, NetworkConfig, PeerInfo, MessageType } from './p2p/network';
export { RBACManager, RBACConfig, Role, Permission, Identity } from './rbac/roles';
export { AuditLogger, AuditConfig, AuditEventType, AuditEvent } from './compliance/audit';

export default EnterpriseNode;
