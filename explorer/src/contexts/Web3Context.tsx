import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { ethers } from 'ethers';

interface Web3ContextType {
    account: string | null;
    chainId: number | null;
    isConnecting: boolean;
    connectWallet: () => Promise<void>;
    addNetwork: () => Promise<void>;
    provider: ethers.BrowserProvider | null;
}

const Web3Context = createContext<Web3ContextType>({
    account: null,
    chainId: null,
    isConnecting: false,
    connectWallet: async () => { },
    addNetwork: async () => { },
    provider: null,
});

export const useWeb3 = () => useContext(Web3Context);

// SmartChain Network Params
const SMARTCHAIN_PARAMS = {
    chainId: '0x539', // 1337
    chainName: 'SmartChain Local',
    nativeCurrency: {
        name: 'SmartCoin',
        symbol: 'SMC',
        decimals: 18,
    },
    rpcUrls: ['http://localhost:8545'],
    blockExplorerUrls: ['http://localhost:5173'],
};

export function Web3Provider({ children }: { children: ReactNode }) {
    const [account, setAccount] = useState<string | null>(null);
    const [chainId, setChainId] = useState<number | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

    useEffect(() => {
        if (window.ethereum) {
            const providerInstance = new ethers.BrowserProvider(window.ethereum);
            setProvider(providerInstance);

            const handleAccountsChanged = (accounts: string[]) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                } else {
                    setAccount(null);
                }
            };

            const handleChainChanged = (chainIdVal: string) => {
                setChainId(Number(chainIdVal));
                // Optional: Reload page is common practice but React state update is smoother if components handle it well
                // window.location.reload(); 
            };

            // Initial check
            providerInstance.listAccounts().then(accounts => {
                if (accounts.length > 0) {
                    setAccount(accounts[0].address);
                }
            });

            providerInstance.getNetwork().then(network => {
                setChainId(Number(network.chainId));
            });

            // Listen for changes
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

            // Cleanup
            return () => {
                if (window.ethereum.removeListener) {
                    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                    window.ethereum.removeListener('chainChanged', handleChainChanged);
                }
            };
        }
    }, []);

    const connectWallet = async () => {
        if (!window.ethereum) {
            alert("Please install MetaMask!");
            return;
        }

        setIsConnecting(true);
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setAccount(accounts[0]);

            // Check network
            const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (Number(currentChainId) !== 1337) {
                await addNetwork();
            }
        } catch (error) {
            console.error("Failed to connect:", error);
        } finally {
            setIsConnecting(false);
        }
    };

    const addNetwork = async () => {
        if (!window.ethereum) return;

        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [SMARTCHAIN_PARAMS],
            });
        } catch (error) {
            console.error("Failed to add network:", error);
        }
    };

    return (
        <Web3Context.Provider value={{ account, chainId, isConnecting, connectWallet, addNetwork, provider }}>
            {children}
        </Web3Context.Provider>
    );
}

// Add window.ethereum type
declare global {
    interface Window {
        ethereum: any;
    }
}
