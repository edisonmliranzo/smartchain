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
    ChevronRight,
    FileText,
    FileSpreadsheet
} from 'lucide-react';
import { useState } from 'react';
import QRCodeDisplay from '../components/QRCodeDisplay';
import NotificationSettings from '../components/NotificationSettings';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

export default function Address() {
    const { address } = useParams<{ address: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const page = parseInt(searchParams.get('page') || '1');
    const [copied, setCopied] = useState(false);
    const [showQR, setShowQR] = useState(false);

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

    const handleExportCSV = () => {
        if (txData?.transactions && address) {
            exportToCSV(txData.transactions, address);
        }
    };

    const handleExportPDF = () => {
        if (txData?.transactions && address) {
            exportToPDF(txData.transactions, address);
        }
    };

    if (accountLoading) {
        return (
            <div className="container" style={{ paddingTop: '100px' }}>
                <div className="loader"><div className="spinner" /></div>
            </div>
        );
    }

    return (
        <div className="container animate-in" style={{ paddingTop: '100px', paddingBottom: '32px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <Link to="/" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
                    <ArrowLeft size={16} /> Back to Dashboard
                </Link>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                background: account?.isContract
                                    ? 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)'
                                    : 'var(--gradient-primary)',
                                borderRadius: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                {account?.isContract ? <Code size={28} color="white" /> : <User size={28} color="white" />}
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                        {account?.isContract ? 'Contract' : 'Address'}
                                    </h1>
                                    {account?.isContract && (
                                        <span className="badge badge-warning">Contract</span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                                    <code style={{
                                        fontSize: '0.85rem',
                                        color: 'var(--secondary-light)',
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
                                            color: copied ? 'var(--success)' : 'var(--text-muted)',
                                        }}
                                    >
                                        {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => setShowQR(!showQR)}
                                className="btn btn-secondary glass"
                                style={{ fontSize: '0.85rem' }}
                            >
                                📱 {showQR ? 'Hide QR' : 'Show QR'}
                            </button>
                            {txData?.transactions?.length > 0 && (
                                <>
                                    <button
                                        onClick={handleExportCSV}
                                        className="btn btn-secondary glass"
                                        style={{ fontSize: '0.85rem' }}
                                    >
                                        <FileSpreadsheet size={16} />
                                        Export CSV
                                    </button>
                                    <button
                                        onClick={handleExportPDF}
                                        className="btn btn-primary"
                                        style={{ fontSize: '0.85rem' }}
                                    >
                                        <FileText size={16} />
                                        Export PDF
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* QR Code */}
                    {showQR && address && (
                        <QRCodeDisplay value={address} size={150} />
                    )}
                </div>
            </div>

            {/* Balance & Notifications Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                {/* Balance Card */}
                <div className="glass-card" style={{ padding: '24px', borderRadius: '20px' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '24px',
                    }}>
                        <div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Wallet size={16} /> Balance
                            </div>
                            <div className="gradient-text" style={{
                                fontSize: '1.75rem',
                                fontWeight: 700,
                            }}>
                                {account?.balanceFormatted || '0 SMC'}
                            </div>
                        </div>
                        <div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Receipt size={16} /> Nonce
                            </div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                                {account?.nonce || 0}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notification Settings */}
                <NotificationSettings />
            </div>

            {/* Transactions */}
            <div className="glass-card" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                <div className="card-header" style={{ padding: '20px 24px' }}>
                    <h2 className="card-title">
                        <Receipt size={20} />
                        Transactions
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {txData?.pagination && (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                {txData.pagination.total} total
                            </span>
                        )}
                    </div>
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
                                                        <Link to={`/block/${tx.blockNumber}`} style={{ color: 'var(--secondary-light)' }}>
                                                            {tx.blockNumber}
                                                        </Link>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-muted)' }}>Pending</span>
                                                    )}
                                                </td>
                                                <td style={{ color: 'var(--text-secondary)' }}>
                                                    {formatTimeAgo(tx.timestamp)}
                                                </td>
                                                <td>
                                                    {tx.from.toLowerCase() === address?.toLowerCase() ? (
                                                        <span style={{ color: 'var(--text-secondary)' }}>This Address</span>
                                                    ) : (
                                                        <Link to={`/address/${tx.from}`} className="hash">
                                                            {truncateHash(tx.from, 6)}
                                                        </Link>
                                                    )}
                                                </td>
                                                <td>
                                                    {tx.to ? (
                                                        tx.to.toLowerCase() === address?.toLowerCase() ? (
                                                            <span style={{ color: 'var(--text-secondary)' }}>This Address</span>
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
                                                    <span style={{ color: isIncoming ? 'var(--success)' : 'var(--error)' }}>
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
                                padding: '24px',
                            }}>
                                <button
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page <= 1}
                                    className="btn btn-secondary glass"
                                    style={{ opacity: page <= 1 ? 0.5 : 1 }}
                                >
                                    <ChevronLeft size={18} />
                                    Previous
                                </button>
                                <span style={{ color: 'var(--text-secondary)' }}>
                                    Page {page} of {txData.pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page >= txData.pagination.totalPages}
                                    className="btn btn-secondary glass"
                                    style={{ opacity: page >= txData.pagination.totalPages ? 0.5 : 1 }}
                                >
                                    Next
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                        <Receipt size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
                        <p>No transactions found for this address</p>
                    </div>
                )}
            </div>
        </div>
    );
}

