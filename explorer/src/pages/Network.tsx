import { useEffect, useState } from 'react';
import NetworkGlobe from '../components/NetworkGlobe';
import { Server, Activity, Globe as GlobeIcon, Zap, Shield } from 'lucide-react';
import { api } from '../api';

export default function Network() {
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        api.getChainStats().then(setStats);
        const interval = setInterval(() => api.getChainStats().then(setStats), 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
            {/* Header */}
            <div className="glass-card" style={{
                padding: '40px',
                marginBottom: '32px',
                borderRadius: '30px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div className="pulse-active"></div>
                        <span style={{ color: 'var(--success)', fontWeight: 800, letterSpacing: '2px', fontSize: '0.8rem' }}>GLOBAL CONSENSUS</span>
                    </div>
                    <h1 className="gradient-text" style={{ fontSize: '3rem', fontWeight: 900, margin: 0 }}>Network Topology</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '16px', maxWidth: '600px' }}>
                        Real-time visualization of the SmartChain validator mesh network. Our Proof of Authority (PoA) nodes are distributed globally for maximum resilience.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '32px', zIndex: 2 }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>Block Time</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Zap size={20} color="var(--accent)" /> 1.0s
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '4px' }}>Active Nodes</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Server size={20} color="var(--success)" /> {stats?.activeValidators || 5}
                        </div>
                    </div>
                </div>

                <div style={{ position: 'absolute', right: '-80px', bottom: '-80px', opacity: 0.05, transform: 'rotate(15deg)' }}>
                    <GlobeIcon size={400} />
                </div>
            </div>

            {/* The Globe */}
            <div className="glass-card" style={{ padding: '0', borderRadius: '30px', overflow: 'hidden', height: '600px', border: '1px solid var(--glass-border)' }}>
                <NetworkGlobe />
            </div>

            {/* Validator List (Mini) */}
            <div style={{ marginTop: '48px' }}>
                <h2 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Shield size={24} color="var(--accent)" /> Core Validators
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                    {[
                        { name: 'Atlas Node', loc: 'New York, US', ip: '161.97.150.119', status: 'Primary' },
                        { name: 'Zeus Prime', loc: 'London, UK', ip: '75.119.133.33', status: 'Replica' },
                        { name: 'Hermes Oracle', loc: 'Singapore', ip: '***.***.***.***', status: 'Standby' },
                        { name: 'Apollo Forge', loc: 'Tokyo, JP', ip: '***.***.***.***', status: 'Standby' },
                        { name: 'Athena Core', loc: 'Berlin, DE', ip: '***.***.***.***', status: 'Standby' }
                    ].map((node, i) => (
                        <div key={i} className="glass-card" style={{ padding: '24px', borderRadius: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{node.name}</span>
                                <div style={{
                                    padding: '4px 12px',
                                    background: node.status === 'Primary' ? 'rgba(0,255,65,0.1)' : 'rgba(255,255,255,0.05)',
                                    borderRadius: '12px',
                                    color: node.status === 'Primary' ? 'var(--success)' : 'var(--text-muted)',
                                    fontSize: '0.8rem',
                                    fontWeight: 600
                                }}>
                                    {node.status}
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <GlobeIcon size={14} /> {node.loc}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Activity size={14} /> {node.status === 'Primary' || node.status === 'Replica' ? '99.99% Uptime' : 'Offline'}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
