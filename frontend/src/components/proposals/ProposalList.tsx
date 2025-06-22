'use client'

import { useStore } from '@/store/useStore'
import { formatEther } from 'viem'
import { useAccount } from 'wagmi'
import { Proposal } from '@/types/proposal'
import Link from 'next/link'
import { ClockIcon, CurrencyDollarIcon, ShieldCheckIcon, UserIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

interface ProposalCardProps {
  proposal: Proposal
  isCurrentUser: boolean
}

const ProposalCard = ({ proposal, isCurrentUser }: ProposalCardProps) => (
  <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-lg">
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{proposal.title}</h3>
          <p className="text-sm text-gray-500 mt-1">제안자: {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}</p>
        </div>
        <span className={`ml-3 px-3 py-1 text-xs font-medium rounded-full ${
          proposal.isActive 
            ? 'bg-green-100 text-green-800' 
            : proposal.hasContract 
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {proposal.isActive ? '진행중' : proposal.hasContract ? '계약체결' : '종료'}
        </span>
      </div>
      
      {/* Description */}
      <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed">{proposal.description}</p>
      
      {/* Details */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center text-gray-500">
            <CurrencyDollarIcon className="w-4 h-4 mr-2" />
            <span className="text-sm">보험료</span>
          </div>
          <span className="font-semibold text-gray-900">{formatEther(proposal.premium)} ETH</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center text-gray-500">
            <ShieldCheckIcon className="w-4 h-4 mr-2" />
            <span className="text-sm">보장금액</span>
          </div>
          <span className="font-semibold text-gray-900">{formatEther(proposal.coverage)} ETH</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center text-gray-500">
            <ClockIcon className="w-4 h-4 mr-2" />
            <span className="text-sm">보장기간</span>
          </div>
          <span className="font-semibold text-gray-900">{proposal.duration}일</span>
        </div>
      </div>

      {/* User Badge */}
      {isCurrentUser && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center text-blue-700">
            <UserIcon className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">내가 제안한 보험</span>
          </div>
        </div>
      )}

      {/* Action Button */}
      <Link
        href={`/proposals/${proposal.id}`}
        className="block w-full text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
      >
        <span className="flex items-center justify-center">
          상세보기
          <ArrowRightIcon className="w-4 h-4 ml-2" />
        </span>
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">제안 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-500 mb-2">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">오류가 발생했습니다</h3>
        <p className="text-gray-600">{error}</p>
      </div>
    )
  }

  if (!proposals?.length) {
    return (
      <div className="text-center p-8">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">제안된 보험이 없습니다</h3>
        <p className="text-gray-600 mb-6">첫 번째 보험 제안을 시작해보세요!</p>
        <Link
          href="/proposals/new"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
        >
          새 보험 제안하기
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {proposals.map((proposal) => (
          <ProposalCard
            key={proposal.id.toString()}
            proposal={proposal}
            isCurrentUser={proposal.proposer === address}
          />
        ))}
      </div>
    </div>
  )
} 