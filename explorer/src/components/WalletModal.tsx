import { useEffect } from 'react';
import { X, Wallet, AlertTriangle, Download, Globe } from 'lucide-react';

interface WalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    error?: string | null;
}

const WALLET_OPTIONS = [
    {
        name: 'MetaMask',
        icon: '🦊',
        url: 'https://metamask.io/download/',
        description: 'Most popular browser wallet',
        color: '#F6851B'
    },
    {
        name: 'Coinbase Wallet',
        icon: '🔵',
        url: 'https://www.coinbase.com/wallet',
        description: 'Easy to use DeFi wallet',
        color: '#0052FF'
    },
    {
        name: 'Trust Wallet',
        icon: '🛡️',
        url: 'https://trustwallet.com/browser-extension',
        description: 'Secure multi-chain wallet',
        color: '#3375BB'
    },
    {
        name: 'Rabby Wallet',
        icon: '🐰',
        url: 'https://rabby.io/',
        description: 'Built for DeFi power users',
        color: '#8697FF'
    }
];

export default function WalletModal({ isOpen, onClose, error }: WalletModalProps) {
    // Handle Escape key to close modal
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleInstallWallet = (url: string) => {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div
            className="animate-in"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.85)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}
            onClick={onClose}
        >
            <div
                className="glass-card"
                style={{
                    width: '100%',
                    maxWidth: '440px',
                    borderRadius: '24px',
                    overflow: 'hidden'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: 'var(--gradient-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Wallet size={22} color="white" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                                Connect Wallet
                            </h2>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Choose a wallet to connect
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'var(--bg-glass)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '10px',
                            padding: '8px',
                            cursor: 'pointer',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '24px' }}>
                    {/* Error/Warning Message */}
                    {error && (
                        <div style={{
                            padding: '16px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '14px',
                            marginBottom: '20px',
                            display: 'flex',
                            gap: '12px'
                        }}>
                            <AlertTriangle size={24} style={{ color: 'var(--error)', flexShrink: 0 }} />
                            <div>
                                <p style={{ margin: 0, fontWeight: 600, color: 'var(--error)' }}>
                                    No Wallet Detected
                                </p>
                                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                    {error}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* No wallet installed - show install options */}
                    {error ? (
                        <>
                            <p style={{
                                fontSize: '0.9rem',
                                color: 'var(--text-muted)',
                                marginBottom: '16px',
                                textAlign: 'center'
                            }}>
                                Install one of these wallets to get started:
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {WALLET_OPTIONS.map((wallet) => (
                                    <button
                                        key={wallet.name}
                                        onClick={() => handleInstallWallet(wallet.url)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '14px',
                                            padding: '14px 16px',
                                            background: 'var(--bg-glass)',
                                            border: '1px solid var(--glass-border)',
                                            borderRadius: '14px',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            width: '100%',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.borderColor = wallet.color;
                                            e.currentTarget.style.background = `${wallet.color}15`;
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.borderColor = 'var(--glass-border)';
                                            e.currentTarget.style.background = 'var(--bg-glass)';
                                        }}
                                    >
                                        <span style={{ fontSize: '1.8rem' }}>{wallet.icon}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                fontWeight: 600,
                                                color: 'var(--text-primary)',
                                                fontSize: '0.95rem'
                                            }}>
                                                {wallet.name}
                                            </div>
                                            <div style={{
                                                fontSize: '0.8rem',
                                                color: 'var(--text-muted)'
                                            }}>
                                                {wallet.description}
                                            </div>
                                        </div>
                                        <Download size={18} style={{ color: 'var(--text-muted)' }} />
                                    </button>
                                ))}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Wallet detected - connecting state */}
                            <div style={{
                                textAlign: 'center',
                                padding: '40px 0',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '16px'
                            }}>
                                <div className="spinner" style={{
                                    width: '48px',
                                    height: '48px',
                                    border: '4px solid var(--glass-border)',
                                    borderTop: '4px solid var(--primary)',
                                    borderRadius: '50%'
                                }} />
                                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                                    Please confirm in your wallet...
                                </p>
                            </div>
                        </>
                    )}

                    {/* Help text */}
                    <div style={{
                        marginTop: '20px',
                        padding: '14px',
                        background: 'var(--bg-glass)',
                        borderRadius: '12px',
                        border: '1px solid var(--glass-border)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '8px'
                        }}>
                            <Globe size={16} style={{ color: 'var(--primary)' }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                What is a wallet?
                            </span>
                        </div>
                        <p style={{
                            margin: 0,
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)',
                            lineHeight: 1.5
                        }}>
                            A crypto wallet is a browser extension that lets you interact with
                            blockchain apps. It stores your private keys and lets you sign transactions.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
