/**
 * SmartChain Enterprise - Role-Based Access Control (RBAC)
 * 
 * Manages roles, permissions, and access control for the enterprise blockchain.
 */

import { EventEmitter } from 'events';
import CryptoUtils from '../../core/crypto';

// Role definitions
export enum Role {
    ADMIN = 'ADMIN',           // Full network control
    VALIDATOR = 'VALIDATOR',   // Can produce blocks
    OPERATOR = 'OPERATOR',     // Can deploy contracts
    USER = 'USER',             // Can send transactions
    AUDITOR = 'AUDITOR',       // Read-only access to all data
}

// Permission types
export enum Permission {
    // Block operations
    PRODUCE_BLOCKS = 'PRODUCE_BLOCKS',
    VALIDATE_BLOCKS = 'VALIDATE_BLOCKS',

    // Transaction operations
    SEND_TRANSACTIONS = 'SEND_TRANSACTIONS',
    DEPLOY_CONTRACTS = 'DEPLOY_CONTRACTS',
    CALL_CONTRACTS = 'CALL_CONTRACTS',

    // Admin operations
    MANAGE_ROLES = 'MANAGE_ROLES',
    MANAGE_WHITELIST = 'MANAGE_WHITELIST',
    MANAGE_VALIDATORS = 'MANAGE_VALIDATORS',
    MANAGE_CONFIG = 'MANAGE_CONFIG',

    // Read operations
    READ_BLOCKS = 'READ_BLOCKS',
    READ_TRANSACTIONS = 'READ_TRANSACTIONS',
    READ_STATE = 'READ_STATE',
    READ_AUDIT_LOGS = 'READ_AUDIT_LOGS',

    // Compliance
    VIEW_KYC = 'VIEW_KYC',
    MANAGE_KYC = 'MANAGE_KYC',
    GENERATE_REPORTS = 'GENERATE_REPORTS',
    FREEZE_ACCOUNTS = 'FREEZE_ACCOUNTS',
}

// Role-permission mapping
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    [Role.ADMIN]: Object.values(Permission), // All permissions

    [Role.VALIDATOR]: [
        Permission.PRODUCE_BLOCKS,
        Permission.VALIDATE_BLOCKS,
        Permission.SEND_TRANSACTIONS,
        Permission.DEPLOY_CONTRACTS,
        Permission.CALL_CONTRACTS,
        Permission.READ_BLOCKS,
        Permission.READ_TRANSACTIONS,
        Permission.READ_STATE,
    ],

    [Role.OPERATOR]: [
        Permission.SEND_TRANSACTIONS,
        Permission.DEPLOY_CONTRACTS,
        Permission.CALL_CONTRACTS,
        Permission.READ_BLOCKS,
        Permission.READ_TRANSACTIONS,
        Permission.READ_STATE,
    ],

    [Role.USER]: [
        Permission.SEND_TRANSACTIONS,
        Permission.CALL_CONTRACTS,
        Permission.READ_BLOCKS,
        Permission.READ_TRANSACTIONS,
        Permission.READ_STATE,
    ],

    [Role.AUDITOR]: [
        Permission.READ_BLOCKS,
        Permission.READ_TRANSACTIONS,
        Permission.READ_STATE,
        Permission.READ_AUDIT_LOGS,
        Permission.VIEW_KYC,
        Permission.GENERATE_REPORTS,
    ],
};

export interface Identity {
    address: string;
    role: Role;
    name?: string;
    email?: string;
    organization?: string;
    kycStatus: 'pending' | 'approved' | 'rejected' | 'expired';
    kycExpiry?: number;
    createdAt: number;
    updatedAt: number;
    isActive: boolean;
    metadata?: Record<string, any>;
}

export interface AccessControlEntry {
    address: string;
    isWhitelisted: boolean;
    isBlacklisted: boolean;
    dailyLimit?: bigint;
    monthlyLimit?: bigint;
    maxTransactionValue?: bigint;
    allowedContracts?: string[];
    blockedContracts?: string[];
    restrictions?: string[];
    createdAt: number;
    updatedAt: number;
}

