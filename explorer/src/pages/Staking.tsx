
import { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { Shield, Lock, TrendingUp, Wallet, AlertCircle, Clock } from 'lucide-react';
import { ethers } from 'ethers';

export default function Staking() {
    const { account, connectWallet } = useWeb3();
    const [amount, setAmount] = useState('');
    const [stakedBalance, setStakedBalance] = useState('0');
    const [rewards, setRewards] = useState('0');
    const [isStaking, setIsStaking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Mock staking data persistence (simulated)
    useEffect(() => {
        if (account) {
            const savedStake = localStorage.getItem(`stake_${account}`);
            const savedRewards = localStorage.getItem(`rewards_${account}`);
            const lastUpdate = localStorage.getItem(`stake_time_${account}`);

            if (savedStake) {
                setStakedBalance(savedStake);

                // Calculate rewards: 15% APY / 31536000 sec per year * seconds elapsed
                if (savedRewards && lastUpdate) {
                    const elapsed = (Date.now() - parseInt(lastUpdate)) / 1000;
                    const accrued = (parseFloat(savedStake) * 0.15 * elapsed) / 31536000; // Simplified APY calc
                    setRewards((parseFloat(savedRewards) + accrued).toFixed(6));
                } else if (savedRewards) {
                    setRewards(savedRewards);
                }
            }
        }
    }, [account]);

    // Live reward ticker
    useEffect(() => {
        if (parseFloat(stakedBalance) > 0) {
            const interval = setInterval(() => {
                setRewards(prev => (parseFloat(prev) + (parseFloat(stakedBalance) * 0.15 / 31536000)).toFixed(8));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [stakedBalance]);

    const handleStake = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !account) return;
        setIsStaking(true);
        setError(null);

        try {
            // Check balance using ethers
            if (window.ethereum) {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const bal = await provider.getBalance(account);
                const amountWei = ethers.parseEther(amount);

                if (bal < amountWei) {
                    throw new Error("Insufficient funds");
                }

                // Simulate transaction
                const tx = await signer.sendTransaction({
                    to: "0x0000000000000000000000000000000000000000", // Burn address for demo staking
                    value: amountWei
                });
                await tx.wait();

                // Update local mock state
                const newStake = (parseFloat(stakedBalance) + parseFloat(amount)).toString();
                setStakedBalance(newStake);
                localStorage.setItem(`stake_${account}`, newStake);
                localStorage.setItem(`rewards_${account}`, rewards);
                localStorage.setItem(`stake_time_${account}`, Date.now().toString());
                setAmount('');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to stake");
        } finally {
            setIsStaking(false);
        }
    };

    const handleUnstake = () => {
        if (parseFloat(stakedBalance) <= 0) return;
        // In a real app, this would call the contract to withdraw
        setError("Unstaking period: 7 days remaining (Demo Mode)");
    };

    const handleClaim = () => {
        if (parseFloat(rewards) <= 0) return;
        // In a real app, this would call the contract to claim
        setRewards("0");
        localStorage.setItem(`rewards_${account}`, "0");
        setError(null);
        alert(`Claimed ${rewards} SMC!`);
    };

    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
            <div className="glass-card" style={{
                padding: '48px',
                borderRadius: '30px',
                marginBottom: '40px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '24px' }}>
                        <TrendingUp size={16} /> APY: 15.0%
                    </div>
                    <h1 className="gradient-text" style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '16px' }}>
                        SmartChain Staking
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 32px' }}>
                        Secure the network and earn passive income by locking your SMC tokens.
                    </p>
                </div>

                {/* Background Decor */}
                <div style={{ position: 'absolute', top: '-50px', left: '-50px', opacity: 0.1, transform: 'rotate(45deg)' }}>
                    <Shield size={300} />
                </div>
                <div style={{ position: 'absolute', bottom: '-50px', right: '-50px', opacity: 0.1, transform: 'rotate(-15deg)' }}>
                    <Lock size={300} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                {/* Left: Staking Form */}
                <div className="glass-card" style={{ padding: '32px', borderRadius: '24px' }}>
                    <h2 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Lock className="text-accent" /> Stake Tokens
                    </h2>

                    {!account ? (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>Connect wallet to start earning rewards.</p>
                            <button onClick={connectWallet} className="btn btn-primary shine-effect">
                                <Wallet size={18} /> Connect Wallet
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleStake}>
                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>Amount to Stake (SMC)</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        step="0.01"
                                        className="input glass"
                                        style={{ width: '100%', paddingLeft: '16px', fontSize: '1.2rem', fontWeight: 700 }}
                                    />
                                    <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)' }}>SMC</span>
                                </div>
                            </div>

                            {error && (
                                <div style={{ marginBottom: '24px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', borderRadius: '12px', color: 'var(--error)', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.9rem' }}>
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary shine-effect"
                                style={{ width: '100%', padding: '16px', fontSize: '1.1rem', fontWeight: 700 }}
                                disabled={isStaking || !amount}
                            >
                                {isStaking ? 'Staking...' : 'Stake Now'}
                            </button>
                            <p style={{ marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                                <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                Tokens are locked for 7 days.
                            </p>
                        </form>
                    )}
                </div>

                {/* Right: Dashboard */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Your Position */}
                    <div className="glass-card" style={{ padding: '32px', borderRadius: '24px' }}>
                        <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Staked</h3>
                        <div className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 900 }}>
                            {parseFloat(stakedBalance).toFixed(2)} SMC
                        </div>
                        <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                            <button onClick={handleUnstake} className="btn btn-secondary glass" style={{ flex: 1 }}>Unstake</button>
                        </div>
                    </div>

                    {/* Rewards */}
                    <div className="glass-card" style={{ padding: '32px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <h3 style={{ color: 'var(--success)', fontSize: '0.9rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Unclaimed Rewards</h3>
                                <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>
                                    {rewards} SMC
                                </div>
                            </div>
                            <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '12px', color: 'var(--success)' }}>
                                <TrendingUp size={24} />
                            </div>
                        </div>
                        <div style={{ marginTop: '24px' }}>
                            <button onClick={handleClaim} className="btn btn-primary" style={{ width: '100%', background: 'var(--success)', border: 'none' }}>
                                Claim Rewards
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
