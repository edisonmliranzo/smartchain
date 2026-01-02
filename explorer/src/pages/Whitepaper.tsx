import { FileText, Zap, Shield, Globe, Coins, Users, Rocket, CheckCircle, Target, TrendingUp } from 'lucide-react';

export default function Whitepaper() {
    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '64px', maxWidth: '900px' }}>
            {/* Header */}
            <div className="glass-card" style={{
                padding: '60px 40px',
                marginBottom: '48px',
                borderRadius: '30px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '8px 20px', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '30px', marginBottom: '24px' }}>
                        <FileText size={18} color="var(--primary)" />
                        <span style={{ color: 'var(--primary)', fontWeight: 600, letterSpacing: '2px', fontSize: '0.8rem' }}>WHITEPAPER v1.0</span>
                    </div>
                    <h1 className="gradient-text" style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '16px' }}>
                        SmartChain
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.3rem', maxWidth: '600px', margin: '0 auto 24px' }}>
                        A High-Performance EVM-Compatible Blockchain with Proof of Authority Consensus
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        <span>Published: January 2025</span>
                        <span>•</span>
                        <span>Version 1.0.0</span>
                        <span>•</span>
                        <span>Chain ID: 7001</span>
                    </div>
                </div>
            </div>

            {/* Table of Contents */}
            <div className="glass-card" style={{ padding: '32px', marginBottom: '32px', borderRadius: '24px' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    📑 Table of Contents
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    {['Abstract', 'Problem Statement', 'The Solution', 'Technical Architecture', 'Consensus Mechanism', 'Tokenomics', 'Use Cases', 'Roadmap'].map((item, i) => (
                        <a key={i} href={`#section-${i + 1}`} style={{
                            padding: '12px 16px',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '12px',
                            color: 'var(--text-secondary)',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }} className="hover-card">
                            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{i + 1}.</span> {item}
                        </a>
                    ))}
                </div>
            </div>

            {/* Section 1: Abstract */}
            <Section id="section-1" number="01" title="Abstract" icon={<Target size={24} />}>
                <p>
                    SmartChain is a next-generation blockchain platform designed to address the scalability,
                    speed, and usability challenges facing current blockchain networks. Built from the ground up
                    with a focus on developer experience and enterprise adoption, SmartChain combines the security
                    of proven cryptographic principles with the performance demands of modern applications.
                </p>
                <p>
                    By implementing a Proof of Authority (PoA) consensus mechanism with 1-second block times,
                    SmartChain achieves transaction finality in seconds rather than minutes, making it suitable
                    for real-world applications ranging from DeFi to supply chain management.
                </p>
                <HighlightBox>
                    <strong>Key Innovation:</strong> SmartChain delivers 1-second block times with full EVM compatibility,
                    enabling developers to deploy existing Ethereum smart contracts without modification.
                </HighlightBox>
            </Section>

            {/* Section 2: Problem Statement */}
            <Section id="section-2" number="02" title="Problem Statement" icon={<Zap size={24} />}>
                <p>
                    Current blockchain platforms face several critical challenges that limit mainstream adoption:
                </p>
                <ul style={{ marginLeft: '20px', marginTop: '16px' }}>
                    <li style={{ marginBottom: '12px' }}><strong>Scalability:</strong> Popular networks like Ethereum process only 15-30 transactions per second, causing congestion during high-demand periods.</li>
                    <li style={{ marginBottom: '12px' }}><strong>Transaction Costs:</strong> Gas fees can spike to hundreds of dollars during network congestion, making micro-transactions economically unfeasible.</li>
                    <li style={{ marginBottom: '12px' }}><strong>Confirmation Times:</strong> Users often wait 1-15 minutes for transaction confirmation, hindering real-time applications.</li>
                    <li style={{ marginBottom: '12px' }}><strong>Developer Friction:</strong> Complex tooling and unfamiliar programming paradigms slow adoption and increase development costs.</li>
                </ul>
            </Section>

            {/* Section 3: The Solution */}
            <Section id="section-3" number="03" title="The Solution: SmartChain" icon={<CheckCircle size={24} />}>
                <p>
                    SmartChain addresses these challenges through a purpose-built architecture:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '24px' }}>
                    <FeatureCard icon={<Zap />} title="1-Second Blocks" description="Near-instant transaction confirmation for real-time applications." />
                    <FeatureCard icon={<Coins />} title="Low Fees" description="Predictable, minimal transaction costs for any operation." />
                    <FeatureCard icon={<Shield />} title="EVM Compatible" description="Deploy Solidity contracts without any code changes." />
                    <FeatureCard icon={<Globe />} title="Global Network" description="Distributed validators across multiple continents." />
                </div>
            </Section>

            {/* Section 4: Technical Architecture */}
            <Section id="section-4" number="04" title="Technical Architecture" icon={<Shield size={24} />}>
                <p>
                    SmartChain's architecture is built on four core pillars:
                </p>

                <h4 style={{ marginTop: '24px', marginBottom: '12px', color: 'var(--primary)' }}>4.1 Execution Layer</h4>
                <p>
                    The execution layer implements a fully compatible Ethereum Virtual Machine (EVM), supporting
                    all standard opcodes and precompiled contracts. Smart contracts written in Solidity, Vyper,
                    or any EVM-compatible language can be deployed without modification.
                </p>

                <h4 style={{ marginTop: '24px', marginBottom: '12px', color: 'var(--primary)' }}>4.2 Consensus Layer</h4>
                <p>
                    SmartChain utilizes Proof of Authority (PoA) consensus, where a set of pre-approved validators
                    take turns producing blocks. This approach eliminates the energy waste of Proof of Work while
                    maintaining high throughput and deterministic finality.
                </p>

                <h4 style={{ marginTop: '24px', marginBottom: '12px', color: 'var(--primary)' }}>4.3 Networking Layer</h4>
                <p>
                    Peer-to-peer communication uses WebSocket connections for real-time block and transaction
                    propagation. The mesh network topology ensures rapid information distribution with automatic
                    peer discovery and connection management.
                </p>

                <h4 style={{ marginTop: '24px', marginBottom: '12px', color: 'var(--primary)' }}>4.4 Storage Layer</h4>
                <p>
                    State is managed using efficient key-value storage with Merkle Patricia Tries for cryptographic
                    verification. This enables light clients to verify state without downloading the full blockchain.
                </p>

                <CodeBlock>
                    {`// SmartChain Configuration
{
  "chainId": 7001,
  "chainName": "SmartChain Mainnet",
  "blockTime": 1000,        // 1 second
  "gasLimit": 100000000,    // 100M gas per block
  "consensus": "PoA",
  "validators": 5
}`}
                </CodeBlock>
            </Section>

            {/* Section 5: Consensus */}
            <Section id="section-5" number="05" title="Consensus Mechanism" icon={<Users size={24} />}>
                <p>
                    SmartChain's Proof of Authority consensus provides enterprise-grade reliability:
                </p>

                <div style={{ marginTop: '24px' }}>
                    <StatRow label="Block Time" value="1 second" />
                    <StatRow label="Finality" value="Immediate (single block)" />
                    <StatRow label="Validators" value="5 authorized nodes" />
                    <StatRow label="Throughput" value="1000+ TPS" />
                    <StatRow label="Energy Usage" value="Minimal (no mining)" />
                </div>

                <HighlightBox>
                    <strong>Validator Requirements:</strong> Each validator node must maintain 99.9% uptime,
                    undergo identity verification, and stake a minimum bond as security deposit.
                </HighlightBox>
            </Section>

            {/* Section 6: Tokenomics */}
            <Section id="section-6" number="06" title="Tokenomics" icon={<Coins size={24} />}>
                <p>
                    SMC is the native token of SmartChain, used for transaction fees, staking, and governance.
                </p>

                <h4 style={{ marginTop: '24px', marginBottom: '16px', color: 'var(--primary)' }}>Token Distribution</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                    <TokenAllocation label="Validator Rewards" percentage={40} color="#7c3aed" />
                    <TokenAllocation label="Ecosystem Fund" percentage={25} color="#06b6d4" />
                    <TokenAllocation label="Team & Advisors" percentage={15} color="#ec4899" />
                    <TokenAllocation label="Community" percentage={20} color="#10b981" />
                </div>

                <h4 style={{ marginTop: '32px', marginBottom: '16px', color: 'var(--primary)' }}>Token Utility</h4>
                <ul style={{ marginLeft: '20px' }}>
                    <li style={{ marginBottom: '8px' }}><strong>Gas Fees:</strong> All transactions require SMC for execution.</li>
                    <li style={{ marginBottom: '8px' }}><strong>Staking:</strong> Lock SMC to earn validator rewards.</li>
                    <li style={{ marginBottom: '8px' }}><strong>Governance:</strong> Vote on protocol upgrades and parameters.</li>
                    <li style={{ marginBottom: '8px' }}><strong>Collateral:</strong> Use as collateral in DeFi applications.</li>
                </ul>
            </Section>

            {/* Section 7: Use Cases */}
            <Section id="section-7" number="07" title="Use Cases" icon={<Globe size={24} />}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    <UseCaseCard
                        title="DeFi Applications"
                        description="Build decentralized exchanges, lending protocols, and yield farming platforms with instant transaction confirmation."
                    />
                    <UseCaseCard
                        title="NFT Marketplaces"
                        description="Create and trade NFTs with minimal gas fees and instant minting."
                    />
                    <UseCaseCard
                        title="Gaming"
                        description="Enable in-game economies with real-time item transfers and provably fair mechanics."
                    />
                    <UseCaseCard
                        title="Supply Chain"
                        description="Track products from origin to consumer with immutable, timestamped records."
                    />
                    <UseCaseCard
                        title="Identity & Credentials"
                        description="Issue and verify digital credentials, certificates, and identity documents."
                    />
                    <UseCaseCard
                        title="IoT & Data"
                        description="Record sensor data and device interactions with cryptographic integrity."
                    />
                </div>
            </Section>

            {/* Section 8: Roadmap */}
            <Section id="section-8" number="08" title="Roadmap" icon={<Rocket size={24} />}>
                <div style={{ position: 'relative', paddingLeft: '30px' }}>
                    <div style={{ position: 'absolute', left: '8px', top: 0, bottom: 0, width: '2px', background: 'var(--gradient-primary)' }} />

                    <RoadmapItem quarter="Q1 2025" title="Mainnet Launch" items={['Core blockchain deployment', 'Block explorer', 'Faucet & wallet integration']} completed />
                    <RoadmapItem quarter="Q2 2025" title="DeFi Ecosystem" items={['SmartSwap DEX', 'Staking platform', 'Bridge to Ethereum']} />
                    <RoadmapItem quarter="Q3 2025" title="NFT Platform" items={['NFT minting studio', 'Marketplace launch', 'Creator tools']} />
                    <RoadmapItem quarter="Q4 2025" title="Enterprise Adoption" items={['Private chain deployment', 'Multi-sig wallets', 'Compliance tools']} />
                </div>
            </Section>

            {/* Footer */}
            <div className="glass-card" style={{ padding: '40px', borderRadius: '24px', textAlign: 'center', marginTop: '48px' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px' }}>Join the SmartChain Revolution</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                    Start building on SmartChain today. Deploy your first smart contract in minutes.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <a href="https://smartchain.fun/faucet" className="btn btn-primary">Get Test Tokens</a>
                    <a href="https://smartchain.fun/create-token" className="btn btn-secondary glass">Create Token</a>
                    <a href="https://github.com/edisonmliranzo/smartchain" target="_blank" className="btn btn-secondary glass">GitHub</a>
                </div>
            </div>
        </div>
    );
}

