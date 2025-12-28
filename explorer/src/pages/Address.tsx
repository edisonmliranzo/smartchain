import { useQuery } from '@tanstack/react-query';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import {
    User,
    Wallet,
    Receipt,
    ArrowLeft,
    Copy,
    CheckCircle,
    Code,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useState } from 'react';

export default function Address() {
    const { address } = useParams<{ address: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = parseInt(searchParams.get('page') || '1');
    const [copied, setCopied] = useState(false);

    const { data: account, isLoading: accountLoading } = useQuery({
        queryKey: ['account', address],
        queryFn: () => api.getAccount(address!),
        enabled: !!address,
    });

    const { data: txData, isLoading: txLoading } = useQuery({
        queryKey: ['accountTransactions', address, page],
        queryFn: () => api.getAccountTransactions(address!, page, 20),
        enabled: !!address,
    });

    const copyToClipboard = () => {
        navigator.clipboard.writeText(address!);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const truncateHash = (hash: string, chars = 10) => {
        return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
    };

    const formatTimeAgo = (timestamp: number) => {
        if (!timestamp) return '-';
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    const handlePageChange = (newPage: number) => {
        setSearchParams({ page: newPage.toString() });
    };

    if (accountLoading) {
        return (
            <div className="container" style={{ paddingTop: '32px' }}>
                <div className="loader"><div className="spinner" /></div>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <Link to="/" style={{ color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: account?.isContract
                            ? 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)'
                            : 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        {account?.isContract ? <Code size={28} /> : <User size={28} />}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h1 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                {account?.isContract ? 'Contract' : 'Address'}
                            </h1>
                            {account?.isContract && (
                                <span className="badge badge-warning">Contract</span>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                            <code style={{
                                fontSize: '0.9rem',
                                color: '#22d3ee',
                                fontFamily: 'var(--font-mono)',
                            }}>
                                {address}
                            </code>
                            <button
                                onClick={copyToClipboard}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    color: copied ? '#10b981' : '#a1a1aa',
                                }}
                            >
                                {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Balance Card */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '24px',
                }}>
                    <div>
                        <div style={{ color: '#a1a1aa', fontSize: '0.85rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Wallet size={16} /> Balance
                        </div>
                        <div style={{
                            fontSize: '1.75rem',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            {account?.balanceFormatted || '0 SMC'}
                        </div>
                    </div>
                    <div>
                        <div style={{ color: '#a1a1aa', fontSize: '0.85rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Receipt size={16} /> Nonce
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                            {account?.nonce || 0}
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions */}
            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">
                        <Receipt size={20} />
                        Transactions
                    </h2>
                    {txData?.pagination && (
                        <span style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>
                            {txData.pagination.total} total
                        </span>
                    )}
                </div>

                {txLoading ? (
                    <div className="loader"><div className="spinner" /></div>
                ) : txData?.transactions?.length > 0 ? (
                    <>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Tx Hash</th>
                                        <th>Block</th>
                                        <th>Age</th>
                                        <th>From</th>
                                        <th>To</th>
                                        <th>Value</th>
                                        <th>Direction</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {txData.transactions.map((tx: any) => {
                                        const isIncoming = tx.to?.toLowerCase() === address?.toLowerCase();
                                        const isOutgoing = tx.from?.toLowerCase() === address?.toLowerCase();

                                        return (
                                            <tr key={tx.hash}>
                                                <td>
                                                    <Link to={`/tx/${tx.hash}`} className="hash">
                                                        {truncateHash(tx.hash)}
                                                    </Link>
                                                </td>
                                                <td>
                                                    {tx.blockNumber ? (
                                                        <Link to={`/block/${tx.blockNumber}`} style={{ color: '#22d3ee' }}>
                                                            {tx.blockNumber}
                                                        </Link>
                                                    ) : (
                                                        <span style={{ color: '#71717a' }}>Pending</span>
                                                    )}
                                                </td>
                                                <td style={{ color: '#a1a1aa' }}>
                                                    {formatTimeAgo(tx.timestamp)}
                                                </td>
                                                <td>
                                                    {tx.from.toLowerCase() === address?.toLowerCase() ? (
                                                        <span style={{ color: '#a1a1aa' }}>This Address</span>
                                                    ) : (
                                                        <Link to={`/address/${tx.from}`} className="hash">
                                                            {truncateHash(tx.from, 6)}
                                                        </Link>
                                                    )}
                                                </td>
                                                <td>
                                                    {tx.to ? (
                                                        tx.to.toLowerCase() === address?.toLowerCase() ? (
                                                            <span style={{ color: '#a1a1aa' }}>This Address</span>
                                                        ) : (
                                                            <Link to={`/address/${tx.to}`} className="hash">
                                                                {truncateHash(tx.to, 6)}
                                                            </Link>
                                                        )
                                                    ) : (
                                                        <span className="badge badge-success">Contract</span>
                                                    )}
                                                </td>
                                                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                                                    <span style={{ color: isIncoming ? '#10b981' : '#ef4444' }}>
                                                        {tx.valueFormatted}
                                                    </span>
                                                </td>
                                                <td>
                                                    {isIncoming && isOutgoing ? (
                                                        <span className="badge badge-primary">Self</span>
                                                    ) : isIncoming ? (
                                                        <span className="badge badge-success">IN</span>
                                                    ) : (
                                                        <span className="badge badge-error">OUT</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {txData?.pagination && txData.pagination.totalPages > 1 && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '16px',
                                marginTop: '24px',
                            }}>
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page <= 1}
                                    className="btn btn-secondary"
                                    style={{ opacity: page <= 1 ? 0.5 : 1 }}
                                >
                                    <ChevronLeft size={18} />
                                    Previous
                                </button>
                                <span style={{ color: '#a1a1aa' }}>
                                    Page {page} of {txData.pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page >= txData.pagination.totalPages}
                                    className="btn btn-secondary"
                                    style={{ opacity: page >= txData.pagination.totalPages ? 0.5 : 1 }}
                                >
                                    Next
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#71717a' }}>
                        No transactions found for this address
                    </div>
                )}
            </div>
        </div>
    );
}
