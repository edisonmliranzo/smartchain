import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Blocks, Receipt, Droplets, Home, Menu, X, Cpu, Shield, Wallet, Rocket, Bot, Lock, PieChart } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';

export default function Navbar() {
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        // Detect search type and navigate
        const query = searchQuery.trim();
        if (query.startsWith('0x') && query.length === 66) {
            navigate(`/tx/${query}`);
        } else if (query.startsWith('0x') && query.length === 42) {
            navigate(`/address/${query}`);
        } else if (/^\d+$/.test(query)) {
            navigate(`/block/${query}`);
        } else {
            navigate(`/tx/${query}`);
        }
        setSearchQuery('');
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'rgba(15, 15, 26, 0.7)',
            backdropFilter: 'blur(30px)',
            borderBottom: '1px solid var(--glass-border)',
        }}>
            <div className="container" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '80px',
            }}>
                {/* Logo */}
                <Link to="/" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    textDecoration: 'none',
                }}>
                    <div className="shine-effect" style={{
                        width: '44px',
                        height: '44px',
                        background: 'var(--gradient-primary)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 15px rgba(124, 58, 237, 0.4)'
                    }}>
                        <Cpu size={24} color="white" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 900, fontSize: '1.4rem', color: 'white', letterSpacing: '-0.5px' }}>SmartChain</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--primary-light)', marginTop: '-4px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>EXplorer</div>
                    </div>
                </Link>

                {/* Search - Desktop */}
                <form onSubmit={handleSearch} style={{
                    flex: 1,
                    maxWidth: '450px',
                    margin: '0 40px',
                    position: 'relative',
                    display: 'flex'
                }} className="desktop-search">
                    <div style={{ width: '100%', position: 'relative' }}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search Address / Tx / Block"
                            className="input glass"
                            style={{
                                paddingLeft: '48px',
                                borderRadius: '14px',
                                border: '1px solid var(--glass-border)'
                            }}
                        />
                        <Search size={18} style={{
                            position: 'absolute',
                            left: '16px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)',
                        }} />
                    </div>
                </form>

                {/* Navigation Links - Desktop */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                }} className="desktop-nav">
                    <NavLink to="/" icon={<Home size={18} />} label="Dashboard" active={isActive('/')} />
                    <NavLink to="/blocks" icon={<Blocks size={18} />} label="Blocks" active={isActive('/blocks')} />
                    <NavLink to="/transactions" icon={<Receipt size={18} />} label="Transactions" active={isActive('/transactions')} />
                    <NavLink to="/validators" icon={<Shield size={18} />} label="Validators" active={isActive('/validators')} />
                    <NavLink to="/portfolio" icon={<PieChart size={18} />} label="Portfolio" active={isActive('/portfolio')} />
                    <NavLink to="/staking" icon={<Lock size={18} />} label="Staking" active={isActive('/staking')} />
                    <NavLink to="/create-token" icon={<Rocket size={18} />} label="Token Factory" active={isActive('/create-token')} />
                    <NavLink to="/ai-contract" icon={<Bot size={18} />} label="AI Architect" active={isActive('/ai-contract')} />
                    <NavLink to="/faucet" icon={<Droplets size={18} />} label="Faucet" active={isActive('/faucet')} />
                </div>

                {/* Wallet Button */}
                <div style={{ marginLeft: '12px' }} className="desktop-nav">
                    <WalletButton />
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    style={{
                        display: 'none',
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                    }}
                    className="mobile-menu-btn"
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="animate-in" style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'rgba(15, 15, 26, 0.98)',
                    borderTop: '1px solid var(--glass-border)',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    <form onSubmit={handleSearch} style={{ marginBottom: '16px' }}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="🔍 Search..."
                            className="input"
                        />
                    </form>
                    <NavLink to="/" icon={<Home size={18} />} label="Dashboard" active={isActive('/')} fullWidth />
                    <NavLink to="/blocks" icon={<Blocks size={18} />} label="Blocks" active={isActive('/blocks')} fullWidth />
                    <NavLink to="/transactions" icon={<Receipt size={18} />} label="Transactions" active={isActive('/transactions')} fullWidth />
                    <NavLink to="/validators" icon={<Shield size={18} />} label="Validators" active={isActive('/validators')} fullWidth />
                    <NavLink to="/portfolio" icon={<PieChart size={18} />} label="Portfolio" active={isActive('/portfolio')} fullWidth />
                    <NavLink to="/staking" icon={<Lock size={18} />} label="Staking" active={isActive('/staking')} fullWidth />
                    <NavLink to="/create-token" icon={<Rocket size={18} />} label="Token Factory" active={isActive('/create-token')} fullWidth />
                    <NavLink to="/ai-contract" icon={<Bot size={18} />} label="AI Architect" active={isActive('/ai-contract')} fullWidth />
                    <NavLink to="/faucet" icon={<Droplets size={18} />} label="Faucet" active={isActive('/faucet')} fullWidth />
                </div>
            )}
        </nav>
    );
}

function WalletButton() {
    const { account, connectWallet, isConnecting, chainId, addNetwork } = useWeb3();
    const isWrongNetwork = chainId !== 1337 && account;

    if (isWrongNetwork) {
        return (
            <button
                onClick={addNetwork}
                className="btn btn-primary"
                style={{ background: 'var(--error)', border: 'none' }}
            >
                Wrong Network
            </button>
        );
    }

    if (account) {
        return (
            <div className="glass" style={{
                padding: '8px 16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid var(--glass-border)'
            }}>
                <div className="pulse-active" style={{ marginRight: 0 }}></div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
                    {account.slice(0, 6)}...{account.slice(-4)}
                </div>
            </div>
        );
    }

    return (
        <button
            onClick={connectWallet}
            className="btn btn-primary shine-effect"
            disabled={isConnecting}
            style={{ padding: '10px 20px', fontSize: '0.9rem' }}
        >
            <Wallet size={18} />
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
    );
}

function NavLink({ to, icon, label, active, fullWidth }: {
    to: string;
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    fullWidth?: boolean;
}) {
    return (
        <Link
            to={to}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 18px',
                borderRadius: '12px',
                color: active ? 'white' : 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: active ? 'rgba(124, 58, 237, 0.15)' : 'transparent',
                border: active ? '1px solid rgba(124, 58, 237, 0.2)' : '1px solid transparent',
                width: fullWidth ? '100%' : 'auto'
            }}
            className={active ? '' : 'shine-effect'}
        >
            <span style={{ color: active ? 'var(--primary-light)' : 'inherit' }}>{icon}</span>
            {label}
        </Link>
    );
}
