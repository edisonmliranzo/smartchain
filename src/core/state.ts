// SmartChain State Management
import { Account, StorageEntry } from '../types';
import CryptoUtils from './crypto';

/**
 * In-memory state database
 * In production, this would use LevelDB or similar
 */
export class StateManager {
    private accounts: Map<string, Account> = new Map();
    private storage: Map<string, Map<string, string>> = new Map(); // address -> (key -> value)
    private code: Map<string, string> = new Map(); // address -> bytecode
    private stateRoot: string = '0x' + '0'.repeat(64);

    /**
     * Initialize state with genesis allocations
     */
    initializeGenesis(allocations: { [address: string]: bigint }): void {
        for (const [address, balance] of Object.entries(allocations)) {
            const normalizedAddress = CryptoUtils.checksumAddress(address);
            this.accounts.set(normalizedAddress.toLowerCase(), {
                address: normalizedAddress,
                balance,
                nonce: 0,
                codeHash: '0x' + '0'.repeat(64),
                storageRoot: '0x' + '0'.repeat(64),
            });
        }
        this.updateStateRoot();
    }

    /**
     * Get account by address
     */
    getAccount(address: string): Account {
        const normalizedAddress = address.toLowerCase();
        const account = this.accounts.get(normalizedAddress);

        if (account) {
            return account;
        }

        // Return empty account for non-existent addresses
        return {
            address: CryptoUtils.checksumAddress(address),
            balance: BigInt(0),
            nonce: 0,
            codeHash: '0x' + '0'.repeat(64),
            storageRoot: '0x' + '0'.repeat(64),
        };
    }

    /**
     * Set account
     */
    setAccount(address: string, account: Partial<Account>): void {
        const normalizedAddress = address.toLowerCase();
        const existing = this.getAccount(address);

        this.accounts.set(normalizedAddress, {
            ...existing,
            ...account,
            address: CryptoUtils.checksumAddress(address),
        });

        this.updateStateRoot();
    }

    /**
     * Get balance
     */
    getBalance(address: string): bigint {
        return this.getAccount(address).balance;
    }

    /**
     * Set balance
     */
    setBalance(address: string, balance: bigint): void {
        const account = this.getAccount(address);
        this.setAccount(address, { ...account, balance });
    }

    /**
     * Add to balance
     */
    addBalance(address: string, amount: bigint): void {
        const balance = this.getBalance(address);
        this.setBalance(address, balance + amount);
    }

    /**
     * Subtract from balance
     */
    subtractBalance(address: string, amount: bigint): boolean {
        const balance = this.getBalance(address);
        if (balance < amount) {
            return false;
        }
        this.setBalance(address, balance - amount);
        return true;
    }

    /**
     * Transfer value between accounts
     */
    transfer(from: string, to: string, amount: bigint): boolean {
        const fromBalance = this.getBalance(from);
        if (fromBalance < amount) {
            return false;
        }

        this.subtractBalance(from, amount);
        this.addBalance(to, amount);
        return true;
    }

    /**
     * Get nonce
     */
    getNonce(address: string): number {
        return this.getAccount(address).nonce;
    }

    /**
     * Increment nonce
     */
    incrementNonce(address: string): void {
        const account = this.getAccount(address);
        this.setAccount(address, { ...account, nonce: account.nonce + 1 });
    }

    /**
     * Set contract code
     */
    setCode(address: string, code: string): void {
        const normalizedAddress = address.toLowerCase();
        this.code.set(normalizedAddress, code);

        const codeHash = CryptoUtils.hashHex(code);
        const account = this.getAccount(address);
        this.setAccount(address, { ...account, codeHash });
    }

    /**
     * Get contract code
     */
    getCode(address: string): string {
        const normalizedAddress = address.toLowerCase();
        return this.code.get(normalizedAddress) || '0x';
    }

    /**
     * Check if address has code (is contract)
     */
    hasCode(address: string): boolean {
        const code = this.getCode(address);
        return code !== '0x' && code !== '';
    }

    /**
     * Set storage value
     */
    setStorage(address: string, key: string, value: string): void {
        const normalizedAddress = address.toLowerCase();
        const normalizedKey = CryptoUtils.padHex(key);
        const normalizedValue = CryptoUtils.padHex(value);

        if (!this.storage.has(normalizedAddress)) {
            this.storage.set(normalizedAddress, new Map());
        }

        this.storage.get(normalizedAddress)!.set(normalizedKey, normalizedValue);
        this.updateStorageRoot(address);
    }

    /**
     * Get storage value
     */
    getStorage(address: string, key: string): string {
        const normalizedAddress = address.toLowerCase();
        const normalizedKey = CryptoUtils.padHex(key);

        const addressStorage = this.storage.get(normalizedAddress);
        if (!addressStorage) {
            return '0x' + '0'.repeat(64);
        }

        return addressStorage.get(normalizedKey) || '0x' + '0'.repeat(64);
    }

