import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Blocks, Receipt, Droplets, Home, Menu, X, Cpu, Shield, Wallet, Rocket, Bot, Lock, PieChart, FileCode, ScanLine, Palette, Globe, MessageSquare } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';
import ThemeToggle from './ThemeToggle';
import QRScanner from './QRScanner';
import WalletModal from './WalletModal';

export default function Navbar() {
    const [searchQuery, setSearchQuery] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showQRScanner, setShowQRScanner] = useState(false);
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
            background: 'var(--bg-card)',
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
                        <div style={{ fontWeight: 900, fontSize: '1.4rem', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>SmartChain</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--primary)', marginTop: '-4px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px' }}>EXplorer</div>
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
                        <button
                            type="button"
                            onClick={() => setShowQRScanner(true)}
                            title="Scan QR Code"
                            style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'var(--gradient-primary)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: 'white',
                                fontSize: '0.75rem',
                                fontWeight: 600
                            }}
                        >
                            <ScanLine size={14} />
                            Scan
                        </button>
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
                    <NavLink to="/network" icon={<Globe size={18} />} label="Network" active={isActive('/network')} />
                    <NavLink to="/chat" icon={<MessageSquare size={18} />} label="Chat" active={isActive('/chat')} />

                    {/* Developers Dropdown */}
                    <div className="nav-dropdown-container" style={{ position: 'relative' }}>
                        <button className="nav-link shine-effect" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px 18px',
                            borderRadius: '12px',
                            background: 'transparent',
                            border: '1px solid transparent',
                            color: 'var(--text-secondary)',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}>
                            <FileCode size={18} />
                            Developers
                            <ScanLine size={12} style={{ opacity: 0.5, transform: 'rotate(90deg)' }} />
                        </button>
                        <div className="nav-dropdown-menu glass-card" style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            width: '240px',
                            padding: '8px',
                            marginTop: '8px',
                            borderRadius: '16px',
                            display: 'none',
                            flexDirection: 'column',
                            gap: '4px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                        }}>
                            <NavLink to="/portfolio" icon={<PieChart size={18} />} label="Portfolio" active={isActive('/portfolio')} fullWidth />
                            <NavLink to="/staking" icon={<Lock size={18} />} label="Staking" active={isActive('/staking')} fullWidth />
                            <NavLink to="/ai-contract" icon={<Bot size={18} />} label="AI Architect" active={isActive('/ai-contract')} fullWidth />
                            <NavLink to="/contract" icon={<FileCode size={18} />} label="Contracts" active={isActive('/contract')} fullWidth />
                            <NavLink to="/faucet" icon={<Droplets size={18} />} label="Faucet" active={isActive('/faucet')} fullWidth />
                            <NavLink to="/graffiti" icon={<Palette size={18} />} label="Graffiti" active={isActive('/graffiti')} fullWidth />
                        </div>
                        <style>{`
                            .nav-dropdown-container:hover .nav-dropdown-menu {
                                display: flex !important;
                                animation: fadeIn 0.2s ease;
                            }
                        `}</style>
                    </div>
                </div>

                {/* Theme Toggle & Wallet Button */}
                <div style={{ marginLeft: '12px', display: 'flex', alignItems: 'center', gap: '12px' }} className="desktop-nav">
                    <ThemeToggle />
                    <WalletButton />
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    style={{
                        display: 'none',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-primary)',
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
                    height: 'calc(100vh - 80px)', // Full height minus navbar
                    background: '#0f172a', // Solid background for readability
                    borderTop: '1px solid var(--glass-border)',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    zIndex: 1000,
                    overflowY: 'auto'
                }}>
                    <form onSubmit={(e) => { handleSearch(e); setMobileMenuOpen(false); }} style={{ marginBottom: '16px' }}>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="🔍 Search..."
                            className="input"
                            style={{ background: 'rgba(255,255,255,0.05)' }}
                        />
                    </form>

                    {/* Explorer Section */}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '8px', marginBottom: '8px', paddingLeft: '12px' }}>
                        Explorer
                    </div>
                    <NavLink to="/" icon={<Home size={18} />} label="Dashboard" active={isActive('/')} fullWidth onClick={() => setMobileMenuOpen(false)} />
                    <NavLink to="/blocks" icon={<Blocks size={18} />} label="Blocks" active={isActive('/blocks')} fullWidth onClick={() => setMobileMenuOpen(false)} />
                    <NavLink to="/transactions" icon={<Receipt size={18} />} label="Transactions" active={isActive('/transactions')} fullWidth onClick={() => setMobileMenuOpen(false)} />
                    <NavLink to="/validators" icon={<Shield size={18} />} label="Validators" active={isActive('/validators')} fullWidth onClick={() => setMobileMenuOpen(false)} />
                    <NavLink to="/network" icon={<Globe size={18} />} label="Network" active={isActive('/network')} fullWidth onClick={() => setMobileMenuOpen(false)} />
                    <NavLink to="/chat" icon={<MessageSquare size={18} />} label="Chat" active={isActive('/chat')} fullWidth onClick={() => setMobileMenuOpen(false)} />

                    {/* Developers Section */}
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '20px', marginBottom: '8px', paddingLeft: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileCode size={14} /> Developers
                    </div>
                    <NavLink to="/portfolio" icon={<PieChart size={18} />} label="Portfolio" active={isActive('/portfolio')} fullWidth onClick={() => setMobileMenuOpen(false)} />
                    <NavLink to="/staking" icon={<Lock size={18} />} label="Staking" active={isActive('/staking')} fullWidth onClick={() => setMobileMenuOpen(false)} />
                    <NavLink to="/create-token" icon={<Rocket size={18} />} label="Token Factory" active={isActive('/create-token')} fullWidth onClick={() => setMobileMenuOpen(false)} />
                    <NavLink to="/ai-contract" icon={<Bot size={18} />} label="AI Architect" active={isActive('/ai-contract')} fullWidth onClick={() => setMobileMenuOpen(false)} />
                    <NavLink to="/contract" icon={<FileCode size={18} />} label="Contracts" active={isActive('/contract')} fullWidth onClick={() => setMobileMenuOpen(false)} />
                    <NavLink to="/faucet" icon={<Droplets size={18} />} label="Faucet" active={isActive('/faucet')} fullWidth onClick={() => setMobileMenuOpen(false)} />
                    <NavLink to="/graffiti" icon={<Palette size={18} />} label="Graffiti" active={isActive('/graffiti')} fullWidth onClick={() => setMobileMenuOpen(false)} />

                    {/* Spacer for bottom safe area on mobile */}
                    <div style={{ height: '80px' }}></div>
                </div>
            )}

            {/* QR Scanner Modal */}
            <QRScanner isOpen={showQRScanner} onClose={() => setShowQRScanner(false)} />
        </nav>
    );
}

