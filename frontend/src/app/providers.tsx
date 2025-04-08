'use client'

import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiConfig } from 'wagmi'
import { chains, wagmiConfig } from '@/config/web3'

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  )
} 