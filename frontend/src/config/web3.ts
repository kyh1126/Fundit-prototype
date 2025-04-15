import { getDefaultWallets } from '@rainbow-me/rainbowkit'
import { createConfig, http } from 'wagmi'
import { localhost } from 'wagmi/chains'
import { QueryClient } from '@tanstack/react-query'

const { wallets, connectors } = getDefaultWallets({
  appName: 'Fundit',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [localhost],
})

export const config = createConfig({
  connectors,
  chains: [localhost],
  transports: {
    [localhost.id]: http(),
  },
})

export const queryClient = new QueryClient() 