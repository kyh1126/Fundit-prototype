'use client'

import { create } from 'zustand'
import { PublicClient, WalletClient } from 'viem'
import { useWalletClient } from 'wagmi'
import { FUNDIT_ABI } from '@/contracts/abi'

interface Proposal {
  id: number
  title: string
  description: string
  premium: bigint
  coverage: bigint
  duration: number
  proposer: string
  isActive: boolean
  createdAt: bigint
}

interface StoreState {
  proposals: Proposal[]
  loading: boolean
  error: string | null
  publicClient: PublicClient | null
  walletClient: WalletClient | null
  fetchProposals: (publicClient: PublicClient) => Promise<void>
}

export const useStore = create<StoreState>((set, get) => ({
  proposals: [],
  loading: false,
  error: null,
  publicClient: null,
  walletClient: null,

  fetchProposals: async (publicClient: PublicClient) => {
    if (!publicClient) {
      set({ error: 'Public client not initialized' })
      return
    }

    set({ loading: true, error: null })
    try {
      const contractAddress = process.env.NEXT_PUBLIC_FUNDIT_CONTRACT_ADDRESS
      if (!contractAddress) {
        throw new Error('Contract address not configured')
      }

      // 컨트랙트 호출 전 상태 확인
      const chainId = await publicClient.getChainId()
      console.log('Current chain ID:', chainId)

      const proposalCount = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: FUNDIT_ABI,
        functionName: 'getProposalCount',
      }) as bigint

      console.log('Proposal count:', proposalCount.toString())

      const proposals: Proposal[] = []
      for (let i = 0; i < Number(proposalCount); i++) {
        try {
          const proposal = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: FUNDIT_ABI,
            functionName: 'getProposal',
            args: [BigInt(i)]
          }) as any

          proposals.push({
            id: i,
            ...proposal
          })
        } catch (error) {
          console.error(`Error fetching proposal ${i}:`, error)
          // 개별 제안 fetch 실패는 전체 실패로 처리하지 않음
          continue
        }
      }

      set({ proposals, loading: false })
    } catch (error) {
      console.error('Error fetching proposals:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch proposals', 
        loading: false 
      })
    }
  }
})) 