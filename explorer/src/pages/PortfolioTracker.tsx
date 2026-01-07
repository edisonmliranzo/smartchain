import { useState, useEffect } from 'react';
import { Briefcase, PieChart, DollarSign, Wallet, History, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';

interface Holding {
    token: string;
    symbol: string;
    amount: number;
    price: number;
    value: number;
    costBasis: number;
    pnl: number;
    pnlPercent: number;
    change24h: number;
    allocation: number;
}

interface Transaction {
    type: 'buy' | 'sell' | 'receive' | 'send';
    token: string;
    amount: number;
    price: number;
    value: number;
    date: Date;
    hash: string;
}

export default function PortfolioTracker() {
    const { account } = useWeb3();
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<'holdings' | 'history'>('holdings');
    const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>('24h');

    useEffect(() => {
        fetchPortfolio();
    }, [account]);

    async function fetchPortfolio() {
        setLoading(true);
        try {
            // Mock holdings data
            const mockHoldings: Holding[] = [
                {
                    token: 'SmartChain',
                    symbol: 'SMART',
                    amount: 15420.50,
                    price: 2.45,
                    value: 37780.23,
                    costBasis: 28500,
                    pnl: 9280.23,
                    pnlPercent: 32.56,
                    change24h: 5.2,
                    allocation: 0
                },
                {
                    token: 'Wrapped Ether',
                    symbol: 'WETH',
                    amount: 3.25,
                    price: 2340.50,
                    value: 7606.63,
                    costBasis: 8500,
                    pnl: -893.37,
                    pnlPercent: -10.51,
                    change24h: -2.3,
                    allocation: 0
                },
                {
                    token: 'Tether USD',
                    symbol: 'USDT',
                    amount: 5000,
                    price: 1.00,
                    value: 5000,
                    costBasis: 5000,
                    pnl: 0,
                    pnlPercent: 0,
                    change24h: 0.01,
                    allocation: 0
                },
                {
                    token: 'Wrapped Bitcoin',
                    symbol: 'WBTC',
                    amount: 0.085,
                    price: 43250,
                    value: 3676.25,
                    costBasis: 3200,
                    pnl: 476.25,
                    pnlPercent: 14.88,
                    change24h: 1.8,
                    allocation: 0
                },
            ];

            // Calculate allocations
            const totalValue = mockHoldings.reduce((sum, h) => sum + h.value, 0);
            mockHoldings.forEach(h => h.allocation = (h.value / totalValue) * 100);

            // Mock transactions
            const mockTransactions: Transaction[] = [
                { type: 'buy', token: 'SMART', amount: 5000, price: 2.35, value: 11750, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), hash: '0xabc123...' },
                { type: 'receive', token: 'SMART', amount: 1250, price: 2.42, value: 3025, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), hash: '0xdef456...' },
                { type: 'sell', token: 'WETH', amount: 0.5, price: 2380, value: 1190, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), hash: '0x789abc...' },
                { type: 'buy', token: 'WBTC', amount: 0.085, price: 37647, value: 3200, date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), hash: '0xabc789...' },
                { type: 'send', token: 'USDT', amount: 2500, price: 1.00, value: 2500, date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), hash: '0xdef123...' },
            ];

            setHoldings(mockHoldings);
            setTransactions(mockTransactions);
            setLoading(false);
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    }

    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const totalCostBasis = holdings.reduce((sum, h) => sum + h.costBasis, 0);
    const totalPnL = holdings.reduce((sum, h) => sum + h.pnl, 0);
    const totalPnLPercent = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;
    const dayChange = holdings.reduce((sum, h) => sum + (h.value * h.change24h / 100), 0);

    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '8px 20px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '30px', marginBottom: '16px' }}>
                    <Briefcase size={18} color="#10b981" />
                    <span style={{ color: '#10b981', fontWeight: 600, letterSpacing: '2px', fontSize: '0.8rem' }}>PORTFOLIO</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>
                            Portfolio Tracker
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Track all your holdings with P&L calculations
                        </p>
                    </div>
                    <button
                        onClick={fetchPortfolio}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <RefreshCw size={18} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Portfolio Summary */}
            <div className="glass-card" style={{
                padding: '32px',
                borderRadius: '24px',
                marginBottom: '32px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)'
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '32px', alignItems: 'center' }}>
                    <div>
                        <div style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>Total Portfolio Value</div>
                        <div style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '12px' }}>
                            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div style={{ display: 'flex', gap: '24px' }}>
                            <div>
                                <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>24h Change:</span>
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    color: dayChange >= 0 ? '#10b981' : '#ef4444',
                                    fontWeight: 600
                                }}>
                                    {dayChange >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                                    ${Math.abs(dayChange).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div>
                                <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>Total P&L:</span>
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    color: totalPnL >= 0 ? '#10b981' : '#ef4444',
                                    fontWeight: 600
                                }}>
                                    {totalPnL >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}% (${totalPnL >= 0 ? '+' : ''}{totalPnL.toLocaleString(undefined, { maximumFractionDigits: 2 })})
                                </span>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div className="glass-card" style={{ padding: '16px 24px', borderRadius: '16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{holdings.length}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Assets</div>
                        </div>
                        <div className="glass-card" style={{ padding: '16px 24px', borderRadius: '16px', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{transactions.length}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Transactions</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => setView('holdings')}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            background: view === 'holdings' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                            color: 'var(--text-primary)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <PieChart size={18} />
                        Holdings
                    </button>
                    <button
                        onClick={() => setView('history')}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            background: view === 'history' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                            color: 'var(--text-primary)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <History size={18} />
                        History
                    </button>
                </div>
                {view === 'history' && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {(['24h', '7d', '30d', 'all'] as const).map(tf => (
                            <button
                                key={tf}
                                onClick={() => setTimeframe(tf)}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: timeframe === tf ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem'
                                }}
                            >
                                {tf.toUpperCase()}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                {/* Main Content */}
                <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                    {view === 'holdings' ? (
                        <>
                            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Wallet size={20} color="var(--primary)" />
                                Your Holdings
                            </h3>

                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                    Loading portfolio...
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500 }}>Asset</th>
                                                <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 500 }}>Balance</th>
                                                <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 500 }}>Price</th>
                                                <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 500 }}>Value</th>
                                                <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 500 }}>P&L</th>
                                                <th style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 500 }}>24h</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {holdings.map((holding, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                    <td style={{ padding: '16px 12px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{
                                                                width: '40px',
                                                                height: '40px',
                                                                borderRadius: '12px',
                                                                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontWeight: 700
                                                            }}>
                                                                {holding.symbol.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 600 }}>{holding.token}</div>
                                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{holding.symbol}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                                        <div style={{ fontWeight: 500 }}>{holding.amount.toLocaleString()}</div>
                                                    </td>
                                                    <td style={{ padding: '16px 12px', textAlign: 'right', color: 'var(--text-muted)' }}>
                                                        ${holding.price.toLocaleString()}
                                                    </td>
                                                    <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                                        <div style={{ fontWeight: 600 }}>${holding.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{holding.allocation.toFixed(1)}%</div>
                                                    </td>
                                                    <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                                        <div style={{ color: holding.pnl >= 0 ? '#10b981' : '#ef4444', fontWeight: 500 }}>
                                                            {holding.pnl >= 0 ? '+' : ''}${holding.pnl.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: holding.pnlPercent >= 0 ? '#10b981' : '#ef4444' }}>
                                                            {holding.pnlPercent >= 0 ? '+' : ''}{holding.pnlPercent.toFixed(2)}%
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            color: holding.change24h >= 0 ? '#10b981' : '#ef4444'
                                                        }}>
                                                            {holding.change24h >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                                            {Math.abs(holding.change24h)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <History size={20} color="var(--primary)" />
                                Transaction History
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {transactions.map((tx, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            padding: '16px',
                                            borderRadius: '16px',
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid var(--glass-border)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <TxTypeIcon type={tx.type} />
                                            <div>
                                                <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                                                    {tx.type} {tx.token}
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                    {tx.date.toLocaleDateString()} at {tx.date.toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 600, color: tx.type === 'buy' || tx.type === 'receive' ? '#10b981' : '#ef4444' }}>
                                                {tx.type === 'buy' || tx.type === 'receive' ? '+' : '-'}{tx.amount.toLocaleString()} {tx.token}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                ${tx.value.toLocaleString()} @ ${tx.price.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Allocation Pie Chart */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <PieChart size={20} color="#f59e0b" />
                            Allocation
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {holdings.map((holding, i) => (
                                <div key={i}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                        <span style={{ fontWeight: 500 }}>{holding.symbol}</span>
                                        <span style={{ color: 'var(--text-muted)' }}>{holding.allocation.toFixed(1)}%</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${holding.allocation}%`,
                                            background: `hsl(${140 + i * 50}, 70%, 50%)`,
                                            borderRadius: '4px',
                                            transition: 'width 0.3s'
                                        }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                        <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <DollarSign size={20} color="#10b981" />
                            P&L Summary
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <SummaryRow label="Cost Basis" value={`$${totalCostBasis.toLocaleString()}`} />
                            <SummaryRow label="Current Value" value={`$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
                            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px' }}>
                                <SummaryRow
                                    label="Total P&L"
                                    value={`${totalPnL >= 0 ? '+' : ''}$${totalPnL.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                                    color={totalPnL >= 0 ? '#10b981' : '#ef4444'}
                                    large
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TxTypeIcon({ type }: { type: string }) {
    const colors: Record<string, string> = { buy: '#10b981', sell: '#ef4444', receive: '#3b82f6', send: '#f59e0b' };
    const icons: Record<string, React.ReactNode> = {
        buy: <ArrowDownRight size={20} />,
        sell: <ArrowUpRight size={20} />,
        receive: <ArrowDownRight size={20} />,
        send: <ArrowUpRight size={20} />
    };
    return (
        <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: `${colors[type]}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors[type]
        }}>
            {icons[type]}
        </div>
    );
}

function SummaryRow({ label, value, color, large }: { label: string; value: string; color?: string; large?: boolean }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ fontWeight: large ? 700 : 500, fontSize: large ? '1.2rem' : '1rem', color }}>{value}</span>
        </div>
    );
}
