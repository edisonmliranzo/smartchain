/**
 * SmartChain Public Network - Staking Manager
 * 
 * Manages validator staking, election, rewards, and slashing
 * for the public PoA blockchain with economic incentives.
 */

import { EventEmitter } from 'events';
import { ethers } from 'ethers';
import { Blockchain } from '../core/blockchain';
import CryptoUtils from '../core/crypto';

// ============ Types ============

export interface ValidatorInfo {
    address: string;
    stake: bigint;
    totalDelegated: bigint;
    commission: number;        // Basis points (100 = 1%)
    isActive: boolean;
    isJailed: boolean;
    jailedUntil: number;
    blocksProduced: number;
    blocksMissed: number;
    lastBlockTime: number;
    name: string;
    website: string;
    rank: number;
}

export interface DelegationInfo {
    amount: bigint;
    pendingRewards: bigint;
    validator: string;
}

export interface UnbondingEntry {
    amount: bigint;
    completionTime: number;
    validator: string;
}

export interface StakingConfig {
    minStake: bigint;           // Minimum stake to become validator
    maxValidators: number;       // Maximum active validators
    epochBlocks: number;         // Blocks per epoch
    unbondingPeriod: number;     // Seconds to wait after unstaking
    slashDowntimePercent: number;
    slashDoubleSignPercent: number;
    rewardsPerBlock: bigint;
}

export interface EpochInfo {
    number: number;
    startBlock: number;
    endBlock: number;
    validators: string[];
    totalRewards: bigint;
}

// ============ Default Config ============

const DEFAULT_CONFIG: StakingConfig = {
    minStake: BigInt('100000000000000000000000'),  // 100,000 SMC
    maxValidators: 21,
    epochBlocks: 200,
    unbondingPeriod: 7 * 24 * 60 * 60, // 7 days
    slashDowntimePercent: 1,
    slashDoubleSignPercent: 5,
    rewardsPerBlock: BigInt('2000000000000000000'), // 2 SMC
};

// ============ Staking Manager ============

export class StakingManager extends EventEmitter {
    private blockchain: Blockchain;
    private config: StakingConfig;

    // Validator data
    private validators: Map<string, ValidatorInfo> = new Map();
    private activeValidators: string[] = [];

    // Delegation data
    private delegations: Map<string, Map<string, DelegationInfo>> = new Map(); // delegator => validator => info
    private unbonding: Map<string, UnbondingEntry[]> = new Map();

    // Epoch management
    private currentEpoch: EpochInfo;
    private epochHistory: EpochInfo[] = [];

    // Reward tracking
    private totalStaked: bigint = BigInt(0);
    private accRewardsPerShare: bigint = BigInt(0);
    private lastRewardBlock: number = 0;

    // Slashing evidence
    private processedEvidence: Set<string> = new Set();

    constructor(blockchain: Blockchain, config: Partial<StakingConfig> = {}) {
        super();
        this.blockchain = blockchain;
        this.config = { ...DEFAULT_CONFIG, ...config };

        this.currentEpoch = {
            number: 0,
            startBlock: 0,
            endBlock: this.config.epochBlocks,
            validators: [],
            totalRewards: BigInt(0)
        };

        this.lastRewardBlock = blockchain.getLatestBlockNumber();

        // Hook into blockchain events
        this.setupBlockchainHooks();
    }

    // ============ Initialization ============

    private setupBlockchainHooks(): void {
        this.blockchain.on('newBlock', (block) => {
            this.onNewBlock(block);
        });
    }

    private onNewBlock(block: any): void {
        const miner = block.header.miner.toLowerCase();

        // Update rewards
        this.updateRewards();

        // Track block production
        if (this.validators.has(miner)) {
            const validator = this.validators.get(miner)!;
            validator.blocksProduced++;
            validator.lastBlockTime = Date.now();
        }

        // Check for epoch transition
        if (block.header.number >= this.currentEpoch.endBlock) {
            this.newEpoch();
        }

        // Check for missed blocks
        this.checkMissedBlocks(block);
    }

    // ============ Validator Registration ============

