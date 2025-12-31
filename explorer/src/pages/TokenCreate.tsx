import { useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { Rocket, Box, Type, Coins, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// ERC20 Solidity Source Code Template
const getERC20Source = (name: string, symbol: string, initialSupply: string) => `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ${symbol.replace(/[^a-zA-Z0-9]/g, '')}Token {
    string public name = "${name}";
    string public symbol = "${symbol}";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor() {
        totalSupply = ${initialSupply} * 10 ** uint256(decimals);
        balanceOf[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    function transfer(address to, uint256 value) public returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
    
    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        emit Transfer(from, to, value);
        return true;
    }
}
`;

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}` : 'http://localhost:8545';

export default function TokenCreate() {
    const { account, chainId, connectWallet } = useWeb3();
    const [name, setName] = useState('');
    const [symbol, setSymbol] = useState('');
    const [supply, setSupply] = useState('1000000');
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('');

    const handleDeploy = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsDeploying(true);
        setStatus('Compiling contract...');

        try {
            if (!account || !window.ethereum) {
                throw new Error("Wallet not connected");
            }

            // Step 1: Compile the contract using the backend compiler
            const sourceCode = getERC20Source(name, symbol, supply);

            const compileResponse = await fetch(`${API_URL}/api/compiler/compile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sourceCode })
            });

            // Parse response ONCE - can't call .json() twice on the same response
            const compileResult = await compileResponse.json();
            console.log('Compile result:', compileResult);

            if (!compileResponse.ok) {
                throw new Error(compileResult.error || 'Compilation failed');
            }

            const { abi, bytecode } = compileResult;
            console.log('ABI:', abi);
            console.log('Bytecode length:', bytecode?.length);
            console.log('Bytecode first 100 chars:', bytecode?.substring(0, 100));

            if (!bytecode || bytecode.length === 0) {
                throw new Error('Compilation returned empty bytecode');
            }

            setStatus('Deploying contract...');

            // Step 2: Deploy the contract
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            // Ensure bytecode has 0x prefix
            const finalBytecode = bytecode.startsWith('0x') ? bytecode : '0x' + bytecode;
            console.log('Final bytecode first 100 chars:', finalBytecode.substring(0, 100));

            const factory = new ethers.ContractFactory(abi, finalBytecode, signer);
            console.log('ContractFactory created, deploying...');
            const contract = await factory.deploy();

            setStatus('Waiting for confirmation...');
            await contract.waitForDeployment();

            const address = await contract.getAddress();
            setDeployedAddress(address);
            setStatus('');

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Deployment failed');
            setStatus('');
        } finally {
            setIsDeploying(false);
        }
    };

    const isWrongNetwork = chainId !== 1337;

    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
            {/* Header */}
            <div className="glass-card" style={{
                textAlign: 'left',
                padding: '48px 40px',
                borderRadius: '30px',
                marginBottom: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'relative', zIndex: 2, maxWidth: '600px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ background: 'var(--accent)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, color: 'black' }}>
                            NEW FEATURE
                        </div>
                    </div>
                    <h1 className="gradient-text" style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '16px' }}>
                        Token Factory
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
                        Launch your own cryptocurrency on SmartChain in seconds. No coding required.
                    </p>
                </div>

                <div style={{ opacity: 0.1, transform: 'rotate(-20deg)', position: 'absolute', right: '-40px' }}>
                    <Rocket size={320} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px' }}>
                {/* Form Section */}
                <div>
                    {!account ? (
                        <div className="glass-card" style={{ padding: '60px', textAlign: 'center', borderRadius: '24px' }}>
                            <div style={{ marginBottom: '24px', opacity: 0.5 }}><Box size={64} /></div>
                            <h2 style={{ marginBottom: '16px' }}>Connect Wallet to Start</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
                                You need to be connected to SmartChain to deploy contracts.
                            </p>
                            <button onClick={connectWallet} className="btn btn-primary">Connect Wallet</button>
                        </div>
                    ) : (
                        <div className="glass-card" style={{ padding: '40px', borderRadius: '24px' }}>
                            <h2 className="card-title" style={{ marginBottom: '32px' }}>
                                <Coins size={24} /> Token Configuration
                            </h2>

                            <form onSubmit={handleDeploy}>
                                <div style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>TOKEN NAME</label>
                                    <div className="input-group" style={{ position: 'relative' }}>
                                        <Type size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g. SmartChain Gold"
                                            className="input"
                                            style={{ paddingLeft: '48px' }}
                                            required
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                                    <div>
                                        <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>SYMBOL</label>
                                        <input
                                            type="text"
                                            value={symbol}
                                            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                                            placeholder="e.g. SGLD"
                                            className="input"
                                            required
                                            maxLength={5}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>INITIAL SUPPLY</label>
                                        <input
                                            type="number"
                                            value={supply}
                                            onChange={(e) => setSupply(e.target.value)}
                                            className="input"
                                            required
                                        />
                                    </div>
                                </div>

                                {isWrongNetwork ? (
                                    <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', borderRadius: '12px', color: 'var(--error)', textAlign: 'center' }}>
                                        Please switch to SmartChain to deploy.
                                    </div>
                                ) : (
                                    <button
                                        type="submit"
                                        className="btn btn-primary shine-effect"
                                        disabled={isDeploying || !name || !symbol}
                                        style={{ width: '100%', padding: '16px', fontSize: '1.1rem', fontWeight: 700 }}
                                    >
                                        {isDeploying ? (
                                            <>
                                                <Loader2 size={20} className="spinner" /> {status || 'Processing...'}
                                            </>
                                        ) : (
                                            <>
                                                <Rocket size={20} /> Launch Token
                                            </>
                                        )}
                                    </button>
                                )}
                            </form>

                            {error && (
                                <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', borderRadius: '12px', color: 'var(--error)', display: 'flex', gap: '12px' }}>
                                    <AlertCircle size={20} />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Preview / Success Section */}
                <div>
                    {deployedAddress ? (
                        <div className="glass-card animate-in" style={{ padding: '40px', borderRadius: '24px', textAlign: 'center', border: '1px solid var(--success)', background: 'rgba(16, 185, 129, 0.05)' }}>
                            <div style={{ width: '80px', height: '80px', background: 'var(--success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                <CheckCircle size={40} color="white" />
                            </div>
                            <h2 style={{ color: 'var(--success)', marginBottom: '8px' }}>Launch Successful!</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                                Your token <strong>{name} ({symbol})</strong> is now live on the blockchain.
                            </p>

                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '16px', marginBottom: '24px' }}>
                                <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Token Contract Address</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', wordBreak: 'break-all', color: 'white' }}>{deployedAddress}</div>
                            </div>

                            <div style={{ display: 'grid', gap: '16px' }}>
                                <Link to={`/address/${deployedAddress}`} className="btn btn-secondary glass" style={{ width: '100%', justifyContent: 'center' }}>
                                    View in Explorer <ArrowRight size={18} />
                                </Link>
                                <button
                                    onClick={() => {
                                        if (window.ethereum) {
                                            window.ethereum.request({
                                                method: 'wallet_watchAsset',
                                                params: {
                                                    type: 'ERC20',
                                                    options: {
                                                        address: deployedAddress,
                                                        symbol: symbol,
                                                        decimals: 18,
                                                        image: '',
                                                    },
                                                },
                                            });
                                        }
                                    }}
                                    className="btn btn-secondary glass"
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    <WalletAdd size={18} /> Add to MetaMask
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card" style={{ padding: '40px', borderRadius: '24px', opacity: 0.8 }}>
                            <h3 style={{ marginBottom: '24px' }}>Deployment Preview</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <PreviewRow label="Name" value={name || '...'} />
                                <PreviewRow label="Symbol" value={symbol || '...'} />
                                <PreviewRow label="Supply" value={supply ? `${new Intl.NumberFormat().format(parseInt(supply))} ${symbol || ''}` : '...'} />
                                <PreviewRow label="Network" value={chainId === 1337 ? 'SmartChain Local' : 'Unknown'} />
                            </div>

                            <div style={{ marginTop: '32px', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                                <p style={{ marginBottom: '8px' }}>ℹ️ <strong>Note:</strong></p>
                                This will deploy a standard ERC-20 Smart Contract. You will be the owner and receive the entire initial supply.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--glass-border)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
            <span style={{ fontWeight: 600 }}>{value}</span>
        </div>
    );
}

function WalletAdd({ size = 18 }: { size?: number }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <path d="M8 2v3" />
            <path d="M16 2v3" />
            <path d="M12 12v.01" />
        </svg>
    );
}
