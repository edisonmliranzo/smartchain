import { useState, useEffect } from 'react';
import { Ticket, Trophy, Users, Zap, Gift, Star } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';

export default function Lottery() {
    const { account } = useWeb3();
    const [ticketCount, setTicketCount] = useState(1);
    const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 42, seconds: 18 });
    const [buying, setBuying] = useState(false);
    const [myTickets, setMyTickets] = useState<string[]>([]);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
                if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
                if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
                return prev;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const ticketPrice = 10; // SMC
    const currentPrize = 15420;
    const totalTickets = 1542;
    const participants = 847;

    const handleBuyTickets = async () => {
        if (!account) {
            alert('Please connect your wallet first');
            return;
        }
        setBuying(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        const newTickets = Array.from({ length: ticketCount }, () =>
            Math.random().toString(36).substring(2, 8).toUpperCase()
        );
        setMyTickets(prev => [...prev, ...newTickets]);
        setBuying(false);
        alert(`Successfully purchased ${ticketCount} ticket(s)!`);
    };

    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '8px 20px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '30px', marginBottom: '16px' }}>
                    <Trophy size={18} color="#f59e0b" />
                    <span style={{ color: '#f59e0b', fontWeight: 600, letterSpacing: '2px', fontSize: '0.8rem' }}>SMARTCHAIN LOTTERY</span>
                </div>
                <h1 className="gradient-text" style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '8px' }}>
                    Win Big! 🎰
                </h1>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
                    Provably fair on-chain lottery. Every ticket has an equal chance to win!
                </p>
            </div>

            {/* Main Prize Card */}
            <div className="glass-card" style={{
                padding: '48px',
                borderRadius: '30px',
                marginBottom: '32px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(124, 58, 237, 0.1))',
                border: '2px solid rgba(245, 158, 11, 0.3)',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '0.9rem', color: '#f59e0b', marginBottom: '8px', fontWeight: 600 }}>CURRENT JACKPOT</div>
                <div style={{
                    fontSize: '4rem',
                    fontWeight: 900,
                    background: 'linear-gradient(135deg, #f59e0b, #7c3aed)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '24px'
                }}>
                    {currentPrize.toLocaleString()} SMC
                </div>

                {/* Countdown */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '32px' }}>
                    <CountdownBox value={timeLeft.hours} label="Hours" />
                    <CountdownBox value={timeLeft.minutes} label="Minutes" />
                    <CountdownBox value={timeLeft.seconds} label="Seconds" />
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap' }}>
                    <StatItem icon={<Ticket size={20} />} value={totalTickets.toLocaleString()} label="Total Tickets" />
                    <StatItem icon={<Users size={20} />} value={participants.toLocaleString()} label="Participants" />
                    <StatItem icon={<Gift size={20} />} value={`${ticketPrice} SMC`} label="Ticket Price" />
                </div>
            </div>

            {/* Buy Tickets */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '48px' }}>
                <div className="glass-card" style={{ padding: '32px', borderRadius: '24px' }}>
                    <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Ticket size={24} color="#f59e0b" />
                        Buy Tickets
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <button
                            onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                            style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                border: '1px solid var(--glass-border)',
                                background: 'transparent',
                                color: 'var(--text-primary)',
                                fontSize: '1.5rem',
                                cursor: 'pointer'
                            }}
                        >
                            -
                        </button>
                        <input
                            type="number"
                            value={ticketCount}
                            onChange={(e) => setTicketCount(Math.max(1, parseInt(e.target.value) || 1))}
                            style={{
                                flex: 1,
                                textAlign: 'center',
                                fontSize: '2rem',
                                fontWeight: 700,
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid var(--glass-border)',
                                background: 'rgba(255,255,255,0.03)',
                                color: 'var(--text-primary)'
                            }}
                        />
                        <button
                            onClick={() => setTicketCount(ticketCount + 1)}
                            style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                border: '1px solid var(--glass-border)',
                                background: 'transparent',
                                color: 'var(--text-primary)',
                                fontSize: '1.5rem',
                                cursor: 'pointer'
                            }}
                        >
                            +
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                        {[5, 10, 25, 50].map(n => (
                            <button
                                key={n}
                                onClick={() => setTicketCount(n)}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    borderRadius: '10px',
                                    border: ticketCount === n ? '2px solid #f59e0b' : '1px solid var(--glass-border)',
                                    background: ticketCount === n ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                                    color: ticketCount === n ? '#f59e0b' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    fontWeight: 600
                                }}
                            >
                                {n}
                            </button>
                        ))}
                    </div>

                    <div style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '14px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Ticket Cost</span>
                            <span>{ticketCount} × {ticketPrice} SMC</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--glass-border)' }}>
                            <span style={{ fontWeight: 600 }}>Total</span>
                            <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: '1.2rem' }}>{ticketCount * ticketPrice} SMC</span>
                        </div>
                    </div>

                    <button
                        onClick={handleBuyTickets}
                        disabled={buying}
                        className="btn"
                        style={{
                            width: '100%',
                            padding: '18px',
                            borderRadius: '14px',
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                            border: 'none',
                            color: 'white',
                            cursor: buying ? 'not-allowed' : 'pointer',
                            opacity: buying ? 0.7 : 1
                        }}
                    >
                        {buying ? 'Processing...' : `Buy ${ticketCount} Ticket${ticketCount > 1 ? 's' : ''}`}
                    </button>
                </div>

                {/* My Tickets */}
                <div className="glass-card" style={{ padding: '32px', borderRadius: '24px' }}>
                    <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Star size={24} color="#f59e0b" />
                        My Tickets ({myTickets.length})
                    </h3>

                    {myTickets.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                            <Ticket size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                            <p>You haven't purchased any tickets yet</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                            {myTickets.map((ticket, i) => (
                                <div key={i} style={{
                                    padding: '12px',
                                    borderRadius: '10px',
                                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(124, 58, 237, 0.1))',
                                    border: '1px dashed rgba(245, 158, 11, 0.3)',
                                    textAlign: 'center',
                                    fontFamily: 'monospace',
                                    fontWeight: 600,
                                    fontSize: '0.9rem'
                                }}>
                                    #{ticket}
                                </div>
                            ))}
                        </div>
                    )}

                    <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', marginBottom: '4px' }}>
                            <Zap size={16} />
                            <strong>Your Odds</strong>
                        </div>
                        <span style={{ color: 'var(--text-secondary)' }}>
                            {myTickets.length === 0 ? '0%' : ((myTickets.length / (totalTickets + myTickets.length)) * 100).toFixed(2) + '%'} chance to win
                        </span>
                    </div>
                </div>
            </div>

            {/* Previous Winners */}
            <div className="glass-card" style={{ padding: '32px', borderRadius: '24px' }}>
                <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Trophy size={24} color="#f59e0b" />
                    Previous Winners
                </h3>
                <div style={{ display: 'grid', gap: '16px' }}>
                    {[
                        { round: 42, winner: '0xAbC...123', prize: '12,500 SMC', tickets: 847, date: 'Jan 1, 2026' },
                        { round: 41, winner: '0x789...Def', prize: '8,200 SMC', tickets: 612, date: 'Dec 31, 2025' },
                        { round: 40, winner: '0xFed...987', prize: '15,800 SMC', tickets: 1024, date: 'Dec 30, 2025' },
                    ].map((round, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '20px',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '16px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#f59e0b',
                                    fontWeight: 700
                                }}>
                                    #{round.round}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{round.winner}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{round.date} • {round.tickets} tickets</div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '1.1rem' }}>{round.prize}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Won</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function CountdownBox({ value, label }: { value: number; label: string }) {
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '16px',
                background: 'rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                fontWeight: 800,
                marginBottom: '8px'
            }}>
                {value.toString().padStart(2, '0')}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</div>
        </div>
    );
}

function StatItem({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ color: '#f59e0b' }}>{icon}</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 700 }}>{value}</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{label}</div>
        </div>
    );
}
