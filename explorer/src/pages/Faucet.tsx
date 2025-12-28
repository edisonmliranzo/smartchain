import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../api';
import {
    Droplets,
    Wallet,
    CheckCircle,
    AlertCircle,
    Loader2,
    ExternalLink,
    Copy,
    Shield,
    Server,
    Key,
    Lock,
    Zap,
    Trophy,
    ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';

const truncateHash = (hash: string, chars = 6) => {
    return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
};

export default function Faucet() {
    const { account } = useWeb3();
    const [address, setAddress] = useState(account || '');
    const [copied, setCopied] = useState<string | null>(null);

    // Auto-fill address when wallet connects
    if (account && !address) {
        setAddress(account);
    }

    const { data: chainInfo } = useQuery({
        queryKey: ['chainInfo'],
        queryFn: api.getChainInfo,
    });

    const faucetMutation = useMutation({
        mutationFn: (addr: string) => api.requestFaucet(addr),
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!address || !address.startsWith('0x') || address.length !== 42) {
            return;
        }
        faucetMutation.mutate(address);
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    // Dev accounts with the updated supply
    const devAccounts = [
        {
            address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
            balance: '1,000,000,000 SMC',
            role: 'Creator / Node'
        },
        {
            address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
            balance: '500,000,000 SMC',
            role: 'Dev / LP'
        },
        {
            address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
            privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
            balance: '1,000,000 SMC',
            role: 'Tester'
        },
    ];

    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
            {/* Hero Section */}
            <div className="glass-card" style={{
                textAlign: 'center',
                padding: '80px 40px',
                borderRadius: '30px',
                marginBottom: '48px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    width: '100px',
                    height: '100px',
                    background: 'var(--gradient-primary)',
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 32px',
                    boxShadow: '0 12px 24px rgba(124, 58, 237, 0.4)'
                }}>
                    <Droplets size={48} color="white" />
                </div>
                <h1 className="gradient-text" style={{
                    fontSize: '3rem',
                    fontWeight: 900,
                    marginBottom: '16px',
                    letterSpacing: '-1px'
                }}>
                    Token Faucet
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 40px' }}>
                    Request test tokens for your wallet and check pre-configured development accounts to test high-value transactions.
                </p>

                {/* Form Wrapper */}
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <form onSubmit={handleSubmit} className="glass" style={{
                        padding: '32px',
                        borderRadius: '24px',
                        border: '1px solid var(--glass-border)'
                    }}>
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <Wallet size={16} color="var(--primary-light)" />
                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>RECEIVING ADDRESS</span>
                            </div>
                            <input
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Enter your 0x address"
                                className="input"
                                style={{
                                    fontFamily: 'var(--font-mono)',
                                    padding: '16px',
                                    fontSize: '1rem',
                                    textAlign: 'center'
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary shine-effect"
                            disabled={faucetMutation.isPending || !address}
                            style={{
                                width: '100%',
                                padding: '18px',
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                borderRadius: '16px'
                            }}
                        >
                            {faucetMutation.isPending ? (
                                <>
                                    <Loader2 size={24} style={{ animation: 'spin 1.s linear infinite' }} />
                                    Processing Token Request...
                                </>
                            ) : (
                                <>
                                    <Zap size={20} />
                                    Dispense 10 SMC
                                </>
                            )}
                        </button>
                    </form>

                    {/* Success/Error States */}
                    {faucetMutation.isSuccess && (
                        <div className="animate-in" style={{
                            marginTop: '24px',
                            padding: '24px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            border: '1px solid var(--success)',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '16px',
                            textAlign: 'left'
                        }}>
                            <CheckCircle size={32} style={{ color: 'var(--success)', flexShrink: 0 }} />
                            <div>
                                <div style={{ fontWeight: 800, color: 'var(--success)', fontSize: '1.1rem' }}>TOKENS DISPENSED!</div>
                                <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                                    Your request was successful. 10 SMC has been added to your balance.
                                </div>
                                <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                                    <Link to={`/address/${faucetMutation.data.address}`} className="btn btn-secondary glass" style={{ fontSize: '0.8rem' }}>
                                        Check Balance <ExternalLink size={14} />
                                    </Link>
                                    {faucetMutation.data.hash && (
                                        <Link to={`/tx/${faucetMutation.data.hash}`} className="btn btn-secondary glass" style={{ fontSize: '0.8rem' }}>
                                            View Tx <ArrowRight size={14} />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {faucetMutation.isError && (
                        <div className="animate-in" style={{
                            marginTop: '24px',
                            padding: '24px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid var(--error)',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            textAlign: 'left'
                        }}>
                            <AlertCircle size={32} style={{ color: 'var(--error)' }} />
                            <div>
                                <div style={{ fontWeight: 800, color: 'var(--error)' }}>REQUEST FAILED</div>
                                <div style={{ color: 'var(--text-secondary)' }}>
                                    We couldn't process your request. Please check your address or try again later.
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
                {/* Network Config */}
                <div className="glass-card" style={{ borderRadius: '24px' }}>
                    <div className="card-header">
                        <h2 className="card-title">
                            <Server size={20} />
                            Network Settings
                        </h2>
                    </div>
                    <div style={{ padding: '8px 0' }}>
                        <InfoRow
                            icon={<Shield size={16} />}
                            label="Network Name"
                            value={chainInfo?.chainName || 'SmartChain'}
                        />
                        <InfoRow
                            icon={<Server size={16} />}
                            label="RPC URL"
                            value="http://localhost:8545"
                            copyable
                        />
                        <InfoRow
                            icon={<Zap size={16} />}
                            label="Chain ID"
                            value={chainInfo?.chainId?.toString() || '1337'}
                        />
                        <InfoRow
                            icon={<Trophy size={16} />}
                            label="Currency"
                            value={`${chainInfo?.symbol || 'SMC'}`}
                        />
                    </div>
                </div>

                {/* Account Cards */}
                <div className="glass-card" style={{ borderRadius: '24px' }}>
                    <div className="card-header">
                        <h2 className="card-title">
                            <Key size={20} />
                            Pre-funded Accounts
                        </h2>
                        <span className="badge badge-error">DEBUG ONLY</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                        {devAccounts.map((account, index) => (
                            <div
                                key={account.address}
                                className="glass"
                                style={{
                                    padding: '24px',
                                    borderRadius: '20px',
                                    border: '1px solid var(--glass-border)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            background: index === 0 ? 'var(--accent)' : 'var(--gradient-primary)',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: index === 0 ? 'black' : 'white',
                                            fontWeight: 800
                                        }}>
                                            #{index}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, color: 'white' }}>{account.role} Account</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>{account.balance}</div>
                                        </div>
                                    </div>
                                    <Link to={`/address/${account.address}`} className="btn btn-secondary glass" style={{ padding: '8px' }}>
                                        <ExternalLink size={16} />
                                    </Link>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '12px' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Address</div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <code style={{ fontSize: '0.8rem', color: 'var(--secondary-light)' }}>{truncateHash(account.address, 12)}</code>
                                            <button onClick={() => copyToClipboard(account.address, `addr-${index}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === `addr-${index}` ? 'var(--success)' : 'var(--text-muted)' }}>
                                                {copied === `addr-${index}` ? <CheckCircle size={14} /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.1)' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Lock size={10} /> Private Key
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <code style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>{truncateHash(account.privateKey, 14)}</code>
                                            <button onClick={() => copyToClipboard(account.privateKey, `pk-${index}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === `pk-${index}` ? 'var(--success)' : 'var(--text-muted)' }}>
                                                {copied === `pk-${index}` ? <CheckCircle size={14} /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function InfoRow({
    icon,
    label,
    value,
    copyable = false
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    copyable?: boolean;
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 0',
            borderBottom: '1px solid var(--glass-border)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ color: 'var(--primary-light)', opacity: 0.7 }}>{icon}</div>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <code style={{ fontFamily: 'var(--font-mono)', color: 'white', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px' }}>
                    {value}
                </code>
                {copyable && (
                    <button
                        onClick={handleCopy}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: copied ? 'var(--success)' : 'var(--text-muted)',
                            padding: '4px',
                        }}
                    >
                        {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                    </button>
                )}
            </div>
        </div>
    );
}
