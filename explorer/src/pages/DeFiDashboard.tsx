import { useState, useEffect } from 'react';
import { LayoutDashboard, TrendingUp, Lock, Users, Activity, DollarSign, Percent, ArrowUp, ArrowDown, Droplets, PieChart } from 'lucide-react';

interface ProtocolData {
    name: string;
    tvl: number;
    tvlChange24h: number;
    volume24h: number;
    fees24h: number;
    users: number;
    category: string;
    icon: string;
}

export default function DeFiDashboard() {
    const [protocols, setProtocols] = useState<ProtocolData[]>([]);
    const [tvlHistory, setTvlHistory] = useState<{ date: string; tvl: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            // Mock protocol data
            const mockProtocols: ProtocolData[] = [
                { name: 'SmartSwap', tvl: 45000000, tvlChange24h: 5.2, volume24h: 8500000, fees24h: 25500, users: 12450, category: 'DEX', icon: '🔄' },
                { name: 'SmartLend', tvl: 32000000, tvlChange24h: -2.1, volume24h: 3200000, fees24h: 16000, users: 8920, category: 'Lending', icon: '🏦' },
                { name: 'Staking Pool', tvl: 28000000, tvlChange24h: 1.8, volume24h: 1500000, fees24h: 7500, users: 15680, category: 'Staking', icon: '🔒' },
                { name: 'NFT Marketplace', tvl: 12000000, tvlChange24h: 12.5, volume24h: 2800000, fees24h: 42000, users: 5420, category: 'NFT', icon: '🎨' },
                { name: 'SmartBridge', tvl: 8500000, tvlChange24h: -0.5, volume24h: 4200000, fees24h: 12600, users: 3250, category: 'Bridge', icon: '🌉' },
                { name: 'Yield Farm', tvl: 6200000, tvlChange24h: 8.3, volume24h: 890000, fees24h: 4450, users: 4180, category: 'Yield', icon: '🌾' },
                { name: 'Lottery', tvl: 1800000, tvlChange24h: 25.0, volume24h: 450000, fees24h: 22500, users: 2890, category: 'Gaming', icon: '🎰' },
                { name: 'Options Protocol', tvl: 4200000, tvlChange24h: -3.2, volume24h: 1200000, fees24h: 6000, users: 1560, category: 'Derivatives', icon: '📊' },
            ];

            // Generate TVL history
            const history = [];
            let tvl = 100000000;
            for (let i = 30; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                tvl = tvl * (1 + (Math.random() - 0.45) * 0.03);
                history.push({
                    date: date.toISOString().split('T')[0],
                    tvl
                });
            }

            setProtocols(mockProtocols);
            setTvlHistory(history);
            setLoading(false);
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    }

    const categories = ['all', 'DEX', 'Lending', 'Staking', 'NFT', 'Bridge', 'Yield', 'Gaming', 'Derivatives'];
    const filteredProtocols = selectedCategory === 'all' ? protocols : protocols.filter(p => p.category === selectedCategory);

    const totalTvl = protocols.reduce((sum, p) => sum + p.tvl, 0);
    const totalVolume = protocols.reduce((sum, p) => sum + p.volume24h, 0);
    const totalFees = protocols.reduce((sum, p) => sum + p.fees24h, 0);
    const totalUsers = protocols.reduce((sum, p) => sum + p.users, 0);
    const avgTvlChange = protocols.reduce((sum, p) => sum + p.tvlChange24h, 0) / protocols.length;

    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '8px 20px', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '30px', marginBottom: '16px' }}>
                    <LayoutDashboard size={18} color="#8b5cf6" />
                    <span style={{ color: '#8b5cf6', fontWeight: 600, letterSpacing: '2px', fontSize: '0.8rem' }}>DEFI DASHBOARD</span>
                </div>
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>
                    DeFi Dashboard
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Total Value Locked, protocol revenue, and ecosystem metrics
                </p>
            </div>

            {/* Main Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <StatCard
                    icon={<Lock size={24} />}
                    label="Total Value Locked"
                    value={`$${(totalTvl / 1000000).toFixed(1)}M`}
                    change={avgTvlChange}
                    color="#8b5cf6"
                />
                <StatCard
                    icon={<Activity size={24} />}
                    label="24h Volume"
                    value={`$${(totalVolume / 1000000).toFixed(1)}M`}
                    color="#06b6d4"
                />
                <StatCard
                    icon={<DollarSign size={24} />}
                    label="24h Fees"
                    value={`$${(totalFees / 1000).toFixed(1)}K`}
                    color="#10b981"
                />
                <StatCard
                    icon={<Users size={24} />}
                    label="Total Users"
                    value={totalUsers.toLocaleString()}
                    color="#f59e0b"
                />
            </div>

            {/* TVL Chart */}
            <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <TrendingUp size={20} color="var(--primary)" />
                        Total Value Locked Over Time
                    </h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['7D', '30D', '90D', '1Y'].map(period => (
                            <button key={period} style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: 'none',
                                background: period === '30D' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                            }}>
                                {period}
                            </button>
                        ))}
                    </div>
                </div>
                <div style={{ height: '250px' }}>
                    <TVLChart data={tvlHistory} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span>30 days ago</span>
                    <span>Today: ${(tvlHistory[tvlHistory.length - 1]?.tvl / 1000000).toFixed(2)}M</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
                {/* Protocol List */}
                <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Droplets size={20} color="var(--primary)" />
                            Protocol Rankings
                        </h3>
                    </div>

                    {/* Category Filter */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    background: selectedCategory === cat ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    textTransform: 'capitalize'
                                }}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            Loading protocols...
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {filteredProtocols.map((protocol, i) => (
                                <div
                                    key={i}
                                    style={{
                                        padding: '16px',
                                        borderRadius: '16px',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid var(--glass-border)',
                                        display: 'grid',
                                        gridTemplateColumns: '40px 1fr auto auto auto',
                                        alignItems: 'center',
                                        gap: '16px'
                                    }}
                                >
                                    <div style={{ fontSize: '1.8rem', textAlign: 'center' }}>{protocol.icon}</div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{protocol.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{protocol.category}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 600 }}>${(protocol.tvl / 1000000).toFixed(2)}M</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>TVL</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 500 }}>${(protocol.volume24h / 1000000).toFixed(2)}M</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Volume</div>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        background: protocol.tvlChange24h >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                        color: protocol.tvlChange24h >= 0 ? '#10b981' : '#ef4444',
                                        fontWeight: 600,
                                        fontSize: '0.9rem'
                                    }}>
                                        {protocol.tvlChange24h >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                        {Math.abs(protocol.tvlChange24h)}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* TVL Distribution */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <PieChart size={20} color="#f59e0b" />
                            TVL Distribution
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {protocols.sort((a, b) => b.tvl - a.tvl).map((protocol, i) => {
                                const percentage = (protocol.tvl / totalTvl) * 100;
                                return (
                                    <div key={i}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span>{protocol.icon}</span>
                                                <span style={{ fontSize: '0.9rem' }}>{protocol.name}</span>
                                            </span>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{percentage.toFixed(1)}%</span>
                                        </div>
                                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${percentage}%`,
                                                background: `hsl(${260 - i * 25}, 70%, 60%)`,
                                                borderRadius: '3px',
                                                transition: 'width 0.3s'
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Percent size={20} color="#10b981" />
                            Revenue Distribution
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {protocols.sort((a, b) => b.fees24h - a.fees24h).slice(0, 5).map((protocol, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>{protocol.icon}</span>
                                        <span style={{ fontSize: '0.9rem' }}>{protocol.name}</span>
                                    </span>
                                    <span style={{ fontWeight: 600, color: '#10b981' }}>${protocol.fees24h.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Breakdown */}
            <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                <h3 style={{ marginBottom: '20px' }}>📊 Category Breakdown</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                    {categories.filter(c => c !== 'all').map(category => {
                        const categoryProtocols = protocols.filter(p => p.category === category);
                        const categoryTvl = categoryProtocols.reduce((sum, p) => sum + p.tvl, 0);
                        const categoryChange = categoryProtocols.length > 0
                            ? categoryProtocols.reduce((sum, p) => sum + p.tvlChange24h, 0) / categoryProtocols.length
                            : 0;

                        return (
                            <div key={category} style={{
                                padding: '20px',
                                borderRadius: '16px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--glass-border)'
                            }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>{category}</div>
                                <div style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '4px' }}>
                                    ${(categoryTvl / 1000000).toFixed(1)}M
                                </div>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.85rem',
                                    color: categoryChange >= 0 ? '#10b981' : '#ef4444'
                                }}>
                                    {categoryChange >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                    {Math.abs(categoryChange).toFixed(1)}%
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, change, color }: { icon: React.ReactNode; label: string; value: string; change?: number; color: string }) {
    return (
        <div className="glass-card" style={{ padding: '24px', borderRadius: '20px', borderLeft: `4px solid ${color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ color }}>{icon}</div>
                {change !== undefined && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        background: change >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: change >= 0 ? '#10b981' : '#ef4444',
                        fontSize: '0.8rem',
                        fontWeight: 600
                    }}>
                        {change >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                        {Math.abs(change).toFixed(1)}%
                    </div>
                )}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>{value}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{label}</div>
        </div>
    );
}

function TVLChart({ data }: { data: { date: string; tvl: number }[] }) {
    if (data.length === 0) return null;

    const tvls = data.map(d => d.tvl);
    const min = Math.min(...tvls);
    const max = Math.max(...tvls);
    const range = max - min || 1;

    const points = data.map((d, i) => ({
        x: (i / (data.length - 1)) * 100,
        y: 100 - ((d.tvl - min) / range) * 80 - 10
    }));

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = pathD + ` L 100 100 L 0 100 Z`;

    return (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ borderRadius: '12px' }}>
            <defs>
                <linearGradient id="gradient-tvl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={areaD} fill="url(#gradient-tvl)" />
            <path d={pathD} fill="none" stroke="#8b5cf6" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        </svg>
    );
}
