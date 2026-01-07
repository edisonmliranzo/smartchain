import { useState } from 'react';
import {
    CreditCard, Zap, Crown, Check, Sparkles, Shield,
    Star, Gift, Wallet, LogIn, LogOut, User, Infinity
} from 'lucide-react';
import { useCredits, CREDIT_PLANS } from '../contexts/CreditsContext';
import { useWeb3 } from '../contexts/Web3Context';

export default function Credits() {
    const {
        user, profile, credits, isAdmin, loading,
        signInWithGoogle, signOut, addCredits, linkWallet, hasCredits
    } = useCredits();
    const { account, connectWallet } = useWeb3();
    const [purchasing, setPurchasing] = useState<string | null>(null);
    const [linkingWallet, setLinkingWallet] = useState(false);

    const handlePurchase = async (planId: string, creditAmount: number) => {
        if (!user) {
            await signInWithGoogle();
            return;
        }

        setPurchasing(planId);

        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            await addCredits(creditAmount);
            alert(`Successfully purchased ${creditAmount} credits!`);
        } catch (error) {
            alert('Failed to purchase credits. Please try again.');
        } finally {
            setPurchasing(null);
        }
    };

    const handleLinkWallet = async () => {
        if (!account) {
            await connectWallet();
            return;
        }

        setLinkingWallet(true);
        try {
            await linkWallet(account);
            alert('Wallet linked successfully!');
        } catch (error) {
            alert('Failed to link wallet');
        } finally {
            setLinkingWallet(false);
        }
    };

    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 20px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    borderRadius: '30px',
                    marginBottom: '16px'
                }}>
                    <CreditCard size={18} color="#f59e0b" />
                    <span style={{ color: '#f59e0b', fontWeight: 600, letterSpacing: '2px', fontSize: '0.8rem' }}>
                        CREDITS
                    </span>
                </div>
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '16px' }}>
                    SmartChain Credits
                </h1>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                    Use credits to access premium features like AI contract generation, advanced analytics, and more.
                </p>
            </div>

            {/* User Status Card */}
            <div className="glass-card" style={{
                padding: '32px',
                borderRadius: '24px',
                marginBottom: '48px',
                background: isAdmin
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(234, 88, 12, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)'
            }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                        Loading...
                    </div>
                ) : user && profile ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '32px', alignItems: 'center' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                                {profile.photoURL ? (
                                    <img
                                        src={profile.photoURL}
                                        alt="Profile"
                                        style={{ width: '56px', height: '56px', borderRadius: '16px' }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '16px',
                                        background: 'var(--primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <User size={28} />
                                    </div>
                                )}
                                <div>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                                        {profile.displayName || 'User'}
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        {profile.email}
                                    </div>
                                </div>
                                {isAdmin && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 16px',
                                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                        borderRadius: '20px',
                                        fontWeight: 600,
                                        fontSize: '0.85rem'
                                    }}>
                                        <Crown size={16} />
                                        Admin
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                <div>
                                    <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>Credits:</span>
                                    <span style={{
                                        fontWeight: 700,
                                        fontSize: '1.5rem',
                                        color: isAdmin ? '#f59e0b' : hasCredits ? '#10b981' : '#ef4444'
                                    }}>
                                        {isAdmin ? (
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                <Infinity size={24} /> Unlimited
                                            </span>
                                        ) : credits}
                                    </span>
                                </div>
                                {profile.walletAddress && (
                                    <div>
                                        <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>Wallet:</span>
                                        <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                            {profile.walletAddress.slice(0, 6)}...{profile.walletAddress.slice(-4)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {!profile.walletAddress && (
                                <button
                                    onClick={handleLinkWallet}
                                    disabled={linkingWallet}
                                    className="btn-secondary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <Wallet size={18} />
                                    {linkingWallet ? 'Linking...' : 'Link Wallet'}
                                </button>
                            )}
                            <button
                                onClick={signOut}
                                className="btn-secondary"
                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <LogOut size={18} />
                                Sign Out
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <Gift size={48} color="#8b5cf6" style={{ marginBottom: '16px' }} />
                        <h3 style={{ marginBottom: '8px' }}>Welcome! Sign in to get started</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                            New users receive <strong style={{ color: '#10b981' }}>1 free credit</strong> upon signup!
                        </p>
                        <button
                            onClick={signInWithGoogle}
                            className="btn-primary"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '14px 32px',
                                fontSize: '1rem'
                            }}
                        >
                            <LogIn size={20} />
                            Sign in with Google
                        </button>
                    </div>
                )}
            </div>

            {/* Free Credit Banner */}
            <div className="glass-card" style={{
                padding: '24px 32px',
                borderRadius: '20px',
                marginBottom: '48px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
                borderLeft: '4px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                gap: '20px'
            }}>
                <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '16px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Gift size={28} color="#10b981" />
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>
                        🎉 Free Credit for New Users!
                    </div>
                    <div style={{ color: 'var(--text-muted)' }}>
                        Every new user gets 1 free credit to try out our premium features. No payment required!
                    </div>
                </div>
            </div>

            {/* Pricing Plans */}
            <h2 style={{
                textAlign: 'center',
                marginBottom: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
            }}>
                <Sparkles size={24} color="var(--primary)" />
                Choose Your Plan
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '48px' }}>
                {CREDIT_PLANS.map((plan) => (
                    <div
                        key={plan.id}
                        className="glass-card"
                        style={{
                            padding: '32px',
                            borderRadius: '24px',
                            position: 'relative',
                            border: plan.popular ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                            transform: plan.popular ? 'scale(1.05)' : 'scale(1)',
                            transition: 'transform 0.3s'
                        }}
                    >
                        {plan.popular && (
                            <div style={{
                                position: 'absolute',
                                top: '-12px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                padding: '6px 20px',
                                background: 'var(--primary)',
                                borderRadius: '20px',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <Star size={14} />
                                Most Popular
                            </div>
                        )}

                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                margin: '0 auto 16px',
                                borderRadius: '20px',
                                background: plan.popular
                                    ? 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)'
                                    : 'rgba(255,255,255,0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Zap size={32} color={plan.popular ? 'white' : 'var(--primary)'} />
                            </div>
                            <h3 style={{ marginBottom: '8px' }}>{plan.label}</h3>
                            <div style={{
                                fontSize: '3rem',
                                fontWeight: 900,
                                marginBottom: '4px',
                                background: plan.popular
                                    ? 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)'
                                    : 'linear-gradient(135deg, #fff 0%, #ccc 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>
                                ${plan.price}
                            </div>
                            <div style={{ color: 'var(--text-muted)' }}>
                                ${(plan.price / plan.credits).toFixed(2)} per credit
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            {[
                                `${plan.credits} credits`,
                                'AI Contract Generation',
                                'Advanced Analytics',
                                'Priority Support',
                                plan.credits >= 25 ? 'Bulk Discounts' : null,
                                plan.credits >= 50 ? 'Enterprise Features' : null,
                            ].filter(Boolean).map((feature, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '10px 0',
                                        borderBottom: i < 3 ? '1px solid var(--glass-border)' : 'none'
                                    }}
                                >
                                    <Check size={18} color="#10b981" />
                                    <span style={{ color: 'var(--text-secondary)' }}>{feature}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => handlePurchase(plan.id, plan.credits)}
                            disabled={purchasing === plan.id}
                            className={plan.popular ? 'btn-primary' : 'btn-secondary'}
                            style={{
                                width: '100%',
                                padding: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            {purchasing === plan.id ? (
                                'Processing...'
                            ) : (
                                <>
                                    <CreditCard size={18} />
                                    {user ? 'Buy Now' : 'Sign In to Buy'}
                                </>
                            )}
                        </button>
                    </div>
                ))}
            </div>

            {/* Features Section */}
            <div className="glass-card" style={{ padding: '32px', borderRadius: '24px' }}>
                <h3 style={{
                    textAlign: 'center',
                    marginBottom: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px'
                }}>
                    <Shield size={24} color="#10b981" />
                    What Can You Do With Credits?
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                    {[
                        { icon: '🤖', title: 'AI Contract Generation', desc: 'Generate smart contracts using AI assistance' },
                        { icon: '📊', title: 'Advanced Analytics', desc: 'Deep dive into blockchain metrics and trends' },
                        { icon: '🔔', title: 'Whale Alerts', desc: 'Get notified of large transactions instantly' },
                        { icon: '⛽', title: 'Gas Predictions', desc: 'AI-powered gas price forecasting' },
                        { icon: '📈', title: 'Portfolio Insights', desc: 'Advanced portfolio analysis and recommendations' },
                        { icon: '🛡️', title: 'Contract Auditing', desc: 'AI-assisted smart contract security analysis' },
                    ].map((feature, i) => (
                        <div
                            key={i}
                            style={{
                                padding: '20px',
                                borderRadius: '16px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--glass-border)'
                            }}
                        >
                            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>{feature.icon}</div>
                            <div style={{ fontWeight: 600, marginBottom: '6px' }}>{feature.title}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{feature.desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