// Helper Components
function Section({ id, number, title, icon, children }: { id: string; number: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <section id={id} className="glass-card" style={{ padding: '40px', marginBottom: '32px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    {icon}
                </div>
                <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, letterSpacing: '2px' }}>SECTION {number}</div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{title}</h2>
                </div>
            </div>
            <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1rem' }}>
                {children}
            </div>
        </section>
    );
}

function HighlightBox({ children }: { children: React.ReactNode }) {
    return (
        <div style={{
            marginTop: '20px',
            padding: '20px',
            background: 'rgba(124, 58, 237, 0.1)',
            borderLeft: '4px solid var(--primary)',
            borderRadius: '0 12px 12px 0',
            color: 'var(--text-primary)'
        }}>
            {children}
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
            <div style={{ color: 'var(--primary)', marginBottom: '12px' }}>{icon}</div>
            <h4 style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>{title}</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>{description}</p>
        </div>
    );
}

function CodeBlock({ children }: { children: string }) {
    return (
        <pre style={{
            marginTop: '20px',
            padding: '20px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '12px',
            overflow: 'auto',
            fontSize: '0.85rem',
            color: '#00ff41',
            fontFamily: 'monospace'
        }}>
            {children}
        </pre>
    );
}

function StatRow({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--glass-border)' }}>
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
        </div>
    );
}

function TokenAllocation({ label, percentage, color }: { label: string; percentage: number; color: string }) {
    return (
        <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color }}>{percentage}%</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>{label}</div>
        </div>
    );
}

function UseCaseCard({ title, description }: { title: string; description: string }) {
    return (
        <div style={{ padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
            <h4 style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>{title}</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>{description}</p>
        </div>
    );
}

function RoadmapItem({ quarter, title, items, completed }: { quarter: string; title: string; items: string[]; completed?: boolean }) {
    return (
        <div style={{ marginBottom: '32px', position: 'relative' }}>
            <div style={{
                position: 'absolute',
                left: '-26px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: completed ? 'var(--success)' : 'var(--glass-border)',
                border: '3px solid var(--bg-primary)'
            }} />
            <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '4px' }}>{quarter}</div>
            <h4 style={{ fontWeight: 700, marginBottom: '8px' }}>{title}</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {items.map((item, i) => <li key={i} style={{ marginBottom: '4px' }}>{item}</li>)}
            </ul>
        </div>
    );
}
