'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
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
  const { proposals, loading, error, fetchProposals } = useStore()
  
  // 필터 상태 관리
  const [filters, setFilters] = useState<Filter>({
    status: 'active'
  })
  
  // 정렬 상태 관리
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  useEffect(() => {
    fetchProposals()
  }, [fetchProposals])

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
  const filteredAndSortedProposals = proposals
    .filter(proposal => {
      // 상태 필터
      if (filters.status === 'active' && !proposal.isActive) return false
      
      // 보험료 필터
      if (filters.minPremium && Number(proposal.premium) < filters.minPremium) return false
      if (filters.maxPremium && Number(proposal.premium) > filters.maxPremium) return false
      
      // 보장금액 필터
      if (filters.minCoverage && Number(proposal.coverage) < filters.minCoverage) return false
      if (filters.maxCoverage && Number(proposal.coverage) > filters.maxCoverage) return false
      
      // 기간 필터
      if (filters.minDuration && Number(proposal.duration) < filters.minDuration) return false
      if (filters.maxDuration && Number(proposal.duration) > filters.maxDuration) return false
      
      return true
    })
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1
      if (sortField === 'createdAt') {
        return (Number(a.createdAt) - Number(b.createdAt)) * multiplier
      }
      return (Number(a[sortField]) - Number(b[sortField])) * multiplier
    })

  if (loading) return <div className="flex justify-center p-8">Loading...</div>
  if (error) return <div className="text-red-500 p-8">Error: {error}</div>

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

      {/* 제안 목록 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                제목
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('premium')}
              >
                보험료 (ETH) {sortField === 'premium' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('coverage')}
              >
                보장금액 (ETH) {sortField === 'coverage' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('duration')}
              >
                기간 (일) {sortField === 'duration' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('createdAt')}
              >
                생성일 {sortField === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                작업
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedProposals.map((proposal) => (
              <tr key={proposal.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{proposal.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{proposal.premium} ETH</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{proposal.coverage} ETH</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{proposal.duration}일</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(proposal.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    proposal.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {proposal.isActive ? '진행중' : '종료'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link
                    href={`/proposals/${proposal.id}`}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    상세보기
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 