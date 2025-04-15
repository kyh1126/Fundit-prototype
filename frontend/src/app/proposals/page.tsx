'use client'

import { ProposalFilter } from '@/components/proposals/ProposalFilter'
import { ProposalList } from '@/components/proposals/ProposalList'
import Link from 'next/link'

export default function ProposalsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">보험 제안 목록</h1>
        <Link
          href="/proposals/new"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-center"
        >
          새 보험 제안하기
        </Link>
      </div>

      <div className="mb-8">
        <ProposalFilter />
      </div>

      <ProposalList />
    </div>
  )
} 