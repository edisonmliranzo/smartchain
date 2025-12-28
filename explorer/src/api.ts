import axios from 'axios';

const API_URL = 'http://localhost:8545/api';
const RPC_URL = 'http://localhost:8545';

// REST API calls
export const api = {
    // Chain info
    getChainInfo: async () => {
        const { data } = await axios.get(`${API_URL}/chain/info`);
        return data;
    },

    getChainStats: async () => {
        const { data } = await axios.get(`${API_URL}/chain/stats`);
        return data;
    },

    // Blocks
    getBlocks: async (page = 1, limit = 20) => {
        const { data } = await axios.get(`${API_URL}/blocks`, { params: { page, limit } });
        return data;
    },

    getBlock: async (identifier: string) => {
        const { data } = await axios.get(`${API_URL}/blocks/${identifier}`);
        return data;
    },

    getLatestBlock: async () => {
        const { data } = await axios.get(`${API_URL}/blocks/latest`);
        return data;
    },

    // Transactions
    getTransactions: async (page = 1, limit = 20) => {
        const { data } = await axios.get(`${API_URL}/transactions`, { params: { page, limit } });
        return data;
    },

    getPendingTransactions: async () => {
        const { data } = await axios.get(`${API_URL}/transactions/pending`);
        return data;
    },

    getTransaction: async (hash: string) => {
        const { data } = await axios.get(`${API_URL}/transactions/${hash}`);
        return data;
    },

    // Accounts
    getAccount: async (address: string) => {
        const { data } = await axios.get(`${API_URL}/accounts/${address}`);
        return data;
    },

    getAccountTransactions: async (address: string, page = 1, limit = 20) => {
        const { data } = await axios.get(`${API_URL}/accounts/${address}/transactions`, { params: { page, limit } });
        return data;
    },

    // Mempool
    getMempoolStats: async () => {
        const { data } = await axios.get(`${API_URL}/mempool/stats`);
        return data;
    },

    // Faucet
    requestFaucet: async (address: string) => {
        const { data } = await axios.post(`${API_URL}/faucet`, { address });
        return data;
    },

    // Search
    search: async (query: string) => {
        const { data } = await axios.get(`${API_URL}/search/${query}`);
        return data;
    },

    // Rich List
    getRichList: async (limit = 10) => {
        const { data } = await axios.get(`${API_URL}/rich-list`, { params: { limit } });
        return data;
    },

    // Validators
    getValidators: async () => {
        const { data } = await axios.get(`${API_URL}/chain/validators`);
        return data;
    },
};

// JSON-RPC calls
export const rpc = {
    call: async (method: string, params: any[] = []) => {
        const { data } = await axios.post(RPC_URL, {
            jsonrpc: '2.0',
            method,
            params,
            id: Date.now(),
        });
        return data.result;
    },

    getBlockNumber: async () => {
        const result = await rpc.call('eth_blockNumber');
        return parseInt(result, 16);
    },

    getGasPrice: async () => {
        const result = await rpc.call('eth_gasPrice');
        return BigInt(result);
    },

    getBalance: async (address: string) => {
        const result = await rpc.call('eth_getBalance', [address, 'latest']);
        return BigInt(result);
    },

    getTransactionCount: async (address: string) => {
        const result = await rpc.call('eth_getTransactionCount', [address, 'latest']);
        return parseInt(result, 16);
    },

    getChainId: async () => {
        const result = await rpc.call('eth_chainId');
        return parseInt(result, 16);
    },

    sendRawTransaction: async (signedTx: string) => {
        return rpc.call('eth_sendRawTransaction', [signedTx]);
    },
};

export default api;
