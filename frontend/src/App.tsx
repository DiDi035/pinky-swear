import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { config } from './wagmi'
import { Nav, Footer, PageWrapper } from './components/Layout'
import Home from './pages/Home'
import EscrowList from './pages/EscrowList'
import EscrowDetail from './pages/EscrowDetail'
import CreateEscrow from './pages/CreateEscrow'

const queryClient = new QueryClient()

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <BrowserRouter>
            <Nav />
            <PageWrapper>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/escrows" element={<EscrowList />} />
                <Route path="/escrows/:address" element={<EscrowDetail />} />
                <Route path="/create" element={<CreateEscrow />} />
              </Routes>
            </PageWrapper>
            <Footer />
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
