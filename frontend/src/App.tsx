import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'
import { config } from './wagmi'
import { Nav, Footer, PageWrapper } from './components/Layout'

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
                <Route path="/" element={<div>Home</div>} />
                <Route path="/escrows" element={<div>Escrows</div>} />
                <Route path="/escrows/:address" element={<div>Escrow Detail</div>} />
                <Route path="/create" element={<div>Create</div>} />
              </Routes>
            </PageWrapper>
            <Footer />
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
