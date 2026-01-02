import { useState } from 'react';
import { ArrowRight, ArrowLeftRight, Shield, Clock, Zap, CheckCircle, Loader } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';

const NETWORKS = [
    { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', logo: '⟠', color: '#627eea' },
    { id: 'smartchain', name: 'SmartChain', symbol: 'SMC', logo: '🔷', color: '#7c3aed' },
    { id: 'polygon', name: 'Polygon', symbol: 'MATIC', logo: '💜', color: '#8247e5' },
    { id: 'bsc', name: 'BNB Chain', symbol: 'BNB', logo: '🟡', color: '#f0b90b' },
];

const BRIDGE_TOKENS = [
    { symbol: 'USDT', name: 'Tether USD', balance: '1,000.00' },
    { symbol: 'USDC', name: 'USD Coin', balance: '500.00' },
    { symbol: 'WETH', name: 'Wrapped ETH', balance: '0.5' },
    { symbol: 'DAI', name: 'Dai Stablecoin', balance: '2,500.00' },
];

export default function Bridge() {
    const { account } = useWeb3();
    const [fromNetwork, setFromNetwork] = useState(NETWORKS[0]);
    const [toNetwork, setToNetwork] = useState(NETWORKS[1]);
    const [selectedToken, setSelectedToken] = useState(BRIDGE_TOKENS[0]);
    const [amount, setAmount] = useState('');
    const [bridging, setBridging] = useState(false);
    const [step, setStep] = useState(0); // 0: input, 1: confirming, 2: bridging, 3: complete

    const handleSwapNetworks = () => {
        const temp = fromNetwork;
        setFromNetwork(toNetwork);
        setToNetwork(temp);
    };

    const estimatedFee = amount ? (parseFloat(amount) * 0.001).toFixed(4) : '0';
    const estimatedReceive = amount ? (parseFloat(amount) - parseFloat(estimatedFee)).toFixed(4) : '0';

    const handleBridge = async () => {
        if (!account) {
            alert('Please connect your wallet');
            return;
        }
        setBridging(true);
        setStep(1);
        await new Promise(r => setTimeout(r, 2000));
        setStep(2);
        await new Promise(r => setTimeout(r, 3000));
        setStep(3);
        setBridging(false);
    };

    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '64px', maxWidth: '600px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '8px 20px', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '30px', marginBottom: '16px' }}>
                    <ArrowLeftRight size={18} color="var(--primary)" />
                    <span style={{ color: 'var(--primary)', fontWeight: 600, letterSpacing: '2px', fontSize: '0.8rem' }}>CROSS-CHAIN BRIDGE</span>
                </div>
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>
                    Bridge Assets
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Transfer tokens between SmartChain and other networks
                </p>
            </div>

            {step === 3 ? (
                /* Success State */
                <div className="glass-card" style={{ padding: '48px', borderRadius: '24px', textAlign: 'center' }}>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: 'rgba(16, 185, 129, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px'
                    }}>
                        <CheckCircle size={50} color="var(--success)" />
                    </div>
                    <h2 style={{ marginBottom: '8px' }}>Bridge Successful! 🎉</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                        Your {amount} {selectedToken.symbol} has been bridged to {toNetwork.name}
                    </p>
                    <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Transaction Hash</span>
                            <span style={{ fontFamily: 'monospace' }}>0x7d96...cb05</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Estimated Arrival</span>
                            <span style={{ color: 'var(--success)' }}>~2 minutes</span>
                        </div>
                    </div>
                    <button
                        onClick={() => { setStep(0); setAmount(''); }}
                        className="btn btn-primary"
                        style={{ padding: '16px 32px' }}
                    >
                        Bridge More
                    </button>
                </div>
            ) : (
                <>
                    {/* Bridge Card */}
                    <div className="glass-card" style={{ padding: '32px', borderRadius: '24px', marginBottom: '24px' }}>
                        {/* From Network */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>From</label>
                            <NetworkSelector network={fromNetwork} networks={NETWORKS} onSelect={setFromNetwork} exclude={toNetwork.id} />
                        </div>

                        {/* Swap Button */}
                        <div style={{ display: 'flex', justifyContent: 'center', margin: '-8px 0', position: 'relative', zIndex: 2 }}>
                            <button
                                onClick={handleSwapNetworks}
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
                                    color: 'white'
                                }}
                            >
                                <ArrowLeftRight size={20} />
                            </button>
                        </div>

                        {/* To Network */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>To</label>
                            <NetworkSelector network={toNetwork} networks={NETWORKS} onSelect={setToNetwork} exclude={fromNetwork.id} />
                        </div>

                        {/* Token Selection */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Token</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                                {BRIDGE_TOKENS.map(token => (
                                    <button
                                        key={token.symbol}
                                        onClick={() => setSelectedToken(token)}
                                        style={{
                                            padding: '12px',
                                            borderRadius: '12px',
                                            border: selectedToken.symbol === token.symbol ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                                            background: selectedToken.symbol === token.symbol ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                                            cursor: 'pointer',
                                            color: 'var(--text-primary)',
                                            fontWeight: 600
                                        }}
                                    >
                                        {token.symbol}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Amount</label>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Balance: {selectedToken.balance}</span>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.0"
                                    style={{
                                        width: '100%',
                                        padding: '20px',
                                        paddingRight: '80px',
                                        borderRadius: '16px',
                                        border: '1px solid var(--glass-border)',
                                        background: 'rgba(0,0,0,0.2)',
                                        color: 'var(--text-primary)',
                                        fontSize: '1.5rem',
                                        fontWeight: 700
                                    }}
                                />
                                <button
                                    onClick={() => setAmount(selectedToken.balance.replace(/,/g, ''))}
                                    style={{
                                        position: 'absolute',
                                        right: '16px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        padding: '8px 16px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: 'var(--primary)',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    MAX
                                </button>
                            </div>
                        </div>

                        {/* Bridge Details */}
                        {amount && parseFloat(amount) > 0 && (
                            <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', marginBottom: '24px' }}>
                                <DetailRow label="Bridge Fee" value={`${estimatedFee} ${selectedToken.symbol}`} />
                                <DetailRow label="You'll Receive" value={`${estimatedReceive} ${selectedToken.symbol}`} highlight />
                                <DetailRow label="Estimated Time" value="~2-5 minutes" />
                            </div>
                        )}

                        {/* Bridge Button */}
                        <button
                            onClick={handleBridge}
                            disabled={bridging || !amount || parseFloat(amount) <= 0}
                            className="btn btn-primary"
                            style={{
                                width: '100%',
                                padding: '18px',
                                borderRadius: '16px',
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                opacity: (!amount || parseFloat(amount) <= 0) ? 0.5 : 1
                            }}
                        >
                            {bridging ? (
                                <>
                                    <Loader size={20} className="spin-slow" />
                                    {step === 1 ? 'Confirming...' : 'Bridging...'}
                                </>
                            ) : (
                                <>
                                    Bridge to {toNetwork.name}
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </div>

                    {/* Info Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        <InfoCard icon={<Shield size={20} />} title="Secure" description="Audited smart contracts" />
                        <InfoCard icon={<Clock size={20} />} title="Fast" description="2-5 min transfers" />
                        <InfoCard icon={<Zap size={20} />} title="Low Fees" description="0.1% bridge fee" />
                    </div>
                </>
            )}

            {/* Recent Bridges */}
            <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', marginTop: '32px' }}>
                <h3 style={{ marginBottom: '20px' }}>🔄 Recent Bridges</h3>
                {[
                    { from: 'Ethereum', to: 'SmartChain', amount: '1,000 USDT', time: '5 min ago', status: 'complete' },
                    { from: 'SmartChain', to: 'Polygon', amount: '500 USDC', time: '12 min ago', status: 'complete' },
                    { from: 'BNB Chain', to: 'SmartChain', amount: '0.5 WETH', time: '1 hour ago', status: 'complete' },
                ].map((bridge, i) => (
                    <div key={i} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px 0',
                        borderBottom: i < 2 ? '1px solid var(--glass-border)' : 'none'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>{bridge.from}</span>
                                <ArrowRight size={16} color="var(--text-muted)" />
                                <span>{bridge.to}</span>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 600 }}>{bridge.amount}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{bridge.time}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function NetworkSelector({ network, networks, onSelect, exclude }: { network: typeof NETWORKS[0]; networks: typeof NETWORKS; onSelect: (n: typeof NETWORKS[0]) => void; exclude: string }) {
    const [open, setOpen] = useState(false);

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setOpen(!open)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '16px 20px',
                    borderRadius: '16px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    color: 'var(--text-primary)'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.5rem' }}>{network.logo}</span>
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 600 }}>{network.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{network.symbol}</div>
                    </div>
                </div>
                <span style={{ opacity: 0.5 }}>▼</span>
            </button>
            {open && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '8px',
                    background: 'var(--bg-card)',
                    borderRadius: '16px',
                    border: '1px solid var(--glass-border)',
                    padding: '8px',
                    zIndex: 10,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
                }}>
                    {networks.filter(n => n.id !== exclude).map(n => (
                        <button
                            key={n.id}
                            onClick={() => { onSelect(n); setOpen(false); }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                width: '100%',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                background: n.id === network.id ? 'rgba(124,58,237,0.1)' : 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-primary)',
                                textAlign: 'left'
                            }}
                        >
                            <span style={{ fontSize: '1.3rem' }}>{n.logo}</span>
                            <div>
                                <div style={{ fontWeight: 600 }}>{n.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{n.symbol}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ fontWeight: highlight ? 700 : 500, color: highlight ? 'var(--success)' : 'var(--text-primary)' }}>{value}</span>
        </div>
    );
}

function InfoCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', textAlign: 'center' }}>
            <div style={{ color: 'var(--primary)', marginBottom: '8px' }}>{icon}</div>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{title}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{description}</div>
        </div>
    );
}
