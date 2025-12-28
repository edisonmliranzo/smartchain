import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { Receipt, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Transactions() {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = parseInt(searchParams.get('page') || '1');

    const { data, isLoading } = useQuery({
        queryKey: ['transactions', page],
        queryFn: () => api.getTransactions(page, 20),
    });

    const { data: pending } = useQuery({
        queryKey: ['pendingTransactions'],
        queryFn: api.getPendingTransactions,
    });

    const formatTimeAgo = (timestamp: number) => {
        if (!timestamp) return 'Pending';
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    const truncateHash = (hash: string, chars = 10) => {
        return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
    };

    const handlePageChange = (newPage: number) => {
        setSearchParams({ page: newPage.toString() });
    };

    const allTransactions = [
        ...(pending?.transactions || []).map((tx: any) => ({ ...tx, isPending: true })),
        ...(data?.transactions || []),
    ];

    return (
        <div className="container" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
            <div className="card">
                <div className="card-header">
                    <h1 className="card-title">
                        <Receipt size={24} />
                        Transactions
                    </h1>
                    {pending?.count > 0 && (
                        <span className="badge badge-warning">
                            {pending.count} Pending
                        </span>
                    )}
                </div>

                {isLoading ? (
                    <div className="loader"><div className="spinner" /></div>
                ) : allTransactions.length > 0 ? (
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
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allTransactions.map((tx: any) => (
                                        <tr key={tx.hash}>
                                            <td>
                                                <Link
                                                    to={`/tx/${tx.hash}`}
                                                    className="hash"
                                                    style={{ fontWeight: 500 }}
                                                >
                                                    {truncateHash(tx.hash)}
                                                </Link>
                                            </td>
                                            <td>
                                                {tx.blockNumber ? (
                                                    <Link
                                                        to={`/block/${tx.blockNumber}`}
                                                        style={{ color: '#22d3ee', fontWeight: 500 }}
                                                    >
                                                        {tx.blockNumber}
                                                    </Link>
                                                ) : (
                                                    <span style={{ color: '#71717a' }}>-</span>
                                                )}
                                            </td>
                                            <td style={{ color: '#a1a1aa' }}>
                                                {formatTimeAgo(tx.timestamp)}
                                            </td>
                                            <td>
                                                <Link to={`/address/${tx.from}`} className="hash">
                                                    {truncateHash(tx.from, 6)}
                                                </Link>
                                            </td>
                                            <td>
                                                {tx.to ? (
                                                    <Link to={`/address/${tx.to}`} className="hash">
                                                        {truncateHash(tx.to, 6)}
                                                    </Link>
                                                ) : (
                                                    <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                                                        Contract
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{
                                                color: '#10b981',
                                                fontFamily: 'var(--font-mono)',
                                                fontWeight: 500,
                                            }}>
                                                {tx.valueFormatted}
                                            </td>
                                            <td>
                                                {tx.isPending ? (
                                                    <span className="badge badge-warning">Pending</span>
                                                ) : (
                                                    <span className="badge badge-success">Success</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {data?.pagination && data.pagination.totalPages > 1 && (
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
                                    Page {page} of {data.pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page >= data.pagination.totalPages}
                                    className="btn btn-secondary"
                                    style={{ opacity: page >= data.pagination.totalPages ? 0.5 : 1 }}
                                >
                                    Next
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#71717a' }}>
                        <Receipt size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                        <p>No transactions yet</p>
                        <Link to="/faucet" className="btn btn-primary" style={{ marginTop: '16px' }}>
                            Get Test Tokens from Faucet
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
