/**
 * SmartChain Public Network - Main Module
 * 
 * Exports all public blockchain components
 */

export { StakingManager, StakingConfig, ValidatorInfo, DelegationInfo, UnbondingEntry, EpochInfo } from './staking';
export { StakingAPI } from './staking-api';

// Default export for quick setup
import { Blockchain } from '../core/blockchain';
import { StakingManager, StakingConfig } from './staking';
import { StakingAPI } from './staking-api';

export interface PublicNetworkConfig {
    staking?: Partial<StakingConfig>;
}

export class PublicNetwork {
    public staking: StakingManager;
    public stakingAPI: StakingAPI;
    private blockchain: Blockchain;

    constructor(blockchain: Blockchain, config: PublicNetworkConfig = {}) {
        this.blockchain = blockchain;
        this.staking = new StakingManager(blockchain, config.staking);
        this.stakingAPI = new StakingAPI(this.staking);
    }

    /**
     * Get the staking API router
     */
    getRouter() {
        return this.stakingAPI.getRouter();
    }

    /**
     * Get network stats
     */
    getStats() {
        return {
            staking: this.staking.getStats(),
            epoch: this.staking.getCurrentEpoch(),
            validators: this.staking.getActiveValidators()
        };
    }
}

export default PublicNetwork;
