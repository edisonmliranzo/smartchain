import { useState, useEffect } from 'react';
import { api } from '../api';
import { Terminal, Shield, Zap, AlertTriangle, CheckCircle } from 'lucide-react';

export default function Faucet() {
    const [address, setAddress] = useState('');
    const [status, setStatus] = useState<'idle' | 'mining' | 'success' | 'error'>('idle');
    const [logs, setLogs] = useState<string[]>([]);
    const [txHash, setTxHash] = useState('');

    const addLog = (msg: string) => {
        setLogs(prev => [...prev.slice(-4), `> ${msg}`]);
    };

    const requestFunds = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!address) return;

        setStatus('mining');
        setLogs([]);
        addLog(`Initiating secure connection to Grid Node...`);

        try {
            // Simulate hacker sequence
            await new Promise(r => setTimeout(r, 800));
            addLog(`Bypassing firewall... [ACCESS GRANTED]`);
            await new Promise(r => setTimeout(r, 600));
            addLog(`Requesting liquidity injection for ${address.slice(0, 6)}...`);

            const response = await api.requestFaucet(address);

            await new Promise(r => setTimeout(r, 600));
            addLog(`Transaction signed. Hash: ${response.hash?.slice(0, 10)}...`);
            addLog(`Funds transfer complete. 10 SMC credited.`);

            setStatus('success');
            setTxHash(response.hash || '0x...');
        } catch (error: any) {
            addLog(`ERROR: Connection refused. ${error.response?.data?.error || error.message}`);
            setStatus('error');
        }
    };

    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
            <div className="glass-card" style={{
                maxWidth: '800px',
                margin: '0 auto',
                border: '1px solid #00ff41',
                background: 'rgba(0, 10, 0, 0.9)',
                boxShadow: '0 0 20px rgba(0, 255, 65, 0.2)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Matrix Rain Effect Background Placeholder */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'linear-gradient(180deg, rgba(0,20,0,0) 0%, rgba(0,50,0,0.2) 100%)',
                    pointerEvents: 'none'
                }} />

                <div style={{ padding: '40px', position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                        <div style={{
                            background: '#00ff41',
                            color: 'black',
                            padding: '12px',
                            borderRadius: '8px'
                        }}>
                            <Terminal size={32} />
                        </div>
                        <div>
                            <h1 style={{
                                fontFamily: 'monospace',
                                color: '#00ff41',
                                margin: 0,
                                fontSize: '2rem',
                                textShadow: '0 0 10px rgba(0, 255, 65, 0.5)'
                            }}>
                                SMC_FAUCET_V1.0
                            </h1>
                            <p style={{ color: '#008F11', margin: '4px 0 0 0', fontFamily: 'monospace' }}>
                                // DEVNET_LIQUIDITY_PROTOCOL
                            </p>
                        </div>
                    </div>

                    <div style={{
                        background: '#001100',
                        border: '1px solid #003300',
                        borderRadius: '4px',
                        padding: '16px',
                        marginBottom: '32px',
                        fontFamily: 'monospace',
                        color: '#00ff41',
                        minHeight: '120px'
                    }}>
                        {logs.length === 0 && <span style={{ opacity: 0.5 }}>System ready. Awaiting input...</span>}
                        {logs.map((log, i) => (
                            <div key={i} style={{ marginBottom: '4px' }}>{log}</div>
                        ))}
                    </div>

                    <form onSubmit={requestFunds} style={{ display: 'flex', gap: '16px' }}>
                        <input
                            type="text"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            placeholder="0x..."
                            style={{
                                flex: 1,
                                background: 'transparent',
                                border: '1px solid #00ff41',
                                padding: '16px',
                                color: '#00ff41',
                                fontFamily: 'monospace',
                                fontSize: '1.1rem',
                                borderRadius: '4px',
                                outline: 'none'
                            }}
                        />
                        <button
                            type="submit"
                            disabled={status === 'mining'}
                            style={{
                                background: status === 'mining' ? '#003300' : '#00ff41',
                                color: 'black',
                                border: 'none',
                                padding: '0 32px',
                                fontFamily: 'monospace',
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                borderRadius: '4px',
                                cursor: status === 'mining' ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {status === 'mining' ? (
                                <><div className="spinner" style={{ borderTopColor: 'black' }} /> INJECTING</>
                            ) : (
                                <><Zap size={18} /> INITIALIZE</>
                            )}
                        </button>
                    </form>

                    {status === 'success' && (
                        <div style={{
                            marginTop: '24px',
                            padding: '16px',
                            background: 'rgba(0, 255, 65, 0.1)',
                            border: '1px solid #00ff41',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <CheckCircle size={20} color="#00ff41" />
                            <span style={{ color: '#00ff41', fontFamily: 'monospace' }}>
                                SUCCESS. Transaction Hash: {txHash}
                            </span>
                        </div>
                    )}

                    <div style={{ marginTop: '32px', display: 'flex', gap: '24px', justifyContent: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#008F11', fontSize: '0.8rem', fontFamily: 'monospace' }}>NETWORK STATUS</div>
                            <div style={{ color: '#00ff41', fontWeight: 'bold', fontFamily: 'monospace' }}>ONLINE</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#008F11', fontSize: '0.8rem', fontFamily: 'monospace' }}>BLOCK TIME</div>
                            <div style={{ color: '#00ff41', fontWeight: 'bold', fontFamily: 'monospace' }}>1000ms</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#008F11', fontSize: '0.8rem', fontFamily: 'monospace' }}>AVAILABLE</div>
                            <div style={{ color: '#00ff41', fontWeight: 'bold', fontFamily: 'monospace' }}>∞ SMC</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
