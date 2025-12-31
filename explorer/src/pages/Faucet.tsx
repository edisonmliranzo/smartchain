
import { useState } from 'react';
import { Droplets, Shield, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8545';

export default function Faucet() {
    const { account } = useWeb3();
    const [address, setAddress] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();

        const targetAddress = address || account;
        if (!targetAddress) {
            setError('Please enter an address or connect wallet');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'smc_faucet',
                    params: [targetAddress, '10000000000000000000'], // 10 SMC
                    id: 1
                }),
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message);
            }

            setSuccess(`Successfully sent 10 SMC to ${targetAddress}`);
            setAddress('');
        } catch (err: any) {
            setError(err.message || 'Failed to request funds');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container animate-in" style={{ paddingTop: '40px', paddingBottom: '80px' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>

                {/* Header */}
                <div className="glass-card" style={{
                    padding: '48px',
                    borderRadius: '24px',
                    textAlign: 'center',
                    marginBottom: '24px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: 'var(--primary)',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            boxShadow: '0 10px 30px rgba(99, 102, 241, 0.4)'
                        }}>
                            <Droplets size={40} color="white" />
                        </div>
                        <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
                            SMC Faucet
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                            Get free SMC tokens to test your DApps and explore the ecosystem.
                        </p>
                    </div>

                    {/* Background decoration */}
                    <div style={{ position: 'absolute', top: -40, right: -40, opacity: 0.1 }}>
                        <Droplets size={200} />
                    </div>
                </div>

                {/* Form */}
                <div className="glass-card" style={{ padding: '32px', borderRadius: '24px' }}>
                    <form onSubmit={handleRequest}>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                                Wallet Address
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder={account || "0x..."}
                                    className="input glass"
                                    style={{ width: '100%', paddingLeft: '44px', fontFamily: 'monospace' }}
                                />
                                <Shield
                                    size={18}
                                    color="var(--text-muted)"
                                    style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                                />
                            </div>
                            {account && !address && (
                                <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <CheckCircle size={12} /> Using connected wallet
                                </div>
                            )}
                        </div>

                        {error && (
                            <div className="animate-in" style={{
                                padding: '16px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '12px',
                                color: 'var(--error)',
                                marginBottom: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <AlertTriangle size={20} />
                                <div>{error}</div>
                            </div>
                        )}

                        {success && (
                            <div className="animate-in" style={{
                                padding: '16px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                borderRadius: '12px',
                                color: 'var(--success)',
                                marginBottom: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <CheckCircle size={20} />
                                <div>{success}</div>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '16px', fontSize: '1.1rem', justifyContent: 'center' }}
                            disabled={loading}
                        >
                            {loading ? (
                                <>Processing...</>
                            ) : (
                                <>Get 10 SMC <ArrowRight size={20} /></>
                            )}
                        </button>
                    </form>

                    <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--glass-border)', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            Limit: 10 SMC per request • Network: SmartChain Mainnet
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
