'use client'

import { useState } from 'react'
import { ProposalFilter as FilterType } from '@/types/proposal'
import { ChevronDownIcon, ChevronUpIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface FilterInputProps {
  label: string
  value: number | undefined
  onChange: (value: number) => void
  unit?: string
  placeholder?: string
}

const FilterInput = ({ label, value, onChange, unit, placeholder }: FilterInputProps) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">
      {label} {unit && <span className="text-gray-500">({unit})</span>}
    </label>
    <input
      type="number"
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      value={value || ''}
      onChange={(e) => onChange(Number(e.target.value))}
      placeholder={placeholder || `0`}
      min={0}
    />
  </div>
)

export function ProposalFilter() {
  const [filters, setFilters] = useState<FilterType>({
    status: 'all'
  })
  const [isExpanded, setIsExpanded] = useState(false)
  const [hasActiveFilters, setHasActiveFilters] = useState(false)

  const handleFilterChange = (key: keyof FilterType, value: any) => {
    const newFilters = {
      ...filters,
      [key]: value
    }
    setFilters(newFilters)
    
    // 활성 필터가 있는지 확인
    const hasFilters = Object.values(newFilters).some(val => 
      val !== undefined && val !== 'all' && val !== ''
    )
    setHasActiveFilters(hasFilters)
  }

  const clearFilters = () => {
    setFilters({ status: 'all' })
    setHasActiveFilters(false)
  }

  const activeFilterCount = Object.values(filters).filter(val => 
    val !== undefined && val !== 'all' && val !== ''
  ).length

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
      {/* Filter Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FunnelIcon className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">필터</h2>
            {hasActiveFilters && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {activeFilterCount}개 적용됨
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <XMarkIcon className="w-4 h-4 mr-1" />
                초기화
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUpIcon className="w-4 h-4 mr-1" />
                  접기
                </>
              ) : (
                <>
                  <ChevronDownIcon className="w-4 h-4 mr-1" />
                  펼치기
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Status Filter */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">상태</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="all">전체</option>
                <option value="active">진행중</option>
                <option value="completed">완료</option>
                <option value="expired">만료</option>
              </select>
            </div>

            {/* Premium Range */}
            <FilterInput
              label="최소 보험료"
              value={filters.minPremium}
              onChange={(value) => handleFilterChange('minPremium', value)}
              unit="ETH"
              placeholder="0.01"
            />

            <FilterInput
              label="최대 보험료"
              value={filters.maxPremium}
              onChange={(value) => handleFilterChange('maxPremium', value)}
              unit="ETH"
              placeholder="10.0"
            />

            {/* Coverage Range */}
            <FilterInput
              label="최소 보장금액"
              value={filters.minCoverage}
              onChange={(value) => handleFilterChange('minCoverage', value)}
              unit="ETH"
              placeholder="1.0"
            />

            <FilterInput
              label="최대 보장금액"
              value={filters.maxCoverage}
              onChange={(value) => handleFilterChange('maxCoverage', value)}
              unit="ETH"
              placeholder="100.0"
            />

            {/* Duration Range */}
            <FilterInput
              label="최소 기간"
              value={filters.minDuration}
              onChange={(value) => handleFilterChange('minDuration', value)}
              unit="일"
              placeholder="30"
            />

            <FilterInput
              label="최대 기간"
              value={filters.maxDuration}
              onChange={(value) => handleFilterChange('maxDuration', value)}
              unit="일"
              placeholder="365"
            />
          </div>

          {/* Quick Filter Buttons */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-3">빠른 필터</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setFilters({ ...filters, minPremium: 0.1, maxPremium: 1.0 })
                  setHasActiveFilters(true)
                }}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                보험료 0.1-1.0 ETH
              </button>
              <button
                onClick={() => {
                  setFilters({ ...filters, minCoverage: 10, maxCoverage: 50 })
                  setHasActiveFilters(true)
                }}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                보장금액 10-50 ETH
              </button>
              <button
                onClick={() => {
                  setFilters({ ...filters, minDuration: 30, maxDuration: 90 })
                  setHasActiveFilters(true)
                }}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                기간 30-90일
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 