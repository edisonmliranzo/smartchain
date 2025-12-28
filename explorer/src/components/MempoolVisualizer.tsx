
import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import { Layers, Clock, ArrowRight, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MempoolVisualizer() {
    const { data: mempoolData, isLoading } = useQuery({
        queryKey: ['mempool'],
        queryFn: api.getPendingTransactions,
        refetchInterval: 1000, // Refresh every second for real-time feel
    });

    const pendingTxs = mempoolData?.transactions || [];
    const count = mempoolData?.count || 0;

    return (
        <div className="glass-card animate-in" style={{ borderRadius: '24px', overflow: 'hidden', height: '100%' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '8px', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '10px', color: 'var(--warning)' }}>
                        <Database size={20} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Live Mempool</h3>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Waiting for Validator</div>
                    </div>
                </div>
                <div style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: count > 0 ? 'var(--warning)' : 'rgba(255,255,255,0.05)',
                    color: count > 0 ? 'black' : 'var(--text-muted)',
                    fontWeight: 800,
                    fontSize: '0.8rem'
                }}>
                    {count} PENDING
                </div>
            </div>

            <div style={{ padding: '0', position: 'relative', minHeight: '300px', maxHeight: '400px', overflowY: 'auto' }}>
                {isLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Clock className="spinner" size={24} style={{ marginBottom: '12px' }} />
                        <div>Scanning Mempool...</div>
                    </div>
                ) : count === 0 ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '300px',
                        color: 'var(--text-muted)',
                        opacity: 0.6
                    }}>
                        <Layers size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                        <p>Mempool is empty</p>
                        <p style={{ fontSize: '0.8rem' }}>Waiting for new transactions...</p>
                    </div>
                ) : (
                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {pendingTxs.map((tx: any, i: number) => (
                            <div key={tx.hash} className="glass-card fade-in-up" style={{
                                padding: '16px',
                                border: '1px solid rgba(234, 179, 8, 0.2)',
                                background: 'rgba(234, 179, 8, 0.02)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                animationDelay: `${i * 0.1}s`
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '32px', height: '32px',
                                        borderRadius: '50%',
                                        background: 'rgba(234, 179, 8, 0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.8rem', fontWeight: 700, color: 'var(--warning)'
                                    }}>
                                        Tx
                                    </div>
                                    <div>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'white' }}>
                                            {tx.hash.slice(0, 10)}...
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            From: <span style={{ fontFamily: 'var(--font-mono)' }}>{tx.from.slice(0, 6)}...</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--success)' }}>
                                        {tx.valueFormatted || '0 SMC'}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        {tx.gasPrice} wei
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ padding: '16px', borderTop: '1px solid var(--glass-border)', textAlign: 'center' }}>
                <Link to="/transactions" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}>
                    View All Transactions <ArrowRight size={14} />
                </Link>
            </div>
        </div>
    );
}
