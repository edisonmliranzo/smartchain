import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

import TokenCreate from './pages/TokenCreate';
import AIContract from './pages/AIContract';
import Staking from './pages/Staking';
import Portfolio from './pages/Portfolio';

function App() {
  return (
    <Web3Provider>
      <Router>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
          <Navbar />
          <main style={{ flex: 1, position: 'relative' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/blocks" element={<Blocks />} />
              <Route path="/create-token" element={<TokenCreate />} />
              <Route path="/ai-contract" element={<AIContract />} />
              <Route path="/staking" element={<Staking />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/block/:identifier" element={<BlockDetail />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/tx/:hash" element={<TransactionDetail />} />
              <Route path="/address/:address" element={<Address />} />
              <Route path="/validators" element={<Validators />} />
              <Route path="/faucet" element={<Faucet />} />
            </Routes>
          </main>
        </div>
      </Router>
    </Web3Provider>
  );
}

export default App;
