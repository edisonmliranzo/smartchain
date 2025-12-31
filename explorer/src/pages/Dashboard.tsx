import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api';
import {
    Blocks,
    Receipt,
    Users,
    Clock,
    TrendingUp,
    ArrowRight,
    Activity,
    Shield,
    Zap,
    Trophy
} from 'lucide-react';
import MempoolVisualizer from '../components/MempoolVisualizer';

export default function Dashboard() {
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['chainStats'],
        queryFn: api.getChainStats,
        refetchInterval: 3000,
    });

    const { data: blocksData, isLoading: blocksLoading } = useQuery({
        queryKey: ['blocks'],
        queryFn: () => api.getBlocks(1, 6),
        refetchInterval: 3000,
    });

    const { data: txsData, isLoading: txsLoading } = useQuery({
        queryKey: ['transactions'],
        queryFn: () => api.getTransactions(1, 6),
        refetchInterval: 3000,
    });

    const { data: richList, isLoading: richListLoading } = useQuery({
        queryKey: ['richList'],
        queryFn: () => api.getRichList(5),
        refetchInterval: 10000,
    });

    const { data: chainInfo } = useQuery({
        queryKey: ['chainInfo'],
        queryFn: api.getChainInfo,
    });

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat().format(num);
    };

    const formatTimeAgo = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    const truncateHash = (hash: string, chars = 6) => {
        return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
    };

    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
            {/* Hero & Mempool Grid */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '32px',
                marginBottom: '48px',
                alignItems: 'stretch'
            }}>
                {/* Hero Section */}
                <div className="glass-card" style={{
                    flex: '1 1 500px',
                    minWidth: 'min(100%, 500px)',
                    textAlign: 'left',
                    padding: 'clamp(24px, 5vw, 60px) clamp(20px, 4vw, 40px)',
                    borderRadius: '30px',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 'auto'
                }}>
                    <div style={{ flex: 1, zIndex: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <span className="pulse-active"></span>
                            <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem', letterSpacing: '1px' }}>
                                NETWORK OPERATIONAL
                            </span>
                        </div>
                        <h1 className="gradient-text" style={{
                            fontSize: 'clamp(1.8rem, 5vw, 3.5rem)',
                            fontWeight: 900,
                            marginBottom: '16px',
                            letterSpacing: '-1px'
                        }}>
                            Explore SmartChain
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '500px', marginBottom: '32px' }}>
                            A high-performance, EVM-compatible blockchain with Proof of Authority consensus. Built for scale.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            <Link to="/faucet" className="btn btn-primary shine-effect">
                                <Zap size={18} /> Get Free Tokens
                            </Link>
                            <div className="badge glass" style={{ padding: '8px 14px', borderRadius: '12px', border: '1px solid var(--glass-border)', fontSize: '0.85rem' }}>
                                <Shield size={14} style={{ marginRight: '6px', color: 'var(--secondary-light)' }} />
                                Chain ID: {chainInfo?.chainId || 1337}
                            </div>
                        </div>
                    </div>

                    {/* 3D Block Visualizer - Hidden on mobile for cleaner look */}
                    <div className="desktop-only" style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', perspective: '1000px' }}>
                        {!blocksLoading && blocksData?.blocks ? (
                            <div className="scene-3d" style={{ transform: 'scale(0.9)' }}>
                                {blocksData.blocks.slice(0, 4).map((block: any, i: number) => (
                                    <Link to={`/block/${block.number}`} key={block.number} className="cube" style={{ animationDelay: `${i * 0.1}s` }}>
                                        <div className="cube-face cube-face-front">#{block.number}</div>
                                        <div className="cube-face cube-face-back"></div>
                                        <div className="cube-face cube-face-right"></div>
                                        <div className="cube-face cube-face-left"></div>
                                        <div className="cube-face cube-face-top">{block.transactions?.length ?? block.transactionCount ?? 0} txs</div>
                                        <div className="cube-face cube-face-bottom"></div>
                                    </Link>
                                ))}
                            </div>
                        ) : null}
                    </div>
                </div>

                {/* Mempool Visualizer */}
                <MempoolVisualizer />
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <StatCard
                    icon={<Activity size={24} />}
                    label="Latest Block"
                    value={stats?.totalBlocks ? `#${formatNumber(stats.totalBlocks - 1)}` : '#0'}
                    loading={statsLoading}
                    change="+1 every 3s"
                />
                <StatCard
                    icon={<Users size={24} />}
                    label="Total Accounts"
                    value={stats?.totalAccounts ? formatNumber(stats.totalAccounts) : '0'}
                    loading={statsLoading}
                />
                <StatCard
                    icon={<TrendingUp size={24} />}
                    label="Circulating Supply"
                    value={(stats?.totalSupplyFormatted?.split('.')[0] || '0') + ' SMC'}
                    loading={statsLoading}
                />
                <StatCard
                    icon={<Clock size={24} />}
                    label="Avg Block Time"
                    value={stats?.averageBlockTime ? `${(stats.averageBlockTime / 1000).toFixed(1)}s` : '3.0s'}
                    loading={statsLoading}
                />
            </div>

            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '24px',
                marginBottom: '32px'
            }}>
                {/* Latest Blocks */}
                <div className="glass-card" style={{ borderRadius: '24px', flex: '1 1 350px', minWidth: 'min(100%, 350px)' }}>
                    <div className="card-header">
                        <h2 className="card-title">
                            <Blocks size={20} />
                            Latest Blocks
                        </h2>
                        <Link to="/blocks" className="btn btn-secondary glass" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>

                    {blocksLoading ? (
                        <div className="loader"><div className="spinner" /></div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {blocksData?.blocks?.map((block: any) => (
                                <Link
                                    to={`/block/${block.number}`}
                                    key={block.number}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '16px',
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        borderRadius: '16px',
                                        border: '1px solid var(--glass-border)',
                                        transition: 'all 0.2s'
                                    }}
                                    className="shine-effect"
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{
                                            width: '56px',
                                            height: '56px',
                                            background: 'var(--gradient-primary)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                                        }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.6rem', opacity: 0.8, fontWeight: 600 }}>BK</div>
                                                <div style={{ fontWeight: 800, fontSize: '1rem' }}>{block.number}</div>
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, color: 'white' }}>
                                                {formatTimeAgo(block.timestamp)}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {block.transactionCount} transactions
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Validator</div>
                                        <div className="address" style={{ fontSize: '0.8rem' }}>
                                            {truncateHash(block.miner, 6)}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                {/* Latest Transactions */}
                <div className="glass-card" style={{ borderRadius: '24px', flex: '1 1 350px', minWidth: 'min(100%, 350px)' }}>
                    <div className="card-header">
                        <h2 className="card-title">
                            <Receipt size={20} />
                            Live Activity
                        </h2>
                        <Link to="/transactions" className="btn btn-secondary glass" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>

                    {txsLoading ? (
                        <div className="loader"><div className="spinner" /></div>
                    ) : txsData?.transactions?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {txsData.transactions.map((tx: any) => (
                                <Link
                                    to={`/tx/${tx.hash}`}
                                    key={tx.hash}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '16px',
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        borderRadius: '16px',
                                        border: '1px solid var(--glass-border)',
                                        transition: 'all 0.2s'
                                    }}
                                    className="shine-effect"
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{
                                            width: '56px',
                                            height: '56px',
                                            background: 'rgba(6, 182, 212, 0.1)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: '1px solid rgba(6, 182, 212, 0.2)'
                                        }}>
                                            <Receipt size={24} style={{ color: 'var(--secondary-light)' }} />
                                        </div>
                                        <div>
                                            <div className="hash" style={{ fontWeight: 600, color: 'white' }}>
                                                {truncateHash(tx.hash, 8)}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                {tx.from.slice(0, 6)}... → {tx.to ? tx.to.slice(0, 6) : 'Deploy'}...
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{
                                            fontFamily: 'var(--font-mono)',
                                            fontWeight: 700,
                                            color: 'var(--success)',
                                            fontSize: '1rem',
                                        }}>
                                            {tx.valueFormatted.split('.')[0]} SMC
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            {tx.timestamp ? formatTimeAgo(tx.timestamp) : 'Just now'}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                            <div style={{ marginBottom: '16px', opacity: 0.3 }}><Activity size={48} /></div>
                            No transactions yet. <br />Use the faucet to trigger activity!
                        </div>
                    )}
                </div>
            </div>

            {/* Rich List Section */}
            <div className="glass-card" style={{ borderRadius: '24px' }}>
                <div className="card-header">
                    <h2 className="card-title">
                        <Trophy size={20} style={{ color: 'var(--accent)' }} />
                        SmartChain Titans (Top Holders)
                    </h2>
                </div>

                {richListLoading ? (
                    <div className="loader"><div className="spinner" /></div>
                ) : (
                    <div className="table-container">
                        <table className="table" style={{ border: 'none' }}>
                            <thead>
                                <tr>
                                    <th style={{ background: 'transparent', width: '80px' }}>Rank</th>
                                    <th style={{ background: 'transparent' }}>Holder Address</th>
                                    <th style={{ background: 'transparent', textAlign: 'right' }}>Balance</th>
                                    <th style={{ background: 'transparent', textAlign: 'right', width: '150px' }}>Share</th>
                                </tr>
                            </thead>
                            <tbody>
                                {richList?.accounts?.map((acc: any, index: number) => {
                                    const totalSupply = stats?.totalSupply ? BigInt(stats.totalSupply) : BigInt(1);
                                    const share = (Number(BigInt(acc.balance) * BigInt(10000) / totalSupply) / 100).toFixed(2);

                                    return (
                                        <tr key={acc.address}>
                                            <td>
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    background: index === 0 ? 'var(--accent)' : index === 1 ? '#d1d5db' : index === 2 ? '#92400e' : 'rgba(255,255,255,0.05)',
                                                    color: index < 3 ? 'black' : 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 800,
                                                    fontSize: '0.8rem'
                                                }}>
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td>
                                                <Link to={`/address/${acc.address}`} className="address" style={{ fontSize: '1rem' }}>
                                                    {acc.address}
                                                </Link>
                                                {index === 0 && <span className="badge badge-warning" style={{ fontSize: '0.6rem', padding: '2px 6px', marginLeft: '8px' }}>Creator</span>}
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                                {acc.balanceFormatted.split('.')[0]} SMC
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${share}%`, height: '100%', background: 'var(--gradient-primary)' }}></div>
                                                    </div>
                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: '45px' }}>{share}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({
    icon,
    label,
    value,
    loading,
    change
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    loading?: boolean;
    change?: string;
}) {
    return (
        <div className="glass-card" style={{ padding: '32px', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                opacity: 0.05,
                transform: 'rotate(-15deg)'
            }}>
                {icon}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ color: 'var(--primary-light)' }}>{icon}</div>
                    <span className="stat-label" style={{ margin: 0, fontWeight: 700 }}>{label}</span>
                </div>

                {loading ? (
                    <div className="spinner" style={{ width: '24px', height: '24px', marginTop: '12px' }} />
                ) : (
                    <div>
                        <div className="gradient-text" style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1 }}>
                            {value}
                        </div>
                        {change && (
                            <div className="stat-change positive" style={{ fontSize: '0.75rem', marginTop: '8px', opacity: 0.8 }}>
                                <Activity size={12} /> {change}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
