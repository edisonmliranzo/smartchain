import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import {
    Activity,
    CheckCircle,
    Server,
    ArrowUpRight,
    Cpu,
    Shield
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Validators() {
    const { data: validatorData, isLoading } = useQuery({
        queryKey: ['validators'],
        queryFn: api.getValidators,
        refetchInterval: 5000,
    });

    const { data: stats } = useQuery({
        queryKey: ['chainStats'],
        queryFn: api.getChainStats,
    });

    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
            {/* Header section with stats */}
            <div className="glass-card" style={{
                padding: '60px 40px',
                borderRadius: '30px',
                marginBottom: '48px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ zIndex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div className="pulse-active"></div>
                        <span style={{ color: 'var(--success)', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '2px' }}>CONSENSUS ACTIVE</span>
                    </div>
                    <h1 className="gradient-text" style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '16px' }}>Network Validators</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px' }}>
                        The SmartChain Proof of Authority (PoA) governance is secured by high-performance nodes ensuring sub-3s block finality.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '24px', zIndex: 2 }}>
                    <QuickStat
                        icon={<Server size={24} />}
                        label="Active Nodes"
                        value={validatorData?.count?.toString() || '1'}
                    />
                    <QuickStat
                        icon={<Activity size={24} />}
                        label="Avg Uptime"
                        value="99.99%"
                    />
                </div>

                <div style={{ position: 'absolute', right: '-40px', bottom: '-40px', opacity: 0.05, transform: 'rotate(-15deg)' }}>
                    <Shield size={320} color="white" />
                </div>
            </div>

            {/* Validators Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                {isLoading ? (
                    <div className="loader" style={{ gridColumn: '1/-1' }}><div className="spinner" /></div>
                ) : (
                    validatorData?.validators?.map((validator: any, index: number) => (
                        <ValidatorCard key={validator.address} validator={validator} index={index} />
                    ))
                )}
            </div>

            {/* Performance Heatmap concept placeholder */}
            <div className="glass-card" style={{ marginTop: '48px', borderRadius: '24px' }}>
                <div className="card-header">
                    <h2 className="card-title">
                        <Activity size={20} style={{ color: 'var(--accent)' }} />
                        Global Performance Heatmap (Last 100 Blocks)
                    </h2>
                </div>
                <div style={{ padding: '24px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {Array.from({ length: 100 }).map((_, i) => (
                        <div
                            key={i}
                            style={{
                                width: '12px',
                                height: '12px',
                                background: Math.random() > 0.05 ? 'var(--success)' : 'var(--error)',
                                borderRadius: '2px',
                                opacity: 0.6 + (Math.random() * 0.4)
                            }}
                            title={`Block ${stats?.totalBlocks ? stats.totalBlocks - 100 + i : i}`}
                        />
                    ))}
                </div>
                <div style={{ padding: '0 24px 24px', display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '10px', height: '10px', background: 'var(--success)', borderRadius: '2px' }} /> Confirmed
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '10px', height: '10px', background: 'var(--error)', borderRadius: '2px' }} /> Missed Round
                    </div>
                </div>
            </div>
        </div>
    );
}

function QuickStat({ icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="glass" style={{ padding: '24px', borderRadius: '20px', textAlign: 'center', minWidth: '150px' }}>
            <div style={{ color: 'var(--primary-light)', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>{icon}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'white' }}>{value}</div>
        </div>
    );
}

function ValidatorCard({ validator, index }: { validator: any; index: number }) {
    return (
        <div className="glass-card shine-effect" style={{ padding: '0', borderRadius: '24px', overflow: 'hidden' }}>
            <div style={{
                height: '80px',
                background: index === 0 ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.05)',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '0 24px',
                position: 'relative'
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: '#1a1a2e',
                    border: '4px solid #0f0f1a',
                    marginBottom: '-32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.4)',
                    zIndex: 2
                }}>
                    <Cpu size={32} color={index === 0 ? 'var(--primary-light)' : 'var(--text-muted)'} />
                </div>
            </div>

            <div style={{ padding: '48px 24px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>{validator.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontSize: '0.8rem', fontWeight: 700, marginTop: '4px' }}>
                            <CheckCircle size={14} /> ACTIVE SIGNER
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Uptime</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary-light)' }}>{validator.uptime}%</div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>SIGNER ADDRESS</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--secondary-light)', overflowX: 'hidden', textOverflow: 'ellipsis' }}>
                            {validator.address}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>BLOCKS SIGNED</div>
                            <div style={{ fontSize: '1rem', fontWeight: 800 }}>{validator.blocksSigned} <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>(100b)</span></div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>COMMISSION</div>
                            <div style={{ fontSize: '1rem', fontWeight: 800 }}>0.00%</div>
                        </div>
                    </div>
                </div>

                <Link to={`/address/${validator.address}`} className="btn btn-secondary glass" style={{ width: '100%', justifyContent: 'center' }}>
                    View Node Details <ArrowUpRight size={16} />
                </Link>
            </div>
        </div>
    );
}
