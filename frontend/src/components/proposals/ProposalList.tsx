'use client'

import { useStore } from '@/store/useStore'
import { formatEther } from 'viem'
import { useAccount } from 'wagmi'
import { Proposal } from '@/types/proposal'
import Link from 'next/link'

interface ProposalCardProps {
  proposal: Proposal
  isCurrentUser: boolean
}

const ProposalCard = ({ proposal, isCurrentUser }: ProposalCardProps) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-lg font-semibold">{proposal.title}</h3>
      <span className={`px-2 py-1 text-sm rounded ${
        proposal.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
      }`}>
        {proposal.isActive ? '진행중' : '종료'}
      </span>
    </div>
    
    <p className="text-gray-600 mb-4 line-clamp-2">{proposal.description}</p>
    
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-gray-500">보험료</span>
        <span className="font-medium">{formatEther(proposal.premium)} ETH</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">보장금액</span>
        <span className="font-medium">{formatEther(proposal.coverage)} ETH</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-500">보장기간</span>
        <span className="font-medium">{proposal.duration} 일</span>
      </div>
    </div>

    {isCurrentUser && (
      <div className="mt-4 pt-4 border-t">
        <span className="text-sm text-blue-600">내가 제안한 보험</span>
      </div>
    )}

    <div className="mt-4">
      <Link
        href={`/proposals/${proposal.id}`}
        className="block w-full text-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
      >
        상세보기
      </Link>
    </div>
  </div>
)

export function ProposalList() {
  const { proposals, loading, error } = useStore()
  const { address } = useAccount()

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        오류가 발생했습니다: {error}
      </div>
    )
  }

  if (!proposals?.length) {
    return (
      <div className="text-center text-gray-500 p-4">
        제안된 보험이 없습니다.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {proposals.map((proposal) => (
        <ProposalCard
          key={proposal.id.toString()}
          proposal={proposal}
          isCurrentUser={proposal.proposer === address}
        />
      ))}
    </div>
  )
} 