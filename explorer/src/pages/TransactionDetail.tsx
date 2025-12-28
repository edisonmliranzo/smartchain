import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import {
    Receipt,
    Hash,
    User,
    Fuel,
    FileText,
    ArrowLeft,
    ArrowRight,
    CheckCircle,
    XCircle,
    Clock,
    Blocks
} from 'lucide-react';

export default function TransactionDetail() {
    const { hash } = useParams<{ hash: string }>();

    const { data: tx, isLoading, error } = useQuery({
        queryKey: ['transaction', hash],
        queryFn: () => api.getTransaction(hash!),
        enabled: !!hash,
    });

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    if (isLoading) {
        return (
            <div className="container" style={{ paddingTop: '32px' }}>
                <div className="loader"><div className="spinner" /></div>
            </div>
        );
    }

    if (error || !tx) {
        return (
            <div className="container" style={{ paddingTop: '32px' }}>
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <h2>Transaction Not Found</h2>
                    <p style={{ color: '#a1a1aa', marginTop: '8px' }}>
                        The transaction you're looking for doesn't exist or is still pending.
                    </p>
                    <Link to="/transactions" className="btn btn-primary" style={{ marginTop: '20px' }}>
                        <ArrowLeft size={18} /> Back to Transactions
                    </Link>
                </div>
            </div>
        );
    }

    const isPending = !tx.blockNumber;
    const isSuccess = tx.receipt?.status === 'success';

    return (
        <div className="container" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <Link to="/transactions" style={{ color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                    <ArrowLeft size={16} /> Back to Transactions
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: isPending
                            ? 'rgba(245, 158, 11, 0.2)'
                            : isSuccess
                                ? 'rgba(16, 185, 129, 0.2)'
                                : 'rgba(239, 68, 68, 0.2)',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        {isPending ? (
                            <Clock size={28} style={{ color: '#f59e0b' }} />
                        ) : isSuccess ? (
                            <CheckCircle size={28} style={{ color: '#10b981' }} />
                        ) : (
                            <XCircle size={28} style={{ color: '#ef4444' }} />
                        )}
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                            Transaction Details
                        </h1>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            {isPending ? (
                                <span className="badge badge-warning">Pending</span>
                            ) : isSuccess ? (
                                <span className="badge badge-success">Success</span>
                            ) : (
                                <span className="badge badge-error">Failed</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction Details */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div className="card-header">
                    <h2 className="card-title">
                        <FileText size={20} />
                        Overview
                    </h2>
                </div>

                <div style={{ display: 'grid', gap: '20px' }}>
                    <DetailRow
                        icon={<Hash size={18} />}
                        label="Transaction Hash"
                        value={tx.hash}
                        mono
                    />
                    <DetailRow
                        icon={<Blocks size={18} />}
                        label="Block"
                        value={tx.blockNumber ? (
                            <Link to={`/block/${tx.blockNumber}`} style={{ color: '#22d3ee', fontWeight: 600 }}>
                                {tx.blockNumber}
                            </Link>
                        ) : (
                            <span style={{ color: '#f59e0b' }}>Pending</span>
                        )}
                    />
                    {tx.timestamp && (
                        <DetailRow
                            icon={<Clock size={18} />}
                            label="Timestamp"
                            value={formatDate(tx.timestamp)}
                        />
                    )}

                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '20px' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '20px',
                            flexWrap: 'wrap',
                        }}>
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <div style={{ color: '#a1a1aa', fontSize: '0.85rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <User size={16} /> From
                                </div>
                                <Link to={`/address/${tx.from}`} className="hash" style={{ fontSize: '0.95rem' }}>
                                    {tx.from}
                                </Link>
                            </div>
                            <ArrowRight size={24} style={{ color: '#7c3aed' }} />
                            <div style={{ flex: 1, minWidth: '200px' }}>
                                <div style={{ color: '#a1a1aa', fontSize: '0.85rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <User size={16} /> To
                                </div>
                                {tx.to ? (
                                    <Link to={`/address/${tx.to}`} className="hash" style={{ fontSize: '0.95rem' }}>
                                        {tx.to}
                                    </Link>
                                ) : (
                                    <span className="badge badge-success">Contract Created</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <DetailRow
                        icon={<Receipt size={18} />}
                        label="Value"
                        value={
                            <span style={{
                                color: '#10b981',
                                fontWeight: 600,
                                fontSize: '1.1rem',
                                fontFamily: 'var(--font-mono)',
                            }}>
                                {tx.valueFormatted}
                            </span>
                        }
                    />
                    <DetailRow
                        icon={<Fuel size={18} />}
                        label="Gas Price"
                        value={`${(Number(tx.gasPrice) / 1e9).toFixed(4)} Gwei`}
                    />
                    <DetailRow
                        icon={<Fuel size={18} />}
                        label="Gas Limit"
                        value={Number(tx.gasLimit).toLocaleString()}
                    />
                    {tx.receipt?.gasUsed && (
                        <DetailRow
                            icon={<Fuel size={18} />}
                            label="Gas Used"
                            value={`${Number(tx.receipt.gasUsed).toLocaleString()} (${((Number(tx.receipt.gasUsed) / Number(tx.gasLimit)) * 100).toFixed(2)}%)`}
                        />
                    )}
                    <DetailRow
                        icon={<Hash size={18} />}
                        label="Nonce"
                        value={tx.nonce}
                    />
                </div>
            </div>

            {/* Input Data */}
            {tx.data && tx.data !== '0x' && (
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">
                            <FileText size={20} />
                            Input Data
                        </h2>
                    </div>
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '8px',
                        padding: '16px',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.85rem',
                        wordBreak: 'break-all',
                        color: '#a1a1aa',
                        maxHeight: '200px',
                        overflow: 'auto',
                    }}>
                        {tx.data}
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
            gridTemplateColumns: '200px 1fr',
            gap: '16px',
            alignItems: 'start',
            padding: '12px 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#a1a1aa',
                fontSize: '0.9rem',
            }}>
                {icon}
                {label}
            </div>
            <div style={{
                fontFamily: mono ? 'var(--font-mono)' : 'inherit',
                wordBreak: 'break-all',
            }}>
                {value}
            </div>
        </div>
    );
}
