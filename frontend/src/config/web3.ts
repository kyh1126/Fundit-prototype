import { getDefaultWallets } from '@rainbow-me/rainbowkit'
import { configureChains, createConfig } from 'wagmi'
import { baseGoerli } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'

const { chains, publicClient } = configureChains(
  [baseGoerli],
  [publicProvider()]
)

const { connectors } = getDefaultWallets({
  appName: 'Fundit',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains,
})

export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
})

export { chains } 