    /**
     * Register as a validator
     */
    registerValidator(
        address: string,
        stake: bigint,
        name: string,
        website: string = '',
        commission: number = 500 // 5% default
    ): { success: boolean; error?: string } {
        const normalizedAddress = address.toLowerCase();

        if (this.validators.has(normalizedAddress)) {
            return { success: false, error: 'Already registered as validator' };
        }

        if (stake < this.config.minStake) {
            return { success: false, error: `Minimum stake is ${this.config.minStake} wei` };
        }

        if (commission > 2000) {
            return { success: false, error: 'Commission cannot exceed 20%' };
        }

        // Check if address has sufficient balance
        const balance = this.blockchain.getBalance(normalizedAddress);
        if (balance < stake) {
            return { success: false, error: 'Insufficient balance' };
        }

        // Deduct stake from balance
        this.blockchain.state.subtractBalance(normalizedAddress, stake);

        this.validators.set(normalizedAddress, {
            address: normalizedAddress,
            stake,
            totalDelegated: BigInt(0),
            commission,
            isActive: true,
            isJailed: false,
            jailedUntil: 0,
            blocksProduced: 0,
            blocksMissed: 0,
            lastBlockTime: Date.now(),
            name,
            website,
            rank: 0
        });

        this.totalStaked += stake;

        this.emit('validatorRegistered', normalizedAddress, stake, name);
        this.updateActiveValidators();

        return { success: true };
    }

    /**
     * Add more stake as a validator
     */
    addStake(address: string, amount: bigint): { success: boolean; error?: string } {
        const normalizedAddress = address.toLowerCase();
        const validator = this.validators.get(normalizedAddress);

        if (!validator) {
            return { success: false, error: 'Not a registered validator' };
        }

        if (validator.isJailed) {
            return { success: false, error: 'Validator is jailed' };
        }

        // Check balance
        const balance = this.blockchain.getBalance(normalizedAddress);
        if (balance < amount) {
            return { success: false, error: 'Insufficient balance' };
        }

        // Deduct from balance
        this.blockchain.state.subtractBalance(normalizedAddress, amount);

        validator.stake += amount;
        this.totalStaked += amount;

        this.emit('stakeAdded', normalizedAddress, amount);
        this.updateActiveValidators();

        return { success: true };
    }

    // ============ Delegation ============

    /**
     * Delegate stake to a validator
     */
    delegate(
        delegator: string,
        validator: string,
        amount: bigint
    ): { success: boolean; error?: string } {
        const normalizedDelegator = delegator.toLowerCase();
        const normalizedValidator = validator.toLowerCase();

        const validatorInfo = this.validators.get(normalizedValidator);
        if (!validatorInfo) {
            return { success: false, error: 'Validator not found' };
        }

        if (validatorInfo.isJailed) {
            return { success: false, error: 'Validator is jailed' };
        }

        // Check balance
        const balance = this.blockchain.getBalance(normalizedDelegator);
        if (balance < amount) {
            return { success: false, error: 'Insufficient balance' };
        }

        this.updateRewards();

        // Get or create delegation map for delegator
        if (!this.delegations.has(normalizedDelegator)) {
            this.delegations.set(normalizedDelegator, new Map());
        }

        const delegatorMap = this.delegations.get(normalizedDelegator)!;
        let delegation = delegatorMap.get(normalizedValidator);

        if (!delegation) {
            delegation = {
                amount: BigInt(0),
                pendingRewards: BigInt(0),
                validator: normalizedValidator
            };
            delegatorMap.set(normalizedValidator, delegation);
        }

        // Claim pending rewards first
        const pending = this.calculatePendingRewards(normalizedDelegator, normalizedValidator);
        delegation.pendingRewards += pending;

        // Deduct from balance
        this.blockchain.state.subtractBalance(normalizedDelegator, amount);

        delegation.amount += amount;
        validatorInfo.totalDelegated += amount;
        this.totalStaked += amount;

        this.emit('delegated', normalizedDelegator, normalizedValidator, amount);
        this.updateActiveValidators();

        return { success: true };
    }

    /**
     * Undelegate stake from a validator
     */
    undelegate(
        delegator: string,
        validator: string,
        amount: bigint
    ): { success: boolean; error?: string } {
        const normalizedDelegator = delegator.toLowerCase();
        const normalizedValidator = validator.toLowerCase();

        const delegatorMap = this.delegations.get(normalizedDelegator);
        if (!delegatorMap) {
            return { success: false, error: 'No delegations found' };
        }

        const delegation = delegatorMap.get(normalizedValidator);
        if (!delegation || delegation.amount < amount) {
            return { success: false, error: 'Insufficient delegation' };
        }

        this.updateRewards();

        // Claim pending rewards
        const pending = this.calculatePendingRewards(normalizedDelegator, normalizedValidator);
        delegation.pendingRewards += pending;

        delegation.amount -= amount;

        const validatorInfo = this.validators.get(normalizedValidator);
        if (validatorInfo) {
            validatorInfo.totalDelegated -= amount;
        }

        this.totalStaked -= amount;

        // Add to unbonding queue
        if (!this.unbonding.has(normalizedDelegator)) {
            this.unbonding.set(normalizedDelegator, []);
        }

        this.unbonding.get(normalizedDelegator)!.push({
            amount,
            completionTime: Date.now() + (this.config.unbondingPeriod * 1000),
            validator: normalizedValidator
        });

        this.emit('undelegated', normalizedDelegator, normalizedValidator, amount);
        this.updateActiveValidators();

        return { success: true };
    }

