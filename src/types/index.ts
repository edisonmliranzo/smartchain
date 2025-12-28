// SmartChain Types - Core type definitions for the blockchain

export interface BlockHeader {
  number: number;
  timestamp: number;
  parentHash: string;
  stateRoot: string;
  transactionsRoot: string;
  receiptsRoot: string;
  miner: string;
  difficulty: bigint;
  gasLimit: bigint;
  gasUsed: bigint;
  extraData: string;
  nonce: string;
  mixHash: string;
}

export interface Block {
  header: BlockHeader;
  transactions: Transaction[];
  hash: string;
  size: number;
}

export interface Transaction {
  hash: string;
  nonce: number;
  from: string;
  to: string | null;
  value: bigint;
  gasPrice: bigint;
  gasLimit: bigint;
  data: string;
  v: number;
  r: string;
  s: string;
  blockHash?: string;
  blockNumber?: number;
  transactionIndex?: number;
}

export interface TransactionReceipt {
  transactionHash: string;
  transactionIndex: number;
  blockHash: string;
  blockNumber: number;
  from: string;
  to: string | null;
  contractAddress: string | null;
  cumulativeGasUsed: bigint;
  gasUsed: bigint;
  logs: Log[];
  logsBloom: string;
  status: number; // 1 = success, 0 = failure
}

export interface Log {
  address: string;
  topics: string[];
  data: string;
  blockNumber: number;
  transactionHash: string;
  transactionIndex: number;
  blockHash: string;
  logIndex: number;
  removed: boolean;
}

export interface Account {
  address: string;
  balance: bigint;
  nonce: number;
  codeHash: string;
  storageRoot: string;
}

export interface SignedTransaction {
  rawTransaction: string;
  hash: string;
  from: string;
  to: string | null;
  value: bigint;
  gasPrice: bigint;
  gasLimit: bigint;
  nonce: number;
  data: string;
}

export interface PendingTransaction extends Transaction {
  addedAt: number;
}

export interface Peer {
  id: string;
  address: string;
  port: number;
  lastSeen: number;
  latency: number;
}

export interface ChainConfig {
  chainId: number;
  chainName: string;
  symbol: string;
  blockTime: number; // in milliseconds
  blockGasLimit: bigint;
  genesisBlock: Block;
  validators: string[];
  premine: { [address: string]: bigint };
}

export interface SyncStatus {
  syncing: boolean;
  startingBlock: number;
  currentBlock: number;
  highestBlock: number;
}

export interface NodeInfo {
  id: string;
  name: string;
  version: string;
  chainId: number;
  networkId: number;
  peers: number;
  currentBlock: number;
  pendingTransactions: number;
  isValidator: boolean;
  isMining: boolean;
}

export interface RPCRequest {
  jsonrpc: string;
  method: string;
  params: any[];
  id: number | string;
}

export interface RPCResponse {
  jsonrpc: string;
  result?: any;
  error?: RPCError;
  id: number | string;
}

export interface RPCError {
  code: number;
  message: string;
  data?: any;
}

// EVM Related Types
export interface EVMResult {
  success: boolean;
  gasUsed: bigint;
  returnValue: Buffer;
  logs: Log[];
  createdAddress?: string;
  exceptionError?: string;
}

export interface ContractCode {
  address: string;
  code: string;
  codeHash: string;
}

export interface StorageEntry {
  key: string;
  value: string;
}

// Websocket Event Types
export type EventType = 
  | 'newBlock'
  | 'newTransaction'
  | 'pendingTransaction'
  | 'chainReorg'
  | 'syncStatus';

export interface BlockchainEvent {
  type: EventType;
  data: any;
  timestamp: number;
}

// Mining/Validator Types
export interface ValidatorInfo {
  address: string;
  isActive: boolean;
  blocksProduced: number;
  lastBlockTime: number;
  reputation: number;
}

export interface MiningStats {
  blocksProduced: number;
  transactionsProcessed: number;
  totalGasUsed: bigint;
  averageBlockTime: number;
  hashRate: number;
}
