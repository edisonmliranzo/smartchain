import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';
import {
    FileCode,
    Play,
    Send,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    CheckCircle,
    Loader,
    Copy,
    Check
} from 'lucide-react';

interface ABIItem {
    name?: string;
    type: string;
    inputs?: { name: string; type: string }[];
    outputs?: { name: string; type: string }[];
    stateMutability?: string;
}

export default function ContractInteract() {
    const { provider, account } = useWeb3();
    const [contractAddress, setContractAddress] = useState('');
    const [abiInput, setAbiInput] = useState('');
    const [parsedABI, setParsedABI] = useState<ABIItem[]>([]);
    const [error, setError] = useState('');
    const [isLoaded, setIsLoaded] = useState(false);

    const handleLoadContract = () => {
        try {
            setError('');
            const abi = JSON.parse(abiInput);
            const functions = abi.filter((item: ABIItem) => item.type === 'function');
            setParsedABI(functions);
            setIsLoaded(true);
        } catch {
            setError('Invalid ABI format. Please paste a valid JSON ABI.');
        }
    };

    return (
        <div className="container animate-in" style={{ paddingTop: '100px', paddingBottom: '64px' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>
                    <FileCode style={{ display: 'inline', marginRight: '12px' }} size={32} />
                    Contract Interact
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Read and write to any smart contract on SmartChain
                </p>
            </div>

            {/* Contract Input Section */}
            <div className="glass-card" style={{ padding: '32px', borderRadius: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'grid', gap: '20px' }}>
                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            fontSize: '0.9rem'
                        }}>
                            Contract Address
                        </label>
                        <input
                            type="text"
                            className="input glass"
                            value={contractAddress}
                            onChange={(e) => setContractAddress(e.target.value)}
                            placeholder="0x..."
                            style={{ fontFamily: 'var(--font-mono)' }}
                        />
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            fontSize: '0.9rem'
                        }}>
                            Contract ABI (JSON)
                        </label>
                        <textarea
                            className="input glass"
                            value={abiInput}
                            onChange={(e) => setAbiInput(e.target.value)}
                            placeholder='[{"type":"function","name":"balanceOf",...}]'
                            style={{
                                minHeight: '120px',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.8rem',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '12px 16px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '12px',
                            color: 'var(--error)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleLoadContract}
                        className="btn btn-primary shine-effect"
                        style={{ width: 'fit-content' }}
                    >
                        <FileCode size={18} />
                        Load Contract
                    </button>
                </div>
            </div>

            {/* Functions List */}
            {isLoaded && parsedABI.length > 0 && (
                <div className="glass-card" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                    <div style={{
                        padding: '20px 24px',
                        borderBottom: '1px solid var(--glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                            Contract Functions
                        </h2>
                        <span className="badge badge-success">
                            {parsedABI.length} functions
                        </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {parsedABI.map((func, index) => (
                            <FunctionCard
                                key={index}
                                func={func}
                                contractAddress={contractAddress}
                                provider={provider}
                                account={account}
                            />
                        ))}
                    </div>
                </div>
            )}

            {!account && isLoaded && (
                <div className="glass-card" style={{
                    padding: '24px',
                    borderRadius: '16px',
                    marginTop: '24px',
                    textAlign: 'center',
                    color: 'var(--warning)'
                }}>
                    <AlertCircle size={24} style={{ marginBottom: '8px' }} />
                    <p>Connect your wallet to interact with write functions</p>
                </div>
            )}
        </div>
    );
}

function FunctionCard({
    func,
    contractAddress,
    provider,
    account
}: {
    func: ABIItem;
    contractAddress: string;
    provider: ethers.BrowserProvider | null;
    account: string | null;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [inputs, setInputs] = useState<{ [key: string]: string }>({});
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);

    const isReadOnly = func.stateMutability === 'view' || func.stateMutability === 'pure';

    const handleInputChange = (name: string, value: string) => {
        setInputs(prev => ({ ...prev, [name]: value }));
    };

    const handleExecute = useCallback(async () => {
        if (!provider) return;

        setIsLoading(true);
        setError('');
        setResult(null);

        try {
            const signer = isReadOnly ? provider : await provider.getSigner();
            const contract = new ethers.Contract(
                contractAddress,
                [func],
                signer
            );

            const args = (func.inputs || []).map(input => {
                const value = inputs[input.name] || '';
                // Handle arrays
                if (input.type.includes('[]')) {
                    return JSON.parse(value);
                }
                return value;
            });

            const response = await contract[func.name!](...args);

            if (isReadOnly) {
                // Format result
                if (typeof response === 'bigint') {
                    setResult(response.toString());
                } else if (Array.isArray(response)) {
                    setResult(JSON.stringify(response, null, 2));
                } else {
                    setResult(String(response));
                }
            } else {
                // Transaction - wait for confirmation
                const receipt = await response.wait();
                setResult(`Transaction confirmed!\nHash: ${receipt.hash}`);
            }
        } catch (err: any) {
            setError(err.message || 'Execution failed');
        } finally {
            setIsLoading(false);
        }
    }, [provider, contractAddress, func, inputs, isReadOnly]);

    const handleCopy = async () => {
        if (result) {
            await navigator.clipboard.writeText(result);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div style={{ borderBottom: '1px solid var(--glass-border)' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    padding: '16px 24px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: 'var(--text-primary)',
                    transition: 'background 0.2s'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className={`badge ${isReadOnly ? 'badge-success' : 'badge-warning'}`}>
                        {isReadOnly ? 'Read' : 'Write'}
                    </span>
                    <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        {func.name}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        ({(func.inputs || []).map(i => i.type).join(', ')})
                    </span>
                </div>
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {isOpen && (
                <div style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.2)' }}>
                    {/* Inputs */}
                    {(func.inputs || []).length > 0 && (
                        <div style={{ marginBottom: '16px' }}>
                            {func.inputs?.map((input, i) => (
                                <div key={i} style={{ marginBottom: '12px' }}>
                                    <label style={{
                                        display: 'block',
                                        marginBottom: '6px',
                                        fontSize: '0.85rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        {input.name || `arg${i}`}
                                        <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
                                            ({input.type})
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input glass"
                                        placeholder={input.type}
                                        value={inputs[input.name] || ''}
                                        onChange={(e) => handleInputChange(input.name, e.target.value)}
                                        style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Execute Button */}
                    <button
                        onClick={handleExecute}
                        disabled={isLoading || (!isReadOnly && !account)}
                        className={`btn ${isReadOnly ? 'btn-secondary glass' : 'btn-primary'}`}
                        style={{ marginBottom: '16px' }}
                    >
                        {isLoading ? (
                            <Loader size={16} className="spinner" />
                        ) : isReadOnly ? (
                            <Play size={16} />
                        ) : (
                            <Send size={16} />
                        )}
                        {isReadOnly ? 'Query' : 'Execute'}
                    </button>

                    {/* Result */}
                    {result && (
                        <div style={{
                            padding: '16px',
                            background: 'rgba(16, 185, 129, 0.1)',
                            borderRadius: '12px',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '8px'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: 'var(--success)'
                                }}>
                                    <CheckCircle size={16} />
                                    <span style={{ fontWeight: 600 }}>Result</span>
                                </div>
                                <button
                                    onClick={handleCopy}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-secondary)',
                                        padding: '4px'
                                    }}
                                >
                                    {copied ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                            </div>
                            <pre style={{
                                margin: 0,
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.9rem',
                                color: 'var(--text-primary)',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-all'
                            }}>
                                {result}
                            </pre>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div style={{
                            padding: '16px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            borderRadius: '12px',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: 'var(--error)',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px'
                        }}>
                            <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>{error}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