    /**
     * Withdraw unbonded tokens
     */
    withdraw(delegator: string): { success: boolean; amount: bigint; error?: string } {
        const normalizedDelegator = delegator.toLowerCase();
        const queue = this.unbonding.get(normalizedDelegator);

        if (!queue || queue.length === 0) {
            return { success: false, amount: BigInt(0), error: 'Nothing to withdraw' };
        }

        let totalWithdraw = BigInt(0);
        const now = Date.now();

        // Filter out completed unbonding entries
        const remaining: UnbondingEntry[] = [];
        for (const entry of queue) {
            if (entry.completionTime <= now) {
                totalWithdraw += entry.amount;
            } else {
                remaining.push(entry);
            }
        }

        if (totalWithdraw === BigInt(0)) {
            return { success: false, amount: BigInt(0), error: 'Unbonding period not complete' };
        }

        this.unbonding.set(normalizedDelegator, remaining);

        // Add back to balance
        this.blockchain.state.addBalance(normalizedDelegator, totalWithdraw);

        this.emit('withdrawn', normalizedDelegator, totalWithdraw);

        return { success: true, amount: totalWithdraw };
    }

    /**
     * Claim staking rewards
     */
    claimRewards(delegator: string, validator: string): { success: boolean; amount: bigint; error?: string } {
        const normalizedDelegator = delegator.toLowerCase();
        const normalizedValidator = validator.toLowerCase();

        this.updateRewards();

        const delegatorMap = this.delegations.get(normalizedDelegator);
        if (!delegatorMap) {
            return { success: false, amount: BigInt(0), error: 'No delegations found' };
        }

        const delegation = delegatorMap.get(normalizedValidator);
        if (!delegation) {
            return { success: false, amount: BigInt(0), error: 'Delegation not found' };
        }

        const pending = this.calculatePendingRewards(normalizedDelegator, normalizedValidator);
        const total = pending + delegation.pendingRewards;

        if (total === BigInt(0)) {
            return { success: false, amount: BigInt(0), error: 'No rewards to claim' };
        }

        delegation.pendingRewards = BigInt(0);

        // Add rewards to balance
        this.blockchain.state.addBalance(normalizedDelegator, total);

        this.emit('rewardsClaimed', normalizedDelegator, normalizedValidator, total);

        return { success: true, amount: total };
    }

    // ============ Validator Election ============

    /**
     * Update the active validator set based on total stake
     */
    private updateActiveValidators(): void {
        // Create sorted list of eligible validators
        const eligible: Array<{ address: string; totalStake: bigint }> = [];

        for (const [address, info] of this.validators) {
            if (info.isActive && !info.isJailed) {
                eligible.push({
                    address,
                    totalStake: info.stake + info.totalDelegated
                });
            }
        }

        // Sort by total stake (descending)
        eligible.sort((a, b) => {
            if (b.totalStake > a.totalStake) return 1;
            if (b.totalStake < a.totalStake) return -1;
            return 0;
        });

        // Update ranks
        for (let i = 0; i < eligible.length; i++) {
            const validator = this.validators.get(eligible[i].address);
            if (validator) {
                validator.rank = i + 1;
            }
        }

        // Set active validators (top N)
        this.activeValidators = eligible
            .slice(0, this.config.maxValidators)
            .map(v => v.address);

        this.emit('validatorSetUpdated', this.activeValidators);
    }

    /**
     * Get active validators for block production
     */
    getActiveValidators(): string[] {
        return [...this.activeValidators];
    }

    /**
     * Check if address is an active validator
     */
    isActiveValidator(address: string): boolean {
        return this.activeValidators.includes(address.toLowerCase());
    }

    // ============ Rewards ============

    /**
     * Update accumulated rewards
     */
    private updateRewards(): void {
        const currentBlock = this.blockchain.getLatestBlockNumber();

        if (currentBlock <= this.lastRewardBlock) return;
        if (this.totalStaked === BigInt(0)) {
            this.lastRewardBlock = currentBlock;
            return;
        }

        const blocks = BigInt(currentBlock - this.lastRewardBlock);
        const reward = blocks * this.config.rewardsPerBlock;

        this.accRewardsPerShare += (reward * BigInt(10 ** 12)) / this.totalStaked;
        this.lastRewardBlock = currentBlock;

        this.currentEpoch.totalRewards += reward;
    }

