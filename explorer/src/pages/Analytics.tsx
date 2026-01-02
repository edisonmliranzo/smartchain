import { useState, useEffect } from 'react';
import { TrendingUp, Activity, Zap, Users, Fuel, Clock, BarChart3, ArrowUp, ArrowDown } from 'lucide-react';
import { api } from '../api';

export default function Analytics() {
    const [stats, setStats] = useState<any>(null);
    const [tpsHistory, setTpsHistory] = useState<number[]>([]);
    const [gasHistory, setGasHistory] = useState<number[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await api.getChainStats();
                setStats(data);
                // Simulate TPS history
                setTpsHistory(prev => [...prev.slice(-29), Math.random() * 50 + 10]);
                setGasHistory(prev => [...prev.slice(-29), Math.random() * 80 + 20]);
            } catch (e) {
                console.error(e);
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 2000);
        return () => clearInterval(interval);
    }, []);

    const currentTps = tpsHistory[tpsHistory.length - 1] || 0;
    const avgTps = tpsHistory.reduce((a, b) => a + b, 0) / tpsHistory.length || 0;
    const currentGas = gasHistory[gasHistory.length - 1] || 0;

    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '8px 20px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '30px', marginBottom: '16px' }}>
                    <BarChart3 size={18} color="#06b6d4" />
                    <span style={{ color: '#06b6d4', fontWeight: 600, letterSpacing: '2px', fontSize: '0.8rem' }}>ANALYTICS</span>
                </div>
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>
                    Network Analytics
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Real-time metrics and performance data for SmartChain
                </p>
            </div>

            {/* Live Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <LiveStatCard
                    icon={<Zap size={24} />}
                    label="Current TPS"
                    value={currentTps.toFixed(1)}
                    change={currentTps > avgTps ? '+' + (currentTps - avgTps).toFixed(1) : (currentTps - avgTps).toFixed(1)}
                    positive={currentTps >= avgTps}
                    color="#7c3aed"
                />
                <LiveStatCard
                    icon={<Activity size={24} />}
                    label="Block Height"
                    value={(stats?.blockHeight || 0).toLocaleString()}
                    change="+1/sec"
                    positive={true}
                    color="#06b6d4"
                />
                <LiveStatCard
                    icon={<Fuel size={24} />}
                    label="Gas Usage"
                    value={`${currentGas.toFixed(0)}%`}
                    change={currentGas > 50 ? 'High' : 'Normal'}
                    positive={currentGas <= 50}
                    color="#10b981"
                />
                <LiveStatCard
                    icon={<Users size={24} />}
                    label="Active Validators"
                    value={(stats?.activeValidators || 5).toString()}
                    change="100% uptime"
                    positive={true}
                    color="#ec4899"
                />
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
                {/* TPS Chart */}
                <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <TrendingUp size={20} color="var(--primary)" />
                            Transactions Per Second
                        </h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {['1H', '24H', '7D'].map(period => (
                                <button key={period} style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: period === '1H' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                    color: period === '1H' ? 'white' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                }}>
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>
                    <MiniChart data={tpsHistory} height={200} color="#7c3aed" />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span>Avg: {avgTps.toFixed(1)} TPS</span>
                        <span>Peak: {Math.max(...tpsHistory, 0).toFixed(1)} TPS</span>
                    </div>
                </div>

                {/* Network Health */}
                <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Activity size={20} color="var(--success)" />
                        Network Health
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <HealthMetric label="RPC Latency" value="12ms" status="good" />
                        <HealthMetric label="Block Time" value="1.0s" status="good" />
                        <HealthMetric label="Peer Count" value="5" status="good" />
                        <HealthMetric label="Sync Status" value="Synced" status="good" />
                        <HealthMetric label="Mempool" value="0 pending" status="good" />
                    </div>
                </div>
            </div>

            {/* Gas Usage Chart */}
            <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', marginBottom: '32px' }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Fuel size={20} color="#10b981" />
                    Gas Usage Over Time
                </h3>
                <MiniChart data={gasHistory} height={150} color="#10b981" />
            </div>

            {/* Top Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                {/* Top Contracts */}
                <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                    <h3 style={{ marginBottom: '20px' }}>🔥 Top Contracts (24h)</h3>
                    {[
                        { name: 'SmartSwap Router', calls: '12,847', gas: '45.2M' },
                        { name: 'Token Factory', calls: '3,421', gas: '12.1M' },
                        { name: 'NFT Marketplace', calls: '2,156', gas: '8.7M' },
                        { name: 'Staking Pool', calls: '1,892', gas: '6.2M' },
                    ].map((contract, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 3 ? '1px solid var(--glass-border)' : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ color: 'var(--text-muted)', width: '20px' }}>#{i + 1}</span>
                                <span style={{ fontWeight: 500 }}>{contract.name}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 600 }}>{contract.calls}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{contract.gas} gas</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Activity */}
                <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                    <h3 style={{ marginBottom: '20px' }}>📊 Daily Statistics</h3>
                    {[
                        { label: 'Total Transactions', value: '847,293', change: '+12.4%' },
                        { label: 'Unique Addresses', value: '23,847', change: '+5.2%' },
                        { label: 'Contracts Deployed', value: '156', change: '+8.7%' },
                        { label: 'Total Gas Used', value: '72.4B', change: '-3.1%' },
                    ].map((stat, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 3 ? '1px solid var(--glass-border)' : 'none' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{stat.label}</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontWeight: 600 }}>{stat.value}</span>
                                <span style={{
                                    fontSize: '0.8rem',
                                    color: stat.change.startsWith('+') ? 'var(--success)' : '#ef4444',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    {stat.change.startsWith('+') ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                    {stat.change}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Block Time Distribution */}
                <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                    <h3 style={{ marginBottom: '20px' }}>⏱️ Block Time Distribution</h3>
                    {[
                        { range: '< 1.0s', pct: 15 },
                        { range: '1.0s', pct: 72 },
                        { range: '1.1 - 1.5s', pct: 10 },
                        { range: '> 1.5s', pct: 3 },
                    ].map((item, i) => (
                        <div key={i} style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ fontSize: '0.9rem' }}>{item.range}</span>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{item.pct}%</span>
                            </div>
                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${item.pct}%`,
                                    background: item.pct > 50 ? 'var(--success)' : 'var(--primary)',
                                    borderRadius: '4px',
                                    transition: 'width 0.3s'
                                }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function LiveStatCard({ icon, label, value, change, positive, color }: { icon: React.ReactNode; label: string; value: string; change: string; positive: boolean; color: string }) {
    return (
        <div className="glass-card" style={{
            padding: '24px',
            borderRadius: '20px',
            borderLeft: `4px solid ${color}`
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ color }}>{icon}</div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    background: positive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    color: positive ? 'var(--success)' : '#ef4444',
                    fontSize: '0.75rem'
                }}>
                    {positive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    {change}
                </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>{value}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{label}</div>
        </div>
    );
}

function MiniChart({ data, height, color }: { data: number[]; height: number; color: string }) {
    if (data.length === 0) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

    const max = Math.max(...data, 1);
    const points = data.map((val, i) => ({
        x: (i / (data.length - 1 || 1)) * 100,
        y: 100 - (val / max) * 100
    }));
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = pathD + ` L 100 100 L 0 100 Z`;

    return (
        <svg width="100%" height={height} viewBox="0 0 100 100" preserveAspectRatio="none" style={{ borderRadius: '12px' }}>
            <defs>
                <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={areaD} fill={`url(#gradient-${color})`} />
            <path d={pathD} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
    );
}

function HealthMetric({ label, value, status }: { label: string; value: string; status: 'good' | 'warning' | 'bad' }) {
    const colors = { good: 'var(--success)', warning: '#f59e0b', bad: '#ef4444' };
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 500 }}>{value}</span>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors[status] }} />
            </div>
        </div>
    );
}
