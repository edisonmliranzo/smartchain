import { useState, useEffect } from 'react';
import { Coins, BarChart3, PieChart, Users, Activity, ArrowUp, ArrowDown, Droplets } from 'lucide-react';

interface TokenData {
    symbol: string;
    name: string;
    price: number;
    priceChange24h: number;
    volume24h: number;
    marketCap: number;
    holders: number;
    totalSupply: string;
    circulatingSupply: string;
    allTimeHigh: number;
    allTimeLow: number;
}

interface PricePoint {
    time: Date;
    price: number;
    volume: number;
}

export default function TokenAnalytics() {
    const [selectedToken, setSelectedToken] = useState<string>('SMART');
    const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '1y'>('7d');
    const [tokenData, setTokenData] = useState<TokenData | null>(null);
    const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
    const [holderDistribution, setHolderDistribution] = useState<{ range: string; count: number; percentage: number }[]>([]);
    const [loading, setLoading] = useState(true);

    const tokens = ['SMART', 'USDT', 'WETH', 'WBTC'];

    useEffect(() => {
        fetchTokenData();
    }, [selectedToken, timeframe]);

    async function fetchTokenData() {
        setLoading(true);
        try {
            // Mock token data
            const mockTokenData: TokenData = {
                symbol: selectedToken,
                name: selectedToken === 'SMART' ? 'SmartChain' : selectedToken === 'USDT' ? 'Tether USD' : selectedToken === 'WETH' ? 'Wrapped Ether' : 'Wrapped Bitcoin',
                price: selectedToken === 'SMART' ? 2.45 : selectedToken === 'USDT' ? 1.00 : selectedToken === 'WETH' ? 2340.50 : 43250.00,
                priceChange24h: selectedToken === 'SMART' ? 5.2 : selectedToken === 'USDT' ? 0.01 : selectedToken === 'WETH' ? -2.3 : 1.8,
                volume24h: selectedToken === 'SMART' ? 12500000 : selectedToken === 'USDT' ? 8500000 : selectedToken === 'WETH' ? 4200000 : 1800000,
                marketCap: selectedToken === 'SMART' ? 245000000 : selectedToken === 'USDT' ? 85000000 : selectedToken === 'WETH' ? 42000000 : 18000000,
                holders: selectedToken === 'SMART' ? 45892 : selectedToken === 'USDT' ? 23451 : selectedToken === 'WETH' ? 12890 : 5672,
                totalSupply: selectedToken === 'SMART' ? '100,000,000' : selectedToken === 'USDT' ? '85,000,000' : selectedToken === 'WETH' ? '18,000' : '420',
                circulatingSupply: selectedToken === 'SMART' ? '78,500,000' : selectedToken === 'USDT' ? '85,000,000' : selectedToken === 'WETH' ? '18,000' : '420',
                allTimeHigh: selectedToken === 'SMART' ? 4.85 : selectedToken === 'USDT' ? 1.02 : selectedToken === 'WETH' ? 4850.00 : 69000.00,
                allTimeLow: selectedToken === 'SMART' ? 0.15 : selectedToken === 'USDT' ? 0.98 : selectedToken === 'WETH' ? 85.00 : 3200.00
            };

            // Generate price history
            const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 365;
            const points = timeframe === '24h' ? 24 : days;
            const history: PricePoint[] = [];
            const basePrice = mockTokenData.price;

            for (let i = points; i >= 0; i--) {
                const time = new Date();
                if (timeframe === '24h') {
                    time.setHours(time.getHours() - i);
                } else {
                    time.setDate(time.getDate() - i);
                }
                const variation = (Math.random() - 0.5) * 0.1 * basePrice;
                history.push({
                    time,
                    price: basePrice + variation + (i / points) * basePrice * 0.1 * (mockTokenData.priceChange24h > 0 ? -1 : 1),
                    volume: 1000000 + Math.random() * 2000000
                });
            }

            // Holder distribution
            const distribution = [
                { range: '0 - 100', count: 28450, percentage: 62 },
                { range: '100 - 1K', count: 10250, percentage: 22 },
                { range: '1K - 10K', count: 4520, percentage: 10 },
                { range: '10K - 100K', count: 1850, percentage: 4 },
                { range: '100K - 1M', count: 720, percentage: 1.5 },
                { range: '1M+', count: 102, percentage: 0.5 },
            ];

            setTokenData(mockTokenData);
            setPriceHistory(history);
            setHolderDistribution(distribution);
            setLoading(false);
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    }

    const currentPrice = priceHistory[priceHistory.length - 1]?.price || 0;
    const startPrice = priceHistory[0]?.price || 0;
    const priceChangePercent = startPrice > 0 ? ((currentPrice - startPrice) / startPrice * 100) : 0;

    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '8px 20px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '30px', marginBottom: '16px' }}>
                    <Coins size={18} color="#f59e0b" />
                    <span style={{ color: '#f59e0b', fontWeight: 600, letterSpacing: '2px', fontSize: '0.8rem' }}>TOKEN ANALYTICS</span>
                </div>
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>
                    Token Analytics
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Price charts, volume, and holder distribution for SmartChain tokens
                </p>
            </div>

            {/* Token Selector */}
            <div className="glass-card" style={{ padding: '20px', borderRadius: '20px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {tokens.map(token => (
                            <button
                                key={token}
                                onClick={() => setSelectedToken(token)}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: selectedToken === token ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                    color: 'var(--text-primary)',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {token}
                            </button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {(['24h', '7d', '30d', '1y'] as const).map(tf => (
                            <button
                                key={tf}
                                onClick={() => setTimeframe(tf)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: timeframe === tf ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                {tf.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
                    Loading token data...
                </div>
            ) : tokenData && (
                <>
                    {/* Price Overview */}
                    <div className="glass-card" style={{ padding: '32px', borderRadius: '24px', marginBottom: '32px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 800,
                                        fontSize: '1.2rem'
                                    }}>
                                        {tokenData.symbol.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{tokenData.name}</div>
                                        <div style={{ color: 'var(--text-muted)' }}>{tokenData.symbol}</div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginTop: '16px' }}>
                                    <span style={{ fontSize: '3rem', fontWeight: 900 }}>${tokenData.price.toLocaleString()}</span>
                                    <span style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '8px 16px',
                                        borderRadius: '12px',
                                        background: priceChangePercent >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                        color: priceChangePercent >= 0 ? '#10b981' : '#ef4444',
                                        fontWeight: 600
                                    }}>
                                        {priceChangePercent >= 0 ? <ArrowUp size={18} /> : <ArrowDown size={18} />}
                                        {Math.abs(priceChangePercent).toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', textAlign: 'right' }}>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '4px' }}>All-Time High</div>
                                    <div style={{ fontWeight: 600, color: '#10b981' }}>${tokenData.allTimeHigh.toLocaleString()}</div>
                                </div>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '4px' }}>All-Time Low</div>
                                    <div style={{ fontWeight: 600, color: '#ef4444' }}>${tokenData.allTimeLow.toLocaleString()}</div>
                                </div>
                            </div>
                        </div>

                        {/* Price Chart */}
                        <div style={{ height: '300px', position: 'relative' }}>
                            <PriceChart data={priceHistory} color={priceChangePercent >= 0 ? '#10b981' : '#ef4444'} />
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                        <StatCard icon={<BarChart3 size={24} />} label="Market Cap" value={`$${(tokenData.marketCap / 1000000).toFixed(1)}M`} color="#8b5cf6" />
                        <StatCard icon={<Activity size={24} />} label="24h Volume" value={`$${(tokenData.volume24h / 1000000).toFixed(1)}M`} color="#06b6d4" />
                        <StatCard icon={<Users size={24} />} label="Holders" value={tokenData.holders.toLocaleString()} color="#10b981" />
                        <StatCard icon={<Droplets size={24} />} label="Circulating" value={tokenData.circulatingSupply} color="#f59e0b" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        {/* Holder Distribution */}
                        <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <PieChart size={20} color="var(--primary)" />
                                Holder Distribution
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {holderDistribution.map((item, i) => (
                                    <div key={i}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>{item.range} {tokenData.symbol}</span>
                                            <span style={{ fontWeight: 500 }}>{item.count.toLocaleString()} ({item.percentage}%)</span>
                                        </div>
                                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${item.percentage}%`,
                                                background: `hsl(${260 - i * 30}, 70%, 60%)`,
                                                borderRadius: '4px',
                                                transition: 'width 0.3s'
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Token Info */}
                        <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Coins size={20} color="#f59e0b" />
                                Token Information
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <InfoRow label="Total Supply" value={tokenData.totalSupply} />
                                <InfoRow label="Circulating Supply" value={tokenData.circulatingSupply} />
                                <InfoRow label="Market Cap Rank" value="#1" />
                                <InfoRow label="Price Change (24h)" value={`${tokenData.priceChange24h >= 0 ? '+' : ''}${tokenData.priceChange24h}%`} color={tokenData.priceChange24h >= 0 ? '#10b981' : '#ef4444'} />
                                <InfoRow label="Volume/Market Cap" value={`${((tokenData.volume24h / tokenData.marketCap) * 100).toFixed(2)}%`} />
                                <InfoRow label="Fully Diluted Valuation" value={`$${(parseFloat(tokenData.totalSupply.replace(/,/g, '')) * tokenData.price / 1000000).toFixed(1)}M`} />
                            </div>
                        </div>
                    </div>

                    {/* Volume Chart */}
                    <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', marginTop: '32px' }}>
                        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <BarChart3 size={20} color="#06b6d4" />
                            Trading Volume
                        </h3>
                        <div style={{ height: '150px' }}>
                            <VolumeChart data={priceHistory} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
    return (
        <div className="glass-card" style={{ padding: '24px', borderRadius: '20px', borderLeft: `4px solid ${color}` }}>
            <div style={{ color, marginBottom: '12px' }}>{icon}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>{value}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{label}</div>
        </div>
    );
}

function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ fontWeight: 500, color }}>{value}</span>
        </div>
    );
}

function PriceChart({ data, color }: { data: PricePoint[]; color: string }) {
    if (data.length === 0) return null;

    const prices = data.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const points = data.map((d, i) => ({
        x: (i / (data.length - 1)) * 100,
        y: 100 - ((d.price - min) / range) * 80 - 10
    }));

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = pathD + ` L 100 100 L 0 100 Z`;

    return (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
                <linearGradient id={`gradient-price`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={areaD} fill="url(#gradient-price)" />
            <path d={pathD} fill="none" stroke={color} strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        </svg>
    );
}

function VolumeChart({ data }: { data: PricePoint[] }) {
    if (data.length === 0) return null;

    const volumes = data.map(d => d.volume);
    const max = Math.max(...volumes);

    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', gap: '2px' }}>
            {data.map((d, i) => (
                <div
                    key={i}
                    style={{
                        flex: 1,
                        height: `${(d.volume / max) * 100}%`,
                        background: 'linear-gradient(180deg, #06b6d4 0%, rgba(6, 182, 212, 0.3) 100%)',
                        borderRadius: '2px 2px 0 0',
                        transition: 'height 0.3s'
                    }}
                    title={`$${(d.volume / 1000000).toFixed(2)}M`}
                />
            ))}
        </div>
    );
}
