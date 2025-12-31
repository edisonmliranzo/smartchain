
import { useState, useEffect, useMemo } from 'react';
import { Palette, CheckCircle, AlertTriangle, Loader, ExternalLink } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';
import { ethers } from 'ethers';
import GraffitiABI from '../abis/Graffiti.json';
import GraffitiAddress from '../abis/GraffitiAddress.json';

const GRID_SIZE = 20; // 20x20
const CELL_SIZE = 20; // px
const PIXEL_PRICE = '0.1'; // SMC

export default function Graffiti() {
    const { account, connectWallet } = useWeb3();
    const [canvas, setCanvas] = useState<{ [key: string]: string }>({});
    const [selectedColor, setSelectedColor] = useState('#EF4444');
    const [hoverPos, setHoverPos] = useState<{ x: number, y: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [txStatus, setTxStatus] = useState<'idle' | 'mining' | 'success' | 'error'>('idle');
    const [txHash, setTxHash] = useState('');

    const COLORS = [
        '#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', // Brights
        '#ffffff', '#94a3b8', '#475569', '#000000' // Grays
    ];

    useEffect(() => {
        loadCanvas();
        // Poll for updates
        const interval = setInterval(loadCanvas, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadCanvas = async () => {
        try {
            // Using a simple JSON-RPC provider to read event logs
            const provider = new ethers.JsonRpcProvider(import.meta.env.VITE_RPC_URL || 'http://localhost:8545');

            // Get logs from the beginning of time
            const logs = await provider.getLogs({
                fromBlock: 0,
                toBlock: 'latest',
                address: GraffitiAddress.address,
                topics: [
                    ethers.id("PixelPainted(uint16,uint16,string,address)")
                ]
            });

            const iface = new ethers.Interface(GraffitiABI);
            const newCanvas: { [key: string]: string } = {};

            logs.forEach(log => {
                try {
                    const parsed = iface.parseLog(log);
                    if (parsed) {
                        const { x, y, color } = parsed.args;
                        newCanvas[`${x},${y}`] = color;
                    }
                } catch (e) {
                    console.error("Failed to parse log", e);
                }
            });

            setCanvas(newCanvas);
            setLoading(false);
        } catch (error) {
            console.error("Failed to load canvas:", error);
            setLoading(false);
        }
    };

    const handlePaint = async (x: number, y: number) => {
        if (!account) {
            connectWallet();
            return;
        }

        if (txStatus === 'mining') return;

        setTxStatus('mining');
        setTxHash('');

        try {
            // We use the browser provider (MetaMask or similar connected one)
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(GraffitiAddress.address, GraffitiABI, signer);

            const tx = await contract.paint(x, y, selectedColor, {
                value: ethers.parseEther(PIXEL_PRICE)
            });

            setTxHash(tx.hash);
            await tx.wait(); // Wait for 1 confirmation

            setTxStatus('success');

            // Optimistic update
            setCanvas(prev => ({
                ...prev,
                [`${x},${y}`]: selectedColor
            }));

            // Reload actual state
            setTimeout(loadCanvas, 2000);

        } catch (error) {
            console.error("Paint failure:", error);
            setTxStatus('error');
        }
    };

    const canvasGrid = useMemo(() => {
        const grid = [];
        for (let y = 0; y < GRID_SIZE; y++) {
            const row = [];
            for (let x = 0; x < GRID_SIZE; x++) {
                const color = canvas[`${x},${y}`] || '#e2e8f0'; // Default gray
                row.push(
                    <div
                        key={`${x},${y}`}
                        onClick={() => handlePaint(x, y)}
                        onMouseEnter={() => setHoverPos({ x, y })}
                        onMouseLeave={() => setHoverPos(null)}
                        style={{
                            width: `${CELL_SIZE}px`,
                            height: `${CELL_SIZE}px`,
                            backgroundColor: color,
                            cursor: 'pointer',
                            border: '1px solid rgba(0,0,0,0.05)',
                            transition: 'transform 0.1s',
                            opacity: hoverPos?.x === x && hoverPos?.y === y ? 0.8 : 1,
                            transform: hoverPos?.x === x && hoverPos?.y === y ? 'scale(1.1)' : 'scale(1)',
                            zIndex: hoverPos?.x === x && hoverPos?.y === y ? 10 : 1
                        }}
                    />
                );
            }
            grid.push(<div key={y} style={{ display: 'flex' }}>{row}</div>);
        }
        return grid;
    }, [canvas, hoverPos, selectedColor]);

    return (
        <div className="container animate-in" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '40px' }}>

                {/* Main Canvas Area */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', overflow: 'hidden' }}>
                        {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px' }}>
                                <Loader className="spin" size={32} style={{ marginBottom: '16px', color: 'var(--primary)' }} />
                                <div style={{ color: 'var(--text-secondary)' }}>Loading Graffiti...</div>
                            </div>
                        ) : (
                            <div style={{
                                border: '4px solid var(--text-primary)',
                                borderRadius: '4px',
                                display: 'inline-block',
                                backgroundColor: '#fff',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
                            }}>
                                {canvasGrid}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Controls */}
                <div>
                    <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', position: 'sticky', top: '100px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ padding: '10px', background: 'var(--primary)', borderRadius: '12px', color: 'white' }}>
                                <Palette size={24} />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Graffiti Wall</h2>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                    Living Art on SmartChain
                                </div>
                            </div>
                        </div>

                        {/* Status Box */}
                        <div style={{
                            padding: '16px',
                            background: 'var(--bg-tertiary)',
                            borderRadius: '16px',
                            marginBottom: '24px',
                            fontSize: '0.9rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Price per Pixel</span>
                                <span style={{ fontWeight: 700 }}>{PIXEL_PRICE} SMC</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Grid Size</span>
                                <span style={{ fontWeight: 700 }}>{GRID_SIZE}x{GRID_SIZE}</span>
                            </div>
                            {hoverPos && (
                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--glass-border)', color: 'var(--primary)' }}>
                                    Target: <b>({hoverPos.x}, {hoverPos.y})</b>
                                </div>
                            )}
                        </div>

                        {/* Color Picker */}
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ fontWeight: 600, marginBottom: '12px' }}>Choose Color</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                                {COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setSelectedColor(color)}
                                        style={{
                                            width: '100%',
                                            aspectRatio: '1',
                                            backgroundColor: color,
                                            border: selectedColor === color ? '3px solid var(--text-primary)' : '1px solid rgba(0,0,0,0.1)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            transition: 'transform 0.1s',
                                            transform: selectedColor === color ? 'scale(1.1)' : 'scale(1)'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Status Messages */}
                        {txStatus === 'mining' && (
                            <div className="animate-in" style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Loader className="spin" size={20} />
                                <div>Painting pixel...</div>
                            </div>
                        )}

                        {txStatus === 'success' && (
                            <div className="animate-in" style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: 'var(--success)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <CheckCircle size={20} />
                                    <div style={{ fontWeight: 600 }}>Pixel Painted!</div>
                                </div>
                                {txHash && (
                                    <a href={`/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'inherit', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '30px' }}>
                                        View Tx <ExternalLink size={12} />
                                    </a>
                                )}
                            </div>
                        )}

                        {txStatus === 'error' && (
                            <div className="animate-in" style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <AlertTriangle size={20} />
                                <div>Failed to paint. Check funds?</div>
                            </div>
                        )}

                        {!account && (
                            <button onClick={connectWallet} className="btn btn-primary" style={{ width: '100%', marginTop: '20px' }}>
                                Connect Wallet to Paint
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
