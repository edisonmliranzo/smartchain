import { useState, useEffect } from 'react';
import { Activity, CheckCircle, AlertTriangle, XCircle, Clock, Server, Zap, RefreshCw, Bell } from 'lucide-react';
import { api } from '../api';

interface Incident {
    id: string;
    title: string;
    status: 'resolved' | 'investigating' | 'identified' | 'monitoring';
    severity: 'critical' | 'major' | 'minor';
    startTime: Date;
    endTime?: Date;
    updates: { time: Date; message: string }[];
}

interface ServiceStatus {
    name: string;
    status: 'operational' | 'degraded' | 'outage';
    latency?: number;
    uptime: number;
    lastCheck: Date;
}

export default function NetworkStatus() {
    const [services, setServices] = useState<ServiceStatus[]>([]);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [uptimeHistory, setUptimeHistory] = useState<{ date: string; uptime: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    async function fetchStatus() {
        try {
            const startTime = Date.now();
            await api.getChainStats();
            const rpcLatency = Date.now() - startTime;

            // Mock services data
            const mockServices: ServiceStatus[] = [
                { name: 'RPC API', status: 'operational', latency: rpcLatency, uptime: 99.99, lastCheck: new Date() },
                { name: 'Block Production', status: 'operational', uptime: 99.98, lastCheck: new Date() },
                { name: 'Transaction Pool', status: 'operational', uptime: 99.95, lastCheck: new Date() },
                { name: 'WebSocket API', status: 'operational', latency: 15, uptime: 99.92, lastCheck: new Date() },
                { name: 'Explorer API', status: 'operational', latency: 45, uptime: 99.97, lastCheck: new Date() },
                { name: 'Faucet Service', status: 'operational', uptime: 99.85, lastCheck: new Date() },
                { name: 'Staking Contract', status: 'operational', uptime: 100, lastCheck: new Date() },
                { name: 'Bridge Service', status: 'degraded', uptime: 98.5, lastCheck: new Date() },
            ];

            // Mock incidents
            const mockIncidents: Incident[] = [
                {
                    id: '1',
                    title: 'Bridge Service Degraded Performance',
                    status: 'monitoring',
                    severity: 'minor',
                    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
                    updates: [
                        { time: new Date(Date.now() - 30 * 60 * 1000), message: 'We are monitoring the situation after implementing a fix.' },
                        { time: new Date(Date.now() - 90 * 60 * 1000), message: 'We have identified the issue and are working on a fix.' },
                        { time: new Date(Date.now() - 2 * 60 * 60 * 1000), message: 'We are investigating reports of slow bridge transactions.' }
                    ]
                },
                {
                    id: '2',
                    title: 'RPC Latency Spike',
                    status: 'resolved',
                    severity: 'major',
                    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    endTime: new Date(Date.now() - 22 * 60 * 60 * 1000),
                    updates: [
                        { time: new Date(Date.now() - 22 * 60 * 60 * 1000), message: 'Issue has been resolved. All systems operational.' },
                        { time: new Date(Date.now() - 23 * 60 * 60 * 1000), message: 'Fix deployed. Monitoring for stability.' },
                        { time: new Date(Date.now() - 24 * 60 * 60 * 1000), message: 'Investigating increased RPC response times.' }
                    ]
                }
            ];

            // Generate uptime history for last 90 days
            const history = [];
            for (let i = 89; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                history.push({
                    date: date.toISOString().split('T')[0],
                    uptime: 99 + Math.random() * 1
                });
            }

            setServices(mockServices);
            setIncidents(mockIncidents);
            setUptimeHistory(history);
            setLastUpdated(new Date());
            setLoading(false);
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchStatus();
        setTimeout(() => setRefreshing(false), 500);
    };

    const overallStatus = services.some(s => s.status === 'outage') ? 'outage' :
        services.some(s => s.status === 'degraded') ? 'degraded' : 'operational';

    const avgUptime = services.reduce((sum, s) => sum + s.uptime, 0) / services.length || 0;

    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '8px 20px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '30px', marginBottom: '16px' }}>
                    <Activity size={18} color="#10b981" />
                    <span style={{ color: '#10b981', fontWeight: 600, letterSpacing: '2px', fontSize: '0.8rem' }}>SYSTEM STATUS</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>
                            Network Status
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Real-time health metrics and incident history for SmartChain
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

            {/* Overall Status Banner */}
            <div className="glass-card" style={{
                padding: '32px',
                borderRadius: '24px',
                marginBottom: '32px',
                background: overallStatus === 'operational'
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)'
                    : overallStatus === 'degraded'
                        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)'
                        : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)',
                borderLeft: `4px solid ${overallStatus === 'operational' ? '#10b981' : overallStatus === 'degraded' ? '#f59e0b' : '#ef4444'}`
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <StatusIcon status={overallStatus} size={48} />
                        <div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>
                                {overallStatus === 'operational' ? 'All Systems Operational' :
                                    overallStatus === 'degraded' ? 'Partial System Outage' : 'Major System Outage'}
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                Last updated: {lastUpdated.toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#10b981' }}>{avgUptime.toFixed(2)}%</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Overall Uptime</div>
                    </div>
                </div>
            </div>

            {/* Uptime Calendar */}
            <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Clock size={20} color="var(--primary)" />
                        90-Day Uptime History
                    </h3>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#10b981', borderRadius: '2px', marginRight: '6px' }}></span>100%</span>
                        <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#22c55e', borderRadius: '2px', marginRight: '6px' }}></span>99%+</span>
                        <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#f59e0b', borderRadius: '2px', marginRight: '6px' }}></span>95%+</span>
                        <span><span style={{ display: 'inline-block', width: '12px', height: '12px', background: '#ef4444', borderRadius: '2px', marginRight: '6px' }}></span>&lt;95%</span>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(30, 1fr)', gap: '4px' }}>
                    {uptimeHistory.map((day, i) => (
                        <div
                            key={i}
                            title={`${day.date}: ${day.uptime.toFixed(2)}%`}
                            style={{
                                height: '30px',
                                borderRadius: '4px',
                                background: day.uptime >= 100 ? '#10b981' :
                                    day.uptime >= 99 ? '#22c55e' :
                                        day.uptime >= 95 ? '#f59e0b' : '#ef4444',
                                opacity: 0.8 + (day.uptime - 95) * 0.04,
                                cursor: 'pointer',
                                transition: 'transform 0.2s'
                            }}
                        />
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>90 days ago</span>
                    <span>Today</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                {/* Services Status */}
                <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Server size={20} color="var(--primary)" />
                        Service Status
                    </h3>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            Loading services...
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {services.map((service, i) => (
                                <div
                                    key={i}
                                    style={{
                                        padding: '16px',
                                        borderRadius: '12px',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid var(--glass-border)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <StatusIcon status={service.status} size={20} />
                                        <div>
                                            <div style={{ fontWeight: 500 }}>{service.name}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                {service.uptime.toFixed(2)}% uptime
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        {service.latency && (
                                            <div style={{
                                                fontSize: '0.85rem',
                                                color: service.latency < 50 ? '#10b981' : service.latency < 100 ? '#f59e0b' : '#ef4444'
                                            }}>
                                                {service.latency}ms
                                            </div>
                                        )}
                                        <StatusBadge status={service.status} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Zap size={20} color="#f59e0b" />
                            Quick Stats
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <QuickStat label="Active Services" value={`${services.filter(s => s.status === 'operational').length}/${services.length}`} />
                            <QuickStat label="Avg Response Time" value={`${Math.round(services.reduce((sum, s) => sum + (s.latency || 0), 0) / services.filter(s => s.latency).length)}ms`} />
                            <QuickStat label="Open Incidents" value={incidents.filter(i => i.status !== 'resolved').length.toString()} color={incidents.filter(i => i.status !== 'resolved').length > 0 ? '#f59e0b' : undefined} />
                            <QuickStat label="Resolved Today" value={incidents.filter(i => i.status === 'resolved').length.toString()} />
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Bell size={20} color="var(--primary)" />
                            Subscribe
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                            Get notified about network incidents and maintenance.
                        </p>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: '1px solid var(--glass-border)',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'var(--text-primary)',
                                marginBottom: '12px'
                            }}
                        />
                        <button className="btn-primary" style={{ width: '100%' }}>
                            Subscribe to Updates
                        </button>
                    </div>
                </div>
            </div>

            {/* Incidents */}
            <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', marginTop: '32px' }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <AlertTriangle size={20} color="#f59e0b" />
                    Recent Incidents
                </h3>

                {incidents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        <CheckCircle size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                        <div>No incidents to report</div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {incidents.map((incident, i) => (
                            <div key={i} style={{
                                padding: '20px',
                                borderRadius: '16px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--glass-border)',
                                borderLeft: `4px solid ${incident.status === 'resolved' ? '#10b981' : incident.severity === 'critical' ? '#ef4444' : incident.severity === 'major' ? '#f59e0b' : '#3b82f6'}`
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <div>
                                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>{incident.title}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            Started: {incident.startTime.toLocaleString()}
                                            {incident.endTime && ` • Resolved: ${incident.endTime.toLocaleString()}`}
                                        </div>
                                    </div>
                                    <IncidentBadge status={incident.status} />
                                </div>
                                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '12px' }}>
                                    {incident.updates.slice(0, 2).map((update, j) => (
                                        <div key={j} style={{ display: 'flex', gap: '12px', marginBottom: '8px', fontSize: '0.9rem' }}>
                                            <span style={{ color: 'var(--text-muted)', minWidth: '100px' }}>
                                                {update.time.toLocaleTimeString()}
                                            </span>
                                            <span>{update.message}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusIcon({ status, size = 20 }: { status: string; size?: number }) {
    const colors = { operational: '#10b981', degraded: '#f59e0b', outage: '#ef4444' };
    const icons = {
        operational: <CheckCircle size={size} />,
        degraded: <AlertTriangle size={size} />,
        outage: <XCircle size={size} />
    };
    return <div style={{ color: colors[status as keyof typeof colors] }}>{icons[status as keyof typeof icons]}</div>;
}

function StatusBadge({ status }: { status: string }) {
    const colors = { operational: '#10b981', degraded: '#f59e0b', outage: '#ef4444' };
    const labels = { operational: 'Operational', degraded: 'Degraded', outage: 'Outage' };
    return (
        <div style={{
            padding: '4px 12px',
            borderRadius: '20px',
            background: `${colors[status as keyof typeof colors]}20`,
            color: colors[status as keyof typeof colors],
            fontSize: '0.8rem',
            fontWeight: 600
        }}>
            {labels[status as keyof typeof labels]}
        </div>
    );
}

function IncidentBadge({ status }: { status: string }) {
    const colors: Record<string, string> = { resolved: '#10b981', monitoring: '#3b82f6', investigating: '#f59e0b', identified: '#8b5cf6' };
    return (
        <div style={{
            padding: '4px 12px',
            borderRadius: '20px',
            background: `${colors[status]}20`,
            color: colors[status],
            fontSize: '0.8rem',
            fontWeight: 600,
            textTransform: 'capitalize'
        }}>
            {status}
        </div>
    );
}

function QuickStat({ label, value, color }: { label: string; value: string; color?: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ fontWeight: 600, color }}>{value}</span>
        </div>
    );
}