export interface RBACConfig {
    requireKYC: boolean;
    defaultRole: Role;
    whitelistMode: boolean;  // If true, only whitelisted addresses can transact
    kycExpiryDays: number;
    adminAddresses: string[];
}

export class RBACManager extends EventEmitter {
    private config: RBACConfig;
    private identities: Map<string, Identity> = new Map();
    private accessControl: Map<string, AccessControlEntry> = new Map();
    private roleOverrides: Map<string, Permission[]> = new Map();

    constructor(config: RBACConfig) {
        super();
        this.config = config;

        // Initialize admin addresses
        for (const admin of config.adminAddresses) {
            this.setIdentity({
                address: admin.toLowerCase(),
                role: Role.ADMIN,
                kycStatus: 'approved',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                isActive: true
            });
        }
    }

    /**
     * Check if address has permission
     */
    hasPermission(address: string, permission: Permission): boolean {
        const normalizedAddress = address.toLowerCase();

        // Check if address is active
        if (!this.isActive(normalizedAddress)) {
            return false;
        }

        // Check KYC status if required
        if (this.config.requireKYC && !this.isKYCApproved(normalizedAddress)) {
            // Only allow read permissions without KYC
            if (!permission.startsWith('READ_')) {
                return false;
            }
        }

        // Get role
        const identity = this.identities.get(normalizedAddress);
        const role = identity?.role || this.config.defaultRole;

        // Check role-based permissions
        const rolePermissions = ROLE_PERMISSIONS[role] || [];
        if (rolePermissions.includes(permission)) {
            return true;
        }

        // Check custom overrides
        const overrides = this.roleOverrides.get(normalizedAddress);
        if (overrides?.includes(permission)) {
            return true;
        }

        return false;
    }

    /**
     * Check if address can send transactions
     */
    canSendTransaction(address: string, to: string | null, value: bigint): { allowed: boolean; reason?: string } {
        const normalizedAddress = address.toLowerCase();
        const normalizedTo = to?.toLowerCase();

        // Check whitelist mode
        if (this.config.whitelistMode) {
            const acl = this.accessControl.get(normalizedAddress);
            if (!acl?.isWhitelisted) {
                return { allowed: false, reason: 'Address not whitelisted' };
            }
        }

        // Check blacklist
        const acl = this.accessControl.get(normalizedAddress);
        if (acl?.isBlacklisted) {
            return { allowed: false, reason: 'Address is blacklisted' };
        }

        // Check send permission
        if (!this.hasPermission(normalizedAddress, Permission.SEND_TRANSACTIONS)) {
            return { allowed: false, reason: 'No permission to send transactions' };
        }

        // Check if deploying contract
        if (!to || to === '0x') {
            if (!this.hasPermission(normalizedAddress, Permission.DEPLOY_CONTRACTS)) {
                return { allowed: false, reason: 'No permission to deploy contracts' };
            }
        }

        // Check value limits
        if (acl?.maxTransactionValue && value > acl.maxTransactionValue) {
            return { allowed: false, reason: 'Transaction exceeds maximum value limit' };
        }

        // Check contract restrictions
        if (normalizedTo && acl?.blockedContracts?.includes(normalizedTo)) {
            return { allowed: false, reason: 'Contract is blocked for this address' };
        }

        if (normalizedTo && acl?.allowedContracts && acl.allowedContracts.length > 0) {
            if (!acl.allowedContracts.includes(normalizedTo)) {
                return { allowed: false, reason: 'Contract not in allowed list' };
            }
        }

        return { allowed: true };
    }

    /**
     * Check if address can produce blocks
     */
    canProduceBlocks(address: string): boolean {
        return this.hasPermission(address, Permission.PRODUCE_BLOCKS);
    }

    /**
     * Check if address is active
     */
    isActive(address: string): boolean {
        const identity = this.identities.get(address.toLowerCase());
        if (!identity) {
            // Default to active if no identity exists
            return true;
        }
        return identity.isActive;
    }

