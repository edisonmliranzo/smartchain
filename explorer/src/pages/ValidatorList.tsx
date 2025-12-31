import { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import {
    Shield, Award, Search,
    ExternalLink, Crown, ChevronDown, ChevronUp, Wallet
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Validator {
    address: string;
    stake: string;
    totalDelegated: string;
    totalStake: string;
    commission: number;
    commissionPercent: string;
    isActive: boolean;
    isJailed: boolean;
    jailedUntil: number;
    blocksProduced: number;
    blocksMissed: number;
    uptime: string;
    lastBlockTime: number;
    name: string;
    website: string;
    rank: number;
    isActiveValidator: boolean;
}

interface StakingStats {
    totalStaked: string;
    totalValidators: number;
    activeValidators: number;
    currentEpoch: number;
    rewardsPerBlock: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function ValidatorList() {
    const { account, connectWallet } = useWeb3();
    const [validators, setValidators] = useState<Validator[]>([]);
    const [stats, setStats] = useState<StakingStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'rank' | 'stake' | 'uptime' | 'commission'>('rank');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [selectedValidator, setSelectedValidator] = useState<string | null>(null);
    const [delegateAmount, setDelegateAmount] = useState('');
    const [isDelegating, setIsDelegating] = useState(false);

    useEffect(() => {
        fetchValidators();
        fetchStats();
        const interval = setInterval(fetchValidators, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchValidators = async () => {
        try {
            const res = await fetch(`${API_URL}/api/staking/validators`);
            const data = await res.json();
            if (data.success) {
                setValidators(data.validators);
            }
        } catch (error) {
            console.error('Failed to fetch validators:', error);
            // Mock data for demo
            setValidators([
                {
                    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                    stake: '500000000000000000000000',
                    totalDelegated: '250000000000000000000000',
                    totalStake: '750000000000000000000000',
                    commission: 500,
                    commissionPercent: '5%',
                    isActive: true,
                    isJailed: false,
                    jailedUntil: 0,
                    blocksProduced: 15420,
                    blocksMissed: 12,
                    uptime: '99.92%',
                    lastBlockTime: Date.now() - 5000,
                    name: 'Genesis Validator',
                    website: 'https://smartchain.io',
                    rank: 1,
                    isActiveValidator: true
                },
                {
                    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
                    stake: '300000000000000000000000',
                    totalDelegated: '180000000000000000000000',
                    totalStake: '480000000000000000000000',
                    commission: 1000,
                    commissionPercent: '10%',
                    isActive: true,
                    isJailed: false,
                    jailedUntil: 0,
                    blocksProduced: 14890,
                    blocksMissed: 45,
                    uptime: '99.70%',
                    lastBlockTime: Date.now() - 8000,
                    name: 'Community Node',
                    website: 'https://community-node.io',
                    rank: 2,
                    isActiveValidator: true
                },
                {
                    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
                    stake: '200000000000000000000000',
                    totalDelegated: '120000000000000000000000',
                    totalStake: '320000000000000000000000',
                    commission: 750,
                    commissionPercent: '7.5%',
                    isActive: true,
                    isJailed: false,
                    jailedUntil: 0,
                    blocksProduced: 14200,
                    blocksMissed: 88,
                    uptime: '99.38%',
                    lastBlockTime: Date.now() - 12000,
                    name: 'Stake Pool Alpha',
                    website: '',
                    rank: 3,
                    isActiveValidator: true
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_URL}/api/staking/stats`);
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            // Mock stats
            setStats({
                totalStaked: '5000000000000000000000000',
                totalValidators: 45,
                activeValidators: 21,
                currentEpoch: 128,
                rewardsPerBlock: '2000000000000000000'
            });
        }
    };

    const formatSMC = (wei: string) => {
        const num = parseFloat(wei) / 1e18;
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
        return num.toFixed(2);
    };

    const sortedValidators = [...validators]
        .filter(v =>
            v.name.toLowerCase().includes(search.toLowerCase()) ||
            v.address.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => {
            let aVal, bVal;
            switch (sortBy) {
                case 'rank':
                    aVal = a.rank;
                    bVal = b.rank;
                    break;
                case 'stake':
                    aVal = parseFloat(a.totalStake);
                    bVal = parseFloat(b.totalStake);
                    break;
                case 'uptime':
                    aVal = parseFloat(a.uptime);
                    bVal = parseFloat(b.uptime);
                    break;
                case 'commission':
                    aVal = a.commission;
                    bVal = b.commission;
                    break;
                default:
                    return 0;
            }
            return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        });

    const handleSort = (column: typeof sortBy) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    const handleDelegate = async (validatorAddress: string) => {
        if (!account || !delegateAmount) return;
        setIsDelegating(true);

        try {
            // In production, this would call the staking contract
            const res = await fetch(`${API_URL}/api/staking/delegate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    delegator: account,
                    validator: validatorAddress,
                    amount: (parseFloat(delegateAmount) * 1e18).toString()
                })
            });

            const data = await res.json();
            if (data.success) {
                alert(`Successfully delegated ${delegateAmount} SMC!`);
                setDelegateAmount('');
                setSelectedValidator(null);
                fetchValidators();
            } else {
                throw new Error(data.error);
            }
        } catch (error: any) {
            alert(`Failed to delegate: ${error.message}`);
        } finally {
            setIsDelegating(false);
        }
    };

    const SortIcon = ({ column }: { column: typeof sortBy }) => {
        if (sortBy !== column) return null;
        return sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
    };

    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
            {/* Hero Section */}
            <div className="glass-card" style={{
                padding: '48px',
                borderRadius: '30px',
                marginBottom: '40px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '24px' }}>
                        <Shield size={16} /> Proof of Authority + Staking
                    </div>
                    <h1 className="gradient-text" style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '16px' }}>
                        Network Validators
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 32px' }}>
                        Top 21 validators by stake secure the SmartChain network. Delegate your SMC to earn rewards.
                    </p>
                </div>

                {/* Background Decor */}
                <div style={{ position: 'absolute', top: '-50px', left: '-50px', opacity: 0.1, transform: 'rotate(45deg)' }}>
                    <Shield size={300} />
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
                <div className="glass-card stat-card" style={{ padding: '24px', borderRadius: '20px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Total Staked
                    </div>
                    <div className="gradient-text" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                        {stats ? formatSMC(stats.totalStaked) : '...'} SMC
                    </div>
                </div>
                <div className="glass-card stat-card" style={{ padding: '24px', borderRadius: '20px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Validators
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {stats?.activeValidators || '...'} / {stats?.totalValidators || '...'}
                    </div>
                </div>
                <div className="glass-card stat-card" style={{ padding: '24px', borderRadius: '20px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Current Epoch
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>
                        #{stats?.currentEpoch || '...'}
                    </div>
                </div>
                <div className="glass-card stat-card" style={{ padding: '24px', borderRadius: '20px', textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Block Reward
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>
                        {stats ? (parseFloat(stats.rewardsPerBlock) / 1e18).toFixed(0) : '...'} SMC
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="glass-card" style={{ padding: '20px 24px', borderRadius: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search validators by name or address..."
                        className="input glass"
                        style={{ width: '100%', paddingLeft: '40px' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => handleSort('rank')}
                        className={`btn btn-sm ${sortBy === 'rank' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                        Rank <SortIcon column="rank" />
                    </button>
                    <button
                        onClick={() => handleSort('stake')}
                        className={`btn btn-sm ${sortBy === 'stake' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                        Stake <SortIcon column="stake" />
                    </button>
                    <button
                        onClick={() => handleSort('uptime')}
                        className={`btn btn-sm ${sortBy === 'uptime' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                        Uptime <SortIcon column="uptime" />
                    </button>
                    <button
                        onClick={() => handleSort('commission')}
                        className={`btn btn-sm ${sortBy === 'commission' ? 'btn-primary' : 'btn-secondary'}`}
                    >
                        Fee <SortIcon column="commission" />
                    </button>
                </div>
            </div>

            {/* Validators List */}
            <div className="glass-card" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center' }}>
                        <div className="cube-3d" style={{ margin: '0 auto 24px', width: '60px', height: '60px' }}>
                            <div className="cube-face front"></div>
                            <div className="cube-face back"></div>
                            <div className="cube-face right"></div>
                            <div className="cube-face left"></div>
                            <div className="cube-face top"></div>
                            <div className="cube-face bottom"></div>
                        </div>
                        <p style={{ color: 'var(--text-secondary)' }}>Loading validators...</p>
                    </div>
                ) : (
                    <div>
                        {sortedValidators.map((validator, index) => (
                            <div
                                key={validator.address}
                                style={{
                                    padding: '20px 24px',
                                    borderBottom: index < sortedValidators.length - 1 ? '1px solid var(--glass-border)' : 'none',
                                    transition: 'background 0.2s',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setSelectedValidator(selectedValidator === validator.address ? null : validator.address)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    {/* Rank */}
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 800,
                                        fontSize: '1.2rem',
                                        background: validator.rank === 1
                                            ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                                            : validator.rank === 2
                                                ? 'linear-gradient(135deg, #94a3b8, #64748b)'
                                                : validator.rank === 3
                                                    ? 'linear-gradient(135deg, #cd7f32, #b8860b)'
                                                    : 'var(--bg-tertiary)',
                                        color: validator.rank <= 3 ? 'white' : 'var(--text-primary)'
                                    }}>
                                        {validator.rank <= 3 ? <Crown size={20} /> : validator.rank}
                                    </div>

                                    {/* Validator Info */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{validator.name}</span>
                                            {validator.isActiveValidator && (
                                                <span style={{
                                                    background: 'rgba(16, 185, 129, 0.1)',
                                                    color: 'var(--success)',
                                                    padding: '2px 8px',
                                                    borderRadius: '10px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 600
                                                }}>
                                                    ACTIVE
                                                </span>
                                            )}
                                            {validator.isJailed && (
                                                <span style={{
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    color: 'var(--error)',
                                                    padding: '2px 8px',
                                                    borderRadius: '10px',
                                                    fontSize: '0.7rem',
                                                    fontWeight: 600
                                                }}>
                                                    JAILED
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                                            {validator.address.slice(0, 10)}...{validator.address.slice(-8)}
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', textAlign: 'right' }}>
                                        <div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '2px' }}>Total Stake</div>
                                            <div style={{ fontWeight: 700 }}>{formatSMC(validator.totalStake)}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '2px' }}>Delegated</div>
                                            <div style={{ fontWeight: 700 }}>{formatSMC(validator.totalDelegated)}</div>
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '2px' }}>Uptime</div>
                                            <div style={{ fontWeight: 700, color: parseFloat(validator.uptime) > 99 ? 'var(--success)' : 'var(--warning)' }}>
                                                {validator.uptime}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '2px' }}>Commission</div>
                                            <div style={{ fontWeight: 700 }}>{validator.commissionPercent}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Delegation Section */}
                                {selectedValidator === validator.address && (
                                    <div style={{
                                        marginTop: '20px',
                                        padding: '20px',
                                        background: 'var(--bg-tertiary)',
                                        borderRadius: '16px',
                                        animation: 'fadeIn 0.3s ease'
                                    }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '20px' }}>
                                            <div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Self Stake</div>
                                                <div style={{ fontWeight: 700 }}>{formatSMC(validator.stake)} SMC</div>
                                            </div>
                                            <div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Blocks Produced</div>
                                                <div style={{ fontWeight: 700 }}>{validator.blocksProduced.toLocaleString()}</div>
                                            </div>
                                            <div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Blocks Missed</div>
                                                <div style={{ fontWeight: 700, color: validator.blocksMissed > 0 ? 'var(--warning)' : 'var(--success)' }}>
                                                    {validator.blocksMissed}
                                                </div>
                                            </div>
                                        </div>

                                        {account ? (
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <input
                                                    type="number"
                                                    value={delegateAmount}
                                                    onChange={(e) => setDelegateAmount(e.target.value)}
                                                    placeholder="Amount to delegate"
                                                    className="input glass"
                                                    style={{ flex: 1 }}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelegate(validator.address); }}
                                                    className="btn btn-primary"
                                                    disabled={isDelegating || !delegateAmount}
                                                >
                                                    {isDelegating ? 'Delegating...' : 'Delegate'}
                                                </button>
                                                {validator.website && (
                                                    <a
                                                        href={validator.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="btn btn-secondary"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <ExternalLink size={16} />
                                                    </a>
                                                )}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); connectWallet(); }}
                                                className="btn btn-primary"
                                            >
                                                <Wallet size={16} /> Connect Wallet to Delegate
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Become a Validator CTA */}
            <div className="glass-card" style={{
                padding: '40px',
                borderRadius: '24px',
                marginTop: '40px',
                textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.2)'
            }}>
                <Award size={48} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
                <h2 style={{ marginBottom: '12px' }}>Become a Validator</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
                    Stake 100,000+ SMC and run a node to become a validator. Earn block rewards and help secure the network.
                </p>
                <Link to="/docs/validators" className="btn btn-primary shine-effect">
                    <Shield size={18} /> Learn More
                </Link>
            </div>
        </div>
    );
}
