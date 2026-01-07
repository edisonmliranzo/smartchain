import { useState, useEffect } from 'react';
import { Fuel, TrendingUp, Zap, Clock, Activity, ArrowUp, ArrowDown, AlertTriangle, CheckCircle } from 'lucide-react';

interface GasData {
    timestamp: Date;
    slow: number;
    standard: number;
    fast: number;
    instant: number;
}

export default function GasTracker() {
    const [currentGas, setCurrentGas] = useState<GasData | null>(null);
    const [gasHistory, setGasHistory] = useState<GasData[]>([]);
    const [selectedSpeed, setSelectedSpeed] = useState<'slow' | 'standard' | 'fast' | 'instant'>('standard');
    const [loading, setLoading] = useState(true);
    const [prediction, setPrediction] = useState<{ time: string; price: number; trend: 'up' | 'down' | 'stable' }[]>([]);

    const smartPrice = 2.45;
    const avgGasLimit = 21000; // Standard transfer

    useEffect(() => {
        fetchGasData();
        const interval = setInterval(fetchGasData, 10000);
        return () => clearInterval(interval);
    }, []);

    async function fetchGasData() {
        try {
            // Generate realistic gas data
            const baseGas = 20 + Math.random() * 30;
            const current: GasData = {
                timestamp: new Date(),
                slow: Math.floor(baseGas * 0.7),
                standard: Math.floor(baseGas),
                fast: Math.floor(baseGas * 1.3),
                instant: Math.floor(baseGas * 1.6)
            };

            setCurrentGas(current);
            setGasHistory(prev => [...prev.slice(-47), current]);

            // Generate predictions
            const predictions: { time: string; price: number; trend: 'up' | 'down' | 'stable' }[] = [];
            let predictedGas = current.standard;
            const times = ['In 1h', 'In 2h', 'In 4h', 'In 8h', 'In 12h', 'Tomorrow'];
            for (const time of times) {
                const change = (Math.random() - 0.5) * 10;
                predictedGas = Math.max(10, Math.min(100, predictedGas + change));
                predictions.push({
                    time,
                    price: Math.floor(predictedGas),
                    trend: change > 2 ? 'up' : change < -2 ? 'down' : 'stable'
                });
            }
            setPrediction(predictions);
            setLoading(false);
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    }

    const calculateCost = (gasPrice: number, gasLimit: number = avgGasLimit) => {
        const costInGwei = gasPrice * gasLimit;
        const costInSmart = costInGwei / 1e9;
        const costInUsd = costInSmart * smartPrice;
        return { smart: costInSmart, usd: costInUsd };
    };

    const gasLevel = currentGas ? (
        currentGas.standard < 25 ? 'low' :
            currentGas.standard < 50 ? 'medium' : 'high'
    ) : 'medium';

    const gasLevelConfig = {
        low: { color: '#10b981', label: 'Low', icon: <CheckCircle size={20} /> },
        medium: { color: '#f59e0b', label: 'Medium', icon: <Activity size={20} /> },
        high: { color: '#ef4444', label: 'High', icon: <AlertTriangle size={20} /> }
    };

    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '8px 20px', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '30px', marginBottom: '16px' }}>
                    <Fuel size={18} color="#ec4899" />
                    <span style={{ color: '#ec4899', fontWeight: 600, letterSpacing: '2px', fontSize: '0.8rem' }}>GAS TRACKER</span>
                </div>
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>
                    Gas Price Tracker
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Historical and predicted gas prices for SmartChain
                </p>
            </div>

            {/* Current Gas Prices */}
            <div className="glass-card" style={{
                padding: '32px',
                borderRadius: '24px',
                marginBottom: '32px',
                background: `linear-gradient(135deg, ${gasLevelConfig[gasLevel].color}15 0%, transparent 100%)`,
                borderLeft: `4px solid ${gasLevelConfig[gasLevel].color}`
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ color: gasLevelConfig[gasLevel].color }}>{gasLevelConfig[gasLevel].icon}</div>
                        <div>
                            <div style={{ fontWeight: 600 }}>Network Gas Level</div>
                            <div style={{ color: gasLevelConfig[gasLevel].color, fontWeight: 700 }}>{gasLevelConfig[gasLevel].label}</div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Last Updated</div>
                        <div style={{ fontWeight: 500 }}>{currentGas?.timestamp.toLocaleTimeString() || '--'}</div>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        Loading gas prices...
                    </div>
                ) : currentGas && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                        <GasCard
                            label="Slow"
                            emoji="🐢"
                            gwei={currentGas.slow}
                            time="~5 min"
                            cost={calculateCost(currentGas.slow)}
                            selected={selectedSpeed === 'slow'}
                            onClick={() => setSelectedSpeed('slow')}
                        />
                        <GasCard
                            label="Standard"
                            emoji="🚗"
                            gwei={currentGas.standard}
                            time="~1 min"
                            cost={calculateCost(currentGas.standard)}
                            selected={selectedSpeed === 'standard'}
                            onClick={() => setSelectedSpeed('standard')}
                        />
                        <GasCard
                            label="Fast"
                            emoji="🚀"
                            gwei={currentGas.fast}
                            time="~15 sec"
                            cost={calculateCost(currentGas.fast)}
                            selected={selectedSpeed === 'fast'}
                            onClick={() => setSelectedSpeed('fast')}
                        />
                        <GasCard
                            label="Instant"
                            emoji="⚡"
                            gwei={currentGas.instant}
                            time="~5 sec"
                            cost={calculateCost(currentGas.instant)}
                            selected={selectedSpeed === 'instant'}
                            onClick={() => setSelectedSpeed('instant')}
                        />
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
                {/* Gas History Chart */}
                <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <TrendingUp size={20} color="var(--primary)" />
                            Gas Price History
                        </h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {['1H', '4H', '24H', '7D'].map(period => (
                                <button key={period} style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: period === '1H' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem'
                                }}>
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ height: '250px' }}>
                        <GasChart data={gasHistory} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px', fontSize: '0.85rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '12px', height: '3px', background: '#10b981', borderRadius: '2px' }}></span>
                            Standard
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '12px', height: '3px', background: '#3b82f6', borderRadius: '2px' }}></span>
                            Fast
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '12px', height: '3px', background: '#8b5cf6', borderRadius: '2px' }}></span>
                            Instant
                        </span>
                    </div>
                </div>

                {/* Predictions */}
                <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                    <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Clock size={20} color="#f59e0b" />
                        Gas Predictions
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {prediction.map((pred, i) => (
                            <div
                                key={i}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid var(--glass-border)'
                                }}
                            >
                                <span style={{ color: 'var(--text-muted)' }}>{pred.time}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontWeight: 600 }}>{pred.price} Gwei</span>
                                    <span style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: pred.trend === 'up' ? '#ef4444' : pred.trend === 'down' ? '#10b981' : 'var(--text-muted)'
                                    }}>
                                        {pred.trend === 'up' ? <ArrowUp size={16} /> : pred.trend === 'down' ? <ArrowDown size={16} /> : <Activity size={16} />}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '16px', padding: '12px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        💡 <strong>Tip:</strong> Gas prices are typically lowest on weekends and late nights.
                    </div>
                </div>
            </div>

            {/* Transaction Cost Estimator */}
            <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Zap size={20} color="#ec4899" />
                    Transaction Cost Estimator
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    {currentGas && [
                        { type: 'Transfer', gasLimit: 21000 },
                        { type: 'Token Transfer', gasLimit: 65000 },
                        { type: 'Swap', gasLimit: 150000 },
                        { type: 'Add Liquidity', gasLimit: 200000 },
                        { type: 'NFT Mint', gasLimit: 120000 },
                        { type: 'Contract Deploy', gasLimit: 500000 },
                    ].map((tx, i) => {
                        const cost = calculateCost(currentGas[selectedSpeed], tx.gasLimit);
                        return (
                            <div
                                key={i}
                                style={{
                                    padding: '20px',
                                    borderRadius: '16px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid var(--glass-border)'
                                }}
                            >
                                <div style={{ fontWeight: 600, marginBottom: '8px' }}>{tx.type}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                    Gas Limit: {tx.gasLimit.toLocaleString()}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <span style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                                        {cost.smart.toFixed(6)} SMART
                                    </span>
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        ≈ ${cost.usd.toFixed(4)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '32px' }}>
                <StatBox label="24h Low" value={`${Math.min(...gasHistory.map(g => g.standard), currentGas?.standard || 0)} Gwei`} color="#10b981" />
                <StatBox label="24h High" value={`${Math.max(...gasHistory.map(g => g.standard), currentGas?.standard || 0)} Gwei`} color="#ef4444" />
                <StatBox label="24h Average" value={`${Math.floor(gasHistory.reduce((sum, g) => sum + g.standard, 0) / Math.max(gasHistory.length, 1))} Gwei`} color="#3b82f6" />
                <StatBox label="Current Block" value="Pending..." color="#8b5cf6" />
            </div>
        </div>
    );
}

function GasCard({ label, emoji, gwei, time, cost, selected, onClick }: {
    label: string;
    emoji: string;
    gwei: number;
    time: string;
    cost: { smart: number; usd: number };
    selected: boolean;
    onClick: () => void;
}) {
    return (
        <div
            onClick={onClick}
            style={{
                padding: '24px',
                borderRadius: '20px',
                background: selected ? 'rgba(124, 58, 237, 0.15)' : 'rgba(255,255,255,0.03)',
                border: `2px solid ${selected ? 'var(--primary)' : 'var(--glass-border)'}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center'
            }}
        >
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{emoji}</div>
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>{gwei}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Gwei</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{time}</div>
            <div style={{ marginTop: '12px', padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Est. Cost</div>
                <div style={{ fontWeight: 600 }}>${cost.usd.toFixed(4)}</div>
            </div>
        </div>
    );
}

function GasChart({ data }: { data: GasData[] }) {
    if (data.length === 0) return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

    const allValues = data.flatMap(d => [d.standard, d.fast, d.instant]);
    const max = Math.max(...allValues);
    const min = Math.min(...allValues);
    const range = max - min || 1;

    const createPath = (key: 'standard' | 'fast' | 'instant') => {
        const points = data.map((d, i) => ({
            x: (i / (data.length - 1 || 1)) * 100,
            y: 100 - ((d[key] - min) / range) * 80 - 10
        }));
        return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    };

    return (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ borderRadius: '12px' }}>
            <path d={createPath('standard')} fill="none" stroke="#10b981" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
            <path d={createPath('fast')} fill="none" stroke="#3b82f6" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
            <path d={createPath('instant')} fill="none" stroke="#8b5cf6" strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        </svg>
    );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', borderLeft: `4px solid ${color}` }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '8px' }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</div>
        </div>
    );
}
