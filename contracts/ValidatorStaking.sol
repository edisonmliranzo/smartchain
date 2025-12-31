// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SmartChain Validator Staking Contract
 * @notice Stake SMC tokens to become a validator and earn rewards
 * @dev Public staking with validator election, rewards, and slashing
 */
contract ValidatorStaking {
    // ============ Constants ============
    uint256 public constant MIN_STAKE = 100_000 * 1e18;     // 100,000 SMC minimum stake
    uint256 public constant MAX_VALIDATORS = 21;             // Maximum active validators
    uint256 public constant EPOCH_BLOCKS = 200;              // Blocks per epoch
    uint256 public constant UNBONDING_PERIOD = 7 days;       // Lock period after unstake
    uint256 public constant SLASH_PERCENT_DOWNTIME = 1;      // 1% slash for downtime
    uint256 public constant SLASH_PERCENT_DOUBLE_SIGN = 5;   // 5% slash for double signing

    // ============ Structs ============
    struct Validator {
        address addr;
        uint256 stake;
        uint256 totalDelegated;
        uint256 commission;          // Commission rate in basis points (100 = 1%)
        bool isActive;
        bool isJailed;
        uint256 jailedUntil;
        uint256 blocksProduced;
        uint256 blocksMissed;
        uint256 lastBlockTime;
        string name;
        string website;
    }

    struct Delegation {
        uint256 amount;
        uint256 rewardDebt;
        uint256 pendingRewards;
    }

    struct UnbondingEntry {
        uint256 amount;
        uint256 completionTime;
    }

    // ============ State Variables ============
    address public owner;
    uint256 public totalStaked;
    uint256 public currentEpoch;
    uint256 public epochStartBlock;
    uint256 public rewardsPerBlock;
    uint256 public accRewardsPerShare;
    uint256 public lastRewardBlock;
    
    // Validator data
    address[] public validatorList;
    mapping(address => Validator) public validators;
    mapping(address => bool) public isValidator;
    
    // Active validator set (top 21 by stake)
    address[] public activeValidators;
    mapping(address => bool) public isActiveValidator;
    
    // Delegations
    mapping(address => mapping(address => Delegation)) public delegations; // delegator => validator => delegation
    mapping(address => UnbondingEntry[]) public unbondingQueue;
    
    // Slashing
    mapping(bytes32 => bool) public slashingEvents; // evidence hash => processed

    // ============ Events ============
    event ValidatorRegistered(address indexed validator, uint256 stake, string name);
    event ValidatorUpdated(address indexed validator, uint256 newStake);
    event Staked(address indexed delegator, address indexed validator, uint256 amount);
    event Unstaked(address indexed delegator, address indexed validator, uint256 amount);
    event Withdrawn(address indexed delegator, uint256 amount);
    event RewardsClaimed(address indexed delegator, address indexed validator, uint256 amount);
    event EpochChanged(uint256 indexed epoch, address[] activeValidators);
    event ValidatorSlashed(address indexed validator, uint256 amount, string reason);
    event ValidatorJailed(address indexed validator, uint256 until);
    event ValidatorUnjailed(address indexed validator);
    event BlockProduced(address indexed validator, uint256 blockNumber);

    // ============ Modifiers ============
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyValidator() {
        require(isValidator[msg.sender], "Not a validator");
        _;
    }

    modifier onlyActiveValidator() {
        require(isActiveValidator[msg.sender], "Not an active validator");
        _;
    }

    // ============ Constructor ============
    constructor() {
        owner = msg.sender;
        rewardsPerBlock = 2 * 1e18; // 2 SMC per block
        lastRewardBlock = block.number;
        epochStartBlock = block.number;
    }

    // ============ Validator Registration ============
    
    /**
     * @notice Register as a validator with initial stake
     * @param name Validator name
     * @param website Validator website
     * @param commission Commission rate in basis points (max 2000 = 20%)
     */
    function registerValidator(
        string calldata name,
        string calldata website,
        uint256 commission
    ) external payable {
        require(!isValidator[msg.sender], "Already registered");
        require(msg.value >= MIN_STAKE, "Stake below minimum");
        require(commission <= 2000, "Commission too high"); // Max 20%
        require(bytes(name).length > 0, "Name required");

        validators[msg.sender] = Validator({
            addr: msg.sender,
            stake: msg.value,
            totalDelegated: 0,
            commission: commission,
            isActive: true,
            isJailed: false,
            jailedUntil: 0,
            blocksProduced: 0,
            blocksMissed: 0,
            lastBlockTime: block.timestamp,
            name: name,
            website: website
        });

        isValidator[msg.sender] = true;
        validatorList.push(msg.sender);
        totalStaked += msg.value;

        emit ValidatorRegistered(msg.sender, msg.value, name);
        
        _updateActiveValidators();
    }

    /**
     * @notice Add more stake as a validator
     */
    function addStake() external payable onlyValidator {
        require(msg.value > 0, "Amount must be > 0");
        require(!validators[msg.sender].isJailed, "Validator is jailed");

        validators[msg.sender].stake += msg.value;
        totalStaked += msg.value;

        emit ValidatorUpdated(msg.sender, validators[msg.sender].stake);
        
        _updateActiveValidators();
    }

    // ============ Delegation ============

    /**
     * @notice Delegate stake to a validator
     * @param validator Address of the validator to delegate to
     */
    function delegate(address validator) external payable {
        require(isValidator[validator], "Not a validator");
        require(!validators[validator].isJailed, "Validator is jailed");
        require(msg.value > 0, "Amount must be > 0");

        _updateRewards();
        
        Delegation storage del = delegations[msg.sender][validator];
        
        // Claim pending rewards first
        if (del.amount > 0) {
            uint256 pending = _calculatePendingRewards(msg.sender, validator);
            if (pending > 0) {
                del.pendingRewards += pending;
            }
        }

        del.amount += msg.value;
        del.rewardDebt = (del.amount * accRewardsPerShare) / 1e12;
        
        validators[validator].totalDelegated += msg.value;
        totalStaked += msg.value;

        emit Staked(msg.sender, validator, msg.value);
        
        _updateActiveValidators();
    }

    /**
     * @notice Request to unstake from a validator
     * @param validator Address of the validator
     * @param amount Amount to unstake
     */
    function undelegate(address validator, uint256 amount) external {
        Delegation storage del = delegations[msg.sender][validator];
        require(del.amount >= amount, "Insufficient delegation");
        require(amount > 0, "Amount must be > 0");

        _updateRewards();
        
        // Claim pending rewards
        uint256 pending = _calculatePendingRewards(msg.sender, validator);
        if (pending > 0) {
            del.pendingRewards += pending;
        }

        del.amount -= amount;
        del.rewardDebt = (del.amount * accRewardsPerShare) / 1e12;
        
        validators[validator].totalDelegated -= amount;
        totalStaked -= amount;

        // Add to unbonding queue
        unbondingQueue[msg.sender].push(UnbondingEntry({
            amount: amount,
            completionTime: block.timestamp + UNBONDING_PERIOD
        }));

        emit Unstaked(msg.sender, validator, amount);
        
        _updateActiveValidators();
    }

    /**
     * @notice Withdraw unbonded tokens
     */
    function withdraw() external {
        UnbondingEntry[] storage queue = unbondingQueue[msg.sender];
        uint256 totalWithdraw = 0;
        uint256 i = 0;

        while (i < queue.length) {
            if (queue[i].completionTime <= block.timestamp) {
                totalWithdraw += queue[i].amount;
                // Remove by swapping with last element
                queue[i] = queue[queue.length - 1];
                queue.pop();
            } else {
                i++;
            }
        }

        require(totalWithdraw > 0, "Nothing to withdraw");
        
        payable(msg.sender).transfer(totalWithdraw);
        emit Withdrawn(msg.sender, totalWithdraw);
    }

    /**
     * @notice Claim staking rewards
     * @param validator Address of the validator
     */
    function claimRewards(address validator) external {
        _updateRewards();
        
        Delegation storage del = delegations[msg.sender][validator];
        uint256 pending = _calculatePendingRewards(msg.sender, validator) + del.pendingRewards;
        
        require(pending > 0, "No rewards to claim");
        
        del.pendingRewards = 0;
        del.rewardDebt = (del.amount * accRewardsPerShare) / 1e12;
        
        payable(msg.sender).transfer(pending);
        emit RewardsClaimed(msg.sender, validator, pending);
    }

    // ============ Validator Election ============

    /**
     * @notice Update the active validator set based on stake
     */
    function _updateActiveValidators() internal {
        // Create array of eligible validators
        address[] memory eligible = new address[](validatorList.length);
        uint256[] memory stakes = new uint256[](validatorList.length);
        uint256 count = 0;

        for (uint256 i = 0; i < validatorList.length; i++) {
            address v = validatorList[i];
            if (validators[v].isActive && !validators[v].isJailed) {
                eligible[count] = v;
                stakes[count] = validators[v].stake + validators[v].totalDelegated;
                count++;
            }
        }

        // Sort by stake (descending) - simple bubble sort for small arrays
        for (uint256 i = 0; i < count; i++) {
            for (uint256 j = i + 1; j < count; j++) {
                if (stakes[j] > stakes[i]) {
                    (stakes[i], stakes[j]) = (stakes[j], stakes[i]);
                    (eligible[i], eligible[j]) = (eligible[j], eligible[i]);
                }
            }
        }

        // Clear current active set
        for (uint256 i = 0; i < activeValidators.length; i++) {
            isActiveValidator[activeValidators[i]] = false;
        }
        delete activeValidators;

        // Set new active validators (top MAX_VALIDATORS)
        uint256 activeCount = count < MAX_VALIDATORS ? count : MAX_VALIDATORS;
        for (uint256 i = 0; i < activeCount; i++) {
            activeValidators.push(eligible[i]);
            isActiveValidator[eligible[i]] = true;
        }
    }

    /**
     * @notice Get current active validators
     */
    function getActiveValidators() external view returns (address[] memory) {
        return activeValidators;
    }

    /**
     * @notice Check if address is in active validator set
     */
    function isActive(address validator) external view returns (bool) {
        return isActiveValidator[validator];
    }

    // ============ Rewards ============

    /**
     * @notice Update reward calculations
     */
    function _updateRewards() internal {
        if (block.number <= lastRewardBlock) return;
        if (totalStaked == 0) {
            lastRewardBlock = block.number;
            return;
        }

        uint256 blocks = block.number - lastRewardBlock;
        uint256 reward = blocks * rewardsPerBlock;
        accRewardsPerShare += (reward * 1e12) / totalStaked;
        lastRewardBlock = block.number;
    }

    /**
     * @notice Calculate pending rewards for a delegation
     */
    function _calculatePendingRewards(address delegator, address validator) internal view returns (uint256) {
        Delegation storage del = delegations[delegator][validator];
        if (del.amount == 0) return 0;
        
        uint256 accRewards = accRewardsPerShare;
        if (block.number > lastRewardBlock && totalStaked > 0) {
            uint256 blocks = block.number - lastRewardBlock;
            uint256 reward = blocks * rewardsPerBlock;
            accRewards += (reward * 1e12) / totalStaked;
        }
        
        return (del.amount * accRewards) / 1e12 - del.rewardDebt;
    }

    /**
     * @notice Get pending rewards for a delegation
     */
    function pendingRewards(address delegator, address validator) external view returns (uint256) {
        Delegation storage del = delegations[delegator][validator];
        return _calculatePendingRewards(delegator, validator) + del.pendingRewards;
    }

    /**
     * @notice Record block production (called by chain)
     */
    function recordBlockProduced(address validator) external onlyOwner {
        require(isActiveValidator[validator], "Not active validator");
        validators[validator].blocksProduced++;
        validators[validator].lastBlockTime = block.timestamp;
        emit BlockProduced(validator, block.number);
    }

    // ============ Slashing ============

    /**
     * @notice Slash a validator for downtime
     * @param validator Address of the validator
     * @param missedBlocks Number of consecutive missed blocks
     */
    function slashForDowntime(address validator, uint256 missedBlocks) external onlyOwner {
        require(isValidator[validator], "Not a validator");
        require(missedBlocks >= 10, "Not enough missed blocks");

        bytes32 evidenceHash = keccak256(abi.encodePacked(validator, "downtime", block.number));
        require(!slashingEvents[evidenceHash], "Already processed");
        slashingEvents[evidenceHash] = true;

        uint256 slashAmount = (validators[validator].stake * SLASH_PERCENT_DOWNTIME) / 100;
        validators[validator].stake -= slashAmount;
        validators[validator].blocksMissed += missedBlocks;
        totalStaked -= slashAmount;

        // Jail the validator
        validators[validator].isJailed = true;
        validators[validator].jailedUntil = block.timestamp + 1 days;

        emit ValidatorSlashed(validator, slashAmount, "downtime");
        emit ValidatorJailed(validator, validators[validator].jailedUntil);
        
        _updateActiveValidators();
    }

    /**
     * @notice Slash a validator for double signing
     * @param validator Address of the validator
     * @param evidenceHash Hash of the evidence
     */
    function slashForDoubleSigning(address validator, bytes32 evidenceHash) external onlyOwner {
        require(isValidator[validator], "Not a validator");
        require(!slashingEvents[evidenceHash], "Already processed");
        slashingEvents[evidenceHash] = true;

        uint256 slashAmount = (validators[validator].stake * SLASH_PERCENT_DOUBLE_SIGN) / 100;
        validators[validator].stake -= slashAmount;
        totalStaked -= slashAmount;

        // Jail the validator for longer
        validators[validator].isJailed = true;
        validators[validator].jailedUntil = block.timestamp + 7 days;

        emit ValidatorSlashed(validator, slashAmount, "double_signing");
        emit ValidatorJailed(validator, validators[validator].jailedUntil);
        
        _updateActiveValidators();
    }

    /**
     * @notice Unjail a validator after jail period
     */
    function unjail() external onlyValidator {
        require(validators[msg.sender].isJailed, "Not jailed");
        require(block.timestamp >= validators[msg.sender].jailedUntil, "Jail period not over");
        require(validators[msg.sender].stake >= MIN_STAKE, "Stake below minimum");

        validators[msg.sender].isJailed = false;
        validators[msg.sender].jailedUntil = 0;

        emit ValidatorUnjailed(msg.sender);
        
        _updateActiveValidators();
    }

    // ============ Epoch Management ============

    /**
     * @notice Start a new epoch
     */
    function newEpoch() external onlyOwner {
        require(block.number >= epochStartBlock + EPOCH_BLOCKS, "Epoch not complete");

        currentEpoch++;
        epochStartBlock = block.number;

        _updateActiveValidators();

        emit EpochChanged(currentEpoch, activeValidators);
    }

    // ============ View Functions ============

    /**
     * @notice Get validator info
     */
    function getValidator(address validator) external view returns (
        uint256 stake,
        uint256 totalDelegated,
        uint256 commission,
        bool isActive_,
        bool isJailed,
        uint256 blocksProduced,
        string memory name
    ) {
        Validator storage v = validators[validator];
        return (
            v.stake,
            v.totalDelegated,
            v.commission,
            v.isActive,
            v.isJailed,
            v.blocksProduced,
            v.name
        );
    }

    /**
     * @notice Get all validators
     */
    function getAllValidators() external view returns (address[] memory) {
        return validatorList;
    }

    /**
     * @notice Get validator count
     */
    function validatorCount() external view returns (uint256) {
        return validatorList.length;
    }

    /**
     * @notice Get delegation info
     */
    function getDelegation(address delegator, address validator) external view returns (
        uint256 amount,
        uint256 pending
    ) {
        Delegation storage del = delegations[delegator][validator];
        return (del.amount, _calculatePendingRewards(delegator, validator) + del.pendingRewards);
    }

    /**
     * @notice Get unbonding entries
     */
    function getUnbonding(address delegator) external view returns (
        uint256[] memory amounts,
        uint256[] memory completionTimes
    ) {
        UnbondingEntry[] storage queue = unbondingQueue[delegator];
        amounts = new uint256[](queue.length);
        completionTimes = new uint256[](queue.length);
        
        for (uint256 i = 0; i < queue.length; i++) {
            amounts[i] = queue[i].amount;
            completionTimes[i] = queue[i].completionTime;
        }
    }

    // ============ Admin Functions ============

    /**
     * @notice Update rewards per block
     */
    function setRewardsPerBlock(uint256 _rewardsPerBlock) external onlyOwner {
        _updateRewards();
        rewardsPerBlock = _rewardsPerBlock;
    }

    /**
     * @notice Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }

    /**
     * @notice Deposit rewards (for funding the contract)
     */
    receive() external payable {}
}
