/**
 * SmartChain Public Network - Staking API
 * 
 * REST API endpoints for staking operations
 */

import { Router, Request, Response } from 'express';
import { StakingManager, ValidatorInfo, DelegationInfo } from './staking';

export class StakingAPI {
    private router: Router;
    private staking: StakingManager;

    constructor(staking: StakingManager) {
        this.router = Router();
        this.staking = staking;
        this.setupRoutes();
    }

    private setupRoutes(): void {
        // ============ Validator Endpoints ============

        /**
         * GET /validators
         * Get all validators
         */
        this.router.get('/validators', (req: Request, res: Response) => {
            try {
                const validators = this.staking.getAllValidators();
                const formatted = validators.map(v => this.formatValidator(v));

                res.json({
                    success: true,
                    count: validators.length,
                    validators: formatted
                });
            } catch (error: any) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        /**
         * GET /validators/active
         * Get active validators only
         */
        this.router.get('/validators/active', (req: Request, res: Response) => {
            try {
                const activeAddresses = this.staking.getActiveValidators();
                const validators = activeAddresses.map(addr => {
                    const v = this.staking.getValidator(addr);
                    return v ? this.formatValidator(v) : null;
                }).filter(v => v !== null);

                res.json({
                    success: true,
                    count: validators.length,
                    validators
                });
            } catch (error: any) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        /**
         * GET /validators/:address
         * Get specific validator info
         */
        this.router.get('/validators/:address', (req: Request, res: Response) => {
            try {
                const validator = this.staking.getValidator(req.params.address);

                if (!validator) {
                    return res.status(404).json({
                        success: false,
                        error: 'Validator not found'
                    });
                }

                res.json({
                    success: true,
                    validator: this.formatValidator(validator)
                });
            } catch (error: any) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        /**
         * POST /validators/register
         * Register as a new validator
         */
        this.router.post('/validators/register', (req: Request, res: Response) => {
            try {
                const { address, stake, name, website, commission } = req.body;

                if (!address || !stake || !name) {
                    return res.status(400).json({
                        success: false,
                        error: 'address, stake, and name are required'
                    });
                }

                const result = this.staking.registerValidator(
                    address,
                    BigInt(stake),
                    name,
                    website || '',
                    commission || 500
                );

                if (result.success) {
                    res.json({ success: true, message: 'Validator registered successfully' });
                } else {
                    res.status(400).json({ success: false, error: result.error });
                }
            } catch (error: any) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        /**
         * POST /validators/add-stake
         * Add more stake as a validator
         */
        this.router.post('/validators/add-stake', (req: Request, res: Response) => {
            try {
                const { address, amount } = req.body;

                if (!address || !amount) {
                    return res.status(400).json({
                        success: false,
                        error: 'address and amount are required'
                    });
                }

                const result = this.staking.addStake(address, BigInt(amount));

                if (result.success) {
                    res.json({ success: true, message: 'Stake added successfully' });
                } else {
                    res.status(400).json({ success: false, error: result.error });
                }
            } catch (error: any) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        /**
         * POST /validators/unjail
         * Unjail a validator
         */
        this.router.post('/validators/unjail', (req: Request, res: Response) => {
            try {
                const { address } = req.body;

                if (!address) {
                    return res.status(400).json({
                        success: false,
                        error: 'address is required'
                    });
                }

                const result = this.staking.unjail(address);

                if (result.success) {
                    res.json({ success: true, message: 'Validator unjailed successfully' });
                } else {
                    res.status(400).json({ success: false, error: result.error });
                }
            } catch (error: any) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // ============ Delegation Endpoints ============

        /**
         * POST /delegate
         * Delegate stake to a validator
         */
        this.router.post('/delegate', (req: Request, res: Response) => {
            try {
                const { delegator, validator, amount } = req.body;

                if (!delegator || !validator || !amount) {
                    return res.status(400).json({
                        success: false,
                        error: 'delegator, validator, and amount are required'
                    });
                }

                const result = this.staking.delegate(delegator, validator, BigInt(amount));

                if (result.success) {
                    res.json({ success: true, message: 'Delegation successful' });
                } else {
                    res.status(400).json({ success: false, error: result.error });
                }
            } catch (error: any) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        /**
         * POST /undelegate
         * Undelegate stake from a validator
         */
        this.router.post('/undelegate', (req: Request, res: Response) => {
            try {
                const { delegator, validator, amount } = req.body;

                if (!delegator || !validator || !amount) {
                    return res.status(400).json({
                        success: false,
                        error: 'delegator, validator, and amount are required'
                    });
                }

                const result = this.staking.undelegate(delegator, validator, BigInt(amount));

                if (result.success) {
                    res.json({ success: true, message: 'Undelegation initiated' });
                } else {
                    res.status(400).json({ success: false, error: result.error });
                }
            } catch (error: any) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        /**
         * POST /withdraw
         * Withdraw unbonded tokens
         */
        this.router.post('/withdraw', (req: Request, res: Response) => {
            try {
                const { address } = req.body;

                if (!address) {
                    return res.status(400).json({
                        success: false,
                        error: 'address is required'
                    });
                }

                const result = this.staking.withdraw(address);

                if (result.success) {
                    res.json({
                        success: true,
                        message: 'Withdrawal successful',
                        amount: result.amount.toString()
                    });
                } else {
                    res.status(400).json({ success: false, error: result.error });
                }
            } catch (error: any) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        /**
         * POST /claim-rewards
         * Claim staking rewards
         */
        this.router.post('/claim-rewards', (req: Request, res: Response) => {
            try {
                const { delegator, validator } = req.body;

                if (!delegator || !validator) {
                    return res.status(400).json({
                        success: false,
                        error: 'delegator and validator are required'
                    });
                }

                const result = this.staking.claimRewards(delegator, validator);

                if (result.success) {
                    res.json({
                        success: true,
                        message: 'Rewards claimed successfully',
                        amount: result.amount.toString()
                    });
                } else {
                    res.status(400).json({ success: false, error: result.error });
                }
            } catch (error: any) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        /**
         * GET /delegations/:address
         * Get all delegations for an address
         */
        this.router.get('/delegations/:address', (req: Request, res: Response) => {
            try {
                const delegations = this.staking.getDelegations(req.params.address);

                res.json({
                    success: true,
                    count: delegations.length,
                    delegations: delegations.map(d => ({
                        validator: d.validator,
                        amount: d.amount.toString(),
                        pendingRewards: d.pendingRewards.toString()
                    }))
                });
            } catch (error: any) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        /**
         * GET /delegations/:delegator/:validator
         * Get specific delegation info
         */
        this.router.get('/delegations/:delegator/:validator', (req: Request, res: Response) => {
            try {
                const delegation = this.staking.getDelegation(
                    req.params.delegator,
                    req.params.validator
                );

                if (!delegation) {
                    return res.status(404).json({
                        success: false,
                        error: 'Delegation not found'
                    });
                }

                const pendingRewards = this.staking.getPendingRewards(
                    req.params.delegator,
                    req.params.validator
                );

                res.json({
                    success: true,
                    delegation: {
                        validator: delegation.validator,
                        amount: delegation.amount.toString(),
                        pendingRewards: pendingRewards.toString()
                    }
                });
            } catch (error: any) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        /**
         * GET /unbonding/:address
         * Get unbonding entries for an address
         */
        this.router.get('/unbonding/:address', (req: Request, res: Response) => {
            try {
                const unbonding = this.staking.getUnbonding(req.params.address);

                res.json({
                    success: true,
                    count: unbonding.length,
                    unbonding: unbonding.map(u => ({
                        amount: u.amount.toString(),
                        completionTime: u.completionTime,
                        validator: u.validator
                    }))
                });
            } catch (error: any) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        /**
         * GET /rewards/:delegator/:validator
         * Get pending rewards for a delegation
         */
        this.router.get('/rewards/:delegator/:validator', (req: Request, res: Response) => {
            try {
                const rewards = this.staking.getPendingRewards(
                    req.params.delegator,
                    req.params.validator
                );

                res.json({
                    success: true,
                    pendingRewards: rewards.toString()
                });
            } catch (error: any) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // ============ Network Stats ============

        /**
         * GET /stats
         * Get staking statistics
         */
        this.router.get('/stats', (req: Request, res: Response) => {
            try {
                const stats = this.staking.getStats();
                const epoch = this.staking.getCurrentEpoch();

                res.json({
                    success: true,
                    stats: {
                        totalStaked: stats.totalStaked.toString(),
                        totalValidators: stats.totalValidators,
                        activeValidators: stats.activeValidators,
                        currentEpoch: stats.currentEpoch,
                        rewardsPerBlock: stats.rewardsPerBlock.toString(),
                        epochInfo: {
                            number: epoch.number,
                            startBlock: epoch.startBlock,
                            endBlock: epoch.endBlock,
                            validatorCount: epoch.validators.length,
                            totalRewards: epoch.totalRewards.toString()
                        }
                    }
                });
            } catch (error: any) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        /**
         * GET /epoch
         * Get current epoch info
         */
        this.router.get('/epoch', (req: Request, res: Response) => {
            try {
                const epoch = this.staking.getCurrentEpoch();

                res.json({
                    success: true,
                    epoch: {
                        number: epoch.number,
                        startBlock: epoch.startBlock,
                        endBlock: epoch.endBlock,
                        validators: epoch.validators,
                        totalRewards: epoch.totalRewards.toString()
                    }
                });
            } catch (error: any) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
    }

    /**
     * Format validator for API response
     */
    private formatValidator(v: ValidatorInfo): any {
        return {
            address: v.address,
            stake: v.stake.toString(),
            totalDelegated: v.totalDelegated.toString(),
            totalStake: (v.stake + v.totalDelegated).toString(),
            commission: v.commission,
            commissionPercent: `${v.commission / 100}%`,
            isActive: v.isActive,
            isJailed: v.isJailed,
            jailedUntil: v.jailedUntil,
            blocksProduced: v.blocksProduced,
            blocksMissed: v.blocksMissed,
            uptime: v.blocksProduced > 0
                ? ((v.blocksProduced / (v.blocksProduced + v.blocksMissed)) * 100).toFixed(2) + '%'
                : 'N/A',
            lastBlockTime: v.lastBlockTime,
            name: v.name,
            website: v.website,
            rank: v.rank,
            isActiveValidator: this.staking.isActiveValidator(v.address)
        };
    }

    /**
     * Get the router
     */
    getRouter(): Router {
        return this.router;
    }
}

export default StakingAPI;
