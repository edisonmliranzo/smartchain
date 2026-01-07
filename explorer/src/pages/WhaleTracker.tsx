import { useState, useEffect } from 'react';
import { Anchor, TrendingUp, TrendingDown, Eye, ArrowUpRight, ArrowDownRight, Activity, Filter, Bell, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface WhaleTransaction {
    hash: string;
    from: string;
    to: string;
    value: string;
    valueUSD: number;
    type: 'transfer' | 'stake' | 'unstake' | 'swap' | 'contract';
    timestamp: Date;
    fromLabel?: string;
    toLabel?: string;
}

interface WhaleWallet {
    address: string;
    label?: string;
    balance: string;
    balanceUSD: number;
    change24h: number;
    lastActive: Date;
    txCount: number;
    rank: number;
}

export default function WhaleTracker() {
    const [transactions, setTransactions] = useState<WhaleTransaction[]>([]);
    const [whales, setWhales] = useState<WhaleWallet[]>([]);
    const [minValue, setMinValue] = useState<number>(10000);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'live' | 'wallets'>('live');

    const smartPrice = 2.45;

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    async function fetchData() {
        try {
            // Mock whale transactions
            const mockTransactions: WhaleTransaction[] = [
                {
                    hash: '0xabc123...def456',
                    from: '0x1234...5678',
                    to: '0x8765...4321',
                    value: '125,000',
                    valueUSD: 306250,
                    type: 'transfer',
                    timestamp: new Date(Date.now() - 5 * 60 * 1000),
                    fromLabel: 'Whale #1',
                    toLabel: 'Binance Hot Wallet'
                },
                {
                    hash: '0xdef456...abc123',
                    from: '0x2345...6789',
                    to: '0x9876...5432',
                    value: '75,000',
                    valueUSD: 183750,
                    type: 'stake',
                    timestamp: new Date(Date.now() - 12 * 60 * 1000),
                    fromLabel: 'Unknown',
                    toLabel: 'Staking Contract'
                },
                {
                    hash: '0x789abc...123def',
                    from: '0x3456...7890',
                    to: '0x0987...6543',
                    value: '250,000',
                    valueUSD: 612500,
                    type: 'transfer',
                    timestamp: new Date(Date.now() - 25 * 60 * 1000),
                    fromLabel: 'Coinbase',
                    toLabel: 'Whale #3'
                },
                {
                    hash: '0xabc789...def123',
                    from: '0x4567...8901',
                    to: '0x1098...7654',
                    value: '50,000',
                    valueUSD: 122500,
                    type: 'swap',
                    timestamp: new Date(Date.now() - 45 * 60 * 1000),
                    fromLabel: 'DeFi Power User',
                    toLabel: 'SmartSwap'
                },
                {
                    hash: '0xdef123...abc789',
                    from: '0x5678...9012',
                    to: '0x2109...8765',
                    value: '500,000',
                    valueUSD: 1225000,
                    type: 'transfer',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                    fromLabel: 'Genesis Wallet',
                    toLabel: 'Unknown'
                },
                {
                    hash: '0x123def...789abc',
                    from: '0x6789...0123',
                    to: '0x3210...9876',
                    value: '180,000',
                    valueUSD: 441000,
                    type: 'unstake',
                    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
                    fromLabel: 'Staking Contract',
                    toLabel: 'Whale #5'
                }
            ];

            const mockWhales: WhaleWallet[] = [
                { address: '0x1234...5678', label: 'Genesis Wallet', balance: '15,250,000', balanceUSD: 37362500, change24h: -2.5, lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), txCount: 156, rank: 1 },
                { address: '0x2345...6789', label: 'Foundation Treasury', balance: '12,800,000', balanceUSD: 31360000, change24h: 0, lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000), txCount: 23, rank: 2 },
                { address: '0x3456...7890', label: 'Whale #1', balance: '8,450,000', balanceUSD: 20702500, change24h: 5.2, lastActive: new Date(Date.now() - 30 * 60 * 1000), txCount: 412, rank: 3 },
                { address: '0x4567...8901', label: 'Staking Pool', balance: '6,720,000', balanceUSD: 16464000, change24h: 1.8, lastActive: new Date(Date.now() - 5 * 60 * 1000), txCount: 8542, rank: 4 },
                { address: '0x5678...9012', label: 'Whale #2', balance: '4,150,000', balanceUSD: 10167500, change24h: -8.3, lastActive: new Date(Date.now() - 4 * 60 * 60 * 1000), txCount: 89, rank: 5 },
                { address: '0x6789...0123', label: 'Exchange Cold Storage', balance: '3,890,000', balanceUSD: 9530500, change24h: 12.4, lastActive: new Date(Date.now() - 12 * 60 * 60 * 1000), txCount: 15, rank: 6 },
                { address: '0x7890...1234', label: 'Unknown', balance: '2,560,000', balanceUSD: 6272000, change24h: 0.5, lastActive: new Date(Date.now() - 6 * 60 * 60 * 1000), txCount: 234, rank: 7 },
                { address: '0x8901...2345', label: 'Early Investor', balance: '2,120,000', balanceUSD: 5194000, change24h: -3.1, lastActive: new Date(Date.now() - 48 * 60 * 60 * 1000), txCount: 67, rank: 8 },
            ];

            setTransactions(mockTransactions);
            setWhales(mockWhales);
            setLoading(false);
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    }

    const filteredTransactions = transactions.filter(tx => {
        const value = parseFloat(tx.value.replace(/,/g, ''));
        return value >= minValue;
    });

    const totalWhaleBalance = whales.reduce((sum, w) => sum + parseFloat(w.balance.replace(/,/g, '')), 0);
    const avg24hChange = whales.reduce((sum, w) => sum + w.change24h, 0) / whales.length;

    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '8px 20px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '30px', marginBottom: '16px' }}>
                    <Anchor size={18} color="#3b82f6" />
                    <span style={{ color: '#3b82f6', fontWeight: 600, letterSpacing: '2px', fontSize: '0.8rem' }}>WHALE TRACKER</span>
                </div>
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>
                    Whale Tracker
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Monitor large wallet movements on SmartChain
                </p>
            </div>

            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <StatCard
                    icon={<Anchor size={24} />}
                    label="Tracked Whales"
                    value={whales.length.toString()}
                    subtext=">$1M holdings"
                    color="#3b82f6"
                />
                <StatCard
                    icon={<Activity size={24} />}
                    label="24h Transactions"
                    value={filteredTransactions.length.toString()}
                    subtext={`>${minValue.toLocaleString()} SMART`}
                    color="#8b5cf6"
                />
                <StatCard
                    icon={<TrendingUp size={24} />}
                    label="Total Whale Holdings"
                    value={`${(totalWhaleBalance / 1000000).toFixed(1)}M`}
                    subtext={`$${(totalWhaleBalance * smartPrice / 1000000).toFixed(1)}M USD`}
                    color="#10b981"
                />
                <StatCard
                    icon={avg24hChange >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                    label="Avg 24h Change"
                    value={`${avg24hChange >= 0 ? '+' : ''}${avg24hChange.toFixed(1)}%`}
                    subtext="Whale balance change"
                    color={avg24hChange >= 0 ? '#10b981' : '#ef4444'}
                />
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                <button
                    onClick={() => setActiveTab('live')}
                    style={{
                        padding: '12px 24px',
                        borderRadius: '12px',
                        border: 'none',
                        background: activeTab === 'live' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        color: 'var(--text-primary)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <Activity size={18} />
                    Live Transactions
                </button>
                <button
                    onClick={() => setActiveTab('wallets')}
                    style={{
                        padding: '12px 24px',
                        borderRadius: '12px',
                        border: 'none',
                        background: activeTab === 'wallets' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                        color: 'var(--text-primary)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <Eye size={18} />
                    Top Wallets
                </button>
            </div>

            {activeTab === 'live' ? (
                <>
                    {/* Filters */}
                    <div className="glass-card" style={{ padding: '20px', borderRadius: '20px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Filter size={18} color="var(--text-muted)" />
                                <span style={{ color: 'var(--text-muted)' }}>Min Value:</span>
                                {[10000, 50000, 100000, 500000].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => setMinValue(val)}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: minValue === val ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                            color: 'var(--text-primary)',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        {val >= 1000000 ? `${val / 1000000}M` : `${val / 1000}K`}
                                    </button>
                                ))}
                            </div>
                            <button
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--glass-border)',
                                    background: 'transparent',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <Bell size={16} />
                                Set Alerts
                            </button>
                        </div>
                    </div>

                    {/* Live Transactions */}
                    <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Activity size={20} color="var(--primary)" />
                            Recent Large Transactions
                            <span style={{
                                marginLeft: 'auto',
                                fontSize: '0.8rem',
                                color: 'var(--text-muted)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }}></span>
                                Live
                            </span>
                        </h3>

                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                Loading transactions...
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {filteredTransactions.map((tx, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            padding: '16px',
                                            borderRadius: '16px',
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid var(--glass-border)',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <TxTypeIcon type={tx.type} />
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{tx.value} SMART</span>
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                            (${tx.valueUSD.toLocaleString()})
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                        {formatTimeAgo(tx.timestamp)}
                                                    </div>
                                                </div>
                                            </div>
                                            <TxTypeBadge type={tx.type} />
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>From</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontFamily: 'monospace' }}>{tx.from}</span>
                                                    {tx.fromLabel && (
                                                        <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(124, 58, 237, 0.15)', color: '#a78bfa', fontSize: '0.8rem' }}>
                                                            {tx.fromLabel}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <ArrowUpRight size={20} color="var(--text-muted)" />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>To</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontFamily: 'monospace' }}>{tx.to}</span>
                                                    {tx.toLabel && (
                                                        <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '0.8rem' }}>
                                                            {tx.toLabel}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Link to={`/tx/${tx.hash}`} style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
                                                <ExternalLink size={18} />
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* Top Wallets */
                <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Anchor size={20} color="var(--primary)" />
                        Top Whale Wallets
                    </h3>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>Rank</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>Address</th>
                                    <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 500 }}>Balance</th>
                                    <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 500 }}>24h Change</th>
                                    <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 500 }}>Transactions</th>
                                    <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 500 }}>Last Active</th>
                                </tr>
                            </thead>
                            <tbody>
                                {whales.map((whale, i) => (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '16px 12px' }}>
                                            <span style={{
                                                width: '28px',
                                                height: '28px',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                borderRadius: '8px',
                                                background: i < 3 ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                fontWeight: 600
                                            }}>
                                                {whale.rank}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 12px' }}>
                                            <Link to={`/address/${whale.address}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                                                <div style={{ fontFamily: 'monospace' }}>{whale.address}</div>
                                                {whale.label && (
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--primary)', marginTop: '4px' }}>{whale.label}</div>
                                                )}
                                            </Link>
                                        </td>
                                        <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                            <div style={{ fontWeight: 600 }}>{whale.balance} SMART</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>${whale.balanceUSD.toLocaleString()}</div>
                                        </td>
                                        <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                color: whale.change24h >= 0 ? '#10b981' : '#ef4444'
                                            }}>
                                                {whale.change24h >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                                {Math.abs(whale.change24h).toFixed(1)}%
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                                            {whale.txCount.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '16px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                                            {formatTimeAgo(whale.lastActive)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, subtext, color }: { icon: React.ReactNode; label: string; value: string; subtext: string; color: string }) {
    return (
        <div className="glass-card" style={{ padding: '24px', borderRadius: '20px', borderLeft: `4px solid ${color}` }}>
            <div style={{ color, marginBottom: '12px' }}>{icon}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>{value}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{label}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>{subtext}</div>
        </div>
    );
}

function TxTypeIcon({ type }: { type: string }) {
    const colors: Record<string, string> = { transfer: '#3b82f6', stake: '#10b981', unstake: '#f59e0b', swap: '#8b5cf6', contract: '#06b6d4' };
    return (
        <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: `${colors[type]}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors[type]
        }}>
            <Activity size={20} />
        </div>
    );
}

function TxTypeBadge({ type }: { type: string }) {
    const colors: Record<string, string> = { transfer: '#3b82f6', stake: '#10b981', unstake: '#f59e0b', swap: '#8b5cf6', contract: '#06b6d4' };
    return (
        <div style={{
            padding: '4px 12px',
            borderRadius: '20px',
            background: `${colors[type]}20`,
            color: colors[type],
            fontSize: '0.8rem',
            fontWeight: 600,
            textTransform: 'capitalize'
        }}>
            {type}
        </div>
    );
}

function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
}
