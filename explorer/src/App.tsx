import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Blocks from './pages/Blocks';
import TransactionDetail from './pages/TransactionDetail';
import Transactions from './pages/Transactions';
import BlockDetail from './pages/BlockDetail';
import Address from './pages/Address';
import Faucet from './pages/Faucet';
import Validators from './pages/Validators';
import { Web3Provider } from './contexts/Web3Context';
import { ThemeProvider } from './contexts/ThemeContext';
import { CreditsProvider } from './contexts/CreditsContext';

import TokenCreate from './pages/TokenCreate';
import AIContract from './pages/AIContract';
import Staking from './pages/Staking';
import Portfolio from './pages/Portfolio';
import ContractInteract from './pages/ContractInteract';
import ValidatorList from './pages/ValidatorList';
import Graffiti from './pages/Graffiti';
import Network from './pages/Network';
import ChainChat from './pages/ChainChat';
import Whitepaper from './pages/Whitepaper';
import Swap from './pages/Swap';
import NFTStudio from './pages/NFTStudio';
import Analytics from './pages/Analytics';
import Lottery from './pages/Lottery';
import Leaderboard from './pages/Leaderboard';
import Bridge from './pages/Bridge';
import Credits from './pages/Credits';

// New features
import NodeDashboard from './pages/NodeDashboard';
import RewardsCalculator from './pages/RewardsCalculator';
import NetworkStatus from './pages/NetworkStatus';
import WhaleTracker from './pages/WhaleTracker';
import TokenAnalytics from './pages/TokenAnalytics';
import DeFiDashboard from './pages/DeFiDashboard';
import PortfolioTracker from './pages/PortfolioTracker';
import GasTracker from './pages/GasTracker';
import ContractIDE from './pages/ContractIDE';

function App() {
  return (
    <ThemeProvider>
      <Web3Provider>
        <CreditsProvider>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="blob blob-1"></div>
            <div className="blob blob-2"></div>
            <div className="blob blob-3"></div>
            <Navbar />
            <main style={{ flex: 1, position: 'relative' }}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/blocks" element={<Blocks />} />
                <Route path="/network" element={<Network />} />
                <Route path="/chat" element={<ChainChat />} />
                <Route path="/create-token" element={<TokenCreate />} />
                <Route path="/ai-contract" element={<AIContract />} />
                <Route path="/staking" element={<Staking />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/block/:identifier" element={<BlockDetail />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/tx/:hash" element={<TransactionDetail />} />
                <Route path="/address/:address" element={<Address />} />
                <Route path="/validators" element={<Validators />} />
                <Route path="/validator-staking" element={<ValidatorList />} />
                <Route path="/faucet" element={<Faucet />} />
                <Route path="/graffiti" element={<Graffiti />} />
                <Route path="/contract" element={<ContractInteract />} />
                <Route path="/whitepaper" element={<Whitepaper />} />
                <Route path="/swap" element={<Swap />} />
                <Route path="/nft-studio" element={<NFTStudio />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/lottery" element={<Lottery />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/bridge" element={<Bridge />} />
                <Route path="/credits" element={<Credits />} />
                {/* New Features */}
                <Route path="/node-dashboard" element={<NodeDashboard />} />
                <Route path="/rewards-calculator" element={<RewardsCalculator />} />
                <Route path="/network-status" element={<NetworkStatus />} />
                <Route path="/whale-tracker" element={<WhaleTracker />} />
                <Route path="/token-analytics" element={<TokenAnalytics />} />
                <Route path="/defi-dashboard" element={<DeFiDashboard />} />
                <Route path="/portfolio-tracker" element={<PortfolioTracker />} />
                <Route path="/gas-tracker" element={<GasTracker />} />
                <Route path="/contract-ide" element={<ContractIDE />} />
              </Routes>
            </main>
          </div>
        </CreditsProvider>
      </Web3Provider>
    </ThemeProvider>
  );
}

export default App;

