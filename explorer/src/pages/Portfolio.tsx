
import { useQuery } from '@tanstack/react-query';
import { useWeb3 } from '../contexts/Web3Context';
import { api } from '../api';
import { Wallet, PieChart, ArrowUpRight, ArrowDownLeft, TrendingUp, Activity, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Portfolio() {
    const { account, connectWallet } = useWeb3();

    // Fetch user specific data
    const { data: balanceData } = useQuery({
        queryKey: ['balance', account],
        queryFn: () => account ? api.getAccount(account) : null,
        enabled: !!account,
        refetchInterval: 5000
    });

    const { data: userTxs } = useQuery({
        queryKey: ['transactions', account],
        queryFn: () => account ? api.getAccountTransactions(account) : [],
        enabled: !!account,
        refetchInterval: 5000
    });

    // Mock data for "Net Worth" chart
    const chartData = [10, 25, 18, 30, 45, 38, 55, 60, 48, 70, 75, 90];

    if (!account) {
        return (
            <div className="container animate-in" style={{ paddingTop: '64px', textAlign: 'center' }}>
                <div className="glass-card" style={{ padding: '60px', borderRadius: '30px', maxWidth: '600px', margin: '0 auto' }}>
                    <Wallet size={64} style={{ color: 'var(--text-muted)', marginBottom: '24px' }} />
                    <h1 style={{ marginBottom: '16px' }}>Connect Your Wallet</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                        Connect your wallet to view your portfolio analytics, asset breakdown, and transaction history.
                    </p>
                    <button onClick={connectWallet} className="btn btn-primary shine-effect" style={{ padding: '12px 32px', fontSize: '1.1rem' }}>
                        Connect Wallet
                    </button>
                </div>
            </div>
        );
    }

    const smcBalance = balanceData?.balanceFormatted || "0";
    const smcBalanceNum = parseFloat(smcBalance);
    // Mock USD Price for demo
    const smcPrice = 1.25;
    const totalValue = (smcBalanceNum * smcPrice).toFixed(2);

    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
            {/* Header / Net Worth */}
            <div className="glass-card" style={{
                padding: '40px',
                borderRadius: '30px',
                marginBottom: '32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'end',
                background: 'linear-gradient(135deg, rgba(8,8,16,0.8) 0%, rgba(20,20,35,0.8) 100%)'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                        <PieChart size={18} /> Net Worth
                    </div>
                    <div className="gradient-text" style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1 }}>
                        ${totalValue}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', color: 'var(--success)' }}>
                        <TrendingUp size={16} /> +12.5% vs last week (Demo)
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'white' }}>{smcBalance} SMC</div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>@ ${smcPrice.toFixed(2)}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>

                {/* Main Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    {/* Performance Chart (CSS Implementation) */}
                    <div className="glass-card" style={{ padding: '32px', borderRadius: '24px' }}>
                        <div className="card-header" style={{ marginBottom: '32px' }}>
                            <h2 className="card-title"><Activity size={20} /> Performance (30d)</h2>
                        </div>
                        <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '10px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
                            {chartData.map((val, i) => (
                                <div key={i} style={{
                                    width: '100%',
                                    height: `${val}%`,
                                    background: 'var(--gradient-primary)',
                                    borderRadius: '4px',
                                    opacity: 0.7 + (i / 20),
                                    transition: 'all 0.3s'
                                }} className="shine-effect"></div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            <span>30 Days Ago</span>
                            <span>Today</span>
                        </div>
                    </div>

                    {/* Recent Transactions List */}
                    <div className="glass-card" style={{ padding: '0', borderRadius: '24px', overflow: 'hidden' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)' }}>
                            <h2 className="card-title">Recent Activity</h2>
                        </div>
                        <div>
                            {userTxs && userTxs.length > 0 ? (
                                userTxs.slice(0, 5).map((tx: any) => {
                                    const isReceive = tx.to?.toLowerCase() === account.toLowerCase();
                                    return (
                                        <div key={tx.hash} style={{
                                            padding: '20px 24px',
                                            borderBottom: '1px solid var(--glass-border)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                <div style={{
                                                    width: '40px', height: '40px',
                                                    borderRadius: '12px',
                                                    background: isReceive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                    color: isReceive ? 'var(--success)' : 'var(--error)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    {isReceive ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                                                        {isReceive ? 'Received' : 'Sent'}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                        <Link to={`/tx/${tx.hash}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                                            {new Date(tx.timestamp).toLocaleString()}
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 700, color: isReceive ? 'var(--success)' : 'white' }}>
                                                    {isReceive ? '+' : '-'}{tx.valueFormatted} SMC
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    Fee: 0.00042
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                    No transaction history found.
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Your Assets */}
                    <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                        <h2 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '20px' }}>Your Assets</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', fontWeight: 800 }}>S</div>
                                    <div>
                                        <div style={{ fontWeight: 700 }}>SmartChain</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SMC</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700 }}>{smcBalance}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>${totalValue}</div>
                                </div>
                            </div>
                            {/* Placeholder for Created Tokens */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.5 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800 }}>D</div>
                                    <div>
                                        <div style={{ fontWeight: 700 }}>Demo Token</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DMT</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700 }}>0.00</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>$0.00</div>
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                            <Link to="/create-token" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-light)', fontSize: '0.9rem', textDecoration: 'none', fontWeight: 600 }}>
                                <CreditCard size={16} /> Create New Asset
                            </Link>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Transactions</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{userTxs?.transactions?.length || 0}</div>
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Gas Spent</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{(userTxs?.transactions?.length || 0) * 0.004} <span style={{ fontSize: '0.8rem' }}>SMC</span></div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