    /**
     * Get all storage for address
     */
    getAllStorage(address: string): StorageEntry[] {
        const normalizedAddress = address.toLowerCase();
        const addressStorage = this.storage.get(normalizedAddress);

        if (!addressStorage) {
            return [];
        }

        const entries: StorageEntry[] = [];
        for (const [key, value] of addressStorage) {
            entries.push({ key, value });
        }
        return entries;
    }

    /**
     * Clear storage for address
     */
    clearStorage(address: string): void {
        const normalizedAddress = address.toLowerCase();
        this.storage.delete(normalizedAddress);
        this.updateStorageRoot(address);
    }

    /**
     * Delete account (self-destruct)
     */
    deleteAccount(address: string): void {
        const normalizedAddress = address.toLowerCase();
        this.accounts.delete(normalizedAddress);
        this.code.delete(normalizedAddress);
        this.storage.delete(normalizedAddress);
        this.updateStateRoot();
    }

    /**
     * Check if account exists
     */
    accountExists(address: string): boolean {
        const normalizedAddress = address.toLowerCase();
        return this.accounts.has(normalizedAddress);
    }

    /**
     * Get all accounts
     */
    getAllAccounts(): Account[] {
        return Array.from(this.accounts.values());
    }

    /**
     * Get account count
     */
    getAccountCount(): number {
        return this.accounts.size;
    }

    /**
     * Get total supply
     */
    getTotalSupply(): bigint {
        let total = BigInt(0);
        for (const account of this.accounts.values()) {
            total += account.balance;
        }
        return total;
    }

    /**
     * Update storage root for address
     */
    private updateStorageRoot(address: string): void {
        const normalizedAddress = address.toLowerCase();
        const addressStorage = this.storage.get(normalizedAddress);

        let storageRoot = '0x' + '0'.repeat(64);

        if (addressStorage && addressStorage.size > 0) {
            const entries: string[] = [];
            for (const [key, value] of addressStorage) {
                entries.push(CryptoUtils.hashHex(key + value.slice(2)));
            }
            storageRoot = CryptoUtils.calculateMerkleRoot(entries);
        }

        const account = this.getAccount(address);
        if (this.accounts.has(normalizedAddress)) {
            this.accounts.get(normalizedAddress)!.storageRoot = storageRoot;
        }
    }

    /**
     * Update global state root
     */
    private updateStateRoot(): void {
        const accountHashes: string[] = [];

        for (const account of this.accounts.values()) {
            const accountData = JSON.stringify({
                address: account.address.toLowerCase(),
                balance: account.balance.toString(),
                nonce: account.nonce.toString(),
                codeHash: account.codeHash,
                storageRoot: account.storageRoot,
            });
            accountHashes.push(CryptoUtils.hash(accountData));
        }

        this.stateRoot = CryptoUtils.calculateMerkleRoot(accountHashes);
    }

    /**
     * Get current state root
     */
    getStateRoot(): string {
        return this.stateRoot;
    }

    /**
     * Create snapshot of current state
     */
    createSnapshot(): {
        accounts: [string, Account][];
        storage: [string, [string, string][]][];
        code: [string, string][];
    } {
        return {
            accounts: Array.from(this.accounts.entries()).map(([k, v]) => [k, { ...v }]),
            storage: Array.from(this.storage.entries()).map(([k, v]) => [k, Array.from(v.entries())]),
            code: Array.from(this.code.entries()),
        };
    }

    /**
     * Restore state from snapshot
     */
    restoreSnapshot(snapshot: {
        accounts: [string, Account][];
        storage: [string, [string, string][]][];
        code: [string, string][];
    }): void {
        this.accounts = new Map(snapshot.accounts);
        this.storage = new Map(snapshot.storage.map(([k, v]) => [k, new Map(v)]));
        this.code = new Map(snapshot.code);
        this.updateStateRoot();
    }

    /**
     * Serialize state for persistence
     */
    serialize(): string {
        const snapshot = this.createSnapshot();
        return JSON.stringify({
            accounts: snapshot.accounts.map(([k, v]) => [k, {
                ...v,
                balance: v.balance.toString(),
            }]),
            storage: snapshot.storage,
            code: snapshot.code,
        });
    }

    /**
     * Deserialize state from persistence
     */
    static deserialize(data: string): StateManager {
        const state = new StateManager();
        const parsed = JSON.parse(data);

        state.accounts = new Map(parsed.accounts.map(([k, v]: [string, any]) => [k, {
            ...v,
            balance: BigInt(v.balance),
        }]));
        state.storage = new Map(parsed.storage.map(([k, v]: [string, [string, string][]]) => [k, new Map(v)]));
        state.code = new Map(parsed.code);
        state.updateStateRoot();

        return state;
    }
}

export default StateManager;