    /**
     * Calculate pending rewards for a delegation
     */
    private calculatePendingRewards(delegator: string, validator: string): bigint {
        const delegatorMap = this.delegations.get(delegator);
        if (!delegatorMap) return BigInt(0);

        const delegation = delegatorMap.get(validator);
        if (!delegation || delegation.amount === BigInt(0)) return BigInt(0);

        let accRewards = this.accRewardsPerShare;
        const currentBlock = this.blockchain.getLatestBlockNumber();

        if (currentBlock > this.lastRewardBlock && this.totalStaked > BigInt(0)) {
            const blocks = BigInt(currentBlock - this.lastRewardBlock);
            const reward = blocks * this.config.rewardsPerBlock;
            accRewards += (reward * BigInt(10 ** 12)) / this.totalStaked;
        }

        return (delegation.amount * accRewards) / BigInt(10 ** 12);
    }

    /**
     * Get pending rewards for a delegation
     */
    getPendingRewards(delegator: string, validator: string): bigint {
        const normalizedDelegator = delegator.toLowerCase();
        const normalizedValidator = validator.toLowerCase();

        const delegatorMap = this.delegations.get(normalizedDelegator);
        if (!delegatorMap) return BigInt(0);

        const delegation = delegatorMap.get(normalizedValidator);
        if (!delegation) return BigInt(0);

        return this.calculatePendingRewards(normalizedDelegator, normalizedValidator) + delegation.pendingRewards;
    }

    // ============ Slashing ============

    /**
     * Check for missed blocks and slash if necessary
     */
    private checkMissedBlocks(block: any): void {
        const expectedMiner = this.getExpectedMiner(block.header.number);
        const actualMiner = block.header.miner.toLowerCase();

        if (expectedMiner && expectedMiner !== actualMiner) {
            const validator = this.validators.get(expectedMiner);
            if (validator) {
                validator.blocksMissed++;

                // Slash if too many consecutive misses
                if (validator.blocksMissed >= 10) {
                    this.slashForDowntime(expectedMiner);
                }
            }
        }

        // Reset missed blocks for the actual miner
        const actualValidator = this.validators.get(actualMiner);
        if (actualValidator) {
            actualValidator.blocksMissed = 0;
        }
    }

    /**
     * Get expected miner for a block number (round-robin)
     */
    private getExpectedMiner(blockNumber: number): string | null {
        if (this.activeValidators.length === 0) return null;
        const index = blockNumber % this.activeValidators.length;
        return this.activeValidators[index];
    }

    /**
     * Slash a validator for downtime
     */
    slashForDowntime(address: string): { success: boolean; slashedAmount: bigint } {
        const normalizedAddress = address.toLowerCase();
        const validator = this.validators.get(normalizedAddress);

        if (!validator) {
            return { success: false, slashedAmount: BigInt(0) };
        }

        const evidenceHash = CryptoUtils.hash(`${normalizedAddress}-downtime-${Date.now()}`);
        if (this.processedEvidence.has(evidenceHash)) {
            return { success: false, slashedAmount: BigInt(0) };
        }
        this.processedEvidence.add(evidenceHash);

        const slashAmount = (validator.stake * BigInt(this.config.slashDowntimePercent)) / BigInt(100);
        validator.stake -= slashAmount;
        this.totalStaked -= slashAmount;

        // Jail the validator
        validator.isJailed = true;
        validator.jailedUntil = Date.now() + (24 * 60 * 60 * 1000); // 1 day

        this.emit('validatorSlashed', normalizedAddress, slashAmount, 'downtime');
        this.emit('validatorJailed', normalizedAddress, validator.jailedUntil);

        this.updateActiveValidators();

        return { success: true, slashedAmount: slashAmount };
    }

    /**
     * Slash a validator for double signing
     */
    slashForDoubleSigning(address: string, evidence: string): { success: boolean; slashedAmount: bigint } {
        const normalizedAddress = address.toLowerCase();
        const validator = this.validators.get(normalizedAddress);

        if (!validator) {
            return { success: false, slashedAmount: BigInt(0) };
        }

        const evidenceHash = CryptoUtils.hash(evidence);
        if (this.processedEvidence.has(evidenceHash)) {
            return { success: false, slashedAmount: BigInt(0) };
        }
        this.processedEvidence.add(evidenceHash);

        const slashAmount = (validator.stake * BigInt(this.config.slashDoubleSignPercent)) / BigInt(100);
        validator.stake -= slashAmount;
        this.totalStaked -= slashAmount;

        // Jail the validator for longer
        validator.isJailed = true;
        validator.jailedUntil = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

        this.emit('validatorSlashed', normalizedAddress, slashAmount, 'double_signing');
        this.emit('validatorJailed', normalizedAddress, validator.jailedUntil);

        this.updateActiveValidators();

        return { success: true, slashedAmount: slashAmount };
    }

