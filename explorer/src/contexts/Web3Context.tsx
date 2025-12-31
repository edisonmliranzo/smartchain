import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { ethers } from 'ethers';

interface Web3ContextType {
    account: string | null;
    chainId: number | null;
    isConnecting: boolean;
    connectionError: string | null;
    hasWallet: boolean;
    connectWallet: () => Promise<void>;
    addNetwork: () => Promise<void>;
    provider: ethers.BrowserProvider | null;
    clearError: () => void;
}

const Web3Context = createContext<Web3ContextType>({
    account: null,
    chainId: null,
    isConnecting: false,
    connectionError: null,
    hasWallet: false,
    connectWallet: async () => { },
    addNetwork: async () => { },
    provider: null,
    clearError: () => { },
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
    rpcUrls: [import.meta.env.VITE_API_URL || 'http://localhost:8545'],
    blockExplorerUrls: [window.location.origin],
};

export function Web3Provider({ children }: { children: ReactNode }) {
    const [account, setAccount] = useState<string | null>(null);
    const [chainId, setChainId] = useState<number | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

    const hasWallet = typeof window !== 'undefined' && !!window.ethereum;

    useEffect(() => {
        if (window.ethereum) {
            const providerInstance = new ethers.BrowserProvider(window.ethereum);
            setProvider(providerInstance);

            const handleAccountsChanged = (accounts: string[]) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                    setConnectionError(null);
                } else {
                    setAccount(null);
                }
            };

            const handleChainChanged = (chainIdVal: string) => {
                setChainId(Number(chainIdVal));
            };

            // Initial check
            providerInstance.listAccounts().then(accounts => {
                if (accounts.length > 0) {
                    setAccount(accounts[0].address);
                }
            }).catch(console.error);

            providerInstance.getNetwork().then(network => {
                setChainId(Number(network.chainId));
            }).catch(console.error);

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

    const clearError = () => {
        setConnectionError(null);
    };

    const connectWallet = async () => {
        if (!window.ethereum) {
            setConnectionError("No Ethereum wallet detected. Please install MetaMask or another Web3 wallet to connect.");
            return;
        }

        setIsConnecting(true);
        setConnectionError(null);

        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setAccount(accounts[0]);

            // Check network
            const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (Number(currentChainId) !== 1337) {
                await addNetwork();
            }
        } catch (error: any) {
            console.error("Failed to connect:", error);
            if (error.code === 4001) {
                setConnectionError("Connection rejected. Please approve the connection request in your wallet.");
            } else if (error.code === -32002) {
                setConnectionError("Connection request pending. Please check your wallet for a pending request.");
            } else {
                setConnectionError(error.message || "Failed to connect wallet. Please try again.");
            }
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
        } catch (error: any) {
            console.error("Failed to add network:", error);
            setConnectionError("Failed to add SmartChain network. Please try adding it manually.");
        }
    };

    return (
        <Web3Context.Provider value={{
            account,
            chainId,
            isConnecting,
            connectionError,
            hasWallet,
            connectWallet,
            addNetwork,
            provider,
            clearError
        }}>
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
