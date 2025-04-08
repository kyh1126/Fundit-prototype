import { create } from 'zustand'
import { usePublicClient, useWalletClient } from 'wagmi'
import { FUNDIT_ABI } from '@/contracts/abi'

type ContractProposal = {
  title: string
  description: string
  premium: bigint
  coverage: bigint
  duration: bigint
  proposer: `0x${string}`
  isActive: boolean
  createdAt: bigint
}

export interface Bid {
  bidder: string;
  amount: bigint;
  timestamp: number;
}

interface Proposal {
  id: number
  title: string
  description: string
  premium: bigint
  coverage: bigint
  duration: number
  proposer: string
  status: string
  bids: Bid[]
}

type Store = {
  proposals: Proposal[]
  loading: boolean
  error: string | null
  fetchProposals: () => Promise<void>
  createProposal: (title: string, description: string, premium: bigint, coverage: bigint, duration: number) => Promise<void>
}

export const useStore = create<Store>((set, get) => {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  return {
    proposals: [],
    loading: false,
    error: null,

    fetchProposals: async () => {
      if (!publicClient) throw new Error('Public client not initialized')
      set({ loading: true, error: null })
      try {
        const contractAddress = process.env.NEXT_PUBLIC_FUNDIT_CONTRACT_ADDRESS as `0x${string}`
        const proposalCount = await publicClient.readContract({
          address: contractAddress,
          abi: FUNDIT_ABI,
          functionName: 'getProposalCount',
        })

        const proposals: Proposal[] = []
        for (let i = 0; i < Number(proposalCount); i++) {
          const proposal = await publicClient.readContract({
            address: contractAddress,
            abi: FUNDIT_ABI,
            functionName: 'getProposal',
            args: [BigInt(i)],
          }) as ContractProposal

          proposals.push({
            id: i,
            title: proposal.title,
            description: proposal.description,
            premium: proposal.premium,
            coverage: proposal.coverage,
            duration: Number(proposal.duration),
            proposer: proposal.proposer,
            status: proposal.isActive ? 'Active' : 'Inactive',
            bids: [],
          })
        }
        set({ proposals, loading: false })
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to fetch proposals', loading: false })
      }
    },

    createProposal: async (title: string, description: string, premium: bigint, coverage: bigint, duration: number) => {
      if (!walletClient) throw new Error('Wallet not connected')
      if (!publicClient) throw new Error('Public client not initialized')
      set({ loading: true, error: null })
      try {
        const contractAddress = process.env.NEXT_PUBLIC_FUNDIT_CONTRACT_ADDRESS as `0x${string}`
        const hash = await walletClient.writeContract({
          address: contractAddress,
          abi: FUNDIT_ABI,
          functionName: 'proposeInsurance',
          args: [title, description, premium, coverage, BigInt(duration)],
        })
        await publicClient.waitForTransactionReceipt({ hash })
        await get().fetchProposals()
        set({ loading: false })
      } catch (error) {
        set({ error: error instanceof Error ? error.message : 'Failed to create proposal', loading: false })
      }
    },
  }
}) 