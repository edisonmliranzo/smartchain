import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { Blocks as BlocksIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Blocks() {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = parseInt(searchParams.get('page') || '1');

    const { data, isLoading } = useQuery({
        queryKey: ['blocks', page],
        queryFn: () => api.getBlocks(page, 20),
    });

    const formatTimeAgo = (timestamp: number) => {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    };

    const truncateHash = (hash: string, chars = 8) => {
        return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
    };

    const formatGas = (gas: string) => {
        const num = Number(gas);
        if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
        if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
        return num.toString();
    };

    const handlePageChange = (newPage: number) => {
        setSearchParams({ page: newPage.toString() });
    };

    return (
        <div className="container" style={{ paddingTop: '32px', paddingBottom: '32px' }}>
            <div className="card">
                <div className="card-header">
                    <h1 className="card-title">
                        <BlocksIcon size={24} />
                        Blocks
                    </h1>
                    {data?.pagination && (
                        <span style={{ color: '#a1a1aa', fontSize: '0.9rem' }}>
                            Total: {data.pagination.total.toLocaleString()} blocks
                        </span>
                    )}
                </div>

                {isLoading ? (
                    <div className="loader"><div className="spinner" /></div>
                ) : (
                    <>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Block</th>
                                        <th>Age</th>
                                        <th>Txns</th>
                                        <th>Validator</th>
                                        <th>Gas Used</th>
                                        <th>Gas Limit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data?.blocks?.map((block: any) => (
                                        <tr key={block.number}>
                                            <td>
                                                <Link
                                                    to={`/block/${block.number}`}
                                                    style={{ color: '#22d3ee', fontWeight: 600 }}
                                                >
                                                    {block.number.toLocaleString()}
                                                </Link>
                                            </td>
                                            <td style={{ color: '#a1a1aa' }}>
                                                {formatTimeAgo(block.timestamp)}
                                            </td>
                                            <td>
                                                <span className="badge badge-primary">
                                                    {block.transactionCount}
                                                </span>
                                            </td>
                                            <td>
                                                <Link
                                                    to={`/address/${block.miner}`}
                                                    className="hash"
                                                >
                                                    {truncateHash(block.miner, 6)}
                                                </Link>
                                            </td>
                                            <td style={{ fontFamily: 'var(--font-mono)' }}>
                                                {formatGas(block.gasUsed)}
                                            </td>
                                            <td style={{ fontFamily: 'var(--font-mono)', color: '#71717a' }}>
                                                {formatGas(block.gasLimit)}
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
                )}
            </div>
        </div>
    );
}
