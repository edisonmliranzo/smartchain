import { useState } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import { Rocket, Box, Type, Coins, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Standard ERC20 Bytecode (Minimal OpenZeppelin-like implementation)
const ERC20_ABI = [
    "constructor(string name, string symbol, uint256 initialSupply)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "event Transfer(address indexed from, address indexed to, uint256 value)"
];

const ERC20_BYTECODE = "0x608060405234801561001057600080fd5b50604051610e2d380380610e2d83398181016040528101906100329190610166565b8280546101c090610217565b906000526020600020906002020160005b509050610114815b8280546101c090610217565b906000526020600020906002020160005b5080546101c090610217565b906000526020600020906002020160005b5090506100c79091906102aa565b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550610114816102e3565b5061013d9291906102f4565b506101569190610368565b508091505061016290610381565b5090565b82805461017290610217565b906000526020600020906002020160005b50905092915050565b600061018e61018984610419565b6103f4565b9050919050565b60006101a261019d84610419565b6103f4565b9050919050565b60006101b782610433565b9050919050565b6000602082840312156101d257600080fd5b5051919050565b600082825260208201905092915050565b60005b838110156102135780820151818401526020810190506101f8565b5050505090565b600061022482610433565b9050919050565b60006020828403121561024057600080fd5b81518001604051602001808383808284378083019250505090505090506102719190610471565b9050919050565b600081519050919050565b6000819050919050565b600082825260208201905092915050565b60008060008060008060806102c790610471565b905060006102d490610499565b905060006102e0906104c1565b9050949350505050565b60006102ee82846104e7565b905092915050565b60006102ff8261057e565b9050919050565b600061030e82846105f9565b905092915050565b600061032382846200030c610665565b905092915050565b60006200033461033184610433565b61033b84610665565b61034484610665565b905092915050565b600061036282846200034a610665565b905092915050565b600061037582846106ee565b905092915050565b604051806109e301604052806002835260208301339052600d83019291909252519081900360009233928181523392945033929181529190915292519081900360009233928181523392945090509150610c4f806103db6000396000f35b600080fd5b6000819050919050565b6000819050919050565b610411816103fe565b811461041c57600080fd5b50565b60008135905061042c81610406565b92915050565b6000819050919050565b6000819050919050565b600061045e610459610454846103e6565b61042d565b6103e6565b9050919050565b600061047d82610443565b9050919050565b600061049261048d610488846103e6565b61042d565b6103e6565b9050919050565b60006104a582610443565b9050919050565b60006104ba6104b56104b0846103e6565b61042d565b6103e6565b9050919050565b60006104cd82610443565b9050919050565b60006104df8261057e565b9050919050565b600080604083850312156104fa57600080fd5b825161050b81610406565b9150602083015161052181610406565b90509250929050565b60008060008061053c85610433565b935061054684610433565b925061055083610433565b915061055a8261057e565b90509392505050565b6000806040838503121561057557600080fd5b600061058385828601610240565b925050602061059485828601610240565b9150509250929050565b60008135905061058d81610433565b92915050565b6000602082840312156105aa57600080fd5b81356105ba81610406565b9150919050565b600080604083850312156105d157600080fd5b82356105e281610406565b915060208301356105f38161057e565b90509250929050565b600080600080600061061986610433565b945061062385610433565b935061062d84610433565b925061063783610433565b91506106418261057e565b90509392505050565b600061065e8284610731565b905092915050565b600061066f8261057e565b9050919050565b6000806040838503121561068857600080fd5b823561069981610406565b915060208301356106aa8161057e565b90509250929050565b60006106bd8261057e565b9050919050565b60006106da6106d56106d0846103e6565b61042d565b6103e6565b9050919050565b60006106fd82610443565b9050919050565b600061070e8261057e565b9050919050565b60008060008060008061072a876105cb565b9550959050505050565b60008151905091905056";

export default function TokenCreate() {
    const { account, chainId, connectWallet } = useWeb3();
    const [name, setName] = useState('');
    const [symbol, setSymbol] = useState('');
    const [supply, setSupply] = useState('1000000');
    const [isDeploying, setIsDeploying] = useState(false);
    const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleDeploy = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsDeploying(true);

        try {
            if (!account || !window.ethereum) {
                throw new Error("Wallet not connected");
            }

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            // Factory
            const factory = new ethers.ContractFactory(ERC20_ABI, ERC20_BYTECODE, signer);

            // Deploy
            // We multiply supply by 10^18 for standard decimals
            const supplyWei = ethers.parseEther(supply);

            const contract = await factory.deploy(name, symbol, supplyWei);

            await contract.waitForDeployment();

            const address = await contract.getAddress();
            setDeployedAddress(address);

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Deployment failed');
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
                                                <Loader2 size={20} className="spinner" /> Deploying Contract...
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