    /**
     * Check if KYC is approved
     */
    isKYCApproved(address: string): boolean {
        const identity = this.identities.get(address.toLowerCase());
        if (!identity) {
            return false;
        }

        if (identity.kycStatus !== 'approved') {
            return false;
        }

        // Check expiry
        if (identity.kycExpiry && Date.now() > identity.kycExpiry) {
            return false;
        }

        return true;
    }

    /**
     * Set identity
     */
    setIdentity(identity: Identity): void {
        const normalizedAddress = identity.address.toLowerCase();
        this.identities.set(normalizedAddress, {
            ...identity,
            address: normalizedAddress,
            updatedAt: Date.now()
        });

        this.emit('identityUpdated', normalizedAddress, identity);
    }

    /**
     * Get identity
     */
    getIdentity(address: string): Identity | undefined {
        return this.identities.get(address.toLowerCase());
    }

    /**
     * Get role
     */
    getRole(address: string): Role {
        const identity = this.identities.get(address.toLowerCase());
        return identity?.role || this.config.defaultRole;
    }

    /**
     * Set role
     */
    setRole(adminAddress: string, targetAddress: string, role: Role): { success: boolean; error?: string } {
        // Check admin permission
        if (!this.hasPermission(adminAddress, Permission.MANAGE_ROLES)) {
            return { success: false, error: 'No permission to manage roles' };
        }

        const normalizedTarget = targetAddress.toLowerCase();
        const existing = this.identities.get(normalizedTarget);

        this.setIdentity({
            address: normalizedTarget,
            role,
            kycStatus: existing?.kycStatus || 'pending',
            createdAt: existing?.createdAt || Date.now(),
            updatedAt: Date.now(),
            isActive: existing?.isActive ?? true,
            ...existing,
        });

        this.emit('roleChanged', normalizedTarget, role, adminAddress);
        return { success: true };
    }

    /**
     * Add to whitelist
     */
    whitelist(adminAddress: string, address: string): { success: boolean; error?: string } {
        if (!this.hasPermission(adminAddress, Permission.MANAGE_WHITELIST)) {
            return { success: false, error: 'No permission to manage whitelist' };
        }

        const normalizedAddress = address.toLowerCase();
        const existing = this.accessControl.get(normalizedAddress);

        this.accessControl.set(normalizedAddress, {
            address: normalizedAddress,
            isWhitelisted: true,
            isBlacklisted: false,
            createdAt: existing?.createdAt || Date.now(),
            updatedAt: Date.now(),
            ...existing,
        });

        this.emit('whitelisted', normalizedAddress, adminAddress);
        return { success: true };
    }

    /**
     * Remove from whitelist
     */
    removeFromWhitelist(adminAddress: string, address: string): { success: boolean; error?: string } {
        if (!this.hasPermission(adminAddress, Permission.MANAGE_WHITELIST)) {
            return { success: false, error: 'No permission to manage whitelist' };
        }

        const normalizedAddress = address.toLowerCase();
        const existing = this.accessControl.get(normalizedAddress);

        if (existing) {
            existing.isWhitelisted = false;
            existing.updatedAt = Date.now();
        }

        this.emit('removedFromWhitelist', normalizedAddress, adminAddress);
        return { success: true };
    }

    /**
     * Add to blacklist
     */
    blacklist(adminAddress: string, address: string, reason?: string): { success: boolean; error?: string } {
        if (!this.hasPermission(adminAddress, Permission.FREEZE_ACCOUNTS)) {
            return { success: false, error: 'No permission to freeze accounts' };
        }

        const normalizedAddress = address.toLowerCase();
        const existing = this.accessControl.get(normalizedAddress);

        this.accessControl.set(normalizedAddress, {
            address: normalizedAddress,
            isWhitelisted: false,
            isBlacklisted: true,
            createdAt: existing?.createdAt || Date.now(),
            updatedAt: Date.now(),
            restrictions: [...(existing?.restrictions || []), reason || 'Blacklisted by admin'],
            ...existing,
        });

        this.emit('blacklisted', normalizedAddress, adminAddress, reason);
        return { success: true };
    }