function WalletButton() {
    const { account, connectWallet, isConnecting, chainId, addNetwork, connectionError, hasWallet, clearError } = useWeb3();
    const [showModal, setShowModal] = useState(false);
    const isWrongNetwork = chainId !== 1337 && account;

    const handleConnect = async () => {
        if (!hasWallet) {
            setShowModal(true);
            return;
        }
        await connectWallet();
        if (connectionError) {
            setShowModal(true);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        clearError();
    };

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
        <>
            <button
                onClick={handleConnect}
                className="btn btn-primary shine-effect"
                disabled={isConnecting}
                style={{ padding: '10px 20px', fontSize: '0.9rem' }}
            >
                <Wallet size={18} />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
            <WalletModal
                isOpen={showModal || !!connectionError}
                onClose={handleCloseModal}
                error={connectionError || (!hasWallet ? "No Ethereum wallet detected. Please install MetaMask or another Web3 wallet to connect." : null)}
            />
        </>
    );
}

function NavLink({ to, icon, label, active, fullWidth, onClick }: {
    to: string;
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    fullWidth?: boolean;
    onClick?: () => void;
}) {
    return (
        <Link
            to={to}
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 18px',
                borderRadius: '12px',
                color: active ? 'var(--primary-dark)' : 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                background: active ? 'var(--gradient-glow)' : 'transparent',
                border: active ? '1px solid var(--primary)' : '1px solid transparent',
                boxShadow: active ? '0 2px 8px rgba(99, 102, 241, 0.15)' : 'none',
                width: fullWidth ? '100%' : 'auto'
            }}
            className={active ? 'nav-link-active' : 'shine-effect'}
        >
            <span style={{ color: active ? 'var(--primary)' : 'inherit' }}>{icon}</span>
            {label}
        </Link>
    );
}
