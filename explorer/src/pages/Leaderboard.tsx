import { useState } from 'react';
import { Trophy, Medal, Crown, TrendingUp, Wallet, Flame, Star, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const LEADERBOARD_DATA = {
    topHolders: [
        { rank: 1, address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', balance: '1,000,000,000', label: 'Genesis Validator', change: '+0.0%' },
        { rank: 2, address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8', balance: '500,000,000', label: 'Validator #2', change: '+0.0%' },
        { rank: 3, address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', balance: '1,000,000', label: 'Dev Fund', change: '+0.0%' },
        { rank: 4, address: '0xAbC123...789DeF', balance: '847,293', label: null, change: '+12.4%' },
        { rank: 5, address: '0x1a2B3c...4D5e6F', balance: '523,847', label: null, change: '-3.2%' },
        { rank: 6, address: '0x7G8h9I...JkLmNo', balance: '412,156', label: null, change: '+8.7%' },
        { rank: 7, address: '0xPqRsT...UvWxYz', balance: '356,892', label: null, change: '+1.2%' },
        { rank: 8, address: '0xAa1Bb...Cc2Dd3', balance: '287,421', label: null, change: '-0.5%' },
    ],
    mostActive: [
        { rank: 1, address: '0x1a2B3c...4D5e6F', txCount: 12847, label: 'Bot 🤖', change: '+524' },
        { rank: 2, address: '0xAbC123...789DeF', txCount: 8421, label: null, change: '+312' },
        { rank: 3, address: '0x7G8h9I...JkLmNo', txCount: 5673, label: null, change: '+156' },
        { rank: 4, address: '0xPqRsT...UvWxYz', txCount: 4521, label: null, change: '+98' },
        { rank: 5, address: '0xAa1Bb...Cc2Dd3', txCount: 3892, label: null, change: '+45' },
    ],
    topGasSpenders: [
        { rank: 1, address: '0x1a2B3c...4D5e6F', gas: '847.2M', label: 'DEX Router', change: '+12.4%' },
        { rank: 2, address: '0xAbC123...789DeF', gas: '523.1M', label: null, change: '+8.2%' },
        { rank: 3, address: '0x7G8h9I...JkLmNo', gas: '412.7M', label: null, change: '-2.1%' },
    ],
    tokenCreators: [
        { rank: 1, address: '0xf39Fd6...92266', tokens: 47, label: 'Token Factory King 👑', lastToken: 'PEPE2' },
        { rank: 2, address: '0xAbC123...789DeF', tokens: 23, label: null, lastToken: 'MOON' },
        { rank: 3, address: '0x1a2B3c...4D5e6F', tokens: 18, label: null, lastToken: 'DOGE2' },
    ]
};

type TabType = 'holders' | 'active' | 'gas' | 'creators';

export default function Leaderboard() {
    const [activeTab, setActiveTab] = useState<TabType>('holders');

    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '8px 20px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '30px', marginBottom: '16px' }}>
                    <Trophy size={18} color="#f59e0b" />
                    <span style={{ color: '#f59e0b', fontWeight: 600, letterSpacing: '2px', fontSize: '0.8rem' }}>LEADERBOARDS</span>
                </div>
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>
                    Top Performers
                </h1>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
                    See who's leading the SmartChain ecosystem
                </p>
            </div>

            {/* Top 3 Podium */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '24px', marginBottom: '48px' }}>
                <PodiumCard rank={2} data={LEADERBOARD_DATA.topHolders[1]} />
                <PodiumCard rank={1} data={LEADERBOARD_DATA.topHolders[0]} />
                <PodiumCard rank={3} data={LEADERBOARD_DATA.topHolders[2]} />
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}>
                {[
                    { id: 'holders', label: 'Top Holders', icon: <Wallet size={18} /> },
                    { id: 'active', label: 'Most Active', icon: <Flame size={18} /> },
                    { id: 'gas', label: 'Gas Spenders', icon: <TrendingUp size={18} /> },
                    { id: 'creators', label: 'Token Creators', icon: <Star size={18} /> },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 24px',
                            borderRadius: '14px',
                            border: 'none',
                            background: activeTab === tab.id ? 'var(--gradient-primary)' : 'rgba(255,255,255,0.05)',
                            color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.95rem'
                        }}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Leaderboard Table */}
            <div className="glass-card" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr 150px 100px 50px',
                    padding: '16px 24px',
                    background: 'rgba(0,0,0,0.2)',
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600
                }}>
                    <span>Rank</span>
                    <span>Address</span>
                    <span style={{ textAlign: 'right' }}>
                        {activeTab === 'holders' ? 'Balance' : activeTab === 'active' ? 'Transactions' : activeTab === 'gas' ? 'Gas Used' : 'Tokens'}
                    </span>
                    <span style={{ textAlign: 'right' }}>Change</span>
                    <span></span>
                </div>

                {/* Rows */}
                {(activeTab === 'holders' ? LEADERBOARD_DATA.topHolders :
                    activeTab === 'active' ? LEADERBOARD_DATA.mostActive :
                        activeTab === 'gas' ? LEADERBOARD_DATA.topGasSpenders :
                            LEADERBOARD_DATA.tokenCreators
                ).map((item: any, i: number) => (
                    <div
                        key={i}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '60px 1fr 150px 100px 50px',
                            padding: '20px 24px',
                            alignItems: 'center',
                            borderBottom: '1px solid var(--glass-border)',
                            transition: 'background 0.2s'
                        }}
                        className="hover-row"
                    >
                        <span style={{ display: 'flex', alignItems: 'center' }}>
                            {item.rank === 1 ? <Crown size={20} color="#f59e0b" /> :
                                item.rank === 2 ? <Medal size={20} color="#a1a1aa" /> :
                                    item.rank === 3 ? <Medal size={20} color="#cd7f32" /> :
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>#{item.rank}</span>}
                        </span>
                        <div>
                            <Link to={`/address/${item.address}`} style={{ color: 'var(--text-primary)', fontWeight: 500, textDecoration: 'none' }}>
                                {item.address}
                            </Link>
                            {item.label && (
                                <span style={{
                                    marginLeft: '12px',
                                    padding: '4px 10px',
                                    borderRadius: '8px',
                                    background: 'rgba(124, 58, 237, 0.1)',
                                    color: 'var(--primary)',
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                }}>
                                    {item.label}
                                </span>
                            )}
                        </div>
                        <span style={{ textAlign: 'right', fontWeight: 600, fontSize: '1rem' }}>
                            {activeTab === 'holders' ? `${item.balance} SMC` :
                                activeTab === 'active' ? item.txCount.toLocaleString() :
                                    activeTab === 'gas' ? item.gas :
                                        item.tokens}
                        </span>
                        <span style={{
                            textAlign: 'right',
                            color: item.change?.startsWith('+') ? 'var(--success)' : item.change?.startsWith('-') ? '#ef4444' : 'var(--text-muted)',
                            fontWeight: 500
                        }}>
                            {item.change || '-'}
                        </span>
                        <Link to={`/address/${item.address}`} style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                            <ChevronRight size={18} />
                        </Link>
                    </div>
                ))}
            </div>

            {/* Stats Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '32px' }}>
                <StatBox icon={<Wallet size={24} />} label="Total Holders" value="23,847" />
                <StatBox icon={<TrendingUp size={24} />} label="Total Supply Held" value="99.7%" />
                <StatBox icon={<Flame size={24} />} label="24h Transactions" value="847,293" />
                <StatBox icon={<Star size={24} />} label="Tokens Created" value="1,247" />
            </div>
        </div>
    );
}

function PodiumCard({ rank, data }: { rank: number; data: any }) {
    const heights = { 1: 200, 2: 160, 3: 140 };
    const colors = { 1: '#f59e0b', 2: '#a1a1aa', 3: '#cd7f32' };
    const icons = { 1: <Crown size={32} />, 2: <Medal size={28} />, 3: <Medal size={24} /> };

    return (
        <div style={{ textAlign: 'center' }}>
            <div className="glass-card" style={{
                padding: '24px',
                borderRadius: '20px',
                marginBottom: '16px',
                border: rank === 1 ? '2px solid #f59e0b' : '1px solid var(--glass-border)'
            }}>
                <div style={{
                    width: rank === 1 ? '80px' : '64px',
                    height: rank === 1 ? '80px' : '64px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${colors[rank as 1 | 2 | 3]}, ${colors[rank as 1 | 2 | 3]}88)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    color: rank === 1 ? '#000' : 'white'
                }}>
                    {icons[rank as 1 | 2 | 3]}
                </div>
                <div style={{ fontWeight: 600, marginBottom: '4px', fontSize: rank === 1 ? '1rem' : '0.9rem' }}>
                    {data.address.slice(0, 8)}...
                </div>
                <div style={{ color: colors[rank as 1 | 2 | 3], fontWeight: 700, fontSize: rank === 1 ? '1.1rem' : '0.95rem' }}>
                    {data.balance} SMC
                </div>
                {data.label && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                        {data.label}
                    </div>
                )}
            </div>
            <div style={{
                width: '100%',
                height: `${heights[rank as 1 | 2 | 3]}px`,
                background: `linear-gradient(180deg, ${colors[rank as 1 | 2 | 3]}44, ${colors[rank as 1 | 2 | 3]}11)`,
                borderRadius: '12px 12px 0 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 900,
                color: colors[rank as 1 | 2 | 3]
            }}>
                #{rank}
            </div>
        </div>
    );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="glass-card" style={{ padding: '24px', borderRadius: '20px', textAlign: 'center' }}>
            <div style={{ color: 'var(--primary)', marginBottom: '12px' }}>{icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '4px' }}>{value}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{label}</div>
        </div>
    );
}
