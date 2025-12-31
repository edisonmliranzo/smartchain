/**
 * SmartChain Enterprise - Audit Logging System
 * 
 * Provides immutable audit trail for all blockchain operations,
 * required for enterprise compliance (SOX, GDPR, etc.)
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import CryptoUtils from '../../core/crypto';

// Audit event types
export enum AuditEventType {
    // Block events
    BLOCK_MINED = 'BLOCK_MINED',
    BLOCK_VALIDATED = 'BLOCK_VALIDATED',
    BLOCK_REJECTED = 'BLOCK_REJECTED',

    // Transaction events
    TRANSACTION_SUBMITTED = 'TRANSACTION_SUBMITTED',
    TRANSACTION_EXECUTED = 'TRANSACTION_EXECUTED',
    TRANSACTION_FAILED = 'TRANSACTION_FAILED',
    TRANSACTION_REVERTED = 'TRANSACTION_REVERTED',

    // Contract events
    CONTRACT_DEPLOYED = 'CONTRACT_DEPLOYED',
    CONTRACT_CALLED = 'CONTRACT_CALLED',
    CONTRACT_VERIFIED = 'CONTRACT_VERIFIED',

    // Token events
    TOKEN_TRANSFER = 'TOKEN_TRANSFER',
    TOKEN_APPROVAL = 'TOKEN_APPROVAL',
    TOKEN_MINTED = 'TOKEN_MINTED',
    TOKEN_BURNED = 'TOKEN_BURNED',

    // Access control events
    ROLE_ASSIGNED = 'ROLE_ASSIGNED',
    ROLE_REVOKED = 'ROLE_REVOKED',
    ADDRESS_WHITELISTED = 'ADDRESS_WHITELISTED',
    ADDRESS_BLACKLISTED = 'ADDRESS_BLACKLISTED',
    KYC_UPDATED = 'KYC_UPDATED',

    // Network events
    NODE_CONNECTED = 'NODE_CONNECTED',
    NODE_DISCONNECTED = 'NODE_DISCONNECTED',
    VALIDATOR_ADDED = 'VALIDATOR_ADDED',
    VALIDATOR_REMOVED = 'VALIDATOR_REMOVED',

    // Admin events
    CONFIG_CHANGED = 'CONFIG_CHANGED',
    EMERGENCY_STOP = 'EMERGENCY_STOP',
    CHAIN_FORKED = 'CHAIN_FORKED',
    STATE_SNAPSHOT = 'STATE_SNAPSHOT',

    // Security events
    UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',

    // Compliance events
    REPORT_GENERATED = 'REPORT_GENERATED',
    DATA_EXPORT = 'DATA_EXPORT',
    LIMIT_EXCEEDED = 'LIMIT_EXCEEDED',
}

export interface AuditEvent {
    id: string;
    timestamp: number;
    type: AuditEventType;
    actor: string;          // Address that triggered the event
    target?: string;        // Address affected by the event
    blockNumber?: number;
    transactionHash?: string;
    data: Record<string, any>;
    metadata: {
        ip?: string;
        userAgent?: string;
        nodeId?: string;
        chainId: number;
    };
    hash: string;           // Hash of the event for integrity
    previousHash: string;   // Hash of previous event (chain)
}

export interface AuditQuery {
    startTime?: number;
    endTime?: number;
    type?: AuditEventType | AuditEventType[];
    actor?: string;
    target?: string;
    blockNumber?: number;
    transactionHash?: string;
    limit?: number;
    offset?: number;
}

export interface AuditConfig {
    chainId: number;
    storagePath: string;
    maxEventsInMemory: number;
    flushIntervalMs: number;
    retentionDays: number;
    enableConsoleLog: boolean;
    enableFileLog: boolean;
    enableCompression: boolean;
}

export class AuditLogger extends EventEmitter {
    private config: AuditConfig;
    private events: AuditEvent[] = [];
    private lastHash: string = '0x0000000000000000000000000000000000000000000000000000000000000000';
    private flushInterval: NodeJS.Timeout | null = null;
    private eventCount: number = 0;
    private logFileStream: fs.WriteStream | null = null;
    private currentLogDate: string = '';

    constructor(config: AuditConfig) {
        super();
        this.config = config;
        this.initialize();
    }

    /**
     * Initialize the audit logger
     */
    private async initialize(): Promise<void> {
        // Ensure storage directory exists
        if (this.config.enableFileLog) {
            const dir = this.config.storagePath;
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            this.openLogFile();
        }

        // Start flush interval
        this.flushInterval = setInterval(() => {
            this.flush();
        }, this.config.flushIntervalMs);

        // Load previous hash from last log entry
        await this.loadLastHash();

        console.log('[Audit] Audit logging system initialized');
    }

    /**
     * Open log file for current date
     */
    private openLogFile(): void {
        const date = new Date().toISOString().split('T')[0];
        if (date !== this.currentLogDate) {
            // Close previous file if open
            if (this.logFileStream) {
                this.logFileStream.end();
            }

            // Open new file
            const filePath = path.join(this.config.storagePath, `audit_${date}.jsonl`);
            this.logFileStream = fs.createWriteStream(filePath, { flags: 'a' });
            this.currentLogDate = date;
        }
    }

    /**
     * Load last hash from existing logs
     */
    private async loadLastHash(): Promise<void> {
        try {
            const files = fs.readdirSync(this.config.storagePath)
                .filter(f => f.startsWith('audit_') && f.endsWith('.jsonl'))
                .sort()
                .reverse();

            if (files.length > 0) {
                const lastFile = path.join(this.config.storagePath, files[0]);
                const content = fs.readFileSync(lastFile, 'utf-8');
                const lines = content.trim().split('\n').filter(l => l);

                if (lines.length > 0) {
                    const lastEvent = JSON.parse(lines[lines.length - 1]);
                    this.lastHash = lastEvent.hash;
                    this.eventCount = lastEvent.id ? parseInt(lastEvent.id.split('-')[1]) : 0;
                }
            }
        } catch (error) {
            console.error('[Audit] Failed to load last hash:', error);
        }
    }

    /**
     * Log an audit event
     */
    log(
        type: AuditEventType,
        actor: string,
        data: Record<string, any>,
        options: {
            target?: string;
            blockNumber?: number;
            transactionHash?: string;
            ip?: string;
            userAgent?: string;
            nodeId?: string;
        } = {}
    ): AuditEvent {
        this.eventCount++;

        const event: AuditEvent = {
            id: `${this.config.chainId}-${this.eventCount}`,
            timestamp: Date.now(),
            type,
            actor: actor.toLowerCase(),
            target: options.target?.toLowerCase(),
            blockNumber: options.blockNumber,
            transactionHash: options.transactionHash,
            data,
            metadata: {
                ip: options.ip,
                userAgent: options.userAgent,
                nodeId: options.nodeId,
                chainId: this.config.chainId
            },
            hash: '', // Will be computed
            previousHash: this.lastHash
        };

        // Compute hash
        const eventData = JSON.stringify({
            ...event,
            hash: undefined
        });
        event.hash = CryptoUtils.hash(eventData);
        this.lastHash = event.hash;

        // Store in memory
        this.events.push(event);

        // Console log if enabled
        if (this.config.enableConsoleLog) {
            console.log(`[Audit] ${type} | Actor: ${actor} | ${JSON.stringify(data)}`);
        }

        // Write to file immediately for important events
        if (this.isHighPriorityEvent(type)) {
            this.writeToFile(event);
        }

        // Emit event
        this.emit('auditEvent', event);

        // Check memory limit
        if (this.events.length >= this.config.maxEventsInMemory) {
            this.flush();
        }

        return event;
    }

    /**
     * Check if event is high priority
     */
    private isHighPriorityEvent(type: AuditEventType): boolean {
        return [
            AuditEventType.UNAUTHORIZED_ACCESS,
            AuditEventType.SUSPICIOUS_ACTIVITY,
            AuditEventType.EMERGENCY_STOP,
            AuditEventType.ROLE_ASSIGNED,
            AuditEventType.ADDRESS_BLACKLISTED,
            AuditEventType.CHAIN_FORKED,
        ].includes(type);
    }

    /**
     * Write event to file
     */
    private writeToFile(event: AuditEvent): void {
        if (this.config.enableFileLog && this.logFileStream) {
            this.openLogFile(); // Ensure correct date file
            this.logFileStream.write(JSON.stringify(event) + '\n');
        }
    }

    /**
     * Flush events to storage
     */
    flush(): void {
        if (this.events.length === 0) return;

        if (this.config.enableFileLog && this.logFileStream) {
            this.openLogFile();
            for (const event of this.events) {
                this.logFileStream.write(JSON.stringify(event) + '\n');
            }
        }

        this.events = [];
    }

    /**
     * Query audit logs
     */
    async query(query: AuditQuery): Promise<AuditEvent[]> {
        const results: AuditEvent[] = [];
        const limit = query.limit || 100;
        const offset = query.offset || 0;

        // Search in memory first
        for (const event of [...this.events].reverse()) {
            if (this.matchesQuery(event, query)) {
                results.push(event);
            }
        }

        // Search in files if needed
        if (results.length < limit + offset && this.config.enableFileLog) {
            const fileResults = await this.searchFiles(query);
            results.push(...fileResults);
        }

        // Apply filters
        const filtered = results
            .filter((e, i, arr) => arr.findIndex(x => x.id === e.id) === i) // Dedupe
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(offset, offset + limit);

        return filtered;
    }

    /**
     * Check if event matches query
     */
    private matchesQuery(event: AuditEvent, query: AuditQuery): boolean {
        if (query.startTime && event.timestamp < query.startTime) return false;
        if (query.endTime && event.timestamp > query.endTime) return false;

        if (query.type) {
            const types = Array.isArray(query.type) ? query.type : [query.type];
            if (!types.includes(event.type)) return false;
        }

        if (query.actor && event.actor !== query.actor.toLowerCase()) return false;
        if (query.target && event.target !== query.target?.toLowerCase()) return false;
        if (query.blockNumber && event.blockNumber !== query.blockNumber) return false;
        if (query.transactionHash && event.transactionHash !== query.transactionHash) return false;

        return true;
    }

    /**
     * Search files for events
     */
    private async searchFiles(query: AuditQuery): Promise<AuditEvent[]> {
        const results: AuditEvent[] = [];

        try {
            const files = fs.readdirSync(this.config.storagePath)
                .filter(f => f.startsWith('audit_') && f.endsWith('.jsonl'))
                .sort()
                .reverse();

            for (const file of files) {
                // Filter by date if possible
                const fileDate = file.replace('audit_', '').replace('.jsonl', '');
                const fileDateMs = new Date(fileDate).getTime();

                if (query.endTime && fileDateMs > query.endTime + 86400000) continue;
                if (query.startTime && fileDateMs < query.startTime - 86400000) continue;

                const filePath = path.join(this.config.storagePath, file);
                const content = fs.readFileSync(filePath, 'utf-8');
                const lines = content.trim().split('\n').filter(l => l);

                for (const line of lines.reverse()) {
                    try {
                        const event = JSON.parse(line) as AuditEvent;
                        if (this.matchesQuery(event, query)) {
                            results.push(event);
                        }
                    } catch (e) {
                        // Skip malformed lines
                    }
                }
            }
        } catch (error) {
            console.error('[Audit] File search error:', error);
        }

        return results;
    }

    /**
     * Verify audit chain integrity
     */
    async verifyIntegrity(startId?: string, endId?: string): Promise<{
        valid: boolean;
        errors: { eventId: string; error: string }[];
        eventsChecked: number;
    }> {
        const errors: { eventId: string; error: string }[] = [];
        let eventsChecked = 0;
        let previousHash = '0x0000000000000000000000000000000000000000000000000000000000000000';
        let inRange = !startId;

        const files = fs.readdirSync(this.config.storagePath)
            .filter(f => f.startsWith('audit_') && f.endsWith('.jsonl'))
            .sort();

        for (const file of files) {
            const filePath = path.join(this.config.storagePath, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.trim().split('\n').filter(l => l);

            for (const line of lines) {
                try {
                    const event = JSON.parse(line) as AuditEvent;

                    if (!inRange && event.id === startId) {
                        inRange = true;
                    }

                    if (inRange) {
                        eventsChecked++;

                        // Verify previous hash
                        if (event.previousHash !== previousHash) {
                            errors.push({
                                eventId: event.id,
                                error: `Previous hash mismatch. Expected: ${previousHash}, Got: ${event.previousHash}`
                            });
                        }

                        // Verify event hash
                        const eventData = JSON.stringify({
                            ...event,
                            hash: undefined
                        });
                        const computedHash = CryptoUtils.hash(eventData);
                        if (computedHash !== event.hash) {
                            errors.push({
                                eventId: event.id,
                                error: `Event hash mismatch. Data may have been tampered.`
                            });
                        }

                        previousHash = event.hash;

                        if (endId && event.id === endId) {
                            return { valid: errors.length === 0, errors, eventsChecked };
                        }
                    }
                } catch (e) {
                    errors.push({ eventId: 'unknown', error: `Failed to parse event: ${e}` });
                }
            }
        }

        return { valid: errors.length === 0, errors, eventsChecked };
    }

    /**
     * Generate compliance report
     */
    async generateReport(
        startTime: number,
        endTime: number,
        options: {
            includeTransactions?: boolean;
            includeAccessControl?: boolean;
            includeSecurityEvents?: boolean;
            format?: 'json' | 'csv';
        } = {}
    ): Promise<{ filename: string; content: string }> {
        const events = await this.query({
            startTime,
            endTime,
            limit: 10000
        });

        // Filter by category
        let filtered = events;
        if (!options.includeTransactions) {
            filtered = filtered.filter(e => !e.type.includes('TRANSACTION'));
        }
        if (!options.includeAccessControl) {
            filtered = filtered.filter(e => !['ROLE_', 'ADDRESS_', 'KYC_'].some(p => e.type.includes(p)));
        }
        if (!options.includeSecurityEvents) {
            filtered = filtered.filter(e => !['UNAUTHORIZED', 'SUSPICIOUS', 'RATE_LIMIT'].some(p => e.type.includes(p)));
        }

        const filename = `compliance_report_${new Date(startTime).toISOString().split('T')[0]}_${new Date(endTime).toISOString().split('T')[0]}.${options.format || 'json'}`;

        let content: string;
        if (options.format === 'csv') {
            const headers = ['ID', 'Timestamp', 'Type', 'Actor', 'Target', 'Block', 'Transaction', 'Data'];
            const rows = filtered.map(e => [
                e.id,
                new Date(e.timestamp).toISOString(),
                e.type,
                e.actor,
                e.target || '',
                e.blockNumber || '',
                e.transactionHash || '',
                JSON.stringify(e.data)
            ].join(','));
            content = [headers.join(','), ...rows].join('\n');
        } else {
            content = JSON.stringify(filtered, null, 2);
        }

        // Log report generation
        this.log(AuditEventType.REPORT_GENERATED, 'SYSTEM', {
            startTime,
            endTime,
            eventCount: filtered.length,
            filename
        });

        return { filename, content };
    }

    /**
     * Get statistics
     */
    getStats(): {
        totalEvents: number;
        eventsByType: Record<string, number>;
        eventsInMemory: number;
        storageSize: number;
    } {
        const eventsByType: Record<string, number> = {};
        let totalEvents = 0;
        let storageSize = 0;

        // Count from files
        try {
            const files = fs.readdirSync(this.config.storagePath)
                .filter(f => f.startsWith('audit_') && f.endsWith('.jsonl'));

            for (const file of files) {
                const filePath = path.join(this.config.storagePath, file);
                const stats = fs.statSync(filePath);
                storageSize += stats.size;

                const content = fs.readFileSync(filePath, 'utf-8');
                const lines = content.trim().split('\n').filter(l => l);
                totalEvents += lines.length;

                for (const line of lines) {
                    try {
                        const event = JSON.parse(line);
                        eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
                    } catch (e) { }
                }
            }
        } catch (error) {
            console.error('[Audit] Stats error:', error);
        }

        return {
            totalEvents: totalEvents + this.events.length,
            eventsByType,
            eventsInMemory: this.events.length,
            storageSize
        };
    }

    /**
     * Cleanup old logs
     */
    async cleanup(): Promise<number> {
        const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;
        const cutoffDate = Date.now() - retentionMs;
        let deletedCount = 0;

        try {
            const files = fs.readdirSync(this.config.storagePath)
                .filter(f => f.startsWith('audit_') && f.endsWith('.jsonl'));

            for (const file of files) {
                const fileDate = file.replace('audit_', '').replace('.jsonl', '');
                const fileDateMs = new Date(fileDate).getTime();

                if (fileDateMs < cutoffDate) {
                    fs.unlinkSync(path.join(this.config.storagePath, file));
                    deletedCount++;
                }
            }
        } catch (error) {
            console.error('[Audit] Cleanup error:', error);
        }

        return deletedCount;
    }

    /**
     * Close logger
     */
    close(): void {
        this.flush();

        if (this.flushInterval) {
            clearInterval(this.flushInterval);
            this.flushInterval = null;
        }

        if (this.logFileStream) {
            this.logFileStream.end();
            this.logFileStream = null;
        }

        console.log('[Audit] Audit logger closed');
    }
}

export default AuditLogger;
