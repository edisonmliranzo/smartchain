
import { useState } from 'react';
import { Bot, Code2, Copy, Check, FileCode, Loader2, Sparkles, AlertCircle, Rocket } from 'lucide-react';
import axios from 'axios';
import { ethers } from 'ethers';
import { Link } from 'react-router-dom';
// import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
// import { solidity } from 'react-syntax-highlighter/dist/esm/languages/hljs';
// import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

// SyntaxHighlighter.registerLanguage('solidity', solidity);

export default function AIContract() {
    const [prompt, setPrompt] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');
    const [auditReport, setAuditReport] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAuditing, setIsAuditing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt) return;

        setIsLoading(true);
        setError(null);
        setGeneratedCode('');
        setAuditReport('');

        try {
            const { data } = await axios.post('http://localhost:8545/api/ai/generate-contract', { prompt });
            setGeneratedCode(data.code);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || err.message || 'Failed to generate contract');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAudit = async () => {
        if (!generatedCode) return;

        setIsAuditing(true);
        try {
            const { data } = await axios.post('http://localhost:8545/api/ai/audit-contract', { code: generatedCode });
            setAuditReport(data.audit);
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || err.message || 'Failed to audit contract');
        } finally {
            setIsAuditing(false);
        }
    };

    const [isDeploying, setIsDeploying] = useState(false);
    const [deployedAddress, setDeployedAddress] = useState<string | null>(null);

    const handleDeploy = async () => {
        if (!generatedCode || !window.ethereum) return;
        setIsDeploying(true);
        setError(null);

        try {
            // 1. Compile
            const { data: compilation } = await axios.post('http://localhost:8545/api/compiler/compile', { sourceCode: generatedCode });

            // 2. Deploy
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const factory = new ethers.ContractFactory(compilation.abi, compilation.bytecode, signer);

            const contract = await factory.deploy();
            await contract.waitForDeployment();

            setDeployedAddress(await contract.getAddress());
        } catch (err: any) {
            console.error("Deployment Error:", err);
            setError(err.response?.data?.error || err.message || 'Failed to deploy contract');
        } finally {
            setIsDeploying(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
            {/* Header */}
            <div className="glass-card" style={{
                padding: '40px',
                borderRadius: '30px',
                marginBottom: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ background: 'linear-gradient(135deg, #a855f7 0%, #d946ef 100%)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, color: 'white' }}>
                            AI POWERED
                        </div>
                    </div>
                    <h1 className="gradient-text" style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '16px' }}>
                        Smart Contract Architect
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px' }}>
                        Describe your idea in plain English, and our AI will write the Solidity code for you in seconds.
                    </p>
                </div>
                <div style={{ opacity: 0.1, transform: 'rotate(10deg)', position: 'absolute', right: '-20px' }}>
                    <Bot size={300} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                {/* Left: Input */}
                <div className="glass-card" style={{ padding: '32px', borderRadius: '24px', height: 'fit-content' }}>
                    <h2 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Sparkles className="text-accent" /> Concept
                    </h2>

                    <form onSubmit={handleGenerate}>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '0.9rem', fontWeight: 600 }}>WHAT SHOULD THIS CONTRACT DO?</label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="E.g., Create a staking contract where users lock tokens for 30 days to earn 5% APY..."
                                style={{
                                    width: '100%',
                                    height: '200px',
                                    background: 'var(--bg-dark)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    color: 'white',
                                    fontSize: '1rem',
                                    resize: 'none',
                                    outline: 'none',
                                    lineHeight: '1.6'
                                }}
                            />
                        </div>

                        {error && (
                            <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', borderRadius: '12px', color: 'var(--error)', display: 'flex', gap: '12px', fontSize: '0.9rem' }}>
                                <AlertCircle size={20} />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary shine-effect"
                            style={{ width: '100%', padding: '16px', fontSize: '1.1rem', fontWeight: 700 }}
                            disabled={isLoading || !prompt}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={24} className="spinner" /> Generating Code...
                                </>
                            ) : (
                                <>
                                    <Bot size={24} /> Generate Contract
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Right: Output */}
                <div>
                    {!generatedCode ? (
                        <div className="glass-card" style={{ padding: '60px', borderRadius: '24px', textAlign: 'center', border: '2px dashed var(--glass-border)', background: 'transparent' }}>
                            <FileCode size={64} style={{ opacity: 0.2, marginBottom: '24px' }} />
                            <h3 style={{ color: 'var(--text-muted)' }}>Waiting for ideas...</h3>
                        </div>
                    ) : (
                        <div className="glass-card animate-in" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                            <div style={{
                                padding: '16px 24px',
                                background: 'rgba(0,0,0,0.3)',
                                borderBottom: '1px solid var(--glass-border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                    <Code2 size={16} /> Solidity
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={handleAudit}
                                        className="btn btn-secondary glass"
                                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                        disabled={isAuditing}
                                    >
                                        {isAuditing ? <Loader2 size={14} className="spinner" /> : <Check size={14} />} Audit
                                    </button>
                                    <button
                                        onClick={handleDeploy}
                                        className="btn btn-primary"
                                        style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--success)' }}
                                        disabled={isDeploying || deployedAddress !== null}
                                    >
                                        {isDeploying ? <Loader2 size={14} className="spinner" /> : <Rocket size={14} />} {deployedAddress ? 'Deployed' : 'Deploy'}
                                    </button>
                                    <button
                                        onClick={copyToClipboard}
                                        className="btn btn-secondary glass"
                                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                    >
                                        {copied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            <div style={{ maxHeight: '600px', overflow: 'auto' }}>
                                <textarea
                                    readOnly
                                    value={generatedCode}
                                    style={{
                                        width: '100%',
                                        height: '500px',
                                        background: 'var(--bg-dark)',
                                        color: '#a9b7c6',
                                        fontFamily: 'monospace',
                                        border: 'none',
                                        resize: 'none',
                                        padding: '24px',
                                        fontSize: '0.9rem',
                                        lineHeight: '1.6',
                                        outline: 'none'
                                    }}
                                />
                            </div>

                            {deployedAddress && (
                                <div className="animate-in" style={{ padding: '24px', borderTop: '1px solid var(--glass-border)', background: 'rgba(16, 185, 129, 0.1)' }}>
                                    <h4 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)' }}>
                                        <Rocket size={20} /> Contract Deployed Successfully!
                                    </h4>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                        Your AI-generated contract is now live on the SmartChain.
                                    </p>
                                    <Link to={`/address/${deployedAddress}`} className="btn btn-secondary glass" style={{ fontSize: '0.9rem' }}>
                                        View Contract {deployedAddress.slice(0, 10)}...
                                    </Link>
                                </div>
                            )}

                            {auditReport && (
                                <div className="animate-in" style={{ padding: '24px', borderTop: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                                    <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Check className="text-success" /> AI Audit Report
                                    </h4>
                                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        {auditReport}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
