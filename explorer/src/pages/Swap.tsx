import { useState } from 'react';
import { ArrowDownUp, Settings, Info, Zap, TrendingUp, Droplets } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';

const TOKENS = [
    { symbol: 'SMC', name: 'SmartCoin', logo: '🔷', balance: '1,000.00', price: 1.00 },
    { symbol: 'USDT', name: 'Tether USD', logo: '💵', balance: '500.00', price: 1.00 },
    { symbol: 'WETH', name: 'Wrapped Ether', logo: '⟠', balance: '0.5', price: 2400.00 },
    { symbol: 'PEPE', name: 'Pepe Token', logo: '🐸', balance: '1,000,000', price: 0.00001 },
];

export default function Swap() {
    const { account } = useWeb3();
    const [fromToken, setFromToken] = useState(TOKENS[0]);
    const [toToken, setToToken] = useState(TOKENS[1]);
    const [fromAmount, setFromAmount] = useState('');
    const [slippage, setSlippage] = useState(0.5);
    const [showSettings, setShowSettings] = useState(false);

    const toAmount = fromAmount ? (parseFloat(fromAmount) * (fromToken.price / toToken.price)).toFixed(6) : '';
    const rate = (fromToken.price / toToken.price).toFixed(6);
    const priceImpact = fromAmount ? Math.min(parseFloat(fromAmount) * 0.001, 5).toFixed(2) : '0.00';

    const handleSwapTokens = () => {
        const temp = fromToken;
        setFromToken(toToken);
        setToToken(temp);
        setFromAmount('');
    };

    const handleSwap = () => {
        if (!account) {
            alert('Please connect your wallet first');
            return;
        }
        if (!fromAmount || parseFloat(fromAmount) <= 0) {
            alert('Please enter an amount');
            return;
        }
        // Mock swap
        alert(`Swapping ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}`);
    };

    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '64px', maxWidth: '500px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '8px 20px', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '30px', marginBottom: '16px' }}>
                    <ArrowDownUp size={18} color="var(--primary)" />
                    <span style={{ color: 'var(--primary)', fontWeight: 600, letterSpacing: '2px', fontSize: '0.8rem' }}>SMARTSWAP</span>
                </div>
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>
                    Swap Tokens
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Trade tokens instantly with minimal fees
                </p>
            </div>

            {/* Swap Card */}
            <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', position: 'relative' }}>
                {/* Settings Button */}
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'rgba(255,255,255,0.05)',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '10px',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)'
                    }}
                >
                    <Settings size={18} />
                </button>

                {/* Settings Panel */}
                {showSettings && (
                    <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Slippage Tolerance</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {[0.1, 0.5, 1.0].map(val => (
                                <button
                                    key={val}
                                    onClick={() => setSlippage(val)}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: slippage === val ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                        color: slippage === val ? 'white' : 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        fontWeight: 600
                                    }}
                                >
                                    {val}%
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* From Token */}
                <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '20px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>From</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Balance: {fromToken.balance}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                            type="number"
                            value={fromAmount}
                            onChange={(e) => setFromAmount(e.target.value)}
                            placeholder="0.0"
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                fontSize: '2rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                outline: 'none'
                            }}
                        />
                        <TokenSelector token={fromToken} tokens={TOKENS} onSelect={setFromToken} exclude={toToken.symbol} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        {[25, 50, 75, 100].map(pct => (
                            <button
                                key={pct}
                                onClick={() => setFromAmount((parseFloat(fromToken.balance.replace(/,/g, '')) * pct / 100).toString())}
                                style={{
                                    padding: '4px 10px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--glass-border)',
                                    background: 'transparent',
                                    color: 'var(--text-muted)',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer'
                                }}
                            >
                                {pct}%
                            </button>
                        ))}
                    </div>
                </div>

                {/* Swap Direction Button */}
                <div style={{ display: 'flex', justifyContent: 'center', margin: '-20px 0', position: 'relative', zIndex: 2 }}>
                    <button
                        onClick={handleSwapTokens}
                        style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '14px',
                            background: 'var(--gradient-primary)',
                            border: '4px solid var(--bg-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(180deg)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(0deg)'}
                    >
                        <ArrowDownUp size={20} />
                    </button>
                </div>

                {/* To Token */}
                <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '20px', marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>To</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Balance: {toToken.balance}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                            type="text"
                            value={toAmount}
                            readOnly
                            placeholder="0.0"
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: 'none',
                                fontSize: '2rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                outline: 'none'
                            }}
                        />
                        <TokenSelector token={toToken} tokens={TOKENS} onSelect={setToToken} exclude={fromToken.symbol} />
                    </div>
                </div>

                {/* Swap Details */}
                {fromAmount && parseFloat(fromAmount) > 0 && (
                    <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', fontSize: '0.9rem' }}>
                        <DetailRow label="Rate" value={`1 ${fromToken.symbol} = ${rate} ${toToken.symbol}`} />
                        <DetailRow label="Price Impact" value={`${priceImpact}%`} valueColor={parseFloat(priceImpact) > 1 ? '#f59e0b' : 'var(--success)'} />
                        <DetailRow label="Min. Received" value={`${(parseFloat(toAmount) * (1 - slippage / 100)).toFixed(6)} ${toToken.symbol}`} />
                        <DetailRow label="Network Fee" value="~0.001 SMC" />
                    </div>
                )}

                {/* Swap Button */}
                <button
                    onClick={handleSwap}
                    disabled={!fromAmount || parseFloat(fromAmount) <= 0}
                    className="btn btn-primary"
                    style={{
                        width: '100%',
                        marginTop: '20px',
                        padding: '18px',
                        borderRadius: '16px',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        opacity: !fromAmount || parseFloat(fromAmount) <= 0 ? 0.5 : 1,
                        cursor: !fromAmount || parseFloat(fromAmount) <= 0 ? 'not-allowed' : 'pointer'
                    }}
                >
                    {!account ? 'Connect Wallet' : !fromAmount ? 'Enter Amount' : 'Swap'}
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '24px' }}>
                <StatCard icon={<Droplets size={20} />} label="TVL" value="$2.4M" />
                <StatCard icon={<TrendingUp size={20} />} label="24h Volume" value="$847K" />
                <StatCard icon={<Zap size={20} />} label="Total Swaps" value="12,847" />
            </div>
        </div>
    );
}

