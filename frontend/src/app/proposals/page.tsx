'use client'

import { ProposalFilter } from '@/components/proposals/ProposalFilter'
import { ProposalList } from '@/components/proposals/ProposalList'
import Link from 'next/link'
import { PlusIcon } from '@heroicons/react/24/outline'

export default function ProposalsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">보험 제안 목록</h1>
              <p className="mt-2 text-gray-600">새로운 보험 상품을 제안하거나 기존 제안을 확인하세요</p>
            </div>
            <Link
              href="/proposals/new"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              새 보험 제안하기
            </Link>
          </div>
        </div>

        {/* Filter Section */}
        <div className="mb-8">
          <ProposalFilter />
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <ProposalList />
        </div>
      </div>
    </div>
  )
} 