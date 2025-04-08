import { getDefaultWallets } from '@rainbow-me/rainbowkit'
import { configureChains, createConfig } from 'wagmi'
import { baseGoerli } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'

// 체인 및 프로바이더 설정
const { chains, publicClient } = configureChains(
  [baseGoerli],
  [publicProvider()]
)

// 지갑 커넥터 설정
const { connectors } = getDefaultWallets({
  appName: 'Fundit',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains,
})

// Wagmi 설정
export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
})

export { chains } 