function TokenSelector({ token, tokens, onSelect, exclude }: { token: typeof TOKENS[0]; tokens: typeof TOKENS; onSelect: (t: typeof TOKENS[0]) => void; exclude: string }) {
    const [open, setOpen] = useState(false);

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: '14px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '1rem'
                }}
            >
                <span style={{ fontSize: '1.4rem' }}>{token.logo}</span>
                {token.symbol}
                <span style={{ opacity: 0.5 }}>▼</span>
            </button>
            {open && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    width: '200px',
                    background: 'var(--bg-card)',
                    borderRadius: '16px',
                    border: '1px solid var(--glass-border)',
                    padding: '8px',
                    zIndex: 10,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                }}>
                    {tokens.filter(t => t.symbol !== exclude).map(t => (
                        <button
                            key={t.symbol}
                            onClick={() => { onSelect(t); setOpen(false); }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                background: t.symbol === token.symbol ? 'rgba(124,58,237,0.1)' : 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-primary)',
                                textAlign: 'left'
                            }}
                        >
                            <span style={{ fontSize: '1.4rem' }}>{t.logo}</span>
                            <div>
                                <div style={{ fontWeight: 600 }}>{t.symbol}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.name}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function DetailRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Info size={14} /> {label}
            </span>
            <span style={{ color: valueColor || 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
        </div>
    );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{ color: 'var(--primary)', marginBottom: '8px' }}>{icon}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</div>
        </div>
    );
}
