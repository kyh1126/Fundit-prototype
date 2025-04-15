export interface Proposal {
  id: bigint
  proposer: `0x${string}`
  title: string
  description: string
  premium: bigint
  coverage: bigint
  duration: bigint
  isActive: boolean
  hasContract: boolean
}

export interface ProposalFilter {
  minPremium?: number
  maxPremium?: number
  minCoverage?: number
  maxCoverage?: number
  minDuration?: number
  maxDuration?: number
  status?: 'active' | 'all'
} 