    /**
     * Remove from blacklist
     */
    removeFromBlacklist(adminAddress: string, address: string): { success: boolean; error?: string } {
        if (!this.hasPermission(adminAddress, Permission.FREEZE_ACCOUNTS)) {
            return { success: false, error: 'No permission to unfreeze accounts' };
        }

        const normalizedAddress = address.toLowerCase();
        const existing = this.accessControl.get(normalizedAddress);

        if (existing) {
            existing.isBlacklisted = false;
            existing.updatedAt = Date.now();
        }

        this.emit('removedFromBlacklist', normalizedAddress, adminAddress);
        return { success: true };
    }

    /**
     * Set KYC status
     */
    setKYCStatus(
        adminAddress: string,
        address: string,
        status: 'pending' | 'approved' | 'rejected' | 'expired'
    ): { success: boolean; error?: string } {
        if (!this.hasPermission(adminAddress, Permission.MANAGE_KYC)) {
            return { success: false, error: 'No permission to manage KYC' };
        }

        const normalizedAddress = address.toLowerCase();
        const existing = this.identities.get(normalizedAddress);

        this.setIdentity({
            address: normalizedAddress,
            role: existing?.role || this.config.defaultRole,
            kycStatus: status,
            kycExpiry: status === 'approved'
                ? Date.now() + (this.config.kycExpiryDays * 24 * 60 * 60 * 1000)
                : undefined,
            createdAt: existing?.createdAt || Date.now(),
            updatedAt: Date.now(),
            isActive: existing?.isActive ?? true,
            ...existing,
        });

        this.emit('kycUpdated', normalizedAddress, status, adminAddress);
        return { success: true };
    }

    /**
     * Set transaction limits
     */
    setTransactionLimits(
        adminAddress: string,
        address: string,
        limits: {
            dailyLimit?: bigint;
            monthlyLimit?: bigint;
            maxTransactionValue?: bigint;
        }
    ): { success: boolean; error?: string } {
        if (!this.hasPermission(adminAddress, Permission.MANAGE_WHITELIST)) {
            return { success: false, error: 'No permission to set limits' };
        }

        const normalizedAddress = address.toLowerCase();
        const existing = this.accessControl.get(normalizedAddress);

        this.accessControl.set(normalizedAddress, {
            address: normalizedAddress,
            isWhitelisted: existing?.isWhitelisted ?? false,
            isBlacklisted: existing?.isBlacklisted ?? false,
            createdAt: existing?.createdAt || Date.now(),
            updatedAt: Date.now(),
            ...existing,
            ...limits,
        });

        this.emit('limitsUpdated', normalizedAddress, limits, adminAddress);
        return { success: true };
    }

    /**
     * Get all identities
     */
    getAllIdentities(): Identity[] {
        return Array.from(this.identities.values());
    }

    /**
     * Get all whitelisted addresses
     */
    getWhitelist(): string[] {
        return Array.from(this.accessControl.entries())
            .filter(([_, acl]) => acl.isWhitelisted)
            .map(([addr]) => addr);
    }

    /**
     * Get all blacklisted addresses
     */
    getBlacklist(): string[] {
        return Array.from(this.accessControl.entries())
            .filter(([_, acl]) => acl.isBlacklisted)
            .map(([addr]) => addr);
    }

    /**
     * Get validators
     */
    getValidators(): string[] {
        return Array.from(this.identities.entries())
            .filter(([_, identity]) => identity.role === Role.VALIDATOR && identity.isActive)
            .map(([addr]) => addr);
    }

    /**
     * Export state for persistence
     */
    exportState(): { identities: [string, Identity][]; accessControl: [string, AccessControlEntry][] } {
        return {
            identities: Array.from(this.identities.entries()),
            accessControl: Array.from(this.accessControl.entries())
        };
    }

    /**
     * Import state from persistence
     */
    importState(state: { identities: [string, Identity][]; accessControl: [string, AccessControlEntry][] }): void {
        this.identities = new Map(state.identities);
        this.accessControl = new Map(state.accessControl);
    }
}

export default RBACManager;
