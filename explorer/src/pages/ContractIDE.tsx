import { useState } from 'react';
import { Code, Play, Download, Settings, CheckCircle, XCircle, AlertTriangle, Loader, FileCode, Rocket, Copy, Trash2 } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';

interface CompileResult {
    success: boolean;
    errors: string[];
    warnings: string[];
    bytecode?: string;
    abi?: any[];
    gasEstimate?: number;
}

interface DeployedContract {
    address: string;
    name: string;
    deployedAt: Date;
    txHash: string;
}

const TEMPLATES = {
    empty: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MyContract {
    
}`,
    token: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("My Token", "MTK") {
        _mint(msg.sender, initialSupply * 10 ** decimals());
    }
}`,
    nft: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    constructor() ERC721("My NFT", "MNFT") Ownable(msg.sender) {}

    function safeMint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}`,
    staking: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract StakingPool is ReentrancyGuard {
    IERC20 public stakingToken;
    uint256 public rewardRate = 100; // 100 tokens per second
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public stakedBalance;
    uint256 public totalStaked;

    constructor(address _stakingToken) {
        stakingToken = IERC20(_stakingToken);
    }

    function stake(uint256 amount) external nonReentrant {
        updateReward(msg.sender);
        totalStaked += amount;
        stakedBalance[msg.sender] += amount;
        stakingToken.transferFrom(msg.sender, address(this), amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        updateReward(msg.sender);
        totalStaked -= amount;
        stakedBalance[msg.sender] -= amount;
        stakingToken.transfer(msg.sender, amount);
    }

    function getReward() external nonReentrant {
        updateReward(msg.sender);
        uint256 reward = rewards[msg.sender];
        rewards[msg.sender] = 0;
        stakingToken.transfer(msg.sender, reward);
    }

    function updateReward(address account) internal {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        rewards[account] = earned(account);
        userRewardPerTokenPaid[account] = rewardPerTokenStored;
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) return rewardPerTokenStored;
        return rewardPerTokenStored + ((block.timestamp - lastUpdateTime) * rewardRate * 1e18) / totalStaked;
    }

    function earned(address account) public view returns (uint256) {
        return (stakedBalance[account] * (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18 + rewards[account];
    }
}`,
    multisig: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract MultiSigWallet {
    event Deposit(address indexed sender, uint256 amount);
    event Submit(uint256 indexed txId);
    event Approve(address indexed owner, uint256 indexed txId);
    event Execute(uint256 indexed txId);

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
    }

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public required;

    Transaction[] public transactions;
    mapping(uint256 => mapping(address => bool)) public approved;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not owner");
        _;
    }

    constructor(address[] memory _owners, uint256 _required) {
        require(_owners.length > 0, "Owners required");
        require(_required > 0 && _required <= _owners.length, "Invalid required");
        
        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner");
            require(!isOwner[owner], "Duplicate owner");
            isOwner[owner] = true;
            owners.push(owner);
        }
        required = _required;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function submit(address _to, uint256 _value, bytes calldata _data) external onlyOwner {
        transactions.push(Transaction({to: _to, value: _value, data: _data, executed: false}));
        emit Submit(transactions.length - 1);
    }

    function approve(uint256 _txId) external onlyOwner {
        require(!approved[_txId][msg.sender], "Already approved");
        approved[_txId][msg.sender] = true;
        emit Approve(msg.sender, _txId);
    }

    function execute(uint256 _txId) external onlyOwner {
        require(!transactions[_txId].executed, "Already executed");
        uint256 count = 0;
        for (uint256 i = 0; i < owners.length; i++) {
            if (approved[_txId][owners[i]]) count++;
        }
        require(count >= required, "Not enough approvals");
        
        Transaction storage transaction = transactions[_txId];
        transaction.executed = true;
        (bool success,) = transaction.to.call{value: transaction.value}(transaction.data);
        require(success, "Transaction failed");
        emit Execute(_txId);
    }
}`
};

export default function ContractIDE() {
    const { account, connectWallet } = useWeb3();
    const [code, setCode] = useState(TEMPLATES.empty);
    const [fileName, setFileName] = useState('MyContract.sol');
    const [compileResult, setCompileResult] = useState<CompileResult | null>(null);
    const [compiling, setCompiling] = useState(false);
    const [deploying, setDeploying] = useState(false);
    const [deployedContracts, setDeployedContracts] = useState<DeployedContract[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('empty');
    const [showSettings, setShowSettings] = useState(false);
    const [settings, setSettings] = useState({
        optimizer: true,
        runs: 200,
        evmVersion: 'paris'
    });

    const handleCompile = async () => {
        setCompiling(true);
        setCompileResult(null);

        // Simulate compilation
        await new Promise(resolve => setTimeout(resolve, 1500));

        const errors: string[] = [];
        const warnings: string[] = [];

        // Basic syntax checking
        if (!code.includes('pragma solidity')) {
            errors.push('Error: Source file requires pragma solidity declaration');
        }
        if (!code.includes('contract ')) {
            errors.push('Error: No contract definition found');
        }
        if (code.includes('//TODO') || code.includes('// TODO')) {
            warnings.push('Warning: TODO comments found in code');
        }
        if (!code.includes('// SPDX-License-Identifier')) {
            warnings.push('Warning: SPDX license identifier not provided');
        }

        const success = errors.length === 0;

        setCompileResult({
            success,
            errors,
            warnings,
            bytecode: success ? '0x608060405234801561001057600080fd5b50...' : undefined,
            abi: success ? [{ type: 'constructor', inputs: [] }] : undefined,
            gasEstimate: success ? 150000 + Math.floor(Math.random() * 100000) : undefined
        });

        setCompiling(false);
    };

    const handleDeploy = async () => {
        if (!compileResult?.success) return;
        if (!account) {
            await connectWallet();
            return;
        }

        setDeploying(true);

        // Simulate deployment
        await new Promise(resolve => setTimeout(resolve, 2000));

        const contractName = code.match(/contract\s+(\w+)/)?.[1] || 'Unknown';
        const newContract: DeployedContract = {
            address: `0x${Math.random().toString(16).slice(2, 42)}`,
            name: contractName,
            deployedAt: new Date(),
            txHash: `0x${Math.random().toString(16).slice(2, 66)}`
        };

        setDeployedContracts(prev => [newContract, ...prev]);
        setDeploying(false);
    };

    const handleTemplateChange = (template: string) => {
        setSelectedTemplate(template);
        setCode(TEMPLATES[template as keyof typeof TEMPLATES]);
        setCompileResult(null);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const lineCount = code.split('\n').length;

    return (
        <div className="container animate-in" style={{ paddingTop: '32px', paddingBottom: '64px' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', padding: '8px 20px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '30px', marginBottom: '16px' }}>
                    <Code size={18} color="#3b82f6" />
                    <span style={{ color: '#3b82f6', fontWeight: 600, letterSpacing: '2px', fontSize: '0.8rem' }}>SMART CONTRACT IDE</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>
                            Contract IDE
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Write, compile, and deploy smart contracts on SmartChain
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="btn-secondary"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <Settings size={18} />
                            Settings
                        </button>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="glass-card" style={{ padding: '16px', borderRadius: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <select
                            value={selectedTemplate}
                            onChange={(e) => handleTemplateChange(e.target.value)}
                            style={{
                                padding: '10px 16px',
                                borderRadius: '8px',
                                border: '1px solid var(--glass-border)',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="empty">Empty Contract</option>
                            <option value="token">ERC-20 Token</option>
                            <option value="nft">ERC-721 NFT</option>
                            <option value="staking">Staking Pool</option>
                            <option value="multisig">Multi-Sig Wallet</option>
                        </select>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileCode size={18} color="var(--text-muted)" />
                            <input
                                type="text"
                                value={fileName}
                                onChange={(e) => setFileName(e.target.value)}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--glass-border)',
                                    background: 'transparent',
                                    color: 'var(--text-primary)',
                                    width: '180px'
                                }}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={handleCompile}
                            disabled={compiling}
                            className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            {compiling ? <Loader size={18} className="spin" /> : <Play size={18} />}
                            {compiling ? 'Compiling...' : 'Compile'}
                        </button>
                        <button
                            onClick={handleDeploy}
                            disabled={!compileResult?.success || deploying}
                            className="btn-primary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: compileResult?.success ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : undefined,
                                opacity: compileResult?.success ? 1 : 0.5
                            }}
                        >
                            {deploying ? <Loader size={18} className="spin" /> : <Rocket size={18} />}
                            {deploying ? 'Deploying...' : 'Deploy'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', marginBottom: '24px' }}>
                    <h4 style={{ marginBottom: '16px' }}>Compiler Settings</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>EVM Version</label>
                            <select
                                value={settings.evmVersion}
                                onChange={(e) => setSettings(s => ({ ...s, evmVersion: e.target.value }))}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--glass-border)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'var(--text-primary)'
                                }}
                            >
                                <option value="paris">Paris</option>
                                <option value="london">London</option>
                                <option value="berlin">Berlin</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-muted)' }}>
                                <input
                                    type="checkbox"
                                    checked={settings.optimizer}
                                    onChange={(e) => setSettings(s => ({ ...s, optimizer: e.target.checked }))}
                                    style={{ accentColor: 'var(--primary)' }}
                                />
                                Enable Optimizer
                            </label>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)' }}>Optimizer Runs</label>
                            <input
                                type="number"
                                value={settings.runs}
                                onChange={(e) => setSettings(s => ({ ...s, runs: parseInt(e.target.value) }))}
                                disabled={!settings.optimizer}
                                style={{
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--glass-border)',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'var(--text-primary)',
                                    opacity: settings.optimizer ? 1 : 0.5
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
                {/* Code Editor */}
                <div className="glass-card" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                    <div style={{
                        padding: '12px 20px',
                        background: 'rgba(0,0,0,0.2)',
                        borderBottom: '1px solid var(--glass-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span style={{ fontWeight: 600 }}>{fileName}</span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {lineCount} lines | Solidity
                        </span>
                    </div>
                    <div style={{ display: 'flex' }}>
                        {/* Line Numbers */}
                        <div style={{
                            padding: '16px 12px',
                            background: 'rgba(0,0,0,0.1)',
                            borderRight: '1px solid var(--glass-border)',
                            textAlign: 'right',
                            fontFamily: 'monospace',
                            fontSize: '0.9rem',
                            color: 'var(--text-muted)',
                            userSelect: 'none',
                            lineHeight: '1.5'
                        }}>
                            {Array.from({ length: lineCount }, (_, i) => (
                                <div key={i}>{i + 1}</div>
                            ))}
                        </div>
                        {/* Editor */}
                        <textarea
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            spellCheck={false}
                            style={{
                                flex: 1,
                                padding: '16px',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-primary)',
                                fontFamily: 'monospace',
                                fontSize: '0.9rem',
                                lineHeight: '1.5',
                                resize: 'none',
                                minHeight: '500px',
                                outline: 'none'
                            }}
                        />
                    </div>
                </div>

                {/* Right Panel */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Compile Output */}
                    <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Code size={20} color="var(--primary)" />
                            Compile Output
                        </h3>

                        {compileResult ? (
                            <div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    background: compileResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                    marginBottom: '16px'
                                }}>
                                    {compileResult.success ? (
                                        <>
                                            <CheckCircle size={20} color="#10b981" />
                                            <span style={{ color: '#10b981', fontWeight: 600 }}>Compilation Successful</span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle size={20} color="#ef4444" />
                                            <span style={{ color: '#ef4444', fontWeight: 600 }}>Compilation Failed</span>
                                        </>
                                    )}
                                </div>

                                {compileResult.errors.map((error, i) => (
                                    <div key={i} style={{
                                        padding: '12px',
                                        borderRadius: '8px',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        marginBottom: '8px',
                                        fontSize: '0.85rem',
                                        color: '#ef4444'
                                    }}>
                                        {error}
                                    </div>
                                ))}

                                {compileResult.warnings.map((warning, i) => (
                                    <div key={i} style={{
                                        padding: '12px',
                                        borderRadius: '8px',
                                        background: 'rgba(245, 158, 11, 0.1)',
                                        marginBottom: '8px',
                                        fontSize: '0.85rem',
                                        color: '#f59e0b',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        <AlertTriangle size={16} />
                                        {warning}
                                    </div>
                                ))}

                                {compileResult.success && (
                                    <div style={{ marginTop: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Gas Estimate</span>
                                            <span style={{ fontWeight: 600 }}>{compileResult.gasEstimate?.toLocaleString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Bytecode Size</span>
                                            <span style={{ fontWeight: 600 }}>{compileResult.bytecode?.length} bytes</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                                Click "Compile" to check your code
                            </div>
                        )}
                    </div>

                    {/* Deployed Contracts */}
                    <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                        <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Rocket size={20} color="#10b981" />
                            Deployed Contracts
                        </h3>

                        {deployedContracts.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                                No contracts deployed yet
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {deployedContracts.map((contract, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            padding: '12px 16px',
                                            borderRadius: '12px',
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid var(--glass-border)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <span style={{ fontWeight: 600 }}>{contract.name}</span>
                                            <button
                                                onClick={() => copyToClipboard(contract.address)}
                                                style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    border: 'none',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    color: 'var(--text-muted)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                            >
                                                <Copy size={14} />
                                            </button>
                                        </div>
                                        <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                            {contract.address}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {contract.deployedAt.toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                        <h3 style={{ marginBottom: '16px' }}>Quick Actions</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button
                                onClick={() => copyToClipboard(code)}
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--glass-border)',
                                    background: 'transparent',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    textAlign: 'left'
                                }}
                            >
                                <Copy size={18} />
                                Copy Code
                            </button>
                            <button
                                onClick={() => {
                                    const blob = new Blob([code], { type: 'text/plain' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = fileName;
                                    a.click();
                                }}
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--glass-border)',
                                    background: 'transparent',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    textAlign: 'left'
                                }}
                            >
                                <Download size={18} />
                                Download File
                            </button>
                            <button
                                onClick={() => setCode(TEMPLATES.empty)}
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--glass-border)',
                                    background: 'transparent',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    textAlign: 'left'
                                }}
                            >
                                <Trash2 size={18} />
                                Clear Editor
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