    /**
     * Unjail a validator after jail period
     */
    unjail(address: string): { success: boolean; error?: string } {
        const normalizedAddress = address.toLowerCase();
        const validator = this.validators.get(normalizedAddress);

        if (!validator) {
            return { success: false, error: 'Validator not found' };
        }

        if (!validator.isJailed) {
            return { success: false, error: 'Validator is not jailed' };
        }

        if (Date.now() < validator.jailedUntil) {
            return { success: false, error: 'Jail period not complete' };
        }

        if (validator.stake < this.config.minStake) {
            return { success: false, error: 'Stake below minimum' };
        }

        validator.isJailed = false;
        validator.jailedUntil = 0;
        validator.blocksMissed = 0;

        this.emit('validatorUnjailed', normalizedAddress);
        this.updateActiveValidators();

        return { success: true };
    }

    // ============ Epoch Management ============

    /**
     * Start a new epoch
     */
    private newEpoch(): void {
        // Save current epoch to history
        this.epochHistory.push({ ...this.currentEpoch });

        // Create new epoch
        const currentBlock = this.blockchain.getLatestBlockNumber();
        this.currentEpoch = {
            number: this.currentEpoch.number + 1,
            startBlock: currentBlock,
            endBlock: currentBlock + this.config.epochBlocks,
            validators: [...this.activeValidators],
            totalRewards: BigInt(0)
        };

        this.emit('newEpoch', this.currentEpoch);
    }

    /**
     * Get current epoch info
     */
    getCurrentEpoch(): EpochInfo {
        return { ...this.currentEpoch };
    }

    // ============ View Functions ============

    /**
     * Get validator info
     */
    getValidator(address: string): ValidatorInfo | undefined {
        return this.validators.get(address.toLowerCase());
    }

    /**
     * Get all validators
     */
    getAllValidators(): ValidatorInfo[] {
        return Array.from(this.validators.values());
    }

    /**
     * Get delegation info
     */
    getDelegation(delegator: string, validator: string): DelegationInfo | undefined {
        const delegatorMap = this.delegations.get(delegator.toLowerCase());
        if (!delegatorMap) return undefined;
        return delegatorMap.get(validator.toLowerCase());
    }

    /**
     * Get all delegations for a delegator
     */
    getDelegations(delegator: string): DelegationInfo[] {
        const delegatorMap = this.delegations.get(delegator.toLowerCase());
        if (!delegatorMap) return [];
        return Array.from(delegatorMap.values());
    }

    /**
     * Get unbonding entries
     */
    getUnbonding(delegator: string): UnbondingEntry[] {
        return this.unbonding.get(delegator.toLowerCase()) || [];
    }

    /**
     * Get staking statistics
     */
    getStats(): {
        totalStaked: bigint;
        totalValidators: number;
        activeValidators: number;
        currentEpoch: number;
        rewardsPerBlock: bigint;
    } {
        return {
            totalStaked: this.totalStaked,
            totalValidators: this.validators.size,
            activeValidators: this.activeValidators.length,
            currentEpoch: this.currentEpoch.number,
            rewardsPerBlock: this.config.rewardsPerBlock
        };
    }

    /**
     * Export state for persistence
     */
    exportState(): any {
        return {
            validators: Array.from(this.validators.entries()),
            activeValidators: this.activeValidators,
            delegations: Array.from(this.delegations.entries()).map(([k, v]) => [k, Array.from(v.entries())]),
            unbonding: Array.from(this.unbonding.entries()),
            currentEpoch: this.currentEpoch,
            totalStaked: this.totalStaked.toString(),
            accRewardsPerShare: this.accRewardsPerShare.toString(),
            lastRewardBlock: this.lastRewardBlock
        };
    }

    /**
     * Import state from persistence
     */
    importState(state: any): void {
        this.validators = new Map(state.validators);
        this.activeValidators = state.activeValidators;
        this.delegations = new Map(state.delegations.map(([k, v]: any) => [k, new Map(v)]));
        this.unbonding = new Map(state.unbonding);
        this.currentEpoch = state.currentEpoch;
        this.totalStaked = BigInt(state.totalStaked);
        this.accRewardsPerShare = BigInt(state.accRewardsPerShare);
        this.lastRewardBlock = state.lastRewardBlock;
    }
}

export default StakingManager;
