import { useState, useEffect } from 'react';
import { Server, Activity, Clock, Zap, HardDrive, Wifi, Shield, CheckCircle, AlertTriangle, XCircle, RefreshCw, TrendingUp } from 'lucide-react';
import { api } from '../api';

interface ValidatorNode {
    address: string;
    name: string;
    status: 'online' | 'degraded' | 'offline';
    uptime: number;
    lastBlock: number;
    blocksProduced: number;
    rewards: string;
    stake: string;
    latency: number;
    version: string;
    peers: number;
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
}

export default function NodeDashboard() {
    const [nodes, setNodes] = useState<ValidatorNode[]>([]);
    const [selectedNode, setSelectedNode] = useState<ValidatorNode | null>(null);
    const [loading, setLoading] = useState(true);
    const [uptimeHistory, setUptimeHistory] = useState<number[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    async function fetchData() {
        try {
            const [chainStats] = await Promise.all([
                api.getChainStats(),
                api.getValidators().catch(() => [])
            ]);

            // Generate mock validator nodes with realistic data
            const mockNodes: ValidatorNode[] = [
                {
                    address: '0x1234...5678',
                    name: 'SmartChain Validator 1',
                    status: 'online',
                    uptime: 99.98,
                    lastBlock: chainStats.blockHeight || 1000,
                    blocksProduced: 45892,
                    rewards: '12,450.00',
                    stake: '100,000',
                    latency: 12,
                    version: 'v1.2.0',
                    peers: 8,
                    cpuUsage: 35 + Math.random() * 20,
                    memoryUsage: 42 + Math.random() * 15,
                    diskUsage: 28 + Math.random() * 10
                },
                {
                    address: '0x2345...6789',
                    name: 'Enterprise Node Alpha',
                    status: 'online',
                    uptime: 99.95,
                    lastBlock: chainStats.blockHeight || 1000,
                    blocksProduced: 38421,
                    rewards: '10,230.00',
                    stake: '75,000',
                    latency: 18,
                    version: 'v1.2.0',
                    peers: 6,
                    cpuUsage: 28 + Math.random() * 25,
                    memoryUsage: 55 + Math.random() * 10,
                    diskUsage: 45 + Math.random() * 8
                },
                {
                    address: '0x3456...7890',
                    name: 'Community Validator',
                    status: 'online',
                    uptime: 99.87,
                    lastBlock: chainStats.blockHeight || 1000,
                    blocksProduced: 29183,
                    rewards: '8,450.00',
                    stake: '50,000',
                    latency: 24,
                    version: 'v1.1.9',
                    peers: 5,
                    cpuUsage: 45 + Math.random() * 20,
                    memoryUsage: 38 + Math.random() * 18,
                    diskUsage: 52 + Math.random() * 5
                },
                {
                    address: '0x4567...8901',
                    name: 'Backup Validator Node',
                    status: 'degraded',
                    uptime: 98.45,
                    lastBlock: (chainStats.blockHeight || 1000) - 3,
                    blocksProduced: 15672,
                    rewards: '4,120.00',
                    stake: '25,000',
                    latency: 145,
                    version: 'v1.1.8',
                    peers: 3,
                    cpuUsage: 78 + Math.random() * 10,
                    memoryUsage: 82 + Math.random() * 8,
                    diskUsage: 71 + Math.random() * 5
                },
                {
                    address: '0x5678...9012',
                    name: 'Regional Node EU',
                    status: 'online',
                    uptime: 99.92,
                    lastBlock: chainStats.blockHeight || 1000,
                    blocksProduced: 22341,
                    rewards: '6,780.00',
                    stake: '60,000',
                    latency: 32,
                    version: 'v1.2.0',
                    peers: 7,
                    cpuUsage: 22 + Math.random() * 18,
                    memoryUsage: 48 + Math.random() * 12,
                    diskUsage: 35 + Math.random() * 8
                }
            ];

            setNodes(mockNodes);
            setUptimeHistory(prev => [...prev.slice(-29), mockNodes.reduce((sum, n) => sum + n.uptime, 0) / mockNodes.length]);
            setLoading(false);
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setTimeout(() => setRefreshing(false), 500);
    };

    const onlineNodes = nodes.filter(n => n.status === 'online').length;
    const avgUptime = nodes.reduce((sum, n) => sum + n.uptime, 0) / nodes.length || 0;
    const totalRewards = nodes.reduce((sum, n) => sum + parseFloat(n.rewards.replace(/,/g, '')), 0);
    const avgLatency = nodes.reduce((sum, n) => sum + n.latency, 0) / nodes.length || 0;

    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '8px 20px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '30px', marginBottom: '16px' }}>
                    <Server size={18} color="#8b5cf6" />
                    <span style={{ color: '#8b5cf6', fontWeight: 600, letterSpacing: '2px', fontSize: '0.8rem' }}>NODE MONITOR</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>
                            Node Dashboard
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Monitor validator health, uptime, and rewards in real-time
                        </p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Overview Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <StatCard
                    icon={<Server size={24} />}
                    label="Total Nodes"
                    value={`${onlineNodes}/${nodes.length}`}
                    subtext="Online"
                    color="#8b5cf6"
                />
                <StatCard
                    icon={<Activity size={24} />}
                    label="Avg Uptime"
                    value={`${avgUptime.toFixed(2)}%`}
                    subtext="Last 30 days"
                    color="#10b981"
                />
                <StatCard
                    icon={<Zap size={24} />}
                    label="Total Rewards"
                    value={`${totalRewards.toLocaleString()}`}
                    subtext="SMART earned"
                    color="#f59e0b"
                />
                <StatCard
                    icon={<Clock size={24} />}
                    label="Avg Latency"
                    value={`${avgLatency.toFixed(0)}ms`}
                    subtext="Response time"
                    color="#06b6d4"
                />
            </div>

            {/* Main Content Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '24px' }}>
                {/* Node List */}
                <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Server size={20} color="var(--primary)" />
                        Validator Nodes
                    </h3>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            Loading nodes...
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {nodes.map((node, i) => (
                                <div
                                    key={i}
                                    onClick={() => setSelectedNode(node)}
                                    style={{
                                        padding: '16px',
                                        borderRadius: '16px',
                                        background: selectedNode?.address === node.address ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                                        border: `1px solid ${selectedNode?.address === node.address ? 'rgba(139, 92, 246, 0.4)' : 'var(--glass-border)'}`,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <StatusIndicator status={node.status} />
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{node.name}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                                    {node.address}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 600, color: 'var(--success)' }}>{node.uptime}%</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{node.latency}ms</div>
                                        </div>
                                    </div>

                                    {/* Quick Stats Bar */}
                                    <div style={{ display: 'flex', gap: '16px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
                                        <MiniStat icon={<HardDrive size={14} />} label="Blocks" value={node.blocksProduced.toLocaleString()} />
                                        <MiniStat icon={<Zap size={14} />} label="Rewards" value={`${node.rewards} SMART`} />
                                        <MiniStat icon={<Wifi size={14} />} label="Peers" value={node.peers.toString()} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Node Details Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Selected Node Details */}
                    <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Shield size={20} color="var(--primary)" />
                            Node Details
                        </h3>

                        {selectedNode ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <StatusIndicator status={selectedNode.status} size="lg" />
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{selectedNode.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Version {selectedNode.version}</div>
                                    </div>
                                </div>

                                <DetailRow label="Address" value={selectedNode.address} mono />
                                <DetailRow label="Status" value={selectedNode.status.toUpperCase()} color={getStatusColor(selectedNode.status)} />
                                <DetailRow label="Uptime" value={`${selectedNode.uptime}%`} />
                                <DetailRow label="Last Block" value={`#${selectedNode.lastBlock.toLocaleString()}`} />
                                <DetailRow label="Blocks Produced" value={selectedNode.blocksProduced.toLocaleString()} />
                                <DetailRow label="Total Stake" value={`${selectedNode.stake} SMART`} />
                                <DetailRow label="Earned Rewards" value={`${selectedNode.rewards} SMART`} />
                                <DetailRow label="Connected Peers" value={selectedNode.peers.toString()} />

                                {/* Resource Usage */}
                                <div style={{ marginTop: '16px' }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px' }}>Resource Usage</div>
                                    <ResourceBar label="CPU" value={selectedNode.cpuUsage} />
                                    <ResourceBar label="Memory" value={selectedNode.memoryUsage} />
                                    <ResourceBar label="Disk" value={selectedNode.diskUsage} />
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                Select a node to view details
                            </div>
                        )}
                    </div>

                    {/* Uptime Chart */}
                    <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <TrendingUp size={20} color="#10b981" />
                            Network Uptime
                        </h3>
                        <MiniChart data={uptimeHistory} height={100} color="#10b981" />
                        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Average: {avgUptime.toFixed(2)}%
                        </div>
                    </div>
                </div>
            </div>
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

function StatusIndicator({ status, size = 'sm' }: { status: string; size?: 'sm' | 'lg' }) {
    const colors = { online: '#10b981', degraded: '#f59e0b', offline: '#ef4444' };
    const icons = {
        online: <CheckCircle size={size === 'lg' ? 24 : 16} />,
        degraded: <AlertTriangle size={size === 'lg' ? 24 : 16} />,
        offline: <XCircle size={size === 'lg' ? 24 : 16} />
    };
    return (
        <div style={{ color: colors[status as keyof typeof colors] }}>
            {icons[status as keyof typeof icons]}
        </div>
    );
}

function getStatusColor(status: string) {
    const colors = { online: '#10b981', degraded: '#f59e0b', offline: '#ef4444' };
    return colors[status as keyof typeof colors];
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }} title={label}>
            {icon}
            <span>{value}</span>
        </div>
    );
}

function DetailRow({ label, value, mono, color }: { label: string; value: string; mono?: boolean; color?: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{label}</span>
            <span style={{ fontWeight: 500, fontFamily: mono ? 'monospace' : 'inherit', color: color || 'inherit' }}>{value}</span>
        </div>
    );
}

function ResourceBar({ label, value }: { label: string; value: number }) {
    const color = value > 80 ? '#ef4444' : value > 60 ? '#f59e0b' : '#10b981';
    return (
        <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ color }}>{value.toFixed(1)}%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: '3px', transition: 'width 0.3s' }} />
            </div>
        </div>
    );
}

function MiniChart({ data, height, color }: { data: number[]; height: number; color: string }) {
    if (data.length === 0) return <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const points = data.map((val, i) => ({
        x: (i / (data.length - 1 || 1)) * 100,
        y: 100 - ((val - min) / range) * 80 - 10
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
