'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import { usePublicClient } from 'wagmi'
import Link from 'next/link'
import { formatEther } from 'viem'

// 정렬 필드 타입 정의
type SortField = 'premium' | 'coverage' | 'duration' | 'createdAt'
type SortOrder = 'asc' | 'desc'

// 필터 타입 정의
interface Filter {
  minPremium?: number
  maxPremium?: number
  minCoverage?: number
  maxCoverage?: number
  minDuration?: number
  maxDuration?: number
  status?: 'active' | 'all'
}

export default function ProposalsPage() {
  const store = useStore()
  const { proposals, loading, error, fetchProposals } = store
  const publicClient = usePublicClient()
  
  // 필터 상태 관리
  const [filters, setFilters] = useState<Filter>({
    status: 'active'
  })
  
  // 정렬 상태 관리
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  useEffect(() => {
    if (typeof fetchProposals === 'function' && publicClient) {
      fetchProposals(publicClient)
    }
  }, [fetchProposals, publicClient])

  // 정렬 핸들러
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  // 필터 핸들러
  const handleFilterChange = (key: keyof Filter, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // 필터링 및 정렬된 제안 목록
  const filteredAndSortedProposals = (proposals ?? [])
    .filter(proposal => {
      // 상태 필터
      if (filters.status === 'active' && !proposal.isActive) return false
      
      // 보험료 필터
      if (filters.minPremium && Number(formatEther(proposal.premium)) < filters.minPremium) return false
      if (filters.maxPremium && Number(formatEther(proposal.premium)) > filters.maxPremium) return false
      
      // 보장금액 필터
      if (filters.minCoverage && Number(formatEther(proposal.coverage)) < filters.minCoverage) return false
      if (filters.maxCoverage && Number(formatEther(proposal.coverage)) > filters.maxCoverage) return false
      
      // 기간 필터
      if (filters.minDuration && proposal.duration < filters.minDuration) return false
      if (filters.maxDuration && proposal.duration > filters.maxDuration) return false
      
      return true
    })
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1
      
      if (sortField === 'createdAt') {
        return (Number(a.createdAt) - Number(b.createdAt)) * multiplier
      } else if (sortField === 'premium') {
        return (Number(a.premium) - Number(b.premium)) * multiplier
      } else if (sortField === 'coverage') {
        return (Number(a.coverage) - Number(b.coverage)) * multiplier
      } else if (sortField === 'duration') {
        return (a.duration - b.duration) * multiplier
      }
      
      return 0
    })

  if (loading) return <div className="flex justify-center p-8">로딩 중...</div>
  if (error) return <div className="text-red-500 p-8">오류: {error}</div>
  if (!proposals) return <div className="flex justify-center p-8">제안 목록을 불러오는 중...</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">보험 제안 목록</h1>
        <Link
          href="/proposals/new"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          새 제안
        </Link>
      </div>

      {/* 필터 섹션 */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">필터</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 상태 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
            <select
              className="w-full border rounded p-2"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">전체</option>
              <option value="active">진행중</option>
            </select>
          </div>

          {/* 보험료 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">최소 보험료 (ETH)</label>
            <input
              type="number"
              className="w-full border rounded p-2"
              value={filters.minPremium || ''}
              onChange={(e) => handleFilterChange('minPremium', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">최대 보험료 (ETH)</label>
            <input
              type="number"
              className="w-full border rounded p-2"
              value={filters.maxPremium || ''}
              onChange={(e) => handleFilterChange('maxPremium', Number(e.target.value))}
            />
          </div>

          {/* 보장금액 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">최소 보장금액 (ETH)</label>
            <input
              type="number"
              className="w-full border rounded p-2"
              value={filters.minCoverage || ''}
              onChange={(e) => handleFilterChange('minCoverage', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">최대 보장금액 (ETH)</label>
            <input
              type="number"
              className="w-full border rounded p-2"
              value={filters.maxCoverage || ''}
              onChange={(e) => handleFilterChange('maxCoverage', Number(e.target.value))}
            />
          </div>

          {/* 기간 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">최소 기간 (일)</label>
            <input
              type="number"
              className="w-full border rounded p-2"
              value={filters.minDuration || ''}
              onChange={(e) => handleFilterChange('minDuration', Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">최대 기간 (일)</label>
            <input
              type="number"
              className="w-full border rounded p-2"
              value={filters.maxDuration || ''}
              onChange={(e) => handleFilterChange('maxDuration', Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* 정렬 헤더 */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-4 gap-4">
          <div 
            className="cursor-pointer flex items-center"
            onClick={() => handleSort('premium')}
          >
            <span>보험료</span>
            {sortField === 'premium' && (
              <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            className="cursor-pointer flex items-center"
            onClick={() => handleSort('coverage')}
          >
            <span>보장금액</span>
            {sortField === 'coverage' && (
              <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            className="cursor-pointer flex items-center"
            onClick={() => handleSort('duration')}
          >
            <span>기간</span>
            {sortField === 'duration' && (
              <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div 
            className="cursor-pointer flex items-center"
            onClick={() => handleSort('createdAt')}
          >
            <span>생성일</span>
            {sortField === 'createdAt' && (
              <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
        </div>
      </div>

      {/* 제안 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedProposals.map((proposal) => (
          <div key={proposal.id} className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-2">{proposal.title}</h2>
            <p className="text-gray-600 mb-4">{proposal.description}</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">보험료</p>
                <p className="font-medium">{formatEther(proposal.premium)} ETH</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">보장금액</p>
                <p className="font-medium">{formatEther(proposal.coverage)} ETH</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">기간</p>
                <p className="font-medium">{proposal.duration}일</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">상태</p>
                <p className="font-medium">{proposal.isActive ? '진행중' : '종료'}</p>
              </div>
            </div>
            <Link
              href={`/proposals/${proposal.id}`}
              className="block text-center bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              상세 보기
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
} 