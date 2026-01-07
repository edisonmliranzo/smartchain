import { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Clock, Percent, Coins, Zap, PieChart, DollarSign } from 'lucide-react';
import { api } from '../api';

export default function RewardsCalculator() {
    const [stakeAmount, setStakeAmount] = useState<string>('10000');
    const [stakeDuration, setStakeDuration] = useState<number>(365);
    const [validatorType, setValidatorType] = useState<'full' | 'delegator'>('delegator');
    const [stats, setStats] = useState<any>(null);
    const [compounding, setCompounding] = useState<boolean>(true);

    // Network parameters
    const baseAPY = 12.5;
    const validatorBonus = 5.0;
    const networkInflation = 3.2;
    const validatorCommission = 10;
    const minStake = 1000;
    const smartPrice = 2.45; // Mock USD price

    useEffect(() => {
        api.getChainStats().then(setStats).catch(console.error);
    }, []);

    const calculateRewards = () => {
        const stake = parseFloat(stakeAmount) || 0;
        if (stake < minStake) return null;

        const effectiveAPY = validatorType === 'full'
            ? baseAPY + validatorBonus
            : baseAPY * (1 - validatorCommission / 100);

        const dailyRate = effectiveAPY / 100 / 365;
        let totalRewards = 0;

        if (compounding) {
            // Compound daily
            totalRewards = stake * (Math.pow(1 + dailyRate, stakeDuration) - 1);
        } else {
            // Simple interest
            totalRewards = stake * (effectiveAPY / 100) * (stakeDuration / 365);
        }

        const dailyReward = totalRewards / stakeDuration;
        const monthlyReward = dailyReward * 30;
        const yearlyReward = dailyReward * 365;

        return {
            totalRewards,
            dailyReward,
            monthlyReward,
            yearlyReward,
            effectiveAPY,
            finalBalance: stake + totalRewards,
            usdValue: totalRewards * smartPrice
        };
    };

    const rewards = calculateRewards();

    const durationPresets = [
        { label: '30 Days', value: 30 },
        { label: '90 Days', value: 90 },
        { label: '180 Days', value: 180 },
        { label: '1 Year', value: 365 },
        { label: '2 Years', value: 730 },
    ];

    const stakePresets = [1000, 5000, 10000, 25000, 50000, 100000];

    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '8px 20px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '30px', marginBottom: '16px' }}>
                    <Calculator size={18} color="#10b981" />
                    <span style={{ color: '#10b981', fontWeight: 600, letterSpacing: '2px', fontSize: '0.8rem' }}>REWARDS CALCULATOR</span>
                </div>
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>
                    Block Rewards Calculator
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Estimate your staking and validation earnings on SmartChain
                </p>
            </div>

            {/* Network Stats Bar */}
            <div className="glass-card" style={{ padding: '20px', borderRadius: '20px', marginBottom: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', textAlign: 'center' }}>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Base APY</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{baseAPY}%</div>
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Validator Bonus</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#8b5cf6' }}>+{validatorBonus}%</div>
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Network Inflation</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f59e0b' }}>{networkInflation}%</div>
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>SMART Price</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#06b6d4' }}>${smartPrice}</div>
                    </div>
                    <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Block Height</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{(stats?.blockHeight || 0).toLocaleString()}</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                {/* Calculator Form */}
                <div className="glass-card" style={{ padding: '32px', borderRadius: '24px' }}>
                    <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Coins size={20} color="var(--primary)" />
                        Calculate Your Rewards
                    </h3>

                    {/* Validator Type */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '12px', fontWeight: 500 }}>Staking Type</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <button
                                onClick={() => setValidatorType('delegator')}
                                style={{
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: `2px solid ${validatorType === 'delegator' ? 'var(--primary)' : 'var(--glass-border)'}`,
                                    background: validatorType === 'delegator' ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                <div style={{ fontWeight: 600, marginBottom: '4px' }}>Delegator</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    {(baseAPY * (1 - validatorCommission / 100)).toFixed(2)}% APY
                                </div>
                            </button>
                            <button
                                onClick={() => setValidatorType('full')}
                                style={{
                                    padding: '16px',
                                    borderRadius: '12px',
                                    border: `2px solid ${validatorType === 'full' ? 'var(--primary)' : 'var(--glass-border)'}`,
                                    background: validatorType === 'full' ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                <div style={{ fontWeight: 600, marginBottom: '4px' }}>Full Validator</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    {(baseAPY + validatorBonus).toFixed(2)}% APY
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Stake Amount */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '12px', fontWeight: 500 }}>
                            Stake Amount (SMART)
                        </label>
                        <input
                            type="number"
                            value={stakeAmount}
                            onChange={(e) => setStakeAmount(e.target.value)}
                            placeholder="Enter stake amount"
                            style={{
                                width: '100%',
                                padding: '16px',
                                borderRadius: '12px',
                                border: '1px solid var(--glass-border)',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'var(--text-primary)',
                                fontSize: '1.2rem',
                                fontWeight: 600,
                                marginBottom: '12px'
                            }}
                        />
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {stakePresets.map(preset => (
                                <button
                                    key={preset}
                                    onClick={() => setStakeAmount(preset.toString())}
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: stakeAmount === preset.toString() ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    {preset.toLocaleString()}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Duration */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '12px', fontWeight: 500 }}>
                            Staking Duration: {stakeDuration} days
                        </label>
                        <input
                            type="range"
                            min="30"
                            max="730"
                            value={stakeDuration}
                            onChange={(e) => setStakeDuration(parseInt(e.target.value))}
                            style={{ width: '100%', accentColor: 'var(--primary)', marginBottom: '12px' }}
                        />
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {durationPresets.map(preset => (
                                <button
                                    key={preset.value}
                                    onClick={() => setStakeDuration(preset.value)}
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: stakeDuration === preset.value ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                        color: 'var(--text-primary)',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Compounding Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={compounding}
                                onChange={(e) => setCompounding(e.target.checked)}
                                style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
                            />
                            <span>Enable Daily Compounding</span>
                        </label>
                    </div>
                </div>

                {/* Results */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {rewards ? (
                        <>
                            {/* Main Result Card */}
                            <div className="glass-card" style={{
                                padding: '32px',
                                borderRadius: '24px',
                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
                                borderLeft: '4px solid #10b981'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                    <TrendingUp size={24} color="#10b981" />
                                    <span style={{ color: 'var(--text-muted)' }}>Estimated Rewards</span>
                                </div>
                                <div style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '8px' }}>
                                    {rewards.totalRewards.toLocaleString(undefined, { maximumFractionDigits: 2 })} SMART
                                </div>
                                <div style={{ fontSize: '1.2rem', color: '#10b981' }}>
                                    ≈ ${rewards.usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                                </div>
                            </div>

                            {/* Breakdown */}
                            <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                                <h4 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <PieChart size={18} color="var(--primary)" />
                                    Rewards Breakdown
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <RewardRow icon={<Clock size={18} />} label="Daily Reward" value={`${rewards.dailyReward.toFixed(4)} SMART`} subtext={`$${(rewards.dailyReward * smartPrice).toFixed(2)}`} />
                                    <RewardRow icon={<Zap size={18} />} label="Monthly Reward" value={`${rewards.monthlyReward.toFixed(2)} SMART`} subtext={`$${(rewards.monthlyReward * smartPrice).toFixed(2)}`} />
                                    <RewardRow icon={<TrendingUp size={18} />} label="Yearly Reward" value={`${rewards.yearlyReward.toFixed(2)} SMART`} subtext={`$${(rewards.yearlyReward * smartPrice).toFixed(2)}`} />
                                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                                        <RewardRow icon={<Percent size={18} />} label="Effective APY" value={`${rewards.effectiveAPY.toFixed(2)}%`} highlight />
                                    </div>
                                </div>
                            </div>

                            {/* Final Balance */}
                            <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                                <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <DollarSign size={18} color="#f59e0b" />
                                    After {stakeDuration} Days
                                </h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Final Balance</div>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                                            {rewards.finalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} SMART
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '12px 20px',
                                        borderRadius: '12px',
                                        background: 'rgba(16, 185, 129, 0.15)',
                                        color: '#10b981',
                                        fontWeight: 700,
                                        fontSize: '1.2rem'
                                    }}>
                                        +{((rewards.totalRewards / parseFloat(stakeAmount)) * 100).toFixed(2)}%
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="glass-card" style={{ padding: '40px', borderRadius: '24px', textAlign: 'center' }}>
                            <Calculator size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
                            <div style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>
                                Enter a stake amount to see rewards
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                Minimum stake: {minStake.toLocaleString()} SMART
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Info Section */}
            <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', marginTop: '32px' }}>
                <h3 style={{ marginBottom: '16px' }}>📋 How Rewards Work</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    <div>
                        <strong style={{ color: 'var(--text-primary)' }}>Delegators</strong>
                        <p style={{ marginTop: '8px' }}>Stake with existing validators and earn {(baseAPY * (1 - validatorCommission / 100)).toFixed(2)}% APY after the {validatorCommission}% validator commission.</p>
                    </div>
                    <div>
                        <strong style={{ color: 'var(--text-primary)' }}>Full Validators</strong>
                        <p style={{ marginTop: '8px' }}>Run your own node and earn {baseAPY + validatorBonus}% APY with the validator bonus. Requires minimum 100,000 SMART stake.</p>
                    </div>
                    <div>
                        <strong style={{ color: 'var(--text-primary)' }}>Compounding</strong>
                        <p style={{ marginTop: '8px' }}>With auto-compounding enabled, your rewards are automatically restaked daily to maximize returns.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RewardRow({ icon, label, value, subtext, highlight }: { icon: React.ReactNode; label: string; value: string; subtext?: string; highlight?: boolean }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ color: 'var(--primary)' }}>{icon}</div>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600, color: highlight ? '#10b981' : 'inherit', fontSize: highlight ? '1.2rem' : '1rem' }}>{value}</div>
                {subtext && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{subtext}</div>}
            </div>
        </div>
    );
}
