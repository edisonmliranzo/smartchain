import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import {
    Blocks,
    Clock,
    Hash,
    User,
    Fuel,
    FileText,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Receipt,
    Box,
    Layers
} from 'lucide-react';

export default function BlockDetail() {
    const { identifier } = useParams<{ identifier: string }>();

    const { data: block, isLoading, error } = useQuery({
        queryKey: ['block', identifier],
        queryFn: () => api.getBlock(identifier!),
        enabled: !!identifier,
        refetchInterval: 5000,
    });

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    const truncateHash = (hash: string, chars = 12) => {
        return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
    };

    if (isLoading) {
        return (
            <div className="container" style={{ paddingTop: '32px' }}>
                <div className="loader"><div className="spinner" /></div>
            </div>
        );
    }

    if (error || !block) {
        return (
            <div className="container" style={{ paddingTop: '32px' }}>
                <div className="glass-card" style={{ textAlign: 'center', padding: '60px', borderRadius: '24px' }}>
                    <h2>Block Not Found</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                        The block you're looking for doesn't exist.
                    </p>
                    <Link to="/blocks" className="btn btn-primary" style={{ marginTop: '20px' }}>
                        <ArrowLeft size={18} /> Back to Blocks
                    </Link>
                </div>
            </div>
        );
    }

    // Calculate Block Stats
    const gasUsed = Number(block.gasUsed);
    const gasLimit = Number(block.gasLimit);
    const gasPercentage = ((gasUsed / gasLimit) * 100).toFixed(2);

    // Analyze Transactions
    let valueTransfers = 0;
    let contractCalls = 0;
    let contractCreations = 0;

    block.transactions.forEach((tx: any) => {
        if (!tx.to) {
            contractCreations++;
        } else if (tx.data && tx.data !== '0x') {
            contractCalls++;
        } else {
            valueTransfers++;
        }
    });

    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
            {/* Navigation Header */}
            <div style={{ marginBottom: '32px' }}>
                <Link to="/blocks" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', fontSize: '0.9rem' }}>
                    <ArrowLeft size={16} /> Back to Blocks
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                    <div className="shine-effect" style={{
                        width: '72px',
                        height: '72px',
                        background: 'var(--gradient-primary)',
                        borderRadius: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)'
                    }}>
                        <Blocks size={36} color="white" />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0, lineHeight: 1 }}>
                                Block #{block.number.toLocaleString()}
                            </h1>
                            <span className="badge badge-success" style={{ fontSize: '0.8rem', padding: '4px 8px' }}>FINALIZED</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '1.1rem' }}>
                            Mined by <Link to={`/address/${block.miner}`} style={{ color: 'var(--primary-light)', fontWeight: 600 }}>{truncateHash(block.miner, 4)}</Link> on {formatDate(block.timestamp)}
                        </p>
                    </div>

                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                        <Link to={`/block/${block.number - 1}`} className="btn btn-secondary glass" style={{ height: '44px', width: '44px', padding: 0, justifyContent: 'center' }}>
                            <ChevronLeft size={20} />
                        </Link>
                        <Link to={`/block/${block.number + 1}`} className="btn btn-secondary glass" style={{ height: '44px', width: '44px', padding: 0, justifyContent: 'center' }}>
                            <ChevronRight size={20} />
                        </Link>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
                {/* Main Block Details */}
                <div className="glass-card" style={{ borderRadius: '24px', padding: '0' }}>
                    <div className="card-header" style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)' }}>
                        <h2 className="card-title">
                            <Box size={20} style={{ color: 'var(--primary-light)' }} />
                            Overview
                        </h2>
                    </div>

                    <div style={{ padding: '0 24px' }}>
                        <DetailRow
                            icon={<Hash size={18} />}
                            label="Block Hash"
                            value={block.hash}
                            mono
                        />
                        <DetailRow
                            icon={<Receipt size={18} />}
                            label="Transactions"
                            value={`${block.transactionCount} transactions`}
                        />
                        <DetailRow
                            icon={<Clock size={18} />}
                            label="Timestamp"
                            value={`${formatDate(block.timestamp)} (${Math.floor((Date.now() - block.timestamp) / 1000)}s ago)`}
                        />
                        <DetailRow
                            icon={<Fuel size={18} />}
                            label="Gas Used"
                            value={
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                        <span style={{ fontWeight: 600 }}>{gasUsed.toLocaleString()}</span>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>({gasPercentage}%)</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${gasPercentage}%`,
                                            height: '100%',
                                            background: Number(gasPercentage) > 80 ? 'var(--error)' : 'var(--success)',
                                            borderRadius: '3px'
                                        }} />
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        Target: {gasLimit.toLocaleString()} Gas
                                    </div>
                                </div>
                            }
                        />
                        <DetailRow
                            icon={<FileText size={18} />}
                            label="Extra Data"
                            value={block.extraData !== '0x' ? block.extraData : 'None'}
                            mono
                        />
                    </div>
                </div>

                {/* Side Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Validator Card */}
                    <div className="glass-card" style={{ borderRadius: '24px', padding: '24px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <User size={18} style={{ color: 'var(--accent)' }} />
                            Validator
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '50%', background: 'var(--accent)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 800, color: '#000'
                            }}>
                                {block.miner.substring(2, 4).toUpperCase()}
                            </div>
                            <div>
                                <Link to={`/address/${block.miner}`} className="address" style={{ fontSize: '1rem' }}>
                                    {truncateHash(block.miner)}
                                </Link>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Proposer</div>
                            </div>
                        </div>
                    </div>

                    {/* Tx Composition */}
                    <div className="glass-card" style={{ borderRadius: '24px', padding: '24px' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Layers size={18} style={{ color: 'var(--secondary-light)' }} />
                            Block Composition
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <StatRow label="Value Transfers" value={valueTransfers} total={block.transactions.length} color="var(--success)" />
                            <StatRow label="Contract Calls" value={contractCalls} total={block.transactions.length} color="var(--primary-light)" />
                            <StatRow label="Contract Deploys" value={contractCreations} total={block.transactions.length} color="var(--accent)" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            {block.transactions && block.transactions.length > 0 && (
                <div className="glass-card" style={{ borderRadius: '24px' }}>
                    <div className="card-header" style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)' }}>
                        <h2 className="card-title">
                            <Receipt size={20} />
                            Transactions
                            <span className="badge glass" style={{ marginLeft: '12px', fontSize: '0.8rem' }}>{block.transactions.length}</span>
                        </h2>
                    </div>

                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th style={{ paddingLeft: '24px' }}>Type</th>
                                    <th>Tx Hash</th>
                                    <th>From</th>
                                    <th>To</th>
                                    <th>Value</th>
                                    <th>Fee</th>
                                </tr>
                            </thead>
                            <tbody>
                                {block.transactions.map((tx: any, index: number) => {
                                    let type = 'Transfer';
                                    let typeColor = 'var(--success)';
                                    if (!tx.to) { type = 'Deploy'; typeColor = 'var(--accent)'; }
                                    else if (tx.data && tx.data !== '0x') { type = 'Call'; typeColor = 'var(--primary-light)'; }

                                    return (
                                        <tr key={tx.hash || index}>
                                            <td style={{ paddingLeft: '24px' }}>
                                                <span className="badge" style={{
                                                    background: `rgba(${typeColor === 'var(--success)' ? '16, 185, 129' : typeColor === 'var(--accent)' ? '245, 158, 11' : '124, 58, 237'}, 0.1)`,
                                                    color: typeColor,
                                                    border: `1px solid ${typeColor}`,
                                                    fontSize: '0.7rem'
                                                }}>
                                                    {type}
                                                </span>
                                            </td>
                                            <td>
                                                <Link to={`/tx/${tx.hash}`} className="address">
                                                    {truncateHash(tx.hash, 8)}
                                                </Link>
                                            </td>
                                            <td>
                                                <Link to={`/address/${tx.from}`} className="address">
                                                    {truncateHash(tx.from, 6)}
                                                </Link>
                                            </td>
                                            <td>
                                                {tx.to ? (
                                                    <Link to={`/address/${tx.to}`} className="address">
                                                        {truncateHash(tx.to, 6)}
                                                    </Link>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Contract Creation</span>
                                                )}
                                                {tx.to === block.miner && <span className="badge badge-warning" style={{ marginLeft: '6px', fontSize: '0.6rem' }}>Validator</span>}
                                            </td>
                                            <td style={{ fontWeight: 600 }}>
                                                {tx.valueFormatted.split(' ')[0]} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SMC</span>
                                            </td>
                                            <td style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                                {(Number(tx.gasPrice) / 1e9).toFixed(2)} Gwei
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function DetailRow({
    icon,
    label,
    value,
    mono = false
}: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    mono?: boolean;
}) {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: '180px 1fr',
            gap: '16px',
            alignItems: 'start',
            padding: '20px 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontWeight: 500
            }}>
                {icon}
                {label}
            </div>
            <div style={{
                fontFamily: mono ? 'var(--font-mono)' : 'inherit',
                wordBreak: 'break-all',
                color: 'white',
                fontSize: '0.95rem'
            }}>
                {value}
            </div>
        </div>
    );
}

function StatRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
    const percentage = total > 0 ? (value / total) * 100 : 0;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontWeight: 700 }}>{value}</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${percentage}%`, height: '100%', background: color }} />
            </div>
        </div>
    );
}
