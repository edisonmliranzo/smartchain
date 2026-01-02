import Network from './pages/Network';
import ChainChat from './pages/ChainChat';

// ... imports

function App() {
  return (
    <ThemeProvider>
      <Web3Provider>
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
            </Routes>
          </main>
        </div>
      </Web3Provider>
    </ThemeProvider>
  );
}

export default